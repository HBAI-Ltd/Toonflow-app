import { onScopeDispose, watch, type Ref } from "vue";

export function useFramePreview(video: Ref<HTMLVideoElement | undefined>, draw: () => void) {
  let paintId = 0;
  function refresh() {
    if (!paintId) paintId = requestAnimationFrame(() => { paintId = 0; draw(); });
  }
  watch(video, (element, _, cleanup) => {
    if (!element) return;
    element.addEventListener("seeked", refresh);
    let frameId = 0;
    if (typeof element.requestVideoFrameCallback === "function") {
      const next = () => { refresh(); frameId = element.requestVideoFrameCallback(next); };
      frameId = element.requestVideoFrameCallback(next);
    } else element.addEventListener("timeupdate", refresh);
    cleanup(() => {
      if (frameId) element.cancelVideoFrameCallback(frameId);
      element.removeEventListener("timeupdate", refresh);
      element.removeEventListener("seeked", refresh);
    });
  }, { immediate: true });
  onScopeDispose(() => cancelAnimationFrame(paintId));
  return refresh;
}
