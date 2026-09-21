import { onScopeDispose } from "vue";
import { runAgentLoop, type AgentTool, type AgentToolResult } from "@earendil-works/pi-agent-core";
import { createAssistantMessageEventStream, type AssistantMessage, type Context, type Message, type Model } from "@earendil-works/pi-ai";
import { EventSourceParserStream } from "eventsource-parser/stream";
import type { MediaGenerationRequest, MediaModel } from "@toonflow/tools-scaffold/runtime";
import type { NodeOutput } from "./values";

export type NodeAiModel = {
  providerId: string;
  providerLabel: string;
  modelId: string;
  label: string;
  protocol: "openai-completions" | "openai-responses" | "anthropic-messages";
  contextWindow?: number;
  maxOutputTokens?: number;
};
export type NodeMediaModel = Omit<MediaModel, "mode"> & {
  mode?: (string | string[])[];
};
export type NodeImageRequest = {
  directory: string;
  providerId: string;
  modelId: string;
  prompt: string;
  outputDirectory: string;
  images?: { path: string; mimeType: string }[];
  ratio?: string;
  size?: string;
};
export type NodeImageResult = { path: string; mimeType: string; mediaType: "image" };
export type NodeVideoRequest = Omit<MediaGenerationRequest, "size"> & { directory: string; outputDirectory: string };
export type NodeVideoResult = { path: string; mimeType: string; mediaType: "video" };
export type NodeAiRequest = {
  providerId: string;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  directory?: string;
  references?: Extract<NodeOutput, { dataType: "STRING" | "IMAGE" | "VIDEO" }>[];
  tools?: NodeAiTool[];
  onEvent?: (event: NodeAiEvent) => void;
  signal?: AbortSignal;
};
export type NodeAiResult = {
  text: string;
  reasoning?: string;
};
export type NodeAiEvent = { type: "text" | "reasoning"; delta: string }
  | { type: "toolStart"; id: string; name: string; args: unknown }
  | { type: "toolEnd"; id: string; name: string; result: unknown; isError: boolean };
export type NodeAiTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, signal?: AbortSignal): unknown | Promise<unknown>;
};

export function groupNodeModels<T extends Pick<NodeAiModel, "providerId" | "providerLabel">>(models: readonly T[]) {
  return [...Map.groupBy(models, item => item.providerId)].map(([id, items]) => ({
    id, label: items[0]!.providerLabel, models: items,
  })).sort((left, right) => Number(right.id === "tfRouter") - Number(left.id === "tfRouter"));
}

async function readResult<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || result.code !== 200) throw new Error(result.message || `AI 请求失败（HTTP ${response.status}）`);
  return result.data;
}

// ACT: 独立 UMD 各有模块作用域，共用宿主缓存；模型设置保存后失效，不按节点重复请求。
const modelCacheKey = Symbol.for("toonflow.nodeModels");
const modelCacheHost = globalThis as typeof globalThis & { [modelCacheKey]?: Map<string, Promise<unknown[]>> };
const modelCache = modelCacheHost[modelCacheKey] ??= new Map<string, Promise<unknown[]>>();

export function invalidateNodeModels(type: "language" | "media") {
  modelCache.delete(type === "language" ? "/api/ai/models" : "/api/ai/media/models");
}

async function readModels<T>(url: string, signal: AbortSignal): Promise<T[]> {
  signal.throwIfAborted();
  let pending = modelCache.get(url);
  if (!pending) {
    const request = fetch(url, { cache: "no-store" }).then(readResult<unknown[]>).catch(error => {
      if (modelCache.get(url) === request) modelCache.delete(url);
      throw error;
    });
    pending = request;
    modelCache.set(url, request);
  }
  // 单个节点关闭只取消自己的等待，不能中断其他节点共用的请求。
  let cancel = () => {};
  try {
    const models = await Promise.race([
      pending,
      new Promise<never>((_resolve, reject) => {
        cancel = () => reject(signal.reason);
        signal.addEventListener("abort", cancel, { once: true });
      }),
    ]);
    signal.throwIfAborted();
    return modelCache.get(url) === pending ? models as T[] : readModels<T>(url, signal);
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}

async function requestModel(input: NodeAiRequest, context: Context, model: Model<NodeAiModel["protocol"]>, signal: AbortSignal) {
  const { providerId, modelId, references, directory, onEvent } = input;
  const stream = createAssistantMessageEventStream();
  try {
    signal.throwIfAborted();
    const response = await fetch("/api/ai/generate", {
      method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ providerId, modelId, context, directory, references }), signal,
    });
    if (!response.ok) await readResult(response);
    if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("AI 未返回 SSE 数据流");
    const reader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        signal.throwIfAborted();
        if (done) throw new Error("AI 数据流提前结束，请重试");
        const event = JSON.parse(value.data);
        if (event.type === "error") throw new Error(event.message || "AI 生成失败");
        if (event.type === "text" || event.type === "reasoning") onEvent?.(event);
        if (event.type !== "done") continue;
        const message = event.message as AssistantMessage;
        if (message?.role !== "assistant" || !Array.isArray(message.content)) throw new Error("AI 返回消息不完整，请确认服务端已更新");
        if (message.stopReason === "deferred" || message.stopReason === "pending") throw new Error("AI 返回了未完成的任务");
        if (message.stopReason === "error" || message.stopReason === "aborted") throw new Error(message.errorMessage || "AI 请求失败");
        // ACT: 增量直接通知 UI；SDK 只消费完整单轮消息，避免每个 token 传输全量快照。
        stream.push({ type: "start", partial: { ...message, content: [], stopReason: "pending" } });
        stream.push({ type: "done", reason: message.stopReason, message });
        break;
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } catch (error) {
    const reason = signal.aborted ? "aborted" : "error";
    stream.push({ type: "error", reason, error: {
      role: "assistant", content: [], api: model.api, provider: model.provider, model: model.id, timestamp: Date.now(),
      stopReason: reason, errorMessage: error instanceof Error ? error.message : "AI 请求失败",
      usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    } });
  }
  return stream;
}

export function useNodeAi() {
  const controller = new AbortController();
  onScopeDispose(() => controller.abort());
  const requestSignal = (signal?: AbortSignal) => signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;

  async function getModels(signal?: AbortSignal) {
    return readModels<NodeAiModel>("/api/ai/models", requestSignal(signal));
  }

  async function getMediaModels(signal?: AbortSignal) {
    return readModels<NodeMediaModel>("/api/ai/media/models", requestSignal(signal));
  }

  async function generateMedia<T extends "image" | "video">(mediaType: T, input: NodeImageRequest | NodeVideoRequest, signal?: AbortSignal) {
    return readResult<{ path: string; mimeType: string; mediaType: T }[]>(await fetch("/api/ai/media/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ ...input, mediaType }),
      signal: requestSignal(signal),
    }));
  }

  function generateImage(input: NodeImageRequest, signal?: AbortSignal) {
    return generateMedia("image", input, signal);
  }

  function generateVideo(input: NodeVideoRequest, signal?: AbortSignal) {
    return generateMedia("video", input, signal);
  }

  async function generate(input: NodeAiRequest): Promise<NodeAiResult> {
    const signal = requestSignal(input.signal);
    const callSignal = input.tools?.length ? AbortSignal.any([signal, AbortSignal.timeout(600000)]) : signal;
    const { providerId, modelId, prompt, systemPrompt, onEvent } = input;
    if (!prompt.trim()) throw new Error("请输入提示词");
    const definitions = input.tools ?? [];
    if (new Set(definitions.map(tool => tool.name)).size !== definitions.length) throw new Error("工具名称不能重复");
    const selected = (await getModels(callSignal)).find(model => model.providerId === providerId && model.modelId === modelId);
    if (!selected) throw new Error("所选模型不存在，请重新选择");
    const model: Model<NodeAiModel["protocol"]> = {
      id: modelId, name: selected.label, provider: providerId, api: selected.protocol, baseUrl: "",
      reasoning: false, input: ["text", "image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: selected.contextWindow ?? 262144, maxTokens: selected.maxOutputTokens ?? 32768,
    };
    const tools: AgentTool[] = definitions.map(tool => ({
      name: tool.name, label: tool.name, description: tool.description, parameters: tool.parameters,
      async execute(_id, args, toolSignal) {
        callSignal.throwIfAborted();
        if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("工具参数必须是对象");
        const result = await tool.execute(args as Record<string, unknown>, toolSignal) ?? null;
        callSignal.throwIfAborted();
        return { content: [{ type: "text", text: JSON.stringify(result) ?? "null" }], details: undefined };
      },
    }));
    let turns = 0;
    const messages = await runAgentLoop([{ role: "user", content: prompt, timestamp: Date.now() }], {
      systemPrompt: systemPrompt ?? "", messages: [], tools,
    }, {
      model, convertToLlm: messages => messages as Message[], toolExecution: "sequential",
      shouldStopAfterTurn: ({ message }) => ++turns >= 40 || message.stopReason === "length",
    }, event => {
      callSignal.throwIfAborted();
      if (event.type === "tool_execution_start") onEvent?.({ type: "toolStart", id: event.toolCallId, name: event.toolName, args: event.args });
      if (event.type === "tool_execution_end" && onEvent) {
        const text = (event.result as AgentToolResult<unknown>).content.filter(part => part.type === "text").map(part => part.text).join("\n");
        onEvent({ type: "toolEnd", id: event.toolCallId, name: event.toolName, result: event.isError ? text : JSON.parse(text), isError: event.isError });
      }
    }, callSignal, (_model, context) => requestModel(input, context, model, callSignal));
    callSignal.throwIfAborted();
    const message = messages.findLast((message): message is AssistantMessage => message.role === "assistant");
    if (!message) throw new Error("AI 未返回结果");
    if (message.stopReason === "error" || message.stopReason === "aborted") throw new Error(message.errorMessage || "AI 请求失败");
    if (definitions.length && message.stopReason === "length") throw new Error("模型输出达到上限，请精简任务后重试");
    if (message.content.some(part => part.type === "toolCall")) throw new Error("AI 已达到 40 轮调用上限，请缩小任务后重试");
    const text = message.content.filter(part => part.type === "text").map(part => part.text).join("");
    const reasoning = message.content.filter(part => part.type === "thinking").map(part => part.thinking).join("");
    return { text, ...(reasoning ? { reasoning } : {}) };
  }

  return { getModels, getMediaModels, generateImage, generateVideo, generate };
}
