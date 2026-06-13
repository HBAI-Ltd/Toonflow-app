import { execFile } from "node:child_process";
import { promisify } from "node:util";

/**
 * FFmpeg 本地处理工具（借鉴 huobao-drama 的成片管线）
 *
 * - composeShot：单镜头合成（视频 + 可选配音音频 + 可选烧录字幕），输出统一 h264/aac
 * - normalizeSegment：拼接前把片段统一为相同分辨率/帧率/音频规格（无音轨补静音）
 * - concatSegments：concat demuxer 拼接已统一规格的片段
 *
 * 依赖系统 ffmpeg/ffprobe，可通过环境变量 FFMPEG_PATH / FFPROBE_PATH 覆盖。
 */

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const DEFAULT_FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_FFPROBE_TIMEOUT_MS = 30 * 1000;

function positiveEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync(FFMPEG, ["-hide_banner", "-nostdin", "-y", ...args], {
      maxBuffer: 32 * 1024 * 1024,
      timeout: positiveEnvNumber("FFMPEG_TIMEOUT_MS", DEFAULT_FFMPEG_TIMEOUT_MS),
      killSignal: "SIGKILL",
    });
  } catch (e: any) {
    const stderr: string = e?.stderr ?? "";
    // 只保留 stderr 末尾的关键报错，避免日志爆炸
    const tail = stderr.split("\n").filter(Boolean).slice(-5).join("\n");
    if (e?.killed || e?.signal === "SIGKILL") {
      throw new Error(`ffmpeg 执行超时或被终止: ${tail || e?.message || String(e)}`);
    }
    throw new Error(`ffmpeg 执行失败: ${tail || e?.message || String(e)}`);
  }
}

/** 检查 ffmpeg 是否可用 */
export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync(FFMPEG, ["-version"], { timeout: positiveEnvNumber("FFPROBE_TIMEOUT_MS", DEFAULT_FFPROBE_TIMEOUT_MS) });
    return true;
  } catch {
    return false;
  }
}

/** 获取媒体文件时长（秒），失败返回 null */
export async function probeDuration(absPath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync(
      FFPROBE,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", absPath],
      { timeout: positiveEnvNumber("FFPROBE_TIMEOUT_MS", DEFAULT_FFPROBE_TIMEOUT_MS) },
    );
    const value = parseFloat(stdout.trim());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

interface ProbeInfo {
  width: number;
  height: number;
  hasAudio: boolean;
}

/** 获取视频分辨率与是否含音轨 */
export async function probeVideoInfo(absPath: string): Promise<ProbeInfo> {
  const { stdout } = await execFileAsync(FFPROBE, ["-v", "error", "-show_entries", "stream=codec_type,width,height", "-of", "json", absPath], {
    timeout: positiveEnvNumber("FFPROBE_TIMEOUT_MS", DEFAULT_FFPROBE_TIMEOUT_MS),
  });
  const parsed = JSON.parse(stdout) as { streams?: { codec_type?: string; width?: number; height?: number }[] };
  const streams = parsed.streams ?? [];
  const videoStream = streams.find((s) => s.codec_type === "video");
  if (!videoStream?.width || !videoStream?.height) throw new Error(`无法读取视频分辨率: ${absPath}`);
  return {
    width: videoStream.width,
    height: videoStream.height,
    hasAudio: streams.some((s) => s.codec_type === "audio"),
  };
}

/** subtitles 滤镜的路径转义（: \ ' 需要转义） */
function escapeSubtitlePath(absPath: string): string {
  return absPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export interface ComposeShotOptions {
  videoAbs: string;
  audioAbs?: string | null;
  srtAbs?: string | null;
  outAbs: string;
}

/**
 * 单镜头合成：视频 + 可选 TTS 音频 + 可选烧录字幕。
 * 始终重编码为 h264 + aac（无音频时补静音音轨），保证后续拼接规格统一。
 * 音频短于视频时自动补静音（apad），以视频时长为准。
 */
export async function composeShot(options: ComposeShotOptions): Promise<void> {
  const { videoAbs, audioAbs, srtAbs, outAbs } = options;
  const args: string[] = ["-i", videoAbs];
  if (audioAbs) {
    args.push("-i", audioAbs);
  } else {
    args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  }
  if (srtAbs) {
    args.push("-vf", `subtitles='${escapeSubtitlePath(srtAbs)}':force_style='FontSize=18,Outline=1,MarginV=24'`);
  }
  args.push(
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-af", "apad",
    "-shortest",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-ar", "44100",
    "-ac", "2",
    outAbs,
  );
  await runFfmpeg(args);
}

/**
 * 把片段统一为指定分辨率、30fps、aac 双声道（无音轨补静音），供 concat 拼接。
 */
export async function normalizeSegment(inAbs: string, outAbs: string, width: number, height: number): Promise<void> {
  const info = await probeVideoInfo(inAbs);
  const args: string[] = ["-i", inAbs];
  if (!info.hasAudio) {
    args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  }
  const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;
  args.push(
    "-vf", vf,
    "-map", "0:v:0",
    "-map", info.hasAudio ? "0:a:0" : "1:a:0",
    "-af", "apad",
    "-shortest",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-ar", "44100",
    "-ac", "2",
    outAbs,
  );
  await runFfmpeg(args);
}

/** concat 协议的列表文件路径转义 */
function escapeConcatPath(absPath: string): string {
  return absPath.replace(/'/g, "'\\''");
}

/**
 * 拼接片段（要求各片段已通过 normalizeSegment 统一规格）。
 * @param listFileAbs concat 列表文件写入位置（调用方负责清理）
 */
export async function concatSegments(segmentAbsPaths: string[], outAbs: string, listFileAbs: string): Promise<void> {
  const fs = await import("node:fs/promises");
  const content = segmentAbsPaths.map((p) => `file '${escapeConcatPath(p)}'`).join("\n");
  await fs.writeFile(listFileAbs, content, "utf8");
  await runFfmpeg(["-f", "concat", "-safe", "0", "-i", listFileAbs, "-c", "copy", outAbs]);
}
