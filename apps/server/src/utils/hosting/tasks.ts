import { AsyncLocalStorage } from "node:async_hooks";
import { getDatabase } from "@/utils/accounts/database";
import { getUser } from "@/utils/accounts/service";
import { isMultiUser, requireUser, runWithUser } from "@/utils/accounts/context";
import { reconcileBilling, taskBilling, withTaskBilling } from "./billing";

type TaskOptions = { kind: string; model?: string; directory?: string; signal?: AbortSignal; taskId?: string };
type TaskRecord = {
  id: string; userId: string; kind: string; model: string | null; directory: string | null;
  status: string; createdAt: number; startedAt: number | null; finishedAt: number | null;
  error: string | null; usage: string | null; upstreamJob: string | null;
};
type ActiveTask = { id: string; userId: string; kind: string; controller: AbortController; running: boolean; start: () => void };
type TaskContext = { id: string; userId: string; signal: AbortSignal; kind: string };
export type UpstreamJob = {
  provider: string; id: string; status?: string; mediaType?: "image" | "video" | "audio";
  protocol?: "modelVerse" | "minimaxH3"; checkedAt?: number; reconciliation?: string;
};
const context = new AsyncLocalStorage<TaskContext>();
const active = new Map<string, ActiveTask>();
let initialized = false;
let accountTimer: ReturnType<typeof setInterval> | undefined;
let transcodes = 0;
const waitingTranscodes = new Set<() => void>();

function database() {
  const db = getDatabase();
  if (!initialized) {
    db.exec(`CREATE TABLE IF NOT EXISTS hostedTasks (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL, kind TEXT NOT NULL, model TEXT, directory TEXT,
      status TEXT NOT NULL, createdAt INTEGER NOT NULL, startedAt INTEGER, finishedAt INTEGER,
      error TEXT, usage TEXT, upstreamJob TEXT
    ); CREATE INDEX IF NOT EXISTS hostedTasksOwner ON hostedTasks(userId, createdAt);`);
    // ACT: 重启时只终结本地未完成记录；不重提付费请求，保留上游任务 ID 供人工核对。
    db.query("UPDATE hostedTasks SET status = 'interrupted', finishedAt = ?, error = ? WHERE status IN ('queued', 'running')")
      .run(Date.now(), "服务已重启；未自动重新提交，请核对上游任务后决定是否重试");
    initialized = true;
    accountTimer = setInterval(() => {
      for (const task of active.values()) {
        try {
          if (!getUser(task.userId)?.enabled) task.controller.abort(new Error("账户已停用，任务已取消"));
        } catch { task.controller.abort(new Error("账户状态无法验证，任务已取消")); }
      }
    }, 1000);
    accountTimer.unref();
  }
  return db;
}

export function initializeTaskQueue() {
  if (isMultiUser()) database();
}

function schedule() {
  if (transcodes === 0) waitingTranscodes.values().next().value?.();
  for (const task of active.values()) {
    if (task.running || task.controller.signal.aborted) continue;
    const running = [...active.values()].filter(item => item.running);
    if (running.some(item => item.userId === task.userId)) continue;
    if (task.kind === "transcode" ? transcodes >= 1 : running.filter(item => item.kind !== "transcode").length >= 2) continue;
    task.running = true;
    if (task.kind === "transcode") transcodes++;
    task.start();
  }
}

export async function runTask<T>(options: TaskOptions, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (!isMultiUser()) return operation(options.signal ?? new AbortController().signal);
  const parent = context.getStore();
  if (parent) {
    const signal = options.signal ? AbortSignal.any([parent.signal, options.signal]) : parent.signal;
    signal.throwIfAborted();
    if (options.kind !== "transcode" || parent.kind === "transcode") return operation(signal);
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        if (transcodes) return;
        waitingTranscodes.delete(start);
        signal.removeEventListener("abort", cancel);
        transcodes++;
        resolve();
      };
      const cancel = () => {
        waitingTranscodes.delete(start);
        reject(signal.reason);
      };
      waitingTranscodes.add(start);
      signal.addEventListener("abort", cancel, { once: true });
      start();
    });
    try { return await context.run({ ...parent, kind: "transcode", signal }, () => operation(signal)); }
    finally { transcodes--; schedule(); }
  }
  const user = requireUser();
  if (!getUser(user.id)?.enabled) throw Object.assign(new Error("账户已停用"), { status: 403 });
  const db = database();
  const id = options.taskId ?? crypto.randomUUID();
  if (db.query("SELECT id FROM hostedTasks WHERE id = ?").get(id)) throw Object.assign(new Error("任务已存在，请勿重复提交"), { status: 409 });
  if (active.size >= 1000) throw Object.assign(new Error("排队任务过多，请稍后重试"), { status: 429 });
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  db.query("INSERT INTO hostedTasks (id,userId,kind,model,directory,status,createdAt) VALUES (?,?,?,?,?,'queued',?)")
    .run(id, user.id, options.kind, options.model ?? null, options.directory ?? null, Date.now());
  return new Promise<T>((resolve, reject) => {
    const finish = async (status: string) => {
      const message = status === "failed" ? "任务执行失败，请查看当前请求返回的错误"
        : status === "cancelled" ? "任务已取消；已提交的上游任务可能仍会计费" : null;
      try {
        db.query("UPDATE hostedTasks SET status=?,finishedAt=?,error=? WHERE id=?").run(status, Date.now(), message, id);
        // 账单可能晚于流结束落库；暂未取得时保留待核对，不能改变已经完成的模型结果。
        await reconcileBilling(id).catch(() => undefined);
      } finally {
        if (active.get(id)?.running && options.kind === "transcode") transcodes--;
        active.delete(id);
        signal.removeEventListener("abort", cancel);
        schedule();
      }
    };
    const cancel = () => {
      if (active.get(id)?.running) return;
      void finish("cancelled").finally(() => reject(signal.reason ?? new DOMException("任务已取消", "AbortError")));
    };
    const task: ActiveTask = { id, userId: user.id, kind: options.kind, controller, running: false, start: () => {
      db.query("UPDATE hostedTasks SET status='running',startedAt=? WHERE id=?").run(Date.now(), id);
      void runWithUser(user, () => context.run({ id, userId: user.id, signal, kind: options.kind }, async () => {
        try {
          signal.throwIfAborted();
          if (!getUser(user.id)?.enabled) throw Object.assign(new Error("账户已停用"), { status: 403 });
          const result = await withTaskBilling(id, user.id, ["agent", "text", "image", "video", "audio"].includes(options.kind), () => operation(signal));
          signal.throwIfAborted();
          await finish("completed");
          resolve(result);
        } catch (error) {
          await finish(signal.aborted ? "cancelled" : "failed");
          reject(error);
        }
      }));
    } };
    active.set(id, task);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
    else schedule();
  });
}

export function recordTaskUsage(usage: unknown) {
  const task = context.getStore();
  if (!isMultiUser() || !task) return;
  // ACT: 只接受数值用量，拒绝把 SDK 对象中的 API Key、消息或可用令牌写入记录。
  const data = typeof usage === "number" && Number.isFinite(usage) ? { total: usage }
    : usage && typeof usage === "object" && !Array.isArray(usage)
      ? Object.fromEntries(Object.entries(usage).filter(([key, value]) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key)
        && !/key|secret|password|authorization|cookie|credential|access.?token|refresh.?token|session|verification/i.test(key)
        && typeof value === "number" && Number.isFinite(value))) : {};
  database().query("UPDATE hostedTasks SET usage=? WHERE id=?").run(JSON.stringify(data), task.id);
}

export function recordTaskUpstreamJob(job: Omit<UpstreamJob, "id" | "checkedAt" | "reconciliation"> & { id?: string }) {
  const task = context.getStore();
  if (!isMultiUser() || !task) return;
  if (!/^[a-zA-Z0-9._-]{1,96}$/.test(job.provider) || (job.id !== undefined && !/^[a-zA-Z0-9._:-]{1,256}$/.test(job.id))) return;
  const status = job.status && /^[a-zA-Z0-9_-]{1,64}$/.test(job.status) ? job.status : undefined;
  const db = database();
  const previous = db.query<{ upstreamJob: string | null }, [string]>("SELECT upstreamJob FROM hostedTasks WHERE id=?").get(task.id)?.upstreamJob;
  const jobs: UpstreamJob[] = previous ? JSON.parse(previous) : [];
  const existing = job.id ? jobs.find(item => item.provider === job.provider && item.id === job.id) : jobs.findLast(item => item.provider === job.provider);
  if (existing) {
    if (status) existing.status = status;
    if (job.mediaType) existing.mediaType = job.mediaType;
    if (job.protocol) existing.protocol = job.protocol;
  }
  else if (job.id) jobs.push({ provider: job.provider, id: job.id, status, mediaType: job.mediaType, protocol: job.protocol });
  else return;
  db.query("UPDATE hostedTasks SET upstreamJob=? WHERE id=?").run(JSON.stringify(jobs), task.id);
}

export function listTasks(userId?: string) {
  if (!isMultiUser()) return [];
  const user = requireUser();
  if (user.role !== "admin" && userId && userId !== user.id) throw Object.assign(new Error("不能读取其他账户的任务"), { status: 403 });
  const owner = userId ?? user.id;
  const rows = database().query<TaskRecord, [string]>("SELECT * FROM hostedTasks WHERE userId=? ORDER BY createdAt DESC LIMIT 100").all(owner);
  return rows.map(task => ({ ...task, usage: task.usage ? JSON.parse(task.usage) : null, upstreamJob: task.upstreamJob ? JSON.parse(task.upstreamJob) : null, billing: taskBilling(task.id) }));
}

export function getTask(id: string) {
  if (!isMultiUser()) return null;
  return database().query<TaskRecord, [string, string]>("SELECT * FROM hostedTasks WHERE id=? AND userId=?").get(id, requireUser().id);
}

export function cancelTask(id: string) {
  if (!isMultiUser()) return;
  const user = requireUser();
  const record = database().query<{ userId: string }, [string]>("SELECT userId FROM hostedTasks WHERE id=?").get(id);
  if (!record || record.userId !== user.id) throw Object.assign(new Error("任务不存在"), { status: 404 });
  active.get(id)?.controller.abort(new Error("任务已取消"));
}
