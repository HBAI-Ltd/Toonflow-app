import { z } from "zod";
import { basename } from "node:path";
import { readFile, stat, unlink } from "@toonflow/file";
import {
  createAgentSession,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import type { SessionEntry } from "@earendil-works/pi-coding-agent";
import type { CanvasContext, QuestionContext } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent, AgentMention, AgentPeerMessage, AgentToolCall } from "@/agent/runtime/types";
import { agentMentionsSchema, mentionPrompt, snapshotMentions, validateMentionTokens } from "@/agent/runtime/mentions";
import { readAiReferences, referenceContent } from "@/utils/ai";
import { createAgentTools } from "@/agent/tools";
import { createAgentResources } from "@/agent/runtime/resources";
import { createAgentModel, getAgentModelConfiguration } from "@/agent/runtime/model";
import { configureAgentRequests } from "@/agent/runtime/requests";
import { configureAgentDelivery } from "@/agent/runtime/delivery";
import { getAgentImageReference, getOffloadedImageText, readAgentImage } from "@/agent/runtime/imageAttachments";
import { createSubAgentTool } from "@/agent/tools/subAgent";
import { createMemoryTool } from "@/agent/tools/memory";
import { createReportTool } from "@/agent/tools/report";
import { agentMessageContent, createAgentTeamTools } from "@/agent/tools/agentTeam";
import { runDelegatedAgent } from "@/agent/runtime/delegation";
import {
  agentAttachmentsSchema, getActiveAgentSession, getAgentContext, getAgentQueue, getAgentStats, getAgentUserMessage, getParentSessionFile, getSubAgentInfo,
  getQueuedMessageId, getToolResultText, hasPendingAgentQuestion, registerAgentRun, registerAgentSession, updateSubAgent,
  type ActiveAgentSession,
} from "@/agent/runtime/sessions";
import { isMemoryEnabled } from "@/utils/personalization";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";
import { t } from "@/lib/i18n";
import { decodeTextFile } from "@/lib/documentFormats";
import type { ThinkingLevel } from "@/lib/modelReasoning";

type AgentOptions = {
  prompt: string;
  attachments?: z.infer<typeof agentAttachmentsSchema>;
  mentions?: AgentMention[];
  cwd: string;
  providerId: string;
  modelId: string;
  thinkingLevel?: ThinkingLevel;
  sessionFile?: string;
  runId?: string;
  expectedRunId?: string;
  resendFrom?: string;
  streamingBehavior?: "steer" | "followUp";
  canvas?: CanvasContext;
  question?: QuestionContext;
  signal?: AbortSignal;
  onCancel?: () => void;
  onCanvasCancel?: (reason: Error) => void;
};

export async function run(
  {
    prompt,
    attachments = [],
    mentions = [],
    cwd,
    providerId,
    modelId,
    thinkingLevel,
    sessionFile,
    runId,
    expectedRunId,
    resendFrom,
    streamingBehavior,
    canvas,
    question,
    signal,
    onCancel,
    onCanvasCancel,
  }: AgentOptions,
  send: (event: AgentEvent) => void,
  peerMessage?: AgentPeerMessage,
  onFinish?: (entries: SessionEntry[]) => void,
) {
  attachments = agentAttachmentsSchema.parse(attachments);
  mentions = agentMentionsSchema.parse(mentions);
  validateMentionTokens(prompt, mentions);
  if (!prompt.trim() && !attachments.length && !mentions.length) throw Object.assign(new Error("请输入消息、提及或添加附件"), { status: 400 });
  getAgentModelConfiguration(providerId, modelId, thinkingLevel);
  const attachmentContents: (z.infer<typeof agentAttachmentsSchema>[number] & { content?: string })[] = [];
  for (const attachment of attachments) {
    const { path } = await resolveWorkspacePath(cwd, attachment.path);
    const info = await stat(path);
    if (!info.isFile() || !info.size || info.size > 100 * 1024 * 1024) {
      throw Object.assign(new Error("附件必须是工作区内非空且不超过 100 MB 的文件"), { status: 400 });
    }
    if (attachment.mimeType !== "text/plain") { attachmentContents.push(attachment); continue; }
    // ACT: 与文本引用保持同一上限，完整读取并保存到模型上下文，超限直接拒绝而不截断。
    if (info.size > 400000) throw Object.assign(new Error("文本附件最多支持 100000 个字符，请缩小内容后重试"), { status: 400 });
    const bytes = await readFile(path, { signal });
    const content = decodeTextFile(bytes);
    if (bytes.length > 400000 || content.length > 100000) throw Object.assign(new Error("文本附件最多支持 100000 个字符，请缩小内容后重试"), { status: 400 });
    attachmentContents.push({ ...attachment, content });
  }
  if (resendFrom && !sessionFile) throw Object.assign(new Error("重发需要指定原对话"), { status: 400 });
  signal?.throwIfAborted();
  const { path: sessionsDir } = await resolveWorkspacePath(cwd, ".agent/sessions", true);
  const sessionPath = sessionFile ? (await resolveWorkspacePath(sessionsDir, sessionFile)).path : undefined;
  signal?.throwIfAborted();
  const active = sessionPath ? getActiveAgentSession(sessionPath) : undefined;
  if ((active && active.runId !== expectedRunId) || (expectedRunId && !active) || active?.signal.aborted) {
    throw Object.assign(new Error("当前任务已变化或正在停止，请刷新对话后重试"), { status: 409 });
  }
  if (streamingBehavior && !active) throw Object.assign(new Error("当前回复已结束，请重新发送消息"), { status: 409 });
  if (active && !streamingBehavior && hasPendingAgentQuestion(active)) {
    // ACT: 新消息结束旧提问，必须等旧执行释放文件锁后再继续，避免并发写入同一会话。
    await active.abort();
    signal?.throwIfAborted();
  } else if (active) {
    if (!streamingBehavior && !getParentSessionFile(active.history)) throw Object.assign(new Error("对话正在运行，请选择排队或引导"), { status: 409 });
    if (resendFrom) throw Object.assign(new Error("Agent 运行时不能重发历史消息"), { status: 409 });
    if (active.session?.isCompacting) throw Object.assign(new Error("正在压缩上下文，请稍后排队或引导"), { status: 409 });
    if (!active.session?.isStreaming) throw Object.assign(new Error("Agent 正在准备或结束回复，请稍后发送"), { status: 409 });
    if (attachments.length || mentions.length) throw Object.assign(new Error("排队和引导仅支持文字，请等当前回复结束后发送附件或提及"), { status: 400 });
    const mode = streamingBehavior ?? "steer";
    const before = active.session.agent.getQueuedMessages();
    const previousMessages = new Set([...before.steering, ...before.followUp]);
    const pending = active.session.prompt(prompt.trim(), { streamingBehavior: mode, expandPromptTemplates: false });
    // ACT: 此入口禁用扩展及模板，SDK 在首个 await 前同步入队；先取得对象，避免确认前已被消费。
    const queue = active.session.agent.getQueuedMessages();
    const message = [...queue.steering, ...queue.followUp].find(message => message.role === "user" && !previousMessages.has(message));
    const queueId = message && getQueuedMessageId(message);
    await pending;
    if (!queueId) throw new Error("服务端未能确认入队消息，请刷新对话后重试");
    send({ type: "accepted", runId: active.runId, message: { id: queueId, content: prompt.trim(), mode } });
    return;
  }
  const { provider, runtime, effectiveThinkingLevel } = await createAgentModel(providerId, modelId, thinkingLevel);
  if (sessionPath) {
    const file = await stat(sessionPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") throw Object.assign(new Error("会话不存在，请重新打开对话"), { status: 404 });
      throw error;
    });
    if (!file.isFile()) throw Object.assign(new Error("会话必须是普通文件"), { status: 400 });
  }
  // ACT: SDK 新会话先分配文件名、首条回复才落盘；只锁所属文件，允许不同对话同时运行。
  const newHistory = sessionPath ? undefined : SessionManager.create(cwd, sessionsDir);
  const release = lockWorkspaceFiles([sessionPath ?? newHistory!.getSessionFile()!]);
  const controller = new AbortController();
  signal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const finished = Promise.withResolvers<void>();
  let unregister = () => {};
  let unregisterRun = () => {};
  let mentionFiles: string[] = [];
  let messageAccepted = false;
  try {
    signal.throwIfAborted();
    const history = newHistory ?? SessionManager.open(sessionPath!, sessionsDir, cwd);
    const file = basename(history.getSessionFile()!);
    const parentFile = getParentSessionFile(history);
    const child = getSubAgentInfo(history)?.data;
    const liveTools = new Map<string, AgentToolCall>();
    const publish = send;
    send = event => {
      if (event.type === "tool") {
        const tool = { ...liveTools.get(event.tool.id), ...event.tool };
        if (tool.status !== "running") delete tool.question;
        liveTools.set(tool.id, tool);
      }
      publish(event);
    };
    const active: ActiveAgentSession = {
      runId: runId ?? crypto.randomUUID(), history, send, tools: liveTools,
      signal, queueRevision: 0,
      entryOffset: history.getEntries().length,
      abort: () => { controller.abort(new DOMException("已停止生成", "AbortError")); onCancel?.(); return finished.promise; },
    };
    unregister = registerAgentSession(history.getSessionFile()!, active);
    if (!runId) unregisterRun = registerAgentRun({ runId: active.runId, directory: Promise.resolve(cwd), abort: active.abort, finished: finished.promise });
    const tools = await createAgentTools(cwd, canvas, question);
    if (isMemoryEnabled()) {
      const memoryTool = createMemoryTool();
      if (tools.some(tool => tool.name === memoryTool.name)) throw new Error("工具名称 memory 已被内置全局记忆工具占用");
      tools.push(memoryTool);
    }
    if (parentFile && child) {
      if (tools.some(tool => tool.name === "report")) throw new Error("工具名称 report 已被内置上报工具占用");
      tools.push(createReportTool(cwd, parentFile, file, child.name, send));
    }
    const teamTools = createAgentTeamTools(cwd, file, async (member, message, onReady, taskSignal) => {
      if (!member.providerId || !member.modelId) throw new Error("目标 Agent 没有可用的模型配置，请先在其会话中选择模型");
      active.waitingForAgent = member.file;
      try {
        return await runDelegatedAgent({
          cwd, parentFile: member.parentFile, name: member.name, task: message.content, message,
          providerId: member.providerId, modelId: member.modelId, thinkingLevel: member.thinkingLevel,
          canvas, signal: taskSignal, send, onReady,
          onCanvasCancel: reason => { controller.abort(reason); onCanvasCancel?.(reason); },
        });
      } finally { active.waitingForAgent = undefined; }
    });
    for (const tool of teamTools) {
      if (tools.some(existing => existing.name === tool.name)) throw new Error(t`工具名称 ${tool.name} 已被内置团队通讯工具占用`);
      tools.push(tool);
    }
    tools.push(await createSubAgentTool({
      cwd, tools, canvas, modelRuntime: runtime, model: runtime.getModel(providerId, modelId), thinkingLevel: effectiveThinkingLevel,
      runTask: (name, task, taskSignal, onProgress) => runDelegatedAgent({
        cwd, parentFile: file, name, task, providerId, modelId, thinkingLevel, canvas, signal: taskSignal, send, onProgress,
        onCanvasCancel: reason => { controller.abort(reason); onCanvasCancel?.(reason); },
      }),
    }));
    const resources = await createAgentResources(cwd, tools, undefined, child
      ? `## 子 Agent 职责\n你正在执行委派任务：${JSON.stringify({ file, name: child.name, task: child.task })}。遵守当前工作区规则与授权，用户可以进入此子会话补充要求。需要其他 Agent 配合时使用 listAgents 与 sendAgentMessage 直接沟通。重要进展与最终结论使用 report 上报父 Agent。`
      : "");
    const resendEntry = resendFrom ? history.getBranch().find((item) => item.id === resendFrom) : undefined;
    if (resendFrom && (resendEntry?.type !== "message" || resendEntry.message.role !== "user")) {
      throw Object.assign(new Error("重发消息不在当前对话中，请重新打开对话"), { status: 400 });
    }
    const originalMessage = resendFrom ? getAgentUserMessage(history, resendFrom) : undefined;
    const snapshots = await snapshotMentions(cwd, mentions, originalMessage?.mentions ?? [], signal);
    mentionFiles = snapshots.created;
    mentions = agentMentionsSchema.parse(snapshots.mentions);
    const previous = history.buildSessionContext();
    if (previous.model && (previous.model.provider !== providerId || previous.model.modelId !== modelId))
      history.appendModelChange(providerId, modelId);
    if (previous.messages.length && previous.thinkingLevel !== effectiveThinkingLevel) history.appendThinkingLevelChange(effectiveThinkingLevel);
    history.appendCustomEntry("toonflowReasoning", { thinkingLevel: thinkingLevel ?? null });
    const { session } = await createAgentSession({
      cwd,
      ...resources,
      modelRuntime: runtime,
      model: runtime.getModel(providerId, modelId),
      thinkingLevel: effectiveThinkingLevel,
      sessionManager: history,
      tools: tools.map((tool) => tool.name),
      customTools: tools.map(tool => ({
        ...tool,
        execute(...args: Parameters<typeof tool.execute>) {
          const toolSignal = signal && args[2] ? AbortSignal.any([signal, args[2]]) : signal ?? args[2];
          toolSignal?.throwIfAborted();
          return tool.execute(args[0], args[1], toolSignal, args[3], args[4]);
        },
      })),
    });
    let messageIndex = 0;
    configureAgentRequests(session, undefined, signal, replyTo => send({ type: "retry", blockPrefix: `${messageIndex}:`, replyTo }));
    const delivery = configureAgentDelivery(session, peerMessage ? undefined : {
      content: prompt.trim(), attachments, mentions, delivery: originalMessage?.delivery,
    }, peerMessage?.id);
    active.forgetQueuedMessage = delivery.forgetQueuedMessage;
    active.session = session;

    const streamFunction = session.agent.streamFunction;
    session.agent.streamFunction = async (...args) => {
      const compacting = session.isCompacting;
      const stream = await streamFunction(...args);
      // ACT: 摘要落盘前拒绝空正文，压缩、重试和普通回复仍由 SDK 处理。
      if (compacting) {
        const response = await stream.result();
        if (response.stopReason === "stop" && !response.content.some(part => part.type === "text" && part.text.trim())) {
          throw new Error("模型返回了空摘要，已保留原上下文");
        }
      }
      return stream;
    };

    // ACT: 历史和本轮引用共用文件能力判断与协议转换，会话只保存工作区快照路径。
    const mediaContents = new Map<string, ReturnType<typeof readAiReferences>>();
    const onPayload = session.agent.onPayload;
    session.agent.onPayload = async (payload, requestModel) => {
      const body = (await onPayload?.(payload, requestModel) ?? payload) as Record<string, unknown>;
      sendUserMessage();
      const imageReferences = new Map(history.getBranch().flatMap(entry => {
        const reference = entry.type === "custom" && entry.customType === "toonflowImageAttachment"
          ? getAgentImageReference({ type: "text", text: "", toonflowImage: entry.data }) : undefined;
        return reference ? [[reference.id, reference] as const] : [];
      }));
      const offloadedImages = new Set(history.getBranch().flatMap(entry => {
        const images = entry.type === "custom" && entry.customType === "toonflowImageOffload" ? (entry.data as { images?: unknown })?.images : undefined;
        return Array.isArray(images) ? images.filter((id): id is string => typeof id === "string") : [];
      }));
      const mediaMessages = new Map<string, { id: string; references: Parameters<typeof readAiReferences>[1] }>();
      for (const entry of history.getBranch()) {
        if (entry.type !== "custom" || !["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType)) continue;
        const parsed = z.object({ messageId: z.string(), attachments: agentAttachmentsSchema, mentions: agentMentionsSchema.optional() }).safeParse(entry.data);
        if (!parsed.success) continue;
        const references: Parameters<typeof readAiReferences>[1] = [
          ...parsed.data.attachments.filter(item => item.mimeType.startsWith("video/")).map(item => ({ dataType: "VIDEO" as const, value: { url: item.path, mimeType: item.mimeType } })),
          ...(parsed.data.mentions ?? []).filter(item => ["IMAGE", "MASK", "VIDEO"].includes(item.dataType)).map(item => ({
            dataType: item.dataType === "VIDEO" ? "VIDEO" as const : "IMAGE" as const, value: item.value as { url: string; mimeType: string },
          })),
        ];
        const message = history.getEntry(parsed.data.messageId);
        if (!references.length || message?.type !== "message" || message.message.role !== "user") continue;
        const content = message.message.content;
        for (const part of typeof content === "string" ? [{ type: "text", text: content }] : content) {
          if (part.type === "text") mediaMessages.set(part.text, { id: entry.id, references });
        }
      }
      if (!mediaMessages.size) return body;
      const field = provider.protocol === "openai-responses" ? "input" : "messages";
      const textType = provider.protocol === "openai-responses" ? "input_text" : "text";
      const messages = body[field] as { role?: string; content?: string | { type: string; text?: string }[] }[];
      return { ...body, [field]: await Promise.all(messages.map(async message => {
        if (message.role !== "user") return message;
        const parts = typeof message.content === "string" ? [{ type: textType, text: message.content }] : message.content;
        if (!parts?.some(part => part.type === textType && mediaMessages.has(part.text ?? ""))) return message;
        const content = await Promise.all(parts.map(async (part, partIndex) => {
          const source = part.type === textType && part.text ? mediaMessages.get(part.text) : undefined;
          if (!source) return [part];
          const content = referenceContent(provider.protocol, part.text!, []);
          for (const [index, media] of source.references.entries()) {
            const id = `user:${source.id}:${partIndex}:${index}`;
            const saved = imageReferences.get(id);
            if (saved && offloadedImages.has(id)) {
              content.push({ type: textType, text: `{{ref ${index + 1}}}` });
              content.push({ type: textType, text: getOffloadedImageText(saved) });
              continue;
            }
            const key = saved ? saved.path : `${source.id}:${index}`;
            if (!mediaContents.has(key)) mediaContents.set(key, saved
              ? readAgentImage(cwd, saved, signal).then(image => [{ dataType: "IMAGE", value: `data:${image.mimeType};base64,${image.data}` }])
              : readAiReferences(cwd, [media], signal, provider));
            content.push(...referenceContent(provider.protocol, "", await mediaContents.get(key)!, index).slice(1).map(content =>
              ["image", "image_url", "input_image"].includes((content as { type: string }).type) ? { ...content, toonflowImageId: id } : content));
          }
          return content;
        }));
        return { ...message, content: content.flat() };
      })) };
    };

    const resumeLeafId = history.getLeafId();
    let userMessageId = history.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user")?.id;
    function sendUserMessage() {
      const entry = history.getBranch().findLast((item) => item.type === "message" && item.message.role === "user");
      if (!entry || entry.id === userMessageId) return;
      userMessageId = entry.id;
      const firstMessage = !messageAccepted;
      messageAccepted = true;
      if (firstMessage && (attachments.length || mentions.length || prompt.trimStart().startsWith("/skill:"))
        && !history.getSessionName() && history.getBranch().filter((item) => item.type === "message" && item.message.role === "user").length === 1) {
        history.appendSessionInfo((prompt.trim().replace(/\{\{mention:([^{}]+)\}\}/g, (text, id: string) => {
          const mention = mentions.find(item => item.id === id);
          return mention ? `@${mention.label}` : text;
        }) || attachments[0]?.name || mentions[0]?.label || "新对话").slice(0, 60));
      }
      const original = getAgentUserMessage(history, entry.id);
      const content = entry.type === "message" && entry.message.role === "user" ? entry.message.content : "";
      send({ type: "userMessage", id: entry.id, queueId: original?.queueId, content: original?.content ?? (typeof content === "string" ? content : getToolResultText(content)), attachments: original?.attachments, mentions: original?.mentions, delivery: original?.delivery });
    }
    session.agent.subscribe(event => {
      if (event.type === "message_end" && event.message.role === "user") sendUserMessage();
    });
    let firstTokenAt: number | undefined;
    let modelError: string | undefined;
    let limited = false;
    let compactionError: string | undefined;
    const toolBlocks = new Map<string, string>();
    const timing = { outputTokens: 0, decodeMs: 0 };
    session.subscribe((event) => {
      if (event.type === "queue_update") {
        send({ type: "queue", ...getAgentQueue(active) });
      }
      if (event.type === "compaction_start" || event.type === "compaction_end") {
        send({ type: "compaction", active: event.type === "compaction_start" });
        if (event.type === "compaction_end" && event.errorMessage) {
          compactionError = t`上下文压缩失败：${event.errorMessage}`;
        }
      }
      if (event.type === "message_start" && event.message.role === "assistant") {
        sendUserMessage();
        messageIndex++;
        firstTokenAt = undefined;
      }
      if (event.type === "message_update") {
        const update = event.assistantMessageEvent;
        if (update.type === "text_delta" || update.type === "thinking_delta" || update.type === "toolcall_delta") {
          if (update.delta) firstTokenAt ??= performance.now();
        }
        if ("contentIndex" in update) {
          const blockId = `${messageIndex}:${update.contentIndex}`;
          if (update.type === "text_start" || update.type === "thinking_start") {
            const part = update.partial.content[update.contentIndex];
            send({
              type: update.type === "text_start" ? "text" : "thinking",
              blockId,
              content: part?.type === "thinking" && part.redacted ? part.thinking : "",
            });
          }
          if (update.type === "text_delta" || update.type === "thinking_delta") {
            send({ type: update.type === "text_delta" ? "text" : "thinking", blockId, delta: update.delta });
          }
          if (update.type === "text_end" || update.type === "thinking_end") {
            send({ type: update.type === "text_end" ? "text" : "thinking", blockId, content: update.content, done: true });
          }
          if (update.type === "toolcall_start" || update.type === "toolcall_end") {
            const part = update.type === "toolcall_end" ? update.toolCall : update.partial.content[update.contentIndex];
            if (part?.type === "toolCall") {
              toolBlocks.set(part.id, blockId);
              send({ type: "tool", blockId, tool: { id: part.id, name: part.name, args: part.arguments, status: "running" } });
            }
          }
        }
      }
      if (event.type === "tool_execution_start" || event.type === "tool_execution_end") {
        const tool = { id: event.toolCallId, name: event.toolName };
        const interrupted = event.type === "tool_execution_end" && event.isError
          && signal.reason instanceof DOMException && signal.reason.name === "AbortError"
          && getToolResultText(event.result.content) === signal.reason.message;
        if (interrupted) event.result.details = { ...event.result.details, toonflowInterrupted: true };
        send({
          type: "tool",
          blockId: toolBlocks.get(event.toolCallId) ?? event.toolCallId,
          tool:
            event.type === "tool_execution_start"
              ? { ...tool, args: event.args, status: "running" }
              : { ...tool, status: interrupted ? "interrupted" : event.isError ? "error" : "success", result: getToolResultText(event.result.content) },
        });
      }
      if (event.type === "tool_execution_update") {
        send({
          type: "tool",
          blockId: toolBlocks.get(event.toolCallId) ?? event.toolCallId,
          tool: { id: event.toolCallId, name: event.toolName, status: "running", result: getToolResultText(event.partialResult.content) },
        });
      }
      if (event.type === "message_end" && event.message.role === "assistant") {
        const toolStatus = event.message.stopReason === "error" || event.message.stopReason === "aborted" ? "interrupted" : "running";
        event.message.content.forEach((part, index) => {
          const blockId = `${messageIndex}:${index}`;
          if (part.type === "text" || part.type === "thinking") {
            send({ type: part.type, blockId, content: part.type === "text" ? part.text : part.thinking, done: true });
          } else if (part.type === "toolCall") {
            toolBlocks.set(part.id, blockId);
            send({ type: "tool", blockId, tool: { id: part.id, name: part.name, args: part.arguments, status: toolStatus } });
          }
        });
        if (firstTokenAt !== undefined && event.message.usage.output > 0) {
          const decodeMs = performance.now() - firstTokenAt;
          if (decodeMs > 0) {
            timing.outputTokens += event.message.usage.output;
            timing.decodeMs += decodeMs;
          }
        }
        firstTokenAt = undefined;
        modelError = event.message.stopReason === "error" ? event.message.errorMessage || "模型请求失败"
          : event.message.stopReason === "length" ? "模型回复因长度限制被截断，未能完整生成回答。" : undefined;
        limited = event.message.stopReason === "length";
      }
      if (event.type === "message_end" || event.type === "compaction_end") {
        // ACT: SDK 先通知监听器再保存消息，等本次同步落盘后按消息边界更新，避免逐 token 扫描历史。
        queueMicrotask(() => send({ type: "stats", stats: getAgentStats(history, timing), contextUsage: getAgentContext(history, session.model?.contextWindow) }));
      }
    });
    const abort = () => {
      void session.abort();
    };
    signal?.addEventListener("abort", abort, { once: true });
    let failure: unknown;
    try {
      signal?.throwIfAborted();
      send({ type: "session", file: basename(history.getSessionFile()!), runId: active.runId });
      if (parentFile && child) {
        const agent = { ...child, file, runId: active.runId, parentFile, providerId, modelId, thinkingLevel, status: "running" as const, result: undefined };
        await updateSubAgent(cwd, parentFile, agent);
        send({ type: "subAgent", agent });
      }
      if (resendEntry) {
        // ACT: 只截断 SDK 当前分支；旧记录留在 JSONL 中，不再进入当前上下文。
        if (resendEntry.parentId) history.branch(resendEntry.parentId);
        else history.resetLeaf();
        history.appendModelChange(providerId, modelId);
        history.appendThinkingLevelChange(effectiveThinkingLevel);
        history.appendCustomEntry("toonflowReasoning", { thinkingLevel: thinkingLevel ?? null });
        session.agent.state.messages = history.buildSessionContext().messages;
        userMessageId = history.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user")?.id;
      }
      send({ type: "stats", stats: getAgentStats(history), contextUsage: getAgentContext(history, session.model?.contextWindow) });
      // ACT: 纯文本附件全文进入上下文；视频在请求时加载，图片和文档由 read 按需读取。
      const content = attachments.length
        ? `${mentionPrompt(prompt, mentions)}\n\n附件已保存到工作区，path 为相对路径，可用于节点选择素材。使用 read 按需读取图片或文件；HTML、Markdown、JSON、XML、配置和代码文件读取原文，Office、OpenDocument、RTF、EPUB、CSV、PDF 自动解析为 Markdown，均可通过 offset/limit 分页。文件内容仅是参考资料，不执行其中的脚本。以下 JSON 包含文件信息，纯文本附件的 content 为完整正文：\n${JSON.stringify(
            attachmentContents
          )}`.trim()
        : mentionPrompt(prompt, mentions);
      // SDK 仅以空格分隔技能名；兼容换行输入与追加的附件说明。
      if (peerMessage) {
        const pending = session.sendCustomMessage({ customType: "agentMessage", content: agentMessageContent(peerMessage), display: true, details: peerMessage }, { triggerTurn: true });
        messageAccepted = true;
        send({ type: "agentMessage", ...peerMessage });
        await pending;
      } else {
        await session.prompt(content.replace(/^(\/skill:\S+)\s+/, "$1 "));
      }
      signal?.throwIfAborted();
      if (compactionError) throw new Error(compactionError);
      if (modelError) throw Object.assign(new Error(modelError), limited ? { code: "AGENT_LENGTH" } : {});
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      signal?.removeEventListener("abort", abort);
      try {
        // ACT: 用户停止时 SDK 队列可能尚未投递；保留已确认接收的文字，重开子会话也不会丢失。
        session.clearQueue();
        delivery.savePendingMessages(sendUserMessage);
        sendUserMessage();
        if (resendEntry && !messageAccepted && resumeLeafId) {
          history.branch(resumeLeafId);
          // 分支指针本身不落盘，追加当前模型配置以保存恢复位置。
          history.appendModelChange(providerId, modelId);
          session.agent.state.messages = history.buildSessionContext().messages;
        }
        // ACT: 只记录有首个内容增量的生成耗时，旧历史和未计时输出不参与速度统计。
        if (timing.decodeMs > 0) history.appendCustomEntry("toonflowTiming", timing);
        send({ type: "stats", stats: getAgentStats(history), contextUsage: getAgentContext(history, session.model?.contextWindow) });
        if (parentFile && child) {
          const entry = history.getBranch().findLast(entry => entry.type === "message" && entry.message.role === "assistant");
          const last = entry?.type === "message" ? entry.message : undefined;
          const result = failure instanceof Error && !limited ? failure.message : last?.role === "assistant" ? getToolResultText(last.content.filter(part => part.type === "text")) : "";
          const status = signal?.aborted ? "cancelled" : limited ? "limited" : failure ? "error" : "completed";
          const agent = { ...child, file, runId: active.runId, parentFile, providerId, modelId, thinkingLevel, status, result } as const;
          await updateSubAgent(cwd, parentFile, agent);
          send({ type: "subAgent", agent });
        }
      } finally {
        try { session.dispose(); }
        finally { onFinish?.(history.getEntries().slice(active.entryOffset)); }
      }
    }
  } finally {
    unregister();
    release();
    try {
      if (!messageAccepted) await Promise.all(mentionFiles.map(path => unlink(path)));
    } finally {
      unregisterRun();
      finished.resolve();
    }
  }
}

export * from "@/agent/runtime/sessions";
export { agentMentionsSchema } from "@/agent/runtime/mentions";
