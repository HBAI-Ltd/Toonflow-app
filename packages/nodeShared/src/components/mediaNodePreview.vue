<template>
  <div
    class="mediaNodePreview"
    @load.capture="readSize"
    @loadedmetadata.capture="readSize"
    @resize.capture="readSize"
    @error.capture="resolution = ''"
    @emptied.capture="resolution = ''">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = defineProps<{ src: string }>();
const resolution = defineModel<string>("resolution", { default: "" });
watch(() => props.src, () => { resolution.value = ""; }, { immediate: true });
onBeforeUnmount(() => { resolution.value = ""; });

function readSize(event: Event) {
  const media = event.target;
  if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return;
  if (!props.src || media.currentSrc !== media.src) return;
  const [width, height] = media instanceof HTMLImageElement
    ? [media.naturalWidth, media.naturalHeight]
    : [media.videoWidth, media.videoHeight];
  resolution.value = width && height ? `${width}x${height}` : "";
}
</script>
