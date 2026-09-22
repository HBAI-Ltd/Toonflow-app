import { z } from "zod";
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import { reportToParent } from "@/agent/runtime/sessions";
import type { AgentEvent } from "@/agent/runtime/types";

export function createReportTool(cwd: string, parentFile: string, file: string, name: string, send: (event: AgentEvent) => void): ToolDefinition {
  const parameters = z.strictObject({ content: z.string().trim().min(1).max(16000).describe("向父 Agent 上报的结论、进展或需要协调的问题") });
  return {
    name: "report", label: "上报父 Agent",
    description: "把当前子任务的重要进展或最终结论提交给父 Agent。报告进入父 Agent 的上下文；不替代当前与用户的直接对话，也不会自动启动空闲父 Agent。",
    promptGuidelines: ["完成委派任务或发现需要父 Agent 协调的问题时，使用 report 上报实际结论、修改、验证情况及未完成项。"],
    parameters: z.toJSONSchema(parameters), executionMode: "sequential",
    async execute(_id, params, signal) {
      signal?.throwIfAborted();
      const { content } = parameters.parse(params);
      const id = await reportToParent(cwd, parentFile, file, name, content);
      send({ type: "report", id, parentFile, file, name, content });
      return { content: [{ type: "text", text: "已上报父 Agent" }], details: { id } };
    },
  };
}
