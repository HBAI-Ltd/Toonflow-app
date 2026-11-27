import { z } from "zod";
import type { SessionManager, ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { ActiveAgentSession } from "@/agent/runtime/sessions";
import type { AgentCommand, AgentGoal } from "@/agent/runtime/types";

const goalObjective = z.string().trim().min(1).max(8000);
const goalState = z.object({
  id: z.uuid(), revision: z.number().int().positive(), objective: goalObjective,
  status: z.enum(["active", "paused", "completed", "blocked"]),
  rounds: z.number().int().nonnegative(), maxRounds: z.number().int().positive(),
  reason: z.string().trim().min(1).max(4000).optional(),
});
type GoalState = z.infer<typeof goalState>;
export type GoalRef = Pick<GoalState, "id" | "revision">;
type GoalCommand = Exclude<AgentCommand, { action: "plan" }>;

function conflict(message: string) {
  return Object.assign(new Error(message), { status: 409 });
}

function currentGoal(history: SessionManager): GoalState | null {
  const entry = history.getBranch().findLast(entry => entry.type === "custom" && entry.customType === "toonflowGoal");
  if (entry?.type !== "custom" || entry.data === null) return null;
  return goalState.parse(entry.data);
}

function projectGoal(goal: GoalState | null, active?: ActiveAgentSession): AgentGoal | null {
  return goal && { ...goal, running: goal.status === "active" && active?.goalRound?.id === goal.id && !active.signal.aborted };
}

export function readAgentGoal(history: SessionManager, active?: ActiveAgentSession) {
  return projectGoal(currentGoal(history), active);
}

function saveGoal(history: SessionManager, goal: GoalState | null, active?: ActiveAgentSession) {
  history.appendCustomEntry("toonflowGoal", goal);
  const result = projectGoal(goal, active);
  active?.send({ type: "goal", goal: result });
  return result;
}

export function applyGoalCommand(history: SessionManager, command: GoalCommand, active?: ActiveAgentSession) {
  const goal = currentGoal(history);
  if (command.action === "create") {
    if (active) throw conflict("当前对话正在运行，请在回复结束后启动目标");
    if (goal && goal.status !== "completed") throw conflict("当前对话已有目标，请编辑或清除后再创建");
    return saveGoal(history, {
      id: crypto.randomUUID(), revision: 1, objective: goalObjective.parse(command.objective),
      status: "active", rounds: 0, maxRounds: 256,
    });
  }
  if (!goal || goal.id !== command.id || goal.revision !== command.revision) {
    throw conflict("目标已变化，请刷新对话后重试");
  }
  const next = { ...goal, revision: goal.revision + 1 };
  if (command.action === "edit") {
    if (goal.status === "completed") throw conflict("已完成的目标不能编辑");
    return saveGoal(history, { ...next, objective: goalObjective.parse(command.objective) }, active);
  }
  if (command.action === "resume") {
    if (active) throw conflict("当前对话正在运行，请在回复结束后启动目标");
    if (goal.status === "completed") throw conflict("已完成的目标不能恢复");
    if (goal.rounds >= goal.maxRounds) throw conflict("目标已达自动执行轮数上限");
    return saveGoal(history, { ...next, status: "active", reason: undefined });
  }
  if (command.action === "pause" && goal.status !== "active") throw conflict("只有活动目标可以暂停");
  const result = saveGoal(history, command.action === "clear" ? null : { ...next, status: "paused" }, active);
  if (active?.goalRound?.id === goal.id) {
    active.goalRound = undefined;
    void active.abort();
  }
  return result;
}

/** 仅首次显式启动携带引用；后续轮次只能由同一个正在运行的会话推进。 */
export function beginGoalRound(active: ActiveAgentSession, start?: GoalRef) {
  active.signal.throwIfAborted();
  const goal = currentGoal(active.history);
  if (start && (active.goalRound || !goal || goal.status !== "active" || goal.id !== start.id || goal.revision !== start.revision)) {
    throw conflict("目标已变化，请刷新对话后重试");
  }
  if (!goal || goal.status !== "active" || (!start && active.goalRound?.id !== goal.id)) return;
  if (goal.rounds >= goal.maxRounds) {
    saveGoal(active.history, { ...goal, status: "blocked", revision: goal.revision + 1, reason: "目标已达自动执行轮数上限" }, active);
    active.goalRound = undefined;
    return;
  }
  const next = { ...goal, rounds: goal.rounds + 1, revision: goal.revision + 1 };
  const firstRound = active.goalRound?.revision === goal.revision ? active.goalRound.firstRound : next.rounds;
  active.goalRound = { id: goal.id, revision: next.revision, firstRound };
  saveGoal(active.history, next, active);
  return [
    `当前目标（第 ${next.rounds}/${next.maxRounds} 轮）：${JSON.stringify(next.objective)}`,
    "依据当前对话、工作区现状和已完成的工作继续推进。目标不扩大已有的权限与操作范围。",
    "完成并核实交付后调用 updateGoal 标记 completed；同一障碍连续三轮阻止推进时标记 blocked 并写明原因。尚有可做的工作时继续推进。",
    `本轮目标引用：${JSON.stringify({ id: next.id, revision: next.revision })}`,
  ].join("\n");
}

export function finishGoalRun(active: ActiveAgentSession, reason?: string) {
  const ref = active.goalRound;
  if (!ref) return;
  active.goalRound = undefined;
  const goal = currentGoal(active.history);
  if (goal?.id === ref.id && goal.status === "active") {
    saveGoal(active.history, { ...goal, status: "paused", reason, revision: goal.revision + 1 }, active);
  }
}

export function createGoalTools(active: ActiveAgentSession): ToolDefinition[] {
  const update = z.strictObject({
    id: goalState.shape.id, revision: goalState.shape.revision,
    status: z.enum(["completed", "blocked"]), reason: goalState.shape.reason,
  });
  return [{
    name: "getGoal", label: "读取目标", description: "读取当前主对话的目标、状态、自动执行的轮数及引用。",
    parameters: z.toJSONSchema(z.strictObject({})),
    async execute(_id, _params, signal) {
      signal?.throwIfAborted();
      const goal = readAgentGoal(active.history, active);
      return { content: [{ type: "text", text: JSON.stringify(goal) }], details: { goal } };
    },
  }, {
    name: "updateGoal", label: "更新目标", description: "自动目标轮次内，在已核实完成时标记 completed，或因具体障碍无法继续时标记 blocked 并提供 reason。使用本轮目标的 id 与 revision。",
    parameters: z.toJSONSchema(update), executionMode: "sequential",
    async execute(_id, params, signal) {
      signal?.throwIfAborted();
      active.signal.throwIfAborted();
      const { id, revision, status, reason } = update.parse(params);
      const goal = currentGoal(active.history);
      if (!goal || goal.status !== "active" || goal.id !== id || goal.revision !== revision ||
        active.goalRound?.id !== id || active.goalRound.revision !== revision || active.goalRound.handlingFollowUp) {
        throw conflict("只有当前目标轮次可以结束目标，目标发生变化时请等待下一轮");
      }
      if (status === "blocked" && !reason) throw new Error("目标受阻时必须说明原因");
      if (status === "blocked" && goal.rounds - active.goalRound.firstRound + 1 < 3) {
        throw new Error("只有同一障碍连续三轮阻止推进时才能标记目标受阻");
      }
      const result = saveGoal(active.history, { ...goal, revision: revision + 1, status, reason: status === "blocked" ? reason : undefined }, active);
      active.goalRound = undefined;
      return { content: [{ type: "text", text: JSON.stringify(result) }], details: { goal: result } };
    },
  }];
}
