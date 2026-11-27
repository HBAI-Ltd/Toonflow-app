import type { BrowserFfmpegCommand } from "@toonflow/ffmpeg/browser";
import type { MediaTool, MediaToolContext, MediaToolResult, ToolField } from "@toonflow/node-shared/mediaTools";
import { probeMedia, runCommand } from "@toonflow/node-shared/mediaCommands";

export function numeric(key: string, label: string, value: number, min: number, max: number, step = 1): ToolField {
  return { key, label, type: "number", value, min, max, step };
}

export function choice(key: string, label: string, options: Record<string, string>): ToolField {
  return { key, label, type: "select", value: Object.keys(options)[0], options: Object.entries(options).map(([value, label]) => ({ label, value })) };
}

export function field(key: string, label: string, value = "", type: "text" | "textarea" | "color" = "text"): ToolField {
  return { key, label, type, value };
}

export function videoFrameRate(stream?: { avg_frame_rate?: string; r_frame_rate?: string }) {
  for (const value of [stream?.avg_frame_rate, stream?.r_frame_rate]) {
    if (!value || !/^\d+(?:\/\d+|\.\d+)?$/.test(value)) continue;
    const [frames, seconds = 1] = value.split("/").map(Number);
    if (frames !== undefined && Number.isFinite(frames) && frames > 0 && Number.isSafeInteger(seconds) && seconds > 0) {
      return { expression: value, fps: frames / seconds };
    }
  }
}

export const timeField = numeric("start", "时间点（秒）", 1, 0, 86400, 0.1);
export const durationField = numeric("seconds", "时长（秒）", 2, 0.1, 86400, 0.1);
export const imageAttachment = { accept: "image/png,image/jpeg,image/webp", attachmentLabel: "选择图片" };
export const videoAttachment = { accept: "video/*", attachmentLabel: "选择视频" };
export function tool(group: string, id: string, label: string, fields: ToolField[] = [], options: Partial<MediaTool> = {}): MediaTool {
  return { group, id, label, fields, ...options };
}

function relativePath(path: string) {
  if (!path || /[\x00-\x1f]/.test(path) || /^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path) || path.split(/[\\/]/).includes("..")) {
    throw new Error("请使用当前工作区中的素材");
  }
  return path;
}

export async function prepareJob(tool: MediaTool, context: MediaToolContext) {
  const { signal, workspace } = context;
  signal.throwIfAborted();
  const source = relativePath(context.source.url);
  const directory = relativePath(context.outputDirectory);
  const attachments = context.attachments.map(relativePath);
  if (tool.accept && tool.attachmentsRequired !== false && !attachments.length) throw new Error(tool.attachmentLabel || "请先添加素材");
  const values: Record<string, string | number> = {};
  for (const f of tool.fields ?? []) {
    const raw = context.values[f.key] ?? f.value;
    if (f.type === "number") {
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n) || n < (f.min ?? -Infinity) || n > (f.max ?? Infinity)
        || (f.step === 1 && !Number.isInteger(n))) throw new Error(`请检查「${f.label}」的数值`);
      values[f.key] = n;
    } else {
      const text = String(raw).trim();
      if ((f.type === "select" && !f.options?.some(o => o.value === text)) || (f.type === "color" && !/^#[0-9a-f]{6}$/i.test(text))) throw new Error(`「${f.label}」的选项无效`);
      values[f.key] = text;
    }
  }
  const ffmpeg = await context.ffmpeg();
  const probe = (path: string) => probeMedia(ffmpeg, path, signal);
  const media = await probe(source);
  const video = media.streams.find(s => s.codec_type === "video" && !s.disposition?.attached_pic);
  const audio = media.streams.find(s => s.codec_type === "audio");
  const duration = Number(media.format.duration ?? video?.duration ?? audio?.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("无法读取有效的素材时长");
  const rotate = (video as { side_data_list?: { rotation?: number }[] } | undefined)?.side_data_list?.find(s => s.rotation !== undefined)?.rotation ?? Number(video?.tags?.rotate ?? 0);
  const swapped = Math.abs(rotate % 180) === 90;
  const width = Number(swapped ? video?.height : video?.width) || 0;
  const height = Number(swapped ? video?.width : video?.height) || 0;
  if (!video && !tool.sourceMimeTypes?.includes("audio/*")) throw new Error("请提供包含视频画面的文件");
  const file = (name: string) => `${directory}/${name}`;
  const command = (path = source) => ffmpeg(path, { cwd: directory });
  const run = (cmd: BrowserFfmpegCommand) => runCommand(cmd, signal);
  async function output(cmd: BrowserFfmpegCommand, name: string, mimeType: string): Promise<MediaToolResult[]> {
    const path = file(name);
    await run(cmd.output(path));
    return [{ path, mimeType, label: tool.label }];
  }
  function mp4(cmd: BrowserFfmpegCommand, graph?: string[], audioMap = "0:a:0?", name = "result.mp4") {
    const pad = "pad=ceil(iw/2)*2:ceil(ih/2)*2";
    if (graph) {
      cmd.complexFilter([...graph, `[v]${pad}[padded]`]).outputOptions("-map", "[padded]");
    } else {
      cmd.videoFilters(pad).outputOptions("-map", `0:${video?.index ?? "v:0"}`);
    }
    if (audioMap) cmd.outputOptions("-map", audioMap).audioCodec("aac").audioBitrate(192);
    else cmd.noAudio();
    cmd.videoCodec("libx264").outputOptions("-pix_fmt", "yuv420p", "-crf", "19", "-preset", "fast", "-movflags", "+faststart");
    return output(cmd, name, "video/mp4");
  }
  function filter(vf: string, af?: string) {
    const cmd = command();
    if (af && audio) cmd.audioFilters(af);
    return mp4(cmd, [`[0:${video?.index}]${vf}[v]`]);
  }
  return { source, attachments, workspace, duration, video, audio, width, height, signal, reportOutputs: context.reportOutputs,
    n: (key: string) => Number(values[key]), s: (key: string) => String(values[key] ?? ""), command, probe, run, file, output, mp4, filter };
}

export type VideoJob = Awaited<ReturnType<typeof prepareJob>>;
export type VideoRunner = (id: string, job: VideoJob) => Promise<MediaToolResult[]>;

export function fitSize(width: number, height: number) {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
}

export function tempo(speed: number) {
  // 每级 atempo 保持在 0.5–2，兼容旧版 FFmpeg 并避免高速播放时跳过采样。
  if (speed < 0.5 || speed > 2) return `atempo=${Math.sqrt(speed)},atempo=${Math.sqrt(speed)}`;
  return `atempo=${speed}`;
}
