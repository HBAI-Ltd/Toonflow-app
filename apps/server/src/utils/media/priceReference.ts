import { open, stat, withFileAccess } from "@toonflow/file";
import type { ProviderPriceReference } from "@toonflow/providers";
import type { MediaReference } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";
import { getStatus } from "@/utils/ffmpeg";
import { resolveWorkspacePath } from "@/utils/workspace/files";

const references = new Map<string, { revision: string; expires: number; value: Promise<ProviderPriceReference> }>();
let probeStatus: { config: string; expires: number; value: Promise<string | null> } | undefined;

export function detectMimeType(bytes: Uint8Array, fallback: string) {
  const header = Buffer.from(bytes.buffer, bytes.byteOffset, Math.min(bytes.byteLength, 16));
  const text = header.toString("ascii");
  const mimeType = fallback.split(";")[0].trim().toLowerCase();
  if (header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (header[0] === 255 && header[1] === 216 && header[2] === 255) return "image/jpeg";
  if (/^GIF8[79]a/.test(text)) return "image/gif";
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "image/webp";
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WAVE") return "audio/wav";
  if (text.startsWith("fLaC")) return "audio/flac";
  if (text.startsWith("OggS")) return mimeType.startsWith("video/") ? "video/ogg" : mimeType === "audio/opus" ? "audio/opus" : "audio/ogg";
  if (header[0] === 0xff && (header[1]! & 0xf6) === 0xf0) return "audio/aac";
  if (text.startsWith("ID3") || (header[0] === 0xff && (header[1]! & 0xe0) === 0xe0 && (header[1]! & 0x06) !== 0)) return "audio/mpeg";
  if (text.slice(4, 8) === "ftyp") {
    if (/avif|avis/.test(text.slice(8))) return "image/avif";
    if (/^M4[AB] $/.test(text.slice(8, 12)) || mimeType.startsWith("audio/")) return "audio/mp4";
    return text.slice(8, 12) === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (header.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) return mimeType.startsWith("audio/") ? "audio/webm" : "video/webm";
  return ({ "image/jpg": "image/jpeg", "audio/mp3": "audio/mpeg", "audio/x-wav": "audio/wav", "audio/wave": "audio/wav", "audio/x-flac": "audio/flac" } as Record<string, string>)[mimeType] ?? mimeType;
}

async function waitForMetadata<T>(value: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return value;
  let abort: (() => void) | undefined;
  try {
    return await Promise.race([value, new Promise<never>((_resolve, reject) => {
      abort = () => reject(signal.reason);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    })]).catch(error => {
      // ACT: 取消时不丢弃 value 自身的 promise，让上游调用方按原 signal 处理；value 内部 reject 也不会变 unhandled。
      void value.catch(() => undefined);
      throw error;
    });
  } finally { if (abort) signal.removeEventListener("abort", abort); }
}

function probePath(config: string) {
  if (probeStatus?.config === config && probeStatus.expires > Date.now()) return probeStatus.value;
  const entry = { config, expires: Infinity, value: Promise.resolve<string | null>(null) };
  // ACT: 合并在途版本检查，完成后缓存 10 秒；配置变化立即重查，不触发缺工具安装提示。
  entry.value = getStatus().then(({ tools }) => tools.ffprobe.error ? null : tools.ffprobe.path).catch(() => null)
    .finally(() => { entry.expires = Date.now() + 10000; });
  probeStatus = entry;
  return entry.value;
}

function positive(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

async function probeMedia(path: string, mediaType: string, config: string, signal: AbortSignal) {
  const executable = await waitForMetadata(probePath(config), signal);
  if (!executable) return {};
  signal.throwIfAborted();
  return withFileAccess([path], "read", async () => {
    const child = Bun.spawn([executable, "-v", "error", "-protocol_whitelist", "file",
      "-format_whitelist", "mov,matroska,webm,ogg,wav,mp3,flac,aac",
      "-select_streams", mediaType === "video" ? "V:0" : "a:0", "-show_entries",
      "stream=width,height,duration,avg_frame_rate:format=duration", "-of", "json", "-i", path], {
      stdin: "ignore", stdout: "pipe", stderr: "ignore", windowsHide: true, timeout: 5000, signal,
      env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "FFREPORT")),
    });
    const [output, code] = await Promise.all([child.stdout.text(), child.exited]);
    signal.throwIfAborted();
    if (code !== 0) return {};
    const data = JSON.parse(output);
    const stream = data.streams?.[0];
    if (!stream) return {};
    const duration = positive(stream.duration) ?? positive(data.format?.duration);
    const width = positive(stream.width);
    const height = positive(stream.height);
    const [numerator, denominator = "1"] = String(stream.avg_frame_rate ?? "").split("/");
    const frameRate = positive(Number(numerator) / Number(denominator));
    return { ...(duration ? { duration } : {}), ...(width ? { width } : {}), ...(height ? { height } : {}), ...(frameRate ? { frameRate } : {}) };
  }, signal);
}

async function loadPriceReference(cwd: string, reference: MediaReference, mediaType: string, signal?: AbortSignal): Promise<ProviderPriceReference> {
  signal?.throwIfAborted();
  const { path } = await resolveWorkspacePath(cwd, reference.path);
  signal?.throwIfAborted();
  const info = await stat(path);
  signal?.throwIfAborted();
  if (!info.isFile() || !info.size || info.size > 100 * 1024 * 1024) throw new Error("参考媒体须为不超过 100 MB 的非空文件");
  const config = JSON.stringify(conf.get("settings", {}).ffmpeg ?? {});
  const key = JSON.stringify([path, reference.mimeType, mediaType, config]);
  const revision = `${info.mtimeMs}:${info.ctimeMs}:${info.size}`;
  const now = Date.now();
  for (const [key, cached] of references) if (cached.expires <= now) references.delete(key);
  const cached = references.get(key);
  if (cached?.revision === revision) return cached.value;
  const value = (async () => {
    const header = Buffer.alloc(16);
    const handle = await open(path, "r");
    try { await handle.read(header, 0, header.length, 0); }
    finally { await handle.close(); }
    const mimeType = detectMimeType(header, reference.mimeType);
    if (!mimeType.startsWith(`${mediaType}/`)) throw new Error(`参考媒体类型须为 ${mediaType}`);
    const metadata: ProviderPriceReference = { mimeType, sizeBytes: info.size };
    const deadline = AbortSignal.timeout(5000);
    try {
      if (mediaType === "image") {
        const image = await waitForMetadata(withFileAccess([path], "read", () => new Bun.Image(path).metadata(), deadline), deadline);
        if (positive(image.width)) metadata.width = image.width;
        if (positive(image.height)) metadata.height = image.height;
      } else Object.assign(metadata, await waitForMetadata(probeMedia(path, mediaType, config, deadline), deadline));
    } catch {
      // ACT: 缺探测工具、格式不支持或 5 秒内无法探测时保留类型/大小，未知维度不伪造为 0。
    }
    const latest = await stat(path);
    if (`${latest.mtimeMs}:${latest.ctimeMs}:${latest.size}` !== revision) throw new Error("参考媒体已变化，请重试估价");
    return metadata;
  })();
  const entry = { revision, expires: now + 30000, value };
  // ACT: 元信息缓存最多 500 项 / 30 秒；每次核对 mtime/ctime/size，不保存素材内容。
  if (references.size >= 500) references.delete(references.keys().next().value!);
  references.set(key, entry);
  void value.catch(() => { if (references.get(key) === entry) references.delete(key); });
  return value;
}

export function readPriceReference(cwd: string, reference: MediaReference, mediaType: string, signal?: AbortSignal) {
  // 单个请求取消只结束自己的等待，不中断其他请求共用的探测；路径查询也受等待时限约束。
  return waitForMetadata(loadPriceReference(cwd, reference, mediaType, signal), signal);
}
