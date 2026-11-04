import { cp, lstat, mkdir, readFile, readdir, realpath, rm, writeAtomic } from "@toonflow/file";
import { createHash } from "node:crypto";
import { fullSdkVersion } from "../package.json";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

type PackageInfo = {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
};

const projectDirectory = resolve(import.meta.dir, "..");
// ACT: 构建入口单独内联；这里只保留公开源码实际使用的依赖，不复制宿主已共享的 peer 运行时。
const sourceDependencies: Record<string, string[]> = {
  "@toonflow/nodes-scaffold": ["@toonflow/asr", "@toonflow/ffmpeg", "@tabler/icons-vue", "eventsource-parser", "zod"],
  "@toonflow/tools-scaffold": ["@toonflow/asr", "@toonflow/file", "zod"],
  "element-plus": [],
};
const compilerExternals = ["vite", "vue", "sass", "typescript"];

async function copyPluginSdk(outputDirectory: string) {
  outputDirectory = resolve(outputDirectory);
  const buildDirectory = resolve(projectDirectory, "build");
  const outputPath = relative(buildDirectory, outputDirectory);
  if (!outputPath || isAbsolute(outputPath) || outputPath.startsWith("..") || resolve(buildDirectory, outputPath) !== outputDirectory) {
    throw new Error("插件 SDK 只能生成到项目 build 的子目录");
  }
  const nodeModulesDirectory = join(outputDirectory, "node_modules");
  const packages = new Map<string, string>();

  async function resolvePackage(name: string, from: string) {
    let entry: string;
    try { entry = Bun.resolveSync(`${name}/package.json`, from); }
    catch { entry = Bun.resolveSync(name, from); }
    let directory = dirname(await realpath(entry));
    while (true) {
      const info = await readFile(join(directory, "package.json"), "utf8").then(source => JSON.parse(source) as PackageInfo)
        .catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      if (info?.name) return { directory, info };
      const parent = dirname(directory);
      if (parent === directory) throw new Error(`无法定位 SDK 依赖包：${name}`);
      directory = parent;
    }
  }

  async function copyPackage(name: string, from: string, parent = outputDirectory, optional = false): Promise<void> {
    if (name.startsWith("@types/")) return;
    let dependency: Awaited<ReturnType<typeof resolvePackage>>;
    try { dependency = await resolvePackage(name, from); }
    catch (error) {
      if (optional && ["ENOENT", "MODULE_NOT_FOUND", "ERR_MODULE_NOT_FOUND"].includes((error as NodeJS.ErrnoException).code ?? "")) return;
      throw error;
    }
    const { directory, info } = dependency;
    // ACT: 按 Node 查找顺序复用已复制版本；版本冲突只嵌套到使用方，避免扁平覆盖依赖。
    for (let location = parent; ; location = dirname(location)) {
      const installed = packages.get(join(location, "node_modules", name));
      if (installed === directory) return;
      if (installed || location === outputDirectory) break;
    }
    const rootTarget = join(nodeModulesDirectory, name);
    const target = packages.has(rootTarget) ? join(parent, "node_modules", name) : rootTarget;
    packages.set(target, directory);
    await cp(directory, target, {
      recursive: true,
      dereference: true,
      filter(source) {
        const path = relative(directory, source).replaceAll("\\", "/");
        if (path.split("/").some(part => ["node_modules", ".git", "test", "tests", "__tests__"].includes(part)) || path.endsWith(".map")) return false;
        if (info.name === "typescript") {
          // Vue 的类型解析使用 API 和声明，不需要 tsc/tsserver 或诊断语言包。
          return !path || path === "lib" || /^lib[\\/](?:typescript\.js|[^\\/]+\.d\.ts)$/.test(path)
            || /^(?:package\.json|license[^\\/]*|notice[^\\/]*|thirdpartynotice[^\\/]*)$/i.test(path);
        }
        if (info.name === "element-plus") {
          // 组件运行时由宿主提供；保留插件显式引用的样式入口、主题资源和类型。
          return !/\.[^/]+$/.test(path) || path === "package.json" || path.startsWith("theme-chalk/")
            || /\/style\/[^/]+\.[cm]?js$/.test(path) || /\.d\.[cm]?ts$/.test(path) || /^license/i.test(path);
        }
        return true;
      },
    });
    const optionalDependencies = info.optionalDependencies ?? {};
    const dependencies = sourceDependencies[info.name] ?? Object.keys({ ...info.dependencies, ...optionalDependencies });
    for (const dependencyName of dependencies) {
      await copyPackage(dependencyName, directory, target, dependencyName in optionalDependencies);
    }
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(nodeModulesDirectory, { recursive: true });
  await writeAtomic(join(outputDirectory, "package.json"), JSON.stringify({ private: true, type: "module" }, null, 2) + "\n", { mode: 0o644 });
  const scaffolds = await Promise.all(["@toonflow/nodes-scaffold", "@toonflow/tools-scaffold"].map(async name => ({
    name,
    entry: await realpath(Bun.resolveSync(name, projectDirectory)),
    directory: (await resolvePackage(name, projectDirectory)).directory,
  })));
  for (const name of ["@toonflow/nodes-scaffold", "@toonflow/tools-scaffold", "@toonflow/node-shared", ...compilerExternals]) {
    await copyPackage(name, projectDirectory);
  }
  await copyPackage("element-plus", scaffolds[0]!.directory);
  // ACT: 内联脚手架和 PostCSS 配置；Vite 保留包边界以定位自身资源和原生编译器。
  for (const { name, entry } of scaffolds) {
    const target = join(nodeModulesDirectory, name);
    const result = await Bun.build({
      entrypoints: [entry],
      outdir: target,
      naming: "index.js",
      target: "bun",
      packages: "bundle",
      external: compilerExternals,
    });
    if (!result.success) throw new AggregateError(result.logs, `插件脚手架构建失败：${name}`);
    const info = JSON.parse(await readFile(join(target, "package.json"), "utf8")) as PackageInfo;
    await writeAtomic(join(target, "package.json"), JSON.stringify({ ...info, exports: { ...info.exports, ".": "./index.js" } }, null, 2) + "\n", { mode: 0o644 });
  }
  const result = await Bun.build({
    entrypoints: [resolve(projectDirectory, "src/pluginBuild.ts")],
    outdir: outputDirectory,
    naming: "pluginBuild.js",
    target: "bun",
    packages: "bundle",
    external: [...compilerExternals, "@toonflow/nodes-scaffold", "@toonflow/tools-scaffold"],
  });
  if (!result.success) throw new AggregateError(result.logs, "插件构建进程打包失败");
  await mkdir(join(outputDirectory, "docs"), { recursive: true });
  await cp(resolve(projectDirectory, "readme.md"), join(outputDirectory, "docs/guide.md"));
  await cp(join(scaffolds[0]!.directory, "readme.md"), join(outputDirectory, "docs/node.md"));
  await cp(join(scaffolds[1]!.directory, "readme.md"), join(outputDirectory, "docs/tool.md"));
}

export default async function buildSdk() {
  const platformNames: Record<string, string> = { darwin: "Macos", linux: "Linux", win32: "Windows" };
  const platformName = platformNames[process.platform];
  if (!platformName || !["x64", "arm64"].includes(process.arch)) throw new Error(`不支持的 SDK 平台：${process.platform}/${process.arch}`);
  const architectureName = process.arch === "x64" ? "X64" : "Arm64";
  const outputDirectory = resolve(projectDirectory, "build");
  const sdkDirectory = join(outputDirectory, "sdk");
  await copyPluginSdk(sdkDirectory);
  const entries: Record<string, Uint8Array> = Object.create(null);
  let unpackedSize = 0;
  async function collectFiles(directory: string) {
    for (const name of (await readdir(directory)).sort()) {
      const path = join(directory, name);
      const info = await lstat(path);
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) {
        await collectFiles(path);
        continue;
      }
      if (!info.isFile()) throw new Error(`SDK 不能包含特殊文件：${path}`);
      const content = await readFile(path);
      entries[relative(sdkDirectory, path).replaceAll("\\", "/")] = content;
      unpackedSize += content.byteLength;
    }
  }
  await collectFiles(sdkDirectory);
  const tar = await new Bun.Archive(entries).bytes();
  // 解包器只接收普通 USTAR，打包时拒绝长路径触发的 PAX/GNU 扩展。
  for (let offset = 0; offset < tar.byteLength;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const size = Buffer.from(header.subarray(124, 136)).toString("ascii").replace(/\0.*$/, "").trim();
    if (header.byteLength !== 512 || ![0, 48, 53].includes(header[156]!)
      || Buffer.from(header.subarray(257, 262)).toString("ascii") !== "ustar" || !/^[0-7]+$/.test(size)) {
      throw new Error("SDK 压缩包仅支持 USTAR 普通文件和目录，不支持 PAX/GNU 扩展");
    }
    offset += 512 + Math.ceil(Number.parseInt(size, 8) / 512) * 512;
    if (offset > tar.byteLength) throw new Error("SDK 压缩包条目大小无效");
  }
  const archive = await Bun.zstdCompress(tar, { level: 12 });
  const file = `sdk${platformName}${architectureName}.tar.zst`;
  const manifest = {
    version: fullSdkVersion,
    platform: process.platform,
    arch: process.arch,
    file,
    sha256: createHash("sha256").update(archive).digest("hex"),
    size: archive.byteLength,
    unpackedSize,
    fileCount: Object.keys(entries).length,
  };
  await writeAtomic(join(outputDirectory, file), archive, { mode: 0o644 });
  await writeAtomic(join(outputDirectory, `sdk${platformName}${architectureName}.json`), JSON.stringify(manifest, null, 2) + "\n", { mode: 0o644 });
  console.log(JSON.stringify(manifest, null, 2));
  return manifest;
}

if (import.meta.main) await buildSdk();
