import type { ToolDefinition } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent } from "../../agent/runtime/types";

export type SingleAgentToolDescriptor = {
  name: string;
  label?: string;
  description: string;
  parameters: Record<string, unknown>;
  executionMode?: "sequential" | "parallel";
};

export type SingleAgentToolReference = string | { plugin: string; names?: string[] };
export type SingleAgentToolResult = Awaited<ReturnType<ToolDefinition["execute"]>>;
export type SingleAgentResult = { text: string; toolResults: { id: string; name: string; result: SingleAgentToolResult }[] };
export type SingleAgentStatus = "idle" | "running" | "pausing" | "paused";

export type SingleAgentEvent = AgentEvent
  | { type: "clientTool"; callId: string; toolCallId: string; name: string; args: Record<string, unknown> }
  | { type: "toolResult"; id: string; name: string; result: SingleAgentToolResult }
  | { type: "status"; status: SingleAgentStatus }
  | ({ type: "complete" } & SingleAgentResult);
