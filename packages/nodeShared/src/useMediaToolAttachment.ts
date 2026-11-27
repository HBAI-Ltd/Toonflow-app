import { computed, ref, watch } from "vue";
import { useVueFlow } from "@vue-flow/core";
import { getAssetOutputs } from "@toonflow/nodes-scaffold/connection";
import { useNodeFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { MediaToolAttachment } from "./mediaTools";

export function useMediaToolAttachment(getAttachment: () => MediaToolAttachment | undefined) {
  const { findNode } = useVueFlow();
  const files = useNodeFiles();
  const localSrc = ref("");
  const error = ref("");
  const canvasFile = computed(() => {
    const item = getAttachment();
    if (!item || item instanceof File) return;
    const node = findNode(item.nodeId);
    if (!node) return;
    for (const { output } of getAssetOutputs(node.data)) {
      if (typeof output.value === "object" && output.value.url === item.path) return output.value;
    }
  });
  const workspaceSrc = files.useFileUrl(canvasFile, cause => { error.value = cause instanceof Error ? cause.message : "无法读取画布素材"; });
  watch(getAttachment, (item, _, cleanup) => {
    error.value = "";
    localSrc.value = item instanceof File ? URL.createObjectURL(item) : "";
    const url = localSrc.value;
    if (url) cleanup(() => URL.revokeObjectURL(url));
  }, { immediate: true, flush: "sync" });
  const src = computed(() => localSrc.value || workspaceSrc.value);
  return { src, error: computed(() => error.value || (getAttachment() && !(getAttachment() instanceof File) && !canvasFile.value ? "所选画布素材已变化，请重新选择" : "")) };
}
