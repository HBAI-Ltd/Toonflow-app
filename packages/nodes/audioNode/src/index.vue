<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :processing="task"
    :topVisible="node.selected && !task"
    topWidth="max-content"
    :downloadUrl="outputFile ? previewUrl : ''"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    :fullscreenVisible="false"
    style="width: 360px">
    <template #topActions>
      <el-button :icon="IconTextRecognition" :loading="transcribing" :disabled="!outputFile || uploading || actions?.processing" text title="语音转文字" aria-label="语音转文字" @click.stop="transcribe">语音转文字</el-button>
      <el-button v-if="transcribing" :icon="IconPlayerStop" text title="取消转文字" aria-label="取消转文字" @click.stop="cancelTranscription">取消</el-button>
      <el-button :icon="IconScissors" :disabled="!previewUrl || uploading || transcribing || actions?.processing" text title="剪辑音频" aria-label="剪辑音频" @click.stop="actions?.open('audioClip', $event)">剪辑音频</el-button>
      <el-button :icon="IconGauge" :disabled="!previewUrl || uploading || transcribing || actions?.processing" text title="调整播放速度" aria-label="调整播放速度" @click.stop="actions?.open('audioSpeed', $event)">调整播放速度</el-button>
      <el-button
        :icon="IconTransfer"
        :loading="uploading"
        :disabled="transcribing || actions?.processing"
        text
        title="替换音频"
        aria-label="替换音频"
        @click.stop="toolMenu?.replaceSource('替换音频')">替换音频</el-button>
      <mediaToolMenu ref="toolMenu" :tools="actions?.audioSourceTools ?? []" :source="outputFile" sourceKind="audio" :importSource="setAudioFile" :disabled="uploading || transcribing || actions?.processing" @select="actions?.openTool($event)" />
    </template>
    <div class="audioContent nopan" :inert="!!task">
      <audioPlayer
        v-if="previewUrl"
        ref="player"
        class="audioPreview"
        :src="previewUrl"
        :mimeType="previewFile?.mimeType"
        v-model:pcmOptions="pcmOptions"
        @loadedmetadata="updateNodeInternals" />
      <input ref="fileInput" class="fileInput" type="file" accept="audio/*" aria-label="选择音频" :disabled="uploading || transcribing || actions?.processing" @change="uploadAudio" />
      <div v-if="!task && !outputs.audio" class="emptyActions">
        <el-button
          class="nodrag nopan"
          :icon="IconUpload"
          text
          :loading="uploading"
          title="上传音频"
          aria-label="上传音频"
          @dblclick.stop
          @click.stop="fileInput?.click()">上传</el-button>
        <el-button
          v-if="files.pickAsset"
          class="nodrag nopan"
          :icon="IconFolder"
          text
          :disabled="uploading"
          title="从素材库选择音频"
          aria-label="从素材库选择音频"
          @dblclick.stop
          @click.stop="selectAsset">从素材库选择</el-button>
      </div>
    </div>
  </nodeSkeleton>
  <audioActions ref="actions" v-model:pcmOptions="pcmOptions" :file="outputFile" :src="previewUrl" :disabled="uploading || transcribing" @pause="player?.pause()" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconMusic, IconUpload, IconFolder, IconTransfer, IconScissors, IconGauge, IconTextRecognition, IconPlayerStop } from "@tabler/icons-vue";
import { ElButton, ElMessage } from "element-plus";
import { nodeSkeleton, nodeTools, useNode, z, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";
import { useAudioTranscription } from "@toonflow/node-shared/useAudioTranscription";
import { getMediaMimeType } from "@toonflow/node-shared/mediaTypes";
import { isPcmMimeType, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { useMediaToolResult } from "@toonflow/node-shared/mediaTools";
import audioPlayer from "./components/audioPlayer.vue";
import audioActions from "./components/audioActions.vue";
import mediaToolMenu from "@toonflow/node-shared/mediaToolMenu";

defineOptions({
  inheritAttrs: false,
  icon: IconMusic,
  handles: [{ id: "audio", type: "source", dataType: "AUDIO", label: "音频输出" }] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, nodeEvent, files, updateNodeInternals } = useNode({
  label: "音频",
});
const { task, preview } = useMediaToolResult(node.id, "audio");
const fileInput = ref<HTMLInputElement>();
const toolMenu = ref<InstanceType<typeof mediaToolMenu>>();
const uploading = ref(false);
const player = ref<InstanceType<typeof audioPlayer>>();
const actions = ref<InstanceType<typeof audioActions>>();

const outputFile = computed(() => outputs.value.audio?.dataType === "AUDIO" ? outputs.value.audio.value : undefined);
// 原节点的裸 PCM 参数不包含在素材引用中，结果节点只预览可独立解码的源音频。
const previewFile = computed(() => outputFile.value ?? (preview.value && !isPcmMimeType(preview.value.mimeType) ? preview.value : undefined));
const pcmOptions = ref<Partial<PcmOptions>>({});
watch(() => outputFile.value?.url, () => { pcmOptions.value = {}; }, { flush: "sync" });
const { processing: transcribing, transcribe, cancel: cancelTranscription, cancelAndWait: cancelTranscriptionAndWait } = useAudioTranscription(outputFile);
const previewUrl = files.useFileUrl(
  previewFile,
  (error) => showError(error, "音频读取失败")
);

nodeEvent.on("save", reason => {
  if (uploading.value) throw new Error("音频处理中，请完成后再切换或刷新节点");
  if (reason === "reload" && (actions.value?.processing || transcribing.value)) throw new Error("音频处理中，请完成或取消后再刷新节点");
});
nodeEvent.on("delete", async () => {
  if (uploading.value) throw new Error("音频上传中，请稍后删除节点");
  uploading.value = true;
  try {
    await Promise.all([actions.value?.cancelAndWait(), cancelTranscriptionAndWait()]);
    await files.removeNodeFiles();
  } finally {
    uploading.value = false;
  }
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
    if (task.value || uploading.value || transcribing.value || actions.value?.processing) throw new Error("音频处理中，请稍后重试");
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

function uploadAudio(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void setAudioFile(file);
}

async function selectAsset() {
  const file = await files.pickAsset?.("audio");
  if (file) await setAudioFile(file);
}

async function setAudioFile(file: File, canCommit?: () => boolean): Promise<string | void> {
  if (canCommit && !canCommit()) return;
  if (uploading.value || transcribing.value || actions.value?.processing) return;
  const mimeType = getMediaMimeType(file);
  if (!mimeType.startsWith("audio/")) return void ElMessage.error("请选择音频文件");
  if (!file.size || file.size > 100 * 1024 * 1024) return void ElMessage.error("音频不能为空且不能超过 100 MB");
  uploading.value = true;
  try {
    const url = await files.uploadFile(file);
    if (canCommit && !canCommit()) return;
    // ACT: 复制节点可能仍引用旧音频，替换输出不删除共享文件。
    outputs.value.audio = { dataType: "AUDIO", value: { url, mimeType } };
    return url;
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
  &[inert] :deep(.playerControls) { visibility: hidden; }
  position: relative;
  min-height: 144px;
  display: flex;
  align-items: center;
  justify-content: center;

  .nodeSkeleton.resized & {
    height: 100%;
    min-height: 0;
    align-items: flex-start;
  }

  .audioPreview {
    display: block;
    width: 100%;
    border-radius: var(--el-border-radius-base);
  }

  .fileInput {
    display: none;
  }

  .emptyActions {
    display: flex;
    align-items: center;
    align-self: center;
    gap: 4px;

    .el-button { margin: 0; }
  }
}
</style>
