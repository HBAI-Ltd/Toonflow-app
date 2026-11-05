import { t, translateError, translateMessage } from "@/lib/i18n";
import { dirname, extname, join } from "node:path";
import { mkdir, readFile, stat } from "@toonflow/file";
import { build, createFfmpeg, downloadSources, getToolStatus, installFfmpeg, target } from "@toonflow/ffmpeg";
import type { DownloadState, FfmpegMode, SourceId } from "@toonflow/ffmpeg";
import type { FfmpegCommand } from "@toonflow/ffmpeg";
import conf from "@/utils/conf";
import { getRuntimePlatform } from "@/lib/platform";
import { isMultiUser } from "@/utils/accounts/context";
import { runTask } from "@/utils/hosting/tasks";
import { assertStorageDirectory, maximumUploadBytes, userTemporaryRoot, withStorageWrite, withTemporaryDirectory } from "@/utils/hosting/storage";
import { writeWorkspaceFile } from "@/utils/workspace/files";

export { executeRemoteFfmpeg } from "@toonflow/ffmpeg";

const directory = join(dirname(conf.path), "ffmpeg", target);
let download: DownloadState = { phase: "idle", received: 0 };
let downloadError: unknown;
// ACT: 沿用 server 单进程模型，每次只下载一套程序；不持久化运行中的任务。
let controller: AbortController | undefined;
const requiredListeners = new Set<() => void>();

export function onRequired(listener: () => void) {
  requiredListeners.add(listener);
  return () => { requiredListeners.delete(listener); };
}

export async function createWorkspaceFfmpeg(cwd: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  await assertStorageDirectory(cwd);
  const { tools } = await getStatus();
  signal?.throwIfAborted();
  if (!tools.ffmpeg.path || tools.ffmpeg.error || !tools.ffprobe.path || tools.ffprobe.error) {
    for (const listener of requiredListeners) listener();
    throw Object.assign(new Error("当前操作需要 FFmpeg，请在插件市场下载安装或配置可用版本后重试。"), {
      name: "FfmpegRequiredError", code: "FFMPEG_REQUIRED", status: 424,
    });
  }
  const ffmpeg = createFfmpeg(cwd, isMultiUser() ? {
    additionalRoots: [userTemporaryRoot()],
    run: (command, start) => runWorkspaceTranscode(cwd, command, start, signal),
  } : undefined);
  ffmpeg.setFfmpegPath(tools.ffmpeg.path);
  ffmpeg.setFfprobePath(tools.ffprobe.path);
  return ffmpeg;
}

function runWorkspaceTranscode(cwd: string, command: FfmpegCommand, start: () => void, signal?: AbortSignal) {
  const emit = command.emit;
  let endArgs: unknown[] = [];
  void runTask({ kind: "transcode", directory: cwd, signal }, activeSignal => withTemporaryDirectory(async directory => {
    const outputs = (command as FfmpegCommand & { _outputs: { target?: string | NodeJS.WritableStream }[] })._outputs;
    if (!outputs.length || outputs.some(output => typeof output.target !== "string" || /[%\r\n]/.test(output.target))) {
      throw new Error("托管转码仅支持明确命名的文件输出，不支持输出流或文件序列");
    }
    const paths = outputs.map(output => output.target as string);
    for (const path of paths) await assertStorageDirectory(path);
    // ACT: 原生转码在临时区运行。-fs 是 FFmpeg 的软件上界，封装不等价于操作系统硬配额。
    await withStorageWrite(directory, outputs.length * maximumUploadBytes, async () => {
      outputs.forEach((output, index) => { output.target = join(directory, `${index}${extname(paths[index]!)}`); });
      const internal = command as FfmpegCommand & { _currentOutput: unknown };
      const current = internal._currentOutput;
      for (const output of outputs) {
        internal._currentOutput = output;
        command.outputOptions("-fs", String(maximumUploadBytes));
      }
      internal._currentOutput = current;
      try {
        await new Promise<void>((resolve, reject) => {
          const cancel = () => { command.kill("SIGKILL"); };
          const started = () => { if (activeSignal.aborted) cancel(); };
          const dispose = () => {
            activeSignal.removeEventListener("abort", cancel);
            command.off("start", started);
          };
          command.emit = ((event: string | symbol, ...args: unknown[]) => {
            if (event === "end") { endArgs = args; dispose(); resolve(); return true; }
            if (event === "error") { dispose(); reject(args[0]); return true; }
            return Reflect.apply(emit, command, [event, ...args]);
          }) as typeof command.emit;
          activeSignal.addEventListener("abort", cancel, { once: true });
          command.on("start", started);
          try { activeSignal.throwIfAborted(); start(); }
          catch (error) { dispose(); reject(error); }
        });
        activeSignal.throwIfAborted();
        // 完成后按实际大小提交；任何超界结果不进入持久工作区。
        for (let index = 0; index < outputs.length; index++) {
          const path = outputs[index]!.target as string;
          const info = await stat(path);
          if (!info.isFile() || info.size > maximumUploadBytes) throw new Error("转码结果不能超过 100 MB");
          activeSignal.throwIfAborted();
          await mkdir(dirname(paths[index]!), { recursive: true });
          await writeWorkspaceFile(paths[index]!, await readFile(path));
        }
      } finally { outputs.forEach((output, index) => { output.target = paths[index]; }); }
    });
  })).then(() => {
    command.emit = emit;
    Reflect.apply(emit, command, ["end", ...endArgs]);
  }, error => {
    command.emit = emit;
    Reflect.apply(emit, command, ["error", error]);
  });
}

export function getProgress() {
  return download.error ? { ...download, error: translateError(downloadError ?? download.error) } : download;
}

export async function getStatus() {
  const raw = conf.get("settings", {}).ffmpeg;
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const mode: FfmpegMode = value.mode === "download" || value.mode === "system" ? value.mode : "auto";
  const source = downloadSources.find(item => item.id === value.source)?.id ?? "npmmirror";
  const tools = await getToolStatus(directory, mode, translateError);
  return {
    platform: getRuntimePlatform().os,
    arch: process.arch,
    target,
    supported: Boolean(build),
    directory,
    version: build?.version ?? "",
    sources: downloadSources.map(({ id, label, description, available, homepage }) => ({ id, label: translateMessage(label), description: translateMessage(description), available, homepage })),
    config: { mode, source },
    tools: { ffmpeg: { ...tools.ffmpeg, error: tools.ffmpeg.error ? translateMessage(tools.ffmpeg.error) : null },
      ffprobe: { ...tools.ffprobe, error: tools.ffprobe.error ? translateMessage(tools.ffprobe.error) : null } },
    download: getProgress(),
  };
}

export function startDownload(source: SourceId) {
  if (controller) throw Object.assign(new Error("正在下载，请等待完成或取消后再试"), { status: 409 });
  if (!downloadSources.some(item => item.id === source && item.available)) throw Object.assign(new Error("此下载源暂不可用，请选择其他下载源"), { status: 400 });
  if (!build) throw Object.assign(new Error(t`暂不支持自动下载 ${target} 版本`), { status: 400 });
  const active = new AbortController();
  controller = active;
  download = { phase: "downloading", received: 0 };
  downloadError = undefined;
  void installFfmpeg(directory, source, active.signal, state => { download = state; }).then(() => {
    download = { phase: "completed", received: 0 };
  }).catch((error: unknown) => {
    downloadError = error;
    download = active.signal.aborted
      ? { phase: "cancelled", received: 0 }
      : { phase: "error", received: 0, error: error instanceof Error ? error.message : String(error) };
  }).finally(() => { controller = undefined; });
  return getProgress();
}

export function cancelDownload() {
  if (download.phase !== "installing") controller?.abort();
  return getProgress();
}
