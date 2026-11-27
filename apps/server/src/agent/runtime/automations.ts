import { readFileSync, realpath, writeAtomicSync } from "@toonflow/file";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { z } from "zod";
import { automationCommandSchema, automationSchema, nextScheduleAt } from "@/agent/runtime/schedule";
import { createAgentConversation, getActiveAgentSession, getAgentSession } from "@/agent/runtime/sessions";
import { getAgentModelConfiguration } from "@/agent/runtime/model";
import type { AgentAutomation, AgentAutomationCommand, AgentAutomationRun } from "@/agent/runtime/types";
import conf from "@/utils/conf";
import { isEnabled } from "@/utils/multiTenant/mode";
import { resolveWorkspacePath } from "@/utils/workspace/files";

type StoredTask = { directory: string; task: AgentAutomation; manual?: boolean };
const storeSchema = z.array(z.strictObject({ directory: z.string().refine(isAbsolute), task: automationSchema, manual: z.boolean().optional() }));
const storeFile = resolve(dirname(conf.path), "agentAutomations.json");
let records: StoredTask[] | undefined;
let started = false;
let startupFailure: unknown;
let timer: ReturnType<typeof setTimeout> | undefined;
let unwatch: (() => void) | undefined;
const activeRuns = new Map<string, { controller: AbortController; finished: Promise<void> }>();
const retryAt = new Map<string, number>();

function readStore(): StoredTask[] {
  if (records) return records;
  try { return records = storeSchema.parse(JSON.parse(readFileSync(storeFile, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return records = [];
    throw error;
  }
}

function saveStore(next: StoredTask[]) {
  // ACT: 独立服务单进程，同步提交认领与下一次时间，防止重启后重复投递同一次模型请求。
  writeAtomicSync(storeFile, JSON.stringify(next), { mode: 0o600 });
  records = next;
  armTimer();
}

function replaceTask(id: string, replacement?: StoredTask) {
  saveStore(readStore().flatMap(record => record.task.id !== id ? [record] : replacement ? [replacement] : []));
}

function requireIndependentMode() {
  if (isEnabled()) throw Object.assign(new Error("多租户模式下暂不支持后台自动化任务"), { status: 403 });
  if (startupFailure) throw startupFailure;
}

export function listAutomations(cwd: string) {
  requireIndependentMode();
  return readStore().filter(record => !relative(cwd, record.directory)).map(({ task, manual }) => ({
    ...task, queued: manual,
    runs: task.runs.map(run => run.error && /^No API key (?:found for |for provider: )/.test(run.error)
      ? { ...run, error: "请在文本模型设置中为此供应商配置 API Key 或鉴权请求头，然后重试。" } : run),
  }));
}

export async function updateAutomation(cwd: string, command: AgentAutomationCommand) {
  requireIndependentMode();
  command = automationCommandSchema.parse(command);
  if (command.action === "save") {
    const { providerId, modelId, thinkingLevel, sessionFile } = command.task;
    await getAgentModelConfiguration(providerId, modelId, thinkingLevel);
    if (sessionFile) {
      const { path } = await resolveWorkspacePath(cwd, `.agent/sessions/${sessionFile}`);
      if ((await getAgentSession(cwd, path)).parentFile) throw Object.assign(new Error("请在主对话中使用此命令"), { status: 400 });
    }
  }
  requireIndependentMode();
  const now = Date.now();
  const existing = readStore().find(record => record.task.id === command.id && !relative(cwd, record.directory));
  if (command.id && (!existing || existing.task.revision !== command.revision)) {
    throw Object.assign(new Error("任务已变更，请刷新后重试"), { status: 409 });
  }
  if (existing?.task.cancelledAt && command.action !== "delete" && command.action !== "cancel") {
    throw Object.assign(new Error("已取消"), { status: 409 });
  }
  if (command.action === "save") {
    const previous = existing?.task;
    const createdAt = previous?.createdAt ?? now;
    const nextRunAt = nextScheduleAt(command.task.schedule, now, createdAt);
    if (nextRunAt === null) throw Object.assign(new Error("请选择未来的执行时间"), { status: 400 });
    const enabled = previous?.enabled !== false || previous.schedule.kind === "once" && previous.schedule.at <= now;
    const task: AgentAutomation = { ...command.task, id: previous?.id ?? crypto.randomUUID(), createdAt, revision: (previous?.revision ?? 0) + 1,
      runs: previous?.runs ?? [], enabled, nextRunAt: enabled ? nextRunAt : null };
    if (existing) replaceTask(task.id, { ...existing, task });
    else saveStore([...readStore(), { directory: cwd, task }]);
  } else {
    if (!existing) throw Object.assign(new Error("任务不存在"), { status: 404 });
    const task = existing.task;
    if ((command.action === "run" || command.action === "delete") && task.runs[0]?.status === "running") {
      throw Object.assign(new Error("任务正在运行，请稍后重试"), { status: 409 });
    }
    if (command.action === "cancel") {
      if (!task.cancelledAt) {
        if (task.schedule.kind === "once" && !task.enabled && !existing.manual && task.schedule.at <= now
          && task.runs.length && task.runs[0]!.status !== "running") {
          throw Object.assign(new Error("任务已变更，请刷新后重试"), { status: 409 });
        }
        replaceTask(task.id, { directory: cwd, task: { ...task, revision: task.revision + 1, enabled: false, nextRunAt: null, cancelledAt: now } });
        retryAt.delete(task.id);
      }
      const active = activeRuns.get(task.id);
      if (active) {
        active.controller.abort(new DOMException("已取消", "AbortError"));
        await active.finished;
      }
    } else if (command.action === "delete") {
      replaceTask(task.id);
      retryAt.delete(task.id);
    } else if (command.action === "run") {
      const latest = task.runs[0];
      if (command.retryRunId && (latest?.id !== command.retryRunId || (latest.status !== "failed" && latest.status !== "interrupted"))) {
        throw Object.assign(new Error("任务已变更，请刷新后重试"), { status: 409 });
      }
      if (!existing.manual) replaceTask(task.id, { ...existing, task: { ...task, revision: task.revision + 1 }, manual: true });
    } else {
      const enabled = command.action === "resume";
      const nextRunAt = enabled ? nextScheduleAt(task.schedule, now, task.createdAt) : null;
      if (enabled && nextRunAt === null) throw Object.assign(new Error("请选择未来的执行时间"), { status: 400 });
      replaceTask(task.id, { directory: cwd, task: { ...task, revision: task.revision + 1, enabled, nextRunAt } });
    }
  }
  return listAutomations(cwd);
}

function dueAt(record: StoredTask) {
  if (record.task.cancelledAt || record.task.runs[0]?.status === "running") return Infinity;
  const due = record.manual ? 0 : record.task.enabled ? record.task.nextRunAt ?? Infinity : Infinity;
  return Math.max(due, retryAt.get(record.task.id) ?? 0);
}

function armTimer() {
  clearTimeout(timer);
  if (!started || startupFailure || isEnabled()) return;
  let due = Infinity;
  for (const record of readStore()) due = Math.min(due, dueAt(record));
  // ACT: 至多每分钟校正一次系统时钟；无到期任务时不轮询。
  if (Number.isFinite(due)) timer = setTimeout(tick, Math.min(60000, Math.max(0, due - Date.now()))).unref();
}

function tick() {
  if (!started || isEnabled()) return;
  const now = Date.now();
  for (const record of readStore()) {
    if (dueAt(record) > now) continue;
    const { task, directory } = record;
    // 同一个事件循环中首次投递可能仍在准备 SDK，会话锁竞争也会在 run 内返回 EBUSY。
    if (task.sessionFile && getActiveAgentSession(resolve(directory, ".agent/sessions", task.sessionFile))) {
      retryAt.set(task.id, now + 3000);
      continue;
    }
    try { launch(record, now); }
    catch (error) {
      retryAt.set(task.id, now + 10000);
      console.error("自动化任务调度失败", error);
    }
  }
  armTimer();
}

function launch(record: StoredTask, now: number) {
  const { task, directory } = record;
  const run: AgentAutomationRun = { id: crypto.randomUUID(), startedAt: now, status: "running", sessionFile: task.sessionFile };
  const scheduled = task.enabled && task.nextRunAt !== null && task.nextRunAt <= now;
  const nextRunAt = scheduled ? nextScheduleAt(task.schedule, now, task.createdAt) : task.nextRunAt;
  replaceTask(task.id, { directory, task: { ...task, enabled: task.enabled && nextRunAt !== null, nextRunAt,
    runs: [run, ...task.runs].slice(0, 30) } });
  retryAt.delete(task.id);
  const controller = new AbortController();
  const finished = execute(record, run, controller).catch(error => console.error("保存自动化运行状态失败", error))
    .finally(() => { activeRuns.delete(task.id); armTimer(); });
  activeRuns.set(task.id, { controller, finished });
}

async function execute(record: StoredTask, run: AgentAutomationRun, controller: AbortController) {
  const { task, directory } = record;
  const { signal } = controller;
  const result = { ...run };
  let accepted = false;
  try {
    if (relative(directory, await realpath(directory))) throw new Error("工作目录已变更，请重新选择文件夹");
    const { run: runAgent } = await import("@/agent/runtime");
    requireIndependentMode();
    signal.throwIfAborted();
    if (!task.sessionFile) {
      result.sessionFile = (await createAgentConversation(directory)).file;
      const latest = readStore().find(item => item.task.id === task.id)!;
      replaceTask(task.id, { ...latest, task: { ...latest.task, runs: [{ ...result }, ...latest.task.runs.slice(1)] } });
    }
    signal.throwIfAborted();
    await runAgent({ cwd: directory, prompt: task.prompt, providerId: task.providerId, modelId: task.modelId,
      thinkingLevel: task.thinkingLevel, sessionFile: result.sessionFile, scheduled: { taskId: task.id, runId: run.id, name: task.name }, signal,
      onCancel: () => controller.abort(new Error("已停止生成")),
    }, event => { if (event.type === "session") accepted = true; });
    signal.throwIfAborted();
    result.status = "completed";
  } catch (error) {
    if (!accepted && task.sessionFile && (error as NodeJS.ErrnoException).code === "EBUSY" && !signal.aborted) {
      retryAt.set(task.id, Date.now() + 3000);
      const latest = readStore().find(item => item.task.id === task.id)!;
      if (latest.task.revision === task.revision) replaceTask(task.id, record);
      else replaceTask(task.id, { ...latest, task: { ...latest.task, runs: latest.task.runs.slice(1) } });
      return;
    }
    result.status = signal.aborted ? (readStore().find(item => item.task.id === task.id)?.task.cancelledAt ? "cancelled" : "interrupted") : "failed";
    if (result.status !== "cancelled") result.error = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
  }
  result.finishedAt = Date.now();
  const latest = readStore().find(item => item.task.id === task.id)!;
  const nextRunAt = latest.task.revision === task.revision && latest.task.schedule.kind !== "once" && latest.task.enabled
    && latest.task.nextRunAt !== null && latest.task.nextRunAt <= result.finishedAt
    ? nextScheduleAt(latest.task.schedule, result.finishedAt, latest.task.createdAt) : latest.task.nextRunAt;
  replaceTask(task.id, { ...latest, task: { ...latest.task, nextRunAt, enabled: latest.task.enabled && nextRunAt !== null,
    runs: [result, ...latest.task.runs.slice(1)] } });
}

function restoreSchedule() {
  try {
    const all = readStore();
    if (all.some(record => record.task.runs[0]?.status === "running" && !activeRuns.has(record.task.id))) {
      saveStore(all.map(record => {
        const [run, ...rest] = record.task.runs;
        if (run?.status !== "running" || activeRuns.has(record.task.id)) return record;
        return { ...record, task: { ...record.task, runs: [{ ...run, finishedAt: Date.now(), status: record.task.cancelledAt ? "cancelled" : "interrupted" }, ...rest] } };
      }));
    }
  } catch (error) {
    startupFailure = error;
    console.error("自动化任务调度失败", error);
    return;
  }
  startupFailure = undefined;
  armTimer();
}

export function startAutomations() {
  if (started) return;
  started = true;
  unwatch = conf.onDidChange("settings.multiTenantEnabled", () => {
    if (!isEnabled()) return restoreSchedule();
    clearTimeout(timer);
    for (const run of activeRuns.values()) run.controller.abort(new Error("多租户模式下暂不支持后台自动化任务"));
  });
  if (!isEnabled()) restoreSchedule();
}

export async function stopAutomations() {
  started = false;
  clearTimeout(timer);
  unwatch?.();
  unwatch = undefined;
  const running = [...activeRuns.values()];
  for (const run of running) run.controller.abort(new Error("上次运行已中断"));
  await Promise.all(running.map(run => run.finished));
}
