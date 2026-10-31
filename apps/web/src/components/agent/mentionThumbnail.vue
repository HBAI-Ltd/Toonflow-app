<template>
  <span ref="element" class="mentionThumbnail" aria-hidden="true" :aria-busy="preparingPreview" :title="preparingPreview ? '正在生成兼容预览…' : previewError || undefined">
    <template v-if="mediaSrc && !failed && !preparingPreview && !previewError">
      <video v-if="thumbnail?.mimeType.startsWith('video/')" :src="mediaSrc" preload="auto" muted playsinline @loadeddata="handleLoaded" @error="handleError" />
      <img v-else :src="mediaSrc" alt="" draggable="false" @load="handleLoaded" @error="handleError" />
    </template>
    <slot v-else />
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";

const props = defineProps<{ thumbnail?: { url: string; mimeType: string }; directory?: string; globalAsset?: boolean }>();
const element = ref<HTMLElement>();
const inView = ref(false);
const previewUrl = ref("");
const { src: mediaSrc, preparing: preparingPreview, error: previewError, handleError, handleLoaded } = useMediaPreview(previewUrl, () => props.thumbnail?.mimeType.startsWith("video/") ? "video" : "image");
const failed = ref(false);
let observer: IntersectionObserver | undefined;

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => { inView.value = !!entry?.isIntersecting; });
  if (element.value) observer.observe(element.value);
});
onBeforeUnmount(() => observer?.disconnect());

watch([inView, () => props.thumbnail?.url, () => props.thumbnail?.mimeType, () => props.directory, () => props.globalAsset], async ([visible, path, mimeType, directory, globalAsset], _old, onCleanup) => {
  previewUrl.value = "";
  failed.value = false;
  if (!visible || !path) return;
  if (globalAsset) {
    previewUrl.value = `/api/assets/read?path=${encodeURIComponent(path)}`;
    return;
  }
  if (!directory) return;
  let cancelled = false;
  // ACT: 仅加载可见项并复用文件缓存；视频仍读取完整 Blob，大文件可改为服务端缩略图。
  const preview = useWorkspaceFiles(directory).acquireUrl(path, mimeType);
  onCleanup(() => { cancelled = true; preview.release(); });
  try {
    const url = await preview.url;
    if (!cancelled) previewUrl.value = url;
  } catch {
    if (!cancelled) failed.value = true;
  }
});
</script>

<style scoped lang="scss">
.mentionThumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border-radius: 5px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);

  img, video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
}
</style>
