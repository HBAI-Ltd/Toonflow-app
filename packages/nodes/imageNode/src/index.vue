<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :topVisible="node.selected"
    topWidth="max-content"
    :downloadUrl="previewUrl"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    @fullscreen="previewVisible = true"
    :style="{ width: previewUrl && imageWidth ? `${imageWidth + 18}px` : undefined }">
    <template #topActions>
      <el-button
        :icon="IconTransfer"
        :loading="uploading"
        text
        :title="t('replaceImage')"
        :aria-label="t('replaceImage')"
        @click.stop="fileInput?.click()" />
    </template>
    <div class="imageContent nopan">
      <img
        v-if="previewUrl"
        class="imagePreview"
        :src="previewUrl"
        draggable="false"
        :alt="t('nodeImage')"
        @load="resizeImage"
        @error="ElMessage.error(t('imagePreviewFailed'))" />
      <input ref="fileInput" class="fileInput" type="file" accept="image/*" :aria-label="t('chooseImage')" :disabled="uploading" @change="uploadImage" />
      <el-button
        v-if="!outputFile"
        class="uploadButton"
        text
        :loading="uploading"
        :title="t('uploadImage')"
        :aria-label="t('uploadImage')"
        @dblclick.stop
        @click="fileInput?.click()">
        <icon-upload v-if="!uploading" :size="48" stroke="1.5" />
      </el-button>
    </div>
  </nodeSkeleton>
  <el-image-viewer
    v-if="previewVisible && previewUrl"
    :urlList="[previewUrl]"
    teleported
    @close="previewVisible = false" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { IconPhoto, IconUpload, IconTransfer } from "@tabler/icons-vue";
import { ElButton, ElImageViewer, ElMessage } from "element-plus";
import { nodeSkeleton, nodeTools, useNode, z, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";
import { createDisplayError, createTranslator, getErrorDisplay } from "@toonflow/i18n";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });

defineOptions({
  inheritAttrs: false,
  icon: IconPhoto,
  handles: [{ id: "image", type: "source", dataType: "IMAGE", label: "图片输出" }] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, nodeEvent, files, updateNodeInternals } = useNode({
  label: "图片",
});
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const previewVisible = ref(false);
const imageWidth = ref(0);

const outputFile = computed(() => outputs.value.image?.dataType === "IMAGE" ? outputs.value.image.value : undefined);
const previewUrl = files.useFileUrl(
  outputFile,
  (error) => showError(error, t("imageReadFailed"))
);

nodeEvent.on("save", () => {
  if (uploading.value) throw createDisplayError("图片处理中，请完成后再切换或刷新节点", () => t("imageBusySave"));
});
nodeEvent.on("delete", () => {
  if (uploading.value) throw createDisplayError("图片上传中，请稍后删除节点", () => t("imageUploadingDelete"));
  uploading.value = true;
  return files.removeNodeFiles().finally(() => {
    uploading.value = false;
  });
});

nodeTools.register({
  name: "setImage",
  description: "选择工作区内已有的图片文件作为此节点的输出，path 使用工作区相对路径",
  parameters: z.strictObject({
    path: z.string().min(1).max(4096),
    mimeType: z.string().regex(/^image\/[a-zA-Z0-9.+-]+$/),
  }),
  async execute({ path, mimeType }, { signal }) {
    signal?.throwIfAborted();
    if (uploading.value) throw createDisplayError("图片处理中，请稍后重试", () => t("imageBusy"));
    uploading.value = true;
    try {
      const content = await files.getWorkspaceFiles().read(path);
      signal?.throwIfAborted();
      if (!content.byteLength || content.byteLength > 100 * 1024 * 1024) throw createDisplayError("图片不能为空且不能超过 100 MB", () => t("imageSize"));
      outputs.value.image = { dataType: "IMAGE", value: { url: path, mimeType } };
      return outputs.value.image;
    } finally {
      uploading.value = false;
    }
  },
});

async function resizeImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (!image.naturalWidth || !image.naturalHeight) return;
  imageWidth.value = 240 * image.naturalWidth / image.naturalHeight;
  await nextTick();
  updateNodeInternals();
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || uploading.value) return;
  if (!file.type.startsWith("image/")) return void ElMessage.error(t("chooseImageFile"));
  if (!file.size || file.size > 100 * 1024 * 1024) return void ElMessage.error(t("imageSize"));
  uploading.value = true;
  try {
    const url = await files.uploadFile(file);
    // ACT: 复制节点可能仍引用旧图片，替换输出不删除共享文件。
    outputs.value.image = { dataType: "IMAGE", value: { url, mimeType: file.type } };
  } catch (error) {
    showError(error, t("imageReplaceFailed"));
  } finally {
    uploading.value = false;
  }
}

function showError(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  ElMessage.error(message || (error instanceof Error ? getErrorDisplay(error) : fallback));
}
</script>

<style scoped lang="scss">
.imageContent {
  min-height: 144px;

  .imagePreview {
    display: block;
    width: 100%;
    max-height: 240px;
    object-fit: contain;
    border-radius: var(--el-border-radius-base);
  }

  .fileInput {
    display: none;
  }

  .uploadButton {
    width: 100%;
    height: 144px;
    padding: 0;
    color: var(--el-text-color-placeholder);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>
