import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { join } from "node:path";
import type { MediaGenerationRequest } from "@toonflow/tools-scaffold/runtime";
import { generateMedia } from "@/utils/media/generation";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

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
const recoveredDirectories = new Set<string>();

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

async function updateTask(directory: string, id: string, update: Partial<MediaTask>, expected?: MediaTaskStatus[]) {
  return mutateTasks(directory, tasks => {
    const index = tasks.findIndex(task => task.id === id);
    if (index < 0) return undefined;
    if (expected && !expected.includes(tasks[index]!.status)) return tasks[index];
    tasks[index] = { ...tasks[index]!, ...update, updatedAt: new Date().toISOString() };
    return tasks[index];
  });
}

async function mutateTasks<T>(directory: string, mutate: (tasks: MediaTask[]) => T) {
  const path = await taskFile(directory);
  const release = lockWorkspaceFiles([path]);
  try {
    const tasks = await readTasks(directory);
    const result = mutate(tasks);
    await writeTasks(directory, tasks);
    return result;
  } finally { release(); }
}

async function runTask(task: MediaTask) {
  const controller = new AbortController();
  controllers.set(task.id, controller);
  try {
    const started = await updateTask(task.directory, task.id, { status: "running", error: undefined }, ["queued"]);
    if (!started || started.status !== "running") return;
    const result = await generateMedia(task.directory, task.mediaType, task.request, controller.signal);
    await updateTask(task.directory, task.id, { status: "completed", result }, ["running"]);
  } catch (error) {
    const cancelled = controller.signal.aborted;
    await updateTask(task.directory, task.id, {
      status: cancelled ? "cancelled" : "failed",
      error: error instanceof Error ? error.message : String(error),
    }, ["running"]);
  } finally {
    controllers.delete(task.id);
  }
}

export async function createMediaTask(directory: string, mediaType: MediaTask["mediaType"], request: MediaGenerationRequest) {
  await ensureRecovered(directory);
  const now = new Date().toISOString();
  const task: MediaTask = { id: crypto.randomUUID(), directory, mediaType, request, status: "queued", createdAt: now, updatedAt: now };
  await mutateTasks(directory, tasks => { tasks.push(task); });
  void runTask(task).catch(() => {});
  return task;
}

export async function getMediaTask(directory: string, id: string) {
  await ensureRecovered(directory);
  return (await readTasks(directory)).find(task => task.id === id);
}

export async function listMediaTasks(directory: string) {
  await ensureRecovered(directory);
  return (await readTasks(directory)).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function cancelMediaTask(directory: string, id: string) {
  await ensureRecovered(directory);
  const task = await mutateTasks(directory, tasks => {
    const current = tasks.find(item => item.id === id);
    if (!current) return undefined;
    if (current.status === "queued" || current.status === "running") {
      current.status = "cancelled";
      current.error = "任务已取消";
      current.updatedAt = new Date().toISOString();
    }
    return current;
  });
  controllers.get(id)?.abort();
  return task;
}

export async function retryMediaTask(directory: string, id: string) {
  await ensureRecovered(directory);
  const task = await getMediaTask(directory, id);
  if (!task || !["failed", "cancelled"].includes(task.status)) return task;
  const next = await updateTask(directory, id, { status: "queued", error: undefined, result: undefined });
  if (next) void runTask(next);
  return next;
}

export async function recoverMediaTasks(directory: string) {
  await mutateTasks(directory, tasks => {
    for (const task of tasks) {
      if (!controllers.has(task.id) && (task.status === "queued" || task.status === "running")) {
        task.status = "failed";
        task.error = "服务重启导致任务中断，请重试";
        task.updatedAt = new Date().toISOString();
      }
    }
  });
}

async function ensureRecovered(directory: string) {
  if (recoveredDirectories.has(directory)) return;
  await recoverMediaTasks(directory);
  recoveredDirectories.add(directory);
}
