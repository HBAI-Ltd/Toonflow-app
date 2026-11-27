import { h } from "vue";
import { ElNotification } from "element-plus";
import nodeError from "./components/nodeError.vue";

export function showNodeError(error: unknown, title: string) {
  if (error instanceof Error && error.name === "AbortError") return;
  const failure = error as { code?: unknown; data?: { code?: unknown }; response?: { data?: { message?: unknown; data?: { code?: unknown } } } } | null;
  const response = failure?.response?.data;
  const missingFfmpeg = (response?.data?.code ?? failure?.data?.code ?? failure?.code) === "FFMPEG_REQUIRED";
  if (missingFfmpeg && !window.dispatchEvent(new Event("toonflow:ffmpeg-required", { cancelable: true }))) return;
  const detail = response?.message;
  const message = typeof detail === "string" && detail.trim() ? detail
    : error instanceof Error ? error.message : typeof error === "string" ? error : title;
  const controller = new AbortController();
  ElNotification({
    title,
    type: "error",
    duration: missingFfmpeg ? 5000 : 0,
    customClass: "nodeErrorNotification",
    message: h(nodeError, { message: message || title, context: title, signal: controller.signal }),
    onClose: () => controller.abort(),
  });
}
