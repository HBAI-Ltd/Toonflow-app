import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import u from "@/utils";
import type { o_sr_generation_candidate, o_sr_quality_report } from "@/types/database";
import { QualityReportSchema, type QualityReport } from "./schemas";
import { recommendRetry } from "./qualityRetryPolicy";

export interface VideoProbeResult {
  exists: boolean;
  sizeBytes: number;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
  blackFrameRatio?: number | null;
  keyframeReadable?: boolean | null;
}

export type VideoProbe = (videoPath: string) => Promise<VideoProbeResult>;

function parseJson<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function ossAbsPath(relPath: string): string {
  const normalized = relPath.replace(/^[/\\]+/, "");
  return u.getPath(["oss", ...normalized.split(/[\\/]+/)]);
}

function run(command: string, args: string[], timeoutMs = 20000): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out`));
    }, timeoutMs);
    child.stdout.on("data", (data) => {
      stdout += String(data);
    });
    child.stderr.on("data", (data) => {
      stderr += String(data);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function parseBlackFrameRatio(stderr: string, durationSec?: number | null): number | null {
  if (!durationSec || durationSec <= 0) return null;
  const durations = [...stderr.matchAll(/black_duration:([0-9.]+)/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  if (!durations.length) return 0;
  const totalBlackSec = durations.reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.min(1, totalBlackSec / durationSec));
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await u.db("o_setting").where("key", key).first();
  return String(row?.value || fallback);
}

export async function defaultVideoProbe(videoPath: string): Promise<VideoProbeResult> {
  const absPath = path.isAbsolute(videoPath) ? videoPath : ossAbsPath(videoPath);
  try {
    const stat = await fs.stat(absPath);
    if (!stat.isFile()) return { exists: false, sizeBytes: 0 };
    const ffprobe = await getSetting("sr.ffprobePath", "ffprobe");
    const ffmpeg = await getSetting("sr.ffmpegPath", "ffmpeg");
    let durationSec: number | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let keyframeReadable = false;
    try {
      const probed = await run(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,duration", "-of", "json", absPath]);
      const parsed = JSON.parse(probed.stdout || "{}") as { streams?: Array<{ width?: number; height?: number; duration?: string }> };
      const stream = parsed.streams?.[0];
      durationSec = stream?.duration ? Number(stream.duration) : null;
      width = stream?.width ?? null;
      height = stream?.height ?? null;
    } catch {
      // The report records keyframe readability separately, so probe metadata failure should not mask file checks.
    }
    try {
      const keyframe = await run(ffmpeg, ["-v", "error", "-i", absPath, "-frames:v", "1", "-f", "null", "-"], 20000);
      keyframeReadable = keyframe.code === 0;
    } catch {
      keyframeReadable = false;
    }
    let blackFrameRatio: number | null = null;
    try {
      const blackDetect = await run(ffmpeg, ["-v", "info", "-i", absPath, "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"], 30000);
      blackFrameRatio = parseBlackFrameRatio(blackDetect.stderr, durationSec);
    } catch {
      blackFrameRatio = null;
    }
    return { exists: true, sizeBytes: stat.size, durationSec, width, height, blackFrameRatio, keyframeReadable };
  } catch {
    return { exists: false, sizeBytes: 0 };
  }
}

function aspectRatio(width?: number | null, height?: number | null): string | null {
  if (!width || !height) return null;
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16";
  if (Math.abs(ratio - 1) < 0.08) return "1:1";
  return `${width}:${height}`;
}

function scoreFromChecks(checks: QualityReport["checks"]): number {
  return Math.max(
    0,
    100 -
      checks.reduce((sum, check) => {
        if (check.passed) return sum;
        return sum + (check.severity === "blocker" ? 30 : check.severity === "warning" ? 12 : 4);
      }, 0),
  );
}

export async function inspectGenerationCandidate(input: {
  taskId: number;
  candidateId: number;
  expectedDurationSec: number;
  expectedAspectRatio: string;
  probe?: VideoProbe;
}): Promise<QualityReport> {
  const candidate = (await u.db("o_sr_generation_candidate").where({ id: input.candidateId, taskId: input.taskId }).first()) as
    | o_sr_generation_candidate
    | undefined;
  if (!candidate) throw new Error(`generation candidate not found: ${input.candidateId}`);
  const metadata = parseJson<Record<string, unknown>>(candidate.metadataJson, {});
  const probe = await (input.probe || defaultVideoProbe)(candidate.videoPath || "");
  const checks: QualityReport["checks"] = [];
  const fileExists = Boolean(candidate.videoPath && probe.exists);
  checks.push({ code: "file_exists", severity: "blocker", passed: fileExists, message: fileExists ? "文件存在" : "生成视频文件不存在", details: { videoPath: candidate.videoPath } });
  checks.push({ code: "non_empty_file", severity: "blocker", passed: probe.sizeBytes > 0, message: probe.sizeBytes > 0 ? "文件非空" : "生成视频为空文件", details: { sizeBytes: probe.sizeBytes } });
  const durationDelta = probe.durationSec == null ? null : Math.abs(probe.durationSec - input.expectedDurationSec);
  checks.push({
    code: "duration_match",
    severity: "warning",
    passed: durationDelta == null ? false : durationDelta <= Math.max(0.75, input.expectedDurationSec * 0.25),
    message: "时长偏差检查",
    details: { expectedDurationSec: input.expectedDurationSec, actualDurationSec: probe.durationSec, durationDelta },
  });
  checks.push({
    code: "aspect_ratio_match",
    severity: "blocker",
    passed: aspectRatio(probe.width, probe.height) === input.expectedAspectRatio,
    message: "画面比例检查",
    details: { expectedAspectRatio: input.expectedAspectRatio, width: probe.width, height: probe.height, actualAspectRatio: aspectRatio(probe.width, probe.height) },
  });
  checks.push({
    code: "black_frame",
    severity: "blocker",
    passed: probe.blackFrameRatio == null ? true : probe.blackFrameRatio < 0.9,
    message: "黑屏检查",
    details: { blackFrameRatio: probe.blackFrameRatio },
  });
  checks.push({
    code: "keyframe_extract",
    severity: "blocker",
    passed: probe.keyframeReadable !== false,
    message: "关键帧可读检查",
    details: { keyframeReadable: probe.keyframeReadable },
  });

  for (const code of ["character_presence", "scene_presence", "product_presence", "subtitle_safe_area", "source_entity_leakage"] as const) {
    const value = metadata[code];
    const passed = code === "source_entity_leakage" ? value !== true : value !== false;
    checks.push({
      code,
      severity: code === "source_entity_leakage" ? "blocker" : "warning",
      passed,
      message: `${code} check`,
      details: { value },
    });
  }

  const score = scoreFromChecks(checks);
  const status = checks.some((check) => check.severity === "blocker" && !check.passed) ? "blocked" : checks.some((check) => !check.passed) ? "warning" : "pass";
  return QualityReportSchema.parse({
    taskId: input.taskId,
    shotId: candidate.shotId,
    candidateId: input.candidateId,
    status,
    score,
    checks,
    retryRecommendation: recommendRetry({ score, checks }),
  });
}

export async function saveQualityReport(report: QualityReport): Promise<o_sr_quality_report> {
  const now = Date.now();
  const [id] = await u.db("o_sr_quality_report").insert({
    taskId: report.taskId,
    shotId: report.shotId,
    candidateId: report.candidateId,
    status: report.status,
    score: report.score,
    reportJson: JSON.stringify(report),
    createdAt: now,
    updatedAt: now,
  });
  await u.db("o_sr_generation_candidate").where("id", report.candidateId).update({
    qualityScore: report.score,
    updatedAt: now,
  });
  return (await u.db("o_sr_quality_report").where("id", Number(id)).first())!;
}

export async function inspectAndSaveCandidate(input: {
  taskId: number;
  candidateId: number;
  expectedDurationSec: number;
  expectedAspectRatio: string;
  probe?: VideoProbe;
}): Promise<QualityReport> {
  const report = await inspectGenerationCandidate(input);
  await saveQualityReport(report);
  return report;
}
