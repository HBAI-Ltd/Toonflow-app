import { inject, onScopeDispose } from "vue";
import { createFfmpegClient } from "@toonflow/ffmpeg/client";
import type { FfmpegContext, FfmpegResult } from "@toonflow/ffmpeg/types";

export type { FfmpegCommand, FfmpegContext, FfmpegConvertOptions, FfmpegResult } from "@toonflow/ffmpeg/types";

export function useNodeFfmpeg(): FfmpegContext {
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const controller = new AbortController();
  onScopeDispose(() => controller.abort());

  function getSignal(signal?: AbortSignal) {
    const callSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;
    callSignal.throwIfAborted();
    return callSignal;
  }

  function responseError(result: { message?: string; data?: { code?: string } }, status: number) {
    return Object.assign(new Error(result.message || `FFmpeg 请求失败（HTTP ${status}）`), { code: result.data?.code, status });
  }

  return createFfmpegClient(async (plan, signal) => {
    const callSignal = getSignal(signal);
    if (!getDirectory) throw new Error("当前画布未提供工作目录");
    const directory = getDirectory();
    const response = await fetch("/api/ffmpeg/execute", {
      method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ directory, plan }), signal: callSignal,
    });
    const result = await response.json();
    if (!response.ok || result.code !== 200) throw responseError(result, response.status);
    return result.data as FfmpegResult;
  }, async (input, options, signal) => {
    const callSignal = getSignal(signal);
    if (!(input instanceof Uint8Array) || !input.byteLength) throw new Error("FFmpeg 输入必须是非空 Uint8Array");
    const query = new URLSearchParams({ options: JSON.stringify(options) });
    const response = await fetch(`/api/ffmpeg/convert?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "x-toonflow-workspace": "1" },
      body: new Uint8Array(input),
      signal: callSignal,
    });
    if (!response.ok) {
      const result = await response.json();
      throw responseError(result, response.status);
    }
    return { data: new Uint8Array(await response.arrayBuffer()), mimeType: response.headers.get("content-type") ?? "application/octet-stream" };
  });
}
