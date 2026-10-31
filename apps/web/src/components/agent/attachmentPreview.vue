<template>
  <div class="thumbnailItem" :class="{ fileAttachment: !isMedia }">
    <template v-if="isText">
      <button class="textAttachmentButton" type="button" :title="attachment.name" :aria-label="`预览 ${attachment.name}`" @click="textPreviewVisible = true">
        <icon-file-text :size="18" />
        <span>{{ attachment.name }}</span>
      </button>
      <el-button v-if="restorable" class="restoreAttachment" text size="small" :disabled="disabled" @click="emit('restore')">还原到输入框</el-button>
    </template>
    <el-image
      v-else-if="attachment.mimeType.startsWith('image/')"
      ref="imageRef"
      class="thumbnailImage"
      :src="mediaSrc"
      :previewSrcList="mediaSrc && !preparingPreview && !previewError ? [mediaSrc] : []"
      previewTeleported
      fit="cover"
      :alt="attachment.name"
      :title="previewError || (preparingPreview ? '正在生成兼容预览…' : attachment.name)"
      :aria-busy="preparingPreview"
      tabindex="0"
      role="button"
      :aria-label="`预览 ${attachment.name}`"
      @keydown.enter.prevent="imageRef?.showPreview()"
      @keydown.space.prevent="imageRef?.showPreview()"
      @load="handleLoaded"
      @error="handleError">
      <template #error><icon-photo :size="20" /></template>
    </el-image>
    <button v-else-if="attachment.mimeType.startsWith('video/')" class="thumbnailButton" type="button" :title="previewError || (preparingPreview ? '正在生成兼容预览…' : attachment.name)" :aria-label="`预览 ${attachment.name}`" :aria-busy="preparingPreview" :disabled="!thumbnailUrl" @click="videoPreviewVisible = true">
      <video v-if="mediaSrc && !preparingPreview && !previewError" :src="mediaSrc" preload="auto" muted playsinline aria-hidden="true" @loadeddata="handleLoaded" @error="handleError" />
      <icon-video class="videoIcon" :size="16" />
    </button>
    <div v-else class="fileAttachmentCard" :title="attachment.name"><icon-file-text :size="18" /><span>{{ attachment.name }}</span></div>
    <el-button v-if="removable" class="removeAttachment" circle :disabled="disabled" :aria-label="`移除 ${attachment.name}`" title="移除附件" @click="emit('remove')"><icon-x :size="10" /></el-button>
    <el-dialog v-model="videoPreviewVisible" :title="attachment.name" width="min(800px, 90vw)" alignCenter appendToBody destroyOnClose>
      <p v-if="preparingPreview || previewError" :role="previewError ? 'alert' : 'status'">{{ preparingPreview ? '正在生成兼容预览…' : previewError }}</p>
      <video v-else-if="videoPreviewVisible && mediaSrc" class="videoPreview" :src="mediaSrc" controls playsinline preload="auto" @loadeddata="handleLoaded" @error="handleError" />
    </el-dialog>
    <el-dialog v-model="textPreviewVisible" :title="attachment.name" width="min(720px, 90vw)" alignCenter appendToBody destroyOnClose>
      <p v-if="textLoading || textError" :role="textError ? 'alert' : 'status'">{{ textLoading ? '正在读取…' : textError }}</p>
      <pre v-else class="textPreview">{{ textContent }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ImageInstance } from "element-plus";
import { IconFileText, IconPhoto, IconVideo, IconX } from "@tabler/icons-vue";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import type { AgentAttachment } from "./types";
import { readTextAttachment } from "./textAttachments";

const props = defineProps<{ attachment: AgentAttachment; directory?: string; removable?: boolean; restorable?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ remove: []; restore: [] }>();
const isText = computed(() => props.attachment.mimeType === "text/plain");
const isMedia = computed(() => /^(image|video)\//.test(props.attachment.mimeType));
const textPreviewVisible = ref(false);
const textContent = ref("");
const textLoading = ref(false);
const textError = ref("");
const imageRef = ref<ImageInstance>();
const videoPreviewVisible = ref(false);
const thumbnailUrl = ref("");
const { src: mediaSrc, preparing: preparingPreview, error: previewError, handleError, handleLoaded } = useMediaPreview(thumbnailUrl, () => props.attachment.mimeType.startsWith("video/") ? "video" : "image");

watch(() => [props.directory, props.attachment.file, props.attachment.path, props.attachment.mimeType] as const, async ([directory, file, path, mimeType], _previous, onCleanup) => {
  videoPreviewVisible.value = false;
  thumbnailUrl.value = "";
  if (!/^(image|video)\//.test(mimeType)) return;
  let cancelled = false;
  let release = () => {};
  onCleanup(() => { cancelled = true; release(); });
  try {
    if (file) {
      const url = URL.createObjectURL(file);
      release = () => URL.revokeObjectURL(url);
      thumbnailUrl.value = url;
    } else if (directory) {
      const preview = useWorkspaceFiles(directory).acquireUrl(path, mimeType);
      release = preview.release;
      const url = await preview.url;
      if (!cancelled) thumbnailUrl.value = url;
    }
  } catch {
    if (!cancelled) thumbnailUrl.value = "";
  }
}, { immediate: true });

watch([textPreviewVisible, () => props.attachment, () => props.directory], async ([visible, attachment, directory], _previous, onCleanup) => {
  textContent.value = "";
  textError.value = "";
  textLoading.value = false;
  if (!visible || attachment.mimeType !== "text/plain") return;
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  textLoading.value = true;
  try {
    const text = await readTextAttachment(attachment, directory);
    if (!cancelled) textContent.value = text;
  } catch {
    if (!cancelled) textError.value = "无法读取文本附件，请重试";
  } finally {
    if (!cancelled) textLoading.value = false;
  }
});
</script>

<style scoped lang="scss">
.thumbnailItem {
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 38px;

  &.fileAttachment {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: min(160px, 100%);
    height: auto;
    padding: 6px 8px;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);

    .textAttachmentButton,
    .fileAttachmentCard {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--el-text-color-primary);
      font: inherit;
      font-size: 12px;
      &.textAttachmentButton { cursor: pointer; }

      svg { flex-shrink: 0; color: var(--el-color-primary); }
      span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }

    .restoreAttachment { height: 20px; margin: 2px 0 0 24px; padding: 0; font-size: 11px; }
  }

  .thumbnailButton,
  .thumbnailImage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;

    .el-image,
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    :deep(.el-image__error) {
      background: transparent;
    }

    .videoIcon {
      position: absolute;
      right: 3px;
      bottom: 3px;
      color: white;
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
    }
  }

  .removeAttachment {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    opacity: 0;
    pointer-events: none;
  }

  &:hover .removeAttachment,
  &:focus-within .removeAttachment {
    opacity: 1;
    pointer-events: auto;
  }

}

.videoPreview {
  display: block;
  width: 100%;
  max-height: 70vh;
}

.textPreview {
  max-height: 60vh;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
}
</style>
