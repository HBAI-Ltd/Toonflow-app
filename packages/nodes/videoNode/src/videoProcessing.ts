import type { BrowserFfmpegCommand, BrowserFfmpegFactory, FfprobeData } from "@toonflow/ffmpeg/browser";

export type VideoProcessingOptions = {
  action: "extractAudio" | "separate" | "trim";
  audioPath?: string;
  videoPath?: string;
  start?: number;
  end?: number;
};

function normalizePath(path: string) {
  if (!path || /[\x00-\x1f]/.test(path) || /^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path) || path.split(/[\\/]+/).includes("..")) {
    throw new Error("视频处理必须使用工作区相对路径");
  }
  return path.split(/[\\/]+/).filter(part => part && part !== ".").join("/").toLowerCase();
}

function probeMedia(ffmpeg: BrowserFfmpegFactory, path: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const command = ffmpeg(path);
  const cancel = () => command.kill();
  signal?.addEventListener("abort", cancel, { once: true });
  return new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe((error, data) => {
      if (signal?.aborted) reject(signal.reason);
      else if (error) reject(error);
      else resolve(data);
    });
  }).finally(() => signal?.removeEventListener("abort", cancel));
}

function runCommand(command: BrowserFfmpegCommand, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const cancel = () => command.kill();
  signal?.addEventListener("abort", cancel, { once: true });
  return new Promise<void>((resolve, reject) => {
    command.on("start", () => { if (signal?.aborted) command.kill(); });
    command.on("error", error => reject(signal?.aborted ? signal.reason : error));
    command.on("end", () => signal?.aborted ? reject(signal.reason) : resolve());
    command.run();
  }).finally(() => signal?.removeEventListener("abort", cancel));
}

/** 目录创建、唯一文件名和失败清理由调用方负责，原视频始终保留。 */
export async function processVideo(ffmpeg: BrowserFfmpegFactory, source: string, options: VideoProcessingOptions, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const sourcePath = normalizePath(source);
  if (!["extractAudio", "separate", "trim"].includes(options.action)) throw new Error("未知的视频处理操作");
  const needsAudio = options.action !== "trim";
  const needsVideo = options.action !== "extractAudio";
  if (needsAudio && !options.audioPath) throw new Error("缺少音轨输出路径");
  if (needsVideo && !options.videoPath) throw new Error("缺少视频输出路径");
  const outputs = [needsAudio ? options.audioPath : undefined, needsVideo ? options.videoPath : undefined].filter((path): path is string => !!path).map(normalizePath);
  if (outputs.includes(sourcePath) || new Set(outputs).size !== outputs.length) throw new Error("输出文件不能覆盖原视频或彼此覆盖");

  const media = await probeMedia(ffmpeg, source, signal);
  const video = media.streams.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  if (!video) throw new Error("文件不包含视频画面");
  const duration = Number(media.format.duration ?? video.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("无法读取有效的视频时长");
  if (needsAudio && !media.streams.some(stream => stream.codec_type === "audio")) throw new Error("该视频没有音轨");
  if (options.action === "trim" && (!Number.isFinite(options.start) || !Number.isFinite(options.end)
    || options.start! < 0 || options.end! <= options.start! || options.end! > duration)) {
    throw new Error("截取范围须满足 0 ≤ 开始时间 < 结束时间 ≤ 视频时长");
  }

  const command = ffmpeg(source);
  if (options.action === "trim") command.seekInput(options.start!);
  if (needsAudio) {
    command.output(options.audioPath!).noVideo().audioCodec("libmp3lame").audioBitrate(192).format("mp3")
      .outputOptions("-map", "0:a:0");
  }
  if (needsVideo) {
    // ACT: 重编码到 H.264，按帧精度截取并兼容播放器；奇数边长只补齐到偶数，不拉伸画面。
    command.output(options.videoPath!).videoCodec("libx264").format("mp4")
      .videoFilters("pad=ceil(iw/2)*2:ceil(ih/2)*2")
      .outputOptions("-map", `0:${video.index}`, "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart");
    if (options.action === "separate") command.noAudio();
    else command.duration(options.end! - options.start!).audioCodec("aac").audioBitrate(192).outputOptions("-map", "0:a:0?");
  }
  await runCommand(command, signal);
  const result = await probeMedia(ffmpeg, needsVideo ? options.videoPath! : options.audioPath!, signal);
  const resultVideo = result.streams.find(stream => stream.codec_type === "video");
  const resultDuration = Number(result.format.duration);
  if (!Number.isFinite(resultDuration) || resultDuration <= 0 || (needsVideo && !resultVideo)) throw new Error("生成的媒体文件无效");
  return { duration: resultDuration, width: resultVideo?.width ?? video.width, height: resultVideo?.height ?? video.height };
}
