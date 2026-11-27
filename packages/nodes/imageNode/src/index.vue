<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :titleDetail="resolution"
    :processing="task"
    :topVisible="node.selected && !task"
    :bottomVisible="node.selected && (lightingVisible || multiAngleVisible || editor?.mode === 'inpaint')"
    :bottomWidth="660"
    topWidth="max-content"
    :downloadUrl="outputFile ? previewUrl : ''"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    @fullscreen="previewVisible = true"
    :mediaAspect="previewUrl ? imageAspect : 0">
    <template v-if="editor?.mode" #top><div ref="paintToolbar" /></template>
    <template #topActions>
      <el-button v-if="comparison" :icon="IconColumns2" text @click.stop="compareVisible = true">对比原图</el-button>
      <el-button class="panoramaButton" :icon="IconPanoramaHorizontal" :disabled="toolDialog?.busy || uploading || editor?.busy || lighting?.generating || multiAngle?.generating || gridSplit?.splitting || inpaintPrompt?.creating || panorama?.busy || !previewUrl" text title="全景图" aria-label="全景图" @click.stop="panorama?.open($event)">全景图<icon-chevron-down class="menuChevron" :size="14" /></el-button>
      <el-button :icon="IconBrush" :disabled="toolDialog?.busy || uploading || lighting?.generating || multiAngle?.generating || panorama?.busy || !previewUrl || gridSplit?.splitting" text title="涂抹重画" aria-label="涂抹重画" @click.stop="startEditor('inpaint')">涂抹重画</el-button>
      <el-button :icon="IconSun" :disabled="toolDialog?.busy || uploading || lighting?.generating || multiAngle?.generating || panorama?.busy || !previewUrl || gridSplit?.splitting" text title="调整光线" aria-label="调整光线" @click.stop="openLighting">调整光线</el-button>
      <el-button :icon="IconCameraRotate" :disabled="toolDialog?.busy || uploading || lighting?.generating || multiAngle?.generating || panorama?.busy || !previewUrl || gridSplit?.splitting" text title="更换视角" aria-label="更换视角" @click.stop="openMultiAngle">更换视角</el-button>
      <el-button :icon="IconLayoutGrid" :disabled="toolDialog?.busy || uploading || lighting?.generating || multiAngle?.generating || panorama?.busy || !previewUrl" :loading="gridSplit?.splitting" text title="分格切图" aria-label="分格切图" @click.stop="gridSplit?.open($event)">分格切图</el-button>
      <el-button
        :icon="IconTransfer"
        :loading="uploading"
        :disabled="toolDialog?.busy || lighting?.generating || multiAngle?.generating || panorama?.busy"
        text
        title="替换图片"
        aria-label="替换图片"
        @click.stop="toolMenu?.replaceSource('替换图片')">替换图片</el-button>
      <mediaToolMenu ref="toolMenu" :tools="imageFormat && editor?.previewError ? [] : imageTools" :source="outputFile" sourceKind="image" :importSource="setImageFile" :disabled="toolsDisabled || toolDialog?.busy || (!!imageFormat && editor?.preparingPreview)" @select="openTool($event)" />
    </template>
    <template #topRightActions>
      <el-button :icon="IconPencil" :disabled="toolDialog?.busy || uploading || lighting?.generating || multiAngle?.generating || panorama?.busy || !previewUrl || gridSplit?.splitting" text title="标记" aria-label="标记" @click.stop="startEditor('mark')" />
    </template>
    <mediaNodePreview v-model:resolution="resolution" :src="previewUrl" class="imageContent nopan" :class="{ empty: !previewFile }" :inert="!!task">
      <imageEditor
        v-if="previewUrl"
        ref="editor"
        :src="previewUrl"
        :imageFormat="imageFormat"
        :toolbarTarget="paintToolbar"
        :disabled="uploading || lighting?.generating || multiAngle?.generating || panorama?.busy"
        alt="节点图片"
        @load="resizeImage"
        @error="ElMessage.error($event.message)" />
      <input ref="fileInput" class="fileInput" type="file" accept="image/*" aria-label="选择图片" :disabled="uploading || lighting?.generating || multiAngle?.generating || panorama?.busy" @change="uploadImage" />
      <div v-if="!task && !outputFile" class="emptyActions">
        <el-button
          class="nodrag nopan"
          :icon="IconUpload"
          text
          :loading="uploading"
          title="上传图片"
          aria-label="上传图片"
          @dblclick.stop
          @click.stop="fileInput?.click()">上传</el-button>
        <el-button
          v-if="files.pickAsset"
          class="nodrag nopan"
          :icon="IconFolder"
          text
          :disabled="uploading"
          title="从素材库选择图片"
          aria-label="从素材库选择图片"
          @dblclick.stop
          @click.stop="selectAsset">从素材库选择</el-button>
      </div>
    </mediaNodePreview>
    <template v-if="lightingVisible || multiAngleVisible || editor?.mode === 'inpaint'" #bottom>
      <div v-if="lightingVisible" ref="lightingTarget" />
      <div v-else-if="multiAngleVisible" ref="multiAngleTarget" />
      <div v-else ref="inpaintTarget" />
    </template>
  </nodeSkeleton>
  <imageResultComparison v-if="comparison && compareVisible" :original="comparison.original" :result="imagePreviewUrl" @close="compareVisible = false" />
  <mediaToolDialog ref="toolDialog" :file="outputFile" :src="imagePreviewUrl" :disabled="toolsDisabled" :run="runImageTool" />
  <imageInpaintPrompt v-if="editor?.mode === 'inpaint'" ref="inpaintPrompt" :target="inpaintTarget" :createDraft="createInpaint" :disabled="uploading" />
  <imageLighting v-if="lightingVisible" ref="lighting" :src="imagePreviewUrl" :source="outputFile" :target="lightingTarget" :disabled="uploading || gridSplit?.splitting" @close="lightingVisible = false" />
  <imageMultiAngle v-if="multiAngleVisible" ref="multiAngle" :src="imagePreviewUrl" :source="outputFile" :target="multiAngleTarget" :disabled="uploading || gridSplit?.splitting" @close="multiAngleVisible = false" />
  <imagePanorama ref="panorama" :src="imagePreviewUrl" :source="outputFile" :disabled="uploading || editor?.busy || lighting?.generating || multiAngle?.generating || gridSplit?.splitting || inpaintPrompt?.creating" @open="openPanorama" />
  <imageGridSplit ref="gridSplit" :src="imagePreviewUrl" :disabled="uploading || lighting?.generating || multiAngle?.generating || panorama?.busy" :active="node.selected && !toolDialog?.visible" />
  <el-image-viewer
    v-if="previewVisible && previewUrl"
    :urlList="[imagePreviewUrl]"
    teleported
    @close="previewVisible = false" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import mediaNodePreview from "@toonflow/node-shared/mediaNodePreview";
import { IconColumns2, IconPhoto, IconUpload, IconFolder, IconTransfer, IconLayoutGrid, IconBrush, IconPencil, IconSun, IconCameraRotate, IconPanoramaHorizontal, IconChevronDown } from "@tabler/icons-vue";
import { ElButton, ElImageViewer, ElMessage } from "element-plus";
import { nodeSkeleton, nodeTools, useNode, z, type NodeHandle, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { getMediaMimeType } from "@toonflow/node-shared/mediaTypes";
import mediaToolMenu from "@toonflow/node-shared/mediaToolMenu";
import mediaToolDialog from "@toonflow/node-shared/mediaToolDialog";
import { useMediaToolResult, type MediaToolSelection } from "@toonflow/node-shared/mediaTools";
import { imageTools, runImageTool } from "./imageTools";
import { fallbackImageFormat } from "./imageCanvas";
import imageGridSplit from "./components/imageGridSplit.vue";
import imageResultComparison from "./components/imageResultComparison.vue";
import imageEditor from "./components/imageEditor.vue";
import imageInpaintPrompt from "./components/imageInpaintPrompt.vue";
import imageLighting from "./components/imageLighting.vue";
import imagePanorama from "./components/imagePanorama.vue";
import imageMultiAngle from "./components/imageMultiAngle.vue";
import type { InpaintDraftInput } from "./imageInpaint";

defineOptions({
  inheritAttrs: false,
  icon: IconPhoto,
  handles: [
    { id: "in", type: "target", dataType: "IMAGE", label: "来源图片" },
    { id: "image", type: "source", dataType: "IMAGE", label: "图片输出" },
  ] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, nodeEvent, files, updateNodeInternals } = useNode({
  label: "图片",
});
const { task, preview } = useMediaToolResult(node.id, "image");
const fileInput = ref<HTMLInputElement>();
const toolMenu = ref<InstanceType<typeof mediaToolMenu>>();
const toolDialog = ref<InstanceType<typeof mediaToolDialog>>();
const toolsDisabled = computed(() => !!(uploading.value || editor.value?.busy || lighting.value?.generating || multiAngle.value?.generating || gridSplit.value?.splitting || inpaintPrompt.value?.creating || panorama.value?.busy));
const gridSplit = ref<InstanceType<typeof imageGridSplit>>();
const editor = ref<InstanceType<typeof imageEditor>>();
const paintToolbar = ref<HTMLElement>();
const inpaintPrompt = ref<InstanceType<typeof imageInpaintPrompt>>();
const inpaintTarget = ref<HTMLElement>();
const lighting = ref<InstanceType<typeof imageLighting>>();
const lightingTarget = ref<HTMLElement>();
const lightingVisible = ref(false);
const multiAngle = ref<InstanceType<typeof imageMultiAngle>>();
const multiAngleTarget = ref<HTMLElement>();
const multiAngleVisible = ref(false);
const panorama = ref<InstanceType<typeof imagePanorama>>();
const uploading = ref(false);
const previewVisible = ref(false);
const imageAspect = ref(0);
const resolution = ref("");

const outputFile = computed(() => outputs.value.image?.dataType === "IMAGE" ? outputs.value.image.value : undefined);
const compareVisible = ref(false);
const comparison = computed(() => {
  const data = node.data as { imageComparison?: { original?: NodeMediaValue; resultUrl?: string } };
  const pair = data.imageComparison;
  if (outputFile.value && pair?.resultUrl === outputFile.value.url && typeof pair.original?.url === "string" && typeof pair.original.mimeType === "string" && pair.original.mimeType.startsWith("image/")) return { original: pair.original };
});
watch(outputFile, () => { compareVisible.value = false; });
const previewFile = computed(() => outputFile.value ?? preview.value);
const imageFormat = computed(() => previewFile.value && fallbackImageFormat(previewFile.value.url, previewFile.value.mimeType));
const previewUrl = files.useFileUrl(
  previewFile,
  (error) => showError(error, "图片读取失败")
);
const imagePreviewUrl = computed(() => editor.value?.previewSrc || previewUrl.value);

nodeEvent.on("save", reason => {
  // ACT: 普通保存不等待打光和多角度生成，后台任务继续由原画布实例承载。
  if (uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || panorama.value?.busy
    || (reason === "reload" && (lighting.value?.generating || multiAngle.value?.generating))) throw new Error("图片处理中，请完成后再切换或刷新节点");
});
nodeEvent.on("delete", () => {
  if (uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy) throw new Error("图片处理中，请稍后删除节点");
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
    if (task.value || uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy) throw new Error("图片处理中，请稍后重试");
    uploading.value = true;
    try {
      const content = await files.getWorkspaceFiles().read(path);
      signal?.throwIfAborted();
      if (!content.byteLength || content.byteLength > 100 * 1024 * 1024) throw new Error("图片不能为空且不能超过 100 MB");
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
  imageAspect.value = image.naturalWidth / image.naturalHeight;
  await nextTick();
  updateNodeInternals();
}

function openTool(choice: MediaToolSelection) {
  if (toolsDisabled.value || toolDialog.value?.busy || !outputFile.value) return;
  editor.value?.cancel();
  lightingVisible.value = false;
  multiAngleVisible.value = false;
  toolDialog.value?.open(choice);
}

function openPanorama() {
  editor.value?.cancel();
  lightingVisible.value = false;
  multiAngleVisible.value = false;
}

function openLighting() {
  if (uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy || gridSplit.value?.splitting || !previewUrl.value) return;
  editor.value?.cancel();
  multiAngleVisible.value = false;
  lightingVisible.value = true;
}

function openMultiAngle() {
  if (uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy || gridSplit.value?.splitting || !previewUrl.value) return;
  editor.value?.cancel();
  lightingVisible.value = false;
  multiAngleVisible.value = true;
}

function startEditor(mode: "inpaint" | "mark") {
  if (uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy || gridSplit.value?.splitting) return;
  lightingVisible.value = false;
  multiAngleVisible.value = false;
  editor.value?.start(mode);
}

async function createInpaint(input: InpaintDraftInput, signal: AbortSignal) {
  if (!editor.value) throw new Error("请先进入局部重绘");
  await editor.value.createInpaint(input, signal);
}

function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void setImageFile(file);
}

async function selectAsset() {
  const file = await files.pickAsset?.("image");
  if (file) await setImageFile(file);
}

async function setImageFile(file: File, canCommit?: () => boolean): Promise<string | void> {
  if (canCommit && !canCommit()) return;
  if (toolDialog.value?.busy || uploading.value || editor.value?.busy || inpaintPrompt.value?.creating || lighting.value?.generating || multiAngle.value?.generating || panorama.value?.busy) return;
  const mimeType = getMediaMimeType(file);
  if (!mimeType.startsWith("image/")) return void ElMessage.error("请选择图片文件");
  if (!file.size || file.size > 100 * 1024 * 1024) return void ElMessage.error("图片不能为空且不能超过 100 MB");
  uploading.value = true;
  try {
    const url = await files.uploadFile(file);
    if (canCommit && !canCommit()) return;
    // ACT: 复制节点可能仍引用旧图片，替换输出不删除共享文件。
    outputs.value.image = { dataType: "IMAGE", value: { url, mimeType } };
    return url;
  } catch (error) {
    showError(error, "图片替换失败");
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
.panoramaButton {
  &[aria-expanded="true"] .menuChevron { transform: rotate(180deg); }
}

.imageContent {
  min-height: 144px;

  .nodeSkeleton.resized & {
    height: 100%;
    min-height: 0;
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emptyActions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .el-button { margin: 0; }
  }

  .fileInput {
    display: none;
  }
}
</style>
