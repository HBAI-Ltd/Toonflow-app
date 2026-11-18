import type { BrowserFfmpegCommand, BrowserFfmpegFactory, FfprobeData, WorkspaceFiles } from "@toonflow/nodes-scaffold/runtime";
import { createSceneDetector } from "./sceneDetector";

export type AnalysisScene = {
  index: number;
  start: number;
  end: number;
  image?: string;
  video?: string;
  sampleTimes?: number[];
  annotation?: {
    shotSize: string;
    cameraAngle: string;
    movement: string;
    description: string;
  };
};

export type AnalysisResult = {
  scenes: AnalysisScene[];
  audio?: string;
  duration: number;
  width: number;
  height: number;
  manifest: string;
  warning?: string;
  sourceVideoOffset?: number;
  sourceVideoStreamIndex?: number;
  overview?: {
    summary: string;
    narrative: string;
    rhythm: string;
    editing: string;
    focusResponse: string;
  };
  ai?: { providerId: string; modelId: string; analyzedAt: string; focus?: string; overviewError?: string };
};

export type AnalysisOptions = {
  ffmpeg: BrowserFfmpegFactory;
  workspace: WorkspaceFiles;
  source: string;
  directory: string;
  method: "adaptive" | "content";
  threshold: number;
  minSceneSeconds: number;
  frames: boolean;
  clips: boolean;
  audio: boolean;
  signal: AbortSignal;
  onProgress: (percent: number, label: string) => void;
};

export function analysisPath(path: string) {
  if (!path || /[\x00-\x1f]/.test(path) || /^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path) || path.split(/[\\/]+/).includes("..")) {
    throw new Error("拉片素材必须使用工作区内的相对路径");
  }
  return path.split(/[\\/]+/).filter(part => part && part !== ".").join("/");
}

function probe(ffmpeg: BrowserFfmpegFactory, path: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const command = ffmpeg(path);
  const cancel = () => command.kill();
  signal.addEventListener("abort", cancel, { once: true });
  return new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe((error, data) => {
      if (signal.aborted) reject(signal.reason);
      else if (error) reject(error);
      else resolve(data);
    });
  }).finally(() => signal.removeEventListener("abort", cancel));
}

export function runFfmpeg(command: BrowserFfmpegCommand, signal: AbortSignal) {
  signal.throwIfAborted();
  const cancel = () => command.kill();
  signal.addEventListener("abort", cancel, { once: true });
  return new Promise<void>((resolve, reject) => {
    command.on("start", () => { if (signal.aborted) command.kill(); });
    command.on("error", error => reject(signal.aborted ? signal.reason : error));
    command.on("end", () => signal.aborted ? reject(signal.reason) : resolve());
    command.run();
  }).finally(() => signal.removeEventListener("abort", cancel));
}

async function detectScenes(options: AnalysisOptions, videoIndex: number, estimatedDuration: number, fallbackFrameDuration: number, streamDuration: number) {
  const { ffmpeg, workspace, source, directory, signal, onProgress } = options;
  const temporary = `${directory}/decodedFrames`;
  await workspace.mkdir(temporary);
  const detector = createSceneDetector(options);
  const timestamps: number[] = [];
  const cuts: number[] = [];
  let frameBytes = 0;
  let frameCount = 0;
  let decodedCount = 0;
  let lastTime = 0;
  let lastDuration = 0;
  let lastDelta = fallbackFrameDuration;
  let openedChunk = -1;
  let queuedChunk = -1;
  let queue = Promise.resolve();
  let failure: unknown;
  const command = ffmpeg(source, { stdoutLines: 20 })
    .noAudio()
    .videoFilters("setpts=PTS-STARTPTS,scale=256:256:force_original_aspect_ratio=decrease:flags=bilinear,format=rgb24,showinfo=checksum=0")
    .videoCodec("rawvideo")
    .format("segment")
    .outputOptions("-map", `0:${videoIndex}`, "-pix_fmt", "rgb24", "-fps_mode", "passthrough",
      "-segment_time", "1", "-segment_format", "rawvideo", "-reset_timestamps", "0", "-loglevel", "info")
    .output(`${temporary}/frame%08d.rgb`);

  function fail(error: unknown) {
    failure ??= error;
    command.kill();
  }

  function enqueueChunk(index: number) {
    if (index <= queuedChunk) return;
    queuedChunk = index;
    queue = queue.then(async () => {
      if (failure) return;
      signal.throwIfAborted();
      const path = `${temporary}/frame${String(index).padStart(8, "0")}.rgb`;
      const content = new Uint8Array(await workspace.read(path));
      signal.throwIfAborted();
      if (!frameBytes || !content.byteLength || content.byteLength % frameBytes) throw new Error("解码帧文件不完整，已停止拉片");
      for (let offset = 0; offset < content.byteLength; offset += frameBytes) {
        const time = timestamps[frameCount];
        if (time === undefined) throw new Error("视频帧与时间戳无法对应，已停止拉片");
        cuts.push(...detector.processFrame(content.subarray(offset, offset + frameBytes), time));
        frameCount++;
        // ACT: 每 12 帧让出主线程，保证长视频处理中仍能响应取消和画布操作。
        if (frameCount % 12 === 0) {
          onProgress(Math.min(55, 5 + time / estimatedDuration * 50), `检测分镜 · ${frameCount} 帧`);
          await new Promise<void>(resolve => setTimeout(resolve, 0));
          signal.throwIfAborted();
        }
      }
      await workspace.remove(path);
    }).catch(fail);
  }

  command.on("stderr", line => {
    if (failure || signal.aborted) return;
    try {
      if (line.includes("showinfo") && /\bn:\s*\d+/.test(line)) {
        const index = Number(line.match(/\bn:\s*(\d+)/)?.[1]);
        const time = Number(line.match(/\bpts_time:\s*([-\d.e+]+)/)?.[1]);
        const size = line.match(/\bs:(\d+)x(\d+)/);
        const bytes = Number(size?.[1]) * Number(size?.[2]) * 3;
        const duration = Number(line.match(/\bduration_time:\s*([-\d.e+]+)/)?.[1]);
        if (index !== decodedCount || !Number.isFinite(time) || time < 0 || (index && time < lastTime)
          || !bytes || (frameBytes && bytes !== frameBytes)) throw new Error("视频时间戳或画面尺寸发生异常，无法可靠切分");
        frameBytes = bytes;
        if (index && time > lastTime) lastDelta = time - lastTime;
        lastTime = time;
        lastDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
        timestamps.push(time);
        decodedCount++;
      }
      const opening = line.match(/Opening '.*[\\/]frame(\d+)\.rgb' for writing/);
      if (opening) {
        const index = Number(opening[1]);
        if (index !== openedChunk + 1) throw new Error("解码分块顺序异常");
        // segment 在打开下一文件前关闭上一文件；只读取已经写完的分块。
        if (openedChunk >= 0) enqueueChunk(openedChunk);
        openedChunk = index;
      }
    } catch (error) {
      fail(error);
    }
  });

  let commandFailure: unknown;
  try {
    await runFfmpeg(command, signal);
  } catch (error) {
    commandFailure = error;
  }
  if (!commandFailure && !failure) {
    // 完成后用目录补齐最后一块，也兼容 FFmpeg 没有输出 Opening 日志的版本。
    try {
      const { entries } = await workspace.list(temporary);
      const remaining = entries.filter(entry => /^frame\d{8}\.rgb$/.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of remaining) enqueueChunk(Number(entry.name.slice(5, 13)));
    } catch (error) {
      failure ??= error;
    }
  }
  await queue;
  signal.throwIfAborted();
  if (failure) throw failure;
  if (commandFailure) throw commandFailure;
  if (!decodedCount || frameCount !== decodedCount) throw new Error("视频帧数与解码结果不一致，已停止拉片");
  cuts.push(...detector.finish());
  await workspace.remove(temporary, true);
  // ACT: VFR 的最后一帧不能沿用前一帧间隔；优先取帧自身时长或有效流时长。
  const duration = lastDuration > 0 ? lastTime + lastDuration
    : Number.isFinite(streamDuration) && streamDuration > lastTime ? streamDuration
      : lastTime + lastDelta;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("无法确定视频的结束时间");
  return { cuts, duration, timestamps };
}

/** 文件创建在调用方的独立目录中；未提交时由调用方清理整次操作。 */
export async function analyzeVideo(options: AnalysisOptions): Promise<AnalysisResult> {
  const { ffmpeg, workspace, signal, onProgress } = options;
  const source = analysisPath(options.source);
  const directory = analysisPath(options.directory);
  if (source.toLowerCase().startsWith(`${directory.toLowerCase()}/`)) throw new Error("输出目录不能包含输入视频");
  if (!options.frames && !options.clips && !options.audio) throw new Error("请至少选择一个拆解维度");
  createSceneDetector(options);
  signal.throwIfAborted();
  onProgress(1, "读取视频信息");
  const media = await probe(ffmpeg, source, signal);
  const video = media.streams.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  if (!video || !video.width || !video.height) throw new Error("素材没有可读取的视频画面");
  const formatStart = Number(media.format.start_time) || 0;
  const videoStart = Number(video.start_time);
  const offset = Number.isFinite(videoStart) ? Math.max(0, videoStart - formatStart) : 0;
  const videoDuration = Number(video.duration);
  const estimatedDuration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : Number(media.format.duration) - offset;
  if (!Number.isFinite(estimatedDuration) || estimatedDuration <= 0) throw new Error("无法读取有效的视频时长");
  const rate = String(video.avg_frame_rate || video.r_frame_rate || "25/1").split("/").map(Number);
  const fps = rate[0] / (rate[1] || 1);
  const fallbackFrameDuration = Number.isFinite(fps) && fps > 0 ? 1 / fps : 1 / 25;
  const audioPresent = media.streams.some(stream => stream.codec_type === "audio");
  let duration = estimatedDuration;
  let boundaries = [0, duration];
  let frameTimes: number[] = [];
  if (options.frames || options.clips) {
    const detected = await detectScenes({ ...options, source, directory }, video.index, estimatedDuration, fallbackFrameDuration, videoDuration);
    duration = detected.duration;
    frameTimes = detected.timestamps;
    boundaries = [0, ...[...new Set(detected.cuts)].filter(time => time > 0 && time < duration).sort((a, b) => a - b), duration];
  }
  const rotationData = video as typeof video & { side_data_list?: { rotation?: number }[] };
  const rotation = Number(rotationData.side_data_list?.find(data => data.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0);
  const swapped = Math.abs(rotation % 180) === 90;
  const result: AnalysisResult = {
    scenes: boundaries.slice(0, -1).map((start, index) => ({ index: index + 1, start, end: boundaries[index + 1] })),
    duration,
    width: swapped ? video.height : video.width,
    height: swapped ? video.width : video.height,
    manifest: `${directory}/sceneManifest.json`,
    sourceVideoOffset: offset,
    sourceVideoStreamIndex: video.index,
  };
  if (frameTimes.length) {
    let frameIndex = 0;
    for (const scene of result.scenes) {
      const first = frameIndex;
      while (frameIndex < frameTimes.length && frameTimes[frameIndex] < scene.end) frameIndex++;
      const count = frameIndex - first;
      scene.sampleTimes = [...new Set([0.1, 0.5, 0.9].map(position => frameTimes[first + Math.round((count - 1) * position)]))];
    }
  }
  if (options.audio && !audioPresent) result.warning = "视频没有音轨，已跳过原音轨提取";
  if (!options.frames && !options.clips && !audioPresent) throw new Error("该视频没有音轨可提取");
  const total = result.scenes.length * (Number(options.frames) + Number(options.clips)) + Number(options.audio && audioPresent);
  let completed = 0;
  function progress(label: string) {
    onProgress(60 + (completed++ / Math.max(1, total)) * 37, label);
  }
  for (const scene of result.scenes) {
    signal.throwIfAborted();
    const name = String(scene.index).padStart(3, "0");
    if (options.frames) {
      progress(`提取关键帧 · ${scene.index}/${result.scenes.length}`);
      scene.image = `${directory}/shot${name}.jpg`;
      const midpoint = (scene.start + scene.end) / 2;
      let left = 0;
      let right = frameTimes.length;
      while (left < right) {
        const middle = Math.floor((left + right) / 2);
        if (frameTimes[middle] <= midpoint) left = middle + 1;
        else right = middle;
      }
      const frameTime = frameTimes[Math.max(0, left - 1)];
      await runFfmpeg(ffmpeg(source).seekInput(Math.max(0, offset + frameTime - 0.000001))
        .noAudio().outputOptions("-map", `0:${video.index}`, "-q:v", "2").frames(1).output(scene.image), signal);
      const imageInfo = await probe(ffmpeg, scene.image, signal);
      if (!imageInfo.streams.some(stream => stream.codec_type === "video" && stream.width && stream.height)) throw new Error(`第 ${scene.index} 个关键帧生成失败`);
    }
    if (options.clips) {
      progress(`切割视频 · ${scene.index}/${result.scenes.length}`);
      scene.video = `${directory}/shot${name}.mp4`;
      // ACT: 重编码用于按检测帧边界切割，避免 stream copy 只能在关键帧附近切开的误差。
      await runFfmpeg(ffmpeg(source).seekInput(offset + scene.start).duration(scene.end - scene.start)
        .videoCodec("libx264").audioCodec("aac").audioBitrate(192).format("mp4")
        .videoFilters("pad=ceil(iw/2)*2:ceil(ih/2)*2")
        .outputOptions("-map", `0:${video.index}`, "-map", "0:a:0?", "-preset", "fast", "-crf", "18",
          "-pix_fmt", "yuv420p", "-fps_mode", "passthrough", "-movflags", "+faststart").output(scene.video), signal);
      const clipInfo = await probe(ffmpeg, scene.video, signal);
      if (!clipInfo.streams.some(stream => stream.codec_type === "video") || !(Number(clipInfo.format.duration) > 0)) throw new Error(`第 ${scene.index} 个视频片段生成失败`);
    }
  }
  if (options.audio && audioPresent) {
    progress("提取原音轨");
    result.audio = `${directory}/originalAudio.mp3`;
    await runFfmpeg(ffmpeg(source).noVideo().audioCodec("libmp3lame").audioBitrate(192).format("mp3")
      .outputOptions("-map", "0:a:0").output(result.audio), signal);
    const audioInfo = await probe(ffmpeg, result.audio, signal);
    if (!audioInfo.streams.some(stream => stream.codec_type === "audio") || !(Number(audioInfo.format.duration) > 0)) throw new Error("原音轨生成失败");
  }
  signal.throwIfAborted();
  await workspace.writeJson(result.manifest, {
    version: 1, source, ...result,
    detection: { algorithm: "rgbHistogramV1", method: options.method, threshold: options.threshold, minSceneSeconds: options.minSceneSeconds, timeOrigin: "firstVideoFrame", sourceVideoOffset: offset },
  }, true);
  onProgress(98, "生成画布素材");
  return result;
}
