import { z } from "zod";
import type { SessionManager, ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { QuestionContext } from "@toonflow/tools-scaffold/runtime";
import type { AgentPlan } from "@/agent/runtime/types";
import { translateMessage } from "@/lib/i18n";

export const planInstructions = "计划模式已开启。先了解用户的目标，可以读取资料、检查画布并提问。此阶段仅做探索和方案设计，不修改工作区、画布、素材或设置，不启动生成，也不委派这些操作。方案完整后单独调用 exit_plan_mode，用 Markdown 提交计划供用户评审。用户批准后才执行，要求继续规划时根据反馈修订。";

export function readAgentPlan(history: SessionManager): AgentPlan {
  const entry = history.getBranch().findLast(item => item.type === "custom" && item.customType === "toonflowPlanMode");
  return { active: entry?.type === "custom" && entry.data === true };
}

export function setAgentPlan(history: SessionManager, active: boolean): AgentPlan {
  if (readAgentPlan(history).active !== active) history.appendCustomEntry("toonflowPlanMode", active);
  return { active };
}

const parameters = z.strictObject({ plan: z.string().trim().min(1).max(64000).regex(/^#\s+\S/, "计划须以 Markdown 一级标题开头") });

export function createPlanTool(history: SessionManager, question: QuestionContext | undefined, publish: (plan: AgentPlan) => void): ToolDefinition {
  return {
    name: "exit_plan_mode", label: "提交计划",
    description: "仅在计划模式中使用。用 Markdown 一级标题开头提交完整计划，等待用户批准；用户要求继续规划时按反馈修订后重新提交。",
    parameters: z.toJSONSchema(parameters, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(toolCallId, params, signal) {
      if (!readAgentPlan(history).active) throw new Error("当前对话未开启计划模式");
      if (!question) throw new Error("当前对话无法展示计划评审");
      const { plan } = parameters.parse(params);
      signal?.throwIfAborted();
      const answer = await question.ask(toolCallId, {
        title: translateMessage("计划评审"), question: plan,
        fields: [
          { field: "decision", title: translateMessage("评审结果"), type: "radio", options: ["approve", "reject"], required: true },
          { field: "feedback", title: translateMessage("反馈"), type: "textarea" },
        ],
      }, signal);
      signal?.throwIfAborted();
      if (answer.values?.decision !== "approve") {
        const feedback = answer.values?.feedback;
        throw new Error(typeof feedback === "string" && feedback ? `用户要求继续规划。反馈：${feedback}` : "该计划尚未获批，请修订计划后重新提交。");
      }
      publish(setAgentPlan(history, false));
      return { content: [{ type: "text", text: "用户已批准此计划，计划模式已关闭。请开始执行获批的计划。" }], details: { approved: true } };
    },
  };
}
