import { z } from "zod";
import { basename, dirname } from "node:path";
import { readFile, readdir, stat } from "node:fs/promises";
import {
  createAgentSession,
  calculateContextTokens,
  estimateTokens,
  getLastAssistantUsage,
  parseSessionEntries,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import type { FileEntry, SessionEntry } from "@earendil-works/pi-coding-agent";
import type { CanvasContext, QuestionContext } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent } from "@/agent/runtime/types";
import conf from "@/utils/conf";
import { providerSchema, getModelLimits, readAiReferences, referenceContent } from "@/utils/ai";
import { createAgentTools } from "@/agent/tools";
import { createAgentResources } from "@/agent/runtime/resources";
import { createAgentModel } from "@/agent/runtime/model";
import { createSubAgentTool } from "@/agent/tools/subAgent";
import { createMemoryTool } from "@/agent/tools/memory";
import { isMemoryEnabled } from "@/utils/personalization";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

export const agentAttachmentsSchema = z
  .array(
    z.strictObject({
      name: z.string().min(1).max(255),
      path: z.string().min(1).max(4096),
      mimeType: z.string().regex(/^(image|video)\/[a-zA-Z0-9.+-]+$/),
    })
  )
  .max(20);

type AgentOptions = {
  prompt: string;
  attachments?: z.infer<typeof agentAttachmentsSchema>;
  cwd: string;
  providerId: string;
  modelId: string;
  thinkingLevel?: "off" | "low" | "medium" | "high";
  sessionFile?: string;
  resendFrom?: string;
  canvas?: CanvasContext;
  question?: QuestionContext;
  signal?: AbortSignal;
};

export async function run(
  {
    prompt,
    attachments = [],
    cwd,
    providerId,
    modelId,
    thinkingLevel = "off",
    sessionFile,
    resendFrom,
    canvas,
    question,
    signal,
  }: AgentOptions,
  send: (event: AgentEvent) => void
) {
  if (!prompt.trim() && !attachments.length) throw Object.assign(new Error("请输入消息或添加图片、视频"), { status: 400 });
  for (const attachment of attachments) {
    const { path } = await resolveWorkspacePath(cwd, attachment.path);
    const info = await stat(path);
    if (!info.isFile() || !info.size || info.size > 100 * 1024 * 1024) {
      throw Object.assign(new Error("附件必须是工作区内非空且不超过 100 MB 的文件"), { status: 400 });
    }
  }
  if (resendFrom && !sessionFile) throw Object.assign(new Error("重发需要指定原对话"), { status: 400 });
  const { provider, runtime } = await createAgentModel(providerId, modelId, thinkingLevel);
  const tools = await createAgentTools(cwd, canvas, question);
  if (isMemoryEnabled()) {
    const memoryTool = createMemoryTool();
    if (tools.some(tool => tool.name === memoryTool.name)) throw new Error("工具名称 memory 已被内置全局记忆工具占用");
    tools.push(memoryTool);
  }
  tools.push(await createSubAgentTool({ cwd, tools, canvas, modelRuntime: runtime, model: runtime.getModel(providerId, modelId), thinkingLevel }));
  const resources = await createAgentResources(cwd, tools);
  signal?.throwIfAborted();
  const { path: sessionsDir } = await resolveWorkspacePath(cwd, ".agent/sessions", true);
  const sessionPath = sessionFile ? (await resolveWorkspacePath(sessionsDir, sessionFile)).path : undefined;
  // ACT: SDK 新会话先分配文件名、首条回复才落盘；只锁所属文件，允许不同对话同时运行。
  const newHistory = sessionPath ? undefined : SessionManager.create(cwd, sessionsDir);
  const release = lockWorkspaceFiles([sessionPath ?? newHistory!.getSessionFile()!]);
  try {
    if (sessionPath) {
      const file = await stat(sessionPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") throw Object.assign(new Error("会话不存在，请重新打开对话"), { status: 404 });
        throw error;
      });
      if (!file.isFile()) throw Object.assign(new Error("会话必须是普通文件"), { status: 400 });
    }
    const history = newHistory ?? SessionManager.open(sessionPath!, sessionsDir, cwd);
    const resendEntry = resendFrom ? history.getBranch().find((item) => item.id === resendFrom) : undefined;
    if (resendFrom && (resendEntry?.type !== "message" || resendEntry.message.role !== "user")) {
      throw Object.assign(new Error("重发消息不在当前对话中，请重新打开对话"), { status: 400 });
    }
    const previous = history.buildSessionContext();
    if (previous.model && (previous.model.provider !== providerId || previous.model.modelId !== modelId))
      history.appendModelChange(providerId, modelId);
    if (previous.messages.length && previous.thinkingLevel !== thinkingLevel) history.appendThinkingLevelChange(thinkingLevel);
    const { session } = await createAgentSession({
      cwd,
      ...resources,
      modelRuntime: runtime,
      model: runtime.getModel(providerId, modelId),
      thinkingLevel,
      sessionManager: history,
      tools: tools.map((tool) => tool.name),
      customTools: tools,
    });

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

    // ACT: SDK 原生只有文字和图片；视频复用媒体协议转换，会话仍只保存文件引用。
    const videoContents = new Map<string, ReturnType<typeof readAiReferences>>();
    const onPayload = session.agent.onPayload;
    session.agent.onPayload = async (payload, requestModel) => {
      const body = (await onPayload?.(payload, requestModel) ?? payload) as Record<string, unknown>;
      sendUserMessage();
      const videoMessages = new Map<string, { id: string; attachments: z.infer<typeof agentAttachmentsSchema> }>();
      for (const entry of history.getBranch()) {
        if (entry.type !== "custom" || !["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType)) continue;
        const parsed = z.object({ messageId: z.string(), attachments: agentAttachmentsSchema }).safeParse(entry.data);
        if (!parsed.success) continue;
        const videos = parsed.data.attachments.filter(item => item.mimeType.startsWith("video/"));
        const message = history.getEntry(parsed.data.messageId);
        if (!videos.length || message?.type !== "message" || message.message.role !== "user") continue;
        const content = message.message.content;
        for (const part of typeof content === "string" ? [{ type: "text", text: content }] : content) {
          if (part.type === "text") videoMessages.set(part.text, { id: entry.id, attachments: videos });
        }
      }
      if (!videoMessages.size) return body;
      const field = provider.protocol === "openai-responses" ? "input" : "messages";
      const textType = provider.protocol === "openai-responses" ? "input_text" : "text";
      const messages = body[field] as { role?: string; content?: string | { type: string; text?: string }[] }[];
      return { ...body, [field]: await Promise.all(messages.map(async message => {
        if (message.role !== "user") return message;
        const parts = typeof message.content === "string" ? [{ type: textType, text: message.content }] : message.content;
        if (!parts?.some(part => part.type === textType && videoMessages.has(part.text ?? ""))) return message;
        const content = await Promise.all(parts.map(async part => {
          const source = part.type === textType && part.text ? videoMessages.get(part.text) : undefined;
          if (!source) return [part];
          if (!videoContents.has(source.id)) videoContents.set(source.id, readAiReferences(cwd, source.attachments.map(item => ({
            dataType: "VIDEO", value: { url: item.path, mimeType: item.mimeType },
          })), signal));
          return referenceContent(provider.protocol, part.text!, await videoContents.get(source.id)!);
        }));
        return { ...message, content: content.flat() };
      })) };
    };

    const resumeLeafId = history.getLeafId();
    let messageAccepted = false;
    let userMessageId = history.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user")?.id;
    function sendUserMessage() {
      const entry = history.getBranch().findLast((item) => item.type === "message" && item.message.role === "user");
      if (!entry || entry.id === userMessageId) return;
      userMessageId = entry.id;
      messageAccepted = true;
      if (attachments.length || prompt.trimStart().startsWith("/skill:")) {
        history.appendCustomEntry("toonflowUserMessage", { messageId: entry.id, content: prompt.trim(), attachments });
        if (!history.getSessionName() && history.getBranch().filter((item) => item.type === "message" && item.message.role === "user").length === 1) {
          history.appendSessionInfo((prompt.trim() || attachments[0]!.name).slice(0, 60));
        }
      }
      send({ type: "userMessage", id: entry.id });
    }
    let firstTokenAt: number | undefined;
    let modelError: string | undefined;
    let compactionError: string | undefined;
    let messageIndex = 0;
    const toolBlocks = new Map<string, string>();
    const timing = { outputTokens: 0, decodeMs: 0 };
    session.subscribe((event) => {
      if (event.type === "compaction_start" || event.type === "compaction_end") {
        send({ type: "compaction", active: event.type === "compaction_start" });
        if (event.type === "compaction_end" && event.errorMessage) {
          compactionError = `上下文压缩失败：${event.errorMessage}`;
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
        send({
          type: "tool",
          blockId: toolBlocks.get(event.toolCallId) ?? event.toolCallId,
          tool:
            event.type === "tool_execution_start"
              ? { ...tool, args: event.args, status: "running" }
              : { ...tool, status: event.isError ? "error" : "success", result: getToolResultText(event.result.content) },
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
        event.message.content.forEach((part, index) => {
          const blockId = `${messageIndex}:${index}`;
          if (part.type === "text" || part.type === "thinking") {
            send({ type: part.type, blockId, content: part.type === "text" ? part.text : part.thinking, done: true });
          } else if (part.type === "toolCall") {
            toolBlocks.set(part.id, blockId);
            send({ type: "tool", blockId, tool: { id: part.id, name: part.name, args: part.arguments, status: "running" } });
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
      }
    });
    const abort = () => {
      void session.abort();
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      signal?.throwIfAborted();
      if (resendEntry) {
        // ACT: 只截断 SDK 当前分支；旧记录留在 JSONL 中，不再进入当前上下文。
        if (resendEntry.parentId) history.branch(resendEntry.parentId);
        else history.resetLeaf();
        history.appendModelChange(providerId, modelId);
        history.appendThinkingLevelChange(thinkingLevel);
        session.agent.state.messages = history.buildSessionContext().messages;
        userMessageId = history.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user")?.id;
      }
      send({ type: "session", file: basename(history.getSessionFile()!) });
      // ACT: 附件在会话中仅保存工作区引用，视频在请求发送时加载，图片由 read 按需读取。
      const content = attachments.length
        ? `${prompt.trim()}\n\n附件已保存到工作区，path 为相对路径，可用于节点选择素材。以下 JSON 仅为文件信息：\n${JSON.stringify(
            attachments
          )}`.trim()
        : prompt.trim();
      // SDK 仅以空格分隔技能名；兼容换行输入与追加的附件说明。
      await session.prompt(content.replace(/^(\/skill:\S+)\s+/, "$1 "));
      if (compactionError) throw new Error(compactionError);
      if (modelError) throw new Error(modelError);
    } finally {
      signal?.removeEventListener("abort", abort);
      try {
        sendUserMessage();
        if (resendEntry && !messageAccepted && resumeLeafId) {
          history.branch(resumeLeafId);
          // 分支指针本身不落盘，追加当前模型配置以保存恢复位置。
          history.appendModelChange(providerId, modelId);
          session.agent.state.messages = history.buildSessionContext().messages;
        }
        // ACT: 只记录有首个内容增量的生成耗时，旧历史和未计时输出不参与速度统计。
        if (timing.decodeMs > 0) history.appendCustomEntry("toonflowTiming", timing);
        send({ type: "stats", stats: getAgentStats(history), contextUsage: session.getContextUsage() });
      } finally {
        session.dispose();
      }
    }
  } finally {
    release();
  }
}

export async function deleteAgentMessage(cwd: string, path: string, options: { entryIds?: string[]; replyTo?: string }) {
  if (Boolean(options.entryIds) === Boolean(options.replyTo)) {
    throw Object.assign(new Error("请选择要删除的消息"), { status: 400 });
  }
  const release = lockWorkspaceFiles([path]);
  try {
    // ACT: 删除会重写 JSONL，必须拒绝损坏行，不能沿用 SDK 会跳过损坏行的读取器。
    let entries: FileEntry[];
    try {
      entries = (await readFile(path, "utf8"))
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      throw Object.assign(new Error("会话文件损坏，无法删除消息"), { status: 400 });
    }
    if (entries[0]?.type !== "session") throw Object.assign(new Error("会话文件无效"), { status: 400 });
    const entrySchema = z.object({ type: z.string(), id: z.string().min(1), parentId: z.string().nullable(), timestamp: z.string() });
    const knownIds = new Set<string>();
    for (const entry of entries.slice(1)) {
      const parsed = entrySchema.safeParse(entry);
      if (!parsed.success || knownIds.has(parsed.data.id) || (parsed.data.parentId !== null && !knownIds.has(parsed.data.parentId))) {
        throw Object.assign(new Error("会话记录结构无效，无法删除消息"), { status: 400 });
      }
      knownIds.add(parsed.data.id);
    }
    const history = SessionManager.inMemory(cwd, undefined, entries);
    const branch = history.getBranch();
    const isUserEntry = (entry: SessionEntry) =>
      (entry.type === "message" && entry.message.role === "user") || (entry.type === "custom" && entry.customType === "toonflowDeletedUser");
    let targets = branch.filter((entry) => options.entryIds?.includes(entry.id));
    if (options.replyTo) {
      const index = branch.findIndex((entry) => entry.id === options.replyTo && isUserEntry(entry));
      if (index < 0) throw Object.assign(new Error("消息不在当前对话中，请重新打开对话"), { status: 400 });
      const nextUser = branch.findIndex((entry, position) => position > index && isUserEntry(entry));
      targets = branch
        .slice(index + 1, nextUser < 0 ? undefined : nextUser)
        .filter((entry) => entry.type === "message" && entry.message.role === "assistant");
    }
    if (
      options.entryIds &&
      (new Set(options.entryIds).size !== targets.length ||
        targets.some((entry) => entry.type !== "message" || (entry.message.role !== "user" && entry.message.role !== "assistant")))
    ) {
      throw Object.assign(new Error("消息不在当前对话中，请重新打开对话"), { status: 400 });
    }
    if (!targets.length) return await getAgentSession(cwd, path);

    const removedIds = new Set(targets.map((entry) => entry.id));
    const toolCallIds = new Set(
      targets.flatMap((entry) =>
        entry.type === "message" && entry.message.role === "assistant"
          ? entry.message.content.filter((part) => part.type === "toolCall").map((part) => part.id)
          : []
      )
    );
    const affectedIds = new Set(removedIds);
    const timedTurns = new Map<string, boolean>();
    for (const entry of history.getEntries()) {
      if ((entry.parentId && affectedIds.has(entry.parentId)) || (entry.type === "branch_summary" && affectedIds.has(entry.fromId))) {
        affectedIds.add(entry.id);
      }
      const timingChanged = !isUserEntry(entry) && (removedIds.has(entry.id) || Boolean(entry.parentId && timedTurns.get(entry.parentId)));
      timedTurns.set(entry.id, timingChanged);
      if (
        (entry.type === "message" && entry.message.role === "toolResult" && toolCallIds.has(entry.message.toolCallId)) ||
        (entry.type === "custom" &&
          ["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType) &&
          removedIds.has((entry.data as { messageId?: string } | undefined)?.messageId ?? "")) ||
        (entry.type === "custom" && entry.customType === "toonflowTiming" && timingChanged) ||
        ((entry.type === "compaction" || entry.type === "branch_summary") && affectedIds.has(entry.id)) ||
        (entry.type === "label" && removedIds.has(entry.targetId))
      ) {
        removedIds.add(entry.id);
      }
    }
    // ACT: 清除正文并保留树节点，避免分支、叶指针和实时回复的 user 锚点失效；摘要也不能带回已删内容。
    entries = [
      entries[0],
      ...history.getEntries().map((entry) =>
        removedIds.has(entry.id)
          ? {
              type: "custom" as const,
              id: entry.id,
              parentId: entry.parentId,
              timestamp: new Date().toISOString(),
              customType: isUserEntry(entry) ? "toonflowDeletedUser" : "toonflowDeletedEntry",
            }
          : entry
      ),
    ];
    await writeWorkspaceFile(path, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
    return await getAgentSession(cwd, path);
  } finally {
    release();
  }
}

export async function createAgentConversation(cwd: string) {
  const { path: directory } = await resolveWorkspacePath(cwd, ".agent/sessions", true);
  const history = SessionManager.create(cwd, directory);
  const path = history.getSessionFile()!;
  // ACT: SDK 默认等首条回复才落盘；先保存会话头，让空对话也能被历史列表读取。
  await writeWorkspaceFile(path, `${JSON.stringify(history.getHeader())}\n`, true);
  return getAgentSession(cwd, path);
}

export async function renameAgentSession(cwd: string, path: string, name: string) {
  const release = lockWorkspaceFiles([path]);
  try {
    const entries = parseSessionEntries(await readFile(path, "utf8"));
    if (entries[0]?.type !== "session") throw Object.assign(new Error("会话文件无效"), { status: 400 });
    const history = SessionManager.open(path, dirname(path), cwd);
    history.appendSessionInfo(name);
    return { name: history.getSessionName()! };
  } finally {
    release();
  }
}

export async function listAgentSessions(cwd: string, directory: string) {
  const files = new Set((await readdir(directory, { withFileTypes: true })).filter((item) => item.isFile()).map((item) => item.name));
  const sessions = await SessionManager.list(cwd, directory);
  return sessions
    .filter((item) => files.has(basename(item.path)))
    .sort((left, right) => right.modified.getTime() - left.modified.getTime())
    .map((item) => ({
      file: basename(item.path),
      name: item.name || (item.messageCount ? item.firstMessage.trim().slice(0, 60) : "") || "新对话",
      modified: item.modified,
      messageCount: item.messageCount,
    }));
}

export async function getAgentSession(cwd: string, path: string) {
  const entries = parseSessionEntries(await readFile(path, "utf8"));
  if (entries[0]?.type !== "session") throw Object.assign(new Error("会话文件无效"), { status: 400 });
  const history = SessionManager.inMemory(cwd, undefined, entries);
  const branch = history.getBranch();
  const attachmentMessages = new Map(
    branch.flatMap((entry) => {
      if (entry.type !== "custom" || !["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType)) return [];
      const parsed = z.object({ messageId: z.string(), content: z.string(), attachments: agentAttachmentsSchema }).safeParse(entry.data);
      return parsed.success ? [[parsed.data.messageId, parsed.data] as const] : [];
    })
  );
  const toolResults = new Map(
    branch.flatMap((entry) =>
      entry.type === "message" && entry.message.role === "toolResult" ? [[entry.message.toolCallId, entry.message] as const] : []
    )
  );
  let replyTo: string | undefined;
  const entriesMessages = branch.flatMap((entry) => {
    if (entry.type === "custom" && entry.customType === "toonflowDeletedUser") replyTo = entry.id;
    if (entry.type !== "message" || (entry.message.role !== "user" && entry.message.role !== "assistant")) return [];
    const message = entry.message;
    if (message.role === "user") replyTo = entry.id;
    const attachmentMessage = message.role === "user" ? attachmentMessages.get(entry.id) : undefined;
    const attachments = attachmentMessage?.attachments;
    const parts =
      message.role === "assistant"
        ? message.content
            .map((part, index) => {
              const id = `${entry.id}:${index}`;
              if (part.type === "text") return { id, type: "text" as const, content: part.text };
              if (part.type === "thinking") return { id, type: "thinking" as const, content: part.thinking, collapsed: true };
              if (part.type === "toolCall") {
                const result = toolResults.get(part.id);
                return {
                  id,
                  type: "tool" as const,
                  tool: {
                    id: part.id,
                    name: part.name,
                    args: part.arguments,
                    status: result ? (result.isError ? "error" : "success") : "interrupted",
                    result: result ? getToolResultText(result.content) : undefined,
                  },
                };
              }
            })
            .filter((part) => part !== undefined)
        : [];
    const content =
      message.role === "assistant"
        ? ""
        : attachmentMessage?.content ??
          (typeof message.content === "string"
            ? message.content
            : message.content
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join(""));
    const error = message.role === "assistant" ? message.errorMessage : undefined;
    return [
      {
        id: entry.id,
        entryId: entry.id,
        replyTo: message.role === "assistant" ? replyTo : undefined,
        role: message.role,
        content,
        parts,
        error,
        attachments,
      },
    ];
  });
  const groupedMessages: typeof entriesMessages = [];
  for (const message of entriesMessages) {
    const previous = groupedMessages.at(-1);
    if (message.role === "assistant" && message.replyTo && previous?.role === "assistant" && previous.replyTo === message.replyTo) {
      previous.parts.push(...message.parts);
      previous.error = message.error;
    } else groupedMessages.push(message);
  }
  // ACT: 同轮的工具调用与多步回复合并后，只拼接一次正文。
  for (const message of groupedMessages) {
    if (message.role === "assistant") message.content = message.parts.filter((part) => part.type === "text").map((part) => part.content).join("\n\n");
  }
  const messages = groupedMessages.filter((message) => message.content || message.parts.length || message.error || message.attachments?.length);
  const firstUserMessage = messages.find((item) => item.role === "user");
  const context = history.buildSessionContext();
  const lastReply = history.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "assistant");
  const model =
    lastReply?.type === "message" && lastReply.message.role === "assistant"
      ? { provider: lastReply.message.provider, modelId: lastReply.message.model }
      : context.model;
  const providers = conf.get("settings", {}).customProviders;
  const provider = providerSchema.safeParse(Array.isArray(providers) ? providers.find((item) => item?.id === model?.provider) : undefined);
  const configuredModel = provider.success ? provider.data.models.find((item) => item.id === model?.modelId) : undefined;
  return {
    file: basename(path),
    name: history.getSessionName() || (firstUserMessage?.content.trim() || firstUserMessage?.attachments?.[0]?.name)?.slice(0, 60) || "新对话",
    messages,
    stats: getAgentStats(history),
    contextUsage: configuredModel && model ? getAgentContext(history, getModelLimits(model.provider, configuredModel).contextWindow) : undefined,
    providerId: model?.provider,
    modelId: model?.modelId,
    thinkingLevel: context.thinkingLevel,
  };
}

function getToolResultText(content: { type: string; text?: string }[]) {
  return content.map((part) => (part.type === "text" ? part.text : `[${part.type}]`)).join("\n");
}

function getAgentStats(history: SessionManager) {
  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
  let outputTokens = 0;
  let decodeMs = 0;
  for (const entry of history.getBranch()) {
    const usage =
      entry.type === "compaction" || entry.type === "branch_summary"
        ? entry.usage
        : entry.type === "message" && (entry.message.role === "assistant" || entry.message.role === "toolResult")
        ? entry.message.usage
        : undefined;
    if (usage) {
      tokens.input += usage.input;
      tokens.output += usage.output;
      tokens.cacheRead += usage.cacheRead;
      tokens.cacheWrite += usage.cacheWrite;
    }
    if (entry.type === "custom" && entry.customType === "toonflowTiming") {
      const timing = entry.data as { outputTokens?: number; decodeMs?: number } | undefined;
      if (
        typeof timing?.outputTokens === "number" &&
        Number.isFinite(timing.outputTokens) &&
        timing.outputTokens > 0 &&
        typeof timing.decodeMs === "number" &&
        Number.isFinite(timing.decodeMs) &&
        timing.decodeMs > 0
      ) {
        outputTokens += timing.outputTokens;
        decodeMs += timing.decodeMs;
      }
    }
  }
  tokens.total = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite;
  return { tokens, tokensPerSecond: decodeMs > 0 ? (outputTokens * 1000) / decodeMs : undefined };
}

function getAgentContext(history: SessionManager, contextWindow: number) {
  const branch = history.getBranch();
  const compactionIndex = branch.findLastIndex((entry) => entry.type === "compaction");
  const recent = branch.slice(compactionIndex + 1);
  const usage = getLastAssistantUsage(recent);
  const messages = history.buildSessionContext().messages;
  const usageIndex = messages.findLastIndex((message) => message.role === "assistant" && message.usage === usage);
  const deletedAfterReply = branch.some(
    (entry) =>
      entry.type === "custom" &&
      (entry.customType === "toonflowDeletedUser" || entry.customType === "toonflowDeletedEntry") &&
      Date.parse(entry.timestamp) >= (messages[usageIndex]?.timestamp ?? 0)
  );
  const tokens =
    usage && usageIndex >= 0 && !deletedAfterReply
      ? calculateContextTokens(usage) + messages.slice(usageIndex + 1).reduce((total, message) => total + estimateTokens(message), 0)
      : compactionIndex >= 0 && !deletedAfterReply
      ? null
      : messages.reduce((total, message) => total + estimateTokens(message), 0);
  return { tokens, contextWindow, percent: tokens === null ? null : (tokens / contextWindow) * 100 };
}
