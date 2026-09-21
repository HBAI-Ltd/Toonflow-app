import type { CanvasToolCall, QuestionRequest, ToolCall } from "@toonflow/tools-scaffold/runtime";

export type AgentToolCall = ToolCall;

export type AgentStats = {
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  tokensPerSecond?: number;
};

export type AgentContext = { tokens: number | null; contextWindow: number; percent: number | null };

export type AgentEvent =
  | { type: "text" | "thinking"; blockId: string; delta?: string; content?: string; done?: boolean }
  | { type: "tool"; blockId: string; tool: AgentToolCall }
  | ({ type: "canvasCall"; callId: string } & CanvasToolCall)
  | ({ type: "question"; callId: string; toolCallId: string } & QuestionRequest)
  | { type: "error"; message: string }
  | { type: "session"; file: string }
  | { type: "userMessage"; id: string }
  | { type: "stats"; stats: AgentStats; contextUsage?: AgentContext }
  | { type: "done" };
