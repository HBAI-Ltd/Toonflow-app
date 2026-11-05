import { getDatabase } from "@/utils/accounts/database";
import { getUser } from "@/utils/accounts/service";
import { isMultiUser, runWithUser } from "@/utils/accounts/context";
import conf from "@/utils/conf";
import { getMediaProvider, loadMediaProviderSource } from "@/utils/media/provider";
import { initializeTaskQueue, type UpstreamJob } from "@/utils/hosting/tasks";

let reconciliation: Promise<void> | undefined;
const knownStatuses = new Set(["queued", "pending", "running", "processing", "submitted", "success", "succeeded", "completed",
  "failed", "failure", "error", "rejected", "cancelled", "canceled", "blocked", "moderating", "waiting", "created", "inprogress",
  "not_started", "starting", "rendering", "finished", "unknown"]);

async function reconcile() {
  initializeTaskQueue();
  const db = getDatabase();
  const tasks = db.query<{ id: string; userId: string; kind: string; model: string | null; upstreamJob: string }, []>(
    "SELECT id,userId,kind,model,upstreamJob FROM hostedTasks WHERE status='interrupted' AND upstreamJob IS NOT NULL ORDER BY createdAt",
  ).all();
  // ACT: 每个进程启动只读核对一次、逐任务执行；没有重提或后台生成操作。
  for (const task of tasks) {
    let jobs: UpstreamJob[];
    try { jobs = JSON.parse(task.upstreamJob); }
    catch { continue; }
    if (!Array.isArray(jobs)) continue;
    for (const job of jobs) {
      if (!job || typeof job !== "object") continue;
      job.status = "unknown";
      job.checkedAt = Date.now();
      job.reconciliation = "accountDisabled";
      const owner = getUser(task.userId);
      if (!owner?.enabled) continue;
      if (typeof job.provider !== "string" || typeof job.id !== "string"
        || !/^[a-z][a-zA-Z0-9]{0,95}$/.test(job.provider) || !/^[a-zA-Z0-9._:-]{1,256}$/.test(job.id)) {
        job.reconciliation = "invalidTaskMetadata";
        continue;
      }
      await runWithUser(owner, async () => {
        const timeout = AbortSignal.timeout(10000);
        try {
          const info = await getMediaProvider(job.provider);
          const configs = conf.get("settings", {}).mediaProviderConfigs;
          const config = configs && typeof configs === "object" && !Array.isArray(configs) ? (configs as Record<string, unknown>)[job.provider] : {};
          let requests = 0;
          const readOnlyFetch = Object.assign((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
            timeout.throwIfAborted();
            if (++requests > 1) throw new Error("状态核对只允许单次只读请求");
            const url = new URL(String(input instanceof Request ? input.url : input));
            const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
            const statusPost = job.provider === "tfRouter" && method === "POST" && url.origin === "https://api.toonflow.net"
              && /^\/v1\/(?:image\/getImageStatus|video\/getVideoStatus|tts\/getAudioStatus)$/.test(url.pathname);
            if (method !== "GET" && method !== "HEAD" && !statusPost) throw new Error("状态核对禁止提交生成请求");
            if (statusPost) {
              const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
              if (!body || Object.keys(body).length !== 1 || body.taskICode !== job.id) throw new Error("状态核对参数无效");
            }
            return fetch(input, { ...init, signal: timeout, redirect: "error" });
          }, { preconnect: fetch.preconnect }) as typeof fetch;
          const provider = await loadMediaProviderSource(info.source,
            config && typeof config === "object" && !Array.isArray(config) ? config as Record<string, unknown> : {}, timeout, readOnlyFetch);
          if (!provider.queryTaskStatus) { job.reconciliation = "noStatusCapability"; return; }
          const mediaType = job.mediaType ?? (task.kind === "image" || task.kind === "video" || task.kind === "audio" ? task.kind : undefined);
          const deadline = Promise.withResolvers<never>();
          const expire = () => deadline.reject(timeout.reason);
          timeout.addEventListener("abort", expire, { once: true });
          try {
            const result = await Promise.race([provider.queryTaskStatus(job.id, {
              mediaType, model: mediaType ? task.model ?? undefined : undefined, protocol: job.protocol,
            }), deadline.promise]);
            const status = typeof result.status === "string" ? result.status.toLowerCase() : "unknown";
            job.status = knownStatuses.has(status) ? status : "unknown";
            job.reconciliation = result.reason === "missingMediaType" || result.reason === "missingProtocol" ? result.reason
              : job.status === "unknown" ? "unknownStatus" : "checked";
          } finally { timeout.removeEventListener("abort", expire); }
        } catch {
          // 不保存上游错误正文、URL、配置或密钥；仅记录固定核对结果。
          job.reconciliation = timeout.aborted ? "timeout" : "queryFailed";
        }
      });
      job.checkedAt = Date.now();
    }
    db.query("UPDATE hostedTasks SET upstreamJob=? WHERE id=? AND status='interrupted'").run(JSON.stringify(jobs), task.id);
  }
}

export function reconcileInterruptedTasks() {
  if (!isMultiUser()) return Promise.resolve();
  return reconciliation ??= reconcile();
}
