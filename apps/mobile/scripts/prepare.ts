import { existsSync, mkdir, rename, writeAtomic } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { join, resolve } from "node:path";

const buildRoot = resolve(import.meta.dir, "../../../build/mobile");
const runtimeRoot = resolve(buildRoot, "runtime");
const bunVersion = "1.4.2";
const runtimes = [
  { abi: "arm64-v8a", name: "bun-linux-aarch64-android", sha256: "a1c7e2983f1bb65146beb256a4d72449f23042412bc2cf278aa6397ba27e0274" },
];

if (process.platform !== "win32") throw new Error("当前 Android 验证构建使用 Windows SDK，请在 Windows 上执行。");
await mkdir(runtimeRoot, { recursive: true });

for (const runtime of runtimes) {
  const archive = resolve(runtimeRoot, `${runtime.name}-${bunVersion}.zip`);
  if (!existsSync(archive)) {
    const url = `https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${runtime.name}.zip`;
    console.log(`下载 Android Bun ${bunVersion} (${runtime.abi})`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`下载 Bun 失败：HTTP ${response.status} ${url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (new Bun.CryptoHasher("sha256").update(bytes).digest("hex") !== runtime.sha256) throw new Error(`Bun 下载校验失败：${runtime.name}`);
    await writeAtomic(archive, bytes);
  }
  const archiveHash = new Bun.CryptoHasher("sha256").update(await file(archive).arrayBuffer()).digest("hex");
  if (archiveHash !== runtime.sha256) throw new Error(`Bun 缓存校验失败，请移除后重新执行 bun run --cwd apps/mobile setup：${archive}`);
  const destination = resolve(runtimeRoot, runtime.abi, "libbun.so");
  await mkdir(resolve(runtimeRoot, runtime.abi), { recursive: true });
  const result = Bun.spawn([
    "powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
    "$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive = [System.IO.Compression.ZipFile]::OpenRead($env:mobileArchive); try { $entry = $archive.GetEntry($env:mobileEntry); if ($null -eq $entry) { throw 'Bun runtime entry missing' }; [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $env:mobileDestination, $true) } finally { $archive.Dispose() }",
  ], {
    env: { ...process.env, mobileArchive: archive, mobileEntry: `${runtime.name}/bun`, mobileDestination: `${destination}.part` },
    stdout: "inherit", stderr: "inherit",
  });
  if (await result.exited !== 0) throw new Error(`解压 Bun 失败：${archive}`);
  await rename(`${destination}.part`, destination);
  console.log(`已准备 ${destination}`);
}

const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdkRoot) throw new Error("请设置 ANDROID_HOME 为 Android SDK 目录。");
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin/java.exe") : Bun.which("java.exe");
if (!java || !existsSync(java)) throw new Error("请设置 JAVA_HOME 为 JDK 17 或更高版本目录。");
const gradleVersion = "9.6.0";
const gradleSha256 = "bbaeb2fef8710818cf0e261201dab964c572f92b942812df0c3620d62a529a01";
const gradleRoot = join(buildRoot, "gradle");
const gradleArchive = join(gradleRoot, `gradle-${gradleVersion}-bin.zip`);
await mkdir(gradleRoot, { recursive: true });
if (!existsSync(gradleArchive)) {
  const url = `https://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`;
  console.log(`下载 Gradle ${gradleVersion}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载 Gradle 失败：HTTP ${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new Bun.CryptoHasher("sha256").update(bytes).digest("hex") !== gradleSha256) throw new Error("Gradle 下载校验失败");
  await writeAtomic(gradleArchive, bytes);
}
if (new Bun.CryptoHasher("sha256").update(await file(gradleArchive).arrayBuffer()).digest("hex") !== gradleSha256) {
  throw new Error(`Gradle 缓存校验失败，请移除后重新执行 bun run --cwd apps/mobile setup：${gradleArchive}`);
}
const gradleLauncher = join(gradleRoot, `gradle-${gradleVersion}/lib/gradle-gradle-cli-main-${gradleVersion}.jar`);
if (!existsSync(gradleLauncher)) {
  const extraction = Bun.spawn([
    "powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
    "$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($env:mobileArchive, $env:mobileDestination)",
  ], { env: { ...process.env, mobileArchive: gradleArchive, mobileDestination: gradleRoot }, stdout: "inherit", stderr: "inherit" });
  if (await extraction.exited !== 0) throw new Error("解压 Gradle 失败");
}
const preparation = Bun.spawn([
  java, "-cp", gradleLauncher, "org.gradle.launcher.GradleMain", "--no-daemon", "--console=plain",
  "--gradle-user-home", join(buildRoot, "gradleHome"), "--project-cache-dir", join(buildRoot, "gradleProject"),
  "-Pandroid.builder.sdkDownload=true",
  "prepareDependencies",
], { cwd: resolve(import.meta.dir, "../native"), env: process.env, stdout: "inherit", stderr: "inherit" });
if (await preparation.exited !== 0) throw new Error("准备 GeckoView 构建依赖失败");
console.log("已准备 ARM64 GeckoView 与 Android 构建依赖");
