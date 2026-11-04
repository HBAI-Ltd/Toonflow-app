import { isBuiltin } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { lstat, mkdir, readFile, realpath, writeAtomic } from "@toonflow/file";
import { toolMetadataSchema } from "@toonflow/tools-scaffold/runtime";
import { z } from "zod";
import { buildBrowser, validateImports } from "./browserBuild";
import { pluginManifestSchema } from "./runtime";

const sdkDirectory = dirname(fileURLToPath(import.meta.url));
const supportedPackages = new Set([
  "@toonflow/nodes-scaffold", "@toonflow/tools-scaffold", "@toonflow/node-shared", "@toonflow/asr", "@toonflow/ffmpeg", "@toonflow/file",
  "@tabler/icons-vue", "@form-create/element-ui", "vue-draggable-plus", "x-sender", "eventsource-parser", "zod",
]);

function isWithin(directory: string, path: string) {
  const offset = relative(directory, path);
  return offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset);
}

function packageName(source: string) {
  return /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)(?:\/|$)/i.exec(source)?.[0].replace(/\/$/, "");
}

async function run() {
  const request = z.strictObject({ root: z.string().min(1), outDir: z.string().min(1), manifest: pluginManifestSchema })
    .parse(JSON.parse(await new Response(Bun.stdin.stream()).text()));
  const root = await realpath(request.root);
  if (!(await lstat(root)).isDirectory()) throw new Error("插件源码目录无效");
  const outDir = resolve(request.outDir);
  const sdkModules = await realpath(join(sdkDirectory, "node_modules"));
  const manifest = request.manifest;

  async function allowedPath(path: string) {
    const actual = await realpath(path);
    if (!isWithin(root, actual) && !isWithin(sdkModules, actual)) throw new Error(`插件只能引用项目源码或内置 SDK：${path}`);
    return actual;
  }

  async function readText(path: string, limit: number) {
    const actual = await allowedPath(path);
    const info = await lstat(actual);
    if (!info.isFile() || info.size > limit) throw new Error(`插件文件必须为普通文件且不超过 ${limit} 字节：${path}`);
    const bytes = await readFile(actual);
    if (bytes.byteLength > limit) throw new Error(`插件文件超过大小限制：${path}`);
    return bytes.toString("utf8");
  }

  const packageInfo = JSON.parse(await readText(join(root, "package.json"), 65536));
  const version = z.string().trim().min(1).max(100).parse(packageInfo?.version);
  const readme = await readText(join(root, "readme.md"), 200000).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    return "";
  });
  if (manifest.type === "node") {
    const metadata = { displayName: manifest.displayName.trim(), author: manifest.author.trim(), github: manifest.github.trim(), configRules: manifest.configRules, version, readme };
    if (metadata.github) {
      const url = new URL(metadata.github);
      if (url.origin !== "https://github.com" || url.username || url.password) throw new Error("GitHub 地址必须是 https://github.com 下的地址");
    }
    const { code } = await buildBrowser(root, sdkModules, manifest);
    await mkdir(outDir, { recursive: true });
    await writeAtomic(join(outDir, `${manifest.name}.umd.js`), `/*! toonflowNode:${JSON.stringify(metadata).replaceAll("/", "\\u002f")} */\n${code}`);
    return;
  }

  const metadata = toolMetadataSchema.parse({
    ...manifest,
    version,
    displayName: manifest.displayName.trim(),
    description: manifest.description.trim(),
    prompt: manifest.prompt.trim(),
    author: manifest.author.trim(),
    github: manifest.github.trim(),
    components: Object.keys(manifest.components ?? {}),
    readme,
  });
  let clientBanner = "";
  if (metadata.components.length) {
    const client = await buildBrowser(root, sdkModules, manifest);
    clientBanner = `/*! toonflowToolClient:${JSON.stringify(client).replaceAll("/", "\\u002f")} */\n`;
  }
  const globals = z.object({ node: z.record(z.string(), z.unknown()), tool: z.record(z.string(), z.unknown()), sdkExports: z.array(z.string()).default([]) })
    .parse(JSON.parse(await readFile(join(sdkDirectory, "browserGlobals.json"), "utf8")));
  for (const source of [...Object.keys(globals.node), ...Object.keys(globals.tool)]) {
    const name = packageName(source);
    if (name) supportedPackages.add(name);
  }
  let dependencyMissing: Error | undefined;
  const result = await Bun.build({
    entrypoints: [await allowedPath(join(root, "src/index.ts"))],
    target: "bun",
    format: "esm",
    packages: "bundle",
    minify: true,
    throw: false,
    tsconfig: join(root, "tsconfig.json"),
    external: ["toonflow:tool-zod"],
    plugins: [{
      name: "portableTool",
      setup(builder) {
        builder.onResolve({ filter: /^zod$/ }, () => ({ path: "zod", namespace: "toolHost" }));
        builder.onLoad({ filter: /^zod$/, namespace: "toolHost" }, () => ({ contents: 'module.exports = require("toonflow:tool-zod");', loader: "js" }));
        builder.onLoad({ filter: /\.[cm]?[jt]sx?$/i }, async ({ path }) => {
          const actual = await allowedPath(path);
          const contents = await readFile(actual, "utf8");
          if (isWithin(root, actual)) validateImports(contents, actual);
          const loader = /\.tsx$/i.test(path) ? "tsx" : /\.jsx$/i.test(path) ? "jsx" : /\.[cm]?ts$/i.test(path) ? "ts" : "js";
          return { contents, loader };
        });
        builder.onResolve({ filter: /.*/ }, async args => {
          if (args.path.startsWith("macro:")) throw new Error("工具源码不支持 Bun 宏");
          if (isBuiltin(args.path) || args.path === "toonflow:tool-zod") return { path: args.path, external: true };
          let path: string;
          try { path = Bun.resolveSync(args.path, args.resolveDir || (args.importer ? dirname(args.importer) : root)); }
          catch (error) {
            const name = packageName(args.path);
            const bare = !args.path.startsWith(".") && !isAbsolute(args.path) && !/[\\?#\0:]/.test(args.path)
              && !args.path.split("/").some(part => !part || part === "." || part === "..");
            const absent = name && bare && supportedPackages.has(name) && !await lstat(join(sdkModules, name)).catch((failure: NodeJS.ErrnoException) => {
              if (failure.code !== "ENOENT") throw failure;
            });
            if ((absent || globals.sdkExports.includes(args.path)) && ["MODULE_NOT_FOUND", "ERR_MODULE_NOT_FOUND", "ERR_PACKAGE_PATH_NOT_EXPORTED"].includes((error as NodeJS.ErrnoException).code ?? "")) {
              dependencyMissing = Object.assign(new Error(`SDK_DEPENDENCY_MISSING: ${args.path}`), { code: "SDK_DEPENDENCY_MISSING" });
              throw dependencyMissing;
            }
            throw error;
          }
          return { path: await allowedPath(path) };
        });
      },
    }],
  });
  if (!result.success) {
    const errors = result.logs.filter(message => message.level === "error");
    if (dependencyMissing && errors.length && errors.every(message => message.message.includes("SDK_DEPENDENCY_MISSING"))) throw dependencyMissing;
    throw new AggregateError(result.logs, `工具构建失败：${manifest.name}`);
  }
  if (result.outputs.length !== 1 || result.outputs[0]!.kind !== "entry-point") throw new Error(`工具必须构建为单个脚本，不能包含未内联的资源：${manifest.name}`);
  const code = await result.outputs[0]!.text();
  if (!new Bun.Transpiler({ loader: "js" }).scan(code).exports.includes("default")) throw new Error("工具脚本缺少默认导出");
  await mkdir(outDir, { recursive: true });
  await writeAtomic(join(outDir, `${manifest.name}.tool.js`), `/*! toonflowTool:${JSON.stringify(metadata).replaceAll("/", "\\u002f")} */\n${clientBanner}${code}`);
}

try { await run(); }
catch (error) {
  const missing = error instanceof Error && "code" in error && error.code === "SDK_DEPENDENCY_MISSING";
  console.error(error instanceof AggregateError ? [error.message, ...error.errors].join("\n") : error instanceof Error ? error.message : String(error));
  process.exitCode = missing ? 75 : 1;
}
