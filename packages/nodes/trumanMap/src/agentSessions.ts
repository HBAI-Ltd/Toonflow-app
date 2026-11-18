import type { AgentMessage, AgentPart } from "./agentConversation";
import type { CreationImage } from "./singleAgent";

/**
 * 一段 Agent 对话。和宿主 Agent 一样可以新建、切换、改名、移除；
 * 对话变长后，较早的消息折进 summary（上下文压缩），之后每轮只带摘要和 summaryThrough 之后的消息。
 */
export type AgentSession = {
  id: string;
  /** 空字符串表示还没手动改名，显示时取首条用户消息。 */
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: AgentMessage[];
  summary?: string;
  /** 已折进摘要的最后一条消息 id。 */
  summaryThrough?: string;
};
export type AgentSessionHistory = { summary?: string; turns: { role: "user" | "assistant"; content: string; images?: CreationImage[] }[] };
export type StoredAgentSessions = { version: 1; activeId: string; sessions: AgentSession[] };

/** 每轮带给模型的对话记忆上限（估算 token）；超过就先压缩再发送。 */
export const contextBudgetTokens = 16000;
export const maxSessions = 30;
export const maxSessionMessages = 120;
const mediaMessages = 40;
const messageContextCharacters = 2000;
const summaryCharacters = 2400;

export function createAgentSession(): AgentSession {
  const now = Date.now();
  return { id: crypto.randomUUID(), name: "", createdAt: now, updatedAt: now, messages: [] };
}

export function agentSessionName(session: AgentSession) {
  if (session.name.trim()) return session.name.trim();
  const first = session.messages.find(message => message.role === "user");
  const text = first?.content.replace(/\s+/g, " ").trim() ?? "";
  return text ? text.length > 24 ? `${text.slice(0, 24)}…` : text : first?.images?.length ? "图片对话" : "新对话";
}

/** 中日韩文字约 1 字 1 token，其余约 4 字符 1 token；只用于显示用量和决定何时压缩。 */
export function estimateTokens(text: string) {
  let wide = 0;
  for (let index = 0; index < text.length; index++) if (text.charCodeAt(index) > 0x2e7f) wide++;
  return Math.ceil(wide + (text.length - wide) / 4);
}

function contextText(message: AgentMessage) {
  // 被停止或失败、没留下文字的回复：告诉模型这一轮没做成，免得它以为上一条要求已经完成。
  if (message.role === "assistant" && !message.content && message.error) return `（这一轮没有完成：${message.error.slice(0, 200)}）`;
  return (message.content || "").slice(0, messageContextCharacters);
}

/** 还没折进摘要、已经结束的消息；beforeId 是本轮刚发出的用户消息，它和之后的不算历史。 */
export function pendingMessages(session: AgentSession, beforeId?: string) {
  const start = session.summaryThrough ? session.messages.findIndex(message => message.id === session.summaryThrough) + 1 : 0;
  const end = beforeId ? session.messages.findIndex(message => message.id === beforeId) : -1;
  return session.messages.slice(start, end < 0 ? undefined : end).filter(message => !message.streaming);
}

export function sessionContextTokens(session: AgentSession, beforeId?: string) {
  return estimateTokens(session.summary ?? "") + pendingMessages(session, beforeId).reduce((total, message) => total + estimateTokens(contextText(message)) + 4, 0);
}

/** 可以折进摘要的消息：保留最近 keepRecent 条原文，方便下一轮理解“它”“刚才那个”。 */
export function compactableMessages(session: AgentSession, keepRecent: number, beforeId?: string) {
  const pending = pendingMessages(session, beforeId);
  return pending.slice(0, Math.max(0, pending.length - keepRecent));
}

/**
 * 发送前自动压缩时折哪些：从最新往回留到约四成预算为止（至少留最近一轮），其余折进摘要。
 * 固定留几条的话，回复一长就会刚压完下一轮又超，每轮都多跑一次摘要。
 */
export function autoCompactableMessages(session: AgentSession, beforeId?: string) {
  const pending = pendingMessages(session, beforeId);
  let keep = 0;
  let tokens = 0;
  for (let index = pending.length - 1; index >= 0; index--) {
    tokens += estimateTokens(contextText(pending[index]!)) + 4;
    if (keep >= 2 && tokens > contextBudgetTokens * 0.4) break;
    keep++;
  }
  return pending.slice(0, pending.length - keep);
}

/**
 * 本轮带给模型的历史：摘要 + 未压缩的消息。
 * 压缩没成功时也不超预算：从最新往回取，装不下的更早消息本轮不带。
 * 历史附图只带最近 6 条消息里的原图，避免越聊越多撞上单轮图片上限。
 */
export function sessionHistory(session: AgentSession, beforeId?: string): AgentSessionHistory {
  const turns: AgentSessionHistory["turns"] = [];
  let tokens = estimateTokens(session.summary ?? "");
  for (const message of pendingMessages(session, beforeId).reverse()) {
    const content = contextText(message);
    tokens += estimateTokens(content) + 4;
    if (turns.length >= 2 && tokens > contextBudgetTokens) break;
    const images = turns.length < 6 ? message.images?.filter(image => !image.archived).map(({ name, dataUrl }) => ({ name, dataUrl })) : undefined;
    turns.unshift({ role: message.role, content, ...(images?.length ? { images } : {}) });
  }
  return { ...(session.summary ? { summary: session.summary } : {}), turns };
}

function transcriptLine(message: AgentMessage) {
  const text = contextText(message).trim();
  if (message.role === "user") return `用户：${text || "（只发了图片）"}${message.images?.length ? `［附图 ${message.images.length} 张］` : ""}`;
  const tools = [...new Set((message.parts ?? []).flatMap(part => part.type === "tool" ? [`${part.tool.label || part.tool.name}${part.tool.status === "error" ? "（失败）" : ""}`] : []))];
  return `助手：${text || "（没有文字回复）"}${tools.length ? `［操作：${tools.slice(0, 16).join("、")}］` : ""}${message.error ? `［未完成：${message.error.slice(0, 300)}］` : ""}`;
}

export const compactionSystemPrompt = "你负责把一段 3D 场景创作对话压缩成“对话记忆”，供同一位助手在后续轮次继续工作时参考。只输出记忆正文，不要寒暄、不要解释、不要使用标题以外的 Markdown。";

export function compactionPrompt(previousSummary: string | undefined, messages: AgentMessage[]) {
  // 一次最多送 30000 字的原文去压缩；一直没压成功攒下的更早消息只能略过。
  const lines: string[] = [];
  let characters = 0;
  for (const message of [...messages].reverse()) {
    const line = transcriptLine(message);
    characters += line.length;
    if (lines.length && characters > 30000) { lines.unshift("（更早的对话略）"); break; }
    lines.unshift(line);
  }
  return `${previousSummary ? `已有的对话记忆（要并入新记忆，不能丢）：\n${previousSummary}\n\n` : ""}需要压缩的对话：
${lines.join("\n")}

请写出新的对话记忆，800 字以内，按下面几项分行写，没有内容的项省略：
目标：用户想搭建或拍摄的场景、风格、题材。
已完成：已经落到场景里的修改（物体、位置、数量、名称、镜头、动线等，保留用户提到过的具体名字和数值）。
偏好与禁忌：用户明确要求或否定过的做法。
未完成：失败、被中断或用户说稍后再做的事。
最近状态：对话结束时场景大致是什么样、用户最后在关注什么。`;
}

export function applyCompaction(session: AgentSession, summary: string, throughId: string) {
  const text = summary.trim().slice(0, summaryCharacters);
  if (!text || !session.messages.some(message => message.id === throughId)) return false;
  session.summary = text;
  session.summaryThrough = throughId;
  session.updatedAt = Date.now();
  return true;
}

/**
 * 保留最近 maxSessionMessages 条消息；被摘要覆盖的边界消息移走后，剩下的都算未压缩。
 * 最近 mediaMessages 条之前的原图换成缩略图、观察截图释放，长对话不会一直占着几十 MB 的 dataURL。
 */
export function trimSession(session: AgentSession) {
  if (session.messages.length > maxSessionMessages) {
    session.messages.splice(0, session.messages.length - maxSessionMessages);
    if (session.summaryThrough && !session.messages.some(message => message.id === session.summaryThrough)) session.summaryThrough = undefined;
  }
  for (const message of session.messages.slice(0, -mediaMessages)) {
    if (message.views?.length) message.views = undefined;
    if (!message.images?.some(image => !image.archived)) continue;
    message.images = message.images.flatMap(image => image.archived ? [image] : image.thumbnail ? [{ name: image.name, dataUrl: image.thumbnail, archived: true }] : []);
  }
}

function clip(value: unknown, length: number) {
  if (value === undefined || value === null) return undefined;
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  return text.length > length ? `${text.slice(0, length)}…` : typeof value === "string" ? value : text;
}

function storedPart(part: AgentPart): AgentPart {
  if (part.type === "text") return { id: part.id, type: "text", content: part.content.slice(0, 12000) };
  if (part.type === "thinking") return { id: part.id, type: "thinking", content: part.content.slice(0, 2000), collapsed: true, duration: part.duration };
  const status = part.tool.status === "running" ? "interrupted" : part.tool.status;
  return { id: part.id, type: "tool", collapsed: true, tool: { id: part.tool.id, name: part.tool.name, label: part.tool.label, status, args: clip(part.tool.args, 1500), result: clip(part.tool.result, 1500), error: part.tool.error?.slice(0, 600) } };
}

/**
 * 存盘用的精简副本：不存原图（只留缩略图）、不存观察截图，工具参数与结果截短。
 * 还在生成中的回复按“已中断”存，下次打开不会卡在转圈。
 */
export function storeAgentSessions(sessions: AgentSession[], activeId: string): StoredAgentSessions {
  return {
    version: 1, activeId,
    sessions: sessions.filter(session => session.messages.length).slice(0, maxSessions).map(session => ({
      id: session.id, name: session.name, createdAt: session.createdAt, updatedAt: session.updatedAt,
      ...(session.summary ? { summary: session.summary, summaryThrough: session.summaryThrough } : {}),
      messages: session.messages.slice(-maxSessionMessages).map(message => ({
        id: message.id, role: message.role, content: message.content.slice(0, 12000),
        ...(message.parts ? { parts: message.parts.map(storedPart) } : {}),
        ...(message.images?.some(image => image.thumbnail || image.archived) ? { images: message.images.filter(image => image.thumbnail || image.archived).map(image => ({ name: image.name.slice(0, 200), dataUrl: image.thumbnail ?? image.dataUrl, archived: true })) } : {}),
        ...(message.attachments?.length ? { attachments: message.attachments.slice(0, 10).map(file => ({ name: file.name.slice(0, 200), size: file.size })) } : {}),
        ...(message.delivery === "steer" ? { delivery: "steer" as const } : {}),
        ...(message.error || message.streaming ? { error: message.error?.slice(0, 2000) || "上次没有生成完，已中断。" } : {}),
        ...(message.warnings?.length ? { warnings: message.warnings.slice(-4) } : {}),
      })),
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }

function restorePart(value: unknown): AgentPart[] {
  if (!isRecord(value) || typeof value.id !== "string") return [];
  if ((value.type === "text" || value.type === "thinking") && typeof value.content === "string") {
    return value.type === "text" ? [{ id: value.id, type: "text", content: value.content }] : [{ id: value.id, type: "thinking", content: value.content, collapsed: true, ...(typeof value.duration === "number" ? { duration: value.duration } : {}) }];
  }
  const tool = value.tool;
  if (value.type !== "tool" || !isRecord(tool) || typeof tool.name !== "string") return [];
  const status = tool.status === "success" || tool.status === "error" ? tool.status : "interrupted";
  return [{ id: value.id, type: "tool", collapsed: true, tool: { id: typeof tool.id === "string" ? tool.id : value.id, name: tool.name, status, ...(typeof tool.label === "string" ? { label: tool.label } : {}), ...(typeof tool.args === "string" ? { args: tool.args } : {}), ...(typeof tool.result === "string" ? { result: tool.result } : {}), ...(typeof tool.error === "string" ? { error: tool.error } : {}) } }];
}

function restoreMessage(value: unknown): AgentMessage[] {
  if (!isRecord(value) || typeof value.id !== "string" || (value.role !== "user" && value.role !== "assistant") || typeof value.content !== "string") return [];
  const images = Array.isArray(value.images) ? value.images.flatMap(image => isRecord(image) && typeof image.name === "string" && typeof image.dataUrl === "string" && /^data:image\/(?:png|jpeg|webp|gif);base64,/.test(image.dataUrl) && image.dataUrl.length < 200000 ? [{ name: image.name, dataUrl: image.dataUrl, archived: true }] : []) : [];
  return [{
    id: value.id, role: value.role, content: value.content,
    ...(Array.isArray(value.parts) ? { parts: value.parts.flatMap(restorePart) } : {}),
    ...(images.length ? { images } : {}),
    ...(Array.isArray(value.attachments) ? { attachments: value.attachments.flatMap(file => isRecord(file) && typeof file.name === "string" && typeof file.size === "number" ? [{ name: file.name.slice(0, 200), size: file.size }] : []).slice(0, 10) } : {}),
    ...(value.role === "user" && value.delivery === "steer" ? { delivery: "steer" as const } : {}),
    ...(typeof value.error === "string" && value.error ? { error: value.error } : {}),
    ...(Array.isArray(value.warnings) ? { warnings: value.warnings.filter((warning): warning is string => typeof warning === "string").slice(-4) } : {}),
  }];
}

/** 读回存盘内容；格式不对的会话或消息直接跳过，不影响其余对话。 */
export function restoreAgentSessions(value: unknown): { sessions: AgentSession[]; activeId: string } {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.sessions)) return { sessions: [], activeId: "" };
  const ids = new Set<string>();
  const sessions = value.sessions.flatMap((item): AgentSession[] => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id || ids.has(item.id) || !Array.isArray(item.messages)) return [];
    const messages = item.messages.flatMap(restoreMessage).slice(-maxSessionMessages);
    if (!messages.length) return [];
    ids.add(item.id);
    const createdAt = typeof item.createdAt === "number" && Number.isFinite(item.createdAt) ? item.createdAt : Date.now();
    const summary = typeof item.summary === "string" && item.summary.trim() ? item.summary.slice(0, summaryCharacters) : undefined;
    const summaryThrough = summary && typeof item.summaryThrough === "string" && messages.some(message => message.id === item.summaryThrough) ? item.summaryThrough : undefined;
    return [{
      id: item.id, name: typeof item.name === "string" ? item.name.slice(0, 80) : "", createdAt,
      updatedAt: typeof item.updatedAt === "number" && Number.isFinite(item.updatedAt) ? item.updatedAt : createdAt,
      messages, ...(summary ? { summary, summaryThrough } : {}),
    }];
  }).slice(0, maxSessions);
  return { sessions, activeId: typeof value.activeId === "string" && ids.has(value.activeId) ? value.activeId : "" };
}
