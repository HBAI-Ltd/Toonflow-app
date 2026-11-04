import { createRequire, isBuiltin } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, readFileSync, realpath, realpathSync, statSync } from "@toonflow/file";
import { build, type Plugin } from "vite";
import { createNodeConfig } from "@toonflow/nodes-scaffold";
import { createToolConfig } from "@toonflow/tools-scaffold";
import { babelParse, parse, registerTS } from "vue/compiler-sfc";
import { pluginManifestSchema } from "./runtime";

const sdkDirectory = dirname(fileURLToPath(import.meta.url));
registerTS(() => createRequire(import.meta.url)("typescript"));
const request = JSON.parse(await new Response(Bun.stdin.stream()).text());
const manifest = pluginManifestSchema.parse(request.manifest);
const root = await realpath(request.root);
const outDir = resolve(request.outDir);
const sdkModules = await realpath(join(sdkDirectory, "node_modules"));
const configUrl = pathToFileURL(join(root, "build.ts")).href;

function isWithin(directory: string, path: string) {
  const offset = relative(directory, path);
  return offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset);
}

async function allowedPath(path: string) {
  const actual = await realpath(path.split("?")[0]!);
  if (!isWithin(root, actual) && !isWithin(sdkModules, actual)) throw new Error(`插件只能引用项目源码或内置 SDK：${path}`);
  return actual;
}

function typeFile(path: string) {
  // Vue 查找类型时会向上探测目录；出界和不存在的类型文件都作为未找到处理。
  if (!isWithin(root, path) && !isWithin(sdkModules, path)) return;
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) return;
  const actual = realpathSync(path);
  if (isWithin(root, actual) || isWithin(sdkModules, actual)) return actual;
}

function validateStyle(source: string) {
  // ACT: 工作区只提供无外部引用的普通 CSS。拒绝转义以免 CSS 标识符有多种等价写法。
  if (source.includes("\\") || /sourceMappingURL/i.test(source)
    || /@import\b|(?:url|image-set)\s*\(/i.test(source.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    throw new Error("插件样式仅支持无文件引用和转义的 CSS；请在脚本中 import 资源后绑定到模板");
  }
}

function validateProjectModule(id: string, source: string) {
  const [file, query] = id.split("?");
  const path = file!.toLowerCase();
  const params = new URLSearchParams(query);
  if (/\.(?:s[ac]ss|less|styl(?:us)?|sss|module\.css)(?:[?&#]|$)/i.test(id) || params.has("module")) throw new Error("插件项目仅支持普通 CSS");
  if (path.endsWith(".css") || params.get("type") === "style") return validateStyle(source);
  if (path.endsWith(".vue") && !query) {
    const { descriptor, errors } = parse(source, { filename: path });
    if (errors.length) throw errors[0];
    if (descriptor.customBlocks.length || descriptor.template?.src || descriptor.template?.lang
      || descriptor.script?.src || descriptor.scriptSetup?.src) throw new Error("插件 Vue 组件仅支持内联模板、脚本和样式");
    for (const style of descriptor.styles) {
      if (style.src || style.module || (style.lang && style.lang !== "css")) throw new Error("插件组件的 style 仅支持内联普通 CSS");
      validateStyle(style.content);
    }
  }
  if (/\bimport\s*[./]/.test(source)) throw new Error("插件前端请使用静态 import 引入资源，不支持 import.meta 或 import 与模块名之间的注释");
}

const fixedBuild: Plugin = {
  name: "pluginDevelopment",
  enforce: "pre",
  config() {
    return {
      root,
      envDir: root,
      publicDir: false,
      cacheDir: join(root, "cache"),
      logLevel: "warn",
      build: { emptyOutDir: false },
    };
  },
  configResolved(config) {
    const api = config.plugins.find(plugin => plugin.name === "vite:vue")?.api;
    if (!api) throw new Error("缺少 Vue 插件构建器");
    api.options = { ...api.options, script: { ...api.options.script, fs: {
      fileExists: (path: string) => Boolean(typeFile(path)),
      readFile(path: string) { const file = typeFile(path); return file ? readFileSync(file, "utf8") : undefined; },
      realpath(path: string) { const file = typeFile(path); if (!file) throw new Error("类型文件不在插件项目或 SDK 内"); return file; },
    } } };
  },
  async resolveId(source, importer, options) {
    if (source.startsWith("\0") || source.startsWith("virtual:")) return;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    if (!resolved) throw new Error(`无法解析插件依赖：${source}；请使用内置 SDK 或项目相对路径`);
    if (!resolved.external && !resolved.id.startsWith("\0")) await allowedPath(resolved.id);
    return resolved;
  },
  async load(id) {
    if (isAbsolute(id)) await allowedPath(id);
  },
  transform(source, id) {
    if (isWithin(root, id.split("?")[0]!)) validateProjectModule(id, source);
  },
};

try {
  if (manifest.type === "node") {
    const config = createNodeConfig(manifest, configUrl, { outDir, syncToData: false });
    await build({ ...config, configFile: false, plugins: [fixedBuild, ...(config.plugins ?? [])], mode: "production" });
  } else {
    const { type: _type, components, ...metadata } = manifest;
    await createToolConfig({ ...metadata, components }, configUrl, {
      outDir,
      syncToData: false,
      tsconfig: join(root, "tsconfig.json"),
      clientPlugins: [fixedBuild],
      buildPlugins: [{
        name: "pluginDevelopment",
        setup(builder) {
          builder.onLoad({ filter: /\.[cm]?[jt]sx?$/i }, async ({ path }) => {
            if (!isWithin(root, path)) return;
            const source = await readFile(path, "utf8");
            // Bun.build 没有禁用宏的 API 选项；在交给 Bun 解析前禁止项目声明构建时导入属性。
            const ast = babelParse(source, { sourceType: "unambiguous", plugins: path.endsWith("x") ? ["jsx", "typescript", "deprecatedImportAssert"] : ["typescript", "deprecatedImportAssert"] });
            for (const node of ast.program.body) {
              if (("attributes" in node && node.attributes?.length) || ("source" in node && node.source?.value.startsWith("macro:"))) {
                throw new Error("工具源码不支持构建时导入属性或 Bun 宏");
              }
            }
          });
          builder.onResolve({ filter: /.*/ }, async args => {
            if (isBuiltin(args.path)) return { path: args.path, external: true };
            if (args.path === "toonflow:tool-zod") return { path: args.path, external: true };
            const path = Bun.resolveSync(args.path, args.resolveDir || (args.importer ? dirname(args.importer) : root));
            return { path: await allowedPath(path) };
          });
        },
      }],
    });
  }
} catch (error) {
  console.error(error instanceof AggregateError ? [error.message, ...error.errors].join("\n") : error);
  process.exitCode = 1;
}
