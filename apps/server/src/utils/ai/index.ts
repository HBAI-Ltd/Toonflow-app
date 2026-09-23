import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { openAIResponsesApi } from "@earendil-works/pi-ai/api/openai-responses.lazy";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import { getBuiltinModels, getBuiltinProviders } from "@earendil-works/pi-ai/providers/all";
import type { Context, Model } from "@earendil-works/pi-ai";
import { z } from "zod";
import conf from "@/utils/conf";
import { readReference } from "@/utils/media/generation";
import modelContextLimits from "@/utils/ai/modelContextLimits";

export { fetchProviderModels } from "@/utils/ai/models";

export const providerSchema = z.object({
  apiUrl: z.url({ protocol: /^https?$/ }),
  apiKey: z.string(),
  protocol: z.enum(["openai-completions", "openai-responses", "anthropic-messages"]),
  models: z.array(z.object({
    id: z.string(), label: z.string(),
    contextWindow: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
  })),
});

const builtinModels = getBuiltinProviders().flatMap(provider => getBuiltinModels(provider));

export function getModelLimits(providerId: string, model: z.infer<typeof providerSchema>["models"][number]) {
  const limits = modelContextLimits.find(item => item.id === model.id)
    ?? modelContextLimits.find(item => item.id instanceof RegExp && model.id.search(item.id) !== -1);
  if (limits) return { contextWindow: limits.contextWindow, maxTokens: limits.maxTokens };
  if (model.contextWindow != null && model.maxOutputTokens != null) {
    return { contextWindow: model.contextWindow, maxTokens: model.maxOutputTokens };
  }
  const matches = builtinModels.filter(item => item.id === model.id);
  const exact = matches.find(item => item.provider === providerId);
  const candidates = exact ? [exact] : matches;
  // ACT: 只精确匹配 ID；跨供应商同名参数逐项一致才采用，不猜别名。
  const contextWindow = candidates.every(item => item.contextWindow === candidates[0]?.contextWindow) ? candidates[0]?.contextWindow : undefined;
  const maxTokens = candidates.every(item => item.maxTokens === candidates[0]?.maxTokens) ? candidates[0]?.maxTokens : undefined;
  return {
    contextWindow: model.contextWindow ?? contextWindow ?? 262144,
    maxTokens: model.maxOutputTokens ?? maxTokens ?? 32768,
  };
}

export function getConfiguredModel(providerId: string, modelId: string) {
  const providers = conf.get("settings", {}).customProviders;
  const parsed = providerSchema.safeParse(Array.isArray(providers) ? providers.find(item => item?.id === providerId) : undefined);
  if (!parsed.success) throw Object.assign(new Error("请先在设置中配置模型供应商"), { status: 400 });
  const provider = parsed.data;
  const model = provider.models.find(item => item.id === modelId);
  if (!model) throw Object.assign(new Error("所选模型不存在，请重新选择"), { status: 400 });
  const baseUrl = new URL(provider.apiUrl);
  if (baseUrl.pathname === "/") baseUrl.pathname = "/v1";
  const limits = getModelLimits(providerId, model);
  return { provider, model: { ...model, contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens }, baseUrl: baseUrl.href.replace(/\/+$/, "") };
}

export function listAiModels() {
  const providers = conf.get("settings", {}).customProviders;
  if (!Array.isArray(providers)) return [];
  return providers.flatMap(item => {
    const parsed = providerSchema.extend({ id: z.string().min(1), label: z.string() }).safeParse(item);
    if (!parsed.success) return [];
    const provider = parsed.data;
    return provider.models.filter(model => model.id.trim()).map(model => {
      const limits = getModelLimits(provider.id, model);
      return {
        providerId: provider.id, providerLabel: provider.label, protocol: provider.protocol, modelId: model.id, label: model.label,
        contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens,
      };
    });
  });
}

const aiApis = {
  "openai-completions": openAICompletionsApi(),
  "openai-responses": openAIResponsesApi(),
  "anthropic-messages": anthropicMessagesApi(),
};

export const aiReferenceSchema = z.discriminatedUnion("dataType", [
  z.object({ dataType: z.literal("STRING"), value: z.string().max(1000000) }),
  z.object({ dataType: z.literal("IMAGE"), value: z.object({ url: z.string().min(1).max(4096), mimeType: z.string().startsWith("image/") }) }),
  z.object({ dataType: z.literal("VIDEO"), value: z.object({ url: z.string().min(1).max(4096), mimeType: z.string().startsWith("video/") }) }),
]);

export async function readAiReferences(directory: string | undefined, references: z.infer<typeof aiReferenceSchema>[], signal?: AbortSignal) {
  return Promise.all(references.map(async (item) => {
    if (item.dataType === "STRING") return { dataType: item.dataType, value: item.value };
    if (!directory) throw Object.assign(new Error("媒体参考需要工作目录"), { status: 400 });
    const media = await readReference(directory, { path: item.value.url, mimeType: item.value.mimeType }, item.dataType.toLowerCase(), signal);
    return { dataType: item.dataType, value: `data:${media.mimeType};base64,${media.data}` };
  }));
}

export function referenceContent(protocol: string, prompt: string, references: Awaited<ReturnType<typeof readAiReferences>>) {
  const textPart = (text: string) => ({ type: protocol === "openai-responses" ? "input_text" : "text", text });
  const content: object[] = [textPart(prompt)];
  references.forEach((item, index) => {
    content.push(textPart(`{{ref ${index + 1}}}${item.dataType === "STRING" ? `\n${item.value}` : ""}`));
    if (item.dataType === "STRING") return;
    if (protocol === "openai-completions") {
      content.push(item.dataType === "IMAGE"
        ? { type: "image_url", image_url: { url: item.value } }
        : { type: "video_url", video_url: { url: item.value } });
    } else if (protocol === "openai-responses") {
      const extension = item.value.slice(11, item.value.indexOf(";")).replace("quicktime", "mov");
      content.push(item.dataType === "IMAGE"
        ? { type: "input_image", image_url: item.value, detail: "auto" }
        : { type: "input_file", filename: `reference${index + 1}.${extension}`, file_data: item.value });
    } else {
      const separator = item.value.indexOf(",");
      content.push({
        type: item.dataType === "IMAGE" ? "image" : "document",
        source: { type: "base64", media_type: item.value.slice(5, item.value.indexOf(";")), data: item.value.slice(separator + 1) },
      });
    }
  });
  return content;
}

export function streamAi(
  configured: ReturnType<typeof getConfiguredModel>,
  context: Context,
  signal: AbortSignal,
  references: Awaited<ReturnType<typeof readAiReferences>> = [],
) {
  const { provider, model: configuredModel, baseUrl } = configured;
  const model: Model<typeof provider.protocol> = {
    id: configuredModel.id, name: configuredModel.label, provider: "toonflow", api: provider.protocol, baseUrl,
    reasoning: false, input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: configuredModel.contextWindow,
    maxTokens: configuredModel.maxOutputTokens,
  };
  // ACT: 不按模型名预判附件能力；按供应商协议传递，是否支持由上游接口决定。
  return aiApis[provider.protocol].streamSimple(model, context, {
    apiKey: provider.apiKey,
    signal,
    onPayload: references.length ? (payload) => {
      const body = payload as Record<string, unknown>;
      const field = provider.protocol === "openai-responses" ? "input" : "messages";
      const messages = body[field] as { role: string; content: unknown }[];
      // ACT: 后续 Anthropic 工具结果也使用 user 角色，附件只补充到最初的输入。
      const firstUser = messages.findIndex(message => message.role === "user");
      const attachmentContent = referenceContent(provider.protocol, "", references).slice(1);
      return { ...body, [field]: messages.map((message, index) => index === firstUser
        ? { ...message, content: [
          ...(Array.isArray(message.content) ? message.content : referenceContent(provider.protocol, String(message.content ?? ""), [])),
          ...attachmentContent,
        ] }
        : message) };
    } : undefined,
  });
}
