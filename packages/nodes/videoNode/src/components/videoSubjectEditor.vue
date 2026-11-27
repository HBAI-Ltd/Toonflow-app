<template>
  <div class="subjectEditor">
    <videoPlayer :src="src" readOnly label="主体处理预览" @loadedmetadata="loaded" @ready="ready = $event">
      <template #frameOverlay><canvas v-show="showResult && sample" ref="canvas" aria-label="当前帧处理结果" /></template>
    </videoPlayer>
    <div class="previewTools">
      <el-button size="small" :loading="!!pending" :disabled="!ready || !!sizeError" @click="inspect">{{ sample && showResult ? '查看原画面' : '预览当前帧效果' }}</el-button>
      <span aria-live="polite">{{ pending ? '正在识别当前帧主体…' : outputLabel }}</span>
    </div>
    <span v-if="sizeError || error" class="feedback" role="alert">{{ sizeError || error }}</span>
    <label v-if="reframe" class="aspectField"><span>成片比例</span>
      <el-radio-group :modelValue="values.aspect" size="small" aria-label="成片比例" @update:modelValue="value => emit('updateValues', { aspect: String(value) })">
        <el-radio-button v-for="option in tool.fields?.[0]?.options" :key="option.value" :value="option.value">{{ option.label }}</el-radio-button>
      </el-radio-group>
    </label>
    <div class="sliderField">
      <label :for="sliderId">{{ reframe ? '跟随平稳程度' : '背景模糊程度' }}<output>{{ reframe ? values.smooth + '%' : values.radius + ' px' }}</output></label>
      <el-slider :id="sliderId" :modelValue="Number(reframe ? values.smooth : values.radius)" :min="reframe ? 0 : 2" :max="reframe ? 100 : 48"
        :aria-label="reframe ? '跟随平稳程度' : '背景模糊程度'" @input="value => emit('updateValues', { [reframe ? 'smooth' : 'radius']: Number(value) })" />
      <div class="scaleLabels"><span>{{ reframe ? '快速跟随' : '轻微' }}</span><span>{{ reframe ? '平稳移动' : '明显' }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, useId, watch } from "vue";
import { ElButton, ElRadioButton, ElRadioGroup, ElSlider } from "element-plus";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import videoPlayer from "./videoPlayer.vue";
import { createSubjectMasker, createSubjectRenderer, getSubjectFrameSize, type SubjectOptions } from "../videoSubject";

const props = defineProps<{ tool: MediaTool; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [ready: boolean] }>();
const model = useNodeModel();
const sliderId = useId();
const reframe = computed(() => props.tool.id === "reframe");
const video = shallowRef<HTMLVideoElement>(), canvas = shallowRef<HTMLCanvasElement>();
const ready = ref(false), showResult = ref(false), error = ref("");
const sample = shallowRef<{ frame: Uint8Array; mask: Float32Array; width: number; height: number }>();
const pending = shallowRef<AbortController>();
const options = computed<SubjectOptions>(() => reframe.value
  ? { operation: "reframe", aspect: props.values.aspect === "square" ? "square" : props.values.aspect === "fourFive" ? "fourFive" : "portrait", smooth: Number(props.values.smooth) }
  : { operation: "blurBackground", radius: Number(props.values.radius) });
const outputSize = computed(() => {
  const el = video.value, value = options.value;
  if (!el) return;
  if (value.operation === "blurBackground") return { width: el.videoWidth, height: el.videoHeight };
  try { return getSubjectFrameSize(el.videoWidth, el.videoHeight, value.aspect); } catch { return; }
});
const sizeError = computed(() => ready.value && !outputSize.value ? "源画面太小，请更换成片比例" : "");
const outputLabel = computed(() => outputSize.value ? `输出 ${outputSize.value.width} × ${outputSize.value.height}` : "");
watch([ready, sizeError], () => emit("ready", ready.value && !sizeError.value), { immediate: true });
function clearPreview() {
  pending.value?.abort();
  pending.value = undefined; sample.value = undefined; showResult.value = false; error.value = "";
}
watch(() => props.src, () => { clearPreview(); video.value = undefined; ready.value = false; });
onScopeDispose(clearPreview);
watch(video, (el, _, onCleanup) => {
  if (!el) return;
  el.addEventListener("seeking", clearPreview);
  el.addEventListener("play", clearPreview);
  onCleanup(() => { el.removeEventListener("seeking", clearPreview); el.removeEventListener("play", clearPreview); });
});
function loaded(event: Event) { clearPreview(); video.value = event.target as HTMLVideoElement; }
async function inspect() {
  const el = video.value;
  if (!el || pending.value) return;
  if (sample.value) { showResult.value = !showResult.value; return; }
  el.pause();
  const ctl = new AbortController();
  pending.value = ctl; error.value = "";
  try {
    const scale = Math.min(1, 800 / Math.max(el.videoWidth, el.videoHeight));
    const width = Math.max(1, Math.round(el.videoWidth * scale)), height = Math.max(1, Math.round(el.videoHeight * scale));
    const source = document.createElement("canvas");
    source.width = width; source.height = height;
    const context = source.getContext("2d");
    if (!context) throw new Error("无法读取预览帧");
    context.drawImage(el, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const frame = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      frame[i * 3] = pixels[i * 4]!;
      frame[i * 3 + 1] = pixels[i * 4 + 1]!;
      frame[i * 3 + 2] = pixels[i * 4 + 2]!;
    }
    const mask = await createSubjectMasker(width, height, model.run, ctl.signal)(frame);
    ctl.signal.throwIfAborted();
    sample.value = { frame, mask, width, height };
    showResult.value = true;
  } catch (cause) {
    if (!ctl.signal.aborted) error.value = cause instanceof Error ? cause.message : "当前帧预览失败";
  } finally { if (pending.value === ctl) pending.value = undefined; }
}
watch([sample, options, canvas], ([data, value, surface]) => {
  if (!data || !surface) return;
  try {
    const size = value.operation === "reframe" ? getSubjectFrameSize(data.width, data.height, value.aspect) : data;
    const scaled = value.operation === "blurBackground" ? { ...value, radius: Math.max(2, Math.round(value.radius * data.width / video.value!.videoWidth)) } : value;
    const frame = createSubjectRenderer(data.width, data.height, scaled)(data.frame, data.mask);
    surface.width = size.width; surface.height = size.height;
    const ctx = surface.getContext("2d");
    if (!ctx) throw new Error("无法绘制预览帧");
    const pixels = ctx.createImageData(size.width, size.height);
    for (let i = 0; i < frame.length / 3; i++) {
      pixels.data[i * 4] = frame[i * 3]!;
      pixels.data[i * 4 + 1] = frame[i * 3 + 1]!;
      pixels.data[i * 4 + 2] = frame[i * 3 + 2]!;
      pixels.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    error.value = "";
  } catch (cause) { showResult.value = false; error.value = cause instanceof Error ? cause.message : "无法显示预览帧"; }
}, { flush: "post" });
</script>

<style scoped lang="scss">
.subjectEditor {
  display: grid; gap: 10px;
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: var(--el-fill-color-darker); pointer-events: none; }
  .previewTools, .aspectField, .sliderField label, .scaleLabels { display: flex; justify-content: space-between; flex-wrap: wrap; align-items: center; gap: 8px; }
  .aspectField, .sliderField label { color: var(--el-text-color-regular); font-size: 13px; }
  .previewTools span, .scaleLabels { font-size: 12px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
  .feedback { font-size: 12px; color: var(--el-color-danger); }
  .sliderField { padding-inline: 4px; }
}
</style>
