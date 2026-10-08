import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { join } from "node:path";
import type { MediaGenerationRequest } from "@toonflow/tools-scaffold/runtime";
import { generateMedia } from "@/utils/media/generation";
import { resolveWorkspacePath } from "@/utils/workspace/files";

export type MediaTaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type MediaTask = {
  id: string;
  directory: string;
  mediaType: "image" | "video" | "audio";
  request: MediaGenerationRequest;
  status: MediaTaskStatus;
  createdAt: string;
  updatedAt: string;
  result?: Awaited<ReturnType<typeof generateMedia>>;
  error?: string;
};

const controllers = new Map<string, AbortController>();

async function taskFile(directory: string) {
  const target = await resolveWorkspacePath(directory, ".toonflow/mediaTasks.json", true);
  await mkdir(join(directory, ".toonflow"), { recursive: true });
  return target.path;
}

async function readTasks(directory: string) {
  const path = await taskFile(directory);
  const content = await readFile(path, "utf8").catch((error: NodeJS.ErrnoException) => error.code === "ENOENT" ? "[]" : Promise.reject(error));
  try {
    const value = JSON.parse(content);
    return Array.isArray(value) ? value as MediaTask[] : [];
  } catch {
    throw new Error("媒体任务记录损坏，请备份后删除 .toonflow/mediaTasks.json");
  }
}

async function writeTasks(directory: string, tasks: MediaTask[]) {
  const path = await taskFile(directory);
  await writeAtomic(path, JSON.stringify(tasks, null, 2));
}

async function updateTask(directory: string, id: string, update: Partial<MediaTask>) {
  const tasks = await readTasks(directory);
  const index = tasks.findIndex(task => task.id === id);
  if (index < 0) return undefined;
  tasks[index] = { ...tasks[index]!, ...update, updatedAt: new Date().toISOString() };
  await writeTasks(directory, tasks);
  return tasks[index];
}

async function runTask(task: MediaTask) {
  const controller = new AbortController();
  controllers.set(task.id, controller);
  await updateTask(task.directory, task.id, { status: "running", error: undefined });
  try {
    const result = await generateMedia(task.directory, task.mediaType, task.request, controller.signal);
    await updateTask(task.directory, task.id, { status: "completed", result });
  } catch (error) {
    const cancelled = controller.signal.aborted;
    await updateTask(task.directory, task.id, {
      status: cancelled ? "cancelled" : "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    controllers.delete(task.id);
  }
}

export async function createMediaTask(directory: string, mediaType: MediaTask["mediaType"], request: MediaGenerationRequest) {
  await recoverMediaTasks(directory);
  const now = new Date().toISOString();
  const task: MediaTask = { id: crypto.randomUUID(), directory, mediaType, request, status: "queued", createdAt: now, updatedAt: now };
  const tasks = await readTasks(directory);
  tasks.push(task);
  await writeTasks(directory, tasks);
  void runTask(task);
  return task;
}

export async function getMediaTask(directory: string, id: string) {
  return (await readTasks(directory)).find(task => task.id === id);
}

export async function cancelMediaTask(directory: string, id: string) {
  const task = await getMediaTask(directory, id);
  if (!task) return undefined;
  controllers.get(id)?.abort();
  if (task.status === "queued") return updateTask(directory, id, { status: "cancelled", error: "任务已取消" });
  return getMediaTask(directory, id);
}

export async function retryMediaTask(directory: string, id: string) {
  const task = await getMediaTask(directory, id);
  if (!task || !["failed", "cancelled"].includes(task.status)) return task;
  const next = await updateTask(directory, id, { status: "queued", error: undefined, result: undefined });
  if (next) void runTask(next);
  return next;
}

export async function recoverMediaTasks(directory: string) {
  const tasks = await readTasks(directory);
  let changed = false;
  for (const task of tasks) {
    if (task.status === "queued" || task.status === "running") {
      task.status = "failed";
      task.error = "服务重启导致任务中断，请重试";
      task.updatedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) await writeTasks(directory, tasks);
}
