<template>
  <section class="chromaEditor">
    <videoPlayer :src="src" readOnly label="绿幕抠像预览" @loadedmetadata="readVideo" @ready="playable = $event">
      <template #frameOverlay>
        <div v-show="!picking" class="compositeFrame" :style="{ backgroundColor: attachments.length ? '#000' : String(values.background) }">
          <img v-if="backgroundSrc" :src="backgroundSrc" alt="" @load="readBackground" @error="handleError" />
          <canvas ref="foreground" aria-hidden="true" />
        </div>
        <button v-if="picking" class="sampleFrame" type="button" aria-label="在原片中点击要去除的颜色，按回车选取中央颜色" @click="sampleColor" />
      </template>
    </videoPlayer>
    <div class="colorChoices">
      <label>要去掉的颜色 <input type="color" :value="values.key" @input="setColor('key', $event)" /></label>
      <el-button size="small" :icon="IconColorPicker" :aria-pressed="picking" :disabled="!playable" @click="togglePicker">
        {{ picking ? '取消取色' : '从画面取色' }}
      </el-button>
      <label v-if="!attachments.length">背景颜色 <input type="color" :value="values.background" @input="setColor('background', $event)" /></label>
    </div>
    <span v-if="picking" class="pickHint" role="status">点击原片中要去除的颜色</span>
    <label class="tolerance">去除相近颜色的范围
      <input type="range" min="0.01" max="1" step="0.01" :value="values.similarity"
        @input="emit('updateValues', { similarity: Number(($event.target as HTMLInputElement).value) })" />
      <output>{{ Math.round(Number(values.similarity) * 100) }}%</output>
    </label>
    <span v-if="error" class="chromaError" role="alert">{{ error }}</span>
    <label class="tolerance">减轻边缘绿光
      <input type="range" min="0" max="1" step="0.01" :value="values.despill" @input="emit('updateValues', { despill: Number(($event.target as HTMLInputElement).value) })" />
      <output>{{ Math.round(Number(values.despill) * 100) }}%</output>
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import { IconColorPicker } from "@tabler/icons-vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import { useMediaToolAttachment } from "@toonflow/node-shared/useMediaToolAttachment";
import { useFramePreview } from "../useFramePreview";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number>; attachments: MediaToolAttachment[] }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const video = shallowRef<HTMLVideoElement>();
const foreground = ref<HTMLCanvasElement>();
const playable = ref(false);
const picking = ref(false);
const painted = ref(false);
const backgroundLoaded = ref(false);
const paintError = ref("");
const { src: backgroundFile, error: fileError } = useMediaToolAttachment(() => props.attachments[0]);
const { src: backgroundSrc, error: imageError, handleError, handleLoaded } = useMediaPreview(backgroundFile, "image");
const error = computed(() => paintError.value || fileError.value || imageError.value);
const canApply = computed(() => playable.value && painted.value && !error.value && (!props.attachments.length || backgroundLoaded.value));
watch(canApply, value => emit("ready", value), { immediate: true });
watch(backgroundSrc, () => { backgroundLoaded.value = false; }, { flush: "sync" });

function readVideo(event: Event) {
  video.value = event.currentTarget as HTMLVideoElement;
  painted.value = false;
  paintError.value = "";
}
function readBackground(event: Event) { backgroundLoaded.value = handleLoaded(event); }
function setColor(field: "key" | "background", event: Event) {
  picking.value = false;
  emit("updateValues", { [field]: (event.target as HTMLInputElement).value });
}
function togglePicker() {
  if (!picking.value) video.value?.pause();
  picking.value = !picking.value;
}
function sampleColor(event: MouseEvent) {
  const element = video.value;
  if (!element) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.detail ? (event.clientX - rect.left) / rect.width : 0.5;
  const y = event.detail ? (event.clientY - rect.top) / rect.height : 0.5;
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const ctx = pixel.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(element, Math.min(element.videoWidth - 1, Math.floor(x * element.videoWidth)), Math.min(element.videoHeight - 1, Math.floor(y * element.videoHeight)), 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  emit("updateValues", { key: "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("") });
  picking.value = false;
}

function drawForeground() {
  const canvas = foreground.value, element = video.value;
  if (!canvas || !element || !playable.value || picking.value || paintError.value) return;
  // ACT: 交互预览最长边限制为 576 像素；成片仍由 FFmpeg 按原分辨率处理。
  const scale = Math.min(1, 576 / Math.max(element.videoWidth, element.videoHeight));
  const width = Math.max(1, Math.round(element.videoWidth * scale)), height = Math.max(1, Math.round(element.videoHeight * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) { paintError.value = "无法预览抠像效果"; return; }
  try {
    ctx.drawImage(element, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    const data = pixels.data;
    const key = Number.parseInt(String(props.values.key).slice(1), 16);
    const kr = key >> 16, kg = (key >> 8) & 255, kb = key & 255;
    const tolerance = Number(props.values.similarity);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] - kr, g = data[i + 1] - kg, b = data[i + 2] - kb;
      const du = -0.148 * r - 0.291 * g + 0.439 * b, dv = 0.439 * r - 0.368 * g - 0.071 * b;
      const distance = Math.sqrt((du * du + dv * dv) / 2) / 255;
      data[i + 3] = 255 * Math.max(0, Math.min(1, (distance - tolerance) / 0.06));
      const excess = Math.max(0, data[i + 1]! - (data[i]! + data[i + 2]!) / 2);
      data[i + 1] = data[i + 1]! - excess * (Number(props.values.despill) || 0);
    }
    ctx.putImageData(pixels, 0, 0);
    painted.value = true;
  } catch { paintError.value = "无法读取视频画面以预览抠像"; }
}
const refresh = useFramePreview(video, drawForeground);
watch([foreground, playable, picking, () => props.values.key, () => props.values.similarity, () => props.values.despill], refresh, { flush: "post" });
</script>

<style scoped lang="scss">
.chromaEditor {
  display: grid; gap: 12px;
  .compositeFrame, .sampleFrame {
    position: absolute; inset: 0; overflow: hidden;
    canvas, img { position: absolute; inset: 0; width: 100%; height: 100%; }
    img { object-fit: contain; }
  }
  .sampleFrame { padding: 0; border: 0; background: transparent; cursor: crosshair; }
  .colorChoices {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px;
    label { display: inline-flex; align-items: center; gap: 6px; }
    input { width: 32px; height: 24px; padding: 1px; border: 1px solid var(--el-border-color); border-radius: 4px; background: none; cursor: pointer; }
  }
  .tolerance {
    display: flex; align-items: center; gap: 10px;
    input { flex: 1; min-width: 44px; accent-color: var(--el-color-primary); }
    output { min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
  }
  .pickHint { color: var(--el-text-color-secondary); }
  .chromaError { color: var(--el-color-danger); }
}
</style>
