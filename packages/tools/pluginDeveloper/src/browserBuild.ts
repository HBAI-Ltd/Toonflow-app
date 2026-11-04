import { createHash } from "node:crypto";
import { createRequire, isBuiltin } from "node:module";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { readFile, readFileSync, realpath, realpathSync, statSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { babelParse, compileScript, compileStyle, compileTemplate, parse, registerTS } from "vue/compiler-sfc";
import pxtorem from "postcss-pxtorem";
import type { Loader } from "bun";
import type { PluginManifest } from "./runtime";

function isWithin(directory: string, path: string) {
  const offset = relative(directory, path);
  return offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset);
}

function validateStyle(source: string) {
  if (source.includes("\\") || /sourceMappingURL/i.test(source)
    || /@import\b|(?:url|image-set)\s*\(/i.test(source.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    throw new Error("插件样式仅支持无文件引用和转义的 CSS；请在脚本中 import 资源后绑定到模板");
  }
}

function visitNodes(value: unknown, visit: (node: Record<string, unknown>) => void) {
  const pending: unknown[] = [value];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) { pending.push(...value); continue; }
    const node = value as Record<string, unknown>;
    visit(node);
    pending.push(...Object.values(node));
  }
}

export function validateImports(source: string, filename: string) {
  const ast = babelParse(source, {
    sourceType: "unambiguous", createImportExpressions: true,
    plugins: filename.endsWith("x") ? ["jsx", "typescript", "deprecatedImportAssert"] : ["typescript", "deprecatedImportAssert"],
  });
  visitNodes(ast.program, node => {
    if ((Array.isArray(node.attributes) && node.attributes.length) || (Array.isArray(node.assertions) && node.assertions.length)) {
      throw new Error("插件源码不支持构建时导入属性或自定义 loader");
    }
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(String(node.type)) && node.source) {
      const imported = node.source as { value?: string; end: number };
      const clause = source.slice(imported.end, node.end as number).replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, "").trim();
      // Babel 为空 with {} 和普通 import 都生成 attributes: []，须核对原始子句。
      if (/^(?:with|assert)\b/.test(clause)) throw new Error("插件源码不支持构建时导入属性或自定义 loader");
      if (imported.value?.startsWith("macro:")) throw new Error("插件源码不支持 Bun 宏");
    }
    if (node.type === "ImportExpression") {
      if (node.options) throw new Error("插件源码不支持构建时导入属性或自定义 loader");
      if ((node.source as { value?: string }).value?.startsWith("macro:")) throw new Error("插件源码不支持 Bun 宏");
    }
    const callee = node.callee as { type?: string; name?: string; property?: { name?: string; value?: string } } | undefined;
    if (node.type === "CallExpression" && (callee?.type === "Import" || (callee?.type === "Identifier" && callee.name === "require")
      || (callee?.type === "MemberExpression" && (callee.property?.name === "require" || callee.property?.value === "require")))) {
      const args = node.arguments as { value?: unknown }[];
      if (args.length > 1) throw new Error("插件源码不支持构建时导入属性或自定义 loader");
      if (String(args[0]?.value).startsWith("macro:")) throw new Error("插件源码不支持 Bun 宏");
    }
    if (node.type === "TSExternalModuleReference" && (node.expression as { value?: string })?.value?.startsWith("macro:")) throw new Error("插件源码不支持 Bun 宏");
  });
  return ast;
}

function validateScript(source: string, filename: string) {
  if (/\bimport\s*[./]/.test(source)) throw new Error("插件前端请使用静态 import 引入资源，不支持 import.meta 或 import 与模块名之间的注释");
  const ast = validateImports(source, filename);
  visitNodes(ast.program, node => {
    if (node.type === "MetaProperty" && (node.meta as { name?: string } | undefined)?.name === "import") throw new Error("插件源码不支持 import.meta");
    if (node.type === "ImportExpression" && (node.source as { type?: string })?.type !== "StringLiteral") throw new Error("插件只支持可静态解析的模块路径");
    const callee = node.callee as { type?: string; name?: string; property?: { name?: string; value?: string } } | undefined;
    if (node.type === "CallExpression" && (callee?.type === "Import" || (callee?.type === "Identifier" && callee.name === "require")
      || (callee?.type === "MemberExpression" && (callee.property?.name === "require" || callee.property?.value === "require")))) {
      const args = node.arguments as { type?: string }[];
      if (args.length !== 1 || args[0]?.type !== "StringLiteral") throw new Error("插件只支持可静态解析的模块路径");
    }
  });
}

export async function buildBrowser(root: string, sdkModules: string, manifest: PluginManifest): Promise<{ code: string; css: string }> {
  if (manifest.type === "tool" && !Object.keys(manifest.components ?? {}).length) return { code: "", css: "" };
  root = await realpath(root);
  sdkModules = await realpath(sdkModules);
  const registry = JSON.parse(await readFile(join(dirname(sdkModules), "browserGlobals.json"), "utf8")) as {
    node: Record<string, string>;
    tool: Record<string, string>;
    sdkExports?: string[];
  };
  if (!registry.node || !registry.tool || typeof registry.node !== "object" || typeof registry.tool !== "object") throw new Error("内置 SDK 缺少浏览器宿主映射");
  const globals = manifest.type === "node" ? registry.node : registry.tool;
  for (const global of Object.values(globals)) {
    if (typeof global !== "string" || !/^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/.test(global)) throw new Error("内置 SDK 浏览器宿主映射无效");
  }
  const packageName = (source: string) => source.startsWith("@") ? source.split("/").slice(0, 2).join("/") : source.split("/")[0]!;
  const supportedPackages = new Set([
    "@toonflow/nodes-scaffold", "@toonflow/tools-scaffold", "@toonflow/node-shared", "@toonflow/asr", "@toonflow/ffmpeg", "@toonflow/file",
    "@tabler/icons-vue", "@form-create/element-ui", "vue-draggable-plus", "x-sender", "eventsource-parser", "zod",
    ...Object.keys(registry.node).map(packageName), ...Object.keys(registry.tool).map(packageName),
  ]);
  const styles = new Map<string, string>();
  const failures: Error[] = [];
  const entryId = "toonflow:browserEntry";

  function missingDependency(source: string) {
    return Object.assign(new Error(`SDK_DEPENDENCY_MISSING: 内置 SDK 未包含依赖：${source}`), { code: "SDK_DEPENDENCY_MISSING" });
  }

  async function allowedPath(path: string) {
    const actual = await realpath(path);
    if (!isWithin(root, actual) && !isWithin(sdkModules, actual)) throw new Error(`插件只能引用项目源码或内置 SDK：${path}`);
    return actual;
  }

  function typeFile(path: string) {
    if (!isWithin(root, path) && !isWithin(sdkModules, path)) return;
    if (!statSync(path, { throwIfNoEntry: false })?.isFile()) return;
    const actual = realpathSync(path);
    return isWithin(root, actual) || isWithin(sdkModules, actual) ? actual : undefined;
  }

  const typeFiles = {
    fileExists: (path: string) => Boolean(typeFile(path)),
    readFile(path: string) { const file = typeFile(path); return file ? readFileSync(file, "utf8") : undefined; },
    realpath(path: string) { const file = typeFile(path); if (!file) throw new Error("类型文件不在插件项目或 SDK 内"); return file; },
  };

  registerTS(() => {
    const path = Bun.resolveSync("typescript", sdkModules);
    const actual = realpathSync(path);
    if (!isWithin(sdkModules, actual)) throw new Error("TypeScript 编译器必须位于内置 SDK 中");
    const ts = createRequire(join(dirname(sdkModules), "package.json"))(actual);
    // ACT: Vue 只需配置中的模块解析选项，不做项目类型检查；不扫描 include 目录。
    return { ...ts, sys: { ...ts.sys, ...typeFiles, readDirectory: () => [] } };
  });

  function css(source: string, filename: string, id: string, scoped = false) {
    const result = compileStyle({
      source, filename, id, scoped, isProd: true,
      postcssPlugins: [pxtorem({ rootValue: 16, propList: ["*font*", "*line-height*", "letter-spacing", "word-spacing"], exclude: () => false })],
    });
    if (result.errors.length) throw result.errors[0];
    return result.code;
  }

  function vue(source: string, filename: string) {
    const { descriptor, errors } = parse(source, { filename, sourceMap: false });
    if (errors.length) throw errors[0];
    if (descriptor.customBlocks.length || descriptor.template?.src || descriptor.template?.lang
      || descriptor.script?.src || descriptor.scriptSetup?.src) throw new Error("插件 Vue 组件仅支持内联模板、脚本和样式");
    for (const script of [descriptor.script, descriptor.scriptSetup]) {
      if (!script) continue;
      if (script.lang && !["js", "ts", "jsx", "tsx"].includes(script.lang)) throw new Error("插件组件脚本仅支持 JavaScript 和 TypeScript");
      if (isWithin(root, filename)) validateScript(script.content, `${filename}.${script.lang ?? "js"}`);
    }
    const hash = createHash("sha256").update(relative(root, filename)).update(source).digest("hex").slice(0, 12);
    const scopeId = `data-v-${hash}`;
    const component = `__toonflowComponent${hash}`;
    const scoped = descriptor.styles.some(style => style.scoped);
    for (const [index, style] of descriptor.styles.entries()) {
      if (style.src || style.module || (style.lang && style.lang !== "css")) throw new Error("插件组件的 style 仅支持内联普通 CSS");
      if (isWithin(root, filename)) validateStyle(style.content);
      styles.set(`${filename}:${index}`, css(style.content, filename, scopeId, style.scoped));
    }
    const script = descriptor.script || descriptor.scriptSetup ? compileScript(descriptor, {
      id: scopeId, isProd: true, sourceMap: false, genDefaultAs: component, inlineTemplate: Boolean(descriptor.scriptSetup),
      templateOptions: { scoped, isProd: true },
      fs: typeFiles,
    }) : undefined;
    let contents = script?.content ?? `const ${component} = {};`;
    if (descriptor.template && !descriptor.scriptSetup) {
      const template = compileTemplate({
        source: descriptor.template.content, filename, id: scopeId, scoped, isProd: true,
        compilerOptions: { bindingMetadata: script?.bindings },
      });
      if (template.errors.length) throw template.errors[0];
      contents += `\n${template.code.replace(/\bexport function render\b/, "function render")}\n${component}.render = render;`;
    }
    if (scoped) contents += `\n${component}.__scopeId = ${JSON.stringify(scopeId)};`;
    contents += `\nexport default ${component};`;
    // 模板表达式也能生成 import；在交给 Bun 前执行与脚本相同的边界校验。
    if (isWithin(root, filename)) validateScript(contents, `${filename}.${(descriptor.scriptSetup?.lang ?? descriptor.script?.lang)?.endsWith("x") ? "tsx" : "ts"}`);
    return { contents, loader: (descriptor.scriptSetup?.lang ?? descriptor.script?.lang)?.endsWith("x") ? "tsx" as const : "ts" as const };
  }

  const entries = manifest.type === "node" ? [["default", "src/index.vue"]] : Object.entries(manifest.components ?? {});
  const imports = entries.map(([, path], index) => `import component${index} from ${JSON.stringify(resolve(root, path!))};`);
  const entrySource = manifest.type === "node" ? `${imports.join("\n")}\nexport default component0;`
    : `${imports.join("\n")}\nexport default Object.fromEntries([${entries.map(([name], index) => `[${JSON.stringify(name)},component${index}]`).join(",")}]);`;
  const result = await Bun.build({
    entrypoints: [entryId], root, target: "browser", format: "cjs", packages: "bundle", minify: true, env: "disable", throw: false,
    define: { "process.env.NODE_ENV": JSON.stringify("production"), __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false", __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false" },
    plugins: [{
      name: "pluginBrowser",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, async args => {
          try {
            const source = args.path;
            if (source === entryId && !args.importer && args.kind.startsWith("entry-point")) return { path: entryId, namespace: "pluginEntry" };
            if (Object.hasOwn(globals, source)) return { path: source, namespace: "pluginHost" };
            if (isBuiltin(source) || (!isAbsolute(source) && /^[a-z][a-z\d+.-]*:/i.test(source)) || /[?#\0]/.test(source)) throw new Error(`插件浏览器源码不支持此模块路径：${source}`);
            if (/\.(?:s[ac]ss|less|styl(?:us)?|sss|module\.css)$/i.test(source)) throw new Error("插件项目仅支持普通 CSS");
            const bare = !source.startsWith(".") && !isAbsolute(source) && !source.split("/").some(part => part === ".." || !part);
            let path: string;
            try {
              const from = bare && isWithin(root, args.importer) ? sdkModules : args.resolveDir || (isAbsolute(args.importer) ? dirname(args.importer) : root);
              path = Bun.resolveSync(source, from);
            }
            catch (error) {
              const name = packageName(source);
              if (bare && supportedPackages.has(name) && (!statSync(join(sdkModules, name, "package.json"), { throwIfNoEntry: false })
                || registry.sdkExports?.includes(source))) throw missingDependency(source);
              throw new Error(`无法解析插件依赖：${source}；请使用内置 SDK 或项目相对路径`, { cause: error });
            }
            return { path: await allowedPath(path) };
          } catch (error) {
            const failure = error instanceof Error ? error : new Error(String(error));
            failures.push(failure);
            throw failure;
          }
        });
        builder.onLoad({ filter: /.*/, namespace: "pluginEntry" }, () => ({ contents: entrySource, loader: "js" }));
        builder.onLoad({ filter: /.*/, namespace: "pluginHost" }, ({ path }) => ({ contents: `module.exports = globalThis.${globals[path]};`, loader: "js" }));
        builder.onLoad({ filter: /.*/, namespace: "file" }, async ({ path }) => {
          try {
            const actual = await allowedPath(path);
            const extension = extname(actual).toLowerCase();
            if (extension === ".vue") return vue(await readFile(actual, "utf8"), actual);
            if (extension === ".css") {
              if (actual.endsWith(".module.css")) throw new Error("插件项目仅支持普通 CSS");
              const source = await readFile(actual, "utf8");
              if (isWithin(root, actual)) validateStyle(source);
              styles.set(actual, css(source, actual, ""));
              return { contents: "export {};", loader: "js" };
            }
            if (/^\.[cm]?[jt]sx?$/.test(extension)) {
              const contents = await readFile(actual, "utf8");
              if (isWithin(root, actual)) validateScript(contents, actual);
              const loader: Loader = extension.endsWith("x") ? extension.slice(1) as "tsx" | "jsx" : extension.includes("t") ? "ts" : "js";
              return { contents, loader };
            }
            if (extension === ".json") {
              const contents = await readFile(actual, "utf8");
              JSON.parse(contents);
              return { contents, loader: "json" };
            }
            if (/^\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|mp4|webm|mov|mp3|wav|ogg|flac|woff2?|ttf|otf|eot)$/.test(extension)) {
              const content = await readFile(actual);
              return { contents: `export default ${JSON.stringify(`data:${file(actual).type};base64,${content.toString("base64")}`)};`, loader: "js" };
            }
            throw new Error(`插件浏览器源码不支持此文件类型：${actual}`);
          } catch (error) {
            const failure = error instanceof Error ? error : new Error(String(error));
            failures.push(failure);
            throw failure;
          }
        });
      },
    }],
  });
  if (!result.success) {
    const failure = failures.find(error => (error as Error & { code?: string }).code !== "SDK_DEPENDENCY_MISSING");
    if (failure) throw failure;
    if (failures.length && result.logs.every(log => log.level !== "error" || failures.some(error => log.message.includes(error.message)))) throw failures[0];
    throw new AggregateError(result.logs, "插件浏览器构建失败");
  }
  if (result.outputs.length !== 1) throw new Error("插件浏览器构建必须生成单个脚本，资源须内联");
  const source = await result.outputs[0]!.text();
  const style = [...styles.values()].join("\n");
  const target = manifest.type === "node" ? "toonflowNodes" : "toonflowToolViews";
  const host = manifest.type === "node" ? 'if(!globalThis.toonflowNodeHost)throw new Error("缺少节点宿主");' : "";
  let code = `;(() => {${host}const module={exports:{}};const exports=module.exports;${source}\nglobalThis.${target} ??= {};globalThis.${target}.${manifest.name}=module.exports.default;})();`;
  if (manifest.type === "node" && style) {
    code += `\n;(() => {const id=${JSON.stringify(`toonflowNodeStyle:${manifest.name}`)};let style=document.getElementById(id);if(!style){style=document.createElement("style");style.id=id;document.head.append(style);}style.textContent=${JSON.stringify(style)};})();`;
  }
  return { code, css: style };
}
