import type { AgentToolCall, AgentStats, AgentContext, AgentSubAgent, AgentMention, AgentQueue, AgentMessageDelivery, AgentAutomationSource, AgentPlan, AgentGoal } from "@toonflow/server/agent/types";

export type AgentAttachment = { name: string; path: string; mimeType: string; file?: File };

export type AgentMessagePart =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "thinking"; content: string; collapsed?: boolean; duration?: number }
  | { id: string; type: "tool"; tool: AgentToolCall; collapsed?: boolean };

export type AgentMessage = {
  id: string;
  entryId?: string;
  queueId?: string;
  replyTo?: string;
  delivery?: AgentMessageDelivery;
  automation?: AgentAutomationSource;
  role: "user" | "assistant";
  content: string;
  attachments?: AgentAttachment[];
  mentions?: AgentMention[];
  parts?: AgentMessagePart[];
  streaming?: boolean;
  error?: string;
  report?: { file: string; name: string };
  agentMessage?: { fromFile: string; fromName: string; toFile: string; toName: string; startsTurn?: boolean };
};

export type AgentHistory = { file: string; name: string; modified: string; messageCount: number };
export type AgentAutomationEntry = { timer: boolean; token?: string; prompt?: string; runTaskId?: string; model: string; thinking: string };

export type AgentConversation = {
  plan?: AgentPlan;
  goal?: AgentGoal | null;
  file: string;
  name: string;
  messages: AgentMessage[];
  providerId?: string;
  modelId?: string;
  thinkingLevel?: string;
  stats?: AgentStats;
  contextUsage?: AgentContext;
  parentFile?: string;
  subAgents?: AgentSubAgent[];
  running?: boolean;
  scheduled?: boolean;
  runId?: string;
  queue?: AgentQueue;
};
