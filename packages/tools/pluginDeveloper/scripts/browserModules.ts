import { readFile, readdir, realpath } from "@toonflow/file";
import { createHash } from "node:crypto";
import { dirname, join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { createNodeConfig } from "@toonflow/nodes-scaffold";

type PackageInfo = {
  name: string;
  version: string;
  exports?: Record<string, string>;
  module?: string;
  main?: string;
  types?: string;
  typings?: string;
  dependencies?: Record<string, string>;
};

type BrowserPackage = {
  directory: string;
  info: PackageInfo;
  exports: Record<string, { types?: string; default?: string }>;
};

const projectDirectory = resolve(import.meta.dir, "..");
const encoder = new TextEncoder();

async function readPackage(name: string, from = projectDirectory): Promise<BrowserPackage> {
  const path = await realpath(Bun.resolveSync(`${name}/package.json`, from));
  return { directory: dirname(path), info: JSON.parse(await readFile(path, "utf8")), exports: {} };
}

export async function browserModules(optionalInputPaths: string[] = []): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = Object.create(null);
  const noticeDirectories = new Set<string>();
  function collectInputNotice(id: string) {
    if (id.startsWith("\0")) return;
    const path = id.replaceAll("\\", "/").split("?")[0]!;
    const marker = path.lastIndexOf("/node_modules/");
    if (marker < 0) return;
    const start = marker + "/node_modules/".length;
    const segments = path.slice(start).split("/");
    noticeDirectories.add(path.slice(0, start) + segments.slice(0, segments[0]!.startsWith("@") ? 2 : 1).join("/"));
  }
  for (const path of optionalInputPaths) collectInputNotice(path);
  const nodePackage = await readPackage("@toonflow/nodes-scaffold");
  const sharedPackage = await readPackage("@toonflow/node-shared");
  const toolPackage = await readPackage("@toonflow/tools-scaffold");
  const asrPackage = await readPackage("@toonflow/asr", nodePackage.directory);
  const ffmpegPackage = await readPackage("@toonflow/ffmpeg", nodePackage.directory);
  const iconsPackage = await readPackage("@tabler/icons-vue", nodePackage.directory);
  const filePackage = await readPackage("@toonflow/file", toolPackage.directory);
  const nodeLibraries = await Promise.all(["@form-create/element-ui", "vue-draggable-plus", "x-sender", "zod"]
    .map(name => readPackage(name, name === "zod" ? projectDirectory : sharedPackage.directory)));
  const browserPackages = [nodePackage, sharedPackage, toolPackage, asrPackage, ffmpegPackage, iconsPackage, filePackage, ...nodeLibraries];
  const nodeConfig = createNodeConfig({ name: "browserModules", displayName: "开发模块", author: "", github: "" },
    pathToFileURL(join(projectDirectory, "build.ts")).href, { syncToData: false });
  const nodeOutput = nodeConfig.build!.rolldownOptions!.output as { globals: Record<string, string> };
  const nodeGlobals = nodeOutput.globals;
  const toolGlobals = {
    vue: "toonflowToolHost.vue",
    "@vue/runtime-core": "toonflowToolHost.vue",
    "@vue/runtime-dom": "toonflowToolHost.vue",
    "element-plus": "toonflowToolHost.elementPlus",
    axios: "toonflowToolHost.axios",
    "@form-create/element-ui": "toonflowToolHost.formCreate",
  };

  function entry(entries: Record<string, string>, pkg: BrowserPackage, subpath: string, source: string) {
    const name = subpath === "." ? "index" : subpath.slice(2);
    entries[`node_modules/${pkg.info.name}/${name}`] = resolve(pkg.directory, source);
    pkg.exports[subpath] = { types: source, default: `./${name}.js` };
  }

  const nodeEntries: Record<string, string> = {};
  for (const pkg of [nodePackage, sharedPackage]) {
    for (const [subpath, source] of Object.entries(pkg.info.exports ?? {})) {
      if (subpath === "." || source.endsWith(".md")) continue;
      entry(nodeEntries, pkg, subpath, source);
    }
  }
  nodePackage.exports["."] = { types: "./index.ts" };
  entry(nodeEntries, asrPackage, ".", asrPackage.info.exports!["."]!);
  entry(nodeEntries, ffmpegPackage, "./browser", ffmpegPackage.info.exports!["./browser"]!);
  entry(nodeEntries, ffmpegPackage, "./types", ffmpegPackage.info.exports!["./types"]!);
  const iconsSource = iconsPackage.info.module ?? iconsPackage.info.main;
  if (!iconsSource) throw new Error("图标包缺少浏览器入口");
  entry(nodeEntries, iconsPackage, ".", iconsSource);
  iconsPackage.exports["."].types = iconsPackage.info.types ?? iconsPackage.info.typings;
  for (const pkg of nodeLibraries) {
    const source = pkg.info.module ?? pkg.info.main;
    if (!source) throw new Error(`浏览器依赖缺少入口：${pkg.info.name}`);
    entry(nodeEntries, pkg, ".", source);
    pkg.exports["."].types = pkg.info.types ?? pkg.info.typings;
  }
  const toolEntries: Record<string, string> = {};
  for (const subpath of ["./runtime", "./client"]) entry(toolEntries, toolPackage, subpath, toolPackage.info.exports![subpath]!);
  entry(toolEntries, ffmpegPackage, "./remote", ffmpegPackage.info.exports!["./remote"]!);
  toolPackage.exports["."] = { types: "./index.ts" };

  async function compile(entries: Record<string, string>, external: string[], scope: string) {
    const result = await build({
      configFile: false,
      root: projectDirectory,
      publicDir: false,
      css: nodeConfig.css,
      plugins: [
        ...(nodeConfig.plugins?.filter(plugin => plugin && typeof plugin === "object" && "name" in plugin && plugin.name !== "syncNodeFile") ?? []),
        {
          name: "browserDependencies",
          transform(source, id) {
            const sender = nodeLibraries.find(pkg => pkg.info.name === "x-sender")!;
            if (id.replaceAll("\\", "/") === resolve(sender.directory, sender.info.main!).replaceAll("\\", "/")) return `import "./XSender.css";\n${source}`;
            if (!id.replaceAll("\\", "/").startsWith(`${iconsPackage.directory.replaceAll("\\", "/")}/dist/esm/icons/`)) return;
            // ACT: 上游按每个图标文件声明 sideEffects:false；合并为 ESM 后保留这个纯工厂调用边界。
            return source.replace(/=\s*createVueComponent\(/g, "= /*#__PURE__*/ createVueComponent(");
          },
        },
      ],
      define: nodeConfig.define,
      logLevel: "warn",
      build: {
        write: false,
        emptyOutDir: false,
        minify: true,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: true,
        lib: { entry: entries, formats: ["es"] },
        rolldownOptions: {
          external,
          output: {
            entryFileNames: "[name].js",
            chunkFileNames: `node_modules/@toonflow/browserModules/${scope}[name][hash].js`,
            assetFileNames: `node_modules/@toonflow/browserModules/${scope}[name][hash][extname]`,
          },
        },
      },
    });
    const output = Array.isArray(result) ? result.flatMap(item => item.output) : "output" in result ? result.output : [];
    const styles = new Map<string, string>();
    const consumedStyles = new Set<string>();
    for (const item of output) {
      if (item.type !== "asset" || !item.fileName.endsWith(".css")) continue;
      const css = typeof item.source === "string" ? item.source : new TextDecoder().decode(item.source);
      const id = createHash("sha256").update(css).digest("hex").slice(0, 16);
      const name = `node_modules/@toonflow/browserModules/style${id}.js`;
      styles.set(item.fileName, name);
      // ACT: 每份样式只保留一个有副作用的 ESM；共享组件按实际引用导入，不重复携带整包 CSS。
      files[name] = encoder.encode(`if(typeof document!=="undefined"&&!document.querySelector('style[data-toonflow-sdk="${id}"]')){const style=document.createElement("style");style.dataset.toonflowSdk=${JSON.stringify(id)};style.textContent=${JSON.stringify(css)};document.head.append(style);}`);
    }
    for (const item of output) {
      if (item.type === "asset") {
        if (!styles.has(item.fileName)) throw new Error(`浏览器模块包含未内联的资源：${item.fileName}`);
        continue;
      }
      const metadata = (item as typeof item & { viteMetadata?: { importedCss: Set<string> } }).viteMetadata;
      for (const id of Object.keys(item.modules)) collectInputNotice(id);
      const imports = [...(metadata?.importedCss ?? [])].map(css => {
        const style = styles.get(css);
        if (!style) throw new Error(`浏览器模块缺少样式：${css}`);
        consumedStyles.add(css);
        const path = posix.relative(posix.dirname(item.fileName), style);
        return `import ${JSON.stringify(path.startsWith(".") ? path : `./${path}`)};`;
      });
      files[item.fileName] = encoder.encode(imports.join("\n") + "\n" + item.code);
    }
    for (const css of styles.keys()) if (!consumedStyles.has(css)) throw new Error(`浏览器模块样式未关联到脚本：${css}`);
  }

  await compile(nodeEntries, Object.keys(nodeGlobals), "node");
  await compile(toolEntries, [...Object.keys(toolGlobals), "zod"], "tool");

  const backendResult = await Bun.build({
    entrypoints: [join(filePackage.directory, "src/index.ts"), join(filePackage.directory, "src/bun.ts")],
    root: join(filePackage.directory, "src"),
    target: "bun",
    format: "esm",
    packages: "bundle",
    splitting: true,
    minify: true,
    naming: { entry: "[name].js", chunk: "chunk[hash].js" },
  });
  if (!backendResult.success) throw new AggregateError(backendResult.logs, "文件接口编译失败");
  for (const output of backendResult.outputs) {
    files[`node_modules/${filePackage.info.name}/${output.path.replace(/^\.\//, "")}`] = new Uint8Array(await output.arrayBuffer());
  }
  for (const [subpath, source] of Object.entries(filePackage.info.exports!)) {
    filePackage.exports[subpath] = { types: source, default: subpath === "." ? "./index.js" : "./bun.js" };
  }
  async function collectBackendNotices(pkg: BrowserPackage) {
    if (noticeDirectories.has(pkg.directory)) return;
    noticeDirectories.add(pkg.directory);
    for (const name of Object.keys(pkg.info.dependencies ?? {})) await collectBackendNotices(await readPackage(name, pkg.directory));
  }
  await collectBackendNotices(filePackage);
  const sdkExports = browserPackages.flatMap(pkg =>
    Object.keys(pkg.info.exports ?? {}).filter(key => !key.endsWith(".md") && !key.includes("*") && !pkg.exports[key]?.default)
      .map(key => key === "." ? pkg.info.name : `${pkg.info.name}/${key.slice(2)}`));
  files["browserGlobals.json"] = encoder.encode(JSON.stringify({ node: nodeGlobals, tool: toolGlobals, sdkExports }));

  async function copyTypes(directory: string, output: string, sourceTypes: boolean) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (["node_modules", "test", "tests", "__tests__"].includes(item.name) || item.name.startsWith(".")) continue;
      const path = join(directory, item.name);
      const target = `${output}/${item.name}`;
      if (item.isDirectory()) await copyTypes(path, target, sourceTypes);
      else if ((sourceTypes ? /\.(?:[cm]?ts|vue)$/ : /\.d\.[cm]?ts$/).test(item.name)) files[target] = await readFile(path);
    }
  }
  async function copyNotices(directory: string, output: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isFile() && /^(?:licen[cs]e|notice|copying)(?:[.-]|$)/i.test(item.name)) {
        files[`${output}/${item.name}`] = await readFile(join(directory, item.name));
      }
    }
  }
  for (const pkg of browserPackages) {
    const prefix = `node_modules/${pkg.info.name}`;
    await copyTypes(pkg.directory, prefix, pkg.info.name.startsWith("@toonflow/"));
    await copyNotices(pkg.directory, prefix);
    files[`${prefix}/package.json`] = encoder.encode(JSON.stringify({
      name: pkg.info.name,
      version: pkg.info.version,
      type: "module",
      exports: pkg.exports,
    }));
  }
  for (const directory of noticeDirectories) {
    const info = JSON.parse(await readFile(join(directory, "package.json"), "utf8")) as PackageInfo;
    await copyNotices(directory, `thirdPartyNotices/${info.name}/${info.version}`);
  }
  return files;
}
