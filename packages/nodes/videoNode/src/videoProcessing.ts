import type { BrowserFfmpegFactory } from "@toonflow/ffmpeg/browser";
import { probeMedia, runCommand } from "@toonflow/node-shared/mediaCommands";
import { fitSize, tempo, videoFrameRate } from "./videoToolJob";

export type VideoProcessingOptions = {
  action: "extractAudio" | "separate" | "trim";
  audioPath?: string;
  videoPath?: string;
  start?: number;
  end?: number;
  /** 仅截取：把截取片段匀速拉伸到该时长（秒），画面与声音同步变速。 */
  stretchTo?: number;
};

function normalizePath(path: string) {
  if (!path || /[\x00-\x1f]/.test(path) || /^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path) || path.split(/[\\/]+/).includes("..")) {
    throw new Error("视频处理必须使用工作区相对路径");
  }
  return path.split(/[\\/]+/).filter(part => part && part !== ".").join("/").toLowerCase();
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
  if (options.stretchTo !== undefined && (options.action !== "trim" || !Number.isFinite(options.stretchTo) || options.stretchTo <= 0)) throw new Error("拉伸时长须为正数且只用于截取");
  const speed = options.stretchTo ? (options.end! - options.start!) / options.stretchTo : 1;

  const command = ffmpeg(source);
  if (options.action === "trim") command.seekInput(options.start!);
  if (needsAudio) {
    command.output(options.audioPath!).noVideo().audioCodec("libmp3lame").audioBitrate(192).format("mp3")
      .outputOptions("-map", "0:a:0");
  }
  if (needsVideo) {
    // ACT: 重编码到 H.264，按帧精度截取并兼容播放器；奇数边长只补齐到偶数，不拉伸画面。
    command.output(options.videoPath!).videoCodec("libx264").format("mp4")
      .videoFilters([...(speed === 1 ? [] : [`setpts=(PTS-STARTPTS)/${speed}`]), "pad=ceil(iw/2)*2:ceil(ih/2)*2"])
      .outputOptions("-map", `0:${video.index}`, "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart");
    if (options.action === "separate") command.noAudio();
    else command.duration((options.end! - options.start!) / speed).audioCodec("aac").audioBitrate(192).outputOptions("-map", "0:a:0?");
    if (speed !== 1 && media.streams.some(stream => stream.codec_type === "audio")) command.audioFilters(tempo(speed));
  }
  await runCommand(command, signal);
  const result = await probeMedia(ffmpeg, needsVideo ? options.videoPath! : options.audioPath!, signal);
  const resultVideo = result.streams.find(stream => stream.codec_type === "video");
  const resultDuration = Number(result.format.duration);
  if (!Number.isFinite(resultDuration) || resultDuration <= 0 || (needsVideo && !resultVideo)) throw new Error("生成的媒体文件无效");
  return { duration: resultDuration, width: resultVideo?.width ?? video.width, height: resultVideo?.height ?? video.height };
}

/** duration 为替换片段要使用的内容时长，与区间时长不同时匀速拉伸到区间时长；省略则按区间时长截取。 */
export type VideoReplacement = { start: number; end: number; path: string; duration?: number };

/** 用新片段替换原视频中互不重叠的区间，画面缩放到原视频尺寸，声音统一为 48 kHz 立体声；目录与失败清理由调用方负责。 */
export async function spliceVideo(ffmpeg: BrowserFfmpegFactory, source: string, replacements: VideoReplacement[], videoPath: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const sources = [source, ...replacements.map(item => item.path)];
  if (sources.map(normalizePath).includes(normalizePath(videoPath))) throw new Error("输出文件不能覆盖原视频或替换片段");
  const media = await Promise.all(sources.map(path => probeMedia(ffmpeg, path, signal)));
  const streams = media.map(item => ({
    video: item.streams.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic),
    audio: item.streams.find(stream => stream.codec_type === "audio"),
  }));
  const video = streams[0]!.video;
  if (!video || streams.some(item => !item.video)) throw new Error("原视频或替换片段不包含视频画面");
  const duration = Number(media[0]!.format.duration ?? video.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("无法读取有效的视频时长");
  const ranges = replacements.map((item, index) => ({ ...item, input: index + 1 })).sort((left, right) => left.start - right.start);
  // read 为从输入读取的时长，length 为放进成片的时长，两者不同则匀速拉伸。
  const segments: { input: number; start?: number; read: number; length: number }[] = [];
  let cursor = 0;
  for (const range of ranges) {
    // ACT: 容许 0.05 秒的时长探测误差，超出部分按原片结尾截断。
    if (!(range.start >= cursor - 0.000001 && range.end > range.start && range.start < duration && range.end <= duration + 0.05)) throw new Error("替换区间须互不重叠且位于原视频时长内");
    if (range.duration !== undefined && !(Number.isFinite(range.duration) && range.duration > 0)) throw new Error("替换片段的时长须为正数");
    if (range.start - cursor > 0.001) segments.push({ input: 0, start: cursor, read: range.start - cursor, length: range.start - cursor });
    const length = Math.min(range.end, duration) - range.start;
    segments.push({ input: range.input, read: range.duration ?? length, length });
    cursor = Math.min(range.end, duration);
  }
  if (duration - cursor > 0.001) segments.push({ input: 0, start: cursor, read: duration - cursor, length: duration - cursor });

  const rotate = (video as { side_data_list?: { rotation?: number }[] }).side_data_list?.find(item => item.rotation !== undefined)?.rotation ?? Number(video.tags?.rotate ?? 0);
  const swapped = Math.abs(rotate % 180) === 90;
  const width = Number(swapped ? video.height : video.width);
  const height = Number(swapped ? video.width : video.height);
  if (!(width > 0 && height > 0)) throw new Error("无法读取原视频画面尺寸");
  const rate = videoFrameRate(video)?.expression ?? "30";
  const sound = streams.some(item => item.audio);
  const command = ffmpeg(sources[segments[0]!.input]!);
  const graph: string[] = [];
  // ACT: 每段单独作为输入并在输入端定位，避免同一原片被多条滤镜分支共用时缓存大量解码帧。
  segments.forEach((segment, index) => {
    if (index) command.input(sources[segment.input]!);
    if (segment.start !== undefined) command.seekInput(segment.start);
    command.inputOptions("-t", String(segment.read));
    const { video: picture, audio } = streams[segment.input]!;
    const speed = segment.read / segment.length;
    // 生成片段可能略短于选区：补齐末帧再截到选区时长，保证后续画面与声音不漂移。
    graph.push(`[${index}:${picture!.index}]setpts=(PTS-STARTPTS)/${speed},${fitSize(Math.max(2, width - width % 2), Math.max(2, height - height % 2))},fps=${rate},format=yuv420p,tpad=stop_mode=clone:stop_duration=${segment.length},trim=duration=${segment.length},setpts=PTS-STARTPTS[v${index}]`);
    if (sound) graph.push(`${audio ? `[${index}:${audio.index}]asetpts=PTS-STARTPTS,${speed === 1 ? "" : `${tempo(speed)},`}aresample=48000,aformat=channel_layouts=stereo,apad` : "anullsrc=r=48000:cl=stereo"},atrim=duration=${segment.length},asetpts=PTS-STARTPTS[a${index}]`);
  });
  graph.push(`${segments.map((_, index) => `[v${index}]${sound ? `[a${index}]` : ""}`).join("")}concat=n=${segments.length}:v=1:a=${Number(sound)}[v]${sound ? "[a]" : ""}`);
  command.complexFilter(graph).output(videoPath).outputOptions("-map", "[v]").videoCodec("libx264").format("mp4")
    .outputOptions("-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart");
  if (sound) command.outputOptions("-map", "[a]").audioCodec("aac").audioBitrate(192);
  await runCommand(command, signal);
  const result = await probeMedia(ffmpeg, videoPath, signal);
  const resultDuration = Number(result.format.duration);
  if (!result.streams.some(stream => stream.codec_type === "video") || !Number.isFinite(resultDuration) || resultDuration <= 0) throw new Error("生成的媒体文件无效");
  return { duration: resultDuration };
}
