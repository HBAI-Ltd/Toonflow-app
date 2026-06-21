import db from "@/utils/db";

export type TaskProgressStatus = "pending" | "running" | "complete" | "warning" | "error";

export interface TaskProgressInput {
  taskId: number;
  projectId: number;
  scriptId?: number | null;
  phase: string;
  status: TaskProgressStatus;
  message: string;
  current?: number | null;
  total?: number | null;
  meta?: unknown;
}

async function hasProgressTable() {
  return db.schema.hasTable("o_taskProgress");
}

export async function addTaskProgress(input: TaskProgressInput) {
  if (!(await hasProgressTable())) return null;
  const now = Date.now();
  const [id] = await db("o_taskProgress").insert({
    taskId: input.taskId,
    projectId: input.projectId,
    scriptId: input.scriptId ?? null,
    phase: input.phase,
    status: input.status,
    message: input.message,
    current: input.current ?? null,
    total: input.total ?? null,
    meta: input.meta == null ? null : JSON.stringify(input.meta),
    createTime: now,
    updateTime: now,
  } as any);
  return Number(id);
}

export async function listTaskProgress(projectId: number, taskIds: number[], limit = 120) {
  if (!taskIds.length || !(await hasProgressTable())) return [];
  return db("o_taskProgress")
    .where("projectId", projectId)
    .whereIn("taskId", taskIds)
    .orderBy("createTime", "asc")
    .orderBy("id", "asc")
    .limit(limit);
}
