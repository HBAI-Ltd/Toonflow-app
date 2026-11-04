import { raceWithAbortSignal } from "@earendil-works/pi-ai/utils/abort";

type TextBillingUsage = { input: number; output: number; cacheRead: number; cacheWrite: number };
type WireObject = Record<string, unknown>;
type FetchResponse = Pick<Awaited<ReturnType<typeof fetch>>, "body"> & { headers: { get(name: string): string | null } };

function object(value: unknown): WireObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as WireObject : undefined;
}

function count(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function optionalCount(value: unknown) {
  return value === undefined ? 0 : count(value);
}

function openAiUsage(value: unknown, responses: boolean): TextBillingUsage | undefined {
  const raw = object(value);
  if (!raw) return;
  const input = count(responses ? raw.input_tokens : raw.prompt_tokens);
  const output = count(responses ? raw.output_tokens : raw.completion_tokens);
  const detailsValue = responses ? raw.input_tokens_details : raw.prompt_tokens_details;
  const details = object(detailsValue);
  if (detailsValue != null && !details) return;
  const cached = details && Object.hasOwn(details, "cached_tokens") ? details.cached_tokens
    : responses ? undefined : Object.hasOwn(raw, "prompt_cache_hit_tokens") ? raw.prompt_cache_hit_tokens : raw.cached_tokens;
  const cacheRead = optionalCount(cached);
  const cacheWrite = optionalCount(details?.cache_write_tokens);
  if (input === undefined || output === undefined || cacheRead === undefined || cacheWrite === undefined
    || cacheRead + cacheWrite > input) return;
  // ACT: 与 pi-ai 相同，OpenAI 的输入总数包含缓存读取与写入，普通输入须扣除这两项。
  return { input: input - cacheRead - cacheWrite, output, cacheRead, cacheWrite };
}

function anthropicUsage(value: unknown): TextBillingUsage | undefined {
  const raw = object(value);
  if (!raw) return;
  const input = count(raw.input_tokens);
  const output = count(raw.output_tokens);
  const cacheRead = optionalCount(raw.cache_read_input_tokens ?? undefined);
  const cacheWrite = optionalCount(raw.cache_creation_input_tokens ?? undefined);
  if (input === undefined || output === undefined || cacheRead === undefined || cacheWrite === undefined) return;
  return { input, output, cacheRead, cacheWrite };
}

async function readWireUsage(response: FetchResponse, protocol: string, signal?: AbortSignal): Promise<TextBillingUsage | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  const bufferLimit = 1024 * 1024;
  const isJson = /(?:application|text)\/(?:[\w.+-]+\+)?json\b/i.test(response.headers.get("content-type") ?? "");
  let buffer = "";
  let data = "";
  let eventName = "";
  let complete = false;
  let ended = false;
  let usage: TextBillingUsage | undefined;
  let anthropicInput: WireObject | undefined;
  let anthropicStarted = false;
  let anthropicOutput = false;
  let finished = false;

  const accept = (value: unknown, event = "") => {
    const item = object(value);
    if (!item) return;
    if (protocol === "openai-completions") {
      const choices = Array.isArray(item.choices) ? item.choices.map(object).filter(choice => choice !== undefined) : [];
      if (choices.some(choice => typeof choice.finish_reason === "string" && choice.finish_reason.length > 0)) {
        complete = true;
        // ACT: 兼容服务可能逐帧累计用量；终止帧之前的计数不能当成最终计费凭据。
        if (!isJson) usage = undefined;
      }
      const raw = item.usage ?? choices.find(choice => choice.usage !== undefined)?.usage;
      if (raw !== undefined) usage = openAiUsage(raw, false);
      if (isJson) complete = true;
      return;
    }
    const type = typeof item.type === "string" ? item.type : event;
    if (protocol === "openai-responses") {
      if (isJson || ["response.completed", "response.incomplete", "response.failed"].includes(type)) {
        const result = isJson ? object(item.response) ?? item : object(item.response);
        usage = openAiUsage(result?.usage, true);
        complete = true;
        ended = true;
      }
      return;
    }
    if (protocol !== "anthropic-messages") return;
    if (isJson) { usage = anthropicUsage(item.usage); complete = true; return; }
    if (type === "message_start") {
      anthropicInput = object(object(item.message)?.usage);
      anthropicStarted = count(anthropicInput?.input_tokens) !== undefined;
    }
    if (type === "message_delta") {
      const deltaUsage = object(item.usage);
      if (deltaUsage) {
        // ACT: 与 Anthropic SDK 语义一致，增量中的 null 表示未更新，保留 message_start 的可靠计数。
        anthropicInput = { ...anthropicInput };
        for (const key of ["input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"]) {
          if (deltaUsage[key] != null) anthropicInput[key] = deltaUsage[key];
        }
        if (count(deltaUsage.output_tokens) !== undefined) anthropicOutput = true;
      }
      const reason = object(item.delta)?.stop_reason;
      if (typeof reason === "string" && reason.length > 0) complete = true;
    }
    if (type === "message_stop") { complete = true; ended = true; }
    if (anthropicStarted && anthropicOutput) usage = anthropicUsage(anthropicInput);
  };
  const dispatch = () => {
    if (data.trim() === "[DONE]") ended = true;
    else if (data) accept(JSON.parse(data), eventName);
    data = "";
    eventName = "";
  };
  const line = (value: string) => {
    if (!value) { dispatch(); return; }
    if (value.startsWith("data:")) data += `${data ? "\n" : ""}${value.slice(5).replace(/^ /, "")}`;
    if (value.startsWith("event:")) eventName = value.slice(6).trim();
    if (data.length > bufferLimit || eventName.length > bufferLimit) throw new Error("模型用量事件超过读取限制");
  };
  const consume = (value: string, last = false) => {
    buffer += value;
    if (isJson) {
      if (buffer.length > bufferLimit) throw new Error("模型用量响应超过读取限制");
      return;
    }
    for (;;) {
      const end = buffer.search(/[\r\n]/);
      if (end < 0 || (!last && end === buffer.length - 1 && buffer[end] === "\r")) break;
      const size = buffer[end] === "\r" && buffer[end + 1] === "\n" ? 2 : 1;
      line(buffer.slice(0, end));
      buffer = buffer.slice(end + size);
      if (ended || complete && usage) return;
    }
    if (buffer.length > bufferLimit) throw new Error("模型用量事件超过读取限制");
  };
  try {
    for (;;) {
      const chunk = await (signal ? raceWithAbortSignal(reader.read(), signal) : reader.read());
      if (chunk.done) break;
      consume(decoder.decode(chunk.value, { stream: true }));
      // ACT: 协议终结后不等连接关闭；缺少可靠用量仍交网关保留预占，不能按零结算。
      if (ended || complete && usage) return complete ? usage : undefined;
    }
    consume(decoder.decode(), true);
    if (isJson) accept(JSON.parse(buffer));
    else {
      if (buffer) line(buffer);
      dispatch();
    }
    finished = true;
    return complete ? usage : undefined;
  } catch {
    return complete ? usage : undefined;
  } finally {
    // ACT: 只取消旁路 clone；解析预算失败不取消 SDK 消费的原响应。
    if (!finished) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export function createBillingUsageTracker(protocol: string) {
  let submitted = false;
  let rejected = false;
  const observations: Promise<TextBillingUsage | undefined>[] = [];
  return {
    fetch(request: typeof fetch): typeof fetch {
      return Object.assign(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const inputRequest = typeof input === "object" && "url" in input ? input : undefined;
        const method = (init?.method ?? inputRequest?.method ?? "GET").toUpperCase();
        const path = new URL(inputRequest?.url ?? String(input)).pathname.replace(/\/+$/, "");
        const endpoint = protocol === "openai-completions" ? "/chat/completions" : protocol === "openai-responses" ? "/responses" : "/messages";
        if (method !== "POST" || !path.endsWith(endpoint)) return request(input, init);
        submitted = true;
        rejected = false;
        const response = await request(input, init);
        rejected = !response.ok;
        if (response.ok) {
          const signal = init?.signal === undefined ? inputRequest?.signal : init.signal;
          try { observations.push(readWireUsage(response.clone(), protocol, signal ?? undefined).catch(() => undefined)); }
          catch { observations.push(Promise.resolve(undefined)); }
        }
        return response;
      }, request);
    },
    async usage() {
      const results = await Promise.all(observations);
      // ACT: 一次逻辑请求只能有一次成功上游响应；多次成功无法确认计费范围，保留预占人工处理。
      return results.length === 1 ? results[0] : undefined;
    },
    submitted: () => submitted,
    rejected: () => rejected,
  };
}
