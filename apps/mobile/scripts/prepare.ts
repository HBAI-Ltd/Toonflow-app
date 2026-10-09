import { existsSync, mkdir, rename, writeAtomic } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { resolve } from "node:path";

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

const tbsVersion = "44286";
const tbsSha256 = "d70f1544400885a889d8901cbd4d82538a93c6213ef3103d8a75e72fc29a121f";
const tbsRoot = resolve(buildRoot, "tbs");
const tbsJar = resolve(tbsRoot, `tbssdk-${tbsVersion}.jar`);
await mkdir(tbsRoot, { recursive: true });
if (!existsSync(tbsJar)) {
  const url = `https://repo.maven.apache.org/maven2/com/tencent/tbs/tbssdk/${tbsVersion}/tbssdk-${tbsVersion}.jar`;
  console.log(`下载腾讯 TBS SDK ${tbsVersion}（不含 X5 内核）`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载 TBS SDK 失败：HTTP ${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new Bun.CryptoHasher("sha256").update(bytes).digest("hex") !== tbsSha256) throw new Error("TBS SDK 下载校验失败");
  await writeAtomic(tbsJar, bytes);
}
if (new Bun.CryptoHasher("sha256").update(await file(tbsJar).arrayBuffer()).digest("hex") !== tbsSha256) {
  throw new Error(`TBS SDK 缓存校验失败，请移除后重新执行 bun run --cwd apps/mobile setup：${tbsJar}`);
}
console.log(`已准备 ${tbsJar}`);

