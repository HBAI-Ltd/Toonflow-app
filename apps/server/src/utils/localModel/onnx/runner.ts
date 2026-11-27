import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { LocalModelRunRequest, LocalModelRunResult } from "@toonflow/plugin-server/localModelInference";
import { translateMessage } from "@/lib/i18n";
import { resolveInstalledModel } from "@/utils/localModel";

let activeRuns = 0;
const idle = new Map<string, { group: string; child: ChildProcess; timer: ReturnType<typeof setTimeout> }>();
const pairedModels: Record<string, string> = { ppOcrV5Det: "subtitles", ppOcrV5Rec: "subtitles", migan: "subtitles", palmDetection: "hands", handPose: "hands" };

function discardWorker(key: string, entry: { child: ChildProcess; timer: ReturnType<typeof setTimeout> }) {
  idle.delete(key);
  clearTimeout(entry.timer);
  entry.child.kill("SIGKILL");
}

function takeWorker(key: string, group: string) {
  const previous = idle.get(key);
  if (previous) {
    clearTimeout(previous.timer);
    idle.delete(key);
    if (previous.child.connected && !previous.child.killed) return previous.child;
    previous.child.kill("SIGKILL");
  }
  for (const [id, entry] of idle) {
    if (!group || entry.group !== group || idle.size >= 2) discardWorker(id, entry);
  }
  const entry = new URL(import.meta.url.endsWith(".ts") ? "./localModelProcess.ts" : "./localModelProcess.js", import.meta.url);
  return spawn(process.execPath, [fileURLToPath(entry)], {
    windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"], serialization: "advanced",
  });
}

function keepWorker(key: string, group: string, child: ChildProcess) {
  // 两阶段模型交替调用，各保留一个会话。其他模型仍只保留最近一次使用的会话。
  for (const [id, entry] of idle) {
    if (group && entry.group === group && id !== key && idle.size < 2) continue;
    discardWorker(id, entry);
  }
  const timer = setTimeout(() => { idle.delete(key); child.kill("SIGKILL"); }, 20000);
  idle.set(key, { group, child, timer });
}

export async function runOnnxModel(request: LocalModelRunRequest, signal?: AbortSignal): Promise<LocalModelRunResult> {
  signal?.throwIfAborted();
  if (activeRuns >= 2) throw Object.assign(new Error("本地模型正在运行，请稍后再试"), { status: 429 });
  activeRuns++;
  try {
    const model = await resolveInstalledModel(request.id);
    if (!model.fileName.toLowerCase().endsWith(".onnx")) throw Object.assign(new Error("此运行器支持单文件 ONNX 模型"), { status: 400 });
    const runtime = await resolveInstalledModel("onnxRuntime");
    let device = request.device;
    if (process.platform === "win32" && device !== "cpu") {
      try { await resolveInstalledModel("directMl"); }
      catch (cause) {
        if ((cause as { status?: number }).status !== 409) throw cause;
        if (device === "gpu") throw Object.assign(new Error("请先在本地模型列表中安装 Windows 显卡加速运行库 DirectML"), { status: 409 });
        device = "cpu";
      }
    }
    signal?.throwIfAborted();
    const key = JSON.stringify([model.id, model.path, model.sha256, runtime.path, runtime.sha256, device ?? "auto"]);
    const group = pairedModels[model.id] ?? "";
    const child = takeWorker(key, group);
    let reusable = false;
    try {
      const result = await new Promise<LocalModelRunResult>((resolve, reject) => {
        const fail = (cause: Error) => { cleanup(); reject(cause); };
        const stop = () => fail(signal!.reason);
        const exited = () => fail(new Error("本地模型进程已退出"));
        const receive = (reply: { result?: LocalModelRunResult; error?: { message: string; detail?: string } }) => {
          cleanup();
          if (reply.result) resolve(reply.result);
          else if (reply.error) reject(new Error(translateMessage(reply.error.message, { 0: reply.error.detail })));
          else reject(new Error("本地模型进程已退出"));
        };
        const timer = setTimeout(() => fail(new Error("本地模型运行超时或超过输出上限")), 5 * 60_000);
        function cleanup() {
          clearTimeout(timer);
          signal?.removeEventListener("abort", stop);
          child.off("error", fail).off("exit", exited).off("disconnect", exited).off("message", receive);
        }
        child.once("error", fail).once("exit", exited).once("disconnect", exited).once("message", receive);
        signal?.addEventListener("abort", stop, { once: true });
        try {
          child.send({ request: { ...request, device }, runtimePath: runtime.path, modelPath: model.path, sha256: model.sha256 }, error => { if (error) fail(error); });
        } catch (error) { cleanup(); reject(error); }
      });
      reusable = true;
      return result;
    } finally {
      if (reusable && child.connected && !signal?.aborted) keepWorker(key, group, child);
      else if (child.pid && child.exitCode === null && child.signalCode === null) {
        const stopped = new Promise<void>(resolve => child.once("close", () => resolve()));
        child.kill("SIGKILL");
        await stopped;
      }
    }
  } finally { activeRuns--; }
}
