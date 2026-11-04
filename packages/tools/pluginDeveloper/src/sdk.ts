import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { lstat, mkdir, mkdtemp, readFile, rename, rm, writeAtomic } from "@toonflow/file";
import { z } from "zod";
import { fullSdkVersion as version } from "../package.json";

const maxArchiveBytes = 64 * 1024 * 1024;
const maxUnpackedBytes = 256 * 1024 * 1024;
const maxFileCount = 50000;
const target = process.platform === "win32" ? "Windows" : process.platform === "darwin" ? "Macos" : process.platform === "linux" ? "Linux" : undefined;
const architecture = process.arch === "x64" ? "X64" : process.arch === "arm64" ? "Arm64" : undefined;
const archiveName = `sdk${target}${architecture}.tar.zst`;
const releaseUrl = `https://github.com/HBAI-Ltd/Toonflow-app/releases/download/pluginDeveloper${version}/`;
const toolDirectory = dirname(fileURLToPath(import.meta.url));
const resourcesDirectory = import.meta.url.endsWith(".ts") ? resolve(toolDirectory, "../build/cache")
  : join(toolDirectory, "pluginResources");
const cacheDirectory = join(resourcesDirectory, "pluginDeveloper", `sdk${version.replaceAll(".", "v")}`, `${target?.[0]?.toLowerCase()}${target?.slice(1)}${architecture}`);
const manifestSchema = z.strictObject({
  version: z.literal(version),
  platform: z.literal(process.platform),
  arch: z.literal(process.arch),
  file: z.literal(archiveName),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size: z.number().int().positive().max(maxArchiveBytes),
  unpackedSize: z.number().int().positive().max(maxUnpackedBytes),
  fileCount: z.number().int().positive().max(maxFileCount),
});
type SdkManifest = z.infer<typeof manifestSchema>;
type SdkRequest = { promise: Promise<string>; controller: AbortController; users: number; settled: boolean };
let pending: SdkRequest | undefined;

function isWithin(directory: string, path: string) {
  const offset = relative(directory, path);
  return !!offset && !isAbsolute(offset) && offset !== ".." && !offset.startsWith(`..${sep}`);
}

async function removeCache(path: string) {
  const directory = resolve(path);
  if (!isWithin(cacheDirectory, directory)) throw new Error("插件开发 SDK 清理路径超出当前版本缓存目录");
  await rm(directory, { recursive: true, force: true });
}

async function readStream(stream: ReadableStream<Uint8Array>, limit: number, signal: AbortSignal) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error("插件开发 SDK 超过大小限制");
      chunks.push(value);
    }
    signal.throwIfAborted();
    return Buffer.concat(chunks, size);
  } finally { await reader.cancel().catch(() => {}); }
}

async function download(file: string, limit: number, signal: AbortSignal) {
  const response = await fetch(new URL(file, releaseUrl), { signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]) });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(`插件开发 SDK 下载失败（HTTP ${response.status}）`);
  }
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body.cancel();
    throw new Error("插件开发 SDK 超过大小限制");
  }
  return readStream(response.body, limit, signal);
}

async function readManifest(path: string) {
  const info = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (!info?.isFile() || info.size > 16384) return;
  const bytes = await readFile(path);
  if (bytes.byteLength > 16384) return;
  let input: unknown;
  try { input = JSON.parse(bytes.toString("utf8")); } catch { return; }
  const parsed = manifestSchema.safeParse(input);
  return parsed.success ? parsed.data : undefined;
}

async function isReady(directory: string, manifest: SdkManifest) {
  const saved = await readManifest(join(directory, "sdkManifest.json"));
  if (!saved || JSON.stringify(saved) !== JSON.stringify(manifest)) return false;
  const entries = await Promise.all([directory, join(directory, "pluginBuild.js"), join(directory, "node_modules")]
    .map(path => lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; })));
  return entries.every(entry => entry && !entry.isSymbolicLink()) && entries[0]!.isDirectory() && entries[1]!.isFile() && entries[2]!.isDirectory();
}

function archiveEntries(tar: Uint8Array, manifest: SdkManifest) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const entries = new Map<string, { size: number; directory: boolean }>();
  const paths = new Map<string, { path: string; directory: boolean }>();
  let total = 0;
  let fileCount = 0;
  let ended = false;
  function field(header: Uint8Array, start: number, length: number) {
    const bytes = header.subarray(start, start + length);
    const end = bytes.indexOf(0);
    return decoder.decode(end < 0 ? bytes : bytes.subarray(0, end));
  }
  // ACT: files() 会合并重名并跳过链接；先核对普通 USTAR，SDK 发布端不生成 PAX/GNU 扩展。
  for (let offset = 0; offset < tar.byteLength;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.byteLength !== 512) throw new Error("插件开发 SDK 压缩包文件头不完整");
    if (header.every(byte => byte === 0)) {
      if (tar.subarray(offset).some(byte => byte !== 0)) throw new Error("插件开发 SDK 压缩包结尾无效");
      ended = true;
      break;
    }
    const checksum = field(header, 148, 8).trim();
    const sum = header.reduce((value, byte, index) => value + (index >= 148 && index < 156 ? 32 : byte), 0);
    const sizeField = field(header, 124, 12).trim();
    if (field(header, 257, 6) !== "ustar" || !/^[0-7]+$/.test(checksum) || Number.parseInt(checksum, 8) !== sum || !/^[0-7]+$/.test(sizeField)) {
      throw new Error("插件开发 SDK 压缩包文件头无效");
    }
    const directory = header[156] === 53;
    const size = Number.parseInt(sizeField, 8);
    if (![0, 48, 53].includes(header[156]!) || (directory && size !== 0) || !Number.isSafeInteger(size)
      || offset + 512 + Math.ceil(size / 512) * 512 > tar.byteLength) throw new Error("插件开发 SDK 包含链接、特殊文件或无效条目");
    const original = [field(header, 345, 155), field(header, 0, 100)].filter(Boolean).join("/");
    const path = directory ? original.replace(/\/$/, "") : original;
    const parts = path.split("/");
    if (!path || path.length > 1024 || parts.some(part => !part || part === "." || part === ".." || /[\\<>:"|?*\x00-\x1f]/.test(part)
      || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("插件开发 SDK 包含不安全路径");
    const key = path.normalize("NFC").toLowerCase();
    if (entries.has(key) || entries.size >= maxFileCount || key === "sdkmanifest.json") throw new Error("插件开发 SDK 包含重名文件或条目过多");
    for (let index = 1; index <= parts.length; index++) {
      const parent = parts.slice(0, index).join("/");
      const parentKey = parent.normalize("NFC").toLowerCase();
      const parentDirectory = index < parts.length || directory;
      const existing = paths.get(parentKey);
      if (existing && (existing.path !== parent || existing.directory !== parentDirectory)) throw new Error("插件开发 SDK 路径大小写或文件类型冲突");
      paths.set(parentKey, { path: parent, directory: parentDirectory });
    }
    entries.set(key, { size, directory });
    total += size;
    if (!directory) fileCount++;
    if (total > manifest.unpackedSize || fileCount > manifest.fileCount) throw new Error("插件开发 SDK 解压大小或文件数量不符");
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!ended || total !== manifest.unpackedSize || fileCount !== manifest.fileCount) throw new Error("插件开发 SDK 压缩包不完整");
  return entries;
}

async function prepareSdk(signal: AbortSignal) {
  if (!target || !architecture) throw new Error("插件开发 SDK 仅支持 Windows、macOS、Linux 的 x64/arm64 平台");
  const markerPath = join(cacheDirectory, "current.json");
  const current = await readManifest(markerPath);
  if (current && await isReady(join(cacheDirectory, current.sha256), current)) return join(cacheDirectory, current.sha256);
  const manifest = manifestSchema.parse(JSON.parse((await download(archiveName.replace(".tar.zst", ".json"), 16384, signal)).toString("utf8")));
  signal.throwIfAborted();
  const destination = join(cacheDirectory, manifest.sha256);
  if (await isReady(destination, manifest)) {
    await writeAtomic(markerPath, JSON.stringify(manifest));
    return destination;
  }
  const compressed = await download(manifest.file, manifest.size, signal);
  if (compressed.byteLength !== manifest.size || createHash("sha256").update(compressed).digest("hex") !== manifest.sha256) throw new Error("插件开发 SDK 下载大小或 SHA-256 校验失败");
  const tar = await readStream(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("zstd")), maxUnpackedBytes, signal);
  const entries = archiveEntries(tar, manifest);
  const files = await new Bun.Archive(tar).files();
  if (files.size !== manifest.fileCount) throw new Error("插件开发 SDK 文件数量不符");
  for (const directory of [resourcesDirectory, join(resourcesDirectory, "pluginDeveloper"), dirname(cacheDirectory), cacheDirectory]) {
    await mkdir(directory, { recursive: true });
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("插件开发 SDK 缓存目录无效");
  }
  const temporary = await mkdtemp(join(cacheDirectory, "install"));
  try {
    for (const [path, file] of files) {
      signal.throwIfAborted();
      const entry = entries.get(path.normalize("NFC").toLowerCase());
      const output = resolve(temporary, path);
      if (!entry || entry.directory || entry.size !== file.size || !isWithin(temporary, output)) {
        throw new Error("插件开发 SDK 解压路径或文件大小不符");
      }
      await mkdir(dirname(output), { recursive: true });
      await writeAtomic(output, new Uint8Array(await file.arrayBuffer()), { exclusive: true });
    }
    await writeAtomic(join(temporary, "sdkManifest.json"), JSON.stringify(manifest), { exclusive: true });
    if (!await isReady(temporary, manifest)) throw new Error("插件开发 SDK 缺少构建入口");
    signal.throwIfAborted();
    if (!await isReady(destination, manifest)) {
      await removeCache(destination);
      await rename(temporary, destination);
    }
    await writeAtomic(markerPath, JSON.stringify(manifest));
    return destination;
  } finally { await removeCache(temporary); }
}

export async function ensureSdk(signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  if (!pending) {
    const request: SdkRequest = { promise: undefined!, controller: new AbortController(), users: 0, settled: false };
    pending = request;
    request.promise = prepareSdk(request.controller.signal).finally(() => {
      request.settled = true;
      if (pending === request) pending = undefined;
    });
  }
  const request = pending;
  request.users++;
  let abort: (() => void) | undefined;
  try {
    return await new Promise<string>((resolveSdk, reject) => {
      abort = () => reject(signal!.reason);
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
      request.promise.then(resolveSdk, reject);
    });
  } finally {
    if (abort) signal?.removeEventListener("abort", abort);
    request.users--;
    // ACT: 单个调用取消只退出自己的等待，最后一个等待者取消时才中止共享下载。
    if (!request.users && !request.settled) request.controller.abort(signal?.reason);
  }
}
