import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from "vue";

export type MediaPreviewKind = "video" | "audio" | "image";
const previews = new Map<string, { users: number; controller: AbortController; url: Promise<string> }>();

export async function createMediaPreview(source: string, kind: MediaPreviewKind, signal: AbortSignal) {
  const original = await fetch(source, { signal });
  if (!original.ok) throw new Error("无法读取原文件以生成兼容预览");
  const maxBytes = 100 * 1024 * 1024;
  const sizeError = "兼容预览仅支持 100 MB 以内的非空媒体文件";
  if (Number(original.headers.get("content-length")) > maxBytes) {
    await original.body?.cancel();
    throw new Error(sizeError);
  }
  const reader = original.body?.getReader();
  if (!reader) throw new Error(sizeError);
  const chunks: BlobPart[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error(sizeError);
      chunks.push(value);
    }
  } catch (cause) {
    await reader.cancel().catch(() => {});
    throw cause;
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error(sizeError);
  const content = new Blob(chunks);
  signal.throwIfAborted();
  const response = await fetch(`/api/media/preview?kind=${kind}`, {
    method: "POST", headers: { "Content-Type": "application/octet-stream", "x-toonflow-workspace": "1" }, body: content, signal,
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(details?.message || "生成兼容预览失败");
  }
  const preview = await response.blob();
  signal.throwIfAborted();
  if (!preview.size) throw new Error("生成的兼容预览为空");
  return preview;
}

function acquirePreview(source: string, kind: MediaPreviewKind) {
  const key = JSON.stringify([source, kind]);
  let entry = previews.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = { users: 0, controller, url: createMediaPreview(source, kind, controller.signal).then(blob => URL.createObjectURL(blob)) };
    previews.set(key, entry);
  }
  const current = entry;
  current.users++;
  let released = false;
  return {
    url: current.url,
    release() {
      if (released) return;
      released = true;
      if (--current.users) return;
      if (previews.get(key) === current) previews.delete(key);
      current.controller.abort();
      void current.url.then(url => URL.revokeObjectURL(url), () => {});
    },
  };
}

/** 原文件始终用于输出和下载；这里只替换展示 URL，不读写工作区。 */
export function useMediaPreview(source: MaybeRefOrGetter<string | undefined>, kind: MaybeRefOrGetter<MediaPreviewKind>) {
  const src = ref("");
  const preparing = ref(false);
  const error = ref("");
  let attempted = false;
  let preview: ReturnType<typeof acquirePreview> | undefined;
  watch([() => toValue(source), () => toValue(kind)], ([value], _previous, onCleanup) => {
    src.value = value || "";
    error.value = "";
    preparing.value = false;
    attempted = false;
    onCleanup(() => { preview?.release(); preview = undefined; });
  }, { immediate: true, flush: "sync" });
  onScopeDispose(() => { preview?.release(); preview = undefined; });

  function isCurrent(event?: Event) {
    const target = event?.target as HTMLMediaElement | HTMLImageElement | null;
    if (!target || !("currentSrc" in target)) return true;
    return target.currentSrc
      ? target.currentSrc === new URL(src.value, document.baseURI).href
      : target.getAttribute("src") === src.value;
  }

  function handleError(event?: Event) {
    if (!isCurrent(event) || !src.value) return;
    if (preparing.value && src.value === toValue(source)) return;
    if (attempted) { error.value = "当前环境无法显示兼容预览，文件可能已损坏"; return; }
    attempted = true;
    preparing.value = true;
    const current = preview = acquirePreview(toValue(source)!, toValue(kind));
    void current.url.then(url => {
      if (preview === current) src.value = url;
    }).catch(cause => {
      if (preview === current) error.value = cause instanceof Error ? cause.message : "生成兼容预览失败";
    }).finally(() => { if (preview === current) preparing.value = false; });
  }

  function handleLoaded(event: Event) {
    if (!isCurrent(event)) return false;
    const target = event.target as HTMLVideoElement | HTMLImageElement;
    if (toValue(kind) === "video" && (!(target as HTMLVideoElement).videoWidth || !(target as HTMLVideoElement).videoHeight)) {
      handleError(event);
      return false;
    }
    error.value = "";
    return true;
  }

  return { src, preparing, error, handleError, handleLoaded };
}
