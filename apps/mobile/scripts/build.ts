import { copyFile, cp, existsSync, mkdir, readFile, readdir, realpath, rm, writeAtomic } from "@toonflow/file";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import config from "../../../electrobun.config";

const mobileRoot = resolve(import.meta.dir, "..");
const projectRoot = resolve(mobileRoot, "../..");
const buildRoot = resolve(mobileRoot, "../../build/mobile");
const staging = join(buildRoot, "staging");
const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const javaRoot = process.env.JAVA_HOME;
const abis = ["arm64-v8a"];
const version = config.app.version;
const release = process.env.androidRelease === "1";

if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Android 版本号必须为 X.Y.Z。");
const [major, minor, patch] = version.split(".").map(Number);
const versionCode = major * 1000000 + minor * 1000 + patch;
if (![major, minor, patch].every(Number.isSafeInteger) || minor > 999 || patch > 999 || versionCode <= 0 || versionCode > 2100000000) {
  throw new Error("Android 版本号的 minor、patch 必须在 0–999 内，生成的 versionCode 必须在 1–2100000000 内。");
}

if (process.platform !== "win32") throw new Error("当前 Android 验证构建使用 Windows SDK，请在 Windows 上执行。");
if (!sdkRoot) throw new Error("请设置 ANDROID_HOME 为 Android SDK 目录。");

function requireFile(path: string, help: string) {
  if (!existsSync(path)) throw new Error(`找不到 ${path}。${help}`);
  return path;
}

// ACT: 使用仓库内公开的默认签名，保证不同 CI 构建可覆盖安装；商店发布需改用专用签名。
requireFile(join(mobileRoot, "native/defaultSigning.keystore"), "请使用包含默认签名文件的完整源码。");
requireFile(join(sdkRoot, "platforms/android-37.1/package.xml"), "请使用 SDK Manager 安装 Android SDK Platform 37.1。");
requireFile(join(sdkRoot, "platforms/android-37.1/android.jar"), "请安装 Android SDK Platform 37.1。");
const aapt = requireFile(join(sdkRoot, "build-tools/36.0.0/aapt2.exe"), "请安装 Android SDK Build Tools 36.0.0。");
const signer = requireFile(join(sdkRoot, "build-tools/36.0.0/lib/apksigner.jar"), "请安装 Android SDK Build Tools 36.0.0。");
const java = requireFile(javaRoot ? join(javaRoot, "bin/java.exe") : Bun.which("java.exe") || "java.exe", "请设置 JAVA_HOME 为 JDK 17 或更高版本目录。");
for (const abi of abis) requireFile(join(buildRoot, "runtime", abi, "libbun.so"), "请先执行 bun run --cwd apps/mobile setup。");
const gradleLauncher = requireFile(join(buildRoot, "gradle/gradle-9.6.0/lib/gradle-gradle-cli-main-9.6.0.jar"), "请先执行 bun run --cwd apps/mobile setup。");

async function run(command: string[], cwd = staging) {
  const result = Bun.spawn(command, { cwd, env: process.env, stdout: "inherit", stderr: "inherit" });
  if (await result.exited !== 0) throw new Error(`命令执行失败：${command[0]}`);
}

await run([process.execPath, "run", "build:server"], projectRoot);
await mkdir(buildRoot, { recursive: true });
if (existsSync(staging)) {
  const path = relative(await realpath(buildRoot), await realpath(staging));
  if (!path || path.startsWith("..") || isAbsolute(path)) throw new Error(`拒绝清理构建目录之外的路径：${staging}`);
  await rm(staging, { recursive: true });
}
const payload = join(staging, "assets/payload");
await mkdir(payload, { recursive: true });

const result = await Bun.build({
  // ACT: 服务端与 stdio 共用构建依赖，避免在 APK 中重复携带 MCP、Zod 和语言包。
  entrypoints: [join(mobileRoot, "src/server.ts"), join(projectRoot, "packages/mcp/src/stdio.ts")],
  target: "bun", format: "esm", splitting: true, outdir: payload,
  naming: "[name].js", minify: true, external: ["@silvia-odwyer/photon-node"],
  define: { "process.env.appVersion": JSON.stringify(version) },
});
if (!result.success) throw new AggregateError(result.logs, "构建移动端服务失败");
for (const directory of ["web", "nodes", "tools", "ext", "providers", "skills"]) {
  await cp(join(projectRoot, "build", directory), join(payload, directory), { recursive: true });
}
// ACT: Photon 按自身目录读取 WASM，沿用 server 的完整 external 包布局。
await cp(join(projectRoot, "build/server/node_modules"), join(payload, "node_modules"), { recursive: true });
const revision = new Bun.CryptoHasher("sha256");
async function hashPayload(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await hashPayload(path);
    else revision.update(relative(payload, path).replaceAll("\\", "/")).update("\0").update(await readFile(path)).update("\0");
  }
}
await hashPayload(payload);
await writeAtomic(join(payload, "revision.txt"), revision.digest("hex"));
for (const abi of abis) {
  const destination = join(staging, "lib", abi, "libbun.so");
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(buildRoot, "runtime", abi, "libbun.so"), destination);
}
const thirdParty = join(mobileRoot, "thirdParty.md");
if (existsSync(thirdParty)) await copyFile(thirdParty, join(staging, "assets/thirdParty.md"));
const browserBridge = join(staging, "assets/browserBridge");
await mkdir(browserBridge, { recursive: true });
await copyFile(join(mobileRoot, "native/browserBridge/manifest.json"), join(browserBridge, "manifest.json"));
const bridgeResult = await Bun.build({
  entrypoints: [join(mobileRoot, "native/browserBridge/content.ts")], target: "browser", format: "iife",
  naming: "content.js", outdir: browserBridge, minify: true,
});
if (!bridgeResult.success) throw new AggregateError(bridgeResult.logs, "构建移动端浏览器桥接失败");
await copyFile(join(projectRoot, "apps/web/node_modules/jsqr/LICENSE"), join(staging, "assets/jsqrLicense.txt"));

const apk = join(buildRoot, "toonflowMobile.apk");
const resources = join(staging, "res");
const manifest = join(staging, "manifest.xml");
const manifestSource = await readFile(join(mobileRoot, "native/manifest.xml"), "utf8");
await writeAtomic(manifest, manifestSource.replace(/ package="[^"]+"/, "").replace(/ android:version(?:Code|Name)="[^"]+"/g, "").replace(/ android:(?:debuggable|extractNativeLibs)="(?:true|false)"/g, "").replace(/\s*<uses-sdk\b[^>]*\/>/, ""));
await cp(join(mobileRoot, "native/res"), resources, { recursive: true });
await mkdir(join(resources, "drawable-nodpi"), { recursive: true });
await copyFile(join(projectRoot, "packages/assets/logo.iconset/icon_512x512.png"), join(resources, "drawable-nodpi/logo.png"));
await run([
  java, "-cp", gradleLauncher, "org.gradle.launcher.GradleMain", "--offline", "--no-daemon", "--console=plain",
  "--gradle-user-home", join(buildRoot, "gradleHome"), "--project-cache-dir", join(buildRoot, "gradleProject"),
  "-Pandroid.builder.sdkDownload=false",
  `-Pandroid.aapt2FromMavenOverride=${aapt}`, `-PmobileVersion=${version}`, `-PmobileVersionCode=${versionCode}`,
  release ? "assembleRelease" : "assembleDebug",
], join(mobileRoot, "native"));
const variant = release ? "release" : "debug";
await copyFile(join(buildRoot, "native/outputs/apk", variant, `toonflowMobile-${variant}.apk`), apk);
await run([java, "-jar", signer, "verify", "--verbose", apk]);
console.log(`APK 已生成：${apk}`);
