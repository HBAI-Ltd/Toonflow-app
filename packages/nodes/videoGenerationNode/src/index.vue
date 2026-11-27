<template>
  <nodeSkeleton
    v-bind="nodeProps"
    :titleDetail="resolution"
    :processing="nodeProcessing"
    v-model:bottomVisible="node.selected"
    :topVisible="node.selected"
    topWidth="max-content"
    :downloadUrl="previewUrl"
    :downloadName="outputFile?.url.split(/[\\/]/).at(-1)"
    @fullscreen="player?.enterFullscreen()"
    :bottomWidth="660"
    :mediaAspect="displayUrl ? videoAspect : 0">
    <template #topActions>
      <el-button :icon="IconMovie" text :disabled="!outputFile || generating || deleting || uploading || actions?.processing || actions?.creatingAnalysis" @click.stop="actions?.createRetake()">片段重拍</el-button>
      <el-button :icon="IconMusic" text :disabled="!outputFile || generating || deleting || uploading || actions?.processing" @click.stop="actions?.open('extractAudio')">提取声音</el-button>
      <el-button :icon="IconLayersSubtract" text :disabled="!outputFile || generating || deleting || uploading || actions?.processing" @click.stop="actions?.open('separate')">分离音视频</el-button>
      <el-button :icon="IconScissors" text :disabled="!outputFile || generating || deleting || uploading || actions?.processing" @click.stop="actions?.open('trim')">截取片段</el-button>
      <el-button :icon="IconMovie" text :loading="actions?.creatingAnalysis" :disabled="!outputFile || generating || deleting || uploading || actions?.processing || actions?.creatingAnalysis" @click.stop="actions?.createFrameAnalysis()">逐帧拉片</el-button>
      <mediaHistory mediaType="video" :current="outputFile" :disabled="actions?.processing || generating || deleting || uploading" @select="outputs.video = { dataType: 'VIDEO', value: $event }" />
      <el-button :icon="IconTransfer" :loading="uploading" :disabled="actions?.processing || generating || deleting" text title="替换视频" aria-label="替换视频" @click.stop="toolMenu?.replaceSource('替换视频')">替换视频</el-button>
      <mediaToolMenu ref="toolMenu" :tools="actions?.tools ?? []" :source="outputFile" sourceKind="video" :importSource="setVideoFile" :disabled="generating || deleting || uploading || actions?.processing || actions?.creatingAnalysis || player?.capturing" @select="actions?.openTool($event)" />
    </template>
    <template #topRightActions>
      <el-dropdown trigger="click" placement="bottom-end" :disabled="actions?.processing || !player?.ready || player?.capturing || generating || deleting || uploading" @command="player?.captureFrame($event)">
        <el-button :icon="IconPhotoScan" :loading="player?.capturing" :disabled="actions?.processing || !player?.ready || player?.capturing || generating || deleting || uploading" text title="截取视频帧" aria-label="截取视频帧" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="current" :icon="IconPhotoScan">截取当前帧</el-dropdown-item>
            <el-dropdown-item command="first" :icon="IconPlayerSkipBack">截取首帧</el-dropdown-item>
            <el-dropdown-item command="last" :icon="IconPlayerSkipForward">截取尾帧</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
    <mediaNodePreview v-model:resolution="resolution" :src="displayUrl" class="videoContent nopan">
      <videoPlayer
        v-if="displayUrl"
        :key="displayUrl"
        ref="player"
        :src="displayUrl"
        :playRange="playRange"
        :label="previewMode === 'clip' ? '重拍选区预览' : '视频预览'"
        @ready="value => value && startPreview()"
        @loadedmetadata="resizeVideo" />
      <div v-else class="videoEmpty" role="img" aria-label="暂无生成视频">
        <icon-camera-ai :size="48" stroke="1.25" aria-hidden="true" />
      </div>
    </mediaNodePreview>
    <template #bottom>
      <el-card class="promptCard" shadow="never" :bodyStyle="{ padding: '14px 16px 12px' }">
        <div v-if="data.retake" class="retakeEditor nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
          <span v-if="!sourceFile">请连接一个原视频</span>
          <span v-else-if="sourceDuration < 4">{{ sourceDuration ? '原视频不足 4 秒，无法重拍' : '等待原视频时长' }}</span>
          <template v-else>
            <div ref="track" class="retakeTrack" tabindex="0" role="group" aria-label="重拍轨道，拖动空白处添加片段，或按回车添加" @keydown.enter.self.prevent="addClip" @pointerdown.self="beginTrackDrag($event)" @pointermove="updateTrackDrag" @pointerup="finishTrackDrag" @pointercancel="cancelTrackDrag" @lostpointercapture.self="cancelTrackDrag">
              <videoFilmstrip class="trackFrames" :src="sourceUrl" :duration="sourceDuration" />
              <div v-for="item in trackClips" :key="item.saved?.start ?? 'active'" class="trackClip" :class="{ savedClip: item.saved }" :style="clipStyle(item)" :title="`${clipTime(item.start)}–${clipTime(item.start + item.length)}`"
                tabindex="0" role="group" :aria-label="`${clipTime(item.start)}，${item.length} 秒`" @pointerdown.self="beginTrackDrag($event, item)" @keydown.enter.self.prevent="item.saved && selectClip(item.saved)"
                @keydown.left.self.prevent="!item.saved && moveClip(clipStart - 0.1)" @keydown.right.self.prevent="!item.saved && moveClip(clipStart + 0.1)">
                <button type="button" class="clipPlayback" :aria-label="!item.saved && clipPlaying ? '暂停片段' : '播放片段'" :title="!item.saved && clipPlaying ? '暂停片段' : '播放片段'" :disabled="generating || deleting" @pointerdown.stop @click="playClip(item.saved)"><component :is="!item.saved && clipPlaying ? IconPlayerPause : IconPlayerPlay" :size="13" fill="currentColor" /></button>
                <strong class="rangeDuration">{{ item.length }} 秒</strong>
                <button type="button" class="clipRemove" aria-label="删除片段" title="删除片段" :disabled="generating || deleting" @pointerdown.stop @click="removeClip(item.saved)"><icon-trash :size="13" /></button>
              </div>
              <div v-if="draftClip" class="draftClip" :style="clipStyle(draftClip)" />
              <button v-for="side in data.noRetakeClips ? [] : clipSides" :key="side" type="button" role="slider" class="rangeHandle" :disabled="generating || deleting"
                :style="{ left: `${100 * (side === 'start' ? clipStart : clipEnd) / sourceDuration}%` }"
                :aria-label="side === 'start' ? '片段起点' : '片段终点'" :aria-valuenow="side === 'start' ? clipStart : clipEnd"
                :aria-valuemin="side === 'start' ? Math.max(clipBounds.left, clipEnd - maxClipLength) : clipStart + 4" :aria-valuemax="side === 'start' ? clipEnd - 4 : Math.min(clipBounds.right, clipStart + maxClipLength)"
                @pointerdown="($event.currentTarget as HTMLElement).setPointerCapture($event.pointerId)" @pointermove="dragBoundary($event, side)"
                @keydown.left.prevent="resizeClip(side, (side === 'start' ? clipStart : clipEnd) - 0.1)" @keydown.right.prevent="resizeClip(side, (side === 'start' ? clipStart : clipEnd) + 0.1)" />
            </div>
          </template>
        </div>
        <referenceItem
          v-if="shownReferences.length"
          v-model="shownReferences"
          @preview="setReferencePreview"
          @remove="removeReference" />
        <div v-if="frameMode" class="referenceHint">
          {{ selectedMode === "startFrameOptional" ? "仅一张图片时作为尾帧；两张图片按顺序作为首帧、尾帧" : "图片引用按顺序作为首帧、尾帧" }}
        </div>
        <promptInput v-if="!data.retake || (sourceFile && trackClips.length)" v-model="editorModel" :text="data.retake ? combinedPromptText : data.prompt" @update:text="value => { if (!data.retake) data.prompt = value; }" :references="promptReferences" :materials="materialMentions" :selectMaterial="selectMaterialReference" :selectAsset="selectAssetReference" expandable />
        <div class="promptFooter">
          <modelSelect
            :empty="!models.length"
            :modelValue="selectedModel ? data.model : ''"
            class="modelSelect"
            filterable
            :loading="modelsLoading"
            :disabled="generating || deleting"
            placeholder="选择模型"
            aria-label="生成模型"
            noDataText="请先在设置中添加视频模型"
            placement="top-start"
            @update:modelValue="selectModel"
            @visibleChange="(visible: boolean) => visible && loadModels().catch((error) => showNodeError(error, '模型读取失败'))">
            <template v-if="!selectedModel" #prefix><icon-sparkles :size="17" /></template>
            <template #label="{ label }"><modelLabel :label="label" :providerId="selectedModel?.providerId" :modelId="selectedModel?.modelId" /></template>
            <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
              <el-option
                v-for="item in provider.models"
                :key="item.modelId"
                :label="item.label"
                :value="getNodeModelKey(item)">
                <modelLabel :label="item.label" :providerId="item.providerId" :modelId="item.modelId" />
              </el-option>
            </el-option-group>
          </modelSelect>
          <generationSettings
            v-model:duration="data.duration"
            v-model:resolution="data.resolution"
            v-model:ratio="data.ratio"
            v-model:mode="data.mode"
            v-model:generateAudio="data.generateAudio"
            v-model:other="data.other"
            :ratios="ratioOptions"
            :retake="data.retake"
            :model="selectedModel"
            :disabled="generating || deleting || !selectedModel" />
          <div class="generationActions">
            <mediaPrice v-if="priceInput" :quote="mediaQuote" />
            <el-button
              class="sendButton"
              :icon="running ? IconPlayerStop : IconArrowUp"
              :disabled="costBlocked || actions?.processing || cancelling || deleting || uploading || (!generating && !pendingRecovery && (!selectedModel || (data.retake ? !retakeReady : !generationPrompt)))"
              :title="running ? '停止生成' : pendingRecovery ? '复查任务' : data.retake ? '重拍所选片段' : '生成视频'"
              :aria-label="running ? '停止生成' : pendingRecovery ? '复查任务' : data.retake ? '重拍所选片段' : '生成视频'"
              @click="running ? generationState.cancel().catch(error => showNodeError(error, '停止生成失败')) : startGeneration().catch((error) => showNodeError(error, '视频生成失败'))" />
          </div>
        </div>
      </el-card>
    </template>
  </nodeSkeleton>
  <video v-if="sourceUrl" :key="sourceUrl" hidden preload="metadata" :src="sourceUrl" @loadedmetadata="readSourceDuration" />
  <videoActions ref="actions" :file="outputFile" :src="previewUrl" :disabled="generating || deleting || uploading" />
</template>

<script setup lang="ts">
import mediaNodePreview from "@toonflow/node-shared/mediaNodePreview";
import { computed, nextTick, onMounted, onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton, ElCard, ElOption, ElOptionGroup, ElDropdown, ElDropdownMenu, ElDropdownItem } from "element-plus";
import { IconCameraAi, IconSparkles, IconArrowUp, IconPlayerStop, IconPlayerPlay, IconPlayerPause, IconTrash, IconTransfer, IconMusic, IconLayersSubtract, IconScissors, IconMovie, IconPhotoScan, IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-vue";
import { findNodeModel, getNodeModelIdentity, getNodeModelKey, nodeSkeleton, nodeTools, useNode, useNodeModelMemory, useNodeModelSelection, z, type NodeMediaModel, type NodeMediaResult, type NodeVideoRequest, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";
import { groupNodeModels } from "@toonflow/node-shared/groupNodeModels";
import { getVideoRatios } from "@toonflow/providers";
import modelLabel from "@toonflow/node-shared/modelLabel";
import modelSelect from "@toonflow/node-shared/modelSelect";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import { useNodeGeneration } from "@toonflow/node-shared/useNodeGeneration";
import { getModelFormValues, useModelForm } from "@toonflow/node-shared/useModelForm";
import { useNodeReferences } from "@toonflow/node-shared/useNodeReferences";
import { getPromptText } from "@toonflow/node-shared/promptText";
import promptInput from "@toonflow/node-shared/promptInput";
import videoPlayer from "@toonflow/node-video/videoPlayer";
import videoFilmstrip from "@toonflow/node-video/videoFilmstrip";
import { processVideo, spliceVideo } from "@toonflow/node-video/videoProcessing";
import { getMediaMimeType } from "@toonflow/node-shared/mediaTypes";
import mediaToolMenu from "@toonflow/node-shared/mediaToolMenu";
import videoActions from "@toonflow/node-video/videoActions";
import referenceItem from "@toonflow/node-shared/referenceItem";
import mediaHistory from "@toonflow/node-shared/mediaHistory";
import mediaPrice from "@toonflow/node-shared/mediaPrice";
import { useMediaPrice } from "@toonflow/node-shared/useMediaPrice";
import generationSettings from "./components/generationSettings.vue";

defineOptions({
  inheritAttrs: false,
  icon: IconCameraAi,
  handles: [
    { id: "in", type: "target", dataType: ["IMAGE", "VIDEO", "AUDIO", "STRING"], label: "图片、视频、音频、文本输入" },
    { id: "video", type: "source", dataType: "VIDEO", label: "视频输出" },
  ] satisfies NodeHandle[],
});
const { id, node, nodeProps, nodeEvent, outputs, files, ai, ffmpeg, updateNodeInternals } = useNode({
  label: "视频生成",
  onModelsChanged: () => void refreshProviderModels(),
});
type PromptModel = NonNullable<InstanceType<typeof promptInput>["$props"]["modelValue"]>;
type RetakeClip = { id: string; start: number; length: number; prompt: string; promptModel: PromptModel; initialized?: boolean };
// duration 为提交时四舍五入后的整秒时长，拼接时据此拉伸回选区时长；旧任务没有该字段则不拉伸。
type RetakeRecovery = { source: string; start: number; end: number; duration?: number };
const isRetakeTime = (tag: PromptModel[number][number]) => tag.type === "Custom" && tag.html.startsWith('<span class="retakeTime">');
const data = computed(() => node.data as { retake?: boolean; retakeClipId?: string; noRetakeClips?: boolean; otherClips?: RetakeClip[]; retakePromptInitialized?: boolean; clipStart?: number; clipLength?: number; prompt: string; promptModel: PromptModel; model: string; duration?: number; resolution: string; ratio: string; mode: string; generateAudio: boolean; other: Record<string, unknown> });
if (data.value.retake) {
  data.value.retakeClipId ??= crypto.randomUUID();
  // 旧节点用 duration 记录当前片段长度；现在片段精确到 0.1 秒，duration 只表示提交给模型的时长。
  data.value.clipLength ??= data.value.duration ?? 4;
  for (const clip of data.value.otherClips ?? []) clip.id ??= crypto.randomUUID();
}
data.value.prompt ??= "";
data.value.promptModel ??= [];
data.value.model ??= "";
data.value.resolution ??= "";
data.value.mode ??= "";
data.value.generateAudio ??= true;
data.value.ratio ??= "9:16";
data.value.other ??= {};
const { refList, referenceMentions, materialMentions, selectMaterialReference, selectAssetReference, setReferencePreview, removeReference } = useNodeReferences();
const models = shallowRef<NodeMediaModel[]>([]);
const modelsLoading = ref(false);
const uploading = ref(false);
const toolMenu = ref<InstanceType<typeof mediaToolMenu>>();
let disposed = false;
const deleting = ref(false);
const player = ref<InstanceType<typeof videoPlayer>>();
const actions = ref<InstanceType<typeof videoActions>>();
const videoAspect = ref(0);
const resolution = ref("");
const sourceFile = computed(() => {
  if (!data.value.retake) return;
  const videos = refList.value.filter(item => item.dataType === "VIDEO");
  const source = videos.length === 1 ? videos[0] : undefined;
  return source?.dataType === "VIDEO" ? source.value : undefined;
});
const sourceUrl = files.useFileUrl(sourceFile, error => showNodeError(error, "原视频读取失败"));
const sourceDuration = ref(0);
const sourceAspect = ref(0);
watch(sourceUrl, () => { sourceDuration.value = 0; sourceAspect.value = 0; }, { flush: "sync" });
function readSourceDuration(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  if (video.getAttribute("src") !== sourceUrl.value) return;
  if (Number.isFinite(video.duration)) sourceDuration.value = video.duration;
  if (video.videoWidth && video.videoHeight) sourceAspect.value = video.videoWidth / video.videoHeight;
}
// 重拍的原视频由上方轨道展示和截取，提交的是选中片段，不作为参考素材列出。
const shownReferences = computed({
  get: () => data.value.retake ? refList.value.filter(item => item.dataType !== "VIDEO") : refList.value,
  set: value => { refList.value = data.value.retake ? [...refList.value.filter(item => item.dataType === "VIDEO"), ...value] : value; },
});
const clipLength = computed(() => data.value.clipLength ?? 4);
const tenth = (value: number) => Math.round(value * 10) / 10;
const floorTenth = (value: number) => Math.floor(value * 10 + 0.000001) / 10;
const otherClips = computed(() => data.value.otherClips ?? []);
const clipBounds = computed(() => {
  const start = data.value.clipStart ?? 0;
  let left = 0;
  let right = sourceDuration.value;
  for (const clip of otherClips.value) {
    if (clip.start < start) left = Math.max(left, clip.start + clip.length);
    else right = Math.min(right, clip.start);
  }
  return { left, right };
});
const clipStart = computed(() => Math.max(clipBounds.value.left, Math.min(clipBounds.value.right - clipLength.value, Number(data.value.clipStart) || 0)));
const clipEnd = computed(() => Number((clipStart.value + clipLength.value).toFixed(1)));
const clipReady = computed(() => !data.value.noRetakeClips && !!sourceFile.value && clipLength.value >= 4 && clipLength.value <= 30 && clipEnd.value <= clipBounds.value.right);
type TrackClip = { start: number; length: number; saved?: RetakeClip };
const track = ref<HTMLElement>();
const trackClips = computed<(TrackClip & { id: string })[]>(() => !data.value.retake || data.value.noRetakeClips ? [] : [
  ...otherClips.value.map(saved => ({ id: saved.id, start: saved.start, length: saved.length, saved })),
  { id: data.value.retakeClipId!, start: clipStart.value, length: clipLength.value },
].sort((left, right) => left.start - right.start));
const promptSections = computed(() => trackClips.value.map(clip => clip.saved ?? data.value));
const combinedPromptText = computed(() => promptSections.value.map(section => section.prompt).join("\n"));
// 每个片段一个任务，时间标签后的文字归该片段；只有时间标签视为未填写。
const retakeReady = computed(() => !!sourceFile.value && trackClips.value.length > 0 && trackClips.value.every((clip, index) =>
  clip.length >= 4 && clip.length <= 30 && clip.start + clip.length <= sourceDuration.value + 0.05
  && !!getPromptText(sectionLines(promptSections.value[index]!).map(line => line.filter(tag => !isRetakeTime(tag)))).trim()));
function sectionLines(section: Pick<RetakeClip, "promptModel" | "prompt">): PromptModel {
  return section.promptModel.length ? section.promptModel : section.prompt.split("\n").map(text => [{ type: "Write", text }]);
}
const editorModel = computed<PromptModel>({
  get: () => data.value.retake ? promptSections.value.flatMap(sectionLines) : data.value.promptModel,
  set(lines) {
    if (!data.value.retake) { data.value.promptModel = lines; return; }
    const sections = promptSections.value;
    const boundaries = [0];
    for (let index = 1; index < sections.length; index++) {
      const previous = boundaries[index - 1]!;
      const marker = sections[index]!.promptModel.flat().find(tag => tag.type === "Custom" && tag.html.startsWith('<span class="retakeTime">'));
      const position = marker?.type === "Custom" ? lines.findIndex((line, row) => row >= previous && line.some(tag => tag.type === "Custom" && tag.html === marker.html)) : -1;
      boundaries.push(position >= 0 ? position : Math.min(lines.length, previous + sectionLines(sections[index - 1]!).length));
    }
    sections.forEach((section, index) => {
      const model = lines.slice(boundaries[index], boundaries[index + 1]);
      section.promptModel = model;
      section.prompt = getPromptText(model);
    });
  },
});
const gaps = computed(() => {
  const available: { left: number; right: number }[] = [];
  let left = 0;
  for (const clip of trackClips.value) {
    if (clip.start >= left + 4) available.push({ left, right: clip.start });
    left = Number((clip.start + clip.length).toFixed(1));
  }
  if (sourceDuration.value >= left + 4) available.push({ left, right: sourceDuration.value });
  return available;
});
function clipStyle(clip: TrackClip) {
  return { left: `${100 * clip.start / sourceDuration.value}%`, width: `${100 * clip.length / sourceDuration.value}%` };
}
function selectClip(clip: RetakeClip, keepCurrent = true) {
  if (generating.value || deleting.value) return;
  const remaining = otherClips.value.filter(item => item !== clip);
  if (keepCurrent && !data.value.noRetakeClips) remaining.push({ id: data.value.retakeClipId!, start: clipStart.value, length: clipLength.value, prompt: data.value.prompt, promptModel: data.value.promptModel, initialized: data.value.retakePromptInitialized });
  data.value.retakeClipId = clip.id;
  data.value.noRetakeClips = false;
  data.value.otherClips = remaining.sort((left, right) => left.start - right.start);
  data.value.clipStart = clip.start;
  data.value.clipLength = clip.length;
  data.value.prompt = clip.prompt;
  data.value.promptModel = clip.promptModel;
  data.value.retakePromptInitialized = clip.initialized;
  inspectBoundary(clipStart.value);
}
function addClip() {
  const gap = gaps.value[0];
  if (gap) insertClip(gap.left, 4);
}
function insertClip(start: number, length: number) {
  if (trackClips.value.length < 5 && gaps.value.some(gap => start >= gap.left && start + length <= gap.right + 0.000001)) selectClip({ id: crypto.randomUUID(), start, length, prompt: "", promptModel: [] });
}
function removeClip(saved?: RetakeClip) {
  if (generating.value || deleting.value) return;
  if (saved) data.value.otherClips = otherClips.value.filter(clip => clip !== saved);
  else if (otherClips.value[0]) selectClip(otherClips.value[0], false);
  else {
    player.value?.pause();
    pendingPreview = undefined;
    previewMode.value = "full";
    data.value.noRetakeClips = true;
    data.value.prompt = "";
    data.value.promptModel = [];
    data.value.retakePromptInitialized = false;
  }
}
function playClip(saved?: RetakeClip) {
  if (!saved) return togglePreview("clip");
  selectClip(saved);
  pendingPreview = { time: clipStart.value, play: true };
  return startPreview();
}
let drag: { id: number; x: number; anchor: number; left: number; right: number; moving?: number } | undefined;
const draftClip = ref<TrackClip>();
function beginTrackDrag(event: PointerEvent, item?: TrackClip) {
  const rect = track.value?.getBoundingClientRect();
  if (!track.value || !rect?.width || event.button !== 0 || !event.isPrimary || generating.value || deleting.value) return;
  const anchor = (event.clientX - rect.left) / rect.width * sourceDuration.value;
  if (item?.saved) selectClip(item.saved);
  const bounds = item ? clipBounds.value : gaps.value.find(gap => gap.left <= anchor && anchor <= gap.right);
  if (!bounds || (!item && trackClips.value.length >= 5)) return;
  drag = { id: event.pointerId, x: event.clientX, anchor, ...bounds, moving: item?.start };
  track.value.setPointerCapture(event.pointerId);
}
function updateTrackDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId || !track.value || (Math.abs(event.clientX - drag.x) < 3 && !draftClip.value)) return;
  const delta = (event.clientX - drag.x) / track.value.getBoundingClientRect().width * sourceDuration.value;
  if (drag.moving !== undefined) { moveClip(drag.moving + delta); return; }
  const length = Math.min(maxClipLength.value, floorTenth(drag.right - drag.left), Math.max(4, tenth(Math.abs(delta))));
  const start = Math.max(drag.left, Math.min(floorTenth(drag.right - length), tenth(delta < 0 ? drag.anchor - length : drag.anchor)));
  draftClip.value = { start, length };
}
function finishTrackDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return;
  updateTrackDrag(event);
  if (draftClip.value) insertClip(draftClip.value.start, draftClip.value.length);
  cancelTrackDrag();
}
function cancelTrackDrag() {
  drag = undefined;
  draftClip.value = undefined;
}
watch(sourceUrl, cancelTrackDrag);
const clipSides = ["start", "end"] as const;
type ClipSide = typeof clipSides[number];
function resizeClip(side: ClipSide, boundary: number) {
  const start = clipStart.value;
  const end = clipEnd.value;
  const limit = floorTenth(side === "start" ? end - clipBounds.value.left : clipBounds.value.right - start);
  if (limit < 4) return;
  const length = Math.min(maxClipLength.value, limit, Math.max(4, tenth(side === "start" ? end - boundary : boundary - start)));
  data.value.clipStart = side === "start" ? tenth(end - length) : start;
  data.value.clipLength = length;
  inspectBoundary(side === "start" ? clipStart.value : clipEnd.value);
}
function dragBoundary(event: PointerEvent, side: ClipSide) {
  const handle = event.currentTarget as HTMLButtonElement;
  if (!handle.hasPointerCapture(event.pointerId)) return;
  const track = handle.parentElement!.getBoundingClientRect();
  if (track.width) resizeClip(side, (event.clientX - track.left) / track.width * sourceDuration.value);
}
function clipTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0").replace(/\.0$/, "")}`;
}
const promptReferences = computed(() => data.value.retake ? referenceMentions.value.map(item => item.dataType === "VIDEO" ? { ...item, label: "视频1" } : item) : referenceMentions.value);
watch([clipReady, trackClips], ([ready, clips]) => {
  if (!ready) return;
  for (const { saved, start, length } of clips) {
    const target = saved ?? data.value;
    const html = `<span class="retakeTime">${clipTime(start)}-${clipTime(start + length)}</span>`;
    if (!(saved ? saved.initialized : data.value.retakePromptInitialized)) {
      if (saved) saved.initialized = true;
      else data.value.retakePromptInitialized = true;
      // 新片段的提示词只预填时间标签，后面的内容由用户填写。
      if (!target.prompt.trim() && !getPromptText(target.promptModel).trim()) {
        target.promptModel = [[{ type: "Custom", html }, { type: "Write", text: " " }]];
        target.prompt = getPromptText(target.promptModel);
      }
    }
    const timeTag = target.promptModel.flat().find(tag => tag.type === "Custom" && tag.html.startsWith('<span class="retakeTime">'));
    if (timeTag?.type === "Custom" && timeTag.html !== html) {
      timeTag.html = html;
      target.prompt = getPromptText(target.promptModel);
    }
  }
}, { immediate: true });
function moveClip(start: number) {
  if (generating.value || deleting.value) return;
  data.value.clipStart = Number(Math.max(clipBounds.value.left, Math.min(clipBounds.value.right - clipLength.value, start)).toFixed(1));
  inspectBoundary(clipStart.value);
}
let generationController: AbortController | undefined;
let generation: Promise<void> | undefined;
let modelsRequest: Promise<void> | undefined;
const selectedModel = useNodeModelSelection(models, computed({ get: () => data.value.model, set: value => { data.value.model = value; } }));
const ratioOptions = computed(() => getVideoRatios(selectedModel.value?.durationResolutionMap, data.value.duration, data.value.resolution));
const modelMemory = useNodeModelMemory("video");
useModelForm(data, selectedModel);
const selectedMode = computed(() => selectedModel.value?.mode?.find((item) => JSON.stringify(item) === data.value.mode) as NodeVideoRequest["mode"]);
const frameMode = computed(() => ["startEndRequired", "endFrameOptional", "startFrameOptional"].includes(String(selectedMode.value)));
const mediaCounts = computed(() => ({
  image: refList.value.filter((item) => item.dataType === "IMAGE").length,
  video: refList.value.filter((item) => item.dataType === "VIDEO").length,
  audio: refList.value.filter((item) => item.dataType === "AUDIO").length,
}));
const matchingModes = computed(() => getMatchingModes(selectedModel.value));

function getMatchingModes(choice?: NodeMediaModel) {
  return (choice?.mode ?? []).filter((mode) => {
    const { image, video, audio } = mediaCounts.value;
    if (Array.isArray(mode)) return image + video + audio > 0 && Object.entries(mediaCounts.value).every(([type, count]) =>
      count <= Number(mode.find((item) => item.startsWith(`${type}Reference:`))?.split(":")[1] ?? 0)
    );
    if (mode === "text") return image + video + audio === 0;
    if (video || audio) return false;
    if (mode === "singleImage") return image === 1;
    if (mode === "startEndRequired") return image === 2;
    return ["endFrameOptional", "startFrameOptional"].includes(mode) && image >= 1 && image <= 2;
  });
}

function getDurations(choice: NodeMediaModel) {
  return [...new Set((choice.durationResolutionMap ?? []).flatMap((item) => item.duration))].filter(duration => !data.value.retake || (duration >= 4 && duration <= 30)).sort((a, b) => a - b);
}

// 片段按 0.1 秒选取，每段独立四舍五入到整秒提交和报价：截取时拉伸到整秒，取回后再拉伸回选区时长拼接。
function requestDuration(length: number, choice = selectedModel.value) {
  const rounded = Math.round(length);
  const durations = choice ? getDurations(choice) : [];
  return durations.length ? durations.find(duration => duration === rounded) : rounded;
}
const maxClipLength = computed(() => Math.min(30, (selectedModel.value && getDurations(selectedModel.value).at(-1)) || 30));

function getResolutions(choice: NodeMediaModel, duration?: number) {
  // ACT: 当前视频分辨率使用 p 单位；出现其他单位时再统一换算。
  return [...new Set((choice.durationResolutionMap ?? []).filter((item) => item.duration.includes(duration!)).flatMap((item) => item.resolution))]
    .sort((left, right) => (Number.parseFloat(left) || Infinity) - (Number.parseFloat(right) || Infinity));
}

function selectRatio(ratios: string[], current: string) {
  if (ratios.includes(current)) return current;
  return ratios.includes("9:16") ? "9:16" : ratios[0] ?? "";
}

// 重拍片段要拼回原片，比例跟随原视频，取模型支持的最接近比例。
function sourceRatio(ratios: string[]) {
  if (!sourceAspect.value) return;
  const distance = (ratio: string) => {
    const [width, height] = ratio.split(":").map(Number);
    return Math.abs(Math.log(width! / height! / sourceAspect.value));
  };
  return ratios.filter(ratio => Number.isFinite(distance(ratio))).sort((left, right) => distance(left) - distance(right))[0];
}

// ACT: 引用改变时只替换不适用的模式；普通媒体优先作为参考，避免自动变成首尾帧。
watch([selectedModel, matchingModes, () => data.value.mode], ([choice, matches]) => {
  if (!choice || matches.some((item) => JSON.stringify(item) === data.value.mode)) return;
  const modes = choice.mode ?? [];
  const mode = matches.find(Array.isArray) ?? matches.find((item) => item === "singleImage")
    ?? matches.find((item) => item === "endFrameOptional") ?? matches[0]
    ?? modes.find((item) => JSON.stringify(item) === data.value.mode) ?? modes.find(Array.isArray) ?? modes[0];
  data.value.mode = mode === undefined ? "" : JSON.stringify(mode);
}, { flush: "sync" });
// ACT: 参数在节点内归一化，未选中、未挂载底部设置时也可由 Agent 直接生成。
watch([selectedModel, () => data.value.duration, () => data.value.resolution, () => data.value.ratio, clipLength, sourceAspect], ([choice]) => {
  if (!choice) return;
  const durations = getDurations(choice);
  // 重拍的时长跟随当前片段，只用来筛选可选的分辨率和比例。
  if (data.value.retake) data.value.duration = requestDuration(clipLength.value, choice) ?? durations[0];
  else if (!durations.includes(data.value.duration!)) data.value.duration = durations[0];
  const resolutions = getResolutions(choice, data.value.duration);
  if (!resolutions.includes(data.value.resolution)) data.value.resolution = resolutions[0] ?? "";
  data.value.ratio = (data.value.retake && sourceRatio(ratioOptions.value)) || selectRatio(ratioOptions.value, data.value.ratio);
  if (choice.audio !== "optional") data.value.generateAudio = choice.audio === true;
}, { flush: "sync" });
const modelGroups = computed(() => groupNodeModels(models.value));
function getGenerationPrompt(prompt: string, references = refList.value) {
  return [
    prompt.trim(),
    ...references.flatMap((item, index) => (item.dataType === "STRING" && item.value?.trim() ? [`参考 ${index + 1}：\n${item.value.trim()}`] : [])),
  ]
    .filter(Boolean)
    .join("\n\n");
}
const generationPrompt = computed(() => getGenerationPrompt(data.value.prompt));
// 报价和提交都按稳定 ID 解析提示词引用，顺序变化后仍对应同一份请求。
function resolvePrompt(section: Pick<RetakeClip, "prompt" | "promptModel">, clipLength?: number) {
  if (!section.promptModel.length) return section.prompt;
  let valid = true;
  // 重拍提交的是截取后的片段，时间标签改写为从 00:00 开始。
  const requestModel = clipLength === undefined ? section.promptModel : section.promptModel.map(line => line.map(tag =>
    isRetakeTime(tag) ? { type: "Write" as const, text: `00:00-${clipTime(clipLength)}` } : tag));
  const prompt = getPromptText(requestModel, referenceId => {
    const value = referenceMentions.value.find(reference => reference.id === referenceId)?.value;
    if (value === undefined) valid = false;
    return value ?? "";
  });
  return valid ? prompt : undefined;
}
const resolvedPrompt = computed(() => resolvePrompt(data.value));
const generationInput = computed(() => resolvedPrompt.value === undefined ? undefined : getGenerationInput(resolvedPrompt.value));
// 参考片段与生成结果都按四舍五入后的整秒计时，提示词的时间标签同样改写。
const retakeInputs = computed(() => trackClips.value.map((clip, index) => {
  const duration = requestDuration(clip.length);
  const prompt = duration === undefined ? undefined : resolvePrompt(promptSections.value[index]!, duration);
  return prompt === undefined ? undefined : getGenerationInput(prompt, duration);
}));
// 提交时原片换成拉伸到整秒的片段：报价按各段四舍五入后的时长计算参考视频，合计为各段之和。
const priceInput = computed(() => !data.value.retake ? generationInput.value
  : retakeInputs.value.length && retakeInputs.value.every(Boolean)
    ? retakeInputs.value.map(input => ({ ...input!, videoDurations: input!.videos?.map(() => input!.duration!) })) : undefined);
const mediaQuote = useMediaPrice(ai, "video", () => priceInput.value, () => selectedModel.value?.supportsPrice === true);
const generationState = useNodeGeneration(outputs, () => generationController?.abort(), {
  ai, models, quote: mediaQuote,
  recover(results, tasks, signal) {
    const clips = tasks.map(task => task.recoveryData as RetakeRecovery | undefined);
    // 旧版单段重拍任务没有恢复信息，沿用生成片段作为输出。
    return clips.every(clip => typeof clip?.source === "string") ? applyRetake(results, clips as RetakeRecovery[], signal) : Promise.resolve(results[0] ?? []);
  },
});
const { generating, running, costBlocked, pendingRecovery, cancelling } = generationState;
// 重拍从点击开始到拼接完成都遮罩节点并说明当前阶段；遮罩时底部面板隐藏，改由标题栏停止。
const retakeStage = ref("");
watch(generating, value => { if (!value) retakeStage.value = ""; });
const nodeProcessing = computed(() => !data.value.retake || !generating.value ? running.value || uploading.value : {
  text: retakeStage.value || "正在重拍片段…",
  cancelling: cancelling.value,
  cancel: () => void generationState.cancel().catch(error => showNodeError(error, "停止生成失败")),
});
watch(generating, value => { if (!value && !disposed && !deleting.value && !models.value.length) void loadModels().catch(error => showNodeError(error, "模型读取失败")); });

function getGenerationInput(prompt: string, duration = data.value.duration): Omit<NodeVideoRequest, "directory"> | undefined {
  const choice = selectedModel.value;
  if (!choice) return;
  const references = refList.value;
  const images: NonNullable<NodeVideoRequest["images"]> = [];
  const videos: NonNullable<NodeVideoRequest["videos"]> = [];
  const audios: NonNullable<NodeVideoRequest["audios"]> = [];
  const referenceOrder: NonNullable<NodeVideoRequest["referenceOrder"]> = references.map(item => {
    if (item.dataType === "IMAGE" && item.value) {
      const index = images.push({ path: item.value.url, mimeType: item.value.mimeType }) - 1;
      return { type: "image", index };
    }
    if (item.dataType === "VIDEO" && item.value) {
      const index = videos.push({ path: item.value.url, mimeType: item.value.mimeType }) - 1;
      return { type: "video", index };
    }
    if (item.dataType === "AUDIO" && item.value) {
      const index = audios.push({ path: item.value.url, mimeType: item.value.mimeType }) - 1;
      return { type: "audio", index };
    }
    return { type: "text" };
  });
  const firstFrame = frameMode.value && (selectedMode.value !== "startFrameOptional" || images.length > 1) ? images[0] : undefined;
  const lastFrame = frameMode.value ? images[selectedMode.value === "startFrameOptional" && images.length === 1 ? 0 : 1] : undefined;
  return {
    ...getNodeModelIdentity(choice),
    prompt: getGenerationPrompt(prompt, references),
    mode: selectedMode.value,
    duration,
    resolution: data.value.resolution || undefined,
    ratio: data.value.ratio || undefined,
    generateAudio: choice.audio === "optional" ? data.value.generateAudio : choice.audio,
    other: Object.keys(data.value.other).length ? { ...data.value.other } : undefined,
    outputDirectory: `assets/${id}`,
    images: frameMode.value ? undefined : images,
    firstFrame,
    lastFrame,
    videos,
    audios,
    referenceOrder: referenceOrder.map(reference => frameMode.value && reference.type === "image"
      ? { type: reference.index === 0 && firstFrame ? "firstFrame" : "lastFrame" } : reference),
  };
}
const outputFile = computed(() => outputs.value.video?.dataType === "VIDEO" ? outputs.value.video.value : undefined);
const previewUrl = files.useFileUrl(
  outputFile,
  (error) => showNodeError(error, "视频读取失败")
);
type PreviewMode = "clip" | "full" | "result";
const previewMode = ref<PreviewMode>("result");
const clipPlaying = computed(() => previewMode.value === "clip" && !!player.value?.playing);
const displayUrl = computed(() => previewMode.value === "result" ? previewUrl.value || sourceUrl.value : sourceUrl.value);
const playRange = computed(() => previewMode.value === "clip" && clipReady.value ? { start: clipStart.value, end: clipEnd.value } : undefined);
let pendingPreview: { time: number; play: boolean } | undefined;
watch([sourceUrl, previewUrl], () => { pendingPreview = undefined; previewMode.value = previewUrl.value ? "result" : "full"; }, { immediate: true });
async function startPreview() {
  await nextTick();
  if (!pendingPreview || !player.value?.ready) return;
  const { time, play } = pendingPreview;
  pendingPreview = undefined;
  player.value.seek(time);
  if (play) await player.value.playVideo();
}
function inspectBoundary(time: number) {
  player.value?.pause();
  previewMode.value = "clip";
  pendingPreview = { time, play: false };
  void startPreview();
}
async function togglePreview(mode: PreviewMode) {
  if (mode === previewMode.value && player.value?.playing) {
    player.value.pause();
    return;
  }
  const resume = mode === previewMode.value && player.value?.ready;
  player.value?.pause();
  previewMode.value = mode;
  if (resume) await player.value?.playVideo();
  else {
    pendingPreview = { time: mode === "clip" ? clipStart.value : 0, play: true };
    await startPreview();
  }
}

onMounted(() => {
  window.addEventListener("toonflow:plugin-installed", refreshProviderModels);
  window.addEventListener("toonflow:provider-config-changed", refreshProviderModels);
  void loadModels().catch(error => { if (!disposed) showNodeError(error, "模型读取失败"); });
});
onScopeDispose(() => {
  disposed = true;
  window.removeEventListener("toonflow:plugin-installed", refreshProviderModels);
  window.removeEventListener("toonflow:provider-config-changed", refreshProviderModels);
  generationController?.abort();
});

async function refreshProviderModels(event?: Event) {
  if (event?.type === "toonflow:plugin-installed" && (event as CustomEvent<{ type?: string }>).detail?.type !== "provider") return;
  try {
    await generation;
    if (!disposed && !deleting.value) await loadModels();
  } catch (error) {
    if (!disposed) showNodeError(error, "模型读取失败");
  }
}

async function setVideoFile(file: File, canCommit?: () => boolean): Promise<string | void> {
  if (canCommit && !canCommit()) return;
  if (actions.value?.processing || generating.value || deleting.value || uploading.value || disposed) return;
  const mimeType = getMediaMimeType(file);
  if (!mimeType.startsWith("video/")) return void showNodeError("请选择视频文件", "视频替换失败");
  if (!file.size || file.size > 100 * 1024 * 1024) return void showNodeError("视频不能为空且不能超过 100 MB", "视频替换失败");
  uploading.value = true;
  try {
    const workspace = files.getWorkspaceFiles();
    const url = await files.uploadFile(file);
    if (canCommit && (disposed || !canCommit())) return;
    if (disposed) {
      await workspace.remove(url);
      return;
    }
    // ACT: 保留历史输出文件，避免破坏撤销记录和复制节点的引用。
    outputs.value.video = { dataType: "VIDEO", value: { url, mimeType } };
    return url;
  } catch (error) {
    showNodeError(error, "视频替换失败");
  } finally {
    uploading.value = false;
  }
}

function loadModels() {
  if (modelsRequest) return modelsRequest;
  modelsLoading.value = true;
  modelsRequest = ai.getMediaModels().then((items) => {
    if (disposed || generating.value || deleting.value) return;
    models.value = items.filter(item => item.type === "video" && (!data.value.retake || (item.providerId.toLowerCase() === "toonflow" && item.modelId === "Seedance 2.5")));
    // ACT: 只给空配置选默认模型（优先上次手动选择的），保留暂时不可用的旧选择及其参数。
    if (!data.value.model || (data.value.retake && !findNodeModel(models.value, data.value.model))) {
      const choice = findNodeModel(models.value, modelMemory.get()) ?? modelGroups.value[0]?.models[0];
      data.value.model = choice ? getNodeModelKey(choice) : "";
    }
  }).finally(() => {
    modelsLoading.value = false;
    modelsRequest = undefined;
  });
  return modelsRequest;
}

function selectModel(value: string) {
  data.value.model = value;
  if (value) modelMemory.set(value);
}

async function startGeneration() {
  if (actions.value?.processing) throw new Error("视频处理中，请稍后重试");
  if (cancelling.value) throw new Error("任务正在取消，请稍后重试");
  if (generating.value) throw new Error("视频正在生成，请等待完成");
  if (uploading.value) throw new Error("视频正在替换，请等待完成");
  if (deleting.value) throw new Error("节点正在删除");
  if (pendingRecovery.value) {
    generation = generationState.resume().catch(error => showNodeError(error, "视频任务复查失败"));
    return { status: "generating" };
  }
  const choice = selectedModel.value;
  if (!choice) throw new Error("请先选择视频模型");
  if (data.value.retake && !retakeReady.value) throw new Error("请连接一个原视频，选择不超出原片的 4–30 秒片段，并为每个片段填写提示词");
  const unsupported = data.value.retake ? trackClips.value.find(clip => requestDuration(clip.length, choice) === undefined) : undefined;
  if (unsupported) throw new Error(`当前模型不支持 ${unsupported.length} 秒片段四舍五入后的 ${Math.round(unsupported.length)} 秒，请调整片段时长`);
  const inputs = data.value.retake ? retakeInputs.value : [generationInput.value];
  if (!inputs.every(Boolean)) throw new Error("提示词引用的素材已失效，请重新选择引用");
  if (inputs.some(input => !input!.prompt)) throw new Error("请输入生成提示词");
  if (refList.value.some(item => item.value === undefined)) throw new Error("引用节点暂无内容，请先补充引用内容");
  for (const match of inputs.flatMap(input => [...input!.prompt.matchAll(/\{\{ref (\d+)\}\}/g)])) {
    const reference = refList.value[Number(match[1]) - 1];
    if (reference?.dataType === "STRING" && !reference.value?.trim()) throw new Error(`参考 ${match[1]} 的文本为空，请补充内容或移除提示词中的引用`);
  }
  if (choice.mode?.length && !matchingModes.value.length) throw new Error("当前模型没有适合这些参考素材的生成模式，请更换模型或调整引用");
  const controller = new AbortController();
  const retake = data.value.retake ? { source: sourceFile.value!.url, clips: trackClips.value.map(clip => ({ start: clip.start, end: clip.start + clip.length })) } : undefined;
  generationController = controller;
  // ACT: 工具立即返回；任务身份先保存，卸载只停止等待，重新打开后复查。
  generation = generationState.run(async directory => {
    if (!retake) {
      const [result] = await generationState.generate("video", { ...inputs[0]!, directory }, controller.signal);
      controller.signal.throwIfAborted();
      if (!result) throw new Error("供应商未返回视频");
      outputs.value.video = { dataType: "VIDEO", value: { url: result.path, mimeType: result.mimeType } };
      return;
    }
    // 每个片段截取后单独提交；全部完成后再替换回原片对应区间。
    retakeStage.value = `正在截取 ${retake.clips.length} 个片段…`;
    const workspace = files.getWorkspaceFiles();
    const engine = await ffmpeg(controller.signal);
    for (const path of ["assets", `assets/${id}`]) {
      await workspace.mkdir(path).catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    }
    const items: { input: NodeVideoRequest; recoveryData: RetakeRecovery }[] = [];
    for (const [index, clip] of retake.clips.entries()) {
      const videoPath = `assets/${id}/retake${crypto.randomUUID()}.mp4`;
      const duration = inputs[index]!.duration!;
      await processVideo(engine, retake.source, { action: "trim", videoPath, ...clip, stretchTo: duration }, controller.signal);
      items.push({ input: { ...inputs[index]!, videos: [{ path: videoPath, mimeType: "video/mp4" }], directory }, recoveryData: { source: retake.source, ...clip, duration } });
    }
    retakeStage.value = `正在生成 ${items.length} 个片段…`;
    const results = await generationState.generateBatch("video", items, controller.signal);
    const [result] = await applyRetake(results, items.map(item => item.recoveryData), controller.signal);
    controller.signal.throwIfAborted();
    outputs.value.video = { dataType: "VIDEO", value: { url: result!.path, mimeType: result!.mimeType } };
  })
    .catch((error) => showNodeError(error, "视频生成失败"))
    .finally(() => {
      generationController = undefined;
    });
  return { status: "generating" };
}

/** 各片段任务结果按原选区拼回原视频；生成恢复时也走这里。 */
async function applyRetake(results: NodeMediaResult[][], clips: RetakeRecovery[], signal: AbortSignal): Promise<NodeMediaResult[]> {
  const replacements = results.map(([result], index) => {
    if (result?.mediaType !== "video") throw new Error("供应商未返回视频");
    return { ...clips[index]!, path: result.path };
  });
  const videoPath = `assets/${id}/retake${crypto.randomUUID()}.mp4`;
  retakeStage.value = "正在拼接视频…";
  await spliceVideo(await ffmpeg(signal), clips[0]!.source, replacements, videoPath, signal);
  return [{ mediaType: "video", path: videoPath, mimeType: "video/mp4" }];
}

nodeEvent.on("save", (reason) => {
  if (reason === "reload" && (generating.value || uploading.value || deleting.value)) throw new Error("视频处理中，请完成后再刷新节点");
});
nodeEvent.on("delete", async () => {
  if (uploading.value) throw new Error("视频正在替换，请稍后删除节点");
  deleting.value = true;
  try {
    await generationState.cancel(false);
    await generation;
    await files.removeNodeFiles();
  } finally {
    deleting.value = false;
  }
});

async function resizeVideo(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  if (sourceUrl.value && displayUrl.value === sourceUrl.value && Number.isFinite(video.duration)) sourceDuration.value = video.duration;
  if (!video.videoWidth || !video.videoHeight) return;
  videoAspect.value = video.videoWidth / video.videoHeight;
  await nextTick();
  updateNodeInternals();
}

function getConfig() {
  return {
    config: {
      providerId: selectedModel.value?.providerId ?? "",
      modelId: selectedModel.value?.modelId ?? "",
      duration: data.value.duration,
      resolution: data.value.resolution,
      ratio: data.value.ratio,
      mode: selectedMode.value,
      generateAudio: data.value.generateAudio,
      other: data.value.other,
    },
    models: models.value,
    ratios: ratioOptions.value,
    matchingModes: matchingModes.value,
  };
}

nodeTools.register({
  name: "getConfig",
  description: "读取此视频生成节点的当前配置、自定义配置 other、可选视频模型能力及适合当前引用的模式，models 中的 rules 声明自定义字段，不含密钥；ratios 为当前时长与分辨率的可选比例，其他组合见 durationResolutionMap",
  parameters: z.strictObject({}),
  async execute(_args, { signal }) {
    signal?.throwIfAborted();
    await loadModels();
    signal?.throwIfAborted();
    return getConfig();
  },
});

nodeTools.register({
  name: "setConfig",
  description: "修改此视频生成节点的模型、时长、分辨率、比例、模式、声音或自定义配置 other；先用 getConfig 查询能力，providerId 与 modelId 必须同时提供；other 按目标模型 rules 的 field 和值要求填写，仅更新传入字段，其余保留，切换模型时使用新模型默认值；mode 使用返回的原始字符串或数组，须匹配当前引用；不修改提示词、不启动生成",
  parameters: z.strictObject({
    providerId: z.string().min(1).optional(),
    modelId: z.string().min(1).optional(),
    duration: z.number().positive().optional(),
    resolution: z.string().min(1).optional(),
    ratio: z.string().min(1).optional(),
    mode: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    generateAudio: z.boolean().optional(),
    other: z.record(z.string(), z.json()).optional(),
  }).refine((args) => (args.providerId === undefined) === (args.modelId === undefined), "providerId 与 modelId 必须同时提供"),
  async execute(args, { signal }) {
    signal?.throwIfAborted();
    if (generating.value || deleting.value) throw new Error("节点正在生成或删除，请稍后修改配置");
    await loadModels();
    signal?.throwIfAborted();
    if (generating.value || deleting.value) throw new Error("节点正在生成或删除，请稍后修改配置");
    const choice = args.modelId === undefined ? selectedModel.value
      : findNodeModel(models.value, { providerId: args.providerId ?? "", modelId: args.modelId });
    if (!choice) throw new Error("请选择 getConfig 返回的有效视频模型");
    const durations = getDurations(choice);
    if (args.duration !== undefined && !durations.includes(args.duration)) throw new Error(`当前模型不支持时长 ${args.duration}，可选：${durations.join("、")}`);
    const duration = args.duration ?? (durations.includes(data.value.duration!) ? data.value.duration : durations[0]);
    const resolutions = getResolutions(choice, duration);
    if (args.resolution !== undefined && !resolutions.includes(args.resolution)) throw new Error(`当前时长不支持分辨率 ${args.resolution}，可选：${resolutions.join("、")}`);
    const resolution = args.resolution ?? (resolutions.includes(data.value.resolution) ? data.value.resolution : resolutions[0] ?? "");
    const ratios = getVideoRatios(choice.durationResolutionMap, duration, resolution);
    if (args.ratio !== undefined && !ratios.includes(args.ratio)) throw new Error(`当前模型不支持比例 ${args.ratio}，可选：${ratios.join("、")}`);
    const ratio = args.ratio ?? selectRatio(ratios, data.value.ratio);
    if (args.mode !== undefined && !getMatchingModes(choice).some((item) => JSON.stringify(item) === JSON.stringify(args.mode))) throw new Error("所选模式不受当前模型支持或不适用于当前引用，请根据模型能力及已连接素材选择");
    if (args.generateAudio !== undefined && choice.audio !== "optional" && args.generateAudio !== (choice.audio === true)) throw new Error("当前模型不支持切换声音，请查看 getConfig 返回的 audio 能力");
    const other = getModelFormValues(choice, choice === selectedModel.value ? data.value.other : {}, args.other);
    data.value.model = getNodeModelKey(choice);
    data.value.duration = duration;
    data.value.resolution = resolution;
    data.value.ratio = ratio;
    if (args.mode !== undefined) data.value.mode = JSON.stringify(args.mode);
    if (args.generateAudio !== undefined) data.value.generateAudio = args.generateAudio;
    data.value.other = other;
    return getConfig();
  },
});

nodeTools.register({
  name: "setPrompt",
  description: "修改此节点的视频生成提示词，仅接收 prompt，支持 {{ref 1}} 等参考标记；时长 duration、分辨率等配置须先用 node:getConfig 查询能力，再单独调用 node:setConfig；不启动生成",
  parameters: z.strictObject({ prompt: z.string() }),
  execute({ prompt: value }) {
    if (deleting.value) throw new Error("节点正在删除，请稍后修改");
    data.value.prompt = value;
    data.value.promptModel = value.split("\n").map((text) => [{ type: "Write", text }]);
    return { prompt: value };
  },
});

nodeTools.register({
  name: "generateVideo",
  description: "启动此节点的后台视频生成，使用当前提示词、模型、模式、时长、分辨率、比例和参考素材；立即返回已开始，用 getGenerationStatus 查询完成结果，cancelGeneration 停止生成",
  parameters: z.strictObject({}),
  execute(_args, { signal }) {
    signal?.throwIfAborted();
    return startGeneration();
  },
});
</script>

<style scoped lang="scss">
.videoContent {
  .nodeSkeleton.resized & {
    height: 100%;
    min-height: 0;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    --nodeMediaHeight: 100%;

    .videoEmpty { min-height: 0; height: 100%; }
  }

  position: relative;
  display: grid;
  place-items: center;
  min-height: 144px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);

  .videoEmpty {
    display: grid;
    place-items: center;
    min-height: 144px;
    color: var(--el-text-color-placeholder);
  }

}

.promptCard {
  :deep(.retakeTime) {
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--el-fill-color-dark);
    font-variant-numeric: tabular-nums;
  }
  .retakeEditor {
    margin-bottom: 12px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    .retakeTrack {
      position: relative;
      height: 54px;
      overflow: hidden;
      border-radius: 5px;
      touch-action: none;
      user-select: none;
      cursor: crosshair;
      --rangeAccent: var(--el-color-primary);
      .trackFrames, .draftClip { pointer-events: none; }
      .trackClip, .draftClip {
        position: absolute;
        inset-block: 0;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        container-type: inline-size;
        border: 2px solid var(--rangeAccent);
        border-radius: 5px;
        background: color-mix(in srgb, var(--rangeAccent) 12%, transparent);
        cursor: grab;
      }
      .savedClip, .draftClip { border-style: dashed; }
      // 时长固定在左上角始终显示；播放、删除放在下方两角避开时长，悬停或聚焦片段时才出现。
      .trackClip > .rangeDuration {
        position: absolute;
        top: 2px;
        left: 6px;
        pointer-events: none;
        background: transparent;
        color: var(--el-color-white);
        text-shadow: 0 1px 3px #000, 0 0 4px #000;
        font: 600 11px/14px var(--el-font-family, sans-serif);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .clipPlayback, .clipRemove { position: absolute; bottom: 4px; visibility: hidden; }
      .trackClip:hover, .trackClip:focus-within {
        > .clipPlayback, > .clipRemove { visibility: visible; }
      }
      .clipPlayback { left: 7px; }
      .clipRemove { right: 7px; }
      .clipPlayback, .clipRemove {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        // 按钮叠在视频缩略图上，深浅主题都用半透明黑底白图标。
        color: white;
        background: rgb(0 0 0 / 60%);
        pointer-events: auto;
        cursor: pointer;
        &:enabled:hover { background: color-mix(in srgb, var(--rangeAccent) 55%, #101820); }
        &:focus-visible { outline: 2px solid white; outline-offset: 1px; }
        &:disabled { opacity: .55; cursor: default; }
        &.clipRemove:enabled:hover { background: color-mix(in srgb, var(--el-color-danger) 55%, #101820); }
      }
      // 片段较窄时缩小按钮，播放和删除仍直接可点。
      @container (max-width: 64px) {
        .clipPlayback, .clipRemove { width: 18px; height: 18px; }
        .clipPlayback { left: 4px; }
        .clipRemove { right: 4px; }
      }

      .rangeHandle {
        position: absolute;
        top: 0;
        height: 100%;
        width: 10px;
        padding: 0;
        border: none;
        border-radius: 3px;
        background: var(--rangeAccent);
        cursor: ew-resize;
        touch-action: none;
        transform: translateX(-50%);
        &::after { content: ""; display: inline-block; width: 2px; height: 14px; background: var(--el-color-white); }
      }

    }
  }
  .referenceHint {
    margin: 8px 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .promptFooter {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;

    .modelSelect {
      width: 280px;
      min-width: 0;

      &:deep(.el-select__wrapper) {
        gap: 6px;
        padding: 0;
        box-shadow: none;
        background: transparent;
      }
    }

    .generationActions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;

      .sendButton {
        width: 32px;
        height: 32px;
        margin-left: 0;
        padding: 0;
        --el-button-bg-color: var(--el-text-color-primary);
        --el-button-border-color: transparent;
        --el-button-text-color: var(--el-bg-color);
        --el-button-hover-bg-color: var(--el-text-color-regular);
        --el-button-hover-border-color: transparent;
        --el-button-hover-text-color: var(--el-bg-color);
      }
    }
  }
}
</style>
