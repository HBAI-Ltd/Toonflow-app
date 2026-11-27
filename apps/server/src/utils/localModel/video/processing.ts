import { execFile, spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { constants, copyFile, lstat, mkdtemp, rm, writeFile } from "@toonflow/file";
import type { FfprobeData } from "@toonflow/ffmpeg";
import { interpolateFramePair } from "@toonflow/node-video/rifeFrames";
import type { PercentRect } from "@toonflow/node-video/videoTextDetection";
import { restoreSubtitleFrame } from "@toonflow/node-video/subtitleRepair";
import { recognizeSubtitles } from "@toonflow/node-video/videoRecognition";
import { createTargetTracker } from "@toonflow/node-video/videoTracking";
import { createSubjectProcessor, getSubjectFrameSize } from "@toonflow/node-video/videoSubject";
import { createPortraitMatting } from "@toonflow/node-video/portraitMatting";
import { fitsUpscaleSize, predictUpscaleTile, upscaleTiles } from "@toonflow/node-image/upscaleTiles";
import type { VideoModelOptions } from "@/routes/localModels/processVideo";
import { prepareWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { runLocalModel } from "@/utils/localModel/inference";
import { requireDirectModelAccess } from "@/utils/multiTenant/gateway";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

// 只允许自包含的视频容器。协议和解封装器白名单同时应用到探测、解码和音轨复用。
const mediaOptions = ["-protocol_whitelist", "file", "-format_whitelist",
  "mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,avi,flv,asf,mpeg,mpegts,mpegvideo,ogg,mxf,dv,rm,nut,ivf,h264,hevc,obu,yuv4mpegpipe"];
const resultPath = /^assets\/[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}\/(?:interpolated\.mp4|result\.(?:mp4|webm|vtt))$/i;

function ratio(value: string | undefined, separator: string) {
  const [top = 0, bottom = 1] = String(value ?? "").split(separator).map(Number);
  return Number.isSafeInteger(top) && top > 0 && Number.isSafeInteger(bottom) && bottom > 0 ? [top, bottom] : undefined;
}

async function probeSource(ffprobe: string, source: string, signal: AbortSignal) {
  const { stdout } = await promisify(execFile)(ffprobe, ["-v", "error", ...mediaOptions, "-show_entries",
    "stream=index,codec_type,codec_name,avg_frame_rate,r_frame_rate,width,height,duration,nb_frames,start_time,sample_aspect_ratio:stream_disposition=attached_pic:stream_side_data=rotation:stream_tags=rotate:format=start_time,duration",
    "-of", "json", "-i", source], { encoding: "utf8", signal, windowsHide: true, killSignal: "SIGKILL", maxBuffer: 4 * 1024 * 1024 });
  const { streams, format } = JSON.parse(stdout) as FfprobeData;
  const video = streams.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  if (!video) throw new Error("请提供包含视频画面的文件");
  const rotation = Number(video.side_data_list?.find((entry: { rotation?: number }) => entry.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0);
  const swapped = Math.abs(rotation % 180) === 90;
  const width = Number(swapped ? video.height : video.width), height = Number(swapped ? video.width : video.height);
  const offset = Number(video.start_time ?? format.start_time ?? 0) - Number(format.start_time ?? 0);
  const rate = ratio(video.avg_frame_rate, "/") ?? ratio(video.r_frame_rate, "/");
  if (!rate || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
    || width * height * 3 > 100 * 1024 * 1024 || !Number.isFinite(offset)) throw new Error("无法取得视频帧率或画面尺寸");
  const aspect = ratio(video.sample_aspect_ratio, ":") ?? [1, 1];
  const estimatedFrames = Number(video.nb_frames) || Math.round((Number(video.duration) || Number(format.duration)) * rate[0] / rate[1]);
  const copyAudio = streams.filter(stream => stream.codec_type === "audio").every(stream => ["aac", "mp3", "alac", "ac3", "eac3"].includes(stream.codec_name ?? ""));
  return { width, height, offset, index: video.index, rate, sar: swapped ? aspect.reverse().join("/") : aspect.join("/"),
    estimatedFrames: Number.isSafeInteger(estimatedFrames) && estimatedFrames > 0 ? estimatedFrames : 0, copyAudio };
}

function startFfmpeg(executable: string, args: string[], signal: AbortSignal) {
  const child = spawn(executable, ["-hide_banner", "-loglevel", "error", "-nostdin", ...args], {
    stdio: "pipe", signal, killSignal: "SIGKILL", windowsHide: true,
  });
  let stderr = "";
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-4096); });
  const finished = new Promise<void>((resolve, reject) => {
    let failure: Error | undefined;
    child.once("error", error => { failure = error; });
    child.once("close", code => {
      if (signal.aborted) reject(signal.reason);
      else if (failure || code !== 0) reject(failure ?? new Error(stderr.trim() || "FFmpeg 执行失败"));
      else resolve();
    });
  });
  return { child, finished };
}

async function* readFrames(stream: Readable, size: number) {
  let frame = Buffer.allocUnsafe(size), filled = 0;
  for await (const chunk of stream) {
    const bytes = chunk as Buffer;
    for (let offset = 0; offset < bytes.length;) {
      const count = Math.min(bytes.length - offset, size - filled);
      bytes.copy(frame, filled, offset, offset + count);
      offset += count;
      filled += count;
      if (filled === size) {
        yield frame;
        frame = Buffer.allocUnsafe(size);
        filled = 0;
      }
    }
  }
  if (filled) throw new Error("解码的视频帧尺寸无效");
}

async function upscaleFrame(frame: Uint8Array, width: number, height: number, scale: number, signal: AbortSignal, progress: (fraction: number) => void) {
  const stride = width * scale * 3;
  const result = Buffer.allocUnsafe(stride * height * scale);
  const infer = (input: Float32Array) => predictUpscaleTile(input, runLocalModel, signal);
  for await (const tile of upscaleTiles(frame, width, height, { channels: 3, scale, signal, infer })) {
    const length = tile.width * 3;
    for (let y = 0; y < tile.height; y++) result.set(tile.rgb.subarray(y * length, (y + 1) * length), (tile.y + y) * stride + tile.x * 3);
    progress(tile.completed / tile.total);
  }
  return result;
}

async function readVideoFrame(ffmpeg: string, source: string, media: Awaited<ReturnType<typeof probeSource>>, time: number, signal: AbortSignal) {
  const size = media.width * media.height * 3;
  const { stdout } = await promisify(execFile)(ffmpeg, ["-v", "error", "-nostdin", ...mediaOptions, "-ss", Math.max(0, time - 0.000001).toFixed(6), "-i", source,
    "-map", `0:${media.index}`, "-frames:v", "1", "-an", "-sn", "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1"],
    { encoding: "buffer", maxBuffer: size + 65536, signal, windowsHide: true, killSignal: "SIGKILL" });
  if (stdout.length !== size) throw new Error("无法读取视频帧");
  return stdout;
}

export async function previewSubtitleFrame(root: string, source: string, time: number, area: PercentRect, signal: AbortSignal) {
  requireDirectModelAccess();
  const input = await resolveWorkspacePath(root, source);
  const release = lockWorkspaceFiles([input.path]);
  try {
    if (!(await lstat(input.path)).isFile()) throw new Error("来源必须是当前工作区内的普通文件");
    const tools = await prepareWorkspaceFfmpeg(signal);
    const media = await probeSource(tools.ffprobe, input.path, signal);
    const frame = await readVideoFrame(tools.ffmpeg, input.path, media, time, signal);
    const rgb = await restoreSubtitleFrame(frame, media.width, media.height, area, runLocalModel, signal);
    signal.throwIfAborted();
    requireDirectModelAccess();
    if (rgb === frame) return;
    const rgba = new Uint8Array(media.width * media.height * 4);
    for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
      rgba[j] = rgb[i]!;
      rgba[j + 1] = rgb[i + 1]!;
      rgba[j + 2] = rgb[i + 2]!;
      rgba[j + 3] = 255;
    }
    const { PhotonImage } = await import("@silvia-odwyer/photon-node");
    const image = new PhotonImage(rgba, media.width, media.height);
    try { return image.get_bytes(); } finally { image.free(); }
  } finally { release(); }
}

function cueTime(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
    .map(value => String(value).padStart(2, "0")).join(":") + "." + String(ms % 1000).padStart(3, "0");
}

async function writeSubtitles(ffmpeg: string, source: string, staged: string, media: Awaited<ReturnType<typeof probeSource>>,
  options: Extract<VideoModelOptions, { operation: "readSubtitles" }>, onProgress: (done: number, total: number) => void, signal: AbortSignal) {
  const stop = new AbortController(), lifetime = AbortSignal.any([signal, stop.signal]);
  const decoder = startFfmpeg(ffmpeg, [...mediaOptions, "-i", source, "-map", `0:${media.index}`, "-an", "-sn", "-dn", "-vf", "setpts=PTS-STARTPTS,fps=4",
    "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1"], lifetime);
  decoder.child.stdin.end();
  const cues: string[] = [];
  let text = "", start = 0, samples = 0;
  const duration = media.estimatedFrames * media.rate[1] / media.rate[0];
  function change(next: string, time: number) {
    if (next === text) return;
    if (text) cues.push(cueTime(start) + " --> " + cueTime(time) + "\n" + text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    text = next; start = time;
  }
  async function collect() {
    for await (const frame of readFrames(decoder.child.stdout, media.width * media.height * 3)) {
      lifetime.throwIfAborted();
      const value = await recognizeSubtitles(frame, media.width, media.height, options, runLocalModel, lifetime);
      change(value, samples / 4);
      onProgress(++samples, Math.max(1, samples, Math.ceil(duration * 4)));
    }
    change("", duration > 0 ? Math.min(samples / 4, duration) : samples / 4);
  }
  const work = collect();
  try {
    await Promise.all([decoder.finished, work]);
    if (!cues.length) throw new Error("选区内没有识别到字幕，请选择清晰且包含字幕的区域");
    await writeFile(staged, "WEBVTT\n\n" + cues.join("\n\n") + "\n", { flag: "wx", signal: lifetime });
  } finally { stop.abort(); await Promise.allSettled([decoder.finished, work]); }
}

async function processVideo(ffmpeg: string, source: string, temporary: string, media: Awaited<ReturnType<typeof probeSource>>, options: VideoModelOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  const stop = new AbortController();
  const lifetime = AbortSignal.any([signal, stop.signal]);
  const tasks: Promise<void>[] = [];
  const { width, height, rate } = media;
  const tracker = options.operation === "trackTarget" ? createTargetTracker(width, height, options, runLocalModel, lifetime) : undefined;
  const badFrame = options.operation === "repairBadFrame" ? Math.floor(options.time * rate[0]! / rate[1]! + 1e-5) : -1;
  if (badFrame === 0) throw new Error("请选取前后都有好帧的中间画面");
  const factor = options.operation === "interpolate" ? options.factor : 1;
  const scale = options.operation === "upscale" ? options.scale : 1;
  if (options.operation === "upscale" && !fitsUpscaleSize(width, height, scale)) throw new Error("输出尺寸超过上限，请降低倍率或裁剪原图");
  const output = options.operation === "reframe" ? getSubjectFrameSize(width, height, options.aspect) : { width: width * scale, height: height * scale };
  const processSubject = options.operation === "reframe" || options.operation === "blurBackground"
    ? createSubjectProcessor(width, height, options, runLocalModel, lifetime) : undefined;
  const matting = options.operation === "portraitMatting" ? options.outputMode : undefined;
  const matteFrame = matting ? createPortraitMatting(width, height, matting, runLocalModel, lifetime) : undefined;
  try {
    const decoder = startFfmpeg(ffmpeg, [...mediaOptions, "-i", source, "-map", `0:${media.index}`, "-an", "-sn", "-dn",
      "-vf", `setpts=PTS-STARTPTS,fps=${rate.join("/")}:eof_action=pass,scale=${width}:${height}`, "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1"], lifetime);
    tasks.push(decoder.finished);
    decoder.child.stdin.end();
    const transparent = matting === "transparent";
    const videoEncoding = transparent
      ? ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "22", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-auto-alt-ref", "0"]
      : ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "fast", "-movflags", "+faststart"];
    const audioEncoding = matting === "mask" ? ["-an"] : ["-map", "1:a?", ...(transparent ? ["-c:a", "libopus", "-b:a", "128k"] : media.copyAudio ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "192k"])];
    const encoder = startFfmpeg(ffmpeg, ["-f", "rawvideo", "-pix_fmt", transparent ? "rgba" : matting ? "gray" : "rgb24", "-video_size", `${output.width}x${output.height}`,
      "-framerate", `${factor * rate[0]}/${rate[1]}`, "-itsoffset", String(media.offset), "-i", "pipe:0", ...mediaOptions, "-i", source,
      "-map", "0:v:0", ...audioEncoding, "-vf", `pad=ceil(iw/2)*2:ceil(ih/2)*2:color=black@0,setsar=${media.sar}`, "-fps_mode", "passthrough",
      ...videoEncoding, "-n", temporary], lifetime);
    tasks.push(encoder.finished);
    encoder.child.stdout.resume();
    async function* transformFrames() {
      let previous: Buffer | undefined, completed = 0, repaired = false;
      for await (const current of readFrames(decoder.child.stdout, width * height * 3)) {
        lifetime.throwIfAborted();
        const total = media.estimatedFrames ? Math.max(media.estimatedFrames, completed + 1) : 0;
        if (options.operation === "restoreSubtitles") {
          const restored = await restoreSubtitleFrame(current, width, height, options, runLocalModel, lifetime);
          repaired ||= restored !== current;
          yield restored;
        } else if (tracker) {
          yield await tracker(current);
        } else if (options.operation === "repairBadFrame") {
          if (completed !== badFrame) {
            if (completed === badFrame + 1 && previous) {
              yield await interpolateFramePair(previous, current, width, height, runLocalModel, lifetime);
              repaired = true;
            }
            yield current;
            if (completed === badFrame - 1) previous = current;
          }
        } else if (options.operation === "upscale") {
          yield await upscaleFrame(current, width, height, scale, lifetime, fraction => onProgress(completed + fraction, total));
        } else if (matteFrame) {
          yield await matteFrame(current);
        } else if (processSubject) {
          yield await processSubject(current);
        } else if (previous) {
          yield previous;
          const middle = await interpolateFramePair(previous, current, width, height, runLocalModel, lifetime);
          if (factor === 4) yield await interpolateFramePair(previous, middle, width, height, runLocalModel, lifetime);
          yield middle;
          if (factor === 4) yield await interpolateFramePair(middle, current, width, height, runLocalModel, lifetime);
        }
        if (options.operation === "interpolate") previous = current;
        completed++;
        onProgress(completed, total);
      }
      if (!completed) throw new Error("没有可处理的视频帧");
      if (options.operation === "restoreSubtitles" && !repaired) throw new Error("选区内没有找到可擦除的字幕，请调整选区后重试");
      if (options.operation === "repairBadFrame" && !repaired) throw new Error("所选画面缺少相邻好帧，请选取片段中间的一帧");
      if (previous && options.operation === "interpolate") {
        if (completed < 2) throw new Error("视频至少需要两帧才能补帧");
        for (let i = 0; i < factor; i++) yield previous;
      }
    }
    tasks.push(pipeline(transformFrames(), encoder.child.stdin, { signal: lifetime }));
    await Promise.all(tasks);
  } finally {
    stop.abort();
    await Promise.allSettled(tasks);
  }
}

export async function processWorkspaceVideo(root: string, source: string, output: string, options: VideoModelOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  requireDirectModelAccess();
  signal.throwIfAborted();
  const transparent = options.operation === "portraitMatting" && options.outputMode === "transparent";
  const subtitles = options.operation === "readSubtitles";
  if (!resultPath.test(output) || transparent !== output.endsWith(".webm") || subtitles !== output.endsWith(".vtt")) throw Object.assign(new Error("文件路径无效"), { status: 400 });
  const [input, target] = await Promise.all([resolveWorkspacePath(root, source), resolveWorkspacePath(root, output)]);
  if (relative(join(root, output), target.path)) throw Object.assign(new Error("不能通过符号链接操作文件"), { status: 403 });
  const release = lockWorkspaceFiles([input.path, target.path]);
  let temporary: string | undefined;
  try {
    if (!(await lstat(input.path)).isFile()) throw Object.assign(new Error("来源必须是当前工作区内的普通文件"), { status: 400 });
    const existing = await lstat(target.path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (existing) throw Object.assign(new Error("已存在同名文件或目录"), { status: 409, code: "EEXIST" });
    const tools = await prepareWorkspaceFfmpeg(signal);
    const media = await probeSource(tools.ffprobe, input.path, signal);
    signal.throwIfAborted();
    temporary = await mkdtemp(join(tmpdir(), "toonflowVideo"));
    const staged = join(temporary, subtitles ? "result.vtt" : transparent ? "result.webm" : "result.mp4");
    if (options.operation === "readSubtitles") await writeSubtitles(tools.ffmpeg, input.path, staged, media, options, onProgress, signal);
    else await processVideo(tools.ffmpeg, input.path, staged, media, options, onProgress, signal);
    if ((await resolveWorkspacePath(root, output)).path !== target.path) throw Object.assign(new Error("文件路径无效"), { status: 403 });
    requireDirectModelAccess();
    signal.throwIfAborted();
    // 编码完成后独占复制成片，可跨卷发布。提交开始后不再取消复制。
    await copyFile(staged, target.path, constants.COPYFILE_EXCL);
  } finally {
    release();
    if (temporary) await rm(temporary, { recursive: true, force: true }).catch(error => console.warn("FFmpeg 临时目录清理失败", error));
  }
}
