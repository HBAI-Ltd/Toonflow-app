<template>
  <el-dialog
    v-model="visible"
    :title="actionLabels[action]"
    :width="action === 'trim' ? '760px' : '520px'"
    :top="action === 'trim' ? '6vh' : '15vh'"
    appendToBody
    destroyOnClose
    :closeOnClickModal="!processing"
    :closeOnPressEscape="!processing"
    :showClose="!processing"
    @closed="clearPreview"
    :style="{ maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(94vh - 12px)', overflow: 'auto' }">
    <div class="videoActionPanel nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
      <template v-if="action === 'trim'">
        <video ref="preview" class="clipPreview" :src="src" controls playsinline preload="metadata" aria-label="截取片段预览" @loadedmetadata="readDuration" @timeupdate="readTime" @play="playSelection" @error="duration = 0" />
        <div class="clipTimeline" :class="{ unavailable: processing || !duration }">
          <div class="timelineHeader">
            <span>拖动左右边界，选择保留的片段</span>
            <span class="sourceDuration">原视频 {{ formatTime(duration) }}</span>
          </div>
          <div class="timelineBody">
            <div ref="track" class="frameTrack" @pointerdown="seekTrack">
              <div class="filmstrip" aria-hidden="true">
                <div v-for="index in frameCount" :key="index" class="frameCell">
                  <img v-if="frames[index - 1]" :src="frames[index - 1]" alt="" draggable="false" />
                </div>
              </div>
              <div class="discardedArea" :style="{ left: 0, width: `${startPercent}%` }" />
              <div class="discardedArea" :style="{ left: `${endPercent}%`, right: 0 }" />
              <div class="selectedArea" :style="{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }" />
              <div v-if="duration" class="playhead" :style="{ left: `${Math.min(100, currentTime / duration * 100)}%` }" aria-hidden="true" />
              <button
                v-for="edge in (['start', 'end'] as const)"
                :key="edge"
                type="button"
                class="trimHandle"
                :class="{ startHandle: edge === 'start', endHandle: edge === 'end', dragging: dragging === edge }"
                :style="{ left: `${edge === 'start' ? startPercent : endPercent}%` }"
                role="slider"
                :aria-label="edge === 'start' ? '片段开始边界' : '片段结束边界'"
                aria-orientation="horizontal"
                :aria-valuemin="edge === 'start' ? 0 : start + minimumLength"
                :aria-valuemax="edge === 'start' ? Math.max(0, end - minimumLength) : clipLimit"
                :aria-valuenow="edge === 'start' ? start : end"
                :aria-valuetext="Number.isFinite(edge === 'start' ? start : end) ? `${(edge === 'start' ? start : end).toFixed(2)} 秒` : '未设置'"
                :disabled="processing || disabled || !duration"
                @pointerdown.stop.prevent="beginDrag($event, edge)"
                @pointermove.stop.prevent="moveDrag"
                @pointerup="endDrag"
                @pointercancel="endDrag"
                @lostpointercapture="endDrag"
                @keydown="changeBoundary($event, edge)">
                <span aria-hidden="true" />
              </button>
            </div>
            <div class="timeRuler" aria-hidden="true"><span v-for="index in 5" :key="index">{{ formatTime(duration * (index - 1) / 4) }}</span></div>
          </div>
        </div>
        <div class="clipTimes">
          <label><span>开始时间</span><input v-model.number="start" class="timeInput" type="number" min="0" :max="clipLimit" step="0.01" :disabled="processing || !duration" aria-label="片段开始时间" @input="seekPreview(($event.target as HTMLInputElement).valueAsNumber)" /><span>秒</span></label>
          <label><span>结束时间</span><input v-model.number="end" class="timeInput" type="number" min="0" :max="clipLimit" step="0.01" :disabled="processing || !duration" aria-label="片段结束时间" @input="seekPreview(($event.target as HTMLInputElement).valueAsNumber)" /><span>秒</span></label>
          <span class="selectionDuration">时长 {{ validRange ? (end - start).toFixed(2) : '—' }} 秒</span>
        </div>
        <p class="actionHint">{{ validRange ? '截取后生成新视频节点，原视频会保留。' : '请选择有效的起止时间。' }}</p>
      </template>
      <p v-else class="actionHint">{{ action === 'extractAudio' ? '提取音轨并生成音频节点，保留原视频。' : '生成静音视频和音频两个节点，保留原视频。' }}</p>
      <div v-if="processing" class="processingStatus" role="status" aria-live="polite">
        <el-progress :percentage="100" :indeterminate="true" :showText="false" />
        <span>{{ cancelling ? '正在取消并清理文件…' : '正在处理视频…' }}</span>
      </div>
      <div class="panelActions">
        <el-button :disabled="cancelling" @click="processing ? cancel() : visible = false">{{ processing ? '取消处理' : '取消' }}</el-button>
        <el-button type="primary" :loading="processing" :disabled="disabled || !file || (action === 'trim' && !validRange)" @click="run">{{ actionLabels[action] }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from "vue";
import { useNode, useVueFlow, type Node } from "@vue-flow/core";
import { ElButton, ElDialog, ElMessage, ElProgress } from "element-plus";
import { useNodeFiles, useNodeFfmpeg, useNodeEvent, type WorkspaceFiles, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import { processVideo } from "../videoProcessing";

const props = defineProps<{ file?: NodeMediaValue; src: string; disabled?: boolean }>();
const { node } = useNode();
const { addNodes, findNode, getNodes, nodeTypes } = useVueFlow();
const files = useNodeFiles();
const loadFfmpeg = useNodeFfmpeg();
const nodeEvent = useNodeEvent();
const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
const actionLabels = { extractAudio: "提取音轨", separate: "分离音视频", trim: "截取片段" };
const action = ref<keyof typeof actionLabels>("trim");
const visible = ref(false);
const processing = ref(false);
const cancelling = ref(false);
const preview = ref<HTMLVideoElement>();
const duration = ref(0);
const start = ref(0);
const end = ref(0);
const track = ref<HTMLDivElement>();
const currentTime = ref(0);
const frames = ref<string[]>([]);
const frameCount = 10;
const dragging = ref<"start" | "end">();
const clipLimit = computed(() => duration.value < 0.01 ? duration.value : Math.floor(duration.value * 100) / 100);
const minimumLength = computed(() => Math.min(0.01, clipLimit.value));
const startPercent = computed(() => duration.value && Number.isFinite(start.value) ? Math.min(100, Math.max(0, start.value / duration.value * 100)) : 0);
const endPercent = computed(() => duration.value && Number.isFinite(end.value) ? Math.min(100, Math.max(0, end.value / duration.value * 100)) : 100);
const validRange = computed(() => Number.isFinite(start.value) && Number.isFinite(end.value) && start.value >= 0 && end.value > start.value && end.value <= duration.value);
let controller: AbortController | undefined;
let job: Promise<void> | undefined;
let thumbnailVideo: HTMLVideoElement | undefined;
let thumbnailTimer: number | undefined;
let drag: { pointerId: number; target: HTMLElement; x: number; time: number; width: number } | undefined;

function cancel() {
  if (!controller) return;
  cancelling.value = true;
  controller.abort();
}

function reset() {
  cancel();
  clearPreview();
  visible.value = false;
  duration.value = 0;
}

watch(() => props.file?.url, reset, { flush: "sync" });
watch(() => props.src, reset, { flush: "sync" });
watch(() => props.disabled, disabled => { if (disabled) reset(); }, { flush: "sync" });
watch(() => getCanvas?.()?.id, reset, { flush: "sync" });
watch(visible, value => { if (!value) clearPreview(); });
onBeforeUnmount(() => { cancel(); clearPreview(); });
nodeEvent.on("save", reason => {
  if (reason === "reload" && processing.value) throw new Error("视频处理中，请完成或取消后再刷新节点");
});
nodeEvent.on("delete", async () => { cancel(); await job; });

function open(value: keyof typeof actionLabels) {
  if (processing.value || props.disabled || !props.file) return;
  action.value = value;
  duration.value = start.value = end.value = 0;
  currentTime.value = 0;
  frames.value = [];
  visible.value = true;
  if (value !== "trim") run();
}

defineExpose({ open, processing });

function readDuration(event: Event) {
  const value = (event.currentTarget as HTMLVideoElement).duration;
  duration.value = Number.isFinite(value) && value > 0 ? value : 0;
  end.value = clipLimit.value;
  if (duration.value) loadThumbnails();
}

function formatTime(value: number) {
  const centiseconds = Math.max(0, Math.floor(value * 100));
  return `${String(Math.floor(centiseconds / 6000)).padStart(2, "0")}:${(centiseconds % 6000 / 100).toFixed(2).padStart(5, "0")}`;
}

function stopThumbnails() {
  clearTimeout(thumbnailTimer);
  if (!thumbnailVideo) return;
  thumbnailVideo.onloadeddata = thumbnailVideo.onseeked = thumbnailVideo.onerror = null;
  thumbnailVideo.removeAttribute("src");
  thumbnailVideo.load();
  thumbnailVideo = undefined;
}

function loadThumbnails() {
  stopThumbnails();
  frames.value = [];
  const source = thumbnailVideo = document.createElement("video");
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return void stopThumbnails();
  // ACT: 只采样 10 张小图，缩略图数量与内存不随视频时长增长，不生成逐帧缓存。
  const seekFrame = () => {
    clearTimeout(thumbnailTimer);
    thumbnailTimer = window.setTimeout(stopThumbnails, 15000);
    const time = Math.min(duration.value * (frames.value.length + 0.5) / frameCount, Math.max(0, duration.value - 0.001));
    if (source.readyState >= 2 && Math.abs(source.currentTime - time) < 0.000001) captureFrame();
    else source.currentTime = time;
  };
  const captureFrame = () => {
    try {
      const scale = Math.max(canvas.width / source.videoWidth, canvas.height / source.videoHeight);
      context.drawImage(source, (canvas.width - source.videoWidth * scale) / 2, (canvas.height - source.videoHeight * scale) / 2, source.videoWidth * scale, source.videoHeight * scale);
      frames.value.push(canvas.toDataURL("image/jpeg", 0.75));
      if (frames.value.length === frameCount) stopThumbnails();
      else seekFrame();
    } catch { stopThumbnails(); }
  };
  source.onloadeddata = seekFrame;
  source.onseeked = captureFrame;
  source.onerror = stopThumbnails;
  source.muted = true;
  source.preload = "auto";
  source.src = props.src;
  thumbnailTimer = window.setTimeout(stopThumbnails, 15000);
  source.load();
}

function clearPreview() {
  preview.value?.pause();
  stopThumbnails();
  endDrag();
}

function seekPreview(value: number) {
  if (!preview.value || !duration.value || !Number.isFinite(value)) return;
  preview.value.pause();
  preview.value.currentTime = Math.min(Math.max(0, duration.value - 0.001), Math.max(0, value));
  currentTime.value = preview.value.currentTime;
}

function readTime() {
  if (!preview.value) return;
  currentTime.value = preview.value.currentTime;
  if (!preview.value.paused && validRange.value && currentTime.value >= end.value) preview.value.pause();
}

function playSelection() {
  if (preview.value && validRange.value && (preview.value.currentTime < start.value || preview.value.currentTime >= end.value)) preview.value.currentTime = start.value;
}

function setBoundary(edge: "start" | "end", value: number) {
  if (processing.value || props.disabled || !duration.value || !Number.isFinite(value) || !Number.isFinite(start.value) || !Number.isFinite(end.value)) return;
  const rounded = Math.round(value * 100) / 100;
  if (edge === "start") start.value = Math.max(0, Math.min(end.value - minimumLength.value, rounded));
  else end.value = Math.min(clipLimit.value, Math.max(start.value + minimumLength.value, rounded));
  if (duration.value >= 0.01 && edge === "start") start.value = Number(start.value.toFixed(2));
  if (duration.value >= 0.01 && edge === "end") end.value = Number(end.value.toFixed(2));
  seekPreview(edge === "start" ? start.value : end.value);
}

function beginDrag(event: PointerEvent, edge: "start" | "end") {
  const width = track.value?.getBoundingClientRect().width;
  if (event.button !== 0 || drag || !width || processing.value || props.disabled || !duration.value) return;
  const target = event.currentTarget as HTMLElement;
  drag = { pointerId: event.pointerId, target, x: event.clientX, time: edge === "start" ? start.value : end.value, width };
  dragging.value = edge;
  target.setPointerCapture(event.pointerId);
  seekPreview(drag.time);
}

function moveDrag(event: PointerEvent) {
  if (!drag || !dragging.value || event.pointerId !== drag.pointerId) return;
  setBoundary(dragging.value, drag.time + (event.clientX - drag.x) / drag.width * duration.value);
}

function endDrag(event?: PointerEvent) {
  if (!drag || (event && event.pointerId !== drag.pointerId)) return;
  const previous = drag;
  drag = undefined;
  dragging.value = undefined;
  if (previous.target.hasPointerCapture(previous.pointerId)) previous.target.releasePointerCapture(previous.pointerId);
}

function changeBoundary(event: KeyboardEvent, edge: "start" | "end") {
  const step = event.shiftKey ? 1 : 0.1;
  const time = edge === "start" ? start.value : end.value;
  const values: Record<string, number> = { ArrowLeft: time - step, ArrowDown: time - step, ArrowRight: time + step, ArrowUp: time + step, Home: 0, End: clipLimit.value };
  if (!(event.key in values)) return;
  event.preventDefault();
  setBoundary(edge, values[event.key]!);
}

function seekTrack(event: PointerEvent) {
  if (event.button !== 0 || processing.value || props.disabled || !duration.value || !track.value) return;
  const rect = track.value.getBoundingClientRect();
  if (rect.width) seekPreview(Math.max(start.value, Math.min(end.value, (event.clientX - rect.left) / rect.width * duration.value)));
}

function run() {
  if (processing.value || props.disabled || !props.file || (action.value === "trim" && !validRange.value)) return;
  job = process();
}

async function process() {
  const operation = action.value;
  const requiredTypes = operation === "extractAudio" ? ["remote-audioNode"] : operation === "trim" ? ["remote-videoNode"] : ["remote-videoNode", "remote-audioNode"];
  if (requiredTypes.some(type => !nodeTypes?.value?.[type])) return void ElMessage.error("请先启用所需的视频或音频节点插件");
  const source = props.file!.url;
  const clipStart = start.value;
  const clipEnd = end.value;
  const current = controller = new AbortController();
  processing.value = true;
  cancelling.value = false;
  preview.value?.pause();
  const outputs = requiredTypes.map(type => {
    const id = crypto.randomUUID();
    const audio = type === "remote-audioNode";
    return { id, type, audio, path: `assets/${id}/${audio ? "audio.m4a" : "video.mp4"}` };
  });
  const createdDirectories: string[] = [];
  let workspace: WorkspaceFiles | undefined;
  let committed = false;
  try {
    workspace = files.getWorkspaceFiles();
    const ffmpeg = await loadFfmpeg(current.signal);
    current.signal.throwIfAborted();
    await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    for (const output of outputs) {
      current.signal.throwIfAborted();
      const directory = `assets/${output.id}`;
      await workspace.mkdir(directory);
      createdDirectories.push(directory);
    }
    current.signal.throwIfAborted();
    const media = await processVideo(ffmpeg, source, {
      action: operation,
      audioPath: outputs.find(output => output.audio)?.path,
      videoPath: outputs.find(output => !output.audio)?.path,
      start: clipStart,
      end: clipEnd,
    }, current.signal);
    current.signal.throwIfAborted();
    const width = Math.max(320, media.width && media.height ? 240 * media.width / media.height + 18 : 320);
    const x = node.computedPosition.x + node.dimensions.width + 80;
    const height = outputs.length * 320;
    let y = node.computedPosition.y;
    for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
      const position = other.computedPosition;
      if (position.x < x + width && position.x + other.dimensions.width > x && position.y < y + height && position.y + other.dimensions.height > y) y = position.y + other.dimensions.height + 40;
    }
    const nodes: Node[] = outputs.map((output, index) => ({
      id: output.id,
      type: output.type,
      position: { x, y: y + index * 320 },
      data: {
        label: `${node.data.label || "视频"} · ${output.audio ? "音轨" : operation === "separate" ? "静音视频" : `${clipStart.toFixed(2)}–${clipEnd.toFixed(2)} 秒`}`,
        outputs: { [output.audio ? "audio" : "video"]: { dataType: output.audio ? "AUDIO" : "VIDEO", value: { url: output.path, mimeType: output.audio ? "audio/mp4" : "video/mp4" } } },
      },
    }));
    await batchHistory(async () => {
      current.signal.throwIfAborted();
      if (findNode(node.id) !== node || requiredTypes.some(type => !nodeTypes?.value?.[type])) throw new Error("画布节点已变化，请重新处理");
      addNodes(nodes);
      committed = true;
    });
    visible.value = false;
    ElMessage.success(`${actionLabels[operation]}完成，已生成 ${nodes.length} 个节点`);
  } catch (error) {
    if (!current.signal.aborted) showNodeError(error, `${actionLabels[operation]}失败`);
  } finally {
    if (!committed && workspace) {
      const results = await Promise.allSettled(createdDirectories.map(path => workspace!.remove(path, true)));
      if (results.some(result => result.status === "rejected" && result.reason?.response?.data?.data?.code !== "ENOENT")) ElMessage.error("部分临时媒体文件清理失败");
    }
    if (current.signal.aborted) visible.value = false;
    processing.value = cancelling.value = false;
    controller = undefined;
  }
}
</script>

<style scoped lang="scss">
.videoActionPanel {
  .clipPreview { display: block; width: 100%; height: min(30vh, 300px); background: #0c0e13; border-radius: 12px; object-fit: contain; }
  .clipTimeline {
    margin-top: 20px;
    padding: 16px 18px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-fill-color-light);
    &.unavailable { opacity: 0.55; }
    .timelineHeader {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--el-text-color-regular);
      font-size: 12px;
      .sourceDuration { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
    }
    .timelineBody {
      margin: 0 16px;
      .frameTrack {
        position: relative;
        height: 64px;
        cursor: crosshair;
        touch-action: none;
        user-select: none;
        .filmstrip {
          display: flex;
          height: 100%;
          overflow: hidden;
          border-radius: 5px;
          background: var(--el-fill-color-darker);
          .frameCell {
            flex: 1;
            min-width: 0;
            border-right: 1px solid rgba(255, 255, 255, 0.12);
            background: linear-gradient(135deg, transparent, rgba(0, 0, 0, 0.12));
            img { display: block; width: 100%; height: 100%; object-fit: cover; }
          }
        }
        .discardedArea { position: absolute; top: 0; bottom: 0; background: rgba(9, 12, 20, 0.7); pointer-events: none; }
        .selectedArea { position: absolute; top: 0; bottom: 0; box-sizing: border-box; border-block: 3px solid var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); pointer-events: none; }
        .playhead {
          position: absolute;
          z-index: 2;
          top: -5px;
          bottom: -5px;
          width: 2px;
          background: #fff;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
          pointer-events: none;
          &::before { position: absolute; top: 0; left: -3px; width: 8px; height: 7px; border-radius: 2px; background: #fff; content: ""; }
        }
        .trimHandle {
          position: absolute;
          z-index: 3;
          top: 0;
          display: grid;
          place-items: center;
          width: 16px;
          height: 100%;
          padding: 0;
          border: 0;
          background: var(--el-color-primary);
          color: #fff;
          cursor: ew-resize;
          touch-action: none;
          &.startHandle { transform: translateX(-100%); border-radius: 6px 0 0 6px; }
          &.endHandle { border-radius: 0 6px 6px 0; }
          &:hover, &.dragging { filter: brightness(1.15); box-shadow: 0 0 0 3px var(--el-color-primary-light-7); }
          &:focus-visible { outline: 2px solid var(--el-text-color-primary); outline-offset: 3px; }
          &:disabled { cursor: not-allowed; }
          span { width: 3px; height: 22px; border-radius: 2px; background: currentColor; opacity: 0.85; }
        }
      }
      .timeRuler { display: flex; justify-content: space-between; gap: 4px; margin-top: 12px; color: var(--el-text-color-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
    }
  }
  .clipTimes {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 24px;
    margin-top: 16px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      .timeInput {
        box-sizing: border-box;
        width: 96px;
        height: 32px;
        padding: 0 10px;
        border: 1px solid var(--el-border-color);
        border-radius: var(--el-border-radius-base);
        background: var(--el-bg-color);
        color: var(--el-text-color-primary);
        font: inherit;
        font-variant-numeric: tabular-nums;
        text-align: center;
        &:hover { border-color: var(--el-border-color-hover); }
        &:focus { border-color: var(--el-color-primary); outline: 1px solid var(--el-color-primary); }
        &:disabled { color: var(--el-text-color-placeholder); cursor: not-allowed; }
      }
    }
    .selectionDuration { margin-left: auto; font-variant-numeric: tabular-nums; white-space: nowrap; }
  }
  .actionHint { margin: 16px 0; color: var(--el-text-color-secondary); font-size: 13px; }
  .processingStatus {
    display: grid;
    gap: 10px;
    margin: 16px 0;
    span { color: var(--el-text-color-secondary); font-size: 13px; }
  }
  .panelActions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  @media (max-width: 560px) {
    .clipTimeline {
      padding-inline: 8px;
      .timelineBody .timeRuler span:nth-child(even) { visibility: hidden; }
    }
  }
}
</style>
