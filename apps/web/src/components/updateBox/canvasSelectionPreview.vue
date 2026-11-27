<template>
  <div class="canvasSelectionPreview" role="img" :aria-label="translate('框选与多选')">
    <div class="pointerTool" inert><canvasToolButtons :buttons="['pointer']" selectedTool="select" /></div>
    <div class="canvasNodes" aria-hidden="true">
      <div class="selection">
        <div class="canvasNode selected"><icon-photo :size="17" /></div>
        <div class="canvasNode selected"><icon-video :size="17" /></div>
      </div>
      <div class="canvasNode"><icon-music :size="17" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import canvasToolButtons from "@/pages/workspace/components/canvasToolButtons.vue";
</script>

<style scoped lang="scss">
.canvasSelectionPreview {
  position: relative;
  max-width: 420px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ui-radius);
  background: var(--canvasGridBackground, var(--el-fill-color-extra-light));

  .pointerTool {
    display: inline-flex;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius);
    background: var(--el-bg-color-overlay);
  }

  .canvasNodes {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    margin-top: 8px;

    .selection {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px dotted var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .canvasNode {
      display: grid;
      min-height: 36px;
      place-items: center;
      border: 1px solid var(--el-border-color-darker);
      border-radius: var(--ui-radius);
      color: var(--el-text-color-secondary);
      background: var(--el-bg-color-overlay);

      &.selected { outline: 1px solid var(--el-color-primary); }
    }
  }
}
</style>
