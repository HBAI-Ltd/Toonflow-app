import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import u from "@/utils";
import type { o_sr_generation_candidate, o_sr_timeline_export } from "@/types/database";
import { DialogueStructureSchema, StructuralIrSchema, TimelineExportSchema, type TimelineExport } from "./schemas";
import { getTaskBundle } from "./repository";

export interface ComposeTimelineInput {
  taskId: number;
  subtitleMode?: "none" | "burn" | "track";
  dryRun?: boolean;
  expiresInDays?: number;
}

function ossAbsPath(relPath: string): string {
  const normalized = relPath.replace(/^[/\\]+/, "");
  return u.getPath(["oss", ...normalized.split(/[\\/]+/)]);
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await u.db("o_setting").where("key", key).first();
  return String(row?.value || fallback);
}

function run(command: string, args: string[], timeoutMs = 120000): Promise<{ code: number | null; stdout: string; stderr: string }> {
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

function parseCandidateIds(data: string | null | undefined): number[] {
  if (!data) return [];
  try {
    const value = JSON.parse(data);
    return Array.isArray(value) ? value.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function srtTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const millis = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function escapeSubtitleFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

async function selectedTimelineInputs(taskId: number): Promise<{ candidates: o_sr_generation_candidate[]; subtitles: Array<{ shotId: string; text: string; durationSec: number }> }> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const dialogue = bundle.dialogueStructure?.dataJson ? DialogueStructureSchema.parse(JSON.parse(bundle.dialogueStructure.dataJson)) : null;
  const dialogueByShot = new Map((dialogue?.lines || []).map((line) => [line.shotId, line]));
  const selectedRows = (await u.db("o_sr_generation_candidate").where({ taskId, selected: 1 }).orderBy("id", "asc")) as o_sr_generation_candidate[];
  const selectedByShot = new Map(selectedRows.map((row) => [row.shotId, row]));
  const ordered: o_sr_generation_candidate[] = [];
  const subtitles: Array<{ shotId: string; text: string; durationSec: number }> = [];
  for (const shot of ir.shots.filter((item) => item.enabled)) {
    const row = selectedByShot.get(shot.shotId);
    if (!row) throw new Error(`selected candidate missing for shot: ${shot.shotId}`);
    if (!row.videoPath) throw new Error(`selected candidate has no video path: ${shot.shotId}`);
    ordered.push(row);
    const line = dialogueByShot.get(shot.shotId);
    subtitles.push({
      shotId: shot.shotId,
      text: line?.subtitle || line?.finalDialogue || "",
      durationSec: Number(row.durationSec || shot.durationSec || 0),
    });
  }
  return { candidates: ordered, subtitles };
}

async function writeSrtFile(taskId: number, generatedAt: number, subtitles: Array<{ text: string; durationSec: number }>): Promise<string> {
  const subtitlePath = `/${taskId}/structuralReplica/exports/timeline-${generatedAt}.srt`;
  const absPath = ossAbsPath(subtitlePath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  let cursor = 0;
  const blocks = subtitles
    .map((subtitle, index) => {
      const text = subtitle.text.trim();
      const start = cursor;
      const end = cursor + Math.max(0.25, subtitle.durationSec || 0);
      cursor = end;
      return text ? `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${text}\n` : "";
    })
    .filter(Boolean);
  await fs.writeFile(absPath, blocks.join("\n"), "utf8");
  return subtitlePath;
}

export async function composeTimeline(input: ComposeTimelineInput): Promise<TimelineExport> {
  const { candidates, subtitles } = await selectedTimelineInputs(input.taskId);
  const now = Date.now();
  const expiresAt = now + (input.expiresInDays ?? 14) * 24 * 60 * 60 * 1000;
  const outputPath = `/${input.taskId}/structuralReplica/exports/timeline-${now}.mp4`;
  const subtitleMode = input.subtitleMode || "none";
  const subtitlePath = subtitleMode === "none" ? null : await writeSrtFile(input.taskId, now, subtitles);
  const report = {
    taskId: input.taskId,
    shotCount: candidates.length,
    candidateIds: candidates.map((item) => Number(item.id)),
    subtitleMode,
    subtitlePath,
    outputPath,
    generatedAt: now,
  };

  const [exportId] = await u.db("o_sr_timeline_export").insert({
    taskId: input.taskId,
    status: "running",
    outputPath,
    reportJson: JSON.stringify(report),
    subtitleMode,
    candidateIdsJson: JSON.stringify(report.candidateIds),
    errorReason: null,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  try {
    if (!input.dryRun) {
      const ffmpeg = await getSetting("sr.ffmpegPath", "ffmpeg");
      const concatListPath = u.getPath(["tmp", "structuralReplica", `concat-${input.taskId}-${now}.txt`]);
      await fs.mkdir(path.dirname(concatListPath), { recursive: true });
      const concatContent = candidates.map((candidate) => `file '${ossAbsPath(candidate.videoPath || "").replace(/'/g, "'\\''")}'`).join("\n");
      await fs.writeFile(concatListPath, concatContent, "utf8");
      const absOutput = ossAbsPath(outputPath);
      await fs.mkdir(path.dirname(absOutput), { recursive: true });
      if (subtitleMode === "none") {
        const result = await run(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", absOutput], 120000);
        if (result.code !== 0) throw new Error(result.stderr || `ffmpeg exited with ${result.code}`);
      } else {
        const tempConcatPath = u.getPath(["tmp", "structuralReplica", `timeline-${input.taskId}-${now}-concat.mp4`]);
        const concatResult = await run(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", tempConcatPath], 120000);
        if (concatResult.code !== 0) throw new Error(concatResult.stderr || `ffmpeg exited with ${concatResult.code}`);
        const absSubtitlePath = ossAbsPath(subtitlePath || "");
        const args =
          subtitleMode === "burn"
            ? ["-y", "-i", tempConcatPath, "-vf", `subtitles='${escapeSubtitleFilterPath(absSubtitlePath)}'`, "-c:a", "copy", absOutput]
            : ["-y", "-i", tempConcatPath, "-i", absSubtitlePath, "-map", "0", "-map", "1", "-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text", absOutput];
        const result = await run(ffmpeg, args, 120000);
        if (result.code !== 0) throw new Error(result.stderr || `ffmpeg exited with ${result.code}`);
      }
    }
    await u.db("o_sr_timeline_export").where("id", Number(exportId)).update({
      status: "succeeded",
      reportJson: JSON.stringify({ ...report, dryRun: Boolean(input.dryRun) }),
      updatedAt: Date.now(),
    });
  } catch (error) {
    await u.db("o_sr_timeline_export").where("id", Number(exportId)).update({
      status: "failed",
      errorReason: error instanceof Error ? error.message : String(error),
      updatedAt: Date.now(),
    });
  }

  const row = (await u.db("o_sr_timeline_export").where("id", Number(exportId)).first()) as o_sr_timeline_export;
  return TimelineExportSchema.parse({
    taskId: row.taskId,
    status: row.status,
    outputPath: row.outputPath,
    reportJson: row.reportJson ? JSON.parse(row.reportJson) : {},
    subtitleMode: row.subtitleMode || "none",
    candidateIds: parseCandidateIds(row.candidateIdsJson),
    errorReason: row.errorReason ?? null,
    expiresAt: row.expiresAt ?? null,
  });
}
