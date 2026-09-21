import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const arch = process.argv[2] ?? process.arch;
if (process.platform !== "darwin" || !["x64", "arm64"].includes(arch) || process.argv.length > 3) {
  throw new Error("请在 macOS 执行：bun packages/startup/scripts/buildMac.ts [x64|arm64]，需要 Xcode Command Line Tools。");
}
const packageDir = resolve(import.meta.dir, "..");
const workDir = resolve(packageDir, "../../build/startupNative");
const targetDir = join(workDir, arch);
const outputDir = join(packageDir, "assets", arch === "arm64" ? "macArm64" : "macX64");
const sourceDir = join(workDir, "thorvg-1.1.1");
const archivePath = join(workDir, "thorvg.tar.xz");
const sourceHash = "5ca6143088f18b5dbe42552c939594100da6226d79de503d1a171184d6aa310d";
mkdirSync(targetDir, { recursive: true });

async function run(args: string[]) {
  const child = Bun.spawn(args, { cwd: packageDir, stdout: "inherit", stderr: "inherit" });
  if (await child.exited !== 0) throw new Error(`原生启动画面编译失败：${args[0]}`);
}

await run(["xcrun", "--find", "clang++"]);
if (!existsSync(archivePath)) {
  const response = await fetch("https://github.com/thorvg/thorvg/releases/download/v1.1.1/thorvg-1.1.1.tar.xz");
  if (!response.ok) throw new Error(`下载 ThorVG 源码失败：HTTP ${response.status}`);
  const archive = await response.arrayBuffer();
  if (new Bun.CryptoHasher("sha256").update(archive).digest("hex") !== sourceHash) throw new Error("ThorVG 源码校验失败");
  await Bun.write(archivePath, archive);
}
if (new Bun.CryptoHasher("sha256").update(readFileSync(archivePath)).digest("hex") !== sourceHash) throw new Error("缓存的 ThorVG 源码校验失败");
await run(["tar", "-xf", archivePath, "-C", workDir]);
// ACT: 固定 ThorVG 1.1.1 的 CPU/Lottie 源码集合；升级版本时按官方 Meson 清单重新核对。
const sourceFolders = ["src/common", "src/renderer", "src/renderer/cpu_engine", "src/loaders/lottie", "src/loaders/raw", "src/bindings/capi"];
const sourceFiles = sourceFolders.flatMap((folder) => readdirSync(join(sourceDir, folder))
  .filter((name) => name.endsWith(".cpp")).map((name) => join(sourceDir, folder, name)));
const includeDirs = [targetDir, sourceDir, ...["inc", "src/loaders", "src/savers", ...sourceFolders].map((folder) => join(sourceDir, folder))];
writeFileSync(join(targetDir, "config.h"), '#pragma once\n#define THORVG_CAPI_BINDING_SUPPORT 1\n#define THORVG_CPU_ENGINE_SUPPORT 1\n#define THORVG_LOTTIE_LOADER_SUPPORT 1\n#define THORVG_VERSION_STRING "1.1.1"\n');
const exportsPath = join(targetDir, "exports.txt");
const exports = readFileSync(join(packageDir, "assets/exports.def"), "utf8").split(/\r?\n/)
  .map((line) => line.trim()).filter((line) => line.startsWith("tvg_")).map((name) => `_${name}`);
writeFileSync(exportsPath, exports.join("\n") + "\n");
const targetFlags = ["-arch", arch === "arm64" ? "arm64" : "x86_64", `-mmacosx-version-min=${arch === "arm64" ? "11.0" : "10.15"}`];
await run(["xcrun", "clang++", ...targetFlags, "-dynamiclib", "-Os", "-flto", "-std=c++14", "-fno-exceptions", "-fno-rtti", "-fvisibility=hidden",
  ...includeDirs.flatMap((directory) => ["-I", directory]), ...sourceFiles,
  "-Wl,-dead_strip", "-Wl,-install_name,@rpath/libthorvg.dylib", "-Xlinker", "-exported_symbols_list", "-Xlinker", exportsPath,
  "-o", join(targetDir, "libthorvg.dylib")]);
await run(["xcrun", "clang", ...targetFlags, "-dynamiclib", "-Os", "-fobjc-arc", "-fblocks", "-Wall", "-Wextra",
  "-framework", "AppKit", "-framework", "QuartzCore", "-framework", "CoreGraphics",
  join(packageDir, "native/macSplash.m"), "-Wl,-dead_strip", "-Wl,-install_name,@rpath/nativeSplash.dylib", "-o", join(targetDir, "nativeSplash.dylib")]);
mkdirSync(outputDir, { recursive: true });
// ACT: 直接保留链接器产物，不再 strip 或重签；ARM 依赖链接器自带的签名。
for (const fileName of ["libthorvg.dylib", "nativeSplash.dylib"]) {
  copyFileSync(join(targetDir, fileName), join(outputDir, fileName));
}
console.log(`macOS 启动画面原生库已生成：${outputDir}`);
