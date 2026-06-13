import db from "@/utils/db";

/**
 * 持久化生成任务队列调度器
 *
 * - 任务持久化在 o_genQueue 表，软件重启后由 fixDB 将「执行中」重置为「排队中」，
 *   再由 recoverQueue() 恢复调度
 * - 按 vendor 维度限制并发（o_setting.vendorConcurrency 可配置，JSON 格式：
 *   {"default": 5, "volcengine": 3}），替代散落各路由的 pLimit
 * - 失败自动重试（retryCount < maxRetry），超限标记为「失败」，可通过 retryQueueJob 手动重排
 */

export type QueueKind = "assetImage" | "storyboardImage" | "composeVideo" | "mergeEpisode" | "gridImage";

export interface QueueJob {
  id: number;
  projectId: number | null;
  kind: string;
  payload: string;
  vendorId: string | null;
  priority: number;
  retryCount: number;
  maxRetry: number;
}

type Handler = (payload: any, job: QueueJob) => Promise<void>;

const QUEUE_STATE = {
  queued: "排队中",
  running: "执行中",
  done: "已完成",
  failed: "失败",
} as const;

const DEFAULT_VENDOR_CONCURRENCY = 5;
const DEFAULT_MAX_RETRY = 2;
const DEFAULT_PROJECT_QUEUE_LIMIT = 200;

const handlers = new Map<string, Handler>();
const runningByVendor = new Map<string, number>();
// 进程内等待句柄：让同步路由可以 await 任务完成（重启恢复的任务没有等待者，属正常情况）
const waiters = new Map<number, { resolve: () => void; reject: (e: Error) => void }>();

let dispatching = false;

export function registerQueueHandler(kind: QueueKind, fn: Handler): void {
  handlers.set(kind, fn);
}

interface EnqueueOptions {
  projectId: number;
  kind: QueueKind;
  payload: Record<string, unknown>;
  vendorId: string;
  priority?: number;
  maxRetry?: number;
}

/** 入队并返回任务 id 与完成 Promise（done 仅在当前进程内有效） */
export async function enqueueJob(options: EnqueueOptions): Promise<{ id: number; done: Promise<void> }> {
  const now = Date.now();
  await assertProjectQueueCapacity(options.projectId);
  const [id] = await db("o_genQueue").insert({
    projectId: options.projectId,
    kind: options.kind,
    payload: JSON.stringify(options.payload),
    vendorId: options.vendorId,
    priority: options.priority ?? 0,
    state: QUEUE_STATE.queued,
    retryCount: 0,
    maxRetry: options.maxRetry ?? DEFAULT_MAX_RETRY,
    createTime: now,
    updateTime: now,
  });
  const done = new Promise<void>((resolve, reject) => {
    waiters.set(id, { resolve, reject });
  });
  // 避免未 await done 的调用方触发 unhandledRejection
  done.catch(() => {});
  void dispatch();
  return { id, done };
}

async function assertProjectQueueCapacity(projectId: number): Promise<void> {
  const configured = Number(process.env.GEN_QUEUE_PROJECT_LIMIT);
  const limit = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_PROJECT_QUEUE_LIMIT;
  const rows = await db("o_genQueue")
    .where("projectId", projectId)
    .whereIn("state", [QUEUE_STATE.queued, QUEUE_STATE.running])
    .count<{ c: number }[]>("id as c");
  const count = Number(rows[0]?.c ?? 0);
  if (count >= limit) {
    throw new Error(`当前项目生成队列已达上限（${limit}），请等待已有任务完成后再试`);
  }
}

/** 启动时恢复排队中的任务（fixDB 已将「执行中」重置为「排队中」） */
export async function recoverQueue(): Promise<void> {
  const pending = await db("o_genQueue").where("state", QUEUE_STATE.queued).count<{ c: number }[]>("id as c");
  const count = Number(pending[0]?.c ?? 0);
  if (count > 0) console.log(`[生成队列] 恢复 ${count} 个未完成任务`);
  void dispatch();
}

/** 手动重排失败任务 */
export async function retryQueueJob(id: number): Promise<boolean> {
  const changed = await db("o_genQueue").where("id", id).where("state", QUEUE_STATE.failed).update({
    state: QUEUE_STATE.queued,
    retryCount: 0,
    errorReason: null,
    updateTime: Date.now(),
  });
  if (changed > 0) void dispatch();
  return changed > 0;
}

async function getVendorLimit(vendorId: string): Promise<number> {
  try {
    const setting = await db("o_setting").where("key", "vendorConcurrency").first();
    if (!setting?.value) return DEFAULT_VENDOR_CONCURRENCY;
    const config = JSON.parse(setting.value) as Record<string, number>;
    const limit = config[vendorId] ?? config["default"];
    return typeof limit === "number" && limit >= 1 ? limit : DEFAULT_VENDOR_CONCURRENCY;
  } catch {
    return DEFAULT_VENDOR_CONCURRENCY;
  }
}

async function dispatch(): Promise<void> {
  if (dispatching) return;
  dispatching = true;
  try {
    // 反复扫描，直到没有可启动的任务
    let started = true;
    while (started) {
      started = false;
      const queued = await db("o_genQueue")
        .where("state", QUEUE_STATE.queued)
        .orderBy([
          { column: "priority", order: "desc" },
          { column: "id", order: "asc" },
        ])
        .limit(50)
        .select("*");

      for (const job of queued) {
        const vendorId = job.vendorId ?? "default";
        const running = runningByVendor.get(vendorId) ?? 0;
        const limit = await getVendorLimit(vendorId);
        if (running >= limit) continue;
        if (!handlers.has(job.kind ?? "")) continue;

        // 乐观锁占用，防止重复启动
        const claimed = await db("o_genQueue").where("id", job.id).where("state", QUEUE_STATE.queued).update({
          state: QUEUE_STATE.running,
          updateTime: Date.now(),
        });
        if (claimed === 0) continue;

        runningByVendor.set(vendorId, running + 1);
        started = true;
        void runJob(job as QueueJob, vendorId);
      }
    }
  } finally {
    dispatching = false;
  }
}

async function runJob(job: QueueJob, vendorId: string): Promise<void> {
  const handler = handlers.get(job.kind)!;
  try {
    const payload = JSON.parse(job.payload ?? "{}");
    await handler(payload, job);
    await db("o_genQueue").where("id", job.id).update({
      state: QUEUE_STATE.done,
      errorReason: null,
      updateTime: Date.now(),
    });
    waiters.get(job.id)?.resolve();
    waiters.delete(job.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const retryCount = (job.retryCount ?? 0) + 1;
    if (retryCount <= (job.maxRetry ?? DEFAULT_MAX_RETRY)) {
      console.warn(`[生成队列] 任务 ${job.id} 失败，自动重试 ${retryCount}/${job.maxRetry}：${message}`);
      await db("o_genQueue").where("id", job.id).update({
        state: QUEUE_STATE.queued,
        retryCount,
        errorReason: message,
        updateTime: Date.now(),
      });
    } else {
      console.error(`[生成队列] 任务 ${job.id} 重试超限，标记失败：${message}`);
      await db("o_genQueue").where("id", job.id).update({
        state: QUEUE_STATE.failed,
        retryCount,
        errorReason: message,
        updateTime: Date.now(),
      });
      waiters.get(job.id)?.reject(new Error(message));
      waiters.delete(job.id);
    }
  } finally {
    const running = runningByVendor.get(vendorId) ?? 1;
    runningByVendor.set(vendorId, Math.max(0, running - 1));
    void dispatch();
  }
}
