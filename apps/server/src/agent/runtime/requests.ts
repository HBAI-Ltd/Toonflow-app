import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";
import type { AssistantMessage, AssistantMessageEvent, ImageContent, Message, TextContent } from "@earendil-works/pi-ai";
import type { AgentSession } from "@earendil-works/pi-coding-agent";
import { createHash, randomUUID } from "node:crypto";
import { getAgentImageReference, getOffloadedImageText, readAgentImage, saveAgentImage } from "@/agent/runtime/imageAttachments";
import type { AgentImageReference } from "@/agent/runtime/imageAttachments";
import { getRequestFiles, type RequestFile } from "@/utils/ai/requestFiles";
import { createFileTransport, FileRequestLimitError } from "@/utils/ai/files";
import conf from "@/utils/conf";

function contentHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function configureAgentRequests(session: AgentSession, limits?: { maxRequestImageBytes?: number; maxRequestBytes?: number }, runSignal?: AbortSignal) {
  for (const value of Object.values(limits ?? {})) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) throw new Error("图片请求预算必须为正安全整数");
  }
  const history = session.sessionManager;
  const cwd = history.getCwd();
  const afterToolCall = session.agent.afterToolCall;
  let toolFailure: { error: unknown } | undefined;
  session.agent.afterToolCall = async (call, signal) => {
    if (runSignal) signal = signal ? AbortSignal.any([runSignal, signal]) : runSignal;
    try {
      signal?.throwIfAborted();
      const observationId = randomUUID();
      const content: (TextContent | ImageContent)[] = [];
      for (const [index, part] of call.result.content.entries()) {
        content.push(part.type === "image" ? await saveAgentImage(cwd, part, `tool:${observationId}:${index}`, signal) : part);
      }
      // ACT: 三个组合入口均禁用 Pi 扩展；先附件化再交原 hook，避免 SDK 二次缩放和重复尺寸说明。
      const previous = await afterToolCall?.({ ...call, result: { ...call.result, content } }, signal);
      const result: (TextContent | ImageContent)[] = [];
      for (const [index, part] of (previous?.content ?? content).entries()) {
        result.push(part.type === "image" ? await saveAgentImage(cwd, part, `hook:${observationId}:${index}`, signal) : part);
      }
      return { ...previous, content: result };
    } catch (error) {
      if (!signal?.aborted) toolFailure = { error };
      throw error;
    }
  };

  const streamFunction = session.agent.streamFunction;
  session.agent.streamFunction = (model, context, options) => {
    const output = createAssistantMessageEventStream();
    void (async () => {
      let partial: AssistantMessage | undefined;
      try {
        // prompt 预处理可能晚于 abort 完成；以本轮信号约束实际请求，并按流协议返回 aborted。
        if (runSignal) options = { ...options, signal: options?.signal ? AbortSignal.any([runSignal, options.signal]) : runSignal };
        options?.signal?.throwIfAborted();
        if (toolFailure) { const { error } = toolFailure; toolFailure = undefined; throw error; }
        const providers = conf.get("settings", {}).customProviders;
        const provider = Array.isArray(providers) ? providers.find(item => item?.id === model.provider) : undefined;
        const auth = await session.modelRuntime.getAuth(model, { apiKey: options?.apiKey, env: options?.env, signal: options?.signal });
        const apiKey = options?.apiKey ?? auth?.auth.apiKey;
        const files = createFileTransport({
          apiUrl: auth?.auth.baseUrl ?? model.baseUrl,
          apiKey: apiKey ?? "",
          protocol: model.api,
        }, { fetch: options?.fetch, signal: options?.signal });
        const maxRequestImageBytes = limits?.maxRequestImageBytes ?? provider?.maxRequestImageBytes ?? 20 * 1024 * 1024;
        const maxRequestBytes = limits?.maxRequestBytes ?? provider?.maxRequestBytes ?? 32 * 1024 * 1024;
        for (const value of [maxRequestImageBytes, maxRequestBytes]) {
          if (!Number.isSafeInteger(value) || value <= 0) throw new Error("图片请求预算必须为正安全整数");
        }
        const references = new Map<string, AgentImageReference>();
        const offloaded = new Set<string>();
        const invalidThinking = new Set<string>();
        const branch = history.getBranch();
        const messageEntries = new Map(branch.flatMap(entry => entry.type === "message" ? [[contentHash(entry.message), entry.id] as const] : []));
        for (const entry of branch) {
          if (entry.type !== "custom") continue;
          if (entry.customType === "toonflowImageAttachment") {
            const reference = getAgentImageReference({ type: "text", text: "", toonflowImage: entry.data });
            if (!reference) throw new Error("历史图片附件记录无效");
            references.set(reference.id, reference);
          }
          if (entry.customType === "toonflowImageOffload") {
            const data = entry.data as { images?: unknown; thinking?: unknown } | null;
            if (!data || !Array.isArray(data.images) || !data.images.every(id => typeof id === "string")
              || !Array.isArray(data.thinking) || !data.thinking.every(id => typeof id === "string")) throw new Error("历史图片卸载记录无效");
            for (const id of data.images) offloaded.add(id);
            for (const id of data.thinking) invalidThinking.add(id);
          }
        }
        const loaded = new Map<string, ImageContent>();
        async function readImage(reference: AgentImageReference) {
          if (!loaded.has(reference.path)) loaded.set(reference.path, await readAgentImage(cwd, reference, options?.signal));
          return loaded.get(reference.path)!;
        }
        function recordOffload(ids: string[]) {
          const images = ids.filter(id => !offloaded.has(id));
          const thinking = context.messages.filter(message => message.role === "assistant" && message.content.some(part => part.type === "thinking"))
            .map(contentHash).filter(key => !invalidThinking.has(key));
          if (!images.length && !thinking.length) return false;
          options?.signal?.throwIfAborted();
          history.appendCustomEntry("toonflowImageOffload", { images, thinking });
          for (const id of images) offloaded.add(id);
          for (const key of thinking) invalidThinking.add(key);
          return true;
        }
        function hasLaterAssistant(id: string) {
          const entryId = id.startsWith("user:") ? id.split(":")[1] : id.startsWith("legacy:") ? id.split(":")[1] : undefined;
          const index = branch.findIndex(entry => entry.id === entryId);
          return index >= 0 && branch.slice(index + 1).some(entry => entry.type === "message" && entry.message.role === "assistant");
        }
        let networkRecoveries = 0;
        for (;;) {
          options?.signal?.throwIfAborted();
          const imageQueue = new Map<string, AgentImageReference[]>();
          const messages: Message[] = [];
          for (const [messageIndex, message] of context.messages.entries()) {
            if (message.role === "assistant" || typeof message.content === "string") { messages.push(message); continue; }
            const content: (TextContent | ImageContent)[] = [];
            for (const [index, part] of message.content.entries()) {
              let reference = getAgentImageReference(part);
              if ("toonflowImage" in part && !reference) throw new Error("图片附件引用无效");
              if (part.type === "image") {
                const entryId = messageEntries.get(contentHash(message)) ?? contentHash(message);
                const id = `legacy:${entryId}:${index}`;
                reference = references.get(id);
                if (!reference) {
                  const saved = await saveAgentImage(cwd, part, id, options?.signal);
                  reference = saved.toonflowImage;
                  history.appendCustomEntry("toonflowImageAttachment", reference);
                  references.set(id, reference);
                  // 附件路径文本也改变历史前缀；首次迁移时退出旧 thinking 链，后续新 thinking 正常保留。
                  if (context.messages.slice(messageIndex + 1).some(item => item.role === "assistant")) recordOffload([]);
                }
              }
              if (!reference) { content.push(part); continue; }
              references.set(reference.id, reference);
              if (offloaded.has(reference.id)) {
                content.push({ type: "text", text: getOffloadedImageText(reference) });
                continue;
              }
              const image = await readImage(reference);
              const key = contentHash(image.data);
              imageQueue.set(key, [...(imageQueue.get(key) ?? []), reference]);
              const text = part.type === "text" ? part.text
                : `[图片附件：${reference.sourcePath}]${reference.note ? `\n${reference.note}` : ""}`;
              content.push({ type: "text", text }, image);
            }
            messages.push({ ...message, content });
          }
          const requestContext = {
            ...context,
            messages: messages.flatMap((message, index) => {
              if (message.role !== "assistant" || !invalidThinking.has(contentHash(context.messages[index]))) return [message];
              const content = message.content.filter(part => part.type !== "thinking");
              return content.length ? [{ ...message, content }] : [];
            }),
          };
          let restart = false;
          const rebuildRequest = new Error("图片上下文已调整，重新构建请求");
          let http413 = false;
          let fatalError: { error: unknown } | undefined;
          let activeImages: { reference: AgentImageReference; file: RequestFile }[] = [];
          function offloadBytes(target: number, count = 0, useFileBytes = false) {
            const ids: string[] = [];
            let removed = 0;
            let removedCount = 0;
            const sizes = new Map<string, { bytes: number; count: number }>();
            for (const image of activeImages) {
              const previous = sizes.get(image.reference.id) ?? { bytes: 0, count: 0 };
              sizes.set(image.reference.id, {
                bytes: previous.bytes + (useFileBytes ? image.reference.bytes : image.file.inlineBytes),
                count: previous.count + 1,
              });
            }
            for (const [id, size] of sizes) {
              if (offloaded.has(id) || !size.bytes) continue;
              ids.push(id);
              removed += size.bytes;
              removedCount += size.count;
              if (removed >= target && removedCount >= count) break;
            }
            if (!ids.length) return false;
            recordOffload(ids);
            return true;
          }
          const request = files.fetch;
          const stream = await streamFunction(model, requestContext, {
            ...options,
            apiKey,
            onPayload: async (payload, requestModel) => {
              try {
                const body = await options?.onPayload?.(payload, requestModel) ?? payload;
                const images = getRequestFiles(body).filter(file => file.mimeType.toLowerCase().startsWith("image/"));
                const imageCursors = new Map<string, number>();
                activeImages = [];
                for (const image of images) {
                  options?.signal?.throwIfAborted();
                  const imageKey = contentHash(image.data);
                  const cursor = imageCursors.get(imageKey) ?? 0;
                  let reference = image.id ? references.get(image.id) : imageQueue.get(imageKey)?.[cursor];
                  if (!image.id) imageCursors.set(imageKey, cursor + 1);
                  const fromContext = !image.id && Boolean(reference);
                  if (!reference) {
                    if (!image.id) throw new Error("onPayload 注入的图片必须提供稳定的 toonflowImageId，每次重新观察图片时使用新 ID");
                    const saved = await saveAgentImage(cwd, { type: "image", data: image.data, mimeType: image.mimeType }, image.id, options?.signal);
                    reference = saved.toonflowImage;
                    history.appendCustomEntry("toonflowImageAttachment", reference);
                    references.set(image.id, reference);
                    const fixed = await readImage(reference);
                    if ((fixed.data !== image.data || fixed.mimeType !== image.mimeType || reference.note) && hasLaterAssistant(image.id)) {
                      restart = recordOffload([]) || restart;
                    }
                  }
                  if (offloaded.has(reference.id)) { image.offload(getOffloadedImageText(reference)); continue; }
                  const fixed = await readImage(reference);
                  image.replace(fixed, fromContext ? undefined : reference.note);
                  activeImages.push({ reference, file: image });
                }
                if (restart) throw rebuildRequest;
                try { await files.prepare(body); }
                catch (error) {
                  // 文件 ID 只缩小 JSON；供应商仍限制图片总字节和张数，超限也按旧观察卸载。
                  if (error instanceof FileRequestLimitError && offloadBytes(error.excessBytes, error.excessCount, true)) {
                    restart = true;
                    throw rebuildRequest;
                  }
                  throw error;
                }
                const imageBytes = activeImages.reduce((sum, image) => sum + image.file.inlineBytes, 0);
                const bodyBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
                // ACT: 上传后再计内联 base64 与 JSON；文件 ID 不再占用内联预算，超限仍卸载旧观察。
                if (imageBytes > maxRequestImageBytes || bodyBytes > maxRequestBytes) {
                  if (!offloadBytes(Math.max(imageBytes - maxRequestImageBytes, bodyBytes - maxRequestBytes))) {
                    throw new Error(`模型请求的非图片内容超过 ${maxRequestBytes} 字节预算，请压缩对话或减少附件内容后重试`);
                  }
                  restart = true;
                }
                if (restart) throw rebuildRequest;
                return body;
              } catch (error) {
                if (error !== rebuildRequest) fatalError = { error };
                throw error;
              }
            },
            fetch: Object.assign(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
              init?.signal?.throwIfAborted();
              if (typeof init?.body === "string" && Buffer.byteLength(init.body, "utf8") > maxRequestBytes) {
                try {
                  restart = offloadBytes(Buffer.byteLength(init.body, "utf8") - maxRequestBytes);
                  if (!restart) fatalError = { error: new Error(`模型请求的非图片内容超过 ${maxRequestBytes} 字节预算，请压缩对话或减少附件内容后重试`) };
                } catch (error) { fatalError = { error }; }
                return new Response(JSON.stringify({ error: { message: "请求超过本地字节限制" } }), {
                  status: 413, headers: { "content-type": "application/json", "x-should-retry": "false" },
                });
              }
              // ACT: 工具或用户等待可能让代理关闭空闲连接；每轮重新握手，避免 Bun 复用失效 socket。
              const response = await request(input, { ...init, keepalive: false });
              if (response.status !== 413) return response;
              http413 = true;
              const headers = new Headers(response.headers);
              headers.set("x-should-retry", "false");
              return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
            }, request),
          });
          let visible = false;
          let start: AssistantMessageEvent | undefined;
          let retry = false;
          for await (const event of stream) {
            if ("partial" in event) partial = event.partial;
            if (event.type === "start") { start = event; continue; }
            if (event.type === "error") {
              options?.signal?.throwIfAborted();
              if (fatalError) throw fatalError.error;
              const imageBytes = activeImages.reduce((sum, image) => sum + image.file.inlineBytes, 0);
              if (!visible && (restart || (http413 && networkRecoveries < 4
                && offloadBytes(Math.max(1, networkRecoveries === 3 ? imageBytes : imageBytes / 2))))) {
                if (http413) networkRecoveries++;
                retry = true;
                break;
              }
            }
            if (start) { output.push(start); start = undefined; }
            output.push(event);
            visible = true;
            if (event.type === "done" || event.type === "error") return;
          }
          if (retry) continue;
          const message = await stream.result();
          if (start) output.push(start);
          output.push(message.stopReason === "error" || message.stopReason === "aborted"
            ? { type: "error", reason: message.stopReason, error: message }
            : { type: "done", reason: message.stopReason as "stop" | "length" | "toolUse", message });
          return;
        }
      } catch (error) {
        const message: AssistantMessage = {
          role: "assistant", content: partial?.content ?? [], api: model.api, provider: model.provider, model: model.id,
          stopReason: options?.signal?.aborted ? "aborted" : "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          usage: partial?.usage ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
          timestamp: Date.now(),
        };
        output.push({ type: "error", reason: message.stopReason as "error" | "aborted", error: message });
      } finally {
        output.end();
      }
    })();
    return output;
  };
}
