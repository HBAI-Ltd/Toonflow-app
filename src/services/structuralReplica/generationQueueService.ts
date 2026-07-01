import fs from "node:fs/promises";
import path from "node:path";
import u from "@/utils";
import type { o_sr_generation_candidate, o_sr_generation_cost, o_sr_generation_job } from "@/types/database";
import { buildShotControlPackage } from "./shotControlPackageService";
import { GenerationCandidateSchema, type GenerationCandidate, type ShotControlPackage } from "./schemas";
import { getTaskBundle } from "./repository";
import { StructuralIrSchema } from "./schemas";
import type { ReferenceList } from "@/utils/ai";

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface GenerationRunnerInput {
  package: ShotControlPackage;
  candidateIndex: number;
  outputPath: string;
}

export interface GenerationRunnerResult {
  videoPath: string;
  thumbnailPath?: string | null;
  durationSec?: number | null;
  qualityScore?: number | null;
  metadata?: Record<string, unknown>;
  estimatedCost?: number;
}

export type GenerationRunner = (input: GenerationRunnerInput) => Promise<GenerationRunnerResult>;

function stringifyJson(data: JsonValue | undefined): string | null {
  if (data === undefined) return null;
  return typeof data === "string" ? data : JSON.stringify(data);
}

function parseJson<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function requestSizeBytes(data: unknown): number {
  return Buffer.byteLength(JSON.stringify(data), "utf8");
}

async function referenceListForPackage(pkg: ShotControlPackage): Promise<ReferenceList[]> {
  const refs: ReferenceList[] = [];
  for (const item of pkg.referenceList) {
    if (item.type === "image") refs.push({ type: "image", base64: await u.oss.getImageBase64(item.path) });
    if (item.type === "audio") refs.push({ type: "audio", base64: await u.oss.getImageBase64(item.path) });
    if (item.type === "video") refs.push({ type: "video", base64: await u.oss.getImageBase64(item.path) });
  }
  return refs;
}

async function defaultGenerationRunner(input: GenerationRunnerInput): Promise<GenerationRunnerResult> {
  const pkg = input.package;
  const modelKey = `${pkg.providerId}:${pkg.model}` as `${string}:${string}`;
  const aiVideo = u.Ai.Video(modelKey);
  await aiVideo.run(
    {
      prompt: pkg.prompt,
      referenceList: await referenceListForPackage(pkg),
      mode: pkg.referenceList.length ? ["singleImage"] : ["text"],
      duration: Math.max(1, Math.round(pkg.durationSec)),
      aspectRatio: pkg.aspectRatio === "16:9" ? "16:9" : "9:16",
      resolution: pkg.aspectRatio === "16:9" ? "1280x720" : "720x1280",
      audio: false,
    },
    {
      projectId: Number((await u.db("o_sr_task").where("id", pkg.taskId).first())?.projectId || 0),
      taskClass: "结构复刻镜头生成",
      describe: `生成 ${pkg.shotId} 候选 ${input.candidateIndex + 1}`,
      relatedObjects: JSON.stringify({ taskId: pkg.taskId, shotId: pkg.shotId }),
    },
  );
  await aiVideo.save(input.outputPath);
  return {
    videoPath: input.outputPath,
    durationSec: pkg.durationSec,
    metadata: { runner: "toonflow_ai_video" },
  };
}

async function nextGenerationAttempt(taskId: number, shotId: string): Promise<number> {
  const latest = await u.db("o_sr_generation_job").where({ taskId, shotId }).orderBy("attempt", "desc").first();
  return (Number(latest?.attempt) || 0) + 1;
}

export async function enqueueShotGeneration(input: {
  taskId: number;
  shotId: string;
  candidateCount?: number;
  runner?: GenerationRunner;
}): Promise<{ job: o_sr_generation_job; candidates: o_sr_generation_candidate[]; costs: o_sr_generation_cost[] }> {
  const candidateCount = Math.max(1, Math.min(4, Math.floor(input.candidateCount || 1)));
  const controlPackage = await buildShotControlPackage(input.taskId, input.shotId);
  const now = Date.now();
  const [jobId] = await u.db("o_sr_generation_job").insert({
    taskId: input.taskId,
    shotId: input.shotId,
    providerId: controlPackage.providerId,
    model: controlPackage.model,
    status: "queued",
    attempt: await nextGenerationAttempt(input.taskId, input.shotId),
    candidateCount,
    inputPackageJson: stringifyJson(controlPackage),
    resultVideoPath: null,
    errorReason: null,
    costJson: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
  });

  const job = (await u.db("o_sr_generation_job").where("id", Number(jobId)).first())!;
  return await runGenerationJob(Number(job.id), input.runner);
}

export async function retryShotGeneration(input: {
  taskId: number;
  shotId: string;
  candidateCount?: number;
  runner?: GenerationRunner;
}) {
  return await enqueueShotGeneration(input);
}

export async function runGenerationJob(jobId: number, runner: GenerationRunner = defaultGenerationRunner) {
  const job = await u.db("o_sr_generation_job").where("id", jobId).first();
  if (!job) throw new Error(`generation job not found: ${jobId}`);
  const controlPackage = parseJson<ShotControlPackage>(job.inputPackageJson, null as unknown as ShotControlPackage);
  if (!controlPackage) throw new Error(`generation job input package is invalid: ${jobId}`);
  const now = Date.now();
  await u.db("o_sr_generation_job").where("id", jobId).update({
    status: "running",
    startedAt: now,
    updatedAt: now,
    errorReason: null,
  });

  const costs: o_sr_generation_cost[] = [];
  const candidates: o_sr_generation_candidate[] = [];
  const errors: string[] = [];
  const count = Math.max(1, Number(job.candidateCount || 1));
  for (let candidateIndex = 0; candidateIndex < count; candidateIndex += 1) {
    const startedAt = Date.now();
    let candidateId: number | null = null;
    const outputPath = `/${controlPackage.taskId}/structuralReplica/generated/${controlPackage.shotId}-${jobId}-${candidateIndex + 1}.mp4`;
    try {
      const result = await runner({ package: controlPackage, candidateIndex, outputPath });
      const [id] = await u.db("o_sr_generation_candidate").insert({
        taskId: controlPackage.taskId,
        shotId: controlPackage.shotId,
        generationJobId: jobId,
        candidateIndex,
        status: "succeeded",
        providerId: controlPackage.providerId,
        model: controlPackage.model,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath ?? null,
        durationSec: result.durationSec ?? controlPackage.durationSec,
        qualityScore: result.qualityScore ?? null,
        selected: 0,
        errorReason: null,
        metadataJson: stringifyJson(result.metadata ?? {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      candidateId = Number(id);
      candidates.push((await u.db("o_sr_generation_candidate").where("id", candidateId).first())!);
      const cost = await recordGenerationCost({
        taskId: controlPackage.taskId,
        shotId: controlPackage.shotId,
        generationJobId: jobId,
        candidateId,
        providerId: controlPackage.providerId,
        model: controlPackage.model,
        latencyMs: Date.now() - startedAt,
        requestSizeBytes: requestSizeBytes(controlPackage),
        estimatedCost: result.estimatedCost ?? 0,
      });
      costs.push(cost);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(reason);
      const [id] = await u.db("o_sr_generation_candidate").insert({
        taskId: controlPackage.taskId,
        shotId: controlPackage.shotId,
        generationJobId: jobId,
        candidateIndex,
        status: "failed",
        providerId: controlPackage.providerId,
        model: controlPackage.model,
        videoPath: null,
        thumbnailPath: null,
        durationSec: null,
        qualityScore: null,
        selected: 0,
        errorReason: reason,
        metadataJson: stringifyJson({}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      candidateId = Number(id);
      candidates.push((await u.db("o_sr_generation_candidate").where("id", candidateId).first())!);
      costs.push(
        await recordGenerationCost({
          taskId: controlPackage.taskId,
          shotId: controlPackage.shotId,
          generationJobId: jobId,
          candidateId,
          providerId: controlPackage.providerId,
          model: controlPackage.model,
          latencyMs: Date.now() - startedAt,
          requestSizeBytes: requestSizeBytes(controlPackage),
          estimatedCost: 0,
          errorCode: "generation_failed",
          errorReason: reason,
        }),
      );
    }
  }

  const succeeded = candidates.filter((item) => item.status === "succeeded");
  const finishedAt = Date.now();
  await u.db("o_sr_generation_job").where("id", jobId).update({
    status: succeeded.length ? "succeeded" : "failed",
    resultVideoPath: succeeded[0]?.videoPath ?? null,
    errorReason: succeeded.length ? null : errors.join("; "),
    costJson: stringifyJson(costs.map((item) => ({ id: item.id, estimatedCost: item.estimatedCost, errorReason: item.errorReason }))),
    finishedAt,
    updatedAt: finishedAt,
  });

  return {
    job: (await u.db("o_sr_generation_job").where("id", jobId).first())!,
    candidates,
    costs,
  };
}

export async function enqueueTaskGeneration(input: {
  taskId: number;
  candidateCount?: number;
  runner?: GenerationRunner;
}): Promise<Array<{ shotId: string; ok: boolean; errorReason?: string; job?: o_sr_generation_job }>> {
  const bundle = await getTaskBundle(input.taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const results: Array<{ shotId: string; ok: boolean; errorReason?: string; job?: o_sr_generation_job }> = [];
  for (const shot of ir.shots.filter((item) => item.enabled)) {
    try {
      const result = await enqueueShotGeneration({
        taskId: input.taskId,
        shotId: shot.shotId,
        candidateCount: input.candidateCount,
        runner: input.runner,
      });
      results.push({ shotId: shot.shotId, ok: result.job.status === "succeeded", job: result.job, errorReason: result.job.errorReason ?? undefined });
    } catch (error) {
      results.push({ shotId: shot.shotId, ok: false, errorReason: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

async function recordGenerationCost(input: {
  taskId: number;
  shotId: string;
  generationJobId: number;
  candidateId?: number | null;
  providerId: string;
  model: string;
  latencyMs: number;
  requestSizeBytes: number;
  estimatedCost: number;
  errorCode?: string | null;
  errorReason?: string | null;
}): Promise<o_sr_generation_cost> {
  const [id] = await u.db("o_sr_generation_cost").insert({
    taskId: input.taskId,
    shotId: input.shotId,
    generationJobId: input.generationJobId,
    candidateId: input.candidateId ?? null,
    providerId: input.providerId,
    model: input.model,
    latencyMs: input.latencyMs,
    requestSizeBytes: input.requestSizeBytes,
    estimatedCost: input.estimatedCost,
    errorCode: input.errorCode ?? null,
    errorReason: input.errorReason ?? null,
    createdAt: Date.now(),
  });
  return (await u.db("o_sr_generation_cost").where("id", Number(id)).first())!;
}

export async function listShotCandidates(taskId: number, shotId?: string): Promise<GenerationCandidate[]> {
  const query = u.db("o_sr_generation_candidate").where("taskId", taskId);
  if (shotId) query.andWhere("shotId", shotId);
  const rows = (await query.orderBy("shotId", "asc").orderBy("candidateIndex", "asc").orderBy("id", "asc")) as o_sr_generation_candidate[];
  return rows.map(parseGenerationCandidateRow);
}

export function parseGenerationCandidateRow(row: o_sr_generation_candidate): GenerationCandidate {
  return GenerationCandidateSchema.parse({
    taskId: Number(row.taskId),
    shotId: row.shotId || "",
    generationJobId: Number(row.generationJobId),
    candidateIndex: Number(row.candidateIndex || 0),
    status: row.status || "pending",
    providerId: row.providerId || "",
    model: row.model || "",
    videoPath: row.videoPath ?? null,
    thumbnailPath: row.thumbnailPath ?? null,
    durationSec: row.durationSec ?? null,
    qualityScore: row.qualityScore ?? null,
    selected: row.selected === 1,
    errorReason: row.errorReason ?? null,
    metadata: parseJson<Record<string, unknown>>(row.metadataJson, {}),
  });
}

export async function selectShotCandidate(input: { taskId: number; shotId: string; candidateId: number }): Promise<GenerationCandidate> {
  const candidate = await u
    .db("o_sr_generation_candidate")
    .where({ id: input.candidateId, taskId: input.taskId, shotId: input.shotId })
    .first();
  if (!candidate) throw new Error(`generation candidate not found: ${input.candidateId}`);
  if (candidate.status !== "succeeded" && candidate.status !== "selected") {
    throw new Error(`candidate is not selectable: ${candidate.status}`);
  }
  await u.db("o_sr_generation_candidate").where({ taskId: input.taskId, shotId: input.shotId, status: "selected" }).update({
    status: "succeeded",
    updatedAt: Date.now(),
  });
  await u.db("o_sr_generation_candidate").where({ taskId: input.taskId, shotId: input.shotId }).update({
    selected: 0,
    updatedAt: Date.now(),
  });
  await u.db("o_sr_generation_candidate").where("id", input.candidateId).update({
    selected: 1,
    status: "selected",
    updatedAt: Date.now(),
  });
  return parseGenerationCandidateRow((await u.db("o_sr_generation_candidate").where("id", input.candidateId).first())!);
}

export async function ensureLocalGenerationTestVideo(relPath: string): Promise<string> {
  const normalized = relPath.replace(/^[/\\]+/, "");
  const absolute = u.getPath(["oss", ...normalized.split(/[\\/]+/)]);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, Buffer.from("not a real mp4"));
  return `/${normalized.replace(/\\/g, "/")}`;
}
