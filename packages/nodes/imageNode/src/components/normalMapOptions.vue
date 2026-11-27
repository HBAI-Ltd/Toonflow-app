<template>
  <div class="normalOptions">
    <div class="choiceRow">
      <span>凹凸强度</span>
      <el-radio-group :modelValue="Number(values.strength)" size="small" aria-label="凹凸强度"
        @change="value => emit('updateValues', { strength: Number(value) })">
        <el-radio-button v-for="choice in strengths" :key="choice.value" :value="choice.value">{{ translate(choice.label) }}</el-radio-button>
      </el-radio-group>
    </div>
    <details class="fineControls">
      <summary>精细调整</summary>
      <div class="choiceRow">
        <span>凹凸强度</span>
        <el-slider :modelValue="Number(values.strength)" :min="strength?.min" :max="strength?.max" :step="strength?.step"
          aria-label="凹凸强度" @update:modelValue="value => emit('updateValues', { strength: Number(value) })" />
        <output>{{ Number(values.strength).toFixed(1) }}×</output>
      </div>
      <div class="choiceRow">
        <span>法线方向</span>
        <el-radio-group :modelValue="values.convention" size="small" aria-label="法线方向"
          @change="value => emit('updateValues', { convention: String(value) })">
          <el-radio-button v-for="option in convention?.options" :key="option.value" :value="option.value">{{ option.label }}</el-radio-button>
        </el-radio-group>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElRadioButton, ElRadioGroup, ElSlider } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";

const props = defineProps<{ tool: MediaTool; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>] }>();
const strength = computed(() => props.tool.fields?.find(field => field.key === "strength"));
const convention = computed(() => props.tool.fields?.find(field => field.key === "convention"));
const strengths = computed(() => {
  const base = Number(strength.value?.value ?? 1);
  return [{ label: "柔和", value: base / 2 }, { label: "标准", value: base }, { label: "明显", value: base * 2 }];
});
</script>

<style scoped lang="scss">
.normalOptions {
  display: grid; gap: 10px;
  .choiceRow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 13px;
    .el-slider { flex: 1; min-width: 90px; }
    output { font-variant-numeric: tabular-nums; }
  }
  .fineControls { border-top: 1px solid var(--el-border-color-lighter); padding-top: 8px;
    summary { cursor: pointer; color: var(--el-text-color-regular); font-size: 13px; }
    .choiceRow { margin-top: 8px; }
  }
}
</style>
