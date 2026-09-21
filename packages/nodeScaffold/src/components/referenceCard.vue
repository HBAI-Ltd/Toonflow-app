<template>
  <div class="referenceItem" role="group" :title="title" :aria-label="title" @keydown.enter.self.stop.prevent="imageRef?.showPreview()" @keydown.space.self.stop.prevent="imageRef?.showPreview()">
    <el-image
      v-if="item.dataType === 'IMAGE' && previewUrl && !previewError"
      ref="imageRef"
      class="preview"
      :src="previewUrl"
      :previewSrcList="[previewUrl]"
      previewTeleported
      fit="cover"
      :alt="`预览引用 ${index}`"
      draggable="false"
      @click.stop
      @error="mediaError" />
    <video
      v-else-if="item.dataType === 'VIDEO' && previewUrl && !previewError"
      class="preview"
      :src="previewUrl"
      preload="auto"
      muted
      playsinline
      aria-hidden="true"
      @loadedmetadata="readDuration"
      @loadeddata="readVideoPreview"
      @error="mediaError" />
    <component v-else :is="itemIcon" class="typeIcon" :size="21" aria-hidden="true" />
    <el-button
      class="removeButton nodrag nopan"
      :icon="IconX"
      circle
      :aria-label="`删除引用 ${index}`"
      title="删除引用"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
      @click.stop="emit('remove')" />
    <span class="indexBadge" aria-hidden="true">{{ index }}</span>
    <div v-if="item.dataType === 'VIDEO' && previewUrl && !previewError" class="videoInfo" aria-hidden="true">
      <icon-player-play :size="12" />
      <span v-if="duration">{{ duration }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElButton, ElImage } from "element-plus";
import { IconX, IconFileText, IconPhoto, IconVideo, IconMusic, IconPlayerPlay } from "@tabler/icons-vue";
import { useNodeFiles } from "../workspaceFiles";
import type { NodeInputValue } from "../values";

const props = defineProps<{ item: NodeInputValue; index: number }>();
const emit = defineEmits<{ remove: []; preview: [url: string] }>();
const imageRef = ref<InstanceType<typeof ElImage>>();
const previewError = ref("");
const duration = ref("");
const videoThumbnail = ref("");
const media = computed(() => props.item.value !== undefined && (props.item.dataType === "IMAGE" || props.item.dataType === "VIDEO") ? { ...props.item.value } : undefined);
const itemIcon = computed(() => props.item.dataType === "IMAGE" ? IconPhoto : props.item.dataType === "VIDEO" ? IconVideo : props.item.dataType === "AUDIO" ? IconMusic : IconFileText);
const title = computed(() => {
  const content = props.item.value === undefined ? "暂无内容" : props.item.dataType === "STRING" ? props.item.value : props.item.dataType === "VIDEO" ? "视频" : props.item.dataType === "AUDIO" ? "音频" : "图片";
  return `引用 ${props.index}：${content}${previewError.value ? `（${previewError.value}）` : ""}`;
});

watch(media, () => {
  previewError.value = "";
  duration.value = "";
  videoThumbnail.value = "";
});
const { useFileUrl } = useNodeFiles();
const previewUrl = useFileUrl(media, error => {
  previewError.value = error instanceof Error ? error.message : "读取引用文件失败";
});

watch([previewUrl, previewError, videoThumbnail], ([url, error, thumbnail]) => {
  emit("preview", error ? "" : props.item.dataType === "VIDEO" ? thumbnail : url);
}, { immediate: true });

function mediaError() {
  previewError.value = props.item.dataType === "VIDEO" ? "无法预览该视频" : "无法预览该图片";
}

function readVideoPreview(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  if (video.currentSrc !== previewUrl.value || !video.videoWidth || !video.videoHeight) return;
  const canvas = document.createElement("canvas");
  const scale = 96 / Math.max(video.videoWidth, video.videoHeight);
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  videoThumbnail.value = canvas.toDataURL("image/webp");
}

function readDuration(event: Event) {
  const seconds = (event.currentTarget as HTMLVideoElement).duration;
  if (!Number.isFinite(seconds) || seconds < 0) return;
  const totalSeconds = Math.floor(seconds);
  duration.value = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
</script>

<style scoped>
.referenceItem {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  &.referenceGhost {
    opacity: 0.35;
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
  }

  .preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .removeButton {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    padding: 0;
    margin: 0;
  }

  .indexBadge {
    position: absolute;
    top: 2px;
    left: 2px;
    min-width: 13px;
    padding: 0 2px;
    border-radius: 3px;
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);
    font-size: 9px;
    line-height: 13px;
    text-align: center;
  }

  .videoInfo {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    padding: 2px 3px;
    background: color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent);
    color: var(--el-text-color-primary);
    font-size: 9px;
    line-height: 12px;
  }
}
</style>
