import db from "@/utils/db";
import type {
  AIMessage,
  AIMessageContent,
  ChatMessageStatus,
  ChatMessagesData,
  MarkdownContent,
  TextContent,
  UserMessage,
  UserMessageContent,
} from "@/socket/chatMessagesData";
import { v4 as uuidv4 } from "uuid";

export type ConversationAgentType = "scriptAgent" | "productionAgent";

export type ConversationScopeParams = {
  projectId?: number | null;
  episodesId?: number | null;
  agentType?: ConversationAgentType | null;
};

type ResolvedConversationScope = {
  projectId: number;
  episodesId: number | null;
  agentType: ConversationAgentType;
};

type ConversationContentUpdate = {
  type?: AIMessageContent["type"];
  data?: AIMessageContent["data"];
  strategy?: "append" | "merge";
  status?: ChatMessageStatus;
};

function normalizeRole(role?: string | null): "user" | "assistant" {
  return role?.startsWith("assistant") ? "assistant" : "user";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeContentData(current: unknown, incoming: unknown, strategy?: "append" | "merge") {
  if (incoming === undefined) {
    return current;
  }

  if (strategy === "append") {
    if (typeof current === "string") {
      return `${current}${typeof incoming === "string" ? incoming : String(incoming)}`;
    }

    if (Array.isArray(current)) {
      return [...current, ...(Array.isArray(incoming) ? incoming : [incoming])];
    }

    if (isPlainObject(current) && isPlainObject(incoming)) {
      return { ...current, ...incoming };
    }
  }

  if (strategy === "merge" && isPlainObject(current) && isPlainObject(incoming)) {
    return { ...current, ...incoming };
  }

  return incoming;
}

async function saveConversationMessage(scope: ResolvedConversationScope, message: ChatMessagesData) {
  const payload = {
    id: message.id,
    scopeKey: buildConversationScopeKey(scope),
    projectId: scope.projectId,
    episodesId: scope.episodesId ?? undefined,
    agentType: scope.agentType,
    messageJson: JSON.stringify(message),
    createTime: Date.parse(message.datetime ?? "") || Date.now(),
    updateTime: Date.now(),
  };

  const existing = await db("o_agentConversationMessage").where({ id: message.id }).first();

  if (existing) {
    await db("o_agentConversationMessage")
      .where({ id: message.id })
      .update({
        scopeKey: payload.scopeKey,
        projectId: payload.projectId,
        episodesId: payload.episodesId,
        agentType: payload.agentType,
        messageJson: payload.messageJson,
        createTime: payload.createTime,
        updateTime: payload.updateTime,
      });
    return;
  }

  await db("o_agentConversationMessage").insert(payload);
}

async function updateConversationMessage(
  scope: ResolvedConversationScope,
  messageId: string,
  updater: (message: ChatMessagesData) => void,
) {
  const row = await db("o_agentConversationMessage").where({ id: messageId, scopeKey: buildConversationScopeKey(scope) }).first();
  if (!row?.messageJson) {
    return;
  }

  let message: ChatMessagesData;
  try {
    message = JSON.parse(row.messageJson);
  } catch {
    return;
  }

  updater(message);
  await saveConversationMessage(scope, message);
}

export function buildConversationScopeKey(scope: ResolvedConversationScope) {
  return scope.episodesId != null
    ? `${scope.projectId}:${scope.agentType}:${scope.episodesId}`
    : `${scope.projectId}:${scope.agentType}`;
}

export function resolveConversationScope(scope: ConversationScopeParams): ResolvedConversationScope | null {
  if (!scope.projectId || !scope.agentType) {
    return null;
  }

  return {
    projectId: scope.projectId,
    episodesId: scope.episodesId ?? null,
    agentType: scope.agentType,
  };
}

export async function persistConversationMessage(scope: ConversationScopeParams, message: ChatMessagesData) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  await saveConversationMessage(resolvedScope, message);
}

export async function updateConversationMessageStatus(
  scope: ConversationScopeParams,
  messageId: string,
  patch: {
    status?: string;
    ext?: unknown;
  },
) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  await updateConversationMessage(resolvedScope, messageId, (message) => {
    if (patch.status) {
      message.status = patch.status as ChatMessagesData["status"];
    }
    if (patch.ext !== undefined) {
      message.ext = patch.ext;
    }
  });
}

export async function addConversationMessageContent(scope: ConversationScopeParams, messageId: string, content: Record<string, any>) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  await updateConversationMessage(resolvedScope, messageId, (message) => {
    if (message.role !== "assistant") {
      return;
    }

    const nextContent = Array.isArray(message.content) ? [...message.content] : [];
    const incomingContent = content as AIMessageContent;
    const existingIndex = nextContent.findIndex((item) => item.id === incomingContent.id);
    if (existingIndex >= 0) {
      nextContent[existingIndex] = { ...nextContent[existingIndex], ...incomingContent } as AIMessageContent;
    } else if (incomingContent.type === "thinking") {
      const firstNonThinkingIndex = nextContent.findIndex((item) => item.type !== "thinking");
      if (firstNonThinkingIndex >= 0) {
        nextContent.splice(firstNonThinkingIndex, 0, incomingContent);
      } else {
        nextContent.push(incomingContent);
      }
    } else {
      nextContent.push(incomingContent);
    }
    message.content = nextContent;
  });
}

export async function updateConversationMessageContent(
  scope: ConversationScopeParams,
  messageId: string,
  contentId: string,
  patch: ConversationContentUpdate,
) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  await updateConversationMessage(resolvedScope, messageId, (message) => {
    if (message.role !== "assistant") {
      return;
    }

    const nextContent = Array.isArray(message.content) ? [...message.content] : [];
    const contentIndex = nextContent.findIndex((item) => item.id === contentId);
    if (contentIndex < 0) {
      return;
    }

    const currentContent = nextContent[contentIndex];
    const nextContentItem = {
      ...currentContent,
      ...(patch.type ? { type: patch.type } : {}),
      data: mergeContentData(currentContent.data, patch.data, patch.strategy) as AIMessageContent["data"],
      ...(patch.status ? { status: patch.status } : {}),
    } as AIMessageContent;

    nextContent[contentIndex] = nextContentItem;
    message.content = nextContent;
  });
}

export async function persistUserConversationMessage(
  scope: ConversationScopeParams,
  options: {
    content: string;
    createTime?: number;
    name?: string;
  },
) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  const createTime = options.createTime ?? Date.now();
  const userContent: TextContent = {
    id: uuidv4(),
    type: "text",
    status: "complete",
    data: options.content,
  };
  const userMessage: UserMessage = {
    id: uuidv4(),
    role: "user",
    status: "complete",
    datetime: new Date(createTime).toISOString(),
    content: [userContent],
  };
  await saveConversationMessage(resolvedScope, userMessage);
}

export async function listConversation(scope: ConversationScopeParams): Promise<ChatMessagesData[]> {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return [];
  }

  const rows = await db("o_agentConversationMessage")
    .where({ scopeKey: buildConversationScopeKey(resolvedScope) })
    .orderBy("createTime", "asc")
    .select("messageJson");

  const transcript = rows
    .map((row) => {
      try {
        return JSON.parse(row.messageJson ?? "") as ChatMessagesData;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ChatMessagesData[];

  if (transcript.length > 0) {
    return transcript;
  }

  const rowsFromMemory = await db("memories")
    .where({ isolationKey: buildConversationScopeKey(resolvedScope), type: "message" })
    .orderBy("createTime", "asc")
    .select("id", "role", "name", "content", "createTime");

  return rowsFromMemory.map((row): ChatMessagesData => {
    const role = normalizeRole(row.role);
    const datetime = new Date(row.createTime).toISOString();
    const messageId = String(row.id);

    if (role === "assistant") {
      const content: MarkdownContent = {
        id: `${messageId}-markdown`,
        type: "markdown",
        status: "complete",
        data: row.content ?? "",
      };
      const message: AIMessage = {
        id: messageId,
        role: "assistant",
        status: "complete",
        datetime,
        content: [content],
      };
      return message;
    }

    const content: UserMessageContent = {
      id: `${messageId}-text`,
      type: "text",
      status: "complete",
      data: row.content ?? "",
    };
    const message: UserMessage = {
      id: messageId,
      role: "user",
      status: "complete",
      datetime,
      content: [content],
    };
    return message;
  });
}

export async function clearConversation(scope: ConversationScopeParams) {
  const resolvedScope = resolveConversationScope(scope);
  if (!resolvedScope) {
    return;
  }

  await db("o_agentConversationMessage").where({ scopeKey: buildConversationScopeKey(resolvedScope) }).del();
}
