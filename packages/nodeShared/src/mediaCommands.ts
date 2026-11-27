import type { BrowserFfmpegCommand, BrowserFfmpegFactory, FfprobeData } from "@toonflow/nodes-scaffold/nodeFfmpeg";

export function probeMedia(ffmpeg: BrowserFfmpegFactory, path: string, signal?: AbortSignal) {
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

export function runCommand(command: BrowserFfmpegCommand, signal?: AbortSignal) {
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
