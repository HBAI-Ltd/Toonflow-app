<template>
  <div class="colorEditor">
    <div class="colorStage" :style="{ '--frameFilter': original ? 'none' : 'url(#' + filterId + ')' }">
      <videoPlayer :src="src" readOnly label="视频调色预览" @ready="value => emit('ready', value)">
        <template #frameOverlay><span aria-hidden="true" /></template>
      </videoPlayer>
      <svg width="0" height="0" aria-hidden="true" class="filterDefs">
        <defs>
          <filter :id="filterId" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" :values="colorMatrix" />
            <feComponentTransfer>
              <feFuncR type="table" :tableValues="redCurve" />
              <feFuncB type="table" :tableValues="blueCurve" />
            </feComponentTransfer>
            <feConvolveMatrix v-if="sharpness" order="5" :kernelMatrix="sharpenKernel" divisor="1" preserveAlpha="true" />
          </filter>
        </defs>
      </svg>
    </div>
    <div class="compareActions">
      <el-button size="small" :icon="IconEye" :aria-pressed="original" @click="original = !original">{{ original ? '返回调色预览' : '查看原片' }}</el-button>
      <el-button text size="small" :icon="IconRestore" :disabled="!changed" @click="reset">重置调色</el-button>
    </div>
    <div class="colorPresets" role="group" aria-label="调色预设">
      <el-button v-for="preset in presets" :key="preset.label" size="small" :aria-pressed="selectedPreset === preset"
        :type="selectedPreset === preset ? 'primary' : 'default'" @click="applyPreset(preset.values)">{{ translate(preset.label) }}</el-button>
    </div>
    <details class="fineControls">
      <summary>{{ translate('微调参数') }}</summary>
      <div class="colorControls">
        <label v-for="field in tool.fields" :key="field.key" class="colorControl">
          <span>{{ translate(field.label) }}<output>{{ values[field.key] }}</output></span>
          <el-slider :modelValue="Number(values[field.key])" :min="field.min" :max="field.max" :step="field.step" :aria-label="translate(field.label)"
            @input="value => change(field.key, Number(value))" />
        </label>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { ElButton, ElSlider } from "element-plus";
import { IconEye, IconRestore } from "@tabler/icons-vue";
import { markMessages, translate } from "@toonflow/i18n/vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, number>]; ready: [ready: boolean] }>();
const filterId = "videoGrade" + useId().replace(/\W/g, "");
const original = ref(false);
const changed = computed(() => props.tool.fields?.some(field => field.value !== props.values[field.key]));
const presets = markMessages([
  { label: "提亮画面", values: { brightness: 0.08, contrast: 1.05, saturation: 1, temperature: 0, sharpness: 0 } },
  { label: "增强清晰度", values: { brightness: 0, contrast: 1.05, saturation: 1, temperature: 0, sharpness: 0.6 } },
  { label: "电影感", values: { brightness: -0.05, contrast: 1.15, saturation: 0.8, temperature: -0.1, sharpness: 0.2 } },
  { label: "暖色", values: { brightness: 0, contrast: 1.05, saturation: 1.05, temperature: 0.45, sharpness: 0 } },
  { label: "冷色", values: { brightness: 0, contrast: 1.05, saturation: 0.9, temperature: -0.45, sharpness: 0 } },
  { label: "黑白", values: { brightness: 0, contrast: 1.1, saturation: 0, temperature: 0, sharpness: 0 } },
  { label: "鲜艳", values: { brightness: 0, contrast: 1.05, saturation: 1.3, temperature: 0, sharpness: 0.2 } },
]);
const selectedPreset = computed(() => presets.find(preset => Object.entries(preset.values).every(([key, value]) => props.values[key] === value)));
const sharpness = computed(() => Number(props.values.sharpness));
// ACT: 浏览器在 RGB 画面上模拟 FFmpeg 的亮度、色度和阴影调整，最终编码仍沿用源视频色彩空间。
const colorMatrix = computed(() => {
  const contrast = Number(props.values.contrast);
  const saturation = Number(props.values.saturation);
  const offset = Number(props.values.brightness) + (1 - contrast) / 2;
  const luma = [0.299, 0.587, 0.114];
  const rows = luma.map((_, row) => [...luma.map((weight, column) => weight * (contrast - saturation) + (column === row ? saturation : 0)), 0, offset]);
  return [...rows.flat(), 0, 0, 0, 1, 0].join(" ");
});
function shadowCurve(direction: number) {
  const temperature = direction * Number(props.values.temperature) * 0.25;
  return Array.from({ length: 33 }, (_, i) => {
    const value = i / 32;
    return Math.min(1, Math.max(0, value + temperature * Math.max(0, 1 - 2 * value)));
  }).join(" ");
}
const redCurve = computed(() => shadowCurve(1));
const blueCurve = computed(() => shadowCurve(-1));
const sharpenKernel = computed(() => {
  const weights = [1, 4, 6, 4, 1];
  return weights.flatMap((x, i) => weights.map((y, j) => (i === 2 && j === 2 ? 1 + sharpness.value : 0) - sharpness.value * x * y / 256)).join(" ");
});
function change(key: string, value: number) {
  original.value = false;
  emit("updateValues", { [key]: value });
}
function applyPreset(values: Record<string, number>) {
  original.value = false;
  emit("updateValues", values);
}
function reset() {
  original.value = false;
  emit("updateValues", Object.fromEntries((props.tool.fields ?? []).map(field => [field.key, Number(field.value)])));
}
</script>

<style scoped lang="scss">
.colorEditor {
  .colorStage {
    position: relative;
    :deep(.videoPreview) { filter: var(--frameFilter); }
    .filterDefs { position: absolute; pointer-events: none; }
  }
  .compareActions { display: flex; justify-content: space-between; margin: 8px 0 12px; }
  .colorPresets {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;
    .el-button { margin: 0; }
  }
  .colorControls {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr)); gap: 6px 24px;
    .colorControl {
      min-width: 0; padding-inline: 6px;
      > span { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
      output { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
    }
  }
  .fineControls summary { cursor: pointer; width: fit-content; margin-bottom: 8px; color: var(--el-text-color-regular); font-size: 13px; }
}
</style>
