<template>
  <span class="referenceThumbnail" aria-hidden="true" :aria-busy="preparingPreview" :title="preparingPreview ? '正在生成兼容预览…' : previewError || undefined">
    <template v-if="mediaSrc && !failed && !preparingPreview && !previewError">
      <img v-if="previewKind === 'image'" :src="mediaSrc" alt="" draggable="false" @load="handleLoaded" @error="handleError" />
      <video v-else :src="mediaSrc" preload="auto" muted playsinline @loadeddata="handleLoaded" @error="handleError" />
    </template>
    <component v-else :is="typeIcon" :size="16" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconFileText, IconMusic, IconPhoto, IconVideo } from "@tabler/icons-vue";
import { useNodeFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/values";
import { useMediaPreview } from "../mediaPreview";

const props = defineProps<{ dataType?: string; avatar?: string | URL; media?: NodeMediaValue }>();
const failed = ref(false);
const { useFileUrl } = useNodeFiles();
const fileUrl = useFileUrl(() => !props.avatar && (props.dataType === "IMAGE" || props.dataType === "VIDEO") ? props.media : undefined, () => { failed.value = true; });
const previewKind = computed(() => !props.avatar && props.dataType === "VIDEO" ? "video" : "image");
const { src: mediaSrc, preparing: preparingPreview, error: previewError, handleError, handleLoaded } = useMediaPreview(() => String(props.avatar || fileUrl.value), previewKind);
const typeIcon = computed(() => props.dataType === "IMAGE" ? IconPhoto : props.dataType === "VIDEO" ? IconVideo : props.dataType === "AUDIO" ? IconMusic : IconFileText);
watch([() => props.avatar, () => props.media, () => props.dataType], () => { failed.value = false; }, { flush: "sync" });
</script>

<style scoped lang="scss">
.referenceThumbnail {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  overflow: hidden;
  border-radius: var(--el-border-radius-small);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
