import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { join } from "node:path";
import { exportProduction } from "@/utils/production/export";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

export type ExportTaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type ExportTask = { id: string; directory: string; outputPath: string; inputPaths: string[]; status: ExportTaskStatus; progress: number; createdAt: string; updatedAt: string; error?: string };
const controllers = new Map<string, AbortController>();
const recovered = new Set<string>();

async function taskPath(directory: string) {
  await mkdir(join(directory, ".toonflow"), { recursive: true });
  return (await resolveWorkspacePath(directory, ".toonflow/exportTasks.json", true)).path;
}
async function readTasks(directory: string) {
  const path = await taskPath(directory);
  const content = await readFile(path, "utf8").catch((error: NodeJS.ErrnoException) => error.code === "ENOENT" ? "[]" : Promise.reject(error));
  const value = JSON.parse(content);
  return Array.isArray(value) ? value as ExportTask[] : [];
}
async function mutate<T>(directory: string, update: (tasks: ExportTask[]) => T) {
  const path = await taskPath(directory);
  const release = lockWorkspaceFiles([path]);
  try {
    const tasks = await readTasks(directory);
    const result = update(tasks);
    await writeAtomic(path, JSON.stringify(tasks, null, 2));
    return result;
  } finally { release(); }
}
async function ensureRecovered(directory: string) {
  if (recovered.has(directory)) return;
  await mutate(directory, tasks => {
    for (const task of tasks) if (!controllers.has(task.id) && (task.status === "queued" || task.status === "running")) {
      task.status = "failed"; task.error = "服务重启导致导出中断"; task.updatedAt = new Date().toISOString();
    }
  });
  recovered.add(directory);
}
async function update(directory: string, id: string, values: Partial<ExportTask>) {
  return mutate(directory, tasks => {
    const task = tasks.find(item => item.id === id);
    if (!task) return undefined;
    Object.assign(task, values, { updatedAt: new Date().toISOString() });
    return task;
  });
}
async function run(task: ExportTask) {
  const controller = new AbortController();
  controllers.set(task.id, controller);
  try {
    await update(task.directory, task.id, { status: "running", progress: 0, error: undefined });
    await exportProduction(task.directory, task.outputPath, task.inputPaths, controller.signal, progress => { void update(task.directory, task.id, { progress }); });
    await update(task.directory, task.id, { status: "completed", progress: 100 });
  } catch (error) {
    await update(task.directory, task.id, { status: controller.signal.aborted ? "cancelled" : "failed", error: error instanceof Error ? error.message : String(error) });
  } finally { controllers.delete(task.id); }
}

export async function createExportTask(directory: string, outputPath: string, inputPaths: string[]) {
  await ensureRecovered(directory);
  const now = new Date().toISOString();
  const task: ExportTask = { id: crypto.randomUUID(), directory, outputPath, inputPaths, status: "queued", progress: 0, createdAt: now, updatedAt: now };
  await mutate(directory, tasks => { tasks.push(task); });
  void run(task).catch(() => {});
  return task;
}
export async function getExportTask(directory: string, id: string) { await ensureRecovered(directory); return (await readTasks(directory)).find(task => task.id === id); }
export async function listExportTasks(directory: string) { await ensureRecovered(directory); return (await readTasks(directory)).sort((left, right) => right.createdAt.localeCompare(left.createdAt)); }
export async function cancelExportTask(directory: string, id: string) {
  const task = await getExportTask(directory, id);
  if (!task) return undefined;
  controllers.get(id)?.abort();
  if (task.status === "queued" || task.status === "running") return update(directory, id, { status: "cancelled", error: "任务已取消" });
  return task;
}
