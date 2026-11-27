<template>
  <div class="cadenceEditor">
    <videoPlayer :src="src" readOnly label="抽帧动画预览" @loadedmetadata="video = $event.target as HTMLVideoElement" @ready="emit('ready', $event)">
      <template #frameOverlay><canvas ref="preview" aria-label="抽帧后的画面" /></template>
    </videoPlayer>
    <div class="cadenceControls">
      <label :for="fieldId">每秒保留画面数</label>
      <el-button-group>
        <el-button v-for="rate in [4, 6, 8, 12]" :key="rate" size="small" :type="cadence === rate ? 'primary' : 'default'" :aria-pressed="cadence === rate"
          @click="emit('updateValues', { cadence: rate })">{{ rate }}</el-button>
      </el-button-group>
      <el-input-number :id="fieldId" :modelValue="Number(values.cadence) || undefined" :min="1" :max="24" :precision="0" size="small" controlsPosition="right"
        aria-label="每秒保留画面数" @update:modelValue="value => emit('updateValues', { cadence: value ?? '' })" />
    </div>
    <span class="outputInfo">输出 24 帧/秒，保留原片时长和声音。</span>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, watch } from "vue";
import { ElButton, ElButtonGroup, ElInputNumber } from "element-plus";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const fieldId = useId();
const cadence = computed(() => Number(props.values.cadence) || 6);
const preview = shallowRef<HTMLCanvasElement>();
const video = shallowRef<HTMLVideoElement>();

watch([video, preview, cadence], ([source, canvas, rate], _, onCleanup) => {
  if (!source || !canvas || !source.videoWidth) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = Math.min(1, 960 / Math.max(source.videoWidth, source.videoHeight));
  canvas.width = Math.max(1, Math.round(source.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(source.videoHeight * scale));
  let last = -1, frame = 0;
  const draw = () => {
    cancelAnimationFrame(frame);
    const step = Math.floor(source.currentTime * rate);
    if (source.readyState >= 2 && (step !== last || source.paused)) {
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      last = step;
    }
    if (!source.paused && !source.ended) frame = requestAnimationFrame(draw);
  };
  draw();
  source.addEventListener("play", draw);
  source.addEventListener("loadeddata", draw);
  source.addEventListener("seeked", draw);
  onCleanup(() => {
    cancelAnimationFrame(frame);
    source.removeEventListener("play", draw);
    source.removeEventListener("loadeddata", draw);
    source.removeEventListener("seeked", draw);
  });
}, { flush: "post" });
</script>

<style scoped lang="scss">
.cadenceEditor {
  display: grid; gap: 10px;
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .cadenceControls {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    label { flex: 1 1 auto; color: var(--el-text-color-regular); font-size: 13px; }
    .el-input-number { width: 90px; }
  }
  .outputInfo { color: var(--el-text-color-secondary); font-size: 12px; }
}
</style>
