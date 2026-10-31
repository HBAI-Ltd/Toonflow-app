import { t } from "@/lib/i18n";
import { z } from "zod";

const modelSchema = z.object({
  id: z.string().optional(), name: z.string().optional(),
  display_name: z.string().optional(), displayName: z.string().optional(),
  inputTokenLimit: z.number().int().positive().optional(),
  outputTokenLimit: z.number().int().positive().optional(),
});

export async function fetchProviderModels({ apiUrl, protocol, apiKey, signal }: { apiUrl: string; protocol: string; apiKey: string; signal?: AbortSignal }) {
  const url = new URL(apiUrl);
  if (url.pathname === "/") url.pathname = "/v1";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/models`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (protocol === "anthropic-messages") {
    headers["anthropic-version"] = "2023-06-01";
    headers["x-api-key"] = apiKey;
    url.searchParams.set("limit", "1000");
  } else if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const models = new Map<string, { id: string; label: string; contextWindow?: number; maxOutputTokens?: number }>();
  const cursors = new Set<string>();
  const timeoutSignal = AbortSignal.timeout(30000);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  while (true) {
    const response = await fetch(url, { headers, signal: requestSignal, redirect: "error" });
    if (!response.ok) throw new Error(t`模型列表获取失败（HTTP ${response.status}），请检查 API 地址、连接协议和密钥是否正确。`);
    const result = z.object({
      data: z.array(modelSchema),
      has_more: z.boolean().optional(), last_id: z.string().nullable().optional(),
    }).parse(await response.json());
    const items = result.data;
    for (const item of items) {
      const id = item.id?.trim();
      if (!id) throw new Error("获取到的模型列表包含无效的模型 ID，无法正常加载。");
      models.set(id, { id, label: item.display_name || item.displayName || id, contextWindow: item.inputTokenLimit, maxOutputTokens: item.outputTokenLimit });
    }
    const cursor = protocol === "anthropic-messages" && result.has_more ? result.last_id : undefined;
    if (protocol === "anthropic-messages" && result.has_more && !cursor) throw new Error("模型列表缺少分页游标，无法继续获取后续模型。");
    if (!cursor) break;
    if (cursors.has(cursor)) throw new Error("模型列表返回了重复的分页游标，已停止获取后续模型。");
    cursors.add(cursor);
    url.searchParams.set("after_id", cursor);
  }
  return [...models.values()];
}
