import { onScopeDispose } from "vue";
import type { FfmpegContext } from "@toonflow/tools-scaffold/runtime";

export type { FfmpegContext, FfmpegConvertOptions } from "@toonflow/tools-scaffold/runtime";

export function useNodeFfmpeg(): FfmpegContext {
  const controller = new AbortController();
  onScopeDispose(() => controller.abort());

  return {
    async convert(input, options, signal) {
      const callSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;
      callSignal.throwIfAborted();
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
        throw Object.assign(new Error(result.message || `FFmpeg 请求失败（HTTP ${response.status}）`), {
          code: result.data?.code, status: response.status,
        });
      }
      return { data: new Uint8Array(await response.arrayBuffer()), mimeType: response.headers.get("content-type") ?? "application/octet-stream" };
    },
  };
}
