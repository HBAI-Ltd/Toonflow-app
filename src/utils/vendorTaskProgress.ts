import { AsyncLocalStorage } from "node:async_hooks";
import { addTaskProgress } from "@/utils/taskProgress";

type VendorTaskContext = { taskId: number; projectId: number; scriptId?: number | null };

const contextStore = new AsyncLocalStorage<VendorTaskContext>();

export async function runWithVendorTaskContext<T>(context: VendorTaskContext, fn: () => Promise<T>): Promise<T> {
  return contextStore.run(context, fn);
}

export function recordVendorLogProgress(logstring: any) {
  const context = contextStore.getStore();
  if (!context) return;
  const progress = parseVmProgress(logstring);
  if (!progress) return;
  void addTaskProgress({
    taskId: context.taskId,
    projectId: context.projectId,
    scriptId: context.scriptId ?? null,
    ...progress,
  }).catch((e) => console.warn(`[taskProgress] ${errorMessage(e)}`));
}

function parseVmProgress(logstring: any) {
  const text = typeof logstring === "string" ? logstring : "";
  if (!text.includes("[视频生成]")) return null;
  if (text.includes("提交任务")) {
    return { phase: "provider_submit", status: "running" as const, message: text };
  }
  const created = text.match(/任务已创建,\s*ID:\s*(\S+)/);
  if (created) {
    return {
      phase: "provider_task",
      status: "running" as const,
      message: `远端视频任务已创建：${created[1]}`,
      meta: { providerTaskId: created[1] },
    };
  }
  const statePrefix = "[视频生成] 任务状态:";
  if (text.includes(statePrefix)) {
    const payload = text.slice(text.indexOf(statePrefix) + statePrefix.length).trim();
    let task: any = {};
    try {
      task = JSON.parse(payload);
    } catch {
      task = {};
    }
    const providerStatus = String(task.status || "unknown");
    const done = ["succeeded", "failed", "expired", "cancelled"].includes(providerStatus);
    return {
      phase: "provider_poll",
      status: providerStatus === "succeeded" ? "complete" as const : done ? "error" as const : "running" as const,
      message: `远端视频任务状态：${providerStatus}`,
      meta: { providerTaskId: task.id || task.task_id || null, providerStatus },
    };
  }
  return null;
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
