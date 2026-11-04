import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { openAIResponsesApi } from "@earendil-works/pi-ai/api/openai-responses.lazy";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import type { AssistantMessage, Context, Model } from "@earendil-works/pi-ai";
import { z } from "zod";
import { readReference } from "@/utils/media/generation";
import { createFileTransport, getUnsupportedFileText, type FileProvider } from "@/utils/ai/files";
import { getRequestFiles } from "@/utils/ai/requestFiles";
import { readFile, stat } from "@toonflow/file";
import { resolveWorkspacePath } from "@/utils/workspace/files";
import { getReadableFileMimeType } from "@/lib/documentFormats";
import { readDocument } from "@/utils/documents";
import { getConfiguredProviders, getModelLimits, getModelReasoning, getProviderBaseUrl, providerSchema } from "@/utils/ai/provider";
import { modelGateway, requireDirectModelAccess } from "@/utils/multiTenant/gateway";
import { createBillingUsageTracker } from "@/utils/ai/billingUsage";

export { fetchProviderModels } from "@/utils/ai/models";
export { accountProviderSchema, getAccountProvider, getAccountToken, getConfiguredProviders, getModelLimits, getModelReasoning, providerSchema, reasoningEffortsSchema } from "@/utils/ai/provider";

export async function getConfiguredModel(providerId: string, modelId: string) {
  const execution = modelGateway.enabled() ? await modelGateway.resolve("text", providerId, modelId) : undefined;
  const resolved = execution?.upstream;
  const parsed = providerSchema.safeParse(resolved?.provider ?? getConfiguredProviders().find(item => item?.id === providerId));
  if (!parsed.success) {
    const official = providerId.toLowerCase() === "toonflow";
    throw Object.assign(new Error(official ? "请先登录 Toonflow 账号并刷新供应商" : "请先在设置中配置模型供应商"), { status: official ? 401 : 400 });
  }
  const provider = parsed.data;
  const model = resolved?.model ?? provider.models.find(item => item.id === modelId);
  if (!model) throw Object.assign(new Error("所选模型不存在，请重新选择"), { status: 400 });
  const baseUrl = getProviderBaseUrl(provider.apiUrl, provider.protocol);
  const upstreamProviderId = execution?.route.providerId ?? providerId;
  const limits = getModelLimits(upstreamProviderId, model);
  return {
    provider,
    model: { ...model, label: execution?.route.label ?? model.label, ...getModelReasoning(upstreamProviderId, model, provider.protocol), contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens },
    baseUrl, execution, route: execution?.route, revision: execution?.revision, publicProviderId: providerId, publicModelId: modelId,
  };
}

export type ConfiguredModel = Awaited<ReturnType<typeof getConfiguredModel>>;

export async function listAiModels() {
  if (modelGateway.enabled()) return modelGateway.catalog(["text"]);
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

export function publicAiMessage(configured: ConfiguredModel, message: AssistantMessage, usageKnown = true) {
  if (!configured.route) return message;
  const priceQuote = usageKnown && configured.execution ? modelGateway.quote(configured.execution, message.usage) : undefined;
  return {
    role: message.role, content: message.content, api: message.api,
    provider: configured.publicProviderId, model: configured.publicModelId,
    usage: {
      input: message.usage.input, output: message.usage.output, cacheRead: message.usage.cacheRead,
      cacheWrite: message.usage.cacheWrite, totalTokens: message.usage.totalTokens,
      // ACT: SDK cost 默认按美元解释；平台报价单独携带币种和精确金额，不将它伪装成上游 cost 或结算记录。
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: message.stopReason, timestamp: message.timestamp,
    ...(message.providerThinkingLevel === undefined ? {} : { providerThinkingLevel: message.providerThinkingLevel }),
    usageKnown,
    modelRouteRevision: configured.revision,
    ...(message.errorMessage ? { errorMessage: "模型请求失败，请稍后重试" } : {}),
    ...(priceQuote ? { priceQuote: { ...priceQuote, routeRevision: configured.revision } } : {}),
  };
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
  configured: ConfiguredModel,
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
  const usageTracker = createBillingUsageTracker(provider.protocol);
  const files = createFileTransport({ ...provider, apiUrl: baseUrl }, {
    signal, ...(configured.route ? { fetch: usageTracker.fetch(globalThis.fetch) } : {}),
  });
  const requestContext = configured.route ? {
    ...context,
    messages: context.messages.map(message => message.role === "assistant"
      && message.provider === configured.publicProviderId && message.model === configured.publicModelId
      && (message as AssistantMessage & { modelRouteRevision?: unknown }).modelRouteRevision === configured.revision
      // ACT: 对外只留逻辑身份；同一路由版本进入 SDK 时恢复内部身份，避免工具循环误判跨模型而丢弃推理签名。
      ? { ...message, provider: model.provider, model: model.id } : message),
  } : context;
  const stream = aiApis[provider.protocol].streamSimple(model, requestContext, {
    apiKey: provider.apiKey,
    headers: provider.headers,
    signal,
    ...(configured.route ? { maxTokens: configuredModel.maxOutputTokens } : {}),
    // 此入口没有 AgentSession，仅重试尚未交付响应的请求，已输出的流不能直接拼接重放。
    maxRetries: configured.route ? 0 : 3,
    fetch: Object.assign((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      if (!configured.execution) requireDirectModelAccess();
      return files.fetch(input, init);
    }, files.fetch),
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
  return Object.assign(stream, {
    billingUsage: usageTracker.usage,
    upstreamSubmitted: usageTracker.submitted,
    upstreamRejected: usageTracker.rejected,
  });
}
