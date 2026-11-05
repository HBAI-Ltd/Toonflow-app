import type { GeneratedMedia, MediaGenerationRequest } from "@toonflow/tools-scaffold/runtime";
import { error, errorFromCause, success, type ApiResponse } from "@/lib/responseFormat";
import { generateMedia } from "@/utils/media/generation";
import { currentUser, isMultiUser } from "@/utils/accounts/context";
import { getTask, runTask } from "@/utils/hosting/tasks";

type MediaTask = {
  userId?: string;
  cwd: string;
  controller: AbortController;
  touchedAt: number;
  settledAt?: number;
  result?: ApiResponse<GeneratedMedia[]>;
};

// ACT: 单进程临时任务，结果结束后保留 5 分钟；重启和结果过期后不恢复。
const tasks = new Map<string, MediaTask>();

function stop(task: MediaTask, message: string) {
  if (task.result) return;
  task.result = error<GeneratedMedia[]>(message, null, 499);
  task.controller.abort(new Error(message));
}

function cleanup() {
  const now = Date.now();
  for (const [taskId, task] of tasks) {
    if (task.settledAt !== undefined) {
      if (task.settledAt + 300000 <= now) tasks.delete(taskId);
    } else if (task.touchedAt + 120000 <= now) stop(task, "生成任务因页面长时间未连接而停止");
  }
}

const cleanupTimer = setInterval(cleanup, 30000);
cleanupTimer.unref();

export function start(cwd: string, taskId: string, mediaType: "image" | "video" | "audio", request: MediaGenerationRequest) {
  cleanup();
  if (tasks.has(taskId)) throw Object.assign(new Error("生成任务已存在，请勿重复提交"), { status: 409 });
  // ACT: 最多 1000 个任务；取消后仍等待生成 Promise 收尾，避免忽略取消的供应商绕过上限。
  if (tasks.size >= 1000) throw Object.assign(new Error("生成任务过多，请稍后重试"), { status: 429 });
  const task: MediaTask = { cwd, userId: currentUser()?.id, controller: new AbortController(), touchedAt: Date.now() };
  tasks.set(taskId, task);
  void runTask({ kind: mediaType, model: request.modelId, directory: cwd, signal: task.controller.signal, taskId },
    signal => generateMedia(cwd, mediaType, request, signal)).then(
    files => { task.result ??= success(files); },
    cause => { task.result ??= { ...errorFromCause(cause), data: null }; },
  ).finally(() => { task.settledAt = Date.now(); });
}

export function status(cwd: string, taskIds: string[]) {
  cleanup();
  return taskIds.map(taskId => {
    const task = tasks.get(taskId);
    if (!task || task.cwd !== cwd || (isMultiUser() && task.userId !== currentUser()?.id)) {
      const record = isMultiUser() ? getTask(taskId) : null;
      if (record?.directory === cwd) return { taskId, result: error<GeneratedMedia[]>(record.error ?? "任务已结束，结果已过期，请查看工作区中的文件", null, 410) };
      return { taskId, result: error<GeneratedMedia[]>("生成任务不存在或已过期", null, 404) };
    }
    task.touchedAt = Date.now();
    return { taskId, ...(task.result ? { result: task.result } : {}) };
  });
}

export function cancel(cwd: string, taskIds: string[]) {
  for (const taskId of taskIds) {
    const task = tasks.get(taskId);
    if (task?.cwd === cwd && (!isMultiUser() || task.userId === currentUser()?.id)) stop(task, "生成已取消");
  }
}
