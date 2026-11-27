<template>
  <div class="scaleRow">
    <span>{{ label }}</span>
    <el-radio-group :modelValue="modelValue" :aria-label="label" @change="emit('update:modelValue', Number($event))">
      <el-radio-button v-for="option in options" :key="option" :value="option" :disabled="isDisabled?.(option)">
        <slot :option="option">{{ option }}×</slot>
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
export const interpolationFactors = [2, 4] as const;
</script>

<script setup lang="ts">
import { ElRadioButton, ElRadioGroup } from "element-plus";

defineProps<{
  label: string;
  modelValue: number;
  options: readonly number[];
  isDisabled?: (option: number) => boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
</script>

<style scoped lang="scss">
.scaleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}
</style>
