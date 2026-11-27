import type { BrowserFfmpegFactory, FfprobeData } from "@toonflow/ffmpeg/browser";
import { runCommand } from "@toonflow/node-shared/mediaCommands";
import { getPcmOptions, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import type { MediaToolContext } from "@toonflow/node-shared/mediaTools";

// 一次打开所有 WAV 输出，每个切点额外占用一个文件描述符。
export const maxAudioCuts = 63;

export async function splitAudio(ffmpeg: BrowserFfmpegFactory, context: MediaToolContext, pcm?: PcmOptions) {
  const cuts: unknown = JSON.parse(String(context.values.cuts));
  if (!Array.isArray(cuts) || !cuts.length || cuts.length > maxAudioCuts || !cuts.every(t => typeof t === "number" && Number.isFinite(t) && t > 0)) {
    throw new Error("请在波形上添加有效的切点");
  }
  const inputOptions = audioInputOptions(pcm);
  const media = await probeAudio(ffmpeg, context.source.url, context.signal, inputOptions);
  const duration = audioDuration(media);
  const stream = media.streams.find(item => item.codec_type === "audio")!;
  const rate = Number(stream.sample_rate);
  if (!Number.isSafeInteger(rate) || rate < 1) throw new Error("无法读取音频采样率");
  const samples = cuts.map(time => Math.round(time * rate));
  if (samples.some((n, i) => !Number.isSafeInteger(n) || n <= (samples[i - 1] ?? 0) || n >= Math.round(duration * rate))) {
    throw new Error("切点必须按时间排列，并位于音频首尾之间");
  }
  const points = [0, ...samples.map(n => n / rate), duration];
  const results = points.slice(1).map((end, i) => ({
    path: `${context.outputDirectory}/part${i + 1}.wav`,
    mimeType: "audio/wav",
    label: `片段 ${i + 1}（${points[i]!.toFixed(2)}–${end.toFixed(2)} 秒）`,
  }));
  context.reportOutputs?.(results);
  const command = ffmpeg(context.source.url);
  if (inputOptions.length) command.inputOptions(inputOptions);
  // 用同一解码流和整数采样点拆分，末段一直读到 EOF，避免逐段 seek 或近似时长截去尾部。
  command.complexFilter(`[0:a:0]asegment=samples=${samples.join("|")}${results.map((_, i) => `[part${i}]`).join("")}`);
  const codecs: Record<string, string> = { u8: "pcm_u8", s16: "pcm_s16le", s32: "pcm_s32le", flt: "pcm_f32le", dbl: "pcm_f64le" };
  const codec = codecs[String(stream.sample_fmt).replace(/p$/, "")] ?? "pcm_f32le";
  for (const [index, result] of results.entries()) command.output(result.path).outputOptions("-map", `[part${index}]`).audioCodec(codec).format("wav");
  await runCommand(command, context.signal);
  const last = await probeAudio(ffmpeg, results[results.length - 1]!.path, context.signal);
  if (!(Number(last.format.duration) > 0)) throw new Error("末尾切点超出了实际音频，请将切点往前移动");
  return results;
}

export type AudioSegment = { start: number; end: number };
export type AudioProcessingOptions = { outputPath: string; pcm?: PcmOptions } & (
  { action: "audioSpeed"; speed: number } | { action: "audioClip"; segments: AudioSegment[] }
);

export function normalizePath(path: string) {
  if (!path || /[\x00-\x1f]/.test(path) || /^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path) || path.split(/[\\/]+/).includes("..")) {
    throw new Error("音频处理必须使用工作区相对路径");
  }
  const normalized = path.split(/[\\/]+/).filter(part => part && part !== ".").join("/").toLowerCase();
  if (!normalized) throw new Error("音频处理路径不能为空");
  return normalized;
}

export function probeAudio(ffmpeg: BrowserFfmpegFactory, path: string, signal?: AbortSignal, inputOptions: string[] = []) {
  signal?.throwIfAborted();
  const command = ffmpeg(path);
  const cancel = () => command.kill();
  signal?.addEventListener("abort", cancel, { once: true });
  return new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe({ options: inputOptions }, (error, data) => {
      if (signal?.aborted) reject(signal.reason);
      else if (error) reject(error);
      else resolve(data);
    });
  }).finally(() => signal?.removeEventListener("abort", cancel));
}

export function audioInputOptions(pcm?: PcmOptions) {
  if (pcm && !getPcmOptions(pcm)) throw new Error("PCM 采样率、声道数或采样格式无效");
  return pcm ? ["-f", pcm.format, "-sample_rate", String(pcm.sampleRate), "-channels", String(pcm.channels)] : [];
}

export function audioDuration(media: FfprobeData) {
  const audio = media.streams.find(stream => stream.codec_type === "audio");
  if (!audio) throw new Error("文件不包含音轨");
  const duration = [Number(audio.duration), Number(media.format.duration)].find(value => Number.isFinite(value) && value > 0);
  if (!duration) throw new Error("无法读取有效的音频时长");
  return duration;
}

export function tempoFilter(speed: number) {
  const filters: string[] = [];
  // 每级保持在 0.5–2 倍，避免高速跳采样，兼容最低 0.1 倍速度。
  while (speed < 0.5) { filters.push("atempo=0.5"); speed /= 0.5; }
  while (speed > 2) { filters.push("atempo=2"); speed /= 2; }
  return [...filters, `atempo=${speed}`].join(",");
}

/** 调用方负责输出目录、唯一文件名和失败清理，处理结果不会覆盖原音频。 */
export async function processAudio(ffmpeg: BrowserFfmpegFactory, source: string, options: AudioProcessingOptions, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (normalizePath(source) === normalizePath(options.outputPath)) throw new Error("输出文件不能覆盖原音频");
  if (!["audioSpeed", "audioClip"].includes(options.action)) throw new Error("未知的音频处理操作");
  if (options.action === "audioSpeed" && (!Number.isFinite(options.speed) || options.speed < 0.1 || options.speed > 4)) {
    throw new Error("音频速度须在 0.1 至 4 倍之间");
  }
  const inputOptions = audioInputOptions(options.pcm);
  const media = await probeAudio(ffmpeg, source, signal, inputOptions);
  const duration = audioDuration(media);
  if (options.action === "audioClip" && (!Array.isArray(options.segments) || options.segments.length === 0
    || options.segments.some(segment => !segment || !Number.isFinite(segment.start) || !Number.isFinite(segment.end)
      || segment.start < 0 || segment.end <= segment.start || segment.end > duration))) {
    throw new Error("每个片段须满足 0 ≤ 开始时间 < 结束时间 ≤ 音频时长");
  }

  const command = ffmpeg(source).output(options.outputPath).noVideo().audioCodec("libmp3lame").audioBitrate(192).format("mp3");
  if (inputOptions.length) command.inputOptions(inputOptions);
  if (options.action === "audioSpeed") {
    command.audioFilters(tempoFilter(options.speed)).outputOptions("-map", "0:a:0");
  } else {
    const filters = options.segments.map((segment, index) =>
      `[0:a:0]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[part${index}]`);
    filters.push(`${options.segments.map((_segment, index) => `[part${index}]`).join("")}concat=n=${options.segments.length}:v=0:a=1[result]`);
    command.complexFilter(filters).outputOptions("-map", "[result]");
  }
  await runCommand(command, signal);
  const result = await probeAudio(ffmpeg, options.outputPath, signal);
  const resultDuration = Number(result.format.duration);
  if (!Number.isFinite(resultDuration) || resultDuration <= 0 || !result.streams.some(stream => stream.codec_type === "audio")) {
    throw new Error("生成的音频文件无效");
  }
  return { duration: resultDuration };
}
