<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :topVisible="node.selected"
    topWidth="max-content"
    :downloadUrl="previewUrl"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    style="width: 320px"
    @fullscreen="enterFullscreen">
    <template #topActions>
      <el-button
        :icon="IconTransfer"
        :loading="uploading"
        text
        title="替换音频"
        aria-label="替换音频"
        @click.stop="fileInput?.click()" />
    </template>
    <div ref="audioContent" class="audioContent nopan nowheel">
      <audio
        v-if="previewUrl"
        class="audioPreview nodrag"
        :src="previewUrl"
        controls
        preload="metadata"
        draggable="false"
        @pointerdown.stop
        @mousedown.stop
        @dblclick.stop
        aria-label="节点音频"
        @loadedmetadata="updateNodeInternals"
        @error="ElMessage.error('无法预览该音频')" />
      <input ref="fileInput" class="fileInput" type="file" accept="audio/*" aria-label="选择音频" :disabled="uploading" @change="uploadAudio" />
      <el-button
        v-if="!outputs.audio"
        class="uploadButton"
        text
        :loading="uploading"
        title="上传音频"
        aria-label="上传音频"
        @dblclick.stop
        @click="fileInput?.click()">
        <icon-upload v-if="!uploading" :size="48" stroke="1.5" />
      </el-button>
    </div>
  </nodeSkeleton>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconMusic, IconUpload, IconTransfer } from "@tabler/icons-vue";
import { ElButton, ElMessage } from "element-plus";
import { nodeSkeleton, nodeTools, useNode, z, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";

defineOptions({
  inheritAttrs: false,
  icon: IconMusic,
  handles: [{ id: "audio", type: "source", dataType: "AUDIO", label: "音频输出" }] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, nodeEvent, files, updateNodeInternals } = useNode({
  label: "音频",
});
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const audioContent = ref<HTMLDivElement>();

const outputFile = computed(() => outputs.value.audio?.dataType === "AUDIO" ? outputs.value.audio.value : undefined);
const previewUrl = files.useFileUrl(
  outputFile,
  (error) => showError(error, "音频读取失败")
);

async function enterFullscreen() {
  try { await audioContent.value?.requestFullscreen(); }
  catch (error) { showError(error, "无法进入音频全屏"); }
}

nodeEvent.on("save", () => {
  if (uploading.value) throw new Error("音频处理中，请完成后再切换或刷新节点");
});
nodeEvent.on("delete", () => {
  if (uploading.value) throw new Error("音频上传中，请稍后删除节点");
  uploading.value = true;
  return files.removeNodeFiles().finally(() => {
    uploading.value = false;
  });
});

nodeTools.register({
  name: "setAudio",
  description: "选择工作区内已有的音频文件作为此节点的输出，path 使用工作区相对路径",
  parameters: z.strictObject({
    path: z.string().min(1).max(4096),
    mimeType: z.string().regex(/^audio\/[a-zA-Z0-9.+-]+$/),
  }),
  async execute({ path, mimeType }, { signal }) {
    signal?.throwIfAborted();
    if (uploading.value) throw new Error("音频处理中，请稍后重试");
    uploading.value = true;
    try {
      const content = await files.getWorkspaceFiles().read(path);
      signal?.throwIfAborted();
      if (!content.byteLength || content.byteLength > 100 * 1024 * 1024) throw new Error("音频不能为空且不能超过 100 MB");
      outputs.value.audio = { dataType: "AUDIO", value: { url: path, mimeType } };
      return outputs.value.audio;
    } finally {
      uploading.value = false;
    }
  },
});

async function uploadAudio(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || uploading.value) return;
  if (!file.type.startsWith("audio/")) return void ElMessage.error("请选择音频文件");
  if (!file.size || file.size > 100 * 1024 * 1024) return void ElMessage.error("音频不能为空且不能超过 100 MB");
  uploading.value = true;
  try {
    const url = await files.uploadFile(file);
    // ACT: 复制节点可能仍引用旧音频，替换输出不删除共享文件。
    outputs.value.audio = { dataType: "AUDIO", value: { url, mimeType: file.type } };
  } catch (error) {
    showError(error, "音频替换失败");
  } finally {
    uploading.value = false;
  }
}

function showError(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  ElMessage.error(message || (error instanceof Error ? error.message : fallback));
}
</script>

<style scoped lang="scss">
.audioContent {
  position: relative;
  min-height: 144px;
  display: flex;
  align-items: center;

  &:fullscreen {
    justify-content: center;
    padding: 48px;
    background: var(--el-bg-color);

    .audioPreview {
      max-width: 720px;
    }

  }

  .audioPreview {
    display: block;
    width: 100%;
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
