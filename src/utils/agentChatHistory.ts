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
  if (status === "pending" || status === "running") return "error";
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
