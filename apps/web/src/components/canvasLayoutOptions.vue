<template>
  <el-radio-group class="layoutOptions" :class="{ compact }" :modelValue="modelValue">
    <el-radio v-for="(layout, mode) in canvasLayouts" :key="mode" :value="mode" :title="translate(layout.label)" border @change="emit('update:modelValue', mode)">
      <span class="cardLabel">
        <strong>{{ layout.shortName ? t`类 ${layout.shortName} 布局` : translate(layout.label) }}</strong>
        <canvasLayoutPreview :mode="mode" />
      </span>
    </el-radio>
  </el-radio-group>
</template>

<script setup lang="ts">
import { t, translate } from "@toonflow/i18n/vue";
import { canvasLayouts, type CanvasLayoutMode } from "@/lib/canvasLayouts";
import canvasLayoutPreview from "./canvasLayoutPreview.vue";

defineProps<{ modelValue: CanvasLayoutMode; compact?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [mode: CanvasLayoutMode] }>();
</script>

<style lang="scss" scoped>
.layoutOptions {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  align-items: stretch;
  gap: 10px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;

  :deep(.el-radio) {
    height: auto;
    margin: 0;
    padding: 14px 10px;
    align-items: flex-start;
    background: var(--el-fill-color-extra-light);

    &.is-checked { background: var(--el-color-primary-light-9); }
    .el-radio__input { margin-top: 4px; }
    .el-radio__label { flex: 1; align-self: stretch; min-width: 0; padding-left: 8px; }
  }

  .cardLabel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    white-space: normal;
    strong { font-size: 13px; font-weight: 500; line-height: 18px; overflow-wrap: anywhere; }
    .layoutPreview { margin-top: auto; }
  }

  &.compact {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, max(118px, 22%)), 1fr));
    gap: 6px;
    :deep(.el-radio) { padding: 8px 6px; }
  }
}
</style>
