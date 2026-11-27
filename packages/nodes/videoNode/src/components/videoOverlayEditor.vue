<template>
  <div class="overlayEditor">
    <videoPlayer :src="src" label="视频合成预览" readOnly :class="{ splitPreview: split, stacked }" @loadedmetadata="readFrame" @ready="playable = $event">
      <template #frameOverlay>
        <video v-if="split && layerSrc" :key="layerSrc" ref="secondVideo" class="splitLayer" :src="layerSrc" playsinline preload="auto"
          aria-hidden="true" @loadeddata="loadLayer" @error="handleError" />
        <div v-else-if="!split" ref="stage" class="overlayStage nodrag nopan" :class="{ dragging: !!drag, playing }" @pointerdown="beginDrag"
          @pointermove="moveDrag" @pointerup="finishDrag" @pointercancel="finishDrag" @lostpointercapture="finishDrag">
          <div ref="layerElement" class="layer" :class="{ shown: layerVisible }" :style="layerStyle" :tabindex="layerVisible ? 0 : -1"
            role="group" aria-label="叠加图层，使用方向键移动" @keydown="moveByKey">
            <canvas v-if="textTool" ref="textCanvas" aria-label="叠加文字预览" />
            <video v-else-if="pip && layerSrc" :key="layerSrc" ref="secondVideo" :src="layerSrc" playsinline preload="auto" draggable="false"
              @loadeddata="loadLayer" @error="handleError" />
            <img v-else-if="layerSrc" :key="layerSrc" :src="layerSrc" alt="叠加照片" draggable="false" @load="loadLayer" @error="handleError" />
            <span v-if="layerVisible" class="scaleHandle" data-scale :data-horizontal="handleLeft ? 'left' : 'right'"
              :data-vertical="handleTop ? 'top' : 'bottom'" aria-hidden="true" />
          </div>
          <button v-for="(label, key) in positions" :key="key" type="button" class="positionTarget" :data-position="key"
            :aria-label="'放在' + label" :aria-pressed="values.position === key" :title="label" @click.stop="selectPreset($event, key)">
            <span aria-hidden="true" />
          </button>
        </div>
      </template>
    </videoPlayer>
    <p v-if="sourceError || previewError || preparing || !split" class="placementHint">{{ sourceError || previewError || (preparing ? '正在生成图层预览…' : '拖动图层移动，拖动边角缩放，点击圆点快速对齐') }}</p>
    <el-radio-group v-if="split" :modelValue="values.layout" aria-label="排列方向" @change="value => emit('updateValues', { layout: String(value) })">
      <el-radio-button value="horizontal"><span class="layoutOption"><icon-layout-columns aria-hidden="true" />左右</span></el-radio-button>
      <el-radio-button value="vertical"><span class="layoutOption"><icon-layout-rows aria-hidden="true" />上下</span></el-radio-button>
    </el-radio-group>
    <template v-if="textTool">
      <label :for="formId + 'text'">文字内容</label>
      <el-input :id="formId + 'text'" :modelValue="String(values.text)" type="textarea" :rows="2" aria-label="文字内容"
        @update:modelValue="text => emit('updateValues', { text })" />
    </template>
    <div v-if="!split" class="scaleControl">
      <label :for="formId + 'scale'">{{ textTool ? '字号' : '图层宽度' }}</label>
      <input :id="formId + 'scale'" type="range" :min="textTool ? 8 : 5" :max="textTool ? 300 : 100" :value="scaleValue"
        @input="setScale(Number(($event.target as HTMLInputElement).value))" />
      <output>{{ scaleValue }} {{ textTool ? 'px' : '%' }}</output>
      <label v-if="textTool" class="colorControl">字色<input type="color" :value="String(values.color)" aria-label="文字颜色"
        @input="emit('updateValues', { color: ($event.target as HTMLInputElement).value })" /></label>
    </div>
    <label v-if="pip" class="audioControl">
      <input type="checkbox" :checked="values.audio === 'mix'" @change="emit('updateValues', { audio: ($event.target as HTMLInputElement).checked ? 'mix' : 'source' })" /> 混合画中画声音
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from "vue";
import { ElInput, ElRadioButton, ElRadioGroup } from "element-plus";
import { IconLayoutColumns, IconLayoutRows } from "@tabler/icons-vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import { drawOverlayText, layerOffset } from "../videoOverlay";
import { useMediaToolAttachment } from "@toonflow/node-shared/useMediaToolAttachment";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number>; attachments?: MediaToolAttachment[] }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const formId = useId();
const positions = { topLeft: "左上", topRight: "右上", center: "居中", bottomLeft: "左下", bottomRight: "右下" };
type Position = keyof typeof positions;
const stage = ref<HTMLDivElement>();
const layerElement = ref<HTMLDivElement>();
const textCanvas = ref<HTMLCanvasElement>();
const master = shallowRef<HTMLVideoElement>();
const secondVideo = ref<HTMLVideoElement>();
const frameSize = ref({ w: 0, h: 0 });
const mediaSize = ref({ w: 0, h: 0 });
const playable = ref(false);
const playing = ref(false);
const pastLayer = ref(false);
const textTool = computed(() => props.tool.id === "add-text-to-video");
const pip = computed(() => props.tool.id === "picture-in-picture");
const split = computed(() => props.tool.id === "split-screen-video");
const stacked = computed(() => split.value && props.values.layout === "vertical");
const position = computed(() => String(props.values.position));
const scaleValue = computed(() => Number(textTool.value ? props.values.size : props.values.scale));
const positionX = computed(() => Number(props.values.positionX ?? 50));
const positionY = computed(() => Number(props.values.positionY ?? 50));
const handleLeft = computed(() => position.value === "custom" ? positionX.value > 50 : position.value.endsWith("Right"));
const handleTop = computed(() => position.value === "custom" ? positionY.value > 50 : position.value.startsWith("bottom"));
const { src: attachmentSrc, error: sourceError } = useMediaToolAttachment(() => props.attachments?.[0]);
const { src: layerSrc, preparing, error: previewError, handleLoaded, handleError } = useMediaPreview(attachmentSrc, () => pip.value || split.value ? "video" : "image");
watch(layerSrc, () => { mediaSize.value = { w: 0, h: 0 }; pastLayer.value = false; }, { flush: "sync" });
function readFrame(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  master.value = video;
  frameSize.value = { w: video.videoWidth, h: video.videoHeight };
}
function loadLayer(event: Event) {
  if (!handleLoaded(event)) return;
  const target = event.currentTarget as HTMLImageElement | HTMLVideoElement;
  mediaSize.value = target instanceof HTMLVideoElement ? { w: target.videoWidth, h: target.videoHeight } : { w: target.naturalWidth, h: target.naturalHeight };
}
watch([textCanvas, () => props.values.text, () => props.values.size, () => props.values.color, frameSize], () => {
  const canvas = textCanvas.value;
  if (!canvas || !frameSize.value.w) return;
  drawOverlayText(canvas, String(props.values.text), scaleValue.value, String(props.values.color), frameSize.value.w, frameSize.value.h);
  mediaSize.value = { w: canvas.width, h: canvas.height };
}, { flush: "post" });
const ready = computed(() => playable.value && !sourceError.value && !previewError.value && mediaSize.value.w > 0
  && (textTool.value ? !!String(props.values.text).trim() : !!layerSrc.value));
watch(ready, v => emit("ready", v), { immediate: true });
const layerVisible = computed(() => ready.value && !pastLayer.value);
const layerSize = computed(() => {
  if (textTool.value) return mediaSize.value;
  const w = Math.max(2, 2 * Math.floor(frameSize.value.w * scaleValue.value / 200));
  return { w, h: Math.max(2, 2 * Math.round(w * mediaSize.value.h / Math.max(1, mediaSize.value.w) / 2)) };
});
const offset = computed(() => layerOffset(position.value, frameSize.value.w, frameSize.value.h, layerSize.value.w, layerSize.value.h, positionX.value, positionY.value));
const layerStyle = computed(() => {
  const { w: width, h: height } = frameSize.value, { w, h } = layerSize.value;
  if (!width || !height) return {};
  return { left: offset.value.x / width * 100 + "%", top: offset.value.y / height * 100 + "%", width: w / width * 100 + "%", height: h / height * 100 + "%" };
});

watch([master, secondVideo, () => props.values.audio, mediaSize], ([video, layer], _, cleanup) => {
  if (!video) return;
  function sync(event?: Event) {
    if (!video) return;
    playing.value = !video.paused && !video.ended;
    if (!layer || !Number.isFinite(layer.duration) || layer.readyState < 2) return;
    if (split.value && video.currentTime >= layer.duration) {
      if (event?.type === "play") video.currentTime = 0;
      else {
        video.pause();
        if (video.currentTime > layer.duration) video.currentTime = layer.duration;
      }
    }
    const time = Math.min(video.currentTime, layer.duration);
    pastLayer.value = video.currentTime >= layer.duration;
    if (Math.abs(time - layer.currentTime) > (playing.value && event?.type === "timeupdate" ? 0.15 : 0.035)) layer.currentTime = time;
    layer.muted = (!split.value && props.values.audio !== "mix") || video.muted;
    layer.volume = video.volume;
    layer.playbackRate = video.playbackRate;
    if (!playing.value || pastLayer.value || video.seeking) layer.pause();
    else if (layer.paused) void layer.play().catch(() => { /* 浏览器限制第二路播放时，时间更新仍会同步画面。 */ });
  }
  const events = ["play", "pause", "ended", "seeking", "seeked", "timeupdate", "volumechange", "ratechange"];
  events.forEach(type => video.addEventListener(type, sync));
  sync();
  cleanup(() => { events.forEach(type => video.removeEventListener(type, sync)); layer?.pause(); });
});

type Drag = { id: number; x: number; y: number; offsetX: number; offsetY: number; startScale: number; layerWidth: number; scaling: boolean; left: boolean; fromPreset: boolean };
const drag = shallowRef<Drag>();
let ignorePresetClick = false;
function selectPreset(event: MouseEvent, key: Position) {
  if (event.detail === 0 || !ignorePresetClick) emit("updateValues", { position: key });
  ignorePresetClick = false;
}
function setFreePosition(x: number, y: number) {
  function percent(value: number, available: number, previous: number) {
    return available ? Math.round(Math.max(0, Math.min(1, value / available)) * 10000) / 100 : previous;
  }
  emit("updateValues", { position: "custom", positionX: percent(x, frameSize.value.w - layerSize.value.w, positionX.value),
    positionY: percent(y, frameSize.value.h - layerSize.value.h, positionY.value) });
}
function moveByKey(event: KeyboardEvent) {
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const direction = arrows[event.key];
  if (!direction || !layerVisible.value) return;
  event.preventDefault();
  event.stopPropagation();
  const step = event.shiftKey ? 10 : 1;
  setFreePosition(offset.value.x + direction[0] * step, offset.value.y + direction[1] * step);
}
function setScale(value: number) {
  emit("updateValues", { [textTool.value ? "size" : "scale"]: Math.max(textTool.value ? 8 : 5, Math.min(textTool.value ? 300 : 100, Math.round(value))) });
}
function beginDrag(event: PointerEvent) {
  if (event.button !== 0 || drag.value || !layerVisible.value || !stage.value || !layerElement.value) return;
  const target = event.target as HTMLElement;
  const preset = target.closest("button");
  ignorePresetClick = false;
  const box = stage.value.getBoundingClientRect();
  const layer = layerElement.value.getBoundingClientRect();
  const inside = event.clientX >= layer.left && event.clientX <= layer.right && event.clientY >= layer.top && event.clientY <= layer.bottom;
  if (preset && !inside) return;
  const offsetX = inside ? offset.value.x : (event.clientX - box.left) * frameSize.value.w / box.width - layerSize.value.w / 2;
  const offsetY = inside ? offset.value.y : (event.clientY - box.top) * frameSize.value.h / box.height - layerSize.value.h / 2;
  drag.value = { id: event.pointerId, x: event.clientX, y: event.clientY, startScale: scaleValue.value,
    offsetX, offsetY, layerWidth: Math.max(1, layer.width), scaling: !!target.closest("[data-scale]"), left: handleLeft.value, fromPreset: !!preset };
  (preset ?? stage.value).setPointerCapture(event.pointerId);
  layerElement.value.focus({ preventScroll: true });
  event.preventDefault();
  if (!inside) setFreePosition(offsetX, offsetY);
}
function moveDrag(event: PointerEvent) {
  const active = drag.value;
  if (!active || active.id !== event.pointerId || !stage.value) return;
  if (active.scaling) {
    const dx = (event.clientX - active.x) * (active.left ? -1 : 1);
    setScale(active.startScale * (1 + dx / active.layerWidth));
    return;
  }
  const box = stage.value.getBoundingClientRect();
  const dx = event.clientX - active.x, dy = event.clientY - active.y;
  if (active.fromPreset && !ignorePresetClick) {
    if (Math.hypot(dx, dy) < 3) return;
    ignorePresetClick = true;
  }
  setFreePosition(active.offsetX + dx * frameSize.value.w / box.width, active.offsetY + dy * frameSize.value.h / box.height);
}
function finishDrag(event: PointerEvent) {
  if (drag.value?.id !== event.pointerId) return;
  drag.value = undefined;
  if (stage.value?.hasPointerCapture(event.pointerId)) stage.value.releasePointerCapture(event.pointerId);
}
</script>

<style scoped lang="scss">
.overlayEditor {
  display: grid; gap: 8px; min-width: 0; font-size: var(--el-font-size-small);
  .splitPreview {
    --layoutFactor: 2;
    :deep(.videoPreview), :deep(.overlayViewport) {
      width: min(100%, calc(var(--frameMaxHeight) * var(--frameAspect) * var(--layoutFactor)));
      aspect-ratio: calc(var(--frameAspect) * var(--layoutFactor));
    }
    :deep(.videoPreview) { object-fit: contain; object-position: left top; background: #000; }
    .splitLayer { position: absolute; right: 0; bottom: 0; width: 50%; height: 100%; object-fit: contain; background: #000; }
    &.stacked {
      --layoutFactor: 0.5;
      .splitLayer { width: 100%; height: 50%; }
    }
  }
  .layoutOption { display: inline-flex; align-items: center; gap: 5px; svg { width: 16px; height: 16px; } }
  .overlayStage {
    position: absolute; inset: 0; overflow: hidden; touch-action: none; user-select: none;
    .layer {
      position: absolute; opacity: 0; pointer-events: none;
      &.shown { opacity: 1; pointer-events: auto; cursor: grab; }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      canvas, video, img { display: block; width: 100%; height: 100%; pointer-events: none; }
      .scaleHandle {
        position: absolute; display: grid; width: min(24px, 40%); height: min(24px, 40%);
        &[data-horizontal="left"] { left: 0; justify-items: start; }
        &[data-horizontal="right"] { right: 0; justify-items: end; }
        &[data-vertical="top"] { top: 0; align-items: start; cursor: nesw-resize; }
        &[data-vertical="bottom"] { bottom: 0; align-items: end; cursor: nwse-resize; }
        &[data-horizontal="left"][data-vertical="top"] { cursor: nwse-resize; }
        &[data-horizontal="left"][data-vertical="bottom"] { cursor: nesw-resize; }
        &::after { content: ""; width: 8px; height: 8px; background: white; border: 1px solid #1119; border-radius: 2px; }
      }
    }
    .positionTarget {
      position: absolute; display: grid; width: 26px; height: 26px; padding: 0; place-items: center;
      border: 0; background: transparent; cursor: pointer;
      &[data-position="topLeft"] { left: 0; top: 0; }
      &[data-position="topRight"] { right: 0; top: 0; }
      &[data-position="bottomLeft"] { left: 0; bottom: 0; }
      &[data-position="bottomRight"] { right: 0; bottom: 0; }
      &[data-position="center"] { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      span { width: 9px; height: 9px; border-radius: 50%; background: #15181bbc; border: 1.5px solid white; box-shadow: 0 1px 3px #000a; }
      &[aria-pressed="true"] span { background: var(--el-color-primary); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    }
    &.dragging .layer { cursor: grabbing; }
    &:hover .layer.shown, &:focus-within .layer.shown, &.dragging .layer.shown { outline: 1px solid white; }
    &.playing:not(:hover):not(:focus-within) { .scaleHandle, .positionTarget { visibility: hidden; } }
  }
  .placementHint { margin: 0; color: var(--el-text-color-secondary); }
  .scaleControl, .colorControl, .audioControl { display: flex; align-items: center; gap: 8px; }
  .scaleControl {
    output { white-space: nowrap; font-variant-numeric: tabular-nums; }
    input[type="range"] { flex: 1; min-width: 0; accent-color: var(--el-color-primary); cursor: pointer; }
    input[type="color"] { width: 28px; height: 24px; border: 0; background: none; padding: 0; cursor: pointer; }
  }
}
</style>
