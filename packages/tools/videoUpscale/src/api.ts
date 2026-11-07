import { createHash } from "node:crypto";
import { S3Client } from "bun";
import { z } from "zod";
import { upscaleResolutions, type UpscaleResolution } from "./types";

export const resolutionSchema = z.enum(upscaleResolutions).default("720p");

export const configSchema = z.strictObject({
  apiKey: z.string().trim().max(4096).default(""),
  endpoint: z.string().trim().max(2048).default(""),
  bucket: z.string().trim().max(255).default(""),
  region: z.string().trim().max(255).default(""),
  accessKeyId: z.string().trim().max(1024).default(""),
  secretAccessKey: z.string().max(4096).default(""),
});

export type UpscaleConfig = z.infer<typeof configSchema>;

// 主机名以 aliyuncs.com 结尾即视为阿里云 OSS，需使用虚拟主机寻址与 OSS 的禁止覆盖头
function isOssEndpoint(endpoint: string) {
  return /(^|\.)aliyuncs\.com$/i.test(new URL(endpoint).hostname);
}

export function requireConfig(value: Record<string, unknown>) {
  const config = configSchema.parse(value);
  if (Object.values(config).some(value => !value.trim())) throw new Error("请先在视频升清插件设置中填写 reAPI 和 S3 存储配置");
  let endpoint: URL;
  try { endpoint = new URL(config.endpoint); } catch { throw new Error("S3 Endpoint 必须是有效的 HTTPS 地址"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("S3 Endpoint 必须是无凭据、无查询参数的 HTTPS 地址");
  }
  // OSS 的 Endpoint 主机须包含桶名，URL 主机名已统一为小写
  if (isOssEndpoint(config.endpoint) && !endpoint.hostname.startsWith(`${config.bucket.toLowerCase()}.`)) {
    throw new Error("阿里云 OSS 的 Endpoint 须包含 Bucket，例如 https://<bucket>.oss-cn-hangzhou.aliyuncs.com");
  }
  return config;
}

export function accountHash(config: UpscaleConfig) {
  return createHash("sha256").update(JSON.stringify([config.apiKey, config.endpoint, config.bucket, config.region, config.accessKeyId, config.secretAccessKey])).digest("hex");
}

function requestSignal(signal: AbortSignal | undefined, timeout: number) {
  return signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout);
}

export async function uploadSource(config: UpscaleConfig, key: string, bytes: Buffer, signal?: AbortSignal) {
  let uploadUrl: string;
  let downloadUrl: string;
  let oss: boolean;
  try {
    oss = isOssEndpoint(config.endpoint);
    const client = new S3Client({ endpoint: config.endpoint, bucket: config.bucket, region: config.region,
      accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, ...(oss ? { virtualHostedStyle: true } : {}) });
    uploadUrl = client.presign(key, { method: "PUT", expiresIn: 3600 });
    downloadUrl = client.presign(key, { method: "GET", expiresIn: 48 * 60 * 60 });
  } catch { throw new Error("S3 配置无效或生成上传链接失败"); }
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: "PUT", headers: oss ? { "x-oss-forbid-overwrite": "true" } : { "If-None-Match": "*" }, body: bytes as unknown as BodyInit,
      signal: requestSignal(signal, 30 * 60_000), redirect: "error" });
  } catch {
    throw new Error("源视频上传失败或中断，可使用同一任务继续上传");
  }
  if (response.status === 409 || response.status === 412) {
    let existing: Response;
    try { existing = await fetch(downloadUrl, { signal: requestSignal(signal, 30 * 60_000), redirect: "error" }); }
    catch { throw new Error("无法核对已上传的视频，请稍后重试"); }
    if (!existing.ok || !existing.body) throw new Error("无法核对已上传的视频，请稍后重试");
    const reader = existing.body.getReader();
    const digest = createHash("sha256");
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > bytes.byteLength) break;
        digest.update(chunk.value);
      }
    } catch { throw new Error("无法核对已上传的视频，请检查存储对象或稍后重试"); }
    finally { await reader.cancel().catch(() => {}); }
    if (size !== bytes.byteLength || digest.digest("hex") !== createHash("sha256").update(bytes).digest("hex")) {
      throw new Error("存储中已有不同的源视频，请人工核对");
    }
  } else if (!response.ok) throw new Error(`源视频上传失败（HTTP ${response.status}），可使用同一任务重试`);
  return downloadUrl;
}

const remoteSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/),
  status: z.string().max(50),
  output: z.object({ video_urls: z.array(z.string().max(8192)).optional() }).nullish(),
  billing: z.object({ cost_usd: z.number().finite().nonnegative().optional() }).nullish(),
  usage: z.object({ credits: z.number().finite().nonnegative().optional() }).nullish(),
}).passthrough();

export type RemoteTask = z.infer<typeof remoteSchema>;

async function remoteRequest(config: UpscaleConfig, url: string, init: RequestInit, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      signal: requestSignal(signal, 30_000), redirect: "error" });
  } catch {
    throw new Error("reAPI 请求未完成，请稍后查询任务状态");
  }
  if (!response.ok) throw Object.assign(new Error(`reAPI 请求失败（HTTP ${response.status}）`), { responseStatus: response.status });
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("reAPI 返回了无法解析的任务数据"); }
  const result = remoteSchema.safeParse(payload);
  if (!result.success) throw new Error("reAPI 返回的任务数据格式无效");
  return result.data;
}

export function submitTask(config: UpscaleConfig, videoUrl: string, taskId: string, resolution: UpscaleResolution, signal?: AbortSignal) {
  return remoteRequest(config, "https://reapi.ai/api/v1/videos/generations", {
    method: "POST", body: JSON.stringify({ model: "enhance-video-1.0", video_url: videoUrl, tool_version: "standard",
      scene: "aigc", resolution, bitrate_level: "high", client_token: taskId }),
  }, signal);
}

export function queryTask(config: UpscaleConfig, remoteId: string, signal?: AbortSignal) {
  return remoteRequest(config, `https://reapi.ai/api/v1/tasks/${encodeURIComponent(remoteId)}`, { method: "GET" }, signal);
}

export async function downloadResult(value: unknown, signal?: AbortSignal) {
  let url: URL;
  try { url = new URL(z.string().max(8192).parse(value)); } catch { throw new Error("reAPI 返回的视频地址无效"); }
  // 直接使用 reAPI 返回的地址下载，仅保留 https 协议检查（拒绝 file:、data: 等非网络地址）；下载请求不携带凭据
  if (url.protocol !== "https:") {
    throw new Error("reAPI 返回的视频地址不受信任");
  }
  let response: Response;
  try { response = await fetch(url, { signal: requestSignal(signal, 30 * 60_000), redirect: "error" }); }
  catch { throw new Error("升清视频下载失败，可稍后再次查询任务"); }
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(`升清视频下载失败（HTTP ${response.status}）`);
  }
  const limit = 100 * 1024 * 1024;
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > limit) {
    await response.body.cancel();
    throw new Error("升清视频超过 100 MB，暂无法保存");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) throw new Error("升清视频超过 100 MB，暂无法保存");
      chunks.push(chunk.value);
    }
  } catch { throw new Error("升清视频下载中断或超过 100 MB，请在服务商处核对"); }
  finally { await reader.cancel().catch(() => {}); }
  if (!size) throw new Error("reAPI 返回的视频为空");
  return Buffer.concat(chunks, size);
}
