import { ref, watch, type Ref } from "vue";
import { useNode, useNodeId } from "@vue-flow/core";

const previewObserverKey = Symbol.for("toonflow.nodePreviewObserver");
type PreviewObserver = { observer: IntersectionObserver; targets: Map<Element, Set<Ref<boolean>>> };

export function useNodePreviewReady() {
  const ready = ref(!useNodeId() || typeof IntersectionObserver === "undefined");
  if (ready.value) return ready;
  const { nodeEl } = useNode();
  const host = globalThis as typeof globalThis & { [previewObserverKey]?: PreviewObserver };
  if (!host[previewObserverKey]) {
    const targets: PreviewObserver["targets"] = new Map();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        targets.get(entry.target)?.forEach(value => { value.value = true; });
        targets.delete(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "240px" });
    host[previewObserverKey] = { observer, targets };
  }
  const { observer, targets } = host[previewObserverKey];
  // ACT: 首次靠近视口才挂载预览，之后保留尺寸、播放器及插件 UI 状态；不卸载节点运行时。
  watch(nodeEl, (element, _previous, onCleanup) => {
    if (!element || ready.value) return;
    const subscribers = targets.get(element) ?? new Set<Ref<boolean>>();
    subscribers.add(ready);
    targets.set(element, subscribers);
    observer.observe(element);
    onCleanup(() => {
      subscribers.delete(ready);
      if (targets.get(element) === subscribers && !subscribers.size) {
        targets.delete(element);
        observer.unobserve(element);
      }
    });
  }, { immediate: true, flush: "post" });
  return ready;
}
