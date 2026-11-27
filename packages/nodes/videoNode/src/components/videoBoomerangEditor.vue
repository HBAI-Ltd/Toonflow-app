<template>
  <div class="boomerangEditor">
    <div @pointerdown.capture="stopPreview" @keydown.capture="stopPreview">
      <videoPlayer :src="src" readOnly :audioGain="0" label="往返片段预览" @loadedmetadata="metadata" @ready="ready = $event" />
    </div>
    <div class="selectionHeader">
      <strong>选择片段（最长 10 秒）</strong>
      <span>{{ from.toFixed(2) }} – {{ to.toFixed(2) }} 秒</span>
    </div>
    <div class="selectionTrack">
      <videoFilmstrip v-if="video" :src="video.currentSrc" :duration="duration" />
      <el-slider range :modelValue="[from, to]" :min="0" :max="duration || 1" :step="0.01" :disabled="!ready"
        rangeStartLabel="开始时间（秒）" rangeEndLabel="结束时间（秒）" @input="changeRange" />
    </div>
    <div class="optionsRow">
      <label>开始（秒）
        <el-input-number :modelValue="from" :min="0" :max="Math.max(0, duration - 0.01)" :step="0.01" :precision="2" size="small" controlsPosition="right"
          aria-label="精确开始时间（秒）" @update:modelValue="value => value !== undefined && changeRange([value, Math.max(value + 0.01, to)])" />
      </label>
      <label>结束（秒）
        <el-input-number :modelValue="to" :min="0.01" :max="Math.max(0.01, duration)" :step="0.01" :precision="2" size="small" controlsPosition="right"
          aria-label="精确结束时间（秒）" @update:modelValue="value => value !== undefined && changeRange([Math.min(from, value - 0.01), value])" />
      </label>
    </div>
    <div class="optionsRow">
      <label>播放倍速
        <el-input-number :modelValue="speed" :min="0.5" :max="2" :step="0.25" size="small" controlsPosition="right" aria-label="播放倍速"
          @update:modelValue="value => emit('updateValues', { speed: value ?? '' })" />
      </label>
      <label>往返次数
        <el-input-number :modelValue="Number(values.repeats) || undefined" :min="1" :max="10" :precision="0" size="small" controlsPosition="right" aria-label="往返次数"
          @update:modelValue="value => emit('updateValues', { repeats: value ?? '' })" />
      </label>
    </div>
    <div class="previewRow">
      <el-button size="small" :disabled="!canRun" :aria-pressed="playing" @click="togglePreview">{{ playing ? '停止预览' : '预览往返' }}</el-button>
      <span>静音成片 · {{ outputDuration.toFixed(2) }} 秒</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton, ElInputNumber, ElSlider } from "element-plus";
import videoPlayer from "./videoPlayer.vue";
import videoFilmstrip from "./videoFilmstrip.vue";

const props = defineProps<{ src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const video = shallowRef<HTMLVideoElement>();
const duration = ref(0);
const ready = ref(false), playing = ref(false);
const from = computed(() => Number(props.values.start) || 0);
const to = computed(() => Math.min(duration.value, Number(props.values.end) || 0));
const speed = computed(() => Number(props.values.speed) || 1);
const outputDuration = computed(() => 2 * (to.value - from.value) * (Number(props.values.repeats) || 1) / speed.value);
const canRun = computed(() => ready.value && Math.round((to.value - from.value) * 24 / speed.value) >= 1);
watch(canRun, value => emit("ready", value), { immediate: true });
let frame = 0;
function metadata(event: Event) {
  const el = event.target as HTMLVideoElement;
  video.value = el;
  duration.value = Number.isFinite(el.duration) ? Math.floor(el.duration * 100) / 100 : 0;
  if (duration.value < Number(props.values.end)) emit("updateValues", { end: duration.value });
}
function stopPreview() {
  cancelAnimationFrame(frame);
  playing.value = false;
}
watch([from, to, speed, () => props.values.repeats, () => props.src], stopPreview);
onScopeDispose(stopPreview);
function changeRange(value: number | number[]) {
  if (!Array.isArray(value) || !video.value) return;
  let [start = 0, end = 0] = value;
  const movingStart = Math.abs(start - from.value) > Math.abs(end - to.value);
  if (movingStart) end = Math.min(start + 10, end);
  else start = Math.max(start, end - 10);
  start = Number(start.toFixed(2));
  end = Number(end.toFixed(2));
  emit("updateValues", { start, end });
  video.value.pause();
  video.value.currentTime = movingStart ? start : Math.max(start, Math.min(end, duration.value - 0.001));
}
function togglePreview() {
  if (playing.value) { stopPreview(); return; }
  const el = video.value;
  if (!el || !canRun.value) return;
  el.pause();
  playing.value = true;
  const started = performance.now();
  const length = to.value - from.value;
  const step = (now: number) => {
    const elapsed = (now - started) / 1000;
    if (elapsed >= outputDuration.value) { el.currentTime = from.value; stopPreview(); return; }
    const position = elapsed * speed.value % (2 * length);
    if (!el.seeking) el.currentTime = Math.min(duration.value - 0.001, from.value + Math.min(position, 2 * length - position));
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}
</script>

<style scoped lang="scss">
.boomerangEditor {
  display: grid; gap: 10px;
  .selectionHeader, .optionsRow, .previewRow { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
  .selectionHeader { strong { font-weight: 500; } span { font-variant-numeric: tabular-nums; } }
  .selectionTrack {
    position: relative; height: 40px; margin-inline: 10px;
    .el-slider { position: absolute; inset: 0; width: 100%; height: 100%; }
    :deep(.el-slider__runway) { background-color: var(--el-overlay-color-light); }
  }
  .optionsRow { label { display: flex; align-items: center; gap: 6px; } .el-input-number { width: 90px; } }
  .previewRow span { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
}
</style>
