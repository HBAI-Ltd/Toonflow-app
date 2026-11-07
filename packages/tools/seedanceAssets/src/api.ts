import { createHash, createHmac } from "node:crypto";
import { z } from "zod";

export const configSchema = z.strictObject({
  accessKeyId: z.string().trim().min(1).max(256),
  secretAccessKey: z.string().min(1).max(4096).refine(value => value.trim().length > 0),
  // 兼容旧版 Files 上传配置；新版 OSS 上传不读取此字段。
  apiKey: z.string().trim().max(4096).default(""),
  projectName: z.string().trim().min(1).max(256).default("default"),
  callbackUrl: z.string().trim().max(8192).refine(value => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }).default("https://console.volcengine.com/ark/region:cn-beijing/overview"),
});

export type AssetConfig = z.infer<typeof configSchema>;

export function safeErrorMessage(value: unknown, config: AssetConfig) {
  const details = value && typeof value === "object" ? value as Record<string, unknown> : undefined;
  const text = typeof value === "string" ? value : details?.Message ?? details?.message;
  const code = details?.Code ?? details?.code;
  let message = [typeof code === "string" && /^[a-zA-Z0-9_.-]{1,128}$/.test(code) ? code : "", typeof text === "string" ? text : ""].filter(Boolean).join("：");
  for (const secret of [config.secretAccessKey, config.apiKey, config.accessKeyId].filter(Boolean).sort((left, right) => right.length - left.length)) {
    for (const variant of [secret, encodeURIComponent(secret), JSON.stringify(secret).slice(1, -1)]) message = message.replaceAll(variant, "••••••");
  }
  return message.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••")
    .replace(/([?&][^=&#\s]+)=[^&#\s"'<>]*/g, "$1=••••••")
    .replace(/((?:authorization|byted_?token|secret|signature|api[_-]?key)["']?\s*[:=]\s*["']?)[^\s"',;}&<>]+/gi, "$1••••••")
    .slice(0, 2000);
}

export const assetSchema = z.object({
  Id: z.string().min(1),
  AssetType: z.enum(["Image", "Video", "Audio"]),
  Status: z.enum(["Active", "Processing", "Failed"]),
  ProjectName: z.string().optional(),
  GroupId: z.string().optional(),
  Name: z.string().optional(),
  URL: z.string().optional(),
  Error: z.object({ Code: z.string().optional(), Message: z.string().optional() }).passthrough().optional(),
}).passthrough();

const actionSchema = z.enum([
  "CreateVisualValidateSession",
  "GetVisualValidateResult",
  "ListAssetGroups",
  "ListAssets",
  "GetAsset",
  "CreateAsset",
]);
const responseSchema = z.object({
  ResponseMetadata: z.object({ Error: z.unknown().optional() }).optional(),
  Result: z.unknown().optional(),
});

export async function requestAsset(config: AssetConfig, action: z.infer<typeof actionSchema>, body: Record<string, unknown>, signal?: AbortSignal) {
  const parsedConfig = configSchema.safeParse(config);
  const parsedAction = actionSchema.safeParse(action);
  const parsedBody = z.record(z.string(), z.json()).safeParse(body);
  if (!parsedConfig.success || !parsedAction.success || !parsedBody.success) throw new Error("火山方舟素材请求配置或参数无效");
  const { accessKeyId, secretAccessKey, projectName } = parsedConfig.data;
  const host = "ark.cn-beijing.volcengineapi.com";
  const query = `Action=${parsedAction.data}&Version=2024-01-01`;
  const payload = JSON.stringify({ ...parsedBody.data, ProjectName: projectName });
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const scope = `${date.slice(0, 8)}/cn-beijing/ark/request`;
  const signedHeaders = "content-type;host;x-content-sha256;x-date";
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-content-sha256:${payloadHash}\nx-date:${date}\n`;
  const canonicalRequest = ["POST", "/", query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["HMAC-SHA256", date, scope, createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
  const dateKey = createHmac("sha256", secretAccessKey).update(date.slice(0, 8)).digest();
  const regionKey = createHmac("sha256", dateKey).update("cn-beijing").digest();
  const serviceKey = createHmac("sha256", regionKey).update("ark").digest();
  const signingKey = createHmac("sha256", serviceKey).update("request").digest();
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const timeout = AbortSignal.timeout(30000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const isWrite = parsedAction.data === "CreateVisualValidateSession" || parsedAction.data === "CreateAsset";
  const uncertain = isWrite ? "，提交结果可能未知，请先在方舟控制台确认" : "";
  let response: Response;
  try {
    response = await fetch(`https://${host}/?${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Content-Sha256": payloadHash,
        "X-Date": date,
        Authorization: `HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body: payload,
      signal: requestSignal,
      redirect: "error",
    });
  } catch {
    throw new Error(`火山方舟素材请求${requestSignal.aborted ? "已取消或超时" : "网络异常"}${uncertain}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (requestSignal.aborted) throw new Error(`火山方舟素材请求已取消或超时${uncertain}`);
  }
  const parsedResponse = responseSchema.safeParse(data);
  const responseError = parsedResponse.success ? parsedResponse.data.ResponseMetadata?.Error : undefined;
  if (!response.ok || responseError != null) {
    const message = safeErrorMessage(responseError, parsedConfig.data);
    throw new Error(`火山方舟素材请求失败（HTTP ${response.status}）${message ? `：${message}` : ""}${uncertain}`);
  }
  const result = z.record(z.string(), z.unknown()).safeParse(parsedResponse.success ? parsedResponse.data.Result : undefined);
  if (!result.success) throw new Error(`火山方舟素材响应格式无效${uncertain}`);
  return result.data;
}
