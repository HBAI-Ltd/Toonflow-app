import type { CanvasToolCall, QuestionRequest, ToolCall } from "@toonflow/tools-scaffold/runtime";

export type AgentToolCall = ToolCall & { question?: QuestionRequest & { callId: string } };

export type AgentStats = {
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  tokensPerSecond?: number;
};

export type AgentContext = { tokens: number | null; contextWindow: number; percent: number | null };

export type AgentSubAgent = {
  file: string;
  parentFile: string;
  name: string;
  task: string;
  status: "running" | "completed" | "error" | "limited" | "cancelled" | "inputRequired";
  result?: string;
  providerId?: string;
  modelId?: string;
  thinkingLevel?: "off" | "low" | "medium" | "high";
};

export type AgentEvent =
  | { type: "text" | "thinking"; blockId: string; delta?: string; content?: string; done?: boolean }
  | { type: "compaction"; active: boolean }
  | { type: "tool"; blockId: string; tool: AgentToolCall }
  | ({ type: "canvasCall"; callId: string } & CanvasToolCall)
  | ({ type: "question"; callId: string; toolCallId: string } & QuestionRequest)
  | { type: "error"; message: string }
  | { type: "session"; file: string }
  | { type: "userMessage"; id: string; content?: string; attachments?: { name: string; path: string; mimeType: string }[] }
  | { type: "subAgent"; agent: AgentSubAgent }
  | { type: "subAgentEvent"; file: string; event: AgentEvent }
  | { type: "report"; parentFile: string; file: string; name: string; content: string; id: string }
  | { type: "accepted" }
  | { type: "stats"; stats: AgentStats; contextUsage?: AgentContext }
  | { type: "done" };
