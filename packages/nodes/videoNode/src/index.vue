<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :titleDetail="resolution"
    :processing="task"
    :topVisible="node.selected && !task"
    topWidth="max-content"
    :downloadUrl="!exporting && outputFile ? previewUrl : ''"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    :mediaAspect="previewUrl ? videoAspect : 0"
    @pointerenter="hovered = $event.pointerType !== 'touch'"
    @pointerleave="hovered = false"
    @fullscreen="player?.enterFullscreen()">
    <template #topActions>
      <el-button :icon="IconMovie" text :disabled="!outputFile || uploading || exporting || actions?.processing || actions?.creatingAnalysis" @click.stop="actions?.createRetake()">片段重拍</el-button>
      <el-button :icon="IconMusic" text :disabled="!outputFile || uploading || exporting || actions?.processing" @click.stop="actions?.open('extractAudio')">提取声音</el-button>
      <el-button :icon="IconLayersSubtract" text :disabled="!outputFile || uploading || exporting || actions?.processing" @click.stop="actions?.open('separate')">分离音视频</el-button>
      <el-button :icon="IconScissors" text :disabled="!outputFile || uploading || exporting || actions?.processing" @click.stop="actions?.open('trim')">截取片段</el-button>
      <el-button :icon="IconMovie" text :loading="actions?.creatingAnalysis" :disabled="!outputFile || uploading || exporting || actions?.processing || actions?.creatingAnalysis" @click.stop="actions?.createFrameAnalysis()">逐帧拉片</el-button>
      <el-button
        :icon="IconTransfer"
        :loading="uploading"
        :disabled="actions?.processing || exporting"
        text
        title="替换视频"
        aria-label="替换视频"
        @click.stop="toolMenu?.replaceSource('替换视频')">替换视频</el-button>
      <mediaToolMenu ref="toolMenu" :tools="actions?.tools ?? []" :source="outputFile" sourceKind="video" :importSource="setVideoFile" :disabled="uploading || exporting || actions?.processing || actions?.creatingAnalysis || player?.capturing" @select="actions?.openTool($event)" />
    </template>
    <template #topRightActions>
      <el-dropdown trigger="click" placement="bottom-end" :disabled="actions?.processing || !player?.ready || player?.capturing || uploading || exporting" @command="player?.captureFrame($event)">
        <el-button :icon="IconPhotoScan" :loading="player?.capturing" :disabled="actions?.processing || !player?.ready || player?.capturing || uploading || exporting" text title="截取视频帧" aria-label="截取视频帧" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="current" :icon="IconPhotoScan">截取当前帧</el-dropdown-item>
            <el-dropdown-item command="first" :icon="IconPlayerSkipBack">截取首帧</el-dropdown-item>
            <el-dropdown-item command="last" :icon="IconPlayerSkipForward">截取尾帧</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
    <mediaNodePreview v-model:resolution="resolution" :src="exporting ? '' : previewUrl" class="videoContent nopan" :inert="!!task">
      <div v-if="exporting" class="exportLoading" role="status" aria-label="视频导出中">
        <el-progress type="circle" :percentage="exportProgress" :width="64" :strokeWidth="3" />
        <span>正在导出视频</span>
      </div>
      <videoPlayer
        v-else-if="previewUrl"
        ref="player"
        :src="previewUrl"
        :hoverPlaying="hovered && !task"
        @loadedmetadata="resizeVideo" />
      <input ref="fileInput" class="fileInput" type="file" accept="video/*" aria-label="选择视频" :disabled="uploading || exporting || actions?.processing" @change="uploadVideo" />
      <div v-if="!task && !exporting && !outputs.video" class="emptyActions">
        <el-button
          class="nodrag nopan"
          :icon="IconUpload"
          text
          :loading="uploading"
          title="上传视频"
          aria-label="上传视频"
          @dblclick.stop
          @click.stop="fileInput?.click()">上传</el-button>
        <el-button
          v-if="files.pickAsset"
          class="nodrag nopan"
          :icon="IconFolder"
          text
          :disabled="uploading"
          title="从素材库选择视频"
          aria-label="从素材库选择视频"
          @dblclick.stop
          @click.stop="selectAsset">从素材库选择</el-button>
      </div>
    </mediaNodePreview>
  </nodeSkeleton>
  <videoActions ref="actions" :file="outputFile" :src="previewUrl" :disabled="uploading || exporting" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import mediaNodePreview from "@toonflow/node-shared/mediaNodePreview";
import { IconVideo, IconUpload, IconFolder, IconTransfer, IconMusic, IconLayersSubtract, IconScissors, IconMovie, IconPhotoScan, IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-vue";
import { ElButton, ElMessage, ElProgress, ElDropdown, ElDropdownMenu, ElDropdownItem } from "element-plus";
import { nodeSkeleton, nodeTools, useNode, z, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";
import videoPlayer from "./components/videoPlayer.vue";
import videoActions from "./components/videoActions.vue";
import { getMediaMimeType } from "@toonflow/node-shared/mediaTypes";
import { useMediaToolResult } from "@toonflow/node-shared/mediaTools";
import mediaToolMenu from "@toonflow/node-shared/mediaToolMenu";

defineOptions({
  inheritAttrs: false,
  icon: IconVideo,
  handles: [{ id: "video", type: "source", dataType: "VIDEO", label: "视频输出" }] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, nodeEvent, files, updateNodeInternals } = useNode({
  label: "视频",
});
const { task, preview } = useMediaToolResult(node.id, "video");
const fileInput = ref<HTMLInputElement>();
const toolMenu = ref<InstanceType<typeof mediaToolMenu>>();
const uploading = ref(false);
const hovered = ref(false);
const player = ref<InstanceType<typeof videoPlayer>>();
const actions = ref<InstanceType<typeof videoActions>>();
const exportProgress = computed(() => (node.data as typeof node.data & { exportProgress?: number }).exportProgress);
const exporting = computed(() => typeof exportProgress.value === "number");
const videoAspect = ref(0);
const resolution = ref("");

const outputFile = computed(() => outputs.value.video?.dataType === "VIDEO" ? outputs.value.video.value : undefined);
const previewUrl = files.useFileUrl(
  () => outputFile.value ?? preview.value,
  (error) => showError(error, "视频读取失败")
);

nodeEvent.on("save", (reason) => {
  if (uploading.value) throw new Error("视频处理中，请完成后再切换或刷新节点");
  if (reason === "reload" && exporting.value) throw new Error("视频正在导出，请完成后再刷新节点");
});
nodeEvent.on("delete", () => {
  if (uploading.value) throw new Error("视频上传中，请稍后删除节点");
  uploading.value = true;
  return files.removeNodeFiles().finally(() => {
    uploading.value = false;
  });
});

nodeTools.register({
  name: "setVideo",
  description: "选择工作区内已有的视频文件作为此节点的输出，path 使用工作区相对路径",
  parameters: z.strictObject({
    path: z.string().min(1).max(4096),
    mimeType: z.string().regex(/^video\/[a-zA-Z0-9.+-]+$/),
  }),
  async execute({ path, mimeType }, { signal }) {
    signal?.throwIfAborted();
    if (task.value || uploading.value || exporting.value || actions.value?.processing) throw new Error("视频处理中，请稍后重试");
    uploading.value = true;
    try {
      const content = await files.getWorkspaceFiles().read(path);
      signal?.throwIfAborted();
      if (!content.byteLength || content.byteLength > 100 * 1024 * 1024) throw new Error("视频不能为空且不能超过 100 MB");
      outputs.value.video = { dataType: "VIDEO", value: { url: path, mimeType } };
      return outputs.value.video;
    } finally {
      uploading.value = false;
    }
  },
});

async function resizeVideo(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  if (!video.videoWidth || !video.videoHeight) return;
  videoAspect.value = video.videoWidth / video.videoHeight;
  await nextTick();
  updateNodeInternals();
}

function uploadVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void setVideoFile(file);
}

async function selectAsset() {
  const file = await files.pickAsset?.("video");
  if (file) await setVideoFile(file);
}

async function setVideoFile(file: File, canCommit?: () => boolean): Promise<string | void> {
  if (canCommit && !canCommit()) return;
  if (uploading.value || exporting.value || actions.value?.processing) return;
  const mimeType = getMediaMimeType(file);
  if (!mimeType.startsWith("video/")) return void ElMessage.error("请选择视频文件");
  if (!file.size || file.size > 100 * 1024 * 1024) return void ElMessage.error("视频不能为空且不能超过 100 MB");
  uploading.value = true;
  try {
    const url = await files.uploadFile(file);
    if (canCommit && !canCommit()) return;
    // ACT: 复制节点可能仍引用旧视频，替换输出不删除共享文件。
    outputs.value.video = { dataType: "VIDEO", value: { url, mimeType } };
    return url;
  } catch (error) {
    showError(error, "视频替换失败");
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
.videoContent {
  &[inert] :deep(.playerControls) { visibility: hidden; }
  .nodeSkeleton.resized & {
    height: 100%;
    min-height: 0;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    --nodeMediaHeight: 100%;

    .exportLoading { max-height: 100%; box-sizing: border-box; overflow: auto; }
  }

  position: relative;
  display: grid;
  place-items: center;
  min-height: 144px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);

  .exportLoading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    color: var(--el-text-color-secondary);
  }

  .fileInput {
    display: none;
  }

  .emptyActions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .el-button { margin: 0; }
  }
}
</style>
