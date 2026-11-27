import { spawn } from "node:child_process";

export function runAudioCommand(binary: string, args: string[], cwd: string, signal?: AbortSignal, timeout?: number) {
  signal?.throwIfAborted();
  const child = spawn(binary, args, { cwd, signal, timeout, killSignal: "SIGKILL", windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  return new Promise<void>((resolve, reject) => {
    let failure: Error | undefined, detail = "";
    child.stderr.on("data", chunk => { detail = (detail + chunk.toString()).slice(-1024); });
    child.once("error", error => { failure = error; });
    // Windows 在 abort/error 后仍可能占用音频与运行器；等 close 再清理并结束任务。
    child.once("close", code => {
      if (signal?.aborted) reject(signal.reason);
      else if (failure || code !== 0) reject(failure ?? Object.assign(new Error("音频处理未完成：{0}"), { detail: detail.trim() || String(code) }));
      else resolve();
    });
  });
}
