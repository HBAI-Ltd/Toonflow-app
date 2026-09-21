import { z } from "zod";
import { loadMediaProviderSource } from "@/utils/media/provider";

export const providerDebugSchema = {
  source: z.string().min(1).max(2 * 1024 * 1024),
  config: z.record(z.string(), z.json()).default({}),
};

export async function inspectProviderSource(source: string) {
  const provider = await loadMediaProviderSource(source);
  return {
    id: provider.id,
    label: provider.label,
    rules: provider.rules ?? [],
    models: provider.models.filter(model => ["image", "video", "audio"].includes(model.type)),
  };
}

export async function runProviderSource(
  source: string,
  config: Record<string, unknown>,
  request: Record<string, unknown>,
  signal: AbortSignal,
  send: (event: Record<string, unknown>) => void,
) {
  const startedAt = performance.now();
  const secretFields = /api.?key|secret|token|password|authorization|cookie/i;
  const secrets = Object.entries(config).filter(([key, value]) => secretFields.test(key) && typeof value === "string" && value)
    .map(([, value]) => value as string);
  function redact(value: unknown) {
    let text = typeof value === "string" ? value : JSON.stringify(value, (key, item) => {
      if (secretFields.test(key)) return "••••••";
      if (typeof item === "string" && item.length > 4000) return `[${item.length} 个字符]`;
      return item;
    }, 2) ?? "";
    for (const secret of secrets) text = text.replaceAll(secret, "••••••");
    return text.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••")
      .replace(/([?&](?:api.?key|token|secret|password|signature)=)[^&\s"']*/gi, "$1••••••")
      .slice(0, 16000);
  }
  function bodyText(body: unknown) {
    if (typeof body !== "string") return body ? "[二进制或表单请求体]" : "";
    if (body.length > 1024 * 1024) return `[请求体 ${body.length} 个字符]`;
    try { return redact(JSON.parse(body)); }
    catch { return redact(body); }
  }
  let requestId = 0;
  const fetchRequest = Object.assign(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(String(input), init);
    const id = ++requestId;
    if (id > 200) return fetch(request);
    const start = performance.now();
    const log = { id, method: request.method, url: redact(request.url), request: [redact(Object.fromEntries(request.headers)), bodyText(init?.body)].filter(Boolean).join("\n") };
    // ACT: 日志最多展示 200 次请求和 16 KB 响应正文，避免轮询和媒体数据撑满调试界面。
    const report = (data: Record<string, unknown>) => { send({ type: "log", log: { ...log, ...data } }); };
    report({ state: "running" });
    try {
      const response = await fetch(request);
      let body = "";
      if (/json|text\/plain/i.test(response.headers.get("content-type") ?? "") && response.body) {
        const reader = response.clone().body!.getReader();
        const decoder = new TextDecoder();
        try {
          let size = 0;
          while (size < 16000) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            body += decoder.decode(value.subarray(0, Math.max(0, 16000 - (size - value.byteLength))), { stream: true });
          }
          body += decoder.decode();
          if (size >= 16000) body += "\n…响应已截断";
        } finally { void reader.cancel().catch(() => {}); }
      }
      report({ state: response.ok ? "success" : "error", status: response.status, duration: Math.round(performance.now() - start), response: bodyText(body) });
      return response;
    } catch (error) {
      report({ state: "error", duration: Math.round(performance.now() - start), error: redact(error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }, { preconnect: fetch.preconnect }) as typeof fetch;

  try {
    const provider = await loadMediaProviderSource(source, config, signal, fetchRequest);
    for (const [key, value] of Object.entries(provider.config)) if (secretFields.test(key) && typeof value === "string" && value && !secrets.includes(value)) secrets.push(value);
    const model = provider.models.find(model => model.id === request.model);
    if (!model) throw new Error("模型已变更，请重新选择模型");
    const method = model.type === "image" ? provider.generateImage : model.type === "video" ? provider.generateVideo : model.type === "audio" ? provider.generateAudio : undefined;
    if (!method) throw new Error("供应商没有实现此模型的媒体生成方法");
    const prompt = request[model.type === "audio" ? "text" : "prompt"];
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error("请输入提示词");
    const assets = await method.call(provider, request as unknown as ImageRequest & VideoRequest & AudioRequest);
    signal.throwIfAborted();
    if (!Array.isArray(assets) || !assets.length) throw new Error("供应商未返回媒体数组");
    let size = 0;
    const result = assets.map(asset => {
      if (!asset || asset.mediaType !== model.type) throw new Error("返回的媒体类型与模型不一致");
      if (asset.type === "url") {
        if (!/^https?:\/\//i.test(asset.url)) throw new Error("媒体结果需要 HTTP 或 HTTPS 地址");
        return asset;
      }
      let data: string;
      if (asset.type === "binary" && ArrayBuffer.isView(asset.data) && asset.data.BYTES_PER_ELEMENT === 1) data = Buffer.from(asset.data).toString("base64");
      else if (asset.type === "base64" && typeof asset.data === "string") data = asset.data.replace(/^data:[^;,]+;base64,/, "").replace(/\s/g, "");
      else throw new Error("媒体结果格式无效");
      size += data.length;
      if (size > 44 * 1024 * 1024) throw new Error("调试预览的媒体总量不能超过 32 MB");
      if (!data || !/^[a-zA-Z0-9+/]*={0,2}$/.test(data) || data.length % 4 === 1 || !asset.mimeType?.startsWith(`${model.type}/`)) throw new Error("媒体编码或 MIME 类型无效");
      return { mediaType: asset.mediaType, type: "base64" as const, data, mimeType: asset.mimeType };
    });
    send({ type: "result", assets: result, response: redact(result), duration: Math.round(performance.now() - startedAt) });
  } catch (error) {
    send({ type: "error", message: redact(error instanceof Error ? error.message : String(error)), duration: Math.round(performance.now() - startedAt) });
  }
}
