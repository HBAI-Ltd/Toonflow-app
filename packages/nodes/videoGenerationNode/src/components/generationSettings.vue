<template>
  <el-popover trigger="click" placement="top-start" width="min(340px, calc(100vw - 24px))" :disabled="disabled" :showArrow="false" :popperStyle="{ padding: '14px' }">
    <template #reference>
      <el-button class="settingsButton" text size="small" :disabled="disabled" :aria-label="t('settings')">
        <span class="ratioShape" :style="ratioStyle(ratio)" aria-hidden="true" />
        <span>{{ [ratio, resolution, duration ? t('seconds', { value: duration }) : ''].filter(Boolean).join(' · ') }}</span>
        <icon-chevron-up :size="14" aria-hidden="true" />
      </el-button>
    </template>
    <div class="generationSettings nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop @wheel.stop>
      <div v-if="modes.length" class="sectionLabel">{{ t("generationMode") }}</div>
      <el-select v-if="modes.length" v-model="mode" :disabled="disabled" :teleported="false" :aria-label="t('videoGenerationMode')">
        <el-option v-for="item in modes" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>
      <div v-if="durations.length || resolutions.length" class="outputOptions">
        <div v-if="durations.length" class="outputField">
          <div class="sectionLabel">{{ t("duration") }}</div>
          <el-select v-model="duration" :disabled="disabled" :teleported="false" :aria-label="t('videoDuration')">
            <el-option v-for="item in durations" :key="item" :value="item" :label="t('seconds', { value: item })" />
          </el-select>
        </div>
        <div v-if="resolutions.length" class="outputField">
          <div class="sectionLabel">{{ t("resolution") }}</div>
          <el-select v-model="resolution" :disabled="disabled" :teleported="false" :aria-label="t('videoResolution')">
            <el-option v-for="item in resolutions" :key="item" :value="item" :label="item" />
          </el-select>
        </div>
      </div>
      <div class="sectionLabel">{{ t("standardRatio") }}</div>
      <div class="ratioOptions" role="group" :aria-label="t('videoAspectRatio')">
        <el-button v-for="item in ratios" :key="item" class="ratioButton" :disabled="disabled" :aria-label="t('aspectRatioOption', { ratio: item })" :aria-pressed="ratio === item" @click="ratio = item">
          <span class="ratioContent">
            <span class="ratioShape" :style="ratioStyle(item)" aria-hidden="true" />
            <span>{{ item }}</span>
          </span>
        </el-button>
      </div>
      <div v-if="model?.audio === 'optional'" class="audioOption">
        <span class="sectionLabel">{{ t("generateAudio") }}</span>
        <el-switch v-model="generateAudio" :disabled="disabled" :aria-label="t('generateAudio')" />
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElPopover, ElSelect, ElOption, ElSwitch } from "element-plus";
import { IconChevronUp } from "@tabler/icons-vue";
import { createTranslator } from "@toonflow/i18n";
import zh from "../locales/zh.json";
import en from "../locales/en.json";

const t = createTranslator({ zh, en });
import type { NodeMediaModel } from "@toonflow/nodes-scaffold/runtime";

const props = defineProps<{ model?: NodeMediaModel; disabled?: boolean; ratios: string[] }>();
const duration = defineModel<number | undefined>("duration", { required: true });
const resolution = defineModel<string>("resolution", { required: true });
const ratio = defineModel<string>("ratio", { required: true });
const mode = defineModel<string>("mode", { required: true });
const generateAudio = defineModel<boolean>("generateAudio", { required: true });
const modeLabels: Record<string, string> = {
  text: "modeText", singleImage: "modeSingleImage", startEndRequired: "modeStartEndRequired", endFrameOptional: "modeEndOptional", startFrameOptional: "modeStartOptional",
};
const modes = computed(() => (props.model?.mode ?? []).map(item => ({
  value: JSON.stringify(item),
  label: Array.isArray(item) ? t("mixedReferences") : modeLabels[item] ? t(modeLabels[item]) : item,
})));
const mappings = computed(() => props.model?.durationResolutionMap ?? []);
const durations = computed(() => [...new Set(mappings.value.flatMap(item => item.duration))].sort((a, b) => a - b));
const resolutions = computed(() => resolutionsFor(duration.value));

function resolutionsFor(value: number | undefined) {
  return [...new Set(mappings.value.filter(item => value !== undefined && item.duration.includes(value)).flatMap(item => item.resolution))];
}

function ratioStyle(value: string) {
  const [width = 1, height = 1] = value.split(":").map(Number);
  return { width: `${16 * Math.min(width / height, 1)}px`, height: `${16 * Math.min(height / width, 1)}px` };
}
</script>

<style scoped lang="scss">
.ratioShape {
  display: inline-block;
  flex-shrink: 0;
  border: 1px solid currentColor;
  border-radius: 2px;
  box-sizing: border-box;
}

.settingsButton {
  flex-shrink: 0;
  :deep(> span) { gap: 6px; }
}

.generationSettings {
  text-align: left;

  .sectionLabel {
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 500;
  }

  > .el-select { margin-bottom: 14px; }

  .outputOptions {
    display: flex;
    gap: 12px;
    margin-bottom: 14px;
    .outputField { flex: 1; min-width: 0; }
  }

  .ratioOptions {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;

    .ratioButton {
      height: 60px;
      margin: 0;
      padding: 8px 4px;
      color: var(--el-text-color-secondary);
      --el-button-bg-color: var(--el-fill-color-light);
      --el-button-hover-bg-color: var(--el-fill-color);
      --el-button-hover-text-color: var(--el-text-color-primary);
      --el-button-hover-border-color: var(--el-border-color-darker);

      &[aria-pressed="true"] {
        color: var(--el-text-color-primary);
        border-color: var(--el-text-color-regular);
        background: var(--el-fill-color);
      }

      .ratioContent {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
    }
  }

  .audioOption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    .sectionLabel { margin: 0; }
  }
}
</style>
