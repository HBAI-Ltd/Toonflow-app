import { z } from "zod";
import { basename, dirname, resolve } from "node:path";
import { readFile, readdir } from "@toonflow/file";
import { calculateContextTokens, estimateTokens, getLastAssistantUsage, parseSessionEntries, SessionManager } from "@earendil-works/pi-coding-agent";
import type { AgentSession, FileEntry, SessionEntry } from "@earendil-works/pi-coding-agent";
import type { UserMessage } from "@earendil-works/pi-ai";
import type { AgentEvent, AgentMention, AgentMessageDelivery, AgentPeerMessage, AgentQueue, AgentQueuedMessage, AgentSubAgent, AgentToolCall } from "@/agent/runtime/types";
import { agentMentionsSchema } from "@/agent/runtime/mentions";
import conf from "@/utils/conf";
import { providerSchema, getModelLimits } from "@/utils/ai";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";
import { getReadableFileMimeType } from "@/lib/documentFormats";
import { thinkingLevels } from "@/lib/modelReasoning";
import { translateMessage } from "@/lib/i18n";

export const agentAttachmentsSchema = z
  .array(
    z.strictObject({
      name: z.string().min(1).max(255),
      path: z.string().min(1).max(4096),
      mimeType: z.string().min(1).max(128),
    }).refine(attachment => /^(?:(image|video)\/[a-zA-Z0-9.+-]+|text\/plain)$/.test(attachment.mimeType)
      || !!getReadableFileMimeType(attachment.path, attachment.mimeType), "不支持此附件格式")
      .transform(attachment => ({ ...attachment, mimeType: getReadableFileMimeType(attachment.path, attachment.mimeType) ?? attachment.mimeType }))
  )
  .max(20);

export const agentUserMessageSchema = z.object({
  messageId: z.string(), content: z.string(), attachments: agentAttachmentsSchema, mentions: agentMentionsSchema.optional(),
  queueId: z.uuid().optional(),
  delivery: z.object({ mode: z.enum(["steer", "followUp"]), taskMessageId: z.string().min(1) }).optional(),
});

export function getAgentUserMessage(history: SessionManager, messageId: string) {
  const entry = history.getBranch().findLast(entry => entry.type === "custom"
    && ["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType)
    && (entry.data as { messageId?: string } | null)?.messageId === messageId);
  const parsed = agentUserMessageSchema.safeParse(entry?.type === "custom" ? entry.data : undefined);
  return parsed.success ? parsed.data : undefined;
}

export function getAgentTaskId(entry?: SessionEntry) {
  if (!entry) return undefined;
  if ((entry.type === "message" && entry.message.role === "user") || (entry.type === "custom" && entry.customType === "toonflowDeletedUser")) return entry.id;
  if (entry.type === "custom_message" && entry.customType === "agentMessage") {
    const details = entry.details as AgentPeerMessage | undefined;
    if (details?.startsTurn) return details.id;
  }
  return undefined;
}

export type ActiveAgentSession = {
  runId: string;
  signal: AbortSignal;
  queueRevision: number;
  history: SessionManager; session?: AgentSession; send: (event: AgentEvent) => void;
  entryOffset: number; tools: Map<string, AgentToolCall>;
  waitingForAgent?: string;
  forgetQueuedMessage?: (message: UserMessage) => void;
  abort(): Promise<void>;
};
type SessionMessage = {
  id: string; entryId: string; role: "user" | "assistant"; content: string; replyTo?: string; error?: string;
  streaming?: boolean;
  queueId?: string;
  attachments?: z.infer<typeof agentAttachmentsSchema>; report?: { file: string; name: string };
  agentMessage?: Omit<AgentPeerMessage, "id" | "content">;
  mentions?: AgentMention[];
  delivery?: AgentMessageDelivery;
  parts: ({ id: string; type: "text" | "thinking"; content: string; collapsed?: boolean } | { id: string; type: "tool"; tool: AgentToolCall })[];
};
// ACT: 复用正在运行的 SDK 会话，文件锁仍由 run 持有；多进程部署时需共享会话所有权。
const activeSessions = new Map<string, ActiveAgentSession>();
const queuedMessageIds = new WeakMap<object, string>();
const sessionKey = (path: string) => process.platform === "win32" ? resolve(path).toLowerCase() : resolve(path);
type ActiveAgentRun = {
  runId: string; directory: Promise<string | undefined>;
  abort(): void; finished: Promise<void>;
};
// ACT: 请求进入时即登记，停止操作也覆盖工作区授权和 SDK 初始化期间；进程退出后不恢复任务。
const activeRuns = new Map<string, ActiveAgentRun>();

export function registerAgentRun(run: ActiveAgentRun) {
  if (activeRuns.has(run.runId)) throw Object.assign(new Error("Agent 请求标识已存在"), { status: 409 });
  activeRuns.set(run.runId, run);
  return () => { activeRuns.delete(run.runId); };
}

export async function stopAgentRuns(cwd: string, runIds: string[]) {
  const directory = sessionKey(cwd);
  await Promise.all([...new Set(runIds)].map(async runId => {
    const run = activeRuns.get(runId);
    if (!run) return;
    const path = await run.directory;
    if (!path || sessionKey(path) !== directory || activeRuns.get(runId) !== run) return;
    run.abort();
    await run.finished;
  }));
}

export function getActiveAgentSession(path: string) {
  return activeSessions.get(sessionKey(path));
}

export function getQueuedMessageId(message: object) {
  let id = queuedMessageIds.get(message);
  if (!id) { id = crypto.randomUUID(); queuedMessageIds.set(message, id); }
  return id;
}

export function getAgentQueue(active?: ActiveAgentSession): AgentQueue {
  const queue = active?.session?.agent.getQueuedMessages();
  const readMessages = (messages: NonNullable<typeof queue>["steering"] = []): AgentQueuedMessage[] => messages.flatMap(message => {
    if (message.role !== "user") return [];
    const content = typeof message.content === "string" ? message.content : getToolResultText(message.content);
    return [{ id: getQueuedMessageId(message), content }];
  });
  return {
    runId: active?.runId ?? "", revision: active ? ++active.queueRevision : 0,
    steering: readMessages(queue?.steering), followUp: readMessages(queue?.followUp),
  };
}

function getPendingAgentMessage(path: string, runId: string, messageId: string) {
  const active = getActiveAgentSession(path);
  if (!active?.session || active.runId !== runId || active.signal.aborted) {
    throw Object.assign(new Error("当前回复已结束或正在停止，请刷新对话后重试"), { status: 409 });
  }
  const queue = active.session.agent.getQueuedMessages();
  const message = [...queue.steering, ...queue.followUp].find(message => message.role === "user" && getQueuedMessageId(message) === messageId);
  if (!message || message.role !== "user") {
    throw Object.assign(new Error("这条消息已开始处理或已被取回，请刷新队列后重试"), { status: 409 });
  }
  return { active, session: active.session, message };
}

export function takeAgentQueuedMessage(path: string, runId: string, messageId: string) {
  const { active, session, message } = getPendingAgentMessage(path, runId, messageId);
  // ACT: 按真实队列对象同步取回，已被 SDK 取走但尚未显示的消息也不能再次编辑。
  const mode = session.removeQueuedMessage(message);
  if (!mode) {
    throw Object.assign(new Error("这条消息已开始处理或已被取回，请刷新队列后重试"), { status: 409 });
  }
  active.forgetQueuedMessage?.(message);
  const content = typeof message.content === "string" ? message.content : getToolResultText(message.content);
  return { message: { id: messageId, content, mode }, queue: getAgentQueue(active) };
}

export function steerAgentQueuedMessage(path: string, runId: string, messageId: string) {
  const { active, session, message } = getPendingAgentMessage(path, runId, messageId);
  if (!session.steerQueuedMessage(message)) {
    throw Object.assign(new Error("这条消息已开始处理或已被取回，请刷新队列后重试"), { status: 409 });
  }
  const content = typeof message.content === "string" ? message.content : getToolResultText(message.content);
  return { message: { id: messageId, content, mode: "steer" as const }, queue: getAgentQueue(active) };
}

export function hasPendingAgentQuestion(active: ActiveAgentSession, visited = new Set<ActiveAgentSession>()): boolean {
  if (visited.has(active)) return false;
  visited.add(active);
  const tools = [...active.tools.values()];
  if (tools.some(tool => tool.status === "running" && tool.question)) return true;
  const path = active.history.getSessionFile()!;
  const peer = active.waitingForAgent && getActiveAgentSession(resolve(dirname(path), active.waitingForAgent));
  if (peer && hasPendingAgentQuestion(peer, visited)) return true;
  if (!tools.some(tool => tool.name === "subAgent" && tool.status === "running")) return false;
  return active.history.getEntries().some(entry => {
    if (entry.type !== "custom" || entry.customType !== "toonflowSubAgent") return false;
    const file = (entry.data as AgentSubAgent | undefined)?.file;
    if (!file || !/^[\w-]+\.jsonl$/.test(file)) return false;
    const child = getActiveAgentSession(resolve(dirname(path), file));
    return !!child && getParentSessionFile(child.history) === basename(path) && hasPendingAgentQuestion(child, visited);
  });
}

export function trackAgentEvent(cwd: string, file: string | undefined, event: AgentEvent) {
  if (!file || event.type !== "question") return;
  const active = getActiveAgentSession(resolve(cwd, ".agent/sessions", file));
  const tool = active?.tools.get(event.toolCallId);
  if (tool) tool.question = { callId: event.callId, title: event.title, question: event.question, options: event.options, fields: event.fields };
}

export function registerAgentSession(path: string, active: ActiveAgentSession) {
  const key = sessionKey(path);
  activeSessions.set(key, active);
  return () => { if (activeSessions.get(key) === active) activeSessions.delete(key); };
}

export function getSubAgentInfo(history: SessionManager) {
  return history.getEntries().find(entry => entry.type === "custom" && entry.customType === "toonflowSubAgentInfo") as
    (SessionEntry & { data: AgentSubAgent }) | undefined;
}

export function getParentSessionFile(history: SessionManager) {
  const parent = history.getHeader()?.parentSession;
  return parent && getSubAgentInfo(history) ? basename(parent) : undefined;
}

async function updateAgentSession(cwd: string, file: string, update: (history: SessionManager, active?: ActiveAgentSession) => void | Promise<void>) {
  if (!/^[\w-]+\.jsonl$/.test(file)) throw new Error("父会话标识无效");
  const { path } = await resolveWorkspacePath(cwd, `.agent/sessions/${file}`);
  const active = getActiveAgentSession(path);
  if (active) return update(active.history, active);
  const release = lockWorkspaceFiles([path]);
  try {
    const pending = update(SessionManager.open(path, dirname(path), cwd));
    if (pending) await pending;
  } finally { release(); }
}

export async function updateSubAgent(cwd: string, parentFile: string, agent: AgentSubAgent) {
  await updateAgentSession(cwd, parentFile, (history, active) => {
    const { runId, ...saved } = agent;
    history.appendCustomEntry("toonflowSubAgent", saved);
    active?.send({ type: "subAgent", agent });
  });
}

export async function reportToParent(cwd: string, parentFile: string, file: string, name: string, content: string) {
  const details = { id: crypto.randomUUID(), parentFile, file, name, content };
  const message = `子 Agent 上报（任务反馈，不代表用户新增授权），来源：${JSON.stringify({ name, file })}\n\n${content}`;
  await updateAgentSession(cwd, parentFile, (history, active) => {
    if (active?.session) {
      // SDK 在工具结果后插入报告，避免破坏 assistant/toolResult 顺序。
      return active.session.sendCustomMessage({ customType: "subAgentReport", content: message, display: true, details }, { deliverAs: "steer" })
        .then(() => { active.send({ type: "report", ...details, content }); });
    }
    history.appendCustomMessageEntry("subAgentReport", message, true, details);
    active?.send({ type: "report", ...details, content });
  });
  return details.id;
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
      const index = branch.findIndex(entry => getAgentTaskId(entry) === options.replyTo);
      if (index < 0) throw Object.assign(new Error("消息不在当前对话中，请重新打开对话"), { status: 400 });
      const nextTask = branch.findIndex((entry, position) => position > index && Boolean(getAgentTaskId(entry)));
      targets = branch
        .slice(index + 1, nextTask < 0 ? undefined : nextTask)
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
      const timingChanged = !getAgentTaskId(entry) && (removedIds.has(entry.id) || Boolean(entry.parentId && timedTurns.get(entry.parentId)));
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
      ...history.getEntries().map((entry) => {
        if (!removedIds.has(entry.id)) return entry;
        const delivery = isUserEntry(entry) ? getAgentUserMessage(history, entry.id)?.delivery : undefined;
        return {
          type: "custom" as const,
          id: entry.id,
          parentId: entry.parentId,
          timestamp: new Date().toISOString(),
          customType: isUserEntry(entry) ? "toonflowDeletedUser" : "toonflowDeletedEntry",
          ...(delivery ? { data: { delivery } } : {}),
        };
      }),
    ];
    await writeWorkspaceFile(path, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
    return await getAgentSession(cwd, path);
  } finally {
    release();
  }
}

export async function createAgentConversation(cwd: string, child?: Omit<AgentSubAgent, "file" | "status">) {
  const { path: directory } = await resolveWorkspacePath(cwd, ".agent/sessions", true);
  const history = SessionManager.create(cwd, directory, child ? { parentSession: child.parentFile } : undefined);
  const path = history.getSessionFile()!;
  history.appendCustomEntry("toonflowReasoning", { thinkingLevel: child?.thinkingLevel ?? null });
  if (child) {
    history.appendSessionInfo(child.name);
    history.appendCustomEntry("toonflowSubAgentInfo", { ...child, file: basename(path), status: "running" });
    if (child.providerId && child.modelId) history.appendModelChange(child.providerId, child.modelId);
    if (child.thinkingLevel) history.appendThinkingLevelChange(child.thinkingLevel);
  }
  // ACT: SDK 默认等首条回复才落盘；先保存会话头，让空对话也能被历史列表读取。
  await writeWorkspaceFile(path, [history.getHeader(), ...history.getEntries()].map(entry => JSON.stringify(entry)).join("\n") + "\n", true);
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
  // 克隆项目会保留原始 .agent 会话，header.cwd 仍指向源项目；以当前工作区目录中的文件为准列出历史。
  const sessions = await SessionManager.listAll(directory);
  return Promise.all(sessions
    .filter((item) => files.has(basename(item.path)) && !item.parentSessionPath)
    .sort((left, right) => right.modified.getTime() - left.modified.getTime())
    .map(async (item) => ({
      file: basename(item.path),
      name: item.name || (await getAgentSession(cwd, item.path)).name,
      modified: item.modified,
      messageCount: item.messageCount,
    })));
}

export async function getAgentSession(cwd: string, path: string) {
  const active = getActiveAgentSession(path);
  const entries = active
    ? [active.history.getHeader()!, ...active.history.getEntries()]
    : parseSessionEntries(await readFile(path, "utf8"));
  if (entries[0]?.type !== "session") throw Object.assign(new Error("会话文件无效"), { status: 400 });
  const partial = active?.session?.agent.state.streamingMessage;
  if (partial?.role === "assistant") entries.push({
    type: "message", id: "streaming", parentId: active!.history.getLeafId(), timestamp: new Date().toISOString(), message: partial,
  });
  const messageIndices = new Map(active ? entries.slice(active.entryOffset + 1)
    .filter(entry => entry.type === "message" && entry.message.role === "assistant")
    .map((entry, index) => [(entry as SessionEntry).id, index + 1]) : []);
  const history = SessionManager.inMemory(cwd, undefined, entries);
  const branch = history.getBranch();
  const retriedMessages = new Set(branch.flatMap(entry => {
    if (entry.type !== "custom" || entry.customType !== "toonflowRetriedMessage") return [];
    const data = entry.data as { messageId?: unknown } | null;
    return typeof data?.messageId === "string" ? [data.messageId] : [];
  }));
  const reasoning = branch.findLast(entry => entry.type === "custom" && entry.customType === "toonflowReasoning");
  const reasoningSelection = z.object({ thinkingLevel: z.enum(thinkingLevels).nullable() }).safeParse(reasoning?.type === "custom" ? reasoning.data : undefined);
  const attachmentMessages = new Map(
    branch.flatMap((entry) => {
      if (entry.type !== "custom" || !["toonflowAttachments", "toonflowUserMessage"].includes(entry.customType)) return [];
      const parsed = agentUserMessageSchema.safeParse(entry.data);
      return parsed.success ? [[parsed.data.messageId, parsed.data] as const] : [];
    })
  );
  const toolResults = new Map(
    branch.flatMap((entry) =>
      entry.type === "message" && entry.message.role === "toolResult" ? [[entry.message.toolCallId, entry.message] as const] : []
    )
  );
  let replyTo: string | undefined;
  let delivery: AgentMessageDelivery | undefined;
  const entriesMessages = branch.flatMap<SessionMessage>((entry) => {
    if (entry.type === "custom" && entry.customType === "toonflowDeletedUser") {
      replyTo = entry.id;
      const parsed = agentUserMessageSchema.shape.delivery.safeParse((entry.data as { delivery?: unknown } | null)?.delivery);
      delivery = parsed.success ? parsed.data : undefined;
    }
    if (entry.type === "custom_message" && entry.customType === "subAgentReport") {
      const details = entry.details as { id?: string; file: string; name: string; content?: string };
      const content = details.content ?? (typeof entry.content === "string" ? entry.content : getToolResultText(entry.content));
      return [{
        id: details.id ?? entry.id, entryId: entry.id, replyTo: undefined, role: "assistant" as const,
        content, parts: [{ id: details.id ?? entry.id, type: "text", content }], error: undefined,
        attachments: undefined, report: { file: details.file, name: details.name },
      }];
    }
    if (entry.type === "custom_message" && entry.customType === "agentMessage") {
      const details = entry.details as AgentPeerMessage;
      const { id, content, ...agentMessage } = details;
      if (details.startsTurn) { replyTo = id; delivery = undefined; }
      return [{
        id, entryId: entry.id, role: "assistant", content, agentMessage,
        parts: [{ id, type: "text", content }],
      }];
    }
    if (entry.type !== "message" || (entry.message.role !== "user" && entry.message.role !== "assistant")) return [];
    const message = entry.message;
    if (message.role === "assistant" && message.stopReason === "error" && retriedMessages.has(entry.id)) return [];
    const attachmentMessage = message.role === "user" ? attachmentMessages.get(entry.id) : undefined;
    if (message.role === "user") {
      replyTo = entry.id;
      delivery = attachmentMessage?.delivery;
    }
    const attachments = attachmentMessage?.attachments;
    const parts =
      message.role === "assistant"
        ? message.content
            .map((part, index) => {
              const id = `${messageIndices.get(entry.id) ?? entry.id}:${index}`;
              if (part.type === "text") return { id, type: "text" as const, content: part.text };
              if (part.type === "thinking") return { id, type: "thinking" as const, content: part.thinking, collapsed: true };
              if (part.type === "toolCall") {
                const result = toolResults.get(part.id);
                return {
                  id,
                  type: "tool" as const,
                  tool: active?.tools.get(part.id) ?? {
                    id: part.id,
                    name: part.name,
                    args: part.arguments,
                    status: !result || result.details?.toonflowInterrupted === true ? "interrupted" as const : result.isError ? "error" as const : "success" as const,
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
    const cancelled = message.role === "assistant" && message.stopReason === "aborted"
      && ["The operation was aborted.", "已停止生成"].includes(message.errorMessage ?? "");
    const error = cancelled
      ? parts.some(part => part.type === "tool" || part.content.trim()) ? translateMessage("已停止生成") : undefined
      : message.role === "assistant" && message.errorMessage ? translateMessage(message.errorMessage) : undefined;
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
        mentions: attachmentMessage?.mentions,
        queueId: attachmentMessage?.queueId,
        delivery,
        report: undefined,
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
    if (message.role === "assistant" && !message.report && !message.agentMessage) message.content = message.parts.flatMap(part => part.type === "text" ? [part.content] : []).join("\n\n");
  }
  const activeReply = active && replyTo ? groupedMessages.findLast(message =>
    message.role === "assistant" && !message.report && !message.agentMessage && message.replyTo === replyTo && messageIndices.has(message.entryId)
  ) : undefined;
  if (activeReply) activeReply.streaming = true;
  const messages = groupedMessages.filter((message) => (message.role === "assistant" ? message.content.trim() : message.content)
    || message.parts.some(part => part.type === "tool" || part.content.trim()) || message.error || message.attachments?.length || message.mentions?.length);
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
  const subAgents = new Map<string, AgentSubAgent>();
  for (const entry of history.getEntries()) {
    if (entry.type !== "custom" || entry.customType !== "toonflowSubAgent") continue;
    const agent = entry.data as AgentSubAgent;
    const child = getActiveAgentSession(resolve(dirname(path), agent.file));
    const interrupted = agent.status === "running" && !active && !child;
    subAgents.set(agent.file, { ...(interrupted ? { ...agent, status: "cancelled" as const, result: translateMessage("上次运行已中断") } : agent), runId: child?.runId });
  }
  return {
    file: basename(path),
    name: history.getSessionName() || (firstUserMessage?.content.trim() || firstUserMessage?.attachments?.[0]?.name)?.slice(0, 60) || translateMessage("新对话"),
    messages,
    stats: getAgentStats(history),
    contextUsage: getAgentContext(history, active?.session?.model?.contextWindow ?? (configuredModel && model ? getModelLimits(model.provider, configuredModel).contextWindow : 0)),
    providerId: model?.provider,
    modelId: model?.modelId,
    thinkingLevel: reasoningSelection.success ? reasoningSelection.data.thinkingLevel ?? undefined : context.thinkingLevel,
    parentFile: getParentSessionFile(history),
    subAgents: [...subAgents.values()],
    running: Boolean(active),
    runId: active?.runId,
    queue: getAgentQueue(active),
  };
}

export function getToolResultText(content: { type: string; text?: string }[]) {
  return content.map((part) => (part.type === "text" ? part.text : `[${part.type}]`)).join("\n");
}

export function getAgentStats(history: SessionManager, timing?: { outputTokens: number; decodeMs: number }) {
  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
  let outputTokens = timing?.outputTokens ?? 0;
  let decodeMs = timing?.decodeMs ?? 0;
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

export function getAgentContext(history: SessionManager, contextWindow = 0) {
  if (contextWindow <= 0) return undefined;
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
  // ACT: 压缩后先按摘要与保留消息估算，首条新回复后再使用模型 usage。
  const tokens =
    usage && usageIndex >= 0 && !deletedAfterReply
      ? calculateContextTokens(usage) + messages.slice(usageIndex + 1).reduce((total, message) => total + estimateTokens(message), 0)
      : messages.reduce((total, message) => total + estimateTokens(message), 0);
  return { tokens, contextWindow, percent: (tokens / contextWindow) * 100 };
}
