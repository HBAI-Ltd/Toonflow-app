import type { CanvasToolCall, QuestionRequest, ToolCall } from "@toonflow/tools-scaffold/runtime";
import type { ThinkingLevel } from "../../lib/modelReasoning";
export type AgentSchedule =
  | { kind: "once"; at: number }
  | { kind: "interval"; everySeconds: number }
  | { kind: "daily"; time: string; timeZone: string }
  | { kind: "weekly"; time: string; timeZone: string; weekdays: number[] };
export type AgentAutomationInput = {
  name: string; prompt: string; schedule: AgentSchedule; sessionFile?: string;
  providerId: string; modelId: string; thinkingLevel?: ThinkingLevel;
};
export type AgentAutomationSource = { taskId: string; runId: string; name: string };
export type AgentAutomationRun = {
  id: string; startedAt: number; finishedAt?: number; sessionFile?: string;
  status: "running" | "completed" | "failed" | "interrupted" | "cancelled"; error?: string;
};
export type AgentAutomation = AgentAutomationInput & {
  id: string; revision: number; enabled: boolean; createdAt: number;
  nextRunAt: number | null; runs: AgentAutomationRun[]; cancelledAt?: number; queued?: boolean;
};
export type AgentAutomationCommand =
  | { action: "save"; id?: string; revision?: number; task: AgentAutomationInput }
  | { action: "run"; id: string; revision: number; retryRunId?: string }
  | { action: "pause" | "resume" | "cancel" | "delete"; id: string; revision: number };

export type AgentPlan = { active: boolean };
export type AgentGoal = {
  id: string; revision: number; objective: string; status: "active" | "paused" | "completed" | "blocked";
  rounds: number; maxRounds: number; reason?: string; running: boolean;
};
export type AgentCommand =
  | { action: "plan"; enabled: boolean }
  | { action: "create"; objective: string }
  | { action: "edit"; id: string; revision: number; objective: string }
  | { action: "pause" | "resume" | "clear"; id: string; revision: number };

export type AgentToolCall = ToolCall & { question?: QuestionRequest & { callId: string } };

export type AgentMention = {
  id: string;
  label: string;
  source:
    | { kind: "canvas"; canvasId: string; canvasName: string; nodeId: string; nodeName: string; outputId?: string; outputName?: string }
    | { kind: "asset"; path: string };
  dataType: string;
  value: unknown;
};

export type AgentStats = {
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  tokensPerSecond?: number;
};

export type AgentContext = { tokens: number | null; contextWindow: number; percent: number | null };

export type AgentQueuedMessage = { id: string; content: string };
export type AgentMessageDelivery = { mode: "steer" | "followUp"; taskMessageId: string };
export type AgentQueue = {
  runId: string;
  revision: number;
  steering: AgentQueuedMessage[];
  followUp: AgentQueuedMessage[];
};

export type AgentSubAgent = {
  file: string;
  runId?: string;
  parentFile: string;
  name: string;
  task: string;
  status: "running" | "completed" | "error" | "limited" | "cancelled" | "inputRequired";
  result?: string;
  providerId?: string;
  modelId?: string;
  thinkingLevel?: ThinkingLevel;
};

export type AgentPeerMessage = {
  id: string;
  fromFile: string;
  fromName: string;
  toFile: string;
  toName: string;
  content: string;
  startsTurn?: boolean;
};

export type AgentEvent =
  | { type: "plan"; plan: AgentPlan }
  | { type: "goal"; goal: AgentGoal | null }
  | { type: "goalRound"; replyTo: string }
  | { type: "text" | "thinking"; blockId: string; delta?: string; content?: string; done?: boolean }
  | { type: "retry"; blockPrefix: string; replyTo?: string }
  | { type: "compaction"; active: boolean }
  | { type: "tool"; blockId: string; tool: AgentToolCall }
  | ({ type: "canvasCall"; callId: string } & CanvasToolCall)
  | ({ type: "question"; callId: string; toolCallId: string } & QuestionRequest)
  | { type: "error"; message: string }
  | { type: "session"; file: string; runId: string }
  | { type: "userMessage"; id: string; queueId?: string; content?: string; attachments?: { name: string; path: string; mimeType: string }[]; mentions?: AgentMention[]; delivery?: AgentMessageDelivery; automation?: AgentAutomationSource }
  | { type: "subAgent"; agent: AgentSubAgent }
  | { type: "subAgentEvent"; file: string; runId: string; event: AgentEvent }
  | { type: "report"; parentFile: string; file: string; name: string; content: string; id: string }
  | ({ type: "agentMessage" } & AgentPeerMessage)
  | { type: "accepted"; runId: string; message: AgentQueuedMessage & { mode: "steer" | "followUp" } }
  | ({ type: "queue" } & AgentQueue)
  | { type: "stats"; stats: AgentStats; contextUsage?: AgentContext }
  | { type: "done" };
