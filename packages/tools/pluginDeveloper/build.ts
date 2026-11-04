import { createToolConfig } from "@toonflow/tools-scaffold";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeAtomic } from "@toonflow/file";
import { createHash } from "node:crypto";
import { isBuiltin } from "node:module";
import { dirname, join, resolve } from "node:path";
import { zipSync } from "fflate";
import { browserModules } from "./scripts/browserModules";
import metadata from "./plugin.json";

const root = import.meta.dir;
const output = resolve(root, "../../../build/tools");
const sfcManifest = Bun.resolveSync("@vue/compiler-sfc/package.json", dirname(Bun.resolveSync("vue/compiler-sfc", root)));
const sfcDependencies = JSON.parse(await readFile(sfcManifest, "utf8")).dependencies;
const worker = await Bun.build({
  entrypoints: [join(root, "src/portableBuild.ts")],
  target: "bun",
  minify: true,
  packages: "bundle",
  external: ["typescript"],
  metafile: true,
  plugins: [{
    name: "sfcOptionalEngines",
    setup(builder) {
      builder.onResolve({ filter: /^[a-z@]/ }, args => {
        if (!args.importer.replaceAll("\\", "/").endsWith("/@vue/compiler-sfc/dist/compiler-sfc.cjs.js")) return;
        // Vue 同时支持 Pug 等可选模板引擎，工作区只接受内联 HTML 模板。
        if (!isBuiltin(args.path) && args.path !== "typescript" && !Object.hasOwn(sfcDependencies, args.path)) {
          return { path: "templateEngine", namespace: "unsupportedSfcEngine" };
        }
      });
      builder.onLoad({ filter: /^templateEngine$/, namespace: "unsupportedSfcEngine" }, () => ({
        contents: "module.exports = {};",
        loader: "js",
      }));
    },
  }],
});
if (!worker.success || worker.outputs.length !== 1) throw new AggregateError(worker.logs, "内置编译器构建失败");
const workerInputs = Object.keys(worker.metafile!.inputs).map(path => resolve(root, path));
const files = await browserModules([...workerInputs, Bun.resolveSync("fflate", root)]);
files["pluginBuild.js"] = new Uint8Array(await worker.outputs[0]!.arrayBuffer());
// SFC 的导入类型由 TypeScript 解析，只内置 API 与声明。
const typescript = dirname(Bun.resolveSync("typescript/package.json", root));
for (const name of ["package.json", "LICENSE.txt", "ThirdPartyNoticeText.txt", "lib/typescript.js",
  ...(await readdir(join(typescript, "lib"))).filter(name => name.endsWith(".d.ts")).map(name => `lib/${name}`)]) {
  files[`node_modules/typescript/${name}`] = await readFile(join(typescript, name));
}
const archive = zipSync(files, { level: 9, mtime: new Date(2000, 0, 1) });
const digest = createHash("sha256").update(archive).digest("hex");
const contents = `export const digest=${JSON.stringify(digest)},data=${JSON.stringify(Buffer.from(archive).toString("base64"))};`;
await mkdir(output, { recursive: true });
const stage = await mkdtemp(join(output, "bundle"));
try {
  await createToolConfig(metadata, import.meta.url, {
    outDir: stage, syncToData: false,
    buildPlugins: [{
      name: "bundledSdk",
      setup(builder) {
        builder.onResolve({ filter: /^pluginDeveloper:bundledSdk$/ }, () => ({ path: "archive", namespace: "bundledSdk" }));
        builder.onLoad({ filter: /^archive$/, namespace: "bundledSdk" }, () => ({ contents, loader: "js" }));
      },
    }],
  });
  const name = `${metadata.name}.tool.js`;
  const tool = await readFile(join(stage, name));
  if (tool.length >= 10_000_000) throw new Error(`工具文件 ${tool.length} 字节，必须小于 10 MB（含 ZIP 编码和文档）`);
  await writeAtomic(join(output, name), tool);
  if (process.env.NODE_ENV === "dev") {
    const dataDirectory = resolve(root, "../../../data/tools");
    await mkdir(dataDirectory, { recursive: true });
    await copyFile(join(output, name), join(dataDirectory, name));
  }
  console.log(`${name}: ${tool.length} 字节；内置 ZIP: ${archive.byteLength} 字节`);
} finally { await rm(stage, { recursive: true, force: true }); }
