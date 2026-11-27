<template>
  <div class="sequenceOptions">
    <div class="durationRow ratioRow">
      <span>{{ translate("成片比例") }}</span>
      <div class="ratioPresets" role="group" :aria-label="translate('成片比例')">
        <button v-for="option in ratioField?.options" :key="option.value" type="button"
          :aria-pressed="values.ratio === option.value" @click="emit('updateValues', { ratio: option.value })">
          <span class="ratioSample" aria-hidden="true"><span :style="{ '--frameRatio': ratioFor(option.value) }" /></span>
          {{ translate(option.label) }}
        </button>
      </div>
    </div>
    <div class="durationRow">
      <label :for="durationId">{{ tool.id === "image-slideshow" ? translate("每张停留") : translate("视频时长") }}</label>
      <div class="durationPresets">
        <button v-for="time in [1, 3, 5]" :key="time" type="button" :aria-pressed="values.seconds === time" @click="setSeconds(time)">{{ t`${time} 秒` }}</button>
      </div>
      <el-input-number :id="durationId" :modelValue="Number(values.seconds) || undefined" :min="durationField?.min" :max="durationField?.max"
        :step="1" :precision="0" size="small" controlsPosition="right" :aria-label="translate('自定义时长（秒）')" @update:modelValue="setSeconds" />
      <span>{{ translate("秒") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { ElInputNumber } from "element-plus";
import { t, translate } from "@toonflow/i18n/vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { getSequenceFrame } from "../imageSequenceTools";

const props = defineProps<{ tool: MediaTool; values: Record<string, string | number>; sourceRatio?: number }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>] }>();
const ratioField = computed(() => props.tool.fields?.find(field => field.key === "ratio"));
const durationField = computed(() => props.tool.fields?.find(field => field.key === "seconds"));
const durationId = useId();
function ratioFor(ratio: string) {
  const frame = getSequenceFrame(ratio, props.sourceRatio || 1, 1);
  return frame.width / frame.height;
}

function setSeconds(value: number | undefined) { emit("updateValues", { seconds: value ?? "" }); }
</script>

<style scoped lang="scss">
.sequenceOptions {
  display: grid; gap: 18px;
  .durationRow {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 13px;
    label { flex: 0 0 100%; font-weight: 600; }
    .durationPresets { display: flex; flex-wrap: wrap; gap: 4px; }
    .ratioPresets {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px;
      button { display: inline-flex; align-items: center; gap: 8px; min-height: 38px; }
      .ratioSample {
        display: grid; place-items: center; width: 24px; height: 20px;
        span { box-sizing: border-box; width: min(100%, calc(20px * var(--frameRatio))); aspect-ratio: var(--frameRatio); border: 1.5px solid currentColor; border-radius: 2px; }
      }
    }
    button { cursor: pointer; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); padding: 3px 9px; color: var(--el-text-color-regular); background: var(--el-fill-color-light); font: inherit; }
    button[aria-pressed="true"] { color: var(--el-color-primary); border-color: var(--el-color-primary); }
    .el-input-number { width: 92px; }
  }
  .ratioRow { display: grid; > span { font-weight: 600; } }
}
</style>
