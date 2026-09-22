import { dirname, join } from "node:path";
import { realpath } from "node:fs/promises";
import { build, downloadSources, getToolStatus, installFfmpeg, target } from "@toonflow/ffmpeg";
import type { DownloadState, FfmpegMode, SourceId } from "@toonflow/ffmpeg";
import { createFfmpegClient } from "@toonflow/ffmpeg/client";
import { convertMedia as convertBytes } from "@toonflow/ffmpeg/convert";
import { executeFfmpeg } from "@toonflow/ffmpeg/runtime";
import type { FfmpegConvertOptions, FfmpegPlan } from "@toonflow/ffmpeg/types";
import conf from "@/utils/conf";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

const directory = join(dirname(conf.path), "ffmpeg", target);
let download: DownloadState = { phase: "idle", received: 0 };
// ACT: 沿用 server 单进程模型，每次只下载一套程序；不持久化运行中的任务。
let controller: AbortController | undefined;
const requiredListeners = new Set<() => void>();

export function onRequired(listener: () => void) {
  requiredListeners.add(listener);
  return () => { requiredListeners.delete(listener); };
}

async function requireTools(signal?: AbortSignal, probe = false) {
  signal?.throwIfAborted();
  const { tools } = await getStatus();
  signal?.throwIfAborted();
  if (tools.ffmpeg.path && !tools.ffmpeg.error && (!probe || (tools.ffprobe.path && !tools.ffprobe.error))) {
    return { ffmpegPath: tools.ffmpeg.path, ffprobePath: tools.ffprobe.error ? undefined : tools.ffprobe.path ?? undefined };
  }
  for (const listener of requiredListeners) listener();
  throw Object.assign(new Error("当前操作需要 FFmpeg，请在插件市场下载安装或配置可用版本后重试。"), {
    name: "FfmpegRequiredError", code: "FFMPEG_REQUIRED", status: 424,
  });
}

export async function convertMedia(input: Uint8Array, options: FfmpegConvertOptions, signal?: AbortSignal) {
  return convertBytes(input, options, await requireTools(signal), signal);
}

export async function executePlan(cwd: string, plan: FfmpegPlan, signal?: AbortSignal) {
  const root = await realpath(cwd);
  const paths = await requireTools(signal, plan.steps.some(step => step.method === "ffprobe"));
  return executeFfmpeg(plan, {
    ...paths,
    directory: root,
    resolvePath: async path => (await resolveWorkspacePath(root, path, true)).path,
    lockPaths: lockWorkspaceFiles,
  }, signal);
}

export function createWorkspaceFfmpeg(cwd: string) {
  return createFfmpegClient((plan, signal) => executePlan(cwd, plan, signal), convertMedia);
}

export function getProgress() {
  return download;
}

export async function getStatus() {
  const raw = conf.get("settings", {}).ffmpeg;
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const mode: FfmpegMode = value.mode === "download" || value.mode === "system" ? value.mode : "auto";
  const source = downloadSources.find(item => item.id === value.source)?.id ?? "npmmirror";
  return {
    platform: process.platform,
    arch: process.arch,
    target,
    supported: Boolean(build),
    directory,
    version: build?.version ?? "",
    sources: downloadSources.map(({ id, label, description, available, homepage }) => ({ id, label, description, available, homepage })),
    config: { mode, source },
    tools: await getToolStatus(directory, mode),
    download,
  };
}

export function startDownload(source: SourceId) {
  if (controller) throw Object.assign(new Error("正在下载，请等待完成或取消后再试"), { status: 409 });
  if (!downloadSources.some(item => item.id === source && item.available)) throw Object.assign(new Error("此下载源暂不可用，请选择其他下载源"), { status: 400 });
  if (!build) throw Object.assign(new Error(`暂不支持自动下载 ${target} 版本`), { status: 400 });
  const active = new AbortController();
  controller = active;
  download = { phase: "downloading", received: 0 };
  void installFfmpeg(directory, source, active.signal, state => { download = state; }).then(() => {
    download = { phase: "completed", received: 0 };
  }).catch((error: unknown) => {
    download = active.signal.aborted
      ? { phase: "cancelled", received: 0 }
      : { phase: "error", received: 0, error: error instanceof Error ? error.message : String(error) };
  }).finally(() => { controller = undefined; });
  return download;
}

export function cancelDownload() {
  if (download.phase !== "installing") controller?.abort();
  return download;
}
