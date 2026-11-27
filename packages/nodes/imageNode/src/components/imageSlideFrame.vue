<template>
  <img v-if="preview && !error" :src="preview" :alt="alt" draggable="false" @load="loaded" @error="handleError" />
  <span v-else-if="error" class="slideError" role="status">{{ error }}</span>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useMediaToolAttachment } from "@toonflow/node-shared/useMediaToolAttachment";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import type { MediaToolAttachment } from "@toonflow/node-shared/mediaTools";

const props = defineProps<{ src?: string; attachment?: MediaToolAttachment; alt: string }>();
const emit = defineEmits<{ ready: [value: boolean]; dimensions: [image: { width: number; height: number }] }>();
const { src: attachmentSrc, error: readError } = useMediaToolAttachment(() => props.attachment);
const { src: preview, error: previewError, handleError, handleLoaded } = useMediaPreview(() => props.src || attachmentSrc.value, "image");
const error = computed(() => readError.value || previewError.value);
watch([preview, error], () => emit("ready", false), { immediate: true, flush: "sync" });
function loaded(event: Event) {
  const ready = handleLoaded(event);
  if (ready) {
    const image = event.currentTarget as HTMLImageElement;
    emit("dimensions", { width: image.naturalWidth, height: image.naturalHeight });
  }
  emit("ready", ready);
}
</script>

<style scoped lang="scss">
img { display: block; width: 100%; height: 100%; object-fit: contain; }
.slideError { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
