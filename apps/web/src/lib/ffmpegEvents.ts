import { onScopeDispose, ref, shallowRef } from "vue";

export type DownloadState = { phase: "idle" | "downloading" | "verifying" | "installing" | "completed" | "error" | "cancelled"; file?: string; received: number; total?: number; error?: string };
export const ffmpegProgress = shallowRef<DownloadState>();
export const ffmpegDisconnected = ref(false);
let events: EventSource | undefined;
let required: (() => void) | undefined;

export function connectFfmpegEvents() {
  if (events || !required) return;
  const source = events = new EventSource("/api/ffmpeg/events");
  source.onopen = () => { ffmpegDisconnected.value = false; };
  source.onmessage = event => { if (JSON.parse(event.data)?.type === "required") required?.(); };
  source.addEventListener("progress", event => { ffmpegProgress.value = JSON.parse(event.data); });
  source.onerror = () => {
    source.close();
    if (source !== events) return;
    events = undefined;
    ffmpegDisconnected.value = true;
  };
}

export function useFfmpegRequired(listener: () => void) {
  required = listener;
  function handleRequired(event: Event) {
    event.preventDefault();
    if (events?.readyState !== EventSource.OPEN) listener();
  }
  window.addEventListener("toonflow:ffmpeg-required", handleRequired);
  connectFfmpegEvents();
  window.addEventListener("online", connectFfmpegEvents);
  window.addEventListener("focus", connectFfmpegEvents);
  onScopeDispose(() => {
    window.removeEventListener("toonflow:ffmpeg-required", handleRequired);
    window.removeEventListener("online", connectFfmpegEvents);
    window.removeEventListener("focus", connectFfmpegEvents);
    events?.close();
    required = undefined;
    events = undefined;
    ffmpegProgress.value = undefined;
  });
}
