import u from "@/utils";
import { db as knexDb } from "@/utils/db";
import type { o_sr_job } from "@/types/database";

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const SrJobTypes = [
  "analyzer",
  "vision",
  "buildIr",
  "assetGap",
  "shotAdaptation",
  "modelRouting",
  "regenerateStoryboard",
  "checkConsistency",
  "pushToProduction",
] as const;

export type SrJobType = (typeof SrJobTypes)[number];
export type SrJobStatus = "queued" | "running" | "succeeded" | "failed";

export interface SrJobProgressUpdate {
  progress?: number;
  stage?: string;
  result?: JsonValue;
}

export type SrJobProgressReporter = (update: SrJobProgressUpdate) => Promise<void>;

function stringifyJson(data: JsonValue | undefined): string | null {
  if (data === undefined) return null;
  return typeof data === "string" ? data : JSON.stringify(data);
}

function parseJsonValue(data: string | null | undefined): unknown {
  if (!data) return undefined;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function clampProgress(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const recoveryColumns = [
  ["lockedBy", "text"],
  ["lockedAt", "integer"],
  ["nextRunAt", "integer"],
  ["recoverable", "integer"],
  ["cancelRequested", "integer"],
] as const;

let recoveryColumnsReady = false;

async function ensureSrJobRecoveryColumns(): Promise<void> {
  if (recoveryColumnsReady) return;
  const tableInfo = (await knexDb.raw("PRAGMA table_info(o_sr_job)")) as { name: string }[];
  if (!tableInfo.length) return;
  const existingColumns = new Set(tableInfo.map((column) => column.name));
  for (const [column, type] of recoveryColumns) {
    if (existingColumns.has(column)) continue;
    try {
      await knexDb.raw(`ALTER TABLE o_sr_job ADD COLUMN ${column} ${type}`);
    } catch (error) {
      if (!String(error).includes("duplicate column")) throw error;
    }
  }
  recoveryColumnsReady = true;
}

async function nextAttempt(taskId: number, jobType: SrJobType): Promise<number> {
  const latest = await u.db("o_sr_job").where({ taskId, jobType }).orderBy("attempt", "desc").first();
  return (Number(latest?.attempt) || 0) + 1;
}

export function serializeSrJob(job: o_sr_job | undefined): (o_sr_job & { input?: unknown; result?: unknown }) | undefined {
  if (!job) return undefined;
  return {
    ...job,
    input: parseJsonValue(job.inputJson),
    result: parseJsonValue(job.resultJson),
  };
}

export async function createSrJob(input: {
  taskId: number;
  jobType: SrJobType;
  input?: JsonValue;
  parentJobId?: number | null;
  stage?: string;
  recoverable?: boolean;
  nextRunAt?: number | null;
}): Promise<o_sr_job> {
  await ensureSrJobRecoveryColumns();
  const now = Date.now();
  const [id] = await u.db("o_sr_job").insert({
    taskId: input.taskId,
    jobType: input.jobType,
    status: "queued",
    progress: 0,
    stage: input.stage || "queued",
    inputJson: stringifyJson(input.input),
    resultJson: null,
    errorReason: null,
    attempt: await nextAttempt(input.taskId, input.jobType),
    parentJobId: input.parentJobId ?? null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
    lockedBy: null,
    lockedAt: null,
    nextRunAt: input.nextRunAt ?? now,
    recoverable: input.recoverable === false ? 0 : 1,
    cancelRequested: 0,
  });
  return (await u.db("o_sr_job").where("id", Number(id)).first())!;
}

export async function getActiveSrJob(taskId: number, jobType?: SrJobType): Promise<o_sr_job | undefined> {
  const query = u.db("o_sr_job").where("taskId", taskId).whereIn("status", ["queued", "running"]);
  if (jobType) query.andWhere("jobType", jobType);
  return await query.orderBy("id", "desc").first();
}

export async function listSrJobs(taskId: number, limit = 20): Promise<o_sr_job[]> {
  return await u.db("o_sr_job").where("taskId", taskId).orderBy("id", "desc").limit(limit);
}

export async function getSrJob(jobId: number): Promise<o_sr_job | undefined> {
  return await u.db("o_sr_job").where("id", jobId).first();
}

export async function startSrJob(jobId: number, stage = "running"): Promise<o_sr_job> {
  await ensureSrJobRecoveryColumns();
  const now = Date.now();
  await u.db("o_sr_job").where("id", jobId).update({
    status: "running",
    progress: 1,
    stage,
    errorReason: null,
    startedAt: now,
    updatedAt: now,
    lockedBy: process.pid ? `pid:${process.pid}` : "local",
    lockedAt: now,
  });
  return (await u.db("o_sr_job").where("id", jobId).first())!;
}

export async function updateSrJob(jobId: number, update: SrJobProgressUpdate): Promise<o_sr_job> {
  const patch: Partial<o_sr_job> = {
    updatedAt: Date.now(),
  };
  const progress = clampProgress(update.progress);
  if (progress !== undefined) patch.progress = progress;
  if (update.stage !== undefined) patch.stage = update.stage;
  if (update.result !== undefined) patch.resultJson = stringifyJson(update.result);
  await u.db("o_sr_job").where("id", jobId).update(patch);
  return (await u.db("o_sr_job").where("id", jobId).first())!;
}

export async function finishSrJob(jobId: number, result?: JsonValue): Promise<o_sr_job> {
  await ensureSrJobRecoveryColumns();
  const now = Date.now();
  await u.db("o_sr_job").where("id", jobId).update({
    status: "succeeded",
    progress: 100,
    stage: "succeeded",
    resultJson: stringifyJson(result),
    errorReason: null,
    finishedAt: now,
    updatedAt: now,
    lockedBy: null,
    lockedAt: null,
  });
  return (await u.db("o_sr_job").where("id", jobId).first())!;
}

export async function failSrJob(jobId: number, errorReason: string): Promise<o_sr_job> {
  await ensureSrJobRecoveryColumns();
  const now = Date.now();
  await u.db("o_sr_job").where("id", jobId).update({
    status: "failed",
    stage: "failed",
    errorReason,
    finishedAt: now,
    updatedAt: now,
    lockedBy: null,
    lockedAt: null,
  });
  return (await u.db("o_sr_job").where("id", jobId).first())!;
}

export async function requestCancelSrJob(jobId: number): Promise<o_sr_job> {
  await ensureSrJobRecoveryColumns();
  await u.db("o_sr_job").where("id", jobId).update({ cancelRequested: 1, updatedAt: Date.now() });
  return (await u.db("o_sr_job").where("id", jobId).first())!;
}

export async function recoverStaleSrJobs(options: { staleAfterMs?: number; now?: number } = {}) {
  await ensureSrJobRecoveryColumns();
  const now = options.now ?? Date.now();
  const staleBefore = now - (options.staleAfterMs ?? 10 * 60 * 1000);
  const staleJobs = (await u
    .db("o_sr_job")
    .whereIn("status", ["queued", "running"])
    .andWhere((builder) => {
      builder.whereNull("lockedAt").orWhere("lockedAt", "<", staleBefore).orWhere("updatedAt", "<", staleBefore);
    })
    .orderBy("id", "asc")) as o_sr_job[];

  let recovered = 0;
  let failed = 0;
  for (const job of staleJobs) {
    const recoverable = job.recoverable !== 0;
    if (recoverable) {
      await u
        .db("o_sr_job")
        .where("id", job.id)
        .update({
          status: "queued",
          stage: "recovered_after_restart",
          progress: 0,
          lockedBy: null,
          lockedAt: null,
          nextRunAt: now,
          errorReason: null,
          updatedAt: now,
        });
      recovered += 1;
    } else {
      await u
        .db("o_sr_job")
        .where("id", job.id)
        .update({
          status: "failed",
          stage: "failed",
          errorReason: "Job was interrupted and is not recoverable",
          lockedBy: null,
          lockedAt: null,
          finishedAt: now,
          updatedAt: now,
        });
      failed += 1;
    }
  }
  return { scanned: staleJobs.length, recovered, failed };
}

export async function runSrJob<T extends JsonValue>(
  jobId: number,
  runner: (report: SrJobProgressReporter) => Promise<T>,
  stage = "running",
): Promise<T> {
  await startSrJob(jobId, stage);
  const report: SrJobProgressReporter = async (update) => {
    await updateSrJob(jobId, update);
  };

  try {
    const result = await runner(report);
    await finishSrJob(jobId, result);
    return result;
  } catch (error) {
    await failSrJob(jobId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export function runSrJobInBackground<T extends JsonValue>(
  job: o_sr_job,
  runner: (report: SrJobProgressReporter) => Promise<T>,
  stage = "running",
  onSettled?: (error: unknown | null) => void | Promise<void>,
): void {
  const jobId = Number(job.id);
  setImmediate(() => {
    runSrJob(jobId, runner, stage)
      .then(async () => {
        await onSettled?.(null);
      })
      .catch(async (error) => {
        console.error(`[structuralReplica:job:${job.jobType}]`, error);
        await onSettled?.(error);
      });
  });
}
