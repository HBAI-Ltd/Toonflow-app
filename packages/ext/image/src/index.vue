<template>
  <section class="imageDocument">
    <header class="imageToolbar">
      <el-button text size="small" :disabled="!imageUrl" aria-label="缩小" @click="changeZoom(1 / 1.25)">−</el-button>
      <span aria-live="polite">{{ Math.round(scale * 100) }}%</span>
      <el-button text size="small" :disabled="!imageUrl" aria-label="放大" @click="changeZoom(1.25)">＋</el-button>
      <el-button text size="small" :disabled="!imageUrl" @click="fit = false; zoom = 1">原始大小</el-button>
      <el-button text size="small" :disabled="!imageUrl" :aria-pressed="fit" @click="fit = true">适应窗口</el-button>
    </header>
    <div ref="viewport" class="imagePreview" :aria-busy="loading || preparingPreview" @wheel="onWheel">
      <img v-if="previewSrc && !previewError" :src="previewSrc" :alt="context.resource.label" :style="naturalWidth ? { width: `${naturalWidth * scale}px`, height: `${naturalHeight * scale}px` } : undefined" @load="imageLoaded" @error="handleError" />
      <div v-if="preparingPreview" class="imageStatus" role="status">正在生成兼容预览…</div>
      <div v-else-if="error || previewError" class="imageError" role="alert">{{ error || previewError }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElButton } from "element-plus";
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";

const props = defineProps<{ context: ExtContext }>();
const viewport = ref<HTMLElement>();
const imageUrl = ref("");
const { src: previewSrc, preparing: preparingPreview, error: previewError, handleError, handleLoaded } = useMediaPreview(imageUrl, "image");
const error = ref("");
const loading = ref(false);
const fit = ref(props.context.config.fitToWindow !== false);
const zoom = ref(1);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const viewportSize = ref({ width: 0, height: 0 });
const scale = computed(() => fit.value && naturalWidth.value && naturalHeight.value
  ? Math.min(1, Math.max(1, viewportSize.value.width) / naturalWidth.value, Math.max(1, viewportSize.value.height) / naturalHeight.value) : zoom.value);
watch(() => props.context.config.fitToWindow, value => { fit.value = value !== false; zoom.value = 1; });
const observer = new ResizeObserver(([entry]) => { if (entry) viewportSize.value = { width: entry.contentRect.width, height: entry.contentRect.height }; });
onMounted(() => { if (viewport.value) observer.observe(viewport.value); });
onBeforeUnmount(() => observer.disconnect());

function imageLoaded(event: Event) {
  const image = event.target as HTMLImageElement;
  if (image.currentSrc !== previewSrc.value) return;
  handleLoaded(event);
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;
}
function changeZoom(factor: number) { zoom.value = Math.max(0.1, Math.min(8, scale.value * factor)); fit.value = false; }
function onWheel(event: WheelEvent) { if (event.ctrlKey || event.metaKey) { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1.1 : 1 / 1.1); } }

watch(() => [props.context.resource.directory, props.context.resource.path], async (_resource, _previous, onCleanup) => {
  let cancelled = false;
  let shared: ReturnType<ExtContext["files"]["acquireUrl"]> | undefined;
  onCleanup(() => {
    cancelled = true;
    shared?.release();
  });
  imageUrl.value = "";
  error.value = "";
  loading.value = true;
  naturalWidth.value = 0;
  naturalHeight.value = 0;
  try {
    shared = props.context.files.acquireUrl(props.context.resource.path);
    const url = await shared.url;
    if (!cancelled) imageUrl.value = url;
  } catch (reason) {
    if (!cancelled) error.value = reason instanceof Error ? reason.message : "图片读取失败";
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.imageDocument {
  display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0;
  .imageToolbar {
    display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; padding: 6px; border-bottom: 1px solid var(--el-border-color-lighter);
    > span { min-width: 48px; text-align: center; font-size: 12px; }
  }
  .imagePreview {
    box-sizing: border-box; display: flex; flex: 1; min-height: 0; padding: 24px; overflow: auto;
    img { display: block; flex-shrink: 0; margin: auto; max-width: none; object-fit: contain; }
    .imageStatus { margin: auto; color: var(--el-text-color-secondary); font-size: 14px; }
    .imageError { margin: auto; color: var(--el-color-danger); font-size: 14px; }
  }
}
</style>
