import type { AgentToolCall, AgentStats, AgentContext } from "@toonflow/server/agent/types";

export type AgentAttachment = { name: string; path: string; mimeType: string; file?: File };

export type AgentMessagePart =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "thinking"; content: string; collapsed?: boolean; duration?: number }
  | { id: string; type: "tool"; tool: AgentToolCall };

export type AgentMessage = {
  id: string;
  entryId?: string;
  replyTo?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AgentAttachment[];
  parts?: AgentMessagePart[];
  streaming?: boolean;
  error?: string;
};

export type AgentHistory = { file: string; name: string; modified: string; messageCount: number };

export type AgentConversation = {
  file: string;
  name: string;
  messages: AgentMessage[];
  providerId?: string;
  modelId?: string;
  thinkingLevel?: string;
  stats?: AgentStats;
  contextUsage?: AgentContext;
};
