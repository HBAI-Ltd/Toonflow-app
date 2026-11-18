<template>
  <span ref="root" class="assetThumbnail" :class="{ failed: !!error }" :title="error || undefined" :aria-busy="loading">
    <img v-if="preview" :src="preview" :alt="asset.name" draggable="false" loading="lazy" decoding="async" referrerpolicy="no-referrer" @load="loading = false" @error="previewFailed" />
    <component v-else :is="placeholderIcon" :size="28" stroke="1.25" aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { IconBuilding, IconCube, IconLeaf, IconPackage, IconUser } from "@tabler/icons-vue";
import { getAssetPreview, getAssetPreviewKey } from "./assetPreview";
import { isAssetThumbnailUrl } from "./assetLibrary";
import type { SceneAsset } from "./sceneDocument";

const props = defineProps<{ asset: SceneAsset; loadModel?: (asset: SceneAsset) => Promise<ArrayBuffer> }>();
const root = ref<HTMLElement>();
const preview = ref("");
const error = ref("");
const loading = ref(false);
const visible = ref(false);
let observer: IntersectionObserver | undefined;
let controller: AbortController | undefined;
const placeholderIcon = computed(() => {
  if (props.asset.shape === "person" || props.asset.shape === "seatedPerson" || props.asset.shape === "kneelingPerson" || props.asset.shape === "riggedPerson") return IconUser;
  if (props.asset.category === "自然") return IconLeaf;
  if (props.asset.category === "建筑") return IconBuilding;
  if (props.asset.category === "道具" || props.asset.category === "本地") return IconPackage;
  return IconCube;
});

async function loadPreview() {
  controller?.abort();
  const current = controller = new AbortController();
  preview.value = "";
  error.value = "";
  loading.value = true;
  if (props.asset.thumbnail && isAssetThumbnailUrl(props.asset.thumbnail)) {
    preview.value = props.asset.thumbnail;
    return;
  }
  try {
    const result = await getAssetPreview(props.asset, props.loadModel, current.signal);
    if (!current.signal.aborted) preview.value = result;
  } catch (cause) {
    if (!current.signal.aborted) error.value = cause instanceof Error ? cause.message : "模型预览生成失败";
  } finally {
    if (controller === current) loading.value = false;
  }
}

function previewFailed() {
  preview.value = "";
  loading.value = false;
  error.value = "缩略图暂不可用，仍可拖入场景加载模型";
}

function cancelPreview() {
  controller?.abort();
  controller = undefined;
  loading.value = false;
}

watch(() => [getAssetPreviewKey(props.asset, props.loadModel), props.asset.thumbnail], () => {
  cancelPreview();
  preview.value = "";
  error.value = "";
  if (visible.value) void loadPreview();
});
onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    visible.value = true;
    void loadPreview();
    return;
  }
  observer = new IntersectionObserver(entries => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    const intersecting = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
    if (visible.value === intersecting) return;
    visible.value = intersecting;
    if (!intersecting) cancelPreview();
    else if (!preview.value) void loadPreview();
  });
  if (root.value) observer.observe(root.value);
});
onBeforeUnmount(() => {
  cancelPreview();
  observer?.disconnect();
});
</script>

<style scoped lang="scss">
.assetThumbnail {
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  flex: 0 0 auto;
  position: relative;
  place-items: center;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  background: var(--studioControlBackground, color-mix(in srgb, var(--el-fill-color) 45%, transparent));
  img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
  &.failed { color: var(--el-color-warning); }
}
</style>
