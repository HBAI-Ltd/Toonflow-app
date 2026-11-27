<template>
  <div class="upscaleEditor">
    <div v-show="!comparison" class="previewStage">
      <div v-if="previewSrc" class="sourceFrame" :style="dimensions && { '--imageRatio': dimensions.width / dimensions.height }">
        <img ref="image" :src="previewSrc" :alt="videoFrame ? '待放大的视频帧' : '待放大的原图'" draggable="false" @load="onLoad" @error="handleError" />
        <button v-if="sample" type="button" class="regionPicker" aria-label="选择细节区域，可用方向键移动"
          @click="pickRegion" @keydown="moveRegion">
          <span class="sampleRegion" :style="regionStyle" />
        </button>
      </div>
      <span v-if="!dimensions" role="status">{{ previewError || '正在读取原图…' }}</span>
    </div>
    <div v-if="comparison" class="detailStage" :style="{ '--detailRatio': comparison.width / comparison.height }">
      <figure>
        <figcaption>{{ videoFrame ? '原帧细节' : '原图细节' }}</figcaption>
        <canvas ref="originalCanvas" aria-label="选区的原始细节" />
      </figure>
      <figure>
        <figcaption>高清放大 · {{ scale }}×</figcaption>
        <canvas ref="resultCanvas" aria-label="模型处理后的选区细节" />
      </figure>
    </div>
    <div class="detailBar">
      <span>{{ comparison ? '同一选区，等比例对照' : videoFrame ? '点击画面选择要对比的细节' : '点击原图选择要对比的细节' }}</span>
      <el-button v-if="comparison" size="small" @click="hideComparison">{{ videoFrame ? '重选细节' : '返回原图' }}</el-button>
      <el-button v-else size="small" :disabled="!ready || !!previewJob" :loading="!!previewJob" @click="compare">对比局部细节</el-button>
    </div>
    <p v-if="comparisonError" class="errorText" role="alert">{{ comparisonError }}</p>
    <div v-if="!videoFrame" class="scaleRow">
      <span :id="scaleLabel">放大倍数</span>
      <el-radio-group :modelValue="scale" :aria-labelledby="scaleLabel" @update:modelValue="chooseScale">
        <el-radio-button v-for="value in upscaleScales" :key="value" :value="value" :disabled="!allowed.includes(value) || !!previewJob">{{ value }}×</el-radio-button>
      </el-radio-group>
      <span v-if="dimensions && allowed.includes(scale)" class="sizeInfo" aria-live="polite">
        {{ dimensions.width }} × {{ dimensions.height }}
        <icon-arrow-right :size="14" aria-label="放大至" />
        <strong>{{ dimensions.width * scale }} × {{ dimensions.height * scale }} px</strong>
      </span>
    </div>
    <p v-if="!videoFrame && dimensions && allowed.length < upscaleScales.length" class="limitHint" role="status">
      {{ allowed.length ? '较高倍率超出尺寸限制。' : '原图过大，请先裁剪或缩小图片。' }}输出最多 4800 万像素，单边最长 32767 像素。
    </p>
    <p v-if="!videoFrame" class="modelHint">Real-ESRGAN 以 4 倍增强细节，2 倍和 3 倍按目标尺寸缩小。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, useId, watch, watchEffect } from "vue";
import { ElButton, ElRadioButton, ElRadioGroup } from "element-plus";
import { IconArrowRight } from "@tabler/icons-vue";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import { fitsUpscaleSize, getUpscaleSample, predictUpscaleTile, upscaleScales } from "../upscaleTiles";
import { previewUpscaleSample } from "../imageModels";

const props = defineProps<{ src: string; values: Record<string, string | number>; videoFrame?: boolean }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [value: boolean] }>();
const model = useNodeModel();
const { src: previewSrc, error: previewError, handleLoaded, handleError } = useMediaPreview(() => props.src, "image");
const scaleLabel = useId();
const image = ref<HTMLImageElement>();
const dimensions = shallowRef<{ width: number; height: number }>();
const point = shallowRef({ x: 0, y: 0 });
const scale = computed(() => Number(props.values.scale ?? 4));
const allowed = computed<number[]>(() => dimensions.value ? upscaleScales.filter(s => fitsUpscaleSize(dimensions.value!.width, dimensions.value!.height, s)) : []);
const ready = computed(() => !previewError.value && allowed.value.includes(scale.value));
const sample = computed(() => dimensions.value && getUpscaleSample(dimensions.value.width, dimensions.value.height, point.value));
const regionStyle = computed(() => {
  const size = dimensions.value, region = sample.value;
  if (!size || !region) return;
  return { left: region.x / size.width * 100 + "%", top: region.y / size.height * 100 + "%",
    width: region.width / size.width * 100 + "%", height: region.height / size.height * 100 + "%" };
});
const previewJob = shallowRef<AbortController>();
const comparison = shallowRef<HTMLCanvasElement>();
const comparisonError = ref("");
const originalCanvas = ref<HTMLCanvasElement>(), resultCanvas = ref<HTMLCanvasElement>();
let prediction: Float32Array | undefined;

function hideComparison() {
  previewJob.value?.abort();
  previewJob.value = undefined;
  if (comparison.value) comparison.value.width = comparison.value.height = 0;
  comparison.value = undefined;
  comparisonError.value = "";
}
function clearComparison() {
  hideComparison();
  prediction = undefined;
}
watch(previewSrc, () => { clearComparison(); dimensions.value = undefined; }, { flush: "sync" });
watch(ready, value => emit("ready", value), { immediate: true });
onScopeDispose(clearComparison);

function onLoad(event: Event) {
  if (!handleLoaded(event) || !image.value) return;
  const { naturalWidth: width, naturalHeight: height } = image.value;
  dimensions.value = { width, height };
  point.value = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  if (allowed.value.length && !allowed.value.includes(scale.value)) emit("updateValues", { scale: allowed.value.at(-1)! });
}

function chooseScale(value: string | number | boolean | undefined) {
  if (!allowed.value.includes(Number(value))) return;
  emit("updateValues", { scale: Number(value) });
}
watch(scale, () => { if (comparison.value && prediction) void compare(); });
function selectPoint(next: { x: number; y: number }) {
  const size = dimensions.value, current = sample.value;
  if (!size || !current) return;
  const selected = getUpscaleSample(size.width, size.height, next);
  if (selected.x === current.x && selected.y === current.y) return;
  clearComparison();
  point.value = next;
}
function pickRegion(event: MouseEvent) {
  if (!dimensions.value || !event.detail) return;
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  selectPoint({ x: (event.clientX - bounds.left) / bounds.width * dimensions.value.width, y: (event.clientY - bounds.top) / bounds.height * dimensions.value.height });
}
function moveRegion(event: KeyboardEvent) {
  const region = sample.value, size = dimensions.value;
  if (!region || !size) return;
  const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const step = steps[event.key];
  if (!step) return;
  event.preventDefault();
  selectPoint({ x: Math.max(0, Math.min(size.width - 1, region.x + (step[0] < 0 ? -1 : step[0] > 0 ? region.width : 0))),
    y: Math.max(0, Math.min(size.height - 1, region.y + (step[1] < 0 ? -1 : step[1] > 0 ? region.height : 0))) });
}
async function compare() {
  if (!image.value || !ready.value || previewJob.value) return;
  const controller = new AbortController();
  const requestedScale = scale.value;
  previewJob.value = controller;
  comparisonError.value = "";
  try {
    const result = await previewUpscaleSample(image.value, requestedScale, point.value, controller.signal, async input => {
      if (prediction) return prediction;
      const output = await predictUpscaleTile(input, model.run, controller.signal);
      controller.signal.throwIfAborted();
      prediction = output;
      return output;
    });
    if (controller.signal.aborted) result.width = result.height = 0;
    else {
      if (comparison.value) comparison.value.width = comparison.value.height = 0;
      comparison.value = result;
    }
  } catch (error) {
    if (!controller.signal.aborted) comparisonError.value = error instanceof Error ? error.message : "局部预览失败，请重试";
  } finally {
    if (previewJob.value === controller) {
      previewJob.value = undefined;
      if (prediction && ready.value && requestedScale !== scale.value) void compare();
    }
  }
}
watchEffect(() => {
  const original = originalCanvas.value, enhanced = resultCanvas.value, result = comparison.value;
  const source = image.value, region = sample.value;
  if (!original || !enhanced || !result || !source || !region) return;
  original.width = enhanced.width = result.width;
  original.height = enhanced.height = result.height;
  original.getContext("2d")?.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, result.width, result.height);
  enhanced.getContext("2d")?.drawImage(result, 0, 0);
}, { flush: "post" });
</script>

<style scoped lang="scss">
.upscaleEditor {
  .previewStage, .detailStage {
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-darker);
  }
  .previewStage {
    --previewHeight: clamp(140px, 40dvh, 320px);
    display: grid; place-items: center; height: var(--previewHeight); overflow: hidden;
    .sourceFrame {
      position: relative; min-width: 0; width: min(100%, calc(var(--previewHeight) * var(--imageRatio, 1)));
      img { display: block; width: 100%; max-height: var(--previewHeight); object-fit: contain; }
      .regionPicker {
        position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0;
        background: transparent; cursor: crosshair;
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
        .sampleRegion { position: absolute; box-sizing: border-box; border: 2px solid white; box-shadow: inset 0 0 0 1px #333; pointer-events: none; }
      }
    }
    > span { padding: 10px; color: var(--el-text-color-regular); }
  }
  .detailStage {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px; gap: 12px;
    figure { display: grid; justify-items: center; align-content: center; gap: 8px; margin: 0; }
    figcaption { color: var(--el-text-color-regular); font-size: 13px; }
    canvas { display: block; width: min(100%, calc(clamp(100px, 23dvh, 200px) * var(--detailRatio))); height: auto; }
  }
  .detailBar, .scaleRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
  .detailBar { justify-content: space-between; margin: 8px 0 16px; color: var(--el-text-color-regular); font-size: 12px; }
  .scaleRow {
    .sizeInfo { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; font-variant-numeric: tabular-nums; }
    strong { font-weight: 600; }
  }
  .modelHint, .limitHint, .errorText { margin: 8px 0 0; color: var(--el-text-color-regular); font-size: 12px; }
  .errorText { color: var(--el-color-danger); margin: 0 0 12px; }
}
</style>
