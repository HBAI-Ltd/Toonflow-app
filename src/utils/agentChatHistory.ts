import { db as knexDb } from "@/utils/db";

const MAX_MESSAGES = 30;

export type AgentChatMessage = {
  id?: string;
  role?: string;
  name?: string;
  status?: string;
  datetime?: string;
  content?: any[];
};

export type AgentChatHistoryInput = {
  projectId: number;
  scriptId?: number | null;
  threadKey: string;
  agentMode?: string;
  messages?: AgentChatMessage[];
  draft?: string;
  lockedContext?: string;
};

export type AgentChatOutgoingEventInput = {
  projectId: number;
  scriptId?: number | null;
  threadKey: string;
  agentMode?: string;
  event: string;
  payload: any;
};

export type AgentChatOutgoingEvent = Pick<AgentChatOutgoingEventInput, "event" | "payload">;

export type AgentChatOutgoingEventsInput = Omit<AgentChatOutgoingEventInput, "event" | "payload"> & {
  events: AgentChatOutgoingEvent[];
};

const PERSISTED_EVENTS = new Set(["message", "message:update", "content:add", "content:update"]);

function safeJson(value: unknown, fallback: unknown) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return fallback;
  }
}

function parseJson(value: string | null | undefined, fallback: unknown) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeStatus(status?: string | null) {
  return status || "complete";
}

function normalizeMessageForRestore(message: AgentChatMessage) {
  const next = { ...message, status: normalizeStatus(message.status) };
  next.content = Array.isArray(message.content)
    ? message.content.map((item: any) => ({ ...item, status: normalizeStatus(item?.status) }))
    : [];
  return next;
}

function compactMessages(messages: AgentChatMessage[] = []) {
  return safeJson(messages.slice(-MAX_MESSAGES), []) as AgentChatMessage[];
}

function mergeContentData(current: any, next: any, strategy?: string) {
  if (strategy === "append") {
    if (typeof current === "string" || typeof next === "string") return `${current || ""}${next || ""}`;
    if (Array.isArray(current) || Array.isArray(next)) return [...(Array.isArray(current) ? current : []), ...(Array.isArray(next) ? next : [])];
  }
  if (strategy === "merge" && typeof current === "object" && current && typeof next === "object" && next) return { ...current, ...next };
  return next === undefined ? current : next;
}

export function applyAgentChatEventToMessages(messages: AgentChatMessage[] = [], event: string, payload: any) {
  const next = safeJson(messages, []) as AgentChatMessage[];
  if (event === "message") {
    const existing = next.find((item) => item.id === payload.id);
    if (existing) Object.assign(existing, payload, { content: payload.content || existing.content || [] });
    else next.push({ ...payload, content: payload.content || [] });
    return next;
  }

  if (event === "message:update") {
    const message = next.find((item) => item.id === payload.id);
    if (message) Object.assign(message, payload);
    return next;
  }

  if (event === "content:add") {
    const message = next.find((item) => item.id === payload.messageId);
    if (!message) return next;
    message.content = message.content || [];
    const content = payload.content || {};
    const existing = message.content.find((item: any) => item.id && item.id === content.id);
    if (existing) Object.assign(existing, content);
    else message.content.push(content);
    return next;
  }

  if (event === "content:update") {
    const message = next.find((item) => item.id === payload.messageId);
    if (!message) return next;
    message.content = message.content || [];
    let content = message.content.find((item: any) => item.id === payload.contentId);
    if (!content) {
      content = { id: payload.contentId, type: payload.type || "text", data: "", status: "pending" };
      message.content.push(content);
    }
    content.type = payload.type || content.type;
    content.data = mergeContentData(content.data, payload.data, payload.strategy);
    content.status = payload.status || content.status;
    return next;
  }

  return next;
}

export async function saveAgentChatHistory(input: AgentChatHistoryInput) {
  const now = Date.now();
  const row = {
    projectId: input.projectId,
    scriptId: input.scriptId ?? null,
    threadKey: input.threadKey,
    agentMode: input.agentMode || null,
    messages: JSON.stringify(compactMessages(input.messages)),
    draft: input.draft || "",
    lockedContext: input.lockedContext || "",
    updateTime: now,
  };
  const existing = await knexDb<any>("o_agentChatHistory").where({ threadKey: input.threadKey }).first();
  if (existing) {
    await knexDb<any>("o_agentChatHistory").where({ threadKey: input.threadKey }).update(row);
    return { id: existing.id, ...row };
  }
  const [id] = await knexDb<any>("o_agentChatHistory").insert({ ...row, createTime: now });
  return { id, ...row, createTime: now };
}

export async function applyAgentChatOutgoingEvent(input: AgentChatOutgoingEventInput) {
  return applyAgentChatOutgoingEvents({ ...input, events: [{ event: input.event, payload: input.payload }] });
}

export async function applyAgentChatOutgoingEvents(input: AgentChatOutgoingEventsInput) {
  const events = input.events.filter((item) => PERSISTED_EVENTS.has(item.event));
  if (!events.length) return;
  const now = Date.now();
  const existing = await knexDb<any>("o_agentChatHistory").where({ threadKey: input.threadKey }).first();
  let messages = parseJson(existing?.messages, []) as AgentChatMessage[];
  for (const item of events) {
    messages = applyAgentChatEventToMessages(messages, item.event, item.payload);
  }
  const nextMessages = compactMessages(messages);
  const row = {
    projectId: input.projectId,
    scriptId: input.scriptId ?? null,
    threadKey: input.threadKey,
    agentMode: input.agentMode || existing?.agentMode || null,
    messages: JSON.stringify(nextMessages),
    draft: existing?.draft || "",
    lockedContext: existing?.lockedContext || "",
    updateTime: now,
  };
  if (existing) {
    await knexDb<any>("o_agentChatHistory").where({ threadKey: input.threadKey }).update(row);
    return { id: existing.id, ...row };
  }
  const [id] = await knexDb<any>("o_agentChatHistory").insert({ ...row, createTime: now });
  return { id, ...row, createTime: now };
}

export async function loadAgentChatHistory(threadKey: string) {
  const row = await knexDb<any>("o_agentChatHistory").where({ threadKey }).first();
  if (!row) return { messages: [], draft: "", lockedContext: "" };
  const messages = (parseJson(row.messages, []) as AgentChatMessage[]).map(normalizeMessageForRestore);
  return {
    id: row.id,
    projectId: row.projectId,
    scriptId: row.scriptId,
    threadKey: row.threadKey,
    agentMode: row.agentMode,
    messages,
    draft: row.draft || "",
    lockedContext: row.lockedContext || "",
    createTime: row.createTime,
    updateTime: row.updateTime,
  };
}
