<template>
  <section class="timeEditor nodrag nopan nowheel">
    <videoPlayer :src="src" :readOnly="true" :audioGain="isFade ? fadeGain : undefined" label="视频时间线预览" @loadedmetadata="readMetadata" @ready="playerReady = $event">
      <template #frameOverlay>
        <div v-if="isFade" class="fadeOverlay" :style="{ opacity: 1 - fadeGain }" />
      </template>
    </videoPlayer>
    <div v-if="isSpeed" class="parameterRow">
      <div class="rowHeader"><strong>播放倍速</strong><output>{{ speed }}×</output></div>
      <el-button-group>
        <el-button v-for="rate in [0.5, 1, 1.5, 2]" :key="rate" size="small" :type="speed === rate ? 'primary' : 'default'"
          :aria-pressed="speed === rate" :disabled="!ready" @click="changeSpeed(rate)">{{ rate }}×</el-button>
      </el-button-group>
      <el-slider :modelValue="speed" :min="0.25" :max="4" :step="0.05" :disabled="!ready" aria-label="播放倍速" @input="changeSpeed" />
      <div class="ruler"><span>0.25×</span><span>结果时长 {{ formatTime(duration / speed) }}</span><span>4×</span></div>
    </div>
    <div v-else-if="isLoop" class="loopControls">
      <div class="rowHeader"><strong>播放次数</strong><span>结果时长 {{ formatTime(duration * loopCount) }}</span></div>
      <div class="holdSettings">
        <el-button-group>
          <el-button v-for="count in [2, 3, 5, 10]" :key="count" size="small" :type="values.count === count ? 'primary' : 'default'"
            :aria-pressed="values.count === count" :disabled="!ready" @click="emit('updateValues', { count })">{{ count }} 次</el-button>
        </el-button-group>
        <label class="holdExact"><el-input-number :modelValue="Number(values.count) || undefined" size="small" controlsPosition="right"
          :min="2" :max="100" :precision="0" :disabled="!ready" aria-label="自定义播放次数" @update:modelValue="value => emit('updateValues', { count: value ?? '' })" />次</label>
      </div>
      <div class="loopTrack" :style="{ '--passWidth': 100 / loopCount + '%', '--progress': (duration ? loopTime / (duration * loopCount) * 100 : 0) + '%' }">
        <div v-if="loopCount <= 10" class="loopLabels" aria-hidden="true"><span v-for="pass in loopCount" :key="pass">{{ pass }}</span></div>
        <span class="loopCursor" aria-hidden="true" />
        <input type="range" min="0" :max="duration * loopCount || 1" step="0.01" :value="loopTime" :disabled="!ready" aria-label="循环成片时间轴"
          :aria-valuetext="`第 ${loopPass} 遍，成片位置 ${formatTime(loopTime)}`" @input="seekLoop" />
      </div>
      <div class="ruler"><span>第 {{ loopPass }} / {{ loopCount }} 遍</span><span>{{ formatTime(loopTime) }} / {{ formatTime(duration * loopCount) }}</span></div>
    </div>
    <template v-else>
      <div v-if="isFade && direction?.options" class="rowHeader">
        <strong>{{ translate(direction.label) }}</strong>
        <el-radio-group :modelValue="values.mode" size="small" :aria-label="translate(direction.label)"
          @change="value => emit('updateValues', { mode: String(value) })">
          <el-radio-button v-for="option in direction.options" :key="option.value" :value="option.value">
            <span class="fadeOption"><i :data-mode="option.value" aria-hidden="true" />{{ translate(option.label) }}</span>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="isSplit" class="splitSettings">
        <el-radio-group :modelValue="values.splitMode" size="small" aria-label="拆分方式" @update:modelValue="value => emit('updateValues', { splitMode: String(value) })">
          <el-radio-button value="count">按段数均分</el-radio-button>
          <el-radio-button value="duration">按时长</el-radio-button>
        </el-radio-group>
        <label v-if="equalParts">片段数量
          <el-input-number :modelValue="Number(values.parts) || undefined" :min="2" :max="100" :precision="0" controlsPosition="right" size="small" aria-label="片段数量"
            @update:modelValue="value => emit('updateValues', { parts: value ?? '' })" />
        </label>
        <label v-else>每段时长（秒）
          <el-input-number :modelValue="Number(values.seconds) || undefined" :min="0.1" :max="Math.max(0.1, Math.min(duration || 86400, 86400))" :step="0.1" :precision="2"
            controlsPosition="right" size="small" aria-label="每段时长（秒）" @update:modelValue="value => emit('updateValues', { seconds: value ?? '' })" />
        </label>
      </div>
      <div class="rowHeader"><strong>{{ parameterLabel }}</strong><output>{{ parameterText }}</output></div>
      <div ref="track" class="frameTrack" @pointerdown="beginDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag">
        <videoFilmstrip :src="frameSrc" :duration="duration" />
        <div v-if="isSplit && segmentCount > 1" class="cutLines" :style="{ backgroundSize: percent(splitLength) + ' 100%' }" aria-hidden="true" />
        <div v-if="isFade && fadeIn" class="fadeBand fadeIn" :style="{ width: percent(fadeLength) }" aria-hidden="true" />
        <div v-if="isFade && fadeOut" class="fadeBand fadeOut" :style="{ width: percent(fadeLength) }" aria-hidden="true" />
        <span v-if="ready" class="playhead" :style="{ left: percent(currentTime) }" aria-hidden="true" />
        <button v-for="marker in markers" :key="marker.side" type="button" role="slider" class="marker"
          :data-side="marker.side" :style="{ left: percent(marker.time) }" :aria-label="marker.label" aria-orientation="horizontal"
          :aria-valuenow="Number(marker.time.toFixed(3))" :aria-valuemin="minimumPosition(marker.side)" :aria-valuemax="maximumPosition(marker.side)"
          :aria-valuetext="formatTime(marker.time)" :disabled="!ready" @focus="previewFadeSide(marker.side)" @keydown="keyMarker($event, marker.side)">
          <span aria-hidden="true" />
        </button>
      </div>
      <div class="ruler" aria-hidden="true"><span>{{ formatTime(0) }}</span><span>{{ formatTime(duration / 2) }}</span><span>{{ formatTime(duration) }}</span></div>
      <div v-if="isFreeze" class="holdControls">
        <div class="rowHeader"><strong>定格时长</strong><span>结果时长 {{ formatTime(duration + seconds) }}</span></div>
        <div class="holdSettings">
          <el-button-group>
            <el-button v-for="hold in [1, 2, 3, 5]" :key="hold" size="small" :type="seconds === hold ? 'primary' : 'default'"
              :aria-pressed="seconds === hold" :disabled="!ready" @click="emit('updateValues', { seconds: hold })">{{ hold }} 秒</el-button>
          </el-button-group>
          <label class="holdExact"><el-input-number :modelValue="Number(values.seconds) || undefined" size="small" controlsPosition="right"
            :min="0.1" :max="86400" :step="0.1" :precision="1" :disabled="!ready" aria-label="精确定格时长（秒）"
            @update:modelValue="value => emit('updateValues', { seconds: value ?? '' })" />秒</label>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { ElButton, ElButtonGroup, ElInputNumber, ElMessage, ElRadioButton, ElRadioGroup, ElSlider } from "element-plus";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { translate } from "@toonflow/i18n/vue";
import videoPlayer from "./videoPlayer.vue";
import videoFilmstrip from "./videoFilmstrip.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [delta: Record<string, string | number>]; ready: [value: boolean] }>();
type Side = "start" | "end";
const video = shallowRef<HTMLVideoElement>();
const track = ref<HTMLElement>();
const duration = ref(0);
const currentTime = ref(0);
const frameSrc = ref("");
const playerReady = ref(false);
const ready = computed(() => playerReady.value && duration.value > 0);
const isSplit = computed(() => props.tool.id === "split-video");
const isFreeze = computed(() => props.tool.id === "freeze-video");
const isFade = computed(() => props.tool.id === "fade-video");
const direction = computed(() => props.tool.fields?.find(field => field.key === props.tool.menuField));
const isSpeed = computed(() => props.tool.id === "speed-video");
const isLoop = computed(() => props.tool.id === "loop-video");
const loopCount = computed(() => Math.max(2, Math.min(100, Math.trunc(Number(props.values.count)) || 2)));
const loopPass = ref(1);
const loopTime = computed(() => (loopPass.value - 1) * duration.value + currentTime.value);
let loopEnded = false;
watch(loopCount, value => { loopPass.value = Math.min(loopPass.value, value); loopEnded = false; });
const seconds = computed(() => Number(props.values.seconds) || 0);
const speed = computed(() => Number(props.values.speed) || 1);
const start = computed(() => Number(props.values.start) || 0);
const fadeIn = computed(() => props.values.mode !== "out");
const fadeOut = computed(() => props.values.mode !== "in");
const fadeLimit = computed(() => duration.value / (fadeIn.value && fadeOut.value ? 2 : 1));
const fadeLength = computed(() => Math.min(fadeLimit.value, seconds.value));
const fadeGain = computed(() => {
  if (!isFade.value || !fadeLength.value) return 1;
  return Math.max(0, Math.min(1, fadeIn.value ? currentTime.value / fadeLength.value : 1,
    fadeOut.value ? (duration.value - currentTime.value) / fadeLength.value : 1));
});
const equalParts = computed(() => isSplit.value && props.values.splitMode === "count");
const splitLength = computed(() => equalParts.value ? duration.value / (Number(props.values.parts) || 2) : seconds.value);
const segmentCount = computed(() => equalParts.value ? Number(props.values.parts) || 0 : seconds.value ? Math.max(1, Math.ceil((duration.value - 0.001) / seconds.value)) : 0);
const parameterLabel = computed(() => isSplit.value ? "分段预览" : isFreeze.value ? "定格位置" : "过渡时长");
const parameterText = computed(() => isSplit.value ? `每段 ${Number(splitLength.value.toFixed(2))} 秒 · 共 ${segmentCount.value} 段`
  : isFreeze.value ? formatTime(start.value) : `${Number(fadeLength.value.toFixed(3))} 秒`);
const markers = computed<{ side: Side; time: number; label: string }[]>(() => {
  if (equalParts.value) return [];
  if (!isFade.value) return [{ side: "start", time: isFreeze.value ? start.value : Math.min(seconds.value, duration.value), label: parameterLabel.value }];
  const ends: { side: Side; time: number; label: string }[] = [];
  if (fadeIn.value) ends.push({ side: "start", time: fadeLength.value, label: "淡入结束位置" });
  if (fadeOut.value) ends.push({ side: "end", time: duration.value - fadeLength.value, label: "淡出开始位置" });
  return ends;
});
let drag: { id: number; side: Side } | undefined;

function formatTime(value: number) {
  const ticks = Math.round(Math.max(0, value) * 100);
  return `${Math.floor(ticks / 6000)}:${(ticks % 6000 / 100).toFixed(2).padStart(5, "0")}`;
}

function percent(time: number) {
  return (duration.value ? Math.max(0, Math.min(100, time / duration.value * 100)) : 0) + "%";
}

function positionLimit() {
  if (isFreeze.value) return Math.min(86400, Math.max(0, (Math.ceil(duration.value * 10) - 1) / 10));
  if (isFade.value) return Math.min(fadeLimit.value, 120);
  return Math.min(duration.value, 86400);
}

function positionFloor() {
  return Math.min(positionLimit(), isFreeze.value ? 0 : isFade.value ? 0.05 : 0.1);
}

function minimumPosition(side: Side) {
  return side === "end" ? duration.value - positionLimit() : positionFloor();
}

function maximumPosition(side: Side) {
  return side === "end" ? duration.value - positionFloor() : positionLimit();
}

function seek(time: number) {
  const el = video.value;
  if (!el || !duration.value) return;
  el.pause();
  el.currentTime = Math.max(0, Math.min(duration.value - 0.001, time));
  currentTime.value = el.currentTime;
}

function setMarker(time: number, side: Side) {
  const step = isFade.value ? 0.05 : 0.1;
  const offset = side === "end" ? duration.value - time : time;
  const bounded = Math.max(positionFloor(), Math.min(positionLimit(), Math.round(offset / step) * step));
  const value = Number(Math.max(isFreeze.value ? 0 : step, bounded).toFixed(5));
  emit("updateValues", { [isFreeze.value ? "start" : "seconds"]: value });
  // 定格取切点之前的最后一帧。调淡变长度时保留当前帧，能直接看到明暗改变。
  if (!isFade.value) seek(bounded - (isFreeze.value ? 0.0001 : 0));
}

function previewFadeSide(side: Side) {
  if (!isFade.value) return;
  const offset = side === "end" ? duration.value - currentTime.value : currentTime.value;
  if (offset <= 0 || offset >= fadeLength.value) seek(side === "end" ? duration.value - fadeLength.value / 2 : fadeLength.value / 2);
}

function pointTime(event: PointerEvent) {
  const rect = track.value!.getBoundingClientRect();
  return duration.value * (event.clientX - rect.left) / rect.width;
}

function beginDrag(event: PointerEvent) {
  if (!ready.value || event.button !== 0 || drag || !track.value?.clientWidth) return;
  const time = pointTime(event);
  if (equalParts.value) { seek(time); return; }
  const handle = (event.target as Element).closest<HTMLButtonElement>("button[data-side]");
  const side = handle?.dataset.side as Side | undefined ?? (isFade.value && fadeOut.value && (!fadeIn.value || time > duration.value / 2) ? "end" : "start");
  event.preventDefault();
  drag = { id: event.pointerId, side };
  track.value.querySelector<HTMLButtonElement>(`[data-side="${side}"]`)?.focus({ preventScroll: true });
  track.value.setPointerCapture(event.pointerId);
  setMarker(time, side);
}

function moveDrag(event: PointerEvent) {
  if (drag?.id === event.pointerId) setMarker(pointTime(event), drag.side);
}

function endDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return;
  drag = undefined;
  if (track.value?.hasPointerCapture(event.pointerId)) track.value.releasePointerCapture(event.pointerId);
}

function keyMarker(event: KeyboardEvent, side: Side) {
  const marker = markers.value.find(item => item.side === side);
  if (!marker || !ready.value) return;
  const step = event.shiftKey ? 1 : isFade.value ? 0.05 : 0.1;
  const next: Record<string, number> = { Home: minimumPosition(side), End: maximumPosition(side), ArrowLeft: marker.time - step,
    ArrowDown: marker.time - step, ArrowRight: marker.time + step, ArrowUp: marker.time + step };
  if (Object.hasOwn(next, event.key)) {
    event.preventDefault();
    setMarker(next[event.key], side);
  }
}

function changeSpeed(value: number | number[]) {
  if (typeof value === "number") emit("updateValues", { speed: value });
}

function seekLoop(event: Event) {
  if (!ready.value) return;
  const time = (event.target as HTMLInputElement).valueAsNumber;
  loopPass.value = Math.min(loopCount.value, 1 + Math.floor(time / duration.value));
  loopEnded = false;
  seek(time - (loopPass.value - 1) * duration.value);
}

function readMetadata(event: Event) {
  const el = event.target as HTMLVideoElement;
  video.value = el;
  duration.value = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
  frameSrc.value = el.currentSrc;
  if (!duration.value) return;
  if (isFreeze.value) setMarker(start.value, "start");
  if (isSplit.value && !equalParts.value && seconds.value >= duration.value) setMarker(duration.value / 2, "start");
  if (isFade.value) {
    const side = fadeIn.value ? "start" : "end";
    setMarker(side === "start" ? seconds.value : duration.value - seconds.value, side);
    previewFadeSide(side);
  }
}

watch(() => props.src, () => { playerReady.value = false; video.value = undefined; duration.value = 0; currentTime.value = 0; frameSrc.value = ""; loopPass.value = 1; loopEnded = false; });
watch(ready, value => emit("ready", value), { immediate: true });
watch([ready, () => props.values.mode], ([loaded]) => {
  if (loaded && isFade.value) previewFadeSide(fadeOut.value && (!fadeIn.value || currentTime.value > duration.value / 2) ? "end" : "start");
});
watch([video, speed], ([el, value]) => { if (el) el.playbackRate = value; });
watch(video, (el, _, onCleanup) => {
  if (!el) return;
  let frame = 0;
  function update() { currentTime.value = el!.currentTime; }
  function paint() {
    cancelAnimationFrame(frame);
    update();
    if (isFade.value && !el!.paused && !el!.ended) frame = requestAnimationFrame(paint);
  }
  function startPlayback() {
    if (loopEnded) { loopPass.value = 1; loopEnded = false; }
    paint();
  }
  async function repeatPlayback() {
    if (!isLoop.value || !el) return;
    if (loopPass.value >= loopCount.value) { loopEnded = true; return; }
    loopPass.value++;
    el.currentTime = currentTime.value = 0;
    try { await el.play(); }
    catch (error) {
      if (el.isConnected && !(error instanceof DOMException && error.name === "AbortError")) ElMessage.error("循环预览播放失败");
    }
  }
  el.addEventListener("play", startPlayback);
  el.addEventListener("ended", repeatPlayback);
  el.addEventListener("timeupdate", update);
  el.addEventListener("seeked", update);
  onCleanup(() => {
    cancelAnimationFrame(frame);
    el.removeEventListener("play", startPlayback);
    el.removeEventListener("ended", repeatPlayback);
    el.removeEventListener("timeupdate", update);
    el.removeEventListener("seeked", update);
  });
});
</script>

<style scoped lang="scss">
.timeEditor {
  display: grid; gap: 9px; min-width: 0;
  .splitSettings {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    label { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-regular); font-size: 13px; }
    .el-input-number { width: 96px; }
  }
  .fadeOverlay { position: absolute; inset: 0; pointer-events: none; background: #000; }
  .rowHeader, .ruler, .holdSettings { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .rowHeader {
    flex-wrap: wrap; font-size: 12px;
    strong { color: var(--el-text-color-regular); font-weight: 500; }
    output, span { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
    .fadeOption {
      display: inline-flex; align-items: center; gap: 5px; color: inherit;
      i {
        width: 16px; height: 11px; border: 1px solid currentColor; border-radius: 2px; background: linear-gradient(to right, #181818, #eee, #181818);
        &[data-mode="in"] { background: linear-gradient(to right, #181818, #eee); }
        &[data-mode="out"] { background: linear-gradient(to right, #eee, #181818); }
      }
    }
  }
  .frameTrack {
    position: relative; height: 48px; margin-inline: 8px;
    background: var(--el-fill-color); border-radius: 5px; touch-action: none; user-select: none; cursor: ew-resize;
    .cutLines, .fadeBand, .playhead { position: absolute; top: 0; bottom: 0; pointer-events: none; }
    .cutLines { inset-inline: 0; background-image: linear-gradient(to right, transparent calc(100% - 2px), var(--el-color-primary) 0); }
    .fadeBand { background: linear-gradient(to right, #000, transparent); }
    .fadeIn { left: 0; }
    .fadeOut { right: 0; transform: scaleX(-1); }
    .playhead { width: 1px; background: #fff; box-shadow: 0 0 2px #000; }
    .marker {
      position: absolute; top: -2px; bottom: -2px; width: 20px; padding: 0; border: 0;
      background: transparent; transform: translateX(-50%); cursor: ew-resize; touch-action: none;
      span { display: block; width: 8px; height: 100%; margin: auto; border: 1px solid #fff; box-sizing: border-box; border-radius: 4px; background: var(--el-color-primary); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; border-radius: 4px; }
    }
  }
  .ruler { font-size: 11px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
  .holdControls, .loopControls {
    display: grid; gap: 8px; padding-top: 4px;
    .holdSettings { flex-wrap: wrap; }
    .holdExact { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--el-text-color-secondary); .el-input-number { width: 92px; } }
  }
  .loopTrack {
    position: relative; height: 30px; border-radius: 4px; overflow: hidden; background-color: var(--el-fill-color);
    background-image: linear-gradient(to right, transparent calc(100% - 1px), var(--el-border-color-darker) 0);
    background-size: var(--passWidth) 100%;
    .loopLabels { position: absolute; inset: 0; display: flex; align-items: center; color: var(--el-text-color-secondary); font-size: 11px; span { flex: 1; text-align: center; } }
    .loopCursor { position: absolute; inset-block: 0; left: clamp(0px, var(--progress), calc(100% - 3px)); width: 3px; background: var(--el-color-primary); }
    input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; }
    &:focus-within { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
  }
}
</style>
