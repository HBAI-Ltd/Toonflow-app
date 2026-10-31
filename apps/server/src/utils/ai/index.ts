import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { openAIResponsesApi } from "@earendil-works/pi-ai/api/openai-responses.lazy";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import { getBuiltinModels, getBuiltinProviders } from "@earendil-works/pi-ai/providers/all";
import { getSupportedThinkingLevels, type Context, type KnownApi, type Model, type ThinkingLevelMap } from "@earendil-works/pi-ai";
import { defaultThinkingLevels, thinkingLevels, type ThinkingLevel } from "@/lib/modelReasoning";
import { z } from "zod";
import conf from "@/utils/conf";
import { readReference } from "@/utils/media/generation";
import { findModelContextLimits } from "@/utils/ai/modelContextLimits";
import { createFileTransport, getUnsupportedFileText, type FileProvider } from "@/utils/ai/files";
import { getRequestFiles } from "@/utils/ai/requestFiles";
import { readFile, stat } from "@toonflow/file";
import { resolveWorkspacePath } from "@/utils/workspace/files";
import { getReadableFileMimeType } from "@/lib/documentFormats";
import { readDocument } from "@/utils/documents";

export { fetchProviderModels } from "@/utils/ai/models";

export const reasoningEffortsSchema = z.union([
  z.literal(false),
  z.partialRecord(z.enum(thinkingLevels), z.string().min(1).refine(value => value.trim() === value, "接口值不能包含首尾空白").nullable())
    .refine(value => Object.entries(value).every(([level, wire]) => level === "off" || typeof wire === "string"), "仅关闭档位可省略接口值")
    .refine(value => Object.keys(value).some(level => level !== "off"), "请至少声明一个推理档位"),
]);

export const providerSchema = z.object({
  apiUrl: z.url({ protocol: /^https?$/ }),
  apiKey: z.string(),
  protocol: z.enum(["openai-completions", "openai-responses", "anthropic-messages"]),
  maxRequestImageBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  maxRequestBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  models: z.array(z.object({
    id: z.string(), label: z.string(),
    contextWindow: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    reasoningEfforts: reasoningEffortsSchema.optional(),
  })),
});

export const accountProviderSchema = providerSchema.extend({
  id: z.enum(["Toonflow", "toonflow"]), label: z.string().min(1), apiKey: z.literal(""),
  token: z.string().trim().min(1).max(16384).optional(),
  icon: z.string().optional(), version: z.string().optional(),
});

export function getAccountToken() {
  const account = conf.get("settings", {}).toonflowAccount as { token?: unknown } | null | undefined;
  return typeof account?.token === "string" ? account.token.trim() : "";
}

export function getAccountProvider() {
  const accountToken = getAccountToken();
  const parsed = accountProviderSchema.safeParse(conf.get("settings", {}).toonflowProvider);
  return accountToken && parsed.success && parsed.data.token ? { ...parsed.data, apiKey: parsed.data.token } : undefined;
}

export function getConfiguredProviders() {
  const providers = conf.get("settings", {}).customProviders;
  const account = getAccountProvider();
  return [...(account ? [account] : []), ...(Array.isArray(providers) ? providers.filter(item => typeof item?.id !== "string" || item.id.toLowerCase() !== "toonflow") : [])];
}

const builtinModels: Model<KnownApi>[] = getBuiltinProviders().flatMap(provider => getBuiltinModels(provider));

export function getModelReasoning(providerId: string, model: z.infer<typeof providerSchema>["models"][number], protocol: string) {
  const matches = builtinModels.filter(item => item.id === model.id);
  const base = matches.find(item => item.provider.toLowerCase() === providerId.toLowerCase() && item.api === protocol);
  const candidates = base ? [base] : matches;
  const efforts = model.reasoningEfforts;
  const supported = candidates.map(item => item.reasoning ? getSupportedThinkingLevels(item) : []);
  const wireValue = (item: Model<KnownApi>, level: ThinkingLevel) => item.thinkingLevelMap?.[level] ?? (level === "off" ? undefined : level);
  // ACT: 中转站仅继承同 ID 模型共同支持且接口值一致的档位，不猜别名或取能力全集。
  const inheritedLevels: ThinkingLevel[] = candidates.length
    ? thinkingLevels.filter(level => candidates.every((item, index) => supported[index]!.includes(level)
      && wireValue(item, level) === wireValue(candidates[0]!, level)))
    // ACT: 目录未知不等于禁用，保留旧版低中高；额外档位由模型显式声明。
    : [...defaultThinkingLevels];
  const reasoningLevels = efforts === false ? [] : efforts
    ? thinkingLevels.filter(level => Object.hasOwn(efforts, level))
    : inheritedLevels;
  const reasoning = reasoningLevels.length > 0;
  const thinkingLevelMap: ThinkingLevelMap = {};
  for (const level of thinkingLevels) {
    if (!reasoningLevels.includes(level)) { thinkingLevelMap[level] = null; continue; }
    const wire = efforts ? efforts[level] : candidates[0] ? wireValue(candidates[0], level) : level;
    if (wire != null) thinkingLevelMap[level] = wire;
  }
  // ACT: 显式接口值声明使用 Anthropic effort 协议，避免 SDK 将映射值改为 token 预算。
  const compat = protocol === "anthropic-messages" && efforts
    ? { ...base?.compat, forceAdaptiveThinking: true, supportsMidConvoEffort: false }
    : base?.compat;
  return { reasoning, thinkingLevelMap, reasoningLevels, compat };
}

export function getModelLimits(providerId: string, model: z.infer<typeof providerSchema>["models"][number]) {
  const limits = findModelContextLimits(model.id);
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
  const parsed = providerSchema.safeParse(getConfiguredProviders().find(item => item?.id === providerId));
  if (!parsed.success) throw Object.assign(new Error("请先在设置中配置模型供应商"), { status: 400 });
  const provider = parsed.data;
  const model = provider.models.find(item => item.id === modelId);
  if (!model) throw Object.assign(new Error("所选模型不存在，请重新选择"), { status: 400 });
  const baseUrl = new URL(provider.apiUrl);
  if (baseUrl.pathname === "/") baseUrl.pathname = "/v1";
  const limits = getModelLimits(providerId, model);
  return { provider, model: { ...model, ...getModelReasoning(providerId, model, provider.protocol), contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens }, baseUrl: baseUrl.href.replace(/\/+$/, "") };
}

export function listAiModels() {
  return getConfiguredProviders().flatMap(item => {
    const parsed = providerSchema.extend({ id: z.string().min(1), label: z.string() }).safeParse(item);
    if (!parsed.success) return [];
    const provider = parsed.data;
    return provider.models.filter(model => model.id.trim()).map(model => {
      const limits = getModelLimits(provider.id, model);
      return {
        providerId: provider.id, providerLabel: provider.label, protocol: provider.protocol, modelId: model.id, label: model.label,
        contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens,
        reasoningLevels: getModelReasoning(provider.id, model, provider.protocol).reasoningLevels,
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
  z.object({ dataType: z.literal("FILE"), value: z.object({ url: z.string().min(1).max(4096), mimeType: z.string().min(1).max(128) }) }),
]);

export async function readAiReferences(
  directory: string | undefined,
  references: z.infer<typeof aiReferenceSchema>[],
  signal?: AbortSignal,
  provider?: FileProvider,
) {
  return Promise.all(references.map(async (item) => {
    signal?.throwIfAborted();
    if (item.dataType === "STRING") return { dataType: item.dataType, value: item.value };
    if (!directory) throw Object.assign(new Error("文件参考需要工作目录"), { status: 400 });
    if (item.dataType === "FILE") {
      if (!getReadableFileMimeType(item.value.url, item.value.mimeType)) throw Object.assign(new Error("不支持此参考文件格式"), { status: 400 });
      const { path } = await resolveWorkspacePath(directory, item.value.url);
      const info = await stat(path);
      if (!info.isFile() || info.size > 100 * 1024 * 1024) throw Object.assign(new Error("参考文档须为不超过 100 MB 的文件"), { status: 400 });
      const content = await readDocument(item.value.url, await readFile(path, { signal }), item.value.mimeType);
      signal?.throwIfAborted();
      return { dataType: "STRING" as const, value: `参考文档：${item.value.url}\n${content.toString("utf8")}` };
    }
    const unsupported = provider && getUnsupportedFileText(provider, { path: item.value.url, mimeType: item.value.mimeType });
    if (unsupported) return { dataType: "STRING" as const, value: unsupported };
    const media = await readReference(directory, { path: item.value.url, mimeType: item.value.mimeType }, item.dataType.toLowerCase(), signal);
    return { dataType: item.dataType, value: `data:${media.mimeType};base64,${media.data}` };
  }));
}

export function referenceContent(protocol: string, prompt: string, references: Awaited<ReturnType<typeof readAiReferences>>, referenceOffset = 0) {
  const textPart = (text: string) => ({ type: protocol === "openai-responses" ? "input_text" : "text", text });
  const content: object[] = [textPart(prompt)];
  references.forEach((item, index) => {
    content.push(textPart(`{{ref ${referenceOffset + index + 1}}}${item.dataType === "STRING" ? `\n${item.value}` : ""}`));
    if (item.dataType === "STRING") return;
    if (protocol === "openai-completions") {
      content.push(item.dataType === "IMAGE"
        ? { type: "image_url", image_url: { url: item.value } }
        : { type: "video_url", video_url: { url: item.value } });
    } else if (protocol === "openai-responses") {
      const extension = item.value.slice(11, item.value.indexOf(";")).replace("quicktime", "mov");
      content.push(item.dataType === "IMAGE"
        ? { type: "input_image", image_url: item.value, detail: "auto" }
        : { type: "input_file", filename: `reference${referenceOffset + index + 1}.${extension}`, file_data: item.value });
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
  const files = createFileTransport({ ...provider, apiUrl: baseUrl }, { signal });
  return aiApis[provider.protocol].streamSimple(model, context, {
    apiKey: provider.apiKey,
    signal,
    // 此入口没有 AgentSession，仅重试尚未交付响应的请求，已输出的流不能直接拼接重放。
    maxRetries: 3,
    fetch: files.fetch,
    onPayload: async (payload) => {
      let body = payload as Record<string, unknown>;
      if (references.length) {
        const field = provider.protocol === "openai-responses" ? "input" : "messages";
        const messages = body[field] as { role: string; content: unknown }[];
        // ACT: 后续 Anthropic 工具结果也使用 user 角色，附件只补充到最初的输入。
        const firstUser = messages.findIndex(message => message.role === "user");
        const attachmentContent = referenceContent(provider.protocol, "", references).slice(1);
        body = { ...body, [field]: messages.map((message, index) => index === firstUser
          ? { ...message, content: [
            ...(Array.isArray(message.content) ? message.content : referenceContent(provider.protocol, String(message.content ?? ""), [])),
            ...attachmentContent,
          ] }
          : message) };
      }
      await files.prepare(body);
      const imageBytes = getRequestFiles(body).filter(file => file.mimeType.toLowerCase().startsWith("image/")).reduce((sum, file) => sum + file.inlineBytes, 0);
      if (imageBytes > (provider.maxRequestImageBytes ?? 20 * 1024 * 1024)
        || Buffer.byteLength(JSON.stringify(body), "utf8") > (provider.maxRequestBytes ?? 32 * 1024 * 1024)) {
        throw new Error("模型请求超过附件或请求体字节预算，请减少附件或上下文后重试");
      }
      return body;
    },
  });
}
