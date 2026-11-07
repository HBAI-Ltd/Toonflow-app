import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { createReadStream, lstat, mkdir, writeAtomic } from "@toonflow/file";
import type { FfprobeData, ToolContext } from "@toonflow/tools-scaffold/runtime";
import { z } from "zod";
import { accountHash, downloadResult, queryTask, requireConfig, resolutionSchema, submitTask, uploadSource } from "./api";
import type { UpscaleConfig } from "./api";
import type { UpscaleQuote, UpscaleResolution, UpscaleTask, UpscaleTaskStatus, VideoInfo } from "./types";

const limit = 100 * 1024 * 1024;
const resolutionSettings = {
  "720p": { height: 720, pricePerSecond: 0.003 },
  "1080p": { height: 1080, pricePerSecond: 0.005 },
  "4k": { height: 2160, pricePerSecond: 0.017 },
};
const hashSchema = z.string().regex(/^[a-f\d]{64}$/);
const videoSchema = z.strictObject({ duration: z.number().positive(), width: z.number().int().positive(), height: z.number().int().positive(),
  frameRate: z.number().positive(), hasAudio: z.boolean(), audioDuration: z.number().positive().optional() });
const taskSchema = z.strictObject({
  taskId: z.string().uuid(), state: z.enum(["uploading", "submitting", "processing", "succeeded", "failed"]),
  path: z.string().min(1).max(4096), resolution: resolutionSchema,
  estimatedCostUsd: z.number().nonnegative(), costUsd: z.number().nonnegative().optional(),
  result: z.strictObject({ path: z.string().min(1), mimeType: z.literal("video/mp4"), width: z.number().positive(), height: z.number().positive(), duration: z.number().positive() }).optional(),
  message: z.string().max(2000).optional(), workspace: hashSchema, account: hashSchema, sourceHash: hashSchema, source: videoSchema,
  objectKey: z.string().min(1).max(256), remoteId: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/).optional(), outputHash: hashSchema.optional(),
});
const queuesKey = Symbol.for("toonflow.videoUpscale.taskQueues");
const runtime = globalThis as typeof globalThis & { [queuesKey]?: Map<string, Promise<void>> };
// 插件更新会重新加载模块，同一进程仍须串行处理已有任务，避免重复提交。
const taskQueues = runtime[queuesKey] ??= new Map<string, Promise<void>>();

function hash(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function taskFile(context: ToolContext, taskId: string) {
  const dataDirectory = process.env.TOONFLOW_DATA_DIR;
  if (!dataDirectory || !isAbsolute(dataDirectory)) throw new Error("宿主未提供有效的数据目录，无法安全保存升清任务");
  const cwd = resolve(context.cwd);
  const workspace = hash(process.platform === "win32" ? cwd.toLowerCase() : cwd);
  const directory = join(dataDirectory, "videoUpscale", `workspace${workspace}`);
  return { workspace, directory, path: join(directory, `task${taskId.replaceAll("-", "")}.json`) };
}

async function serial<T>(key: string, work: () => Promise<T>) {
  const previous = taskQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>(resolve => { release = resolve; });
  const tail = previous.then(() => next);
  taskQueues.set(key, tail);
  await previous;
  try { return await work(); }
  finally { release(); if (taskQueues.get(key) === tail) taskQueues.delete(key); }
}

async function privateDirectory(path: string, create: boolean) {
  const directory = dirname(path);
  for (const folder of [dirname(directory), directory]) {
    let info = await lstat(folder).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return null; throw error; });
    if (!info && create) {
      await mkdir(folder, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
      info = await lstat(folder);
    }
    if (!info) return false;
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("升清任务数据目录不能是文件或符号链接");
  }
  return true;
}

async function loadTask(path: string) {
  try {
    if (!await privateDirectory(path, false)) return undefined;
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 65536) throw new Error("任务记录无效");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const value of createReadStream(path, { end: 65536 })) {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      size += chunk.length;
      if (size > 65536) throw new Error("任务记录过大");
      chunks.push(chunk);
    }
    return taskSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8"))) as UpscaleTask;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new Error("升清任务记录损坏或无法读取，请检查数据目录");
  }
}

async function saveTask(path: string, task: UpscaleTask, exclusive = false) {
  await privateDirectory(path, true);
  const info = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return null; throw error; });
  if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error("升清任务记录不能是文件夹或符号链接");
  await writeAtomic(path, JSON.stringify(taskSchema.parse(task)), { exclusive, mode: 0o600 });
}

function view(task: UpscaleTask): UpscaleTaskStatus {
  const { taskId, state, path, resolution, estimatedCostUsd, costUsd, result, message } = task;
  return { taskId, state, path, resolution, estimatedCostUsd, ...(costUsd === undefined ? {} : { costUsd }),
    ...(result ? { result } : {}), ...(message ? { message } : {}) };
}

async function readVideo(context: ToolContext, path: string, signal?: AbortSignal) {
  const info = await context.files.stat(path);
  if (!info.isFile() || info.size <= 0 || info.size > limit) throw new Error("视频必须为非空文件且不超过 100 MB");
  const bytes = await context.files.readFile(path, false, { maxBytes: limit, signal });
  if (!bytes.byteLength) throw new Error("视频文件为空");
  return bytes;
}

function parseRate(value: string | undefined) {
  if (!value || !/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(value)) return NaN;
  const [numerator, denominator = "1"] = value.split("/");
  return Number(numerator) / Number(denominator);
}

async function inspectVideo(context: ToolContext, path: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const absolute = await context.resolvePath(path);
  const ffmpeg = await context.ffmpeg(signal);
  const command = ffmpeg(absolute);
  const cancel = () => command.kill("SIGTERM");
  signal?.addEventListener("abort", cancel, { once: true });
  const probe = await new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe((error, data) => {
      if (signal?.aborted) reject(signal.reason);
      else if (error) reject(new Error("无法读取视频信息，请检查文件及 FFprobe 配置"));
      else resolve(data);
    });
  }).finally(() => signal?.removeEventListener("abort", cancel));
  const video = probe.streams.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  const audio = probe.streams.find(stream => stream.codec_type === "audio");
  if (!video || !video.width || !video.height) throw new Error("文件不包含有效的视频画面");
  const duration = Number(probe.format.duration ?? video.duration);
  const frameRate = parseRate(video.avg_frame_rate);
  const nominalFrameRate = parseRate(video.r_frame_rate);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(frameRate) || frameRate <= 0 ||
      !Number.isFinite(nominalFrameRate) || nominalFrameRate <= 0) throw new Error("无法确定视频时长或帧率");
  const audioDuration = audio ? Number(audio.duration ?? probe.format.duration) : undefined;
  if (audio && (!Number.isFinite(audioDuration) || audioDuration! <= 0)) throw new Error("无法确定视频音轨时长");
  return { duration, width: video.width, height: video.height, frameRate, nominalFrameRate, hasAudio: !!audio,
    ...(audioDuration ? { audioDuration } : {}), format: probe.format.format_name ?? "" };
}

export async function quote(context: ToolContext, path: string, resolution: UpscaleResolution, signal?: AbortSignal): Promise<UpscaleQuote> {
  const bytes = await readVideo(context, path, signal);
  const sourceHash = hash(bytes);
  const info = await inspectVideo(context, path, signal);
  if (hash(await readVideo(context, path, signal)) !== sourceHash) throw new Error("视频在读取期间发生变化，请重新报价");
  if (info.duration > 30 || info.frameRate > 30 || info.nominalFrameRate > 30) {
    throw new Error("仅支持时长不超过 30 秒且帧率不超过 30 fps 的视频");
  }
  const target = resolutionSettings[resolution];
  const shortSide = Math.min(info.width, info.height);
  if (shortSide > 1440 || shortSide >= target.height) throw new Error(`源视频短边须小于 ${target.height} 像素，且不超过 1440 像素`);
  const { duration, width, height, frameRate, hasAudio, audioDuration } = info;
  return { path, sourceHash, resolution, duration, width, height, frameRate, hasAudio, ...(audioDuration ? { audioDuration } : {}),
    estimatedCostUsd: Number((duration * target.pricePerSecond).toFixed(6)) };
}

async function assertSource(context: ToolContext, task: UpscaleTask, signal?: AbortSignal) {
  if (hash(await readVideo(context, task.path, signal)) !== task.sourceHash) throw new Error("原视频已变化，请恢复原文件后继续查询该任务");
}

async function assertOutput(context: ToolContext, task: UpscaleTask, signal?: AbortSignal) {
  if (!task.result || !task.outputHash || hash(await readVideo(context, task.result.path, signal)) !== task.outputHash) {
    throw new Error("升清结果文件已丢失或发生变化，请检查工作区");
  }
}

function checkOwner(task: UpscaleTask, taskId: string, workspace: string, account: string) {
  if (task.taskId !== taskId || task.workspace !== workspace || task.account !== account || task.objectKey !== `videoUpscale/task${taskId.replaceAll("-", "")}/source.mp4`) {
    throw new Error("升清任务与当前工作区或账号配置不匹配");
  }
}

async function resumeUpload(context: ToolContext, config: UpscaleConfig, taskPath: string, task: UpscaleTask, signal?: AbortSignal) {
  const bytes = await readVideo(context, task.path, signal);
  if (hash(bytes) !== task.sourceHash) throw new Error("原视频已变化，请重新报价");
  const videoUrl = await uploadSource(config, task.objectKey, bytes, signal);
  signal?.throwIfAborted();
  // ACT: 持久化提交状态后，无论重启还是网络中断均不自动重发，避免重复计费。
  task.state = "submitting";
  task.message = "提交结果未知时请先在 reAPI 控制台核对，系统不会自动重复提交";
  await saveTask(taskPath, task);
  let remote;
  try { remote = await submitTask(config, videoUrl, task.taskId, task.resolution, signal); }
  catch (error) {
    const responseStatus = (error as { responseStatus?: number }).responseStatus;
    if (responseStatus && [400, 401, 402, 403, 422, 429].includes(responseStatus)) {
      task.state = "failed";
      task.message = `reAPI 拒绝了请求（HTTP ${responseStatus}），请检查 API Key、余额或请求限制后重新报价`;
      await saveTask(taskPath, task);
    }
    return view(task);
  }
  task.remoteId = remote.id;
  task.state = "processing";
  delete task.message;
  await saveTask(taskPath, task);
  return view(task);
}

export async function start(context: ToolContext, request: { taskId: string; path: string; resolution: UpscaleResolution; sourceHash: string; estimatedCostUsd: number }, signal?: AbortSignal) {
  const config = requireConfig(context.config);
  const location = taskFile(context, request.taskId);
  return serial(location.path, async () => {
    signal?.throwIfAborted();
    let task = await loadTask(location.path);
    if (task) {
      checkOwner(task, request.taskId, location.workspace, accountHash(config));
      if (task.path !== request.path || task.sourceHash !== request.sourceHash || task.resolution !== request.resolution || task.estimatedCostUsd !== request.estimatedCostUsd) {
        throw new Error("任务 ID 已用于其他视频或报价，请重新报价并创建新任务");
      }
      if (task.state === "succeeded") await assertOutput(context, task, signal);
      if (task.state !== "uploading") return view(task);
      await assertSource(context, task, signal);
    } else {
      const current = await quote(context, request.path, request.resolution, signal);
      if (current.sourceHash !== request.sourceHash || current.estimatedCostUsd !== request.estimatedCostUsd) throw new Error("视频或报价已变化，请重新报价");
      const { duration, width, height, frameRate, hasAudio, audioDuration } = current;
      const source: VideoInfo = { duration, width, height, frameRate, hasAudio, ...(audioDuration ? { audioDuration } : {}) };
      task = { taskId: request.taskId, path: request.path, resolution: current.resolution, state: "uploading", estimatedCostUsd: current.estimatedCostUsd,
        workspace: location.workspace, account: accountHash(config), sourceHash: current.sourceHash, source, objectKey: `videoUpscale/task${request.taskId.replaceAll("-", "")}/source.mp4` };
      await saveTask(location.path, task, true);
    }
    return resumeUpload(context, config, location.path, task, signal);
  });
}

export async function status(context: ToolContext, taskId: string, signal?: AbortSignal) {
  const config = requireConfig(context.config);
  const location = taskFile(context, taskId);
  return serial(location.path, async () => {
    signal?.throwIfAborted();
    const task = await loadTask(location.path);
    if (!task) throw Object.assign(new Error("TASK_NOT_FOUND：升清任务不存在"), { code: "TASK_NOT_FOUND", status: 404 });
    checkOwner(task, taskId, location.workspace, accountHash(config));
    if (task.state === "uploading") return view(task);
    if (task.state === "succeeded") await assertOutput(context, task, signal);
    if (task.state !== "processing") return view(task);
    if (!task.remoteId) throw new Error("任务记录缺少远端任务 ID，请在 reAPI 控制台核对");
    const remote = await queryTask(config, task.remoteId, signal);
    if (remote.id !== task.remoteId) throw new Error("reAPI 返回的任务 ID 不匹配");
    if (["completed", "failed", "cancelled", "canceled"].includes(remote.status)) {
      const costUsd = remote.billing?.cost_usd ?? (remote.usage?.credits === undefined ? undefined : remote.usage.credits / 1000);
      if (costUsd !== undefined) {
        task.costUsd = costUsd;
        await saveTask(location.path, task);
      }
    }
    if (["failed", "cancelled", "canceled"].includes(remote.status)) {
      task.state = "failed";
      task.message = "reAPI 报告任务失败或已取消，请在控制台查看详情";
      await saveTask(location.path, task);
      return view(task);
    }
    if (remote.status !== "completed") {
      if (!["pending", "queued", "processing", "running"].includes(remote.status)) throw new Error("reAPI 返回了未知任务状态，请稍后重试查询");
      return view(task);
    }
    const bytes = await downloadResult(remote.output?.video_urls?.[0], signal);
    const outputHash = hash(bytes);
    if (task.outputHash && task.outputHash !== outputHash) throw new Error("reAPI 返回的视频与已保存的结果不一致，请人工核对");
    task.outputHash = outputHash;
    await saveTask(location.path, task);
    const output = `assets/generated/videoUpscale${task.taskId.replaceAll("-", "")}.mp4`;
    await context.files.mkdir("assets/generated", true);
    try { await context.files.writeFile(output, bytes, true); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || hash(await readVideo(context, output, signal)) !== outputHash) {
        throw new Error("升清结果文件已存在或无法写入，请检查工作区");
      }
    }
    const result = await inspectVideo(context, output, signal);
    const durationTolerance = Math.max(0.25, 2 / task.source.frameRate);
    if (!result.format.split(",").includes("mp4") || Math.min(result.width, result.height) !== resolutionSettings[task.resolution].height ||
        Math.abs(result.duration - task.source.duration) > durationTolerance || Math.abs(result.frameRate - task.source.frameRate) > 0.1 ||
        result.hasAudio !== task.source.hasAudio || task.source.hasAudio && (!result.audioDuration ||
          Math.abs(result.audioDuration - (task.source.audioDuration ?? task.source.duration)) > durationTolerance)) {
      throw new Error("升清结果的视频尺寸、时长、帧率或音轨与原视频不符，文件已保留供核对");
    }
    if (hash(await readVideo(context, output, signal)) !== outputHash) throw new Error("升清结果文件发生变化，请检查工作区");
    task.result = { path: output, mimeType: "video/mp4", width: result.width, height: result.height, duration: result.duration };
    task.state = "succeeded";
    delete task.message;
    await saveTask(location.path, task);
    return view(task);
  });
}
