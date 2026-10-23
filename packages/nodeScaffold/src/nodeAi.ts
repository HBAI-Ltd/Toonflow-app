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
  inputs?: Record<string, { path: string; mimeType: string }[]>;
  other?: Record<string, unknown>;
  ratio?: string;
  size?: string;
};
export type NodeImageResult = { path: string; mimeType: string; mediaType: "image" };
export type NodeVideoRequest = Omit<MediaGenerationRequest, "size"> & { directory: string; outputDirectory: string };
export type NodeVideoResult = { path: string; mimeType: string; mediaType: "video" };
export type NodeMediaPriceRequest = (NodeImageRequest & { mediaType: "image" }) | (NodeVideoRequest & { mediaType: "video" }) | (NodeAudioRequest & { mediaType: "audio" });
export type NodeMediaPrice = { price: string; tips: string };
export type NodeAudioRequest = Pick<MediaGenerationRequest, "providerId" | "modelId" | "prompt" | "images" | "audios" | "inputs" | "other" | "voice" | "speed" | "volume" | "pitch" | "language" | "format" | "sampleRate"> & { directory: string; outputDirectory: string };
export type NodeAudioResult = { path: string; mimeType: string; mediaType: "audio" };
export type NodeAiRequest = {
  providerId: string;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  directory?: string;
  references?: Extract<NodeOutput, { dataType: "STRING" | "IMAGE" | "VIDEO" | "FILE" }>[];
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

async function readResult<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || result.code !== 200) throw new Error(result.message || `AI 请求失败（HTTP ${response.status}）`);
  return result.data;
}

// ACT: 独立 UMD 各有模块作用域，共用宿主缓存；模型设置保存后失效，不按节点重复请求。
const modelCacheKey = Symbol.for("toonflow.nodeModels");
const modelCacheHost = globalThis as typeof globalThis & { [modelCacheKey]?: Map<string, Promise<unknown[]>> };
const modelCache = modelCacheHost[modelCacheKey] ??= new Map<string, Promise<unknown[]>>();

type MediaPriceCache = {
  prices: Map<string, { expires: number; value: Promise<NodeMediaPrice | null> }>;
  requestedAt: Map<string, number>;
};
const mediaPriceCacheKey = Symbol.for("toonflow.nodeMediaPrices");
const mediaPriceCacheHost = globalThis as typeof globalThis & { [mediaPriceCacheKey]?: MediaPriceCache };
const mediaPriceCache = mediaPriceCacheHost[mediaPriceCacheKey] ??= (() => {
  const cache: MediaPriceCache = { prices: new Map(), requestedAt: new Map() };
  if (typeof window !== "undefined") {
    const invalidate = (event: Event) => {
      if (event.type === "toonflow:plugin-installed" && (event as CustomEvent<{ type?: string }>).detail?.type !== "provider") return;
      cache.prices.clear();
    };
    window.addEventListener("toonflow:provider-config-changed", invalidate);
    window.addEventListener("toonflow:plugin-installed", invalidate);
  }
  return cache;
})();

type MediaTaskResult = { code: number; data: (NodeImageResult | NodeVideoResult | NodeAudioResult)[] | null; message: string };
type PendingMediaTask = { directory: string; failedAt?: number; finish: (result: MediaTaskResult) => void; fail: (error: unknown) => void };
const mediaTasksKey = Symbol.for("toonflow.nodeMediaTasks");
const mediaTasksHost = globalThis as typeof globalThis & { [mediaTasksKey]?: ReturnType<typeof createMediaTasks> };
// ACT: 图片、视频等独立 UMD 共用短轮询；每批最多 100 项，不按节点占用长连接。
const mediaTasks = mediaTasksHost[mediaTasksKey] ??= createMediaTasks();

function createMediaTasks() {
  const pending = new Map<string, PendingMediaTask>();
  const cancellations = new Map<string, Set<string>>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let polling = false;

  function schedule(delay = 1000) {
    if (polling || timer !== undefined || (!pending.size && !cancellations.size)) return;
    timer = setTimeout(poll, delay);
  }

  function cancel(directory: string, taskId: string) {
    const ids = cancellations.get(directory) ?? new Set<string>();
    ids.add(taskId);
    cancellations.set(directory, ids);
    schedule(0);
  }

  async function poll() {
    timer = undefined;
    polling = true;
    try {
      for (const [directory, ids] of cancellations) {
        cancellations.delete(directory);
        const taskIds = [...ids];
        for (let offset = 0; offset < taskIds.length; offset += 100) {
          // 取消失败由服务端无心跳过期兜底，不重新提交生成请求。
          await fetch("/api/ai/media/tasks/cancel", {
            method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
            body: JSON.stringify({ directory, taskIds: taskIds.slice(offset, offset + 100) }), signal: AbortSignal.timeout(10000),
          }).then(readResult).catch(() => {});
        }
      }
      const directories = new Set([...pending.values()].map(task => task.directory));
      for (const directory of directories) {
        const taskIds = [...pending].filter(([, task]) => task.directory === directory).map(([id]) => id);
        for (let offset = 0; offset < taskIds.length; offset += 100) {
          const batch = taskIds.slice(offset, offset + 100).filter(id => pending.has(id));
          if (!batch.length) continue;
          try {
            const results = await fetch("/api/ai/media/tasks/status", {
              method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
              body: JSON.stringify({ directory, taskIds: batch }), signal: AbortSignal.timeout(10000),
            }).then(readResult<{ taskId: string; result?: MediaTaskResult }[]>);
            const byId = new Map(results.map(result => [result.taskId, result]));
            for (const id of batch) {
              const task = pending.get(id);
              if (!task) continue;
              const item = byId.get(id);
              if (!item) throw new Error("生成任务响应不完整，请重试");
              task.failedAt = undefined;
              if (item.result) task.finish(item.result);
            }
          } catch (error) {
            for (const id of batch) {
              const task = pending.get(id);
              if (!task) continue;
              // ACT: 状态查询允许 90 秒临时断线，不因几次快速失败取消已经提交的生成。
              task.failedAt ??= Date.now();
              if (task.failedAt + 90000 <= Date.now()) { task.fail(error); cancel(directory, id); }
            }
          }
        }
      }
    } finally {
      polling = false;
      schedule();
    }
  }

  function wait(directory: string, taskId: string, signal: AbortSignal) {
    signal.throwIfAborted();
    return new Promise<NonNullable<MediaTaskResult["data"]>>((resolve, reject) => {
      const cleanup = () => {
        pending.delete(taskId);
        signal.removeEventListener("abort", abort);
        if (!pending.size && !cancellations.size) { clearTimeout(timer); timer = undefined; }
      };
      const abort = () => { cleanup(); cancel(directory, taskId); reject(signal.reason); };
      pending.set(taskId, {
        directory,
        finish(result) {
          cleanup();
          if (result.code === 200 && result.data) resolve(result.data);
          else reject(new Error(result.message || "媒体生成失败"));
        },
        fail(error) { cleanup(); reject(error); },
      });
      signal.addEventListener("abort", abort, { once: true });
      schedule();
    });
  }

  return { wait, cancel };
}

export function invalidateNodeModels(type: "language" | "media") {
  modelCache.delete(type === "language" ? "/api/ai/models" : "/api/ai/media/models");
  if (type === "media") mediaPriceCache.prices.clear();
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

  async function getMediaPrice(input: NodeMediaPriceRequest, signal?: AbortSignal): Promise<NodeMediaPrice | null> {
    const waitingSignal = requestSignal(signal);
    waitingSignal.throwIfAborted();
    const now = Date.now();
    const { prices, requestedAt } = mediaPriceCache;
    for (const [key, entry] of prices) if (entry.expires <= now) prices.delete(key);
    for (const [key, time] of requestedAt) if (time + 2000 <= now) requestedAt.delete(key);
    const key = JSON.stringify({ ...input, outputDirectory: undefined });
    let entry = prices.get(key);
    if (!entry) {
      // ACT: 节流状态跨节点面板重建保留；每个节点最多每 2 秒发起一次新报价。
      const nodeKey = JSON.stringify([input.directory, input.outputDirectory, input.providerId]);
      const delay = (requestedAt.get(nodeKey) ?? 0) + 2000 - now;
      if (delay > 0) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let cancel = () => {};
        try {
          await new Promise<void>((resolve, reject) => {
            timer = setTimeout(resolve, delay);
            cancel = () => reject(waitingSignal.reason);
            waitingSignal.addEventListener("abort", cancel, { once: true });
          });
          return await getMediaPrice(input, signal);
        } finally {
          clearTimeout(timer);
          waitingSignal.removeEventListener("abort", cancel);
        }
      }
      requestedAt.set(nodeKey, now);
      if (requestedAt.size > 500) requestedAt.delete(requestedAt.keys().next().value!);
      if (prices.size >= 500) prices.delete(prices.keys().next().value!);
      const hasReferences = !!(input.images?.length || ("videos" in input && input.videos?.length) || ("audios" in input && input.audios?.length)
        || ("firstFrame" in input && input.firstFrame) || ("lastFrame" in input && input.lastFrame));
      const pending = { expires: Infinity, value: Promise.resolve<NodeMediaPrice | null>(null) };
      // ACT: 最多缓存 500 条 / 30 秒；参考文件没有前端修订号，只合并进行中的查询，避免同路径覆盖后复用旧价。
      pending.value = fetch("/api/ai/media/price", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      }).then(readResult<NodeMediaPrice | null>).then(price => {
        if (price !== null && (!price || typeof price.price !== "string" || !price.price.trim() || typeof price.tips !== "string")) {
          throw new Error("价格响应格式不正确");
        }
        pending.expires = hasReferences ? 0 : Date.now() + 30000;
        return price;
      }).catch(error => {
        pending.expires = Date.now() + 5000;
        throw error;
      });
      prices.set(key, pending);
      entry = pending;
    }
    // 单个节点退出只取消自己的等待，共用请求继续为其他节点提供结果。
    let cancel = () => {};
    try {
      const price = await Promise.race([entry.value, new Promise<never>((_resolve, reject) => {
        cancel = () => reject(waitingSignal.reason);
        waitingSignal.addEventListener("abort", cancel, { once: true });
      })]);
      waitingSignal.throwIfAborted();
      return prices.get(key) === entry ? price : getMediaPrice(input, signal);
    } finally {
      waitingSignal.removeEventListener("abort", cancel);
    }
  }

  async function generateMedia<T extends "image" | "video" | "audio">(mediaType: T, input: NodeImageRequest | NodeVideoRequest | NodeAudioRequest, signal?: AbortSignal) {
    const waitingSignal = requestSignal(signal);
    waitingSignal.throwIfAborted();
    const taskId = crypto.randomUUID();
    // 提交使用独立超时；用户取消立即结束等待，提交收尾后再取消，避免先取消后登记的竞态。
    const submitted = fetch("/api/ai/media/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ ...input, mediaType, taskId }), signal: AbortSignal.timeout(30000),
    }).then(readResult<{ taskId: string }>);
    let abort = () => {};
    try {
      const started = await Promise.race([submitted, new Promise<never>((_resolve, reject) => {
        abort = () => reject(waitingSignal.reason);
        waitingSignal.addEventListener("abort", abort, { once: true });
      })]);
      waitingSignal.throwIfAborted();
      if (started.taskId !== taskId) throw new Error("生成任务响应无效，请确认服务端已更新");
    } catch (error) {
      void submitted.then(() => mediaTasks.cancel(input.directory, taskId), () => mediaTasks.cancel(input.directory, taskId));
      throw error;
    } finally {
      waitingSignal.removeEventListener("abort", abort);
    }
    return await mediaTasks.wait(input.directory, taskId, waitingSignal) as { path: string; mimeType: string; mediaType: T }[];
  }

  function generateImage(input: NodeImageRequest, signal?: AbortSignal) {
    return generateMedia("image", input, signal);
  }

  function generateVideo(input: NodeVideoRequest, signal?: AbortSignal) {
    return generateMedia("video", input, signal);
  }

  function generateAudio(input: NodeAudioRequest, signal?: AbortSignal) {
    return generateMedia("audio", input, signal);
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

  return { getModels, getMediaModels, getMediaPrice, generateImage, generateVideo, generateAudio, generate };
}
