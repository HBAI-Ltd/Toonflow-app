<template>
  <div class="portraitEditor">
    <videoPlayer :src="src" readOnly label="原始人像视频" @loadedmetadata="loaded" @ready="emit('ready', $event)">
      <template #frameOverlay><canvas v-show="show && sample" ref="canvas" aria-label="人像抠像预览" /></template>
    </videoPlayer>
    <div class="tools">
      <el-button size="small" :disabled="!video" :loading="!!pending" @click="preview">{{ show ? '查看原画面' : '预览当前帧' }}</el-button>
      <el-radio-group :modelValue="values.outputMode" size="small" aria-label="输出内容" @update:modelValue="v => emit('updateValues', { outputMode: String(v) })">
        <el-radio-button value="transparent">保留人物，背景透明</el-radio-button><el-radio-button value="mask">黑白遮罩</el-radio-button>
      </el-radio-group>
    </div>
    <span class="hint">{{ values.outputMode === 'mask' ? '白色保留人像，黑色表示背景，可用作剪辑遮罩。' : '保留原片音轨，输出带透明通道的 WebM，可叠加到新背景。' }}</span>
    <span v-if="error" class="feedback" role="alert">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton, ElRadioButton, ElRadioGroup } from "element-plus";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import videoPlayer from "./videoPlayer.vue";
import { createPortraitMatting } from "../portraitMatting";

const props = defineProps<{ src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ ready: [value: boolean]; updateValues: [values: Record<string, string | number>] }>();
const video = shallowRef<HTMLVideoElement>(), canvas = shallowRef<HTMLCanvasElement>(), pending = shallowRef<AbortController>();
const sample = shallowRef<{ width: number; height: number; data: Uint8Array }>(), show = ref(false), error = ref("");
const model = useNodeModel();
function clear() { pending.value?.abort(); pending.value = undefined; sample.value = undefined; show.value = false; error.value = ""; }
function loaded(event: Event) { video.value = event.target as HTMLVideoElement; }
watch(() => props.src, () => { clear(); video.value = undefined; emit("ready", false); });
watch(video, (element, _, cleanup) => {
  if (!element) return;
  element.addEventListener("seeking", clear); element.addEventListener("play", clear);
  cleanup(() => { element.removeEventListener("seeking", clear); element.removeEventListener("play", clear); });
});
onScopeDispose(clear);
async function preview() {
  const element = video.value;
  if (!element || pending.value) return;
  if (sample.value) { show.value = !show.value; return; }
  element.pause();
  const controller = new AbortController();
  pending.value = controller; error.value = "";
  try {
    const scale = Math.min(1, 640 / Math.max(element.videoWidth, element.videoHeight));
    const width = Math.max(1, Math.round(element.videoWidth * scale)), height = Math.max(1, Math.round(element.videoHeight * scale));
    const surface = document.createElement("canvas");
    surface.width = width; surface.height = height;
    const ctx = surface.getContext("2d");
    if (!ctx) throw new Error("无法读取视频画面");
    ctx.drawImage(element, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data, frame = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) frame.set(pixels.subarray(i * 4, i * 4 + 3), i * 3);
    const data = await createPortraitMatting(width, height, "transparent", model.run, controller.signal)(frame);
    controller.signal.throwIfAborted();
    sample.value = { width, height, data }; show.value = true;
  } catch (cause) { if (!controller.signal.aborted) error.value = cause instanceof Error ? cause.message : "当前帧预览失败"; }
  finally { if (pending.value === controller) pending.value = undefined; }
}
watch([sample, canvas, () => props.values.outputMode], () => {
  const frame = sample.value, surface = canvas.value;
  if (!frame || !surface) return;
  surface.width = frame.width; surface.height = frame.height;
  const ctx = surface.getContext("2d");
  if (!ctx) return;
  const pixels = ctx.createImageData(frame.width, frame.height);
  pixels.data.set(frame.data);
  if (props.values.outputMode === "mask") for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data.fill(pixels.data[i + 3]!, i, i + 3); pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
}, { flush: "post" });
</script>

<style scoped lang="scss">
.portraitEditor {
  display: grid; gap: 10px;
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none;
    background: repeating-conic-gradient(var(--el-fill-color-dark) 0 25%, var(--el-fill-color-light) 0 50%) 0 0 / 16px 16px; }
  .tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .hint, .feedback { color: var(--el-text-color-secondary); font-size: 12px; }
  .feedback { color: var(--el-color-danger); }
}
</style>
