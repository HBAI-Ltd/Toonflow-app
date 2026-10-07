import { h } from "vue";
import { ElNotification } from "element-plus";
import nodeError from "./components/nodeError.vue";

export function showNodeError(error: unknown, title: string) {
  if (error instanceof Error && error.name === "AbortError") return;
  const detail = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  const message = typeof detail === "string" && detail.trim() ? detail
    : error instanceof Error ? error.message : typeof error === "string" ? error : title;
  const controller = new AbortController();
  ElNotification({
    title,
    type: "error",
    duration: 0,
    customClass: "nodeErrorNotification",
    message: h(nodeError, { message: message || title, context: title, signal: controller.signal }),
    onClose: () => controller.abort(),
  });
}
