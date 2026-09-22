import { types } from "node:util";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { executeFfmpeg } from "./runtime";
import type { FfmpegConvertOptions, FfmpegStep } from "./types";

export const maxMediaBytes = 100 * 1024 * 1024;
export const ffmpegOptionsSchema = z.strictObject({
  format: z.enum(["mp4", "webm", "wav", "mp3", "aac", "ogg", "flac", "png", "jpeg", "gif"]),
  startSeconds: z.number().min(0).optional(),
  endSeconds: z.number().positive().optional(),
  width: z.number().int().min(2).max(8192).optional(),
  height: z.number().int().min(2).max(8192).optional(),
  vf: z.enum(["hflip", "vflip"]).optional(),
  fps: z.number().min(1).max(120).optional(),
  audio: z.boolean().optional(),
  sampleRate: z.number().int().min(4000).max(192000).optional(),
  channels: z.union([z.literal(1), z.literal(2)]).optional(),
  bitrateKbps: z.number().int().min(8).max(512).optional(),
}).refine(value => value.endSeconds === undefined || value.endSeconds > (value.startSeconds ?? 0), "裁剪终点必须大于起点");

const formats = {
  mp4: { mimeType: "video/mp4", format: "mp4", videoCodec: "libx264", audioCodec: "aac" },
  webm: { mimeType: "video/webm", format: "webm", videoCodec: "libvpx-vp9", audioCodec: "libopus" },
  wav: { mimeType: "audio/wav", format: "wav", audioCodec: "pcm_s16le" },
  mp3: { mimeType: "audio/mpeg", format: "mp3", audioCodec: "libmp3lame" },
  aac: { mimeType: "audio/aac", format: "adts", audioCodec: "aac" },
  ogg: { mimeType: "audio/ogg", format: "ogg", audioCodec: "libvorbis" },
  flac: { mimeType: "audio/flac", format: "flac", audioCodec: "flac" },
  png: { mimeType: "image/png", format: "image2", videoCodec: "png" },
  jpeg: { mimeType: "image/jpeg", format: "image2", videoCodec: "mjpeg" },
  gif: { mimeType: "image/gif", format: "gif" },
} satisfies Record<FfmpegConvertOptions["format"], { mimeType: string; format: string; videoCodec?: string; audioCodec?: string }>;

/** 兼容旧字节 API；转成文件任务后复用同一执行器，支持需要 seek 的媒体。 */
export async function convertMedia(input: Uint8Array, options: FfmpegConvertOptions, tools: { ffmpegPath: string; ffprobePath?: string }, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!types.isUint8Array(input) || !input.byteLength || input.byteLength > maxMediaBytes) throw new Error("FFmpeg 输入必须是非空且不超过 100 MB 的 Uint8Array");
  const value = ffmpegOptionsSchema.parse(options);
  const format = formats[value.format];
  const video = value.format === "mp4" || value.format === "webm";
  const audioOnly = format.mimeType.startsWith("audio/");
  if (video && ((value.width ?? 0) % 2 || (value.height ?? 0) % 2)) throw new Error("视频宽高必须是偶数");
  if (audioOnly && [value.width, value.height, value.vf, value.fps, value.audio].some(item => item !== undefined)) throw new Error("音频输出不支持画面或静音选项");
  if ((!video && !audioOnly || value.audio === false) && [value.sampleRate, value.channels, value.bitrateKbps].some(item => item !== undefined)) throw new Error("无音轨输出不支持音频编码选项");
  if (!video && value.format !== "gif" && value.audio !== undefined) throw new Error("audio 选项仅用于视频或 GIF");
  const runSignal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(5 * 60 * 1000)]);
  const directory = await mkdtemp(join(tmpdir(), "toonflowFfmpeg-"));
  const output = `output.${value.format}`;
  try {
    await writeFile(join(directory, "input"), input, { flag: "wx", signal: runSignal });
    const steps: FfmpegStep[] = [];
    const add = (method: FfmpegStep["method"], ...args: unknown[]) => { steps.push({ method, args }); };
    add("input", "input");
    add("format", format.format);
    add("outputOptions", ["-map", audioOnly ? "0:a:0" : "0:v:0", "-map_metadata", "-1", "-map_chapters", "-1"]);
    if ("videoCodec" in format) add("videoCodec", format.videoCodec);
    if ("audioCodec" in format) add("audioCodec", format.audioCodec);
    if (value.startSeconds !== undefined) add("seekOutput", value.startSeconds);
    if (value.endSeconds !== undefined) add("duration", value.endSeconds - (value.startSeconds ?? 0));
    if (video && value.audio !== false) add("outputOptions", ["-map", "0:a:0?"]);
    else if (!audioOnly) add("noAudio");
    if (audioOnly) add("noVideo");
    if (value.format === "png" || value.format === "jpeg") add("frames", 1);
    if (video) add("outputOptions", ["-pix_fmt", "yuv420p"]);
    if (value.width !== undefined || value.height !== undefined) add("videoFilters", `scale=${value.width ?? -2}:${value.height ?? -2}`);
    else if (video) add("videoFilters", "scale=trunc(iw/2)*2:trunc(ih/2)*2");
    if (value.vf) add("videoFilters", value.vf);
    if (value.fps !== undefined) add("fps", value.fps);
    if (value.sampleRate !== undefined) add("audioFrequency", value.sampleRate);
    if (value.channels !== undefined) add("audioChannels", value.channels);
    if (value.bitrateKbps !== undefined) add("audioBitrate", value.bitrateKbps);
    add("output", output);
    await executeFfmpeg({ steps }, {
      ...tools, directory,
      resolvePath: async path => {
        if (path !== "input" && path !== output) throw new Error("无效的转换临时文件");
        return join(directory, path);
      },
    }, runSignal);
    if ((await stat(join(directory, output))).size > maxMediaBytes) throw new Error("FFmpeg 输出超过大小限制");
    return { data: new Uint8Array(await readFile(join(directory, output), { signal: runSignal })), mimeType: format.mimeType };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
