import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import u from "@/utils";
import { fromOssRelPath } from "./artifactPaths";
import { getTaskBundle, updateTaskStatus } from "./repository";
import { ingestFrameSamples } from "./frameSampleIngestService";
import { ingestMediaProbe } from "./mediaProbeService";
import { ingestShotDetection } from "./shotDetectionIngestService";
import { ingestTranscript } from "./transcriptIngestService";
import type { SrJobProgressReporter } from "./jobService";

export interface AnalyzerRunResult {
  taskId: number;
  analysisDir: string;
  artifactsPath: string;
  stdout: string;
  stderr: string;
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await u.db("o_setting").where("key", key).first();
  return row?.value || fallback;
}

async function runPythonAnalyzer(taskId: number, inputPath: string, analysisDir: string): Promise<{ stdout: string; stderr: string }> {
  const pythonPath = await getSetting("sr.pythonPath", "python");
  const whisperModel = await getSetting("sr.whisperModel", "turbo");
  const analyzerPath = path.resolve("tools", "video-analyzer");
  const env = {
    ...process.env,
    PYTHONPATH: process.env.PYTHONPATH ? `${analyzerPath}${path.delimiter}${process.env.PYTHONPATH}` : analyzerPath,
  };
  const args = ["-m", "sr_analyzer.cli", "run-all", "--input", inputPath, "--workdir", analysisDir, "--model", whisperModel];

  return await new Promise((resolve, reject) => {
    const child = spawn(pythonPath, args, { cwd: process.cwd(), env, windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`Analyzer exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

export async function ingestAnalysisArtifacts(taskId: number, analysisDir: string, report?: SrJobProgressReporter) {
  await report?.({ progress: 45, stage: "transcribing" });
  await updateTaskStatus(taskId, "transcribing");
  await ingestMediaProbe(taskId, analysisDir);
  await ingestTranscript(taskId, analysisDir);

  await report?.({ progress: 65, stage: "detecting_shots" });
  await updateTaskStatus(taskId, "detecting_shots");
  await ingestShotDetection(taskId, analysisDir);

  await report?.({ progress: 80, stage: "sampling_frames" });
  await updateTaskStatus(taskId, "sampling_frames");
  await ingestFrameSamples(taskId, analysisDir);
}

export async function runAnalyzer(taskId: number, report?: SrJobProgressReporter): Promise<AnalyzerRunResult> {
  const bundle = await getTaskBundle(taskId);
  if (bundle.task.status !== "source_uploaded" && bundle.task.status !== "failed") {
    throw new Error(`task status must be source_uploaded or failed, got ${bundle.task.status}`);
  }
  if (!bundle.sourceMedia?.sourcePath) throw new Error("source media not found");
  if (!bundle.task.projectId) throw new Error("task projectId not found");

  const analysisDir = u.getPath(path.join("oss", String(bundle.task.projectId), "structuralReplica", String(taskId), "analysis"));
  await fs.mkdir(analysisDir, { recursive: true });

  try {
    await report?.({ progress: 5, stage: "preprocessing" });
    await updateTaskStatus(taskId, "preprocessing", null);
    await report?.({ progress: 20, stage: "running_analyzer" });
    const { stdout, stderr } = await runPythonAnalyzer(taskId, fromOssRelPath(bundle.sourceMedia.sourcePath), analysisDir);
    await ingestAnalysisArtifacts(taskId, analysisDir, report);
    await report?.({ progress: 95, stage: "artifacts_ingested" });
    return {
      taskId,
      analysisDir,
      artifactsPath: path.join(analysisDir, "artifacts.json"),
      stdout,
      stderr,
    };
  } catch (e) {
    await updateTaskStatus(taskId, "failed", e instanceof Error ? e.message : String(e)).catch(() => {});
    throw e;
  }
}
