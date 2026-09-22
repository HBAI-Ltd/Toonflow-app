import { z } from "zod";
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { CanvasContext, ToolCall } from "@toonflow/tools-scaffold/runtime";
import { teamNameSchema } from "@toonflow/teams-scaffold/runtime";
import { addUsage, emptyUsage, runSubAgent, type SubAgentModel, type SubAgentResult } from "@/agent/runtime/subAgent";
import { createTeamRunner } from "@/agent/teams";
import { runRemoteTeam } from "@/agent/teams/remote";
import { listTeams, getRemoteTeam } from "@/utils/teams";

const parameters = z.strictObject({
  tasks: z.array(z.strictObject({
    name: z.string().trim().min(1).max(80).describe("本次任务名称"),
    task: z.string().trim().min(1).max(24000).describe("完整任务、必要背景、相对路径、已获授权和预期交付；不继承主对话历史"),
    team: teamNameSchema.optional().describe("已安装团队或远端 A2A 连接名；省略则创建临时子 Agent"),
    taskId: z.string().min(1).max(512).optional().describe("继续远端等待补充的 A2A task 时原样传回"),
    contextId: z.string().min(1).max(512).optional().describe("继续远端 A2A 会话时原样传回"),
  })).min(1),
});

export async function createSubAgentTool({ cwd, tools, canvas, onTool, ...modelOptions }: SubAgentModel & {
  cwd: string; tools: ToolDefinition[]; canvas?: CanvasContext; onTool?: (tool: ToolCall) => void;
}): Promise<ToolDefinition> {
  if (tools.some(tool => tool.name === "subAgent")) throw new Error("工具名称 subAgent 已被内置子任务工具占用");
  const teams = (await listTeams()).filter(team => team.enabled && !team.loadError);
  const subAgentTool: ToolDefinition = {
    name: "subAgent", label: "子任务与团队",
    description: `并行执行委派的独立任务。省略 team 使用临时子 Agent，完整继承父 Agent 的工具，包括提问和继续委派；指定 team 调用已安装团队或外部 A2A。宿主工具：${[...tools.map(tool => tool.name), "subAgent"].join("、")}。团队目录：${JSON.stringify(teams.map(({ name, description, kind }) => ({ name, description, kind })))}。本地团队按清单分工。任务数量、并发数、执行轮次和总时长不设固定上限，可由用户停止。`,
    promptSnippet: "按需使用 subAgent 委派独立工作，或指定已安装 team 调用专用团队。",
    promptGuidelines: [
      "简单任务直接完成；只委派相互独立的工作，提供必要背景和真实授权。并行任务不得修改同一文件或画布，依赖任务分次处理。",
      "委派不扩大权限或消耗算力授权。远端团队会收到 task 文本，仅发送完成任务所需且获准分享的内容；不能访问本机工具或未发送的文件。",
      "核验结果和 status；inputRequired 表示等待补充，应向用户确认后带原 taskId/contextId 继续该远端团队。错误、取消、达到限制均不等于完成，不自动重试可能已经产生副作用的任务。",
    ],
    parameters: z.toJSONSchema(parameters, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(_id, params, signal, onUpdate) {
      signal?.throwIfAborted();
      const { tasks } = parameters.parse(params);
      const results: SubAgentResult[] = tasks.map(task => ({ name: task.name, status: "running", result: "准备执行" }));
      const usage = emptyUsage();
      const content = () => [{ type: "text" as const, text: JSON.stringify({ tasks: results }) }];
      const update = () => { if (!signal?.aborted) onUpdate?.({ content: content(), details: {} }); };
      update();
      await Promise.all(tasks.map(async (task, index) => {
        const onProgress = (text: string) => { results[index]!.result = text; update(); };
        try {
          const remote = task.team && getRemoteTeam(task.team);
          if ((task.taskId || task.contextId) && !remote) throw new Error("只有远端 A2A 团队支持 taskId/contextId");
          const output = remote
            ? await runRemoteTeam({ ...task, name: task.team!, signal, onProgress })
            : task.team
              ? await (await createTeamRunner({ ...modelOptions, cwd, tools: inheritedTools, canvas, name: task.team })).run(task.task, signal, onProgress)
              : await runSubAgent({ ...modelOptions, cwd, ...task, tools: inheritedTools, signal, onTool, onProgress });
          results[index] = { ...output.result, name: task.name };
          addUsage(usage, output.usage);
        } catch (error) {
          results[index] = { name: task.name, status: signal?.aborted ? "cancelled" : "error", result: error instanceof Error ? error.message : String(error) };
        }
        update();
      }));
      return { content: content(), details: {}, usage };
    },
  };
  const inheritedTools = [...tools, subAgentTool];
  return subAgentTool;
}
