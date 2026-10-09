import { copyFile, cp, existsSync, mkdir, readFile, readdir, realpath, rm, writeAtomic } from "@toonflow/file";
import { delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import config from "../../../electrobun.config";

const mobileRoot = resolve(import.meta.dir, "..");
const projectRoot = resolve(mobileRoot, "../..");
const buildRoot = resolve(mobileRoot, "../../build/mobile");
const staging = join(buildRoot, "staging");
const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const javaRoot = process.env.JAVA_HOME;
const buildToolsVersion = process.env.ANDROID_BUILD_TOOLS || "35.0.0";
const platformVersion = process.env.ANDROID_PLATFORM || "android-34";
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
const keystore = requireFile(join(mobileRoot, "native/defaultSigning.keystore"), "请使用包含默认签名文件的完整源码。");
const sdkTools = join(sdkRoot, "build-tools", buildToolsVersion);
const androidJar = requireFile(join(sdkRoot, "platforms", platformVersion, "android.jar"), "请确认 ANDROID_HOME 和 ANDROID_PLATFORM。");
const aapt = requireFile(join(sdkTools, "aapt2.exe"), "请确认 ANDROID_HOME 和 ANDROID_BUILD_TOOLS。");
const zipalign = requireFile(join(sdkTools, "zipalign.exe"), "请安装对应 Android SDK Build Tools。");
const d8 = requireFile(join(sdkTools, "lib/d8.jar"), "请安装对应 Android SDK Build Tools。");
const lambdaStubs = requireFile(join(sdkTools, "core-lambda-stubs.jar"), "请安装对应 Android SDK Build Tools。");
const signer = requireFile(join(sdkTools, "lib/apksigner.jar"), "请安装对应 Android SDK Build Tools。");
const javaTools = Object.fromEntries(["java", "javac", "jar"].map(name => [name,
  requireFile(javaRoot ? join(javaRoot, "bin", `${name}.exe`) : Bun.which(`${name}.exe`) || name, "请设置 JAVA_HOME 为 JDK 目录。"),
])) as Record<"java" | "javac" | "jar", string>;
for (const abi of abis) requireFile(join(buildRoot, "runtime", abi, "libbun.so"), "请先执行 bun run --cwd apps/mobile setup。");
const tbsJar = requireFile(join(buildRoot, "tbs/tbssdk-44286.jar"), "请先执行 bun run --cwd apps/mobile setup。");
if (new Bun.CryptoHasher("sha256").update(await readFile(tbsJar)).digest("hex") !== "d70f1544400885a889d8901cbd4d82538a93c6213ef3103d8a75e72fc29a121f") {
  throw new Error(`TBS SDK 缓存校验失败，请移除后重新执行 bun run --cwd apps/mobile setup：${tbsJar}`);
}

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
const classes = join(staging, "classes");
const dex = join(staging, "dex");
for (const directory of [payload, classes, dex]) await mkdir(directory, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(mobileRoot, "src/server.ts")], target: "bun", format: "esm", outdir: payload,
  naming: "server.js", minify: true, external: ["@silvia-odwyer/photon-node"],
  define: { "process.env.appVersion": JSON.stringify(version) },
});
if (!result.success) throw new AggregateError(result.logs, "构建移动端服务失败");
for (const directory of ["web", "nodes", "tools", "ext", "providers", "skills", "mcp"]) {
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
await copyFile(join(projectRoot, "apps/web/node_modules/jsqr/LICENSE"), join(staging, "assets/jsqrLicense.txt"));

const unsigned = join(staging, "unsigned.apk");
const aligned = join(staging, "aligned.apk");
const apk = join(buildRoot, "toonflowMobile.apk");
const resources = join(staging, "res");
const compiledResources = join(staging, "resources.zip");
const manifest = join(staging, "manifest.xml");
const manifestSource = await readFile(join(mobileRoot, "native/manifest.xml"), "utf8");
await writeAtomic(manifest, manifestSource.replace(/android:debuggable="(?:true|false)"/, `android:debuggable="${!release}"`));
await cp(join(mobileRoot, "native/res"), resources, { recursive: true });
await mkdir(join(resources, "drawable-nodpi"), { recursive: true });
await copyFile(join(projectRoot, "packages/assets/logo.iconset/icon_512x512.png"), join(resources, "drawable-nodpi/logo.png"));
await run([aapt, "compile", "--dir", resources, "-o", compiledResources]);
await run([aapt, "link", "-o", unsigned, "-I", androidJar, "--manifest", manifest, "--version-name", version, "--version-code", String(versionCode), "--replace-version", compiledResources]);
await run([javaTools.javac, "-source", "8", "-target", "8", "-encoding", "UTF-8", "-bootclasspath", `${androidJar}${delimiter}${lambdaStubs}`, "-classpath", tbsJar, "-d", classes, join(mobileRoot, "native/mobileActivity.java")]);
const classRoot = join(classes, "com/toonflow/mobile");
const classFiles = (await readdir(classRoot)).filter(name => name.endsWith(".class")).map(name => join(classRoot, name));
await run([javaTools.java, "-cp", d8, "com.android.tools.r8.D8", "--release", "--min-api", "26", "--lib", androidJar, "--output", dex, ...classFiles, tbsJar]);
const dexFiles = (await readdir(dex)).filter(name => name.endsWith(".dex"));
for (const name of dexFiles) await copyFile(join(dex, name), join(staging, name));
await run([javaTools.jar, "uf", unsigned, ...dexFiles, "assets", "lib"]);
await run([zipalign, "-f", "-P", "16", "4", unsigned, aligned]);

await run([javaTools.java, "-jar", signer, "sign", "--ks", keystore, "--ks-key-alias", "androiddebugkey", "--ks-pass", "pass:android", "--key-pass", "pass:android", "--out", apk, aligned]);
await run([javaTools.java, "-jar", signer, "verify", "--verbose", apk]);
console.log(`APK 已生成：${apk}`);
