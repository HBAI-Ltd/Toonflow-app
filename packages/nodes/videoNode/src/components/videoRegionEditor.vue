<template>
  <div class="regionEditor">
    <videoPlayer :src="src" label="视频编辑预览" readOnly @loadedmetadata="readSize" @ready="playable = $event">
      <template #frameOverlay>
        <div ref="frame" class="regionFrame nodrag nopan" :class="{ cropping }" tabindex="0" role="group" aria-label="视频选区，可用方向键移动"
          @pointerdown.stop="beginDrag" @pointermove.stop="moveDrag" @pointerup="finishDrag" @pointercancel="finishDrag" @lostpointercapture="finishDrag"
          @keydown="adjustByKey" @dblclick.stop>
          <img v-if="repairedUrl && showRepair" :src="repairedUrl" class="repairPreview" alt="" draggable="false" />
          <div class="selection" data-selection :style="selectionStyle">
            <canvas v-if="masking || referenceFrame" v-show="showPatch" ref="patch" class="maskPreview" :class="{ mosaic: masking && !blurring }" :style="patchStyle" aria-hidden="true" />
            <div v-if="cropping" class="cropGrid" aria-hidden="true" />
            <div class="selectionOutline" aria-hidden="true" />
            <button v-for="(label, corner) in corners" :key="corner" type="button" class="corner" :data-corner="corner"
              :aria-label="'调整选区' + label + '角，使用方向键微调'" :title="'调整' + label + '角'" />
          </div>
          <i v-for="(box, index) in boxes" :key="index" class="detectedLine" :style="boxStyle(box)" />
          <svg v-if="blurring" width="0" height="0" class="filterDefinitions" aria-hidden="true">
            <defs><filter :id="blurId" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
              <feGaussianBlur :stdDeviation="strength * displayScale" edgeMode="duplicate" />
            </filter></defs>
          </svg>
        </div>
      </template>
    </videoPlayer>
    <div v-if="choiceField?.options" class="selectionInfo">
      <span>{{ translate(choiceField.label) }}</span>
      <el-radio-group :modelValue="values[choiceField.key]" size="small" :aria-label="translate(choiceField.label)"
        @change="value => emit('updateValues', { [choiceField!.key]: String(value) })">
        <el-radio-button v-for="option in choiceField.options" :key="option.value" :value="option.value">
          <span class="regionOption"><i v-if="cropping" class="ratioShape" :style="{ aspectRatio: option.value }" aria-hidden="true" />
            <component :is="option.value === 'blur' ? IconBlur : IconGridDots" v-else aria-hidden="true" />{{ translate(option.label) }}</span>
        </el-radio-button>
      </el-radio-group>
    </div>
    <div v-if="subtitleTool" class="selectionInfo">
      <span>字幕位置</span>
      <el-radio-group :modelValue="selectedPosition" size="small" aria-label="字幕位置" @update:modelValue="setPosition">
        <el-radio-button :value="subtitleRegion.y">下方</el-radio-button>
        <el-radio-button :value="33.5">中部</el-radio-button>
        <el-radio-button :value="2">上方</el-radio-button>
      </el-radio-group>
    </div>
    <div class="selectionInfo">
      <span>{{ cropping ? '移动裁剪框调整构图，拖动边角等比缩放' : '在画面上拖出选区，拖动边角调整范围' }}</span>
      <output v-if="ready && !subtitleTool">{{ region.w }} × {{ region.h }} px</output>
    </div>
    <div v-if="repairing || tool.id === 'readSubtitles'" class="selectionInfo">
      <el-button v-if="repairedUrl" size="small" @click="showRepair = !showRepair">{{ showRepair ? '查看原画面' : '查看擦除效果' }}</el-button>
      <el-button v-else size="small" :loading="!!inspecting" :disabled="!ready || seeking" @click="inspect">{{ repairing ? '预览擦除效果' : '查找画面中的字幕' }}</el-button>
      <span role="status">{{ detectionStatus }}</span>
    </div>
    <div v-if="hasReference" class="selectionInfo">
      <el-button size="small" :disabled="!playable || seeking" @click="mark('referenceTime')">用这帧作背景</el-button>
      <span>{{ Number(values.referenceTime) >= 0 ? Number(values.referenceTime).toFixed(2) + ' 秒' : '暂停在背景相同、框内无遮挡的画面。' }}</span>
    </div>
    <span v-if="hasReference" class="selectionInfo">请选镜头固定、背景不动的片段。</span>
    <div v-if="tool.id === 'patchGoodFrame'" class="selectionInfo">
      <el-button size="small" :disabled="!playable || seeking" @click="mark('start')">设为修补起点 · {{ Number(values.start).toFixed(2) }} 秒</el-button>
      <el-button size="small" :disabled="!playable || seeking" @click="mark('end')">设为修补终点 · {{ Number(values.end).toFixed(2) }} 秒</el-button>
    </div>
    <span v-if="tool.id === 'trackTarget'" class="selectionInfo">在首帧圈选要持续遮挡的目标。它离开画面时会终止处理。</span>
    <div v-if="masking" class="strengthControl">
      <label :for="strengthId">{{ blurring ? '模糊强度' : '马赛克大小' }}</label>
      <input :id="strengthId" type="range" min="2" max="96" step="1" :value="strength" :disabled="!ready"
        @input="emit('updateValues', { strength: Number(($event.target as HTMLInputElement).value) })" />
      <output :for="strengthId">{{ strength }} px</output>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onScopeDispose, ref, shallowRef, useId, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { ElButton, ElRadioButton, ElRadioGroup } from "element-plus";
import { IconBlur, IconGridDots } from "@tabler/icons-vue";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import { requestMediaModel } from "@toonflow/node-shared/mediaModelJob";
import { detectSubtitleLines, type PixelRect } from "../videoTextDetection";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { cropSize, maskRegion, patchFeather, subtitleRegion } from "../videoRegion";
import { useFramePreview } from "../useFramePreview";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const choiceField = computed(() => props.tool.fields?.find(field => field.key === props.tool.menuField));
const corners = { nw: "左上", ne: "右上", sw: "左下", se: "右下" };
type Corner = keyof typeof corners;
type Mode = Corner | "move" | "draw";
type Point = { x: number; y: number };
type Bounds = { x: number; y: number; w: number; h: number };
const frame = ref<HTMLDivElement>();
const patch = ref<HTMLCanvasElement>();
const video = shallowRef<HTMLVideoElement>();
const size = ref({ width: 0, height: 0 });
const playable = ref(false);
const seeking = ref(false);
let presentedTime: number | undefined;
const model = useNodeModel();
const getDirectory = inject<() => string>("workspaceDirectory", () => "");
const inspecting = shallowRef<AbortController>();
const boxes = shallowRef<PixelRect[]>([]);
const detectionStatus = ref("");
const repairing = computed(() => props.tool.id === "restoreSubtitles");
const subtitleTool = computed(() => repairing.value || ["readSubtitles", "cleanPlate"].includes(props.tool.id));
const selectedPosition = computed(() => {
  const { x, y, width, height } = props.values;
  return x === subtitleRegion.x && width === subtitleRegion.width && height === subtitleRegion.height ? y : undefined;
});
function setPosition(y: string | number | boolean | undefined) {
  if (typeof y === "number") emit("updateValues", { ...subtitleRegion, y });
}
const hasReference = computed(() => ["cleanPlate", "patchGoodFrame"].includes(props.tool.id));
const referenceFrame = shallowRef<HTMLCanvasElement>();
const repairedUrl = ref("");
const showRepair = ref(false);
function resetDetection() {
  inspecting.value?.abort();
  inspecting.value = undefined;
  boxes.value = [];
  detectionStatus.value = "";
  if (repairedUrl.value) URL.revokeObjectURL(repairedUrl.value);
  repairedUrl.value = "";
  showRepair.value = false;
}
function boxStyle(box: PixelRect) {
  const { width, height } = size.value;
  return { left: box.x / width * 100 + "%", top: box.y / height * 100 + "%", width: box.w / width * 100 + "%", height: box.h / height * 100 + "%" };
}
function mark(key: string) {
  const el = video.value;
  if (!el || el.seeking || el.readyState < 2) return;
  el.pause();
  if (hasReference.value && key === "referenceTime") {
    const snapshot = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(el.videoWidth, el.videoHeight));
    snapshot.width = Math.max(1, Math.round(el.videoWidth * scale));
    snapshot.height = Math.max(1, Math.round(el.videoHeight * scale));
    const ctx = snapshot.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, 0, 0, snapshot.width, snapshot.height);
    referenceFrame.value = snapshot;
  }
  const time = key === "referenceTime" ? Math.max(0, Math.min(presentedTime ?? el.currentTime, el.duration - .0001)) : el.currentTime;
  emit("updateValues", { [key]: time });
}
async function inspect() {
  const el = video.value;
  if (!el || inspecting.value || el.readyState < 2 || el.seeking) return;
  el.pause(); resetDetection();
  const controller = inspecting.value = new AbortController();
  try {
    const v = props.values;
    const area = { x: Number(v.x), y: Number(v.y), width: Number(v.width), height: Number(v.height) };
    if (repairing.value) {
      const directory = getDirectory();
      if (!directory) throw new Error("请先选择工作目录");
      const time = Math.max(0, Math.min(presentedTime ?? el.currentTime, el.duration - .0001));
      const response = await requestMediaModel("/api/localModels/previewSubtitles", { directory, source: props.source.url, time, ...area }, controller.signal);
      controller.signal.throwIfAborted();
      if (response.status === 204) {
        detectionStatus.value = translate("这一帧没找到字幕。请停在有字幕的画面，或调整选区。");
        return;
      }
      const blob = await response.blob();
      controller.signal.throwIfAborted();
      if (blob.type !== "image/png") throw new Error("视频帧读取失败");
      repairedUrl.value = URL.createObjectURL(blob);
      showRepair.value = true;
      return;
    }
    const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / Math.max(el.videoWidth, el.videoHeight));
    canvas.width = Math.max(1, Math.round(el.videoWidth * scale)); canvas.height = Math.max(1, Math.round(el.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法读取视频画面");
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lines = await detectSubtitleLines(source.data, canvas.width, canvas.height, area, model.run, controller.signal, 4);
    controller.signal.throwIfAborted();
    boxes.value = lines.map(r => ({ x: r.x / scale, y: r.y / scale, w: r.w / scale, h: r.h / scale }));
    detectionStatus.value = lines.length ? `检测到 ${lines.length} 处文字` : "这帧的选区中未检测到文字";
  } catch (error) { if (!controller.signal.aborted) detectionStatus.value = error instanceof Error ? error.message : "检测失败"; }
  finally { if (inspecting.value === controller) inspecting.value = undefined; }
}
watch(() => [props.values.x, props.values.y, props.values.width, props.values.height], resetDetection);
watch(() => [props.src, props.source.url, getDirectory()], () => { resetDetection(); referenceFrame.value = undefined; });
const playhead = ref(0);
watch(video, (el, _, cleanup) => {
  presentedTime = undefined;
  const readPlayhead = () => { if (props.tool.id === "patchGoodFrame") playhead.value = el?.currentTime ?? 0; };
  readPlayhead();
  let frameId = 0;
  if (el && (repairing.value || hasReference.value) && typeof el.requestVideoFrameCallback === "function") {
    const trackFrame: VideoFrameRequestCallback = (_, metadata) => {
      if (!el.seeking) {
        presentedTime = metadata.mediaTime;
        if (props.tool.id === "patchGoodFrame") playhead.value = metadata.mediaTime;
      }
      frameId = el.requestVideoFrameCallback(trackFrame);
    };
    frameId = el.requestVideoFrameCallback(trackFrame);
  }
  const startSeek = () => { seeking.value = true; presentedTime = undefined; resetDetection(); };
  const endSeek = () => { seeking.value = false; readPlayhead(); };
  if (!el?.requestVideoFrameCallback) el?.addEventListener("timeupdate", readPlayhead);
  seeking.value = el?.seeking ?? false;
  el?.addEventListener("seeking", startSeek); el?.addEventListener("seeked", endSeek); el?.addEventListener("play", resetDetection);
  cleanup(() => {
    el?.removeEventListener("timeupdate", readPlayhead);
    if (frameId) el?.cancelVideoFrameCallback(frameId);
    el?.removeEventListener("seeking", startSeek); el?.removeEventListener("seeked", endSeek); el?.removeEventListener("play", resetDetection);
  });
});
onScopeDispose(resetDetection);
const displayScale = ref(1);
const blurId = "regionBlur" + useId().replace(/\W/g, "");
const strengthId = useId();
const cropping = computed(() => props.tool.id === "crop-video");
const masking = computed(() => props.tool.id === "pixelate-video");
const blurring = computed(() => masking.value && props.values.effect === "blur");
const margin = computed(() => props.tool.id === "remove-video-watermark" ? 2 : 0);
const strength = computed(() => Number(props.values.strength) || 12);
const region = computed(() => {
  const { width, height } = size.value;
  const values = props.values;
  if (cropping.value) {
    const { w, h } = cropSize(width, height, String(values.ratio), Number(values.scale ?? 100));
    return { x: Math.floor((width - w) * Number(values.x) / 100), y: Math.floor((height - h) * Number(values.y) / 100), w, h };
  }
  return maskRegion(width, height, { x: Number(values.x), y: Number(values.y), width: Number(values.width), height: Number(values.height) }, margin.value);
});
const showPatch = computed(() => props.tool.id !== "patchGoodFrame" ||
  (playhead.value >= Number(props.values.start) && playhead.value <= Number(props.values.end)));
const patchStyle = computed(() => {
  if (blurring.value) return { filter: `url(#${blurId})` };
  if (!hasReference.value || !region.value.w || !region.value.h) return;
  const box = region.value, edge = patchFeather(size.value.width, size.value.height, box);
  const gradient = (direction: string, start: number, end: number, length: number) =>
    `linear-gradient(to ${direction}, ${start ? "transparent" : "black"}, black ${100 * start / length}%, black ${100 - 100 * end / length}%, ${end ? "transparent" : "black"})`;
  return { maskImage: gradient("right", edge.left, edge.right, box.w) + ", " + gradient("bottom", edge.top, edge.bottom, box.h), maskComposite: "intersect" };
});
const ready = computed(() => playable.value && size.value.width >= 2 && size.value.height >= 2 && region.value.w >= 2 && region.value.h >= 2);
watch(() => ready.value && (!hasReference.value || Number(props.values.referenceTime) >= 0)
  && (props.tool.id !== "patchGoodFrame" || Number(props.values.end) > Number(props.values.start)), value => emit("ready", value), { immediate: true });
const selectionStyle = computed(() => {
  const { x, y, w, h } = region.value;
  const { width, height } = size.value;
  return { left: x / width * 100 + "%", top: y / height * 100 + "%", width: w / width * 100 + "%", height: h / height * 100 + "%" };
});

function readSize(event: Event) {
  const element = event.currentTarget as HTMLVideoElement;
  video.value = element;
  size.value = { width: element.videoWidth, height: element.videoHeight };
  if (props.tool.id === "patchGoodFrame" && Number(props.values.end) > element.duration) emit("updateValues", { end: element.duration });
}

// 限制预览采样分辨率；区域和马赛克格数始终按源帧像素计算。
function drawPatch() {
  const canvas = patch.value;
  const element = referenceFrame.value ?? video.value;
  const { x, y, w, h } = region.value;
  if (!canvas || !element || !ready.value || (element instanceof HTMLVideoElement && element.readyState < 2)) return;
  const scale = Math.min(1, displayScale.value * Math.min(2, window.devicePixelRatio || 1));
  const sampling = masking.value && !blurring.value ? Math.min(scale, 1 / strength.value) : scale;
  const destW = Math.max(1, Math.floor(w * sampling));
  const destH = Math.max(1, Math.floor(h * sampling));
  if (canvas.width !== destW) canvas.width = destW;
  if (canvas.height !== destH) canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingQuality = "high";
  const sx = referenceFrame.value ? referenceFrame.value.width / size.value.width : 1;
  const sy = referenceFrame.value ? referenceFrame.value.height / size.value.height : 1;
  ctx.drawImage(element, x * sx, y * sy, w * sx, h * sy, 0, 0, destW, destH);
}

const requestPaint = useFramePreview(computed(() => masking.value ? video.value : undefined), drawPatch);
watch([region, strength, blurring, ready, patch, displayScale, referenceFrame], requestPaint, { flush: "post" });
watch([frame, size], ([area, dimensions], _, onCleanup) => {
  if (!area || !dimensions.width) return;
  const measure = () => { displayScale.value = area.clientWidth / dimensions.width; };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(area);
  onCleanup(() => observer.disconnect());
}, { flush: "post" });

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
function percent(pixels: number, total: number) {
  return total > 0 ? Math.round(pixels / total * 10000) / 100 : 0;
}
function point(event: PointerEvent): Point {
  const rect = frame.value!.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * size.value.width / rect.width, y: (event.clientY - rect.top) * size.value.height / rect.height };
}
function updateRegion(mode: Mode, initial: Bounds, start: Point, target: Point) {
  const { width, height } = size.value;
  const dx = target.x - start.x, dy = target.y - start.y;
  if (cropping.value) {
    let { x, y, w, h } = initial;
    let scale = Number(props.values.scale ?? 100);
    if (mode === "move") { x += dx; y += dy; }
    else {
      const draw = mode === "draw";
      const left = draw ? dx < 0 : mode.endsWith("w"), top = draw ? dy < 0 : mode.startsWith("n");
      const fixedX = draw ? start.x : left ? x + w : x, fixedY = draw ? start.y : top ? y + h : y;
      const full = cropSize(width, height, String(props.values.ratio));
      const wantW = draw ? Math.abs(dx) : w + (left ? -dx : dx), wantH = draw ? Math.abs(dy) : h + (top ? -dy : dy);
      const extent = (wantW * full.w + wantH * full.h) / (full.w ** 2 + full.h ** 2);
      scale = Math.round(clamp(extent, 0.01, Math.min(1, (left ? fixedX : width - fixedX) / full.w, (top ? fixedY : height - fixedY) / full.h)) * 10000) / 100;
      const next = cropSize(width, height, String(props.values.ratio), scale);
      w = next.w; h = next.h; x = left ? fixedX - w : fixedX; y = top ? fixedY - h : fixedY;
    }
    emit("updateValues", {
      x: clamp(percent(x, width - w), 0, 100), y: clamp(percent(y, height - h), 0, 100), scale,
    });
    return;
  }
  const pad = margin.value;
  const minW = Math.max(2, width / 100), minH = Math.max(2, height / 100);
  let { x, y, w, h } = initial;
  if (mode === "move") {
    x = clamp(x + dx, pad, width - w - pad);
    y = clamp(y + dy, pad, height - h - pad);
    emit("updateValues", { x: clamp(percent(x, width), 0, 99), y: clamp(percent(y, height), 0, 99) });
    return;
  } else {
    const draw = mode === "draw";
    const left = draw ? target.x < start.x : mode.endsWith("w");
    const top = draw ? target.y < start.y : mode.startsWith("n");
    const fixedX = clamp(draw ? start.x : left ? x + w : x, left ? pad + minW : pad, left ? width - pad : width - pad - minW);
    const fixedY = clamp(draw ? start.y : top ? y + h : y, top ? pad + minH : pad, top ? height - pad : height - pad - minH);
    const endX = clamp(draw ? target.x : (left ? x : x + w) + dx, left ? pad : fixedX + minW, left ? fixedX - minW : width - pad);
    const endY = clamp(draw ? target.y : (top ? y : y + h) + dy, top ? pad : fixedY + minH, top ? fixedY - minH : height - pad);
    x = Math.min(fixedX, endX); y = Math.min(fixedY, endY);
    w = Math.abs(fixedX - endX); h = Math.abs(fixedY - endY);
  }
  emit("updateValues", { x: clamp(percent(x, width), 0, 99), y: clamp(percent(y, height), 0, 99),
    width: clamp(percent(w, width), Math.max(1, Math.ceil(20000 / width) / 100), 100),
    height: clamp(percent(h, height), Math.max(1, Math.ceil(20000 / height) / 100), 100) });
}
let drag: { pointerId: number; mode: Mode; initial: Bounds; start: Point } | undefined;
function beginDrag(event: PointerEvent) {
  if (event.button !== 0 || drag || !playable.value || !frame.value) return;
  if (props.tool.id === "trackTarget" && video.value && (video.value.currentTime > .001 || !video.value.paused)) {
    video.value.pause();
    video.value.currentTime = 0;
    return;
  }
  const target = event.target as HTMLElement;
  const corner = target.closest<HTMLElement>("[data-corner]");
  const inside = !!target.closest("[data-selection]");
  const mode = (corner?.dataset.corner as Corner | undefined) ?? (inside ? "move" : "draw");
  const start = point(event);
  const initial = { ...region.value };
  drag = { pointerId: event.pointerId, mode, initial, start };
  (corner ?? frame.value).focus({ preventScroll: true });
  frame.value.setPointerCapture(event.pointerId);
  event.preventDefault();
}
function moveDrag(event: PointerEvent) {
  if (drag?.pointerId !== event.pointerId) return;
  updateRegion(drag.mode, drag.initial, drag.start, point(event));
}
function finishDrag(event: PointerEvent) {
  if (drag?.pointerId !== event.pointerId) return;
  drag = undefined;
  if (frame.value?.hasPointerCapture(event.pointerId)) frame.value.releasePointerCapture(event.pointerId);
}
function adjustByKey(event: KeyboardEvent) {
  const directions: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
  const direction = directions[event.key];
  if (!direction || !ready.value) return;
  event.preventDefault();
  event.stopPropagation();
  const step = event.shiftKey ? 12 : 3;
  const corner = (event.target as HTMLElement).dataset.corner as Corner | undefined;
  updateRegion(corner ?? "move", region.value, { x: 0, y: 0 }, { x: direction.x * step, y: direction.y * step });
}
</script>

<style scoped lang="scss">
.regionEditor {
  display: grid;
  gap: 8px;
  min-width: 0;
  .regionFrame {
    .repairPreview { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .detectedLine { position: absolute; border: 2px solid var(--el-color-success); background: var(--el-color-success-light-9); opacity: .65; pointer-events: none; }
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    cursor: crosshair;
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    .filterDefinitions { position: absolute; pointer-events: none; }
    .selection {
      position: absolute;
      cursor: move;
      .maskPreview, .selectionOutline, .cropGrid { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .maskPreview.mosaic { image-rendering: pixelated; }
      .selectionOutline { box-sizing: border-box; border: 1px solid #fff; box-shadow: inset 0 0 0 1px #1b20288c, 0 0 0 1px #1b20288c; }
      .corner {
        position: absolute; z-index: 1; display: grid; width: min(24px, 42%); height: min(24px, 42%); padding: 0;
        border: 0; border-radius: 0; background: none;
        &::before { content: ""; width: min(9px, 100%); height: min(9px, 100%); border-radius: 2px; background: #fff; box-shadow: 0 0 0 1px #1118; }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
        &[data-corner="nw"] { left: 0; top: 0; place-items: start start; cursor: nwse-resize; }
        &[data-corner="ne"] { right: 0; top: 0; place-items: start end; cursor: nesw-resize; }
        &[data-corner="sw"] { left: 0; bottom: 0; place-items: end start; cursor: nesw-resize; }
        &[data-corner="se"] { right: 0; bottom: 0; place-items: end end; cursor: nwse-resize; }
      }
    }
    &.cropping {
      cursor: move;
      .selection { box-shadow: 0 0 0 100vmax #0009; }
      .cropGrid {
        background: linear-gradient(to right, transparent calc(33.33% - .5px), #fffa 33.33%, transparent calc(33.33% + 1px), transparent calc(66.67% - .5px), #fffa 66.67%, transparent calc(66.67% + 1px)),
          linear-gradient(to bottom, transparent calc(33.33% - .5px), #fffa 33.33%, transparent calc(33.33% + 1px), transparent calc(66.67% - .5px), #fffa 66.67%, transparent calc(66.67% + 1px));
      }
    }
  }
  .selectionInfo, .strengthControl {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: var(--el-font-size-small);
    output { flex-shrink: 0; color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; }
  }
  .selectionInfo {
    color: var(--el-text-color-secondary); flex-wrap: wrap;
    .regionOption {
      display: inline-flex; align-items: center; gap: 5px;
      svg { width: 14px; height: 14px; }
      .ratioShape { box-sizing: border-box; height: 12px; border: 1px solid currentColor; border-radius: 2px; }
    }
  }
  .strengthControl {
    label { flex-shrink: 0; }
    input { flex: 1; min-width: 0; height: 24px; accent-color: var(--el-color-primary); cursor: pointer; }
  }
}
</style>
