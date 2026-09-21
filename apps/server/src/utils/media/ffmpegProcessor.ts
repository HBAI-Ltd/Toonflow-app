import { types } from "node:util";
import { Readable, Writable } from "node:stream";
import { finished } from "node:stream/promises";
import type { SpawnOptions } from "node:child_process";
import ffmpeg from "@renmu/fluent-ffmpeg";
import { z } from "zod";
import type { FfmpegConvertOptions } from "@toonflow/providers";
import { requireFfmpeg } from "@/utils/media/ffmpeg";

export const maxMediaBytes = 100 * 1024 * 1024;
export const ffmpegOptionsSchema = z.strictObject({
  format: z.enum(["mp4", "webm", "wav", "mp3", "aac", "ogg", "flac", "png", "jpeg", "gif"]),
  startSeconds: z.number().min(0).optional(),
  endSeconds: z.number().positive().optional(),
  width: z.number().int().min(2).max(8192).optional(),
  height: z.number().int().min(2).max(8192).optional(),
  vf: z.enum(["hflip", "vflip"]).optional().describe("画面翻转：hflip 左右镜像，vflip 上下镜像；不支持其他滤镜或纯音频输出"),
  fps: z.number().min(1).max(120).optional(),
  audio: z.boolean().optional(),
  sampleRate: z.number().int().min(4000).max(192000).optional(),
  channels: z.union([z.literal(1), z.literal(2)]).optional(),
  bitrateKbps: z.number().int().min(8).max(512).optional(),
}).refine(value => value.endSeconds === undefined || value.endSeconds > (value.startSeconds ?? 0), "裁剪终点必须大于起点");

const formats: Record<FfmpegConvertOptions["format"], { mimeType: string; format: string; videoCodec?: string; audioCodec?: string; options?: string[] }> = {
  mp4: { mimeType: "video/mp4", format: "mp4", videoCodec: "libx264", audioCodec: "aac", options: ["-preset veryfast", "-pix_fmt yuv420p", "-movflags frag_keyframe+empty_moov+default_base_moof"] },
  webm: { mimeType: "video/webm", format: "webm", videoCodec: "libvpx-vp9", audioCodec: "libopus", options: ["-deadline realtime", "-cpu-used 4", "-pix_fmt yuv420p"] },
  wav: { mimeType: "audio/wav", format: "wav", audioCodec: "pcm_s16le" },
  mp3: { mimeType: "audio/mpeg", format: "mp3", audioCodec: "libmp3lame" },
  aac: { mimeType: "audio/aac", format: "adts", audioCodec: "aac" },
  ogg: { mimeType: "audio/ogg", format: "ogg", audioCodec: "libvorbis" },
  flac: { mimeType: "audio/flac", format: "flac", audioCodec: "flac" },
  png: { mimeType: "image/png", format: "image2pipe", videoCodec: "png" },
  jpeg: { mimeType: "image/jpeg", format: "image2pipe", videoCodec: "mjpeg", options: ["-q:v 2"] },
  gif: { mimeType: "image/gif", format: "gif" },
};

/** 供应商只能处理字节；命令、管道和可用编解码格式由宿主固定，不接受路径或任意参数。 */
export async function convertMedia(input: Uint8Array, options: FfmpegConvertOptions, signal?: AbortSignal): Promise<{ data: Uint8Array; mimeType: string }> {
  signal?.throwIfAborted();
  if (!types.isUint8Array(input) || !input.byteLength || input.byteLength > maxMediaBytes) throw new Error("FFmpeg 输入必须是非空且不超过 100 MB 的 Uint8Array");
  const checked = ffmpegOptionsSchema.parse(options);
  const format = formats[checked.format];
  const video = checked.format === "mp4" || checked.format === "webm";
  const audioOnly = format.mimeType.startsWith("audio/");
  if (video && ((checked.width ?? 0) % 2 || (checked.height ?? 0) % 2)) throw new Error("视频宽高必须是偶数");
  if (audioOnly && (checked.width !== undefined || checked.height !== undefined || checked.vf !== undefined || checked.fps !== undefined || checked.audio !== undefined)) throw new Error("音频输出不支持画面或静音选项");
  if ((!video && !audioOnly || checked.audio === false) && (checked.sampleRate !== undefined || checked.channels !== undefined || checked.bitrateKbps !== undefined)) throw new Error("无音轨输出不支持音频编码选项");
  if (!video && checked.format !== "gif" && checked.audio !== undefined) throw new Error("audio 选项仅用于视频或 GIF");

  const ffmpegPath = await requireFfmpeg(signal);
  // ACT: 仅走字节流；需要 seek 的输入仍不使用临时文件兜底。
  const source = Readable.from([Buffer.from(input)]);
  const command = ffmpeg(source).setFfmpegPath(ffmpegPath)
    .inputOptions(["-protocol_whitelist pipe", "-format_whitelist mov,matroska,webm,wav,mp3,aac,ogg,flac,png_pipe,jpeg_pipe,webp_pipe,gif"])
    .outputOptions(["-hide_banner", "-nostdin", "-loglevel error", `-map ${audioOnly ? "0:a:0" : "0:v:0"}`, "-map_metadata -1", "-map_chapters -1"])
    .format(format.format);
  if (format.videoCodec) command.videoCodec(format.videoCodec);
  if (format.audioCodec) command.audioCodec(format.audioCodec);
  if (format.options) command.outputOptions(format.options);
  if (checked.startSeconds !== undefined) command.seekOutput(checked.startSeconds);
  if (checked.endSeconds !== undefined) command.duration(checked.endSeconds - (checked.startSeconds ?? 0));
  if (video && checked.audio !== false) command.outputOptions("-map 0:a:0?");
  else if (!audioOnly) command.noAudio();
  if (audioOnly) command.noVideo();
  if (checked.format === "png" || checked.format === "jpeg") command.frames(1);
  if (checked.width !== undefined || checked.height !== undefined) command.videoFilters([{ filter: "scale", options: `${checked.width ?? -2}:${checked.height ?? -2}` }]);
  else if (video) command.videoFilters("scale=trunc(iw/2)*2:trunc(ih/2)*2");
  if (checked.vf) command.videoFilters(checked.vf);
  if (checked.fps !== undefined) command.fps(checked.fps);
  if (checked.sampleRate !== undefined) command.audioFrequency(checked.sampleRate);
  if (checked.channels !== undefined) command.audioChannels(checked.channels);
  if (checked.bitrateKbps !== undefined) command.audioBitrate(checked.bitrateKbps);

  // ACT: 库未公开 env 配置，仅适配当前实例；升级库时需核对这一内部钩子。
  const nativeCommand = command as typeof command & { _spawnFfmpeg(args: string[], options: SpawnOptions, ...callbacks: unknown[]): void };
  const spawn = nativeCommand._spawnFfmpeg.bind(command);
  nativeCommand._spawnFfmpeg = (args, options, ...callbacks) => spawn(args, {
    ...options, windowsHide: true,
    env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "FFREPORT")),
  }, ...callbacks);

  const chunks: Buffer[] = [];
  let size = 0;
  const output = new Writable({ autoDestroy: false, write(chunk: Buffer, _encoding, callback) {
    size += chunk.byteLength;
    if (size > maxMediaBytes) return callback(new Error("FFmpeg 输出超过大小限制"));
    chunks.push(chunk);
    callback();
  } });
  const runSignal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(5 * 60 * 1000)]);
  const abort = () => command.kill("SIGKILL");
  let closed: Promise<void> | undefined;
  runSignal.addEventListener("abort", abort, { once: true });
  try {
    await Promise.all([finished(output, { cleanup: true }), new Promise<void>((resolve, reject) => {
      command.output(output).on("start", () => {
        closed = new Promise<void>(resolveClose => command.ffmpegProc.once("close", () => resolveClose()));
        if (runSignal.aborted) abort();
      }).on("end", () => resolve()).on("error", reject).run();
    })]);
    runSignal.throwIfAborted();
    if (!size) throw new Error("FFmpeg 未返回媒体数据");
    return { data: Buffer.concat(chunks, size), mimeType: format.mimeType };
  } catch (error) {
    runSignal.throwIfAborted();
    throw error;
  } finally {
    runSignal.removeEventListener("abort", abort);
    abort();
    await closed;
    source.destroy();
    output.destroy();
  }
}
