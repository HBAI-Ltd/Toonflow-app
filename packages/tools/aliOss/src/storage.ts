import { createHash, createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import type { MediaUploadRequest, MediaUploadResult } from "@toonflow/providers";

export const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".bmp": "image/bmp", ".tif": "image/tiff", ".tiff": "image/tiff", ".heic": "image/heic", ".heif": "image/heif",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".avi": "video/x-msvideo",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg",
};

export const configSchema = z.strictObject({
  region: z.string().trim().max(128).default("cn-hangzhou"),
  endpoint: z.string().trim().max(2048).default(""),
  bucket: z.string().trim().max(63).default(""),
  accessKeyId: z.string().trim().max(256).default(""),
  accessKeySecret: z.string().max(4096).default(""),
  prefix: z.string().trim().max(500).default("toonflow"),
  expiresHours: z.number().int().min(1).max(168).default(72),
});

function requireConfig(value: Record<string, unknown>) {
  const config = configSchema.parse(value);
  if (!config.region || !config.endpoint || !config.bucket || !config.accessKeyId || !config.accessKeySecret.trim()) {
    throw new Error("请先在阿里云 OSS 插件设置中填写地域、Endpoint、Bucket 和 AccessKey");
  }
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(config.region)) throw new Error("OSS 地域格式无效，例如 cn-hangzhou");
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(config.bucket)) throw new Error("OSS Bucket 名称格式无效");
  let endpoint: URL;
  try { endpoint = new URL(config.endpoint); } catch { throw new Error("OSS Endpoint 必须是有效的 HTTPS 公网地址"); }
  if (endpoint.protocol !== "https:" || endpoint.hostname !== `oss-${config.region}.aliyuncs.com` ||
    endpoint.username || endpoint.password || endpoint.port || endpoint.pathname !== "/" || endpoint.search || endpoint.hash) {
    throw new Error("OSS Endpoint 必须是与地域一致的阿里云 HTTPS 公网地址，例如 https://oss-cn-hangzhou.aliyuncs.com");
  }
  if (config.prefix && !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(config.prefix)) {
    throw new Error("OSS 对象前缀仅支持字母、数字、下划线、连字符及目录分隔符");
  }
  return config;
}

function validateSignedUrl(value: string, config: { bucket: string; region: string }) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("OSS 签名地址无效"); }
  if (url.protocol !== "https:" || url.hostname !== `${config.bucket}.oss-${config.region}.aliyuncs.com` ||
    url.username || url.password || url.port || url.hash) throw new Error("OSS 签名地址与配置的 Bucket 不匹配");
  return value;
}

function ossEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

// 按阿里云 OSS V4 签名 URL 规范（OSS4-HMAC-SHA256）生成预签名地址；编码与拼接细节对齐 ali-oss 6.23 的 signatureUrlV4，固定时钟下已逐字节比对。
function signOssUrl(method: "PUT" | "GET", config: { region: string; bucket: string; accessKeyId: string; accessKeySecret: string }, objectKey: string, headers: Record<string, string>, expires: number) {
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const signRegion = config.region.replace(/^oss-/, "");
  const scope = `${date}/${signRegion}/oss/aliyun_v4_request`;
  const queries: [string, string][] = [
    ["x-oss-credential", `${config.accessKeyId}/${scope}`],
    ["x-oss-date", amzDate],
    ["x-oss-expires", String(expires)],
    ["x-oss-signature-version", "OSS4-HMAC-SHA256"],
  ];
  const signedHeaders = Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), value.trim()] as const)
    .filter(([name]) => name === "content-type" || name === "content-md5" || name.startsWith("x-oss-"))
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");
  const canonicalRequest = [
    method,
    `/${config.bucket}/${ossEncode(objectKey).replace(/%2F/g, "/")}`,
    queries.map(([key, value]) => `${ossEncode(key)}=${ossEncode(value)}`).join("&"),
    signedHeaders,
    "",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = ["OSS4-HMAC-SHA256", amzDate, scope, createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
  const signingKey = [date, signRegion, "oss", "aliyun_v4_request"].reduce<Buffer>(
    (key, part) => createHmac("sha256", key).update(part).digest(),
    Buffer.from(`aliyun_v4${config.accessKeySecret}`),
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const query = [...queries, ["x-oss-signature", signature]].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  return `https://${config.bucket}.oss-${config.region}.aliyuncs.com/${encodeURIComponent(objectKey).replace(/%2F/g, "/").replace(/'/g, "%27")}?${query}`;
}

const ossRejectHints = new Map([
  ["SignatureDoesNotMatch", "请核对 AccessKey ID 和 Secret"],
  ["InvalidAccessKeyId", "请核对 AccessKey ID 和 Secret"],
  ["AccessDenied", "该 AccessKey 无权限写入此 Bucket 或对象前缀"],
  ["NoSuchBucket", "Bucket 不存在，或与地域/Endpoint 不匹配"],
  ["RequestTimeTooSkewed", "本机时间与 OSS 相差过大，请校准系统时间"],
]);

// 只提取格式合法的 OSS 错误码，响应中的其余内容（可能回显密钥或签名）一律不使用；读取失败按无错误码处理。
async function readOssErrorCode(response: Response) {
  // ACT: 错误响应体整体读入内存，OSS 错误体通常很小；若需严格限制读取量，改为按流只读前 4096 字符。
  let text: string;
  try {
    text = (await response.text()).slice(0, 4096);
  } catch {
    return "";
  }
  const code = text.match(/<Code>([^<]*)<\/Code>/)?.[1] ?? "";
  return /^[A-Za-z]{3,64}$/.test(code) ? code : "";
}

export async function uploadMedia(request: MediaUploadRequest & { config: Record<string, unknown> }): Promise<MediaUploadResult> {
  const config = requireConfig(request.config);
  if (!ArrayBuffer.isView(request.data) || request.data.BYTES_PER_ELEMENT !== 1 || !request.data.byteLength || request.data.byteLength > 100 * 1024 * 1024) {
    throw new Error("媒体文件为空或超过 100 MB");
  }
  if (!/^(?:image|video|audio)\/[a-z0-9][a-z0-9.+-]*$/i.test(request.mimeType)) throw new Error("仅支持上传图片、视频或音频媒体");
  request.signal?.throwIfAborted();
  const extension = Object.entries(mimeTypes).find(([, mimeType]) => mimeType === request.mimeType.toLowerCase())?.[0] ?? "";
  if (!extension) throw new Error("不支持此媒体文件格式");
  const objectKey = [config.prefix.replace(/\/$/, ""), `media${randomUUID().replaceAll("-", "")}${extension}`].filter(Boolean).join("/");
  const record = { storageId: "aliOss", bucket: config.bucket, objectKey };
  const headers = { "Content-Type": request.mimeType, "x-oss-object-acl": "private", "x-oss-forbid-overwrite": "true" };
  let uploadUrl: string;
  try { uploadUrl = validateSignedUrl(signOssUrl("PUT", config, objectKey, headers, 3600), config); }
  catch { throw new Error("OSS 配置无效或无法生成上传签名"); }
  await request.onPrepared?.(record);
  request.signal?.throwIfAborted();
  let response: Response;
  try {
    const signal = request.signal ? AbortSignal.any([request.signal, AbortSignal.timeout(10 * 60_000)]) : AbortSignal.timeout(10 * 60_000);
    response = await (request.fetch ?? fetch)(uploadUrl, { method: "PUT", headers, body: request.data as unknown as BodyInit, signal, redirect: "error" });
  } catch {
    throw new Error(`OSS 上传失败或结果未知，请先核对 Bucket ${config.bucket} 中的对象 ${objectKey}，不要直接重复上传`);
  }
  if (!response.ok) {
    const code = await readOssErrorCode(response);
    const codeText = code ? `，${code}` : "";
    if (response.status >= 400 && response.status < 500) {
      const hint = ossRejectHints.get(code);
      throw new Error(`OSS 拒绝了上传（HTTP ${response.status}${codeText}）${hint ? `，${hint}` : ""}，对象未写入`);
    }
    throw new Error(`OSS 上传未成功（HTTP ${response.status}${codeText}），请先核对 Bucket ${config.bucket} 中的对象 ${objectKey}`);
  }
  await response.body?.cancel().catch(() => {});
  if (!response.headers.get("etag")?.trim()) throw new Error(`OSS 上传结果缺少 ETag，请先核对 Bucket ${config.bucket} 中的对象 ${objectKey}`);
  const expiresAt = new Date(Math.floor(Date.now() / 1000) * 1000 + config.expiresHours * 60 * 60_000).toISOString();
  let url: string;
  try { url = validateSignedUrl(signOssUrl("GET", config, objectKey, {}, config.expiresHours * 60 * 60), config); }
  catch { throw new Error(`OSS 对象已上传，但无法生成下载链接；请在 Bucket ${config.bucket} 中核对对象 ${objectKey}`); }
  return { ...record, url, expiresAt };
}
