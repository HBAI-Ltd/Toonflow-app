import { z } from "zod";
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import { listAutomations, updateAutomation } from "@/agent/runtime/automations";
import { scheduleSchema } from "@/agent/runtime/schedule";
import type { AgentAutomation, AgentAutomationCommand, AgentAutomationInput, AgentSchedule } from "@/agent/runtime/types";

const [, interval, daily, weekly] = scheduleSchema.options;
const schedule = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("after"), seconds: z.int().positive().max(2147483647) }),
  z.strictObject({ kind: z.literal("once"), at: z.iso.datetime({ offset: true }) }),
  interval, daily, weekly,
]);
const reference = { id: z.uuid(), revision: z.int().positive() };
const fields = {
  name: z.string().trim().min(1).max(120), prompt: z.string().trim().min(1).max(8000), schedule,
  destination: z.enum(["current", "new"]).optional(),
};
const parameters = z.strictObject({
  command: z.discriminatedUnion("action", [
    z.strictObject({ action: z.literal("list") }),
    z.strictObject({ action: z.literal("create"), ...fields }),
    z.strictObject({ action: z.literal("edit"), ...reference, ...fields }),
    z.strictObject({ action: z.enum(["pause", "resume", "run", "cancel", "delete"]), ...reference }),
  ]),
});

function resolveSchedule(input: z.infer<typeof schedule>): AgentSchedule {
  if (input.kind === "after") return { kind: "once", at: Date.now() + input.seconds * 1000 };
  if (input.kind === "once") return { kind: "once", at: Date.parse(input.at) };
  return input;
}

function describeTasks(tasks: AgentAutomation[], currentFile: string) {
  return tasks.map(({ id, revision, name, prompt, schedule, enabled, nextRunAt, runs, sessionFile, cancelledAt, queued }) => ({
    id, revision, name, prompt, enabled, cancelledAt, queued, nextRunAt: nextRunAt === null ? null : new Date(nextRunAt).toISOString(),
    schedule: schedule.kind === "once" ? { kind: "once", at: new Date(schedule.at).toISOString() } : schedule,
    destination: !sessionFile ? "new" : sessionFile === currentFile ? "current" : "other",
    lastRun: runs[0],
  }));
}

export function createAutomationTool(cwd: string, model: Pick<AgentAutomationInput, "providerId" | "modelId" | "thinkingLevel">,
  file: string, timeZone: string, planning: () => boolean): ToolDefinition {
  return {
    name: "manageAutomation", label: "自动化任务",
    description: `管理本项目的定时器和自动化任务。仅在用户明确要求安排、变更或运行任务时修改。create 默认回到当前对话；独立任务选择 new，每次在新对话执行。after 是从现在起的秒数；once 使用带 UTC 偏移的 ISO 日期时间；interval 至少 300 秒；daily/weekly 使用 HH:mm 和 IANA 时区，周一为 1，周日为 7。用户时区：${timeZone}。需要当前本地日期时间或变更已有任务时先 list。变更需提交 id 和 revision；edit 省略 destination 会保留原会话。取消任务用 cancel，撤销排队、停止正在执行的任务并取消后续运行，保留历史；临时暂停后续调度用 pause，用户明确要求删除记录才使用 delete。`,
    parameters: z.toJSONSchema(parameters, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(_callId, params, signal) {
      signal?.throwIfAborted();
      const { command } = parameters.parse(params);
      const tasks = await listAutomations(cwd);
      let result = tasks;
      if (command.action !== "list") {
        if (planning()) throw new Error("请先退出计划模式");
        let update: AgentAutomationCommand;
        if (command.action === "create" || command.action === "edit") {
          const prior = command.action === "edit" ? tasks.find(task => task.id === command.id) : undefined;
          const sessionFile = command.destination === "new" ? undefined : command.destination === "current" || !prior ? file : prior.sessionFile;
          update = {
            action: "save", ...(command.action === "edit" ? { id: command.id, revision: command.revision } : {}),
            task: { name: command.name, prompt: command.prompt, schedule: resolveSchedule(command.schedule), sessionFile,
              providerId: prior?.providerId ?? model.providerId, modelId: prior?.modelId ?? model.modelId, thinkingLevel: prior ? prior.thinkingLevel : model.thinkingLevel },
          };
        } else update = command;
        signal?.throwIfAborted();
        result = await updateAutomation(cwd, update);
      }
      const output = { timeZone, localTime: new Date().toLocaleString("sv-SE", { timeZone }), tasks: describeTasks(result, file) };
      return { content: [{ type: "text", text: JSON.stringify(output) }], details: {} };
    },
  };
}
