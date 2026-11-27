<template>
  <span class="layoutPreview" aria-hidden="true">
    <span class="previewPrimary" :class="{ side: layout.side }">
      <component v-for="button in layout.primary" :is="previewIcons[button]" :key="button" />
      <span v-if="layout.agent === 'beside'" class="previewAgent beside" />
    </span>
    <span class="previewControls" :class="{ centered: layout.centerControls }">
      <component v-for="button in layout.controls" :is="previewIcons[button]" :key="button" />
    </span>
    <span v-if="layout.cornerSearch" class="previewSearch"><icon-search /></span>
    <span v-if="layout.agent !== 'beside'" class="previewAgent" :class="{ topRight: layout.agent === 'topRight' }" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconPlus, IconPointer, IconSearch, IconFolders, IconHelp, IconMap, IconPercentage } from "@tabler/icons-vue";
import { canvasLayouts, type CanvasLayoutMode } from "@/lib/canvasLayouts";

const { mode } = defineProps<{ mode: CanvasLayoutMode }>();
const layout = computed(() => canvasLayouts[mode]);
const previewIcons = { add: IconPlus, pointer: IconPointer, search: IconSearch, assets: IconFolders, help: IconHelp, view: IconMap, zoom: IconPercentage };
</script>

<style lang="scss" scoped>
.layoutPreview {
  position: relative;
  display: block;
  container-type: inline-size;
  width: 100%;
  aspect-ratio: 1.85;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
  background: var(--canvasGridBackground);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 7.5px 7.5px, var(--el-border-color) .5px, transparent .75px) 0 0 / 16px 16px;
  }

  .previewPrimary, .previewControls, .previewSearch {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 1px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-bg-color-overlay);
    svg { width: 6.25cqi; height: auto; }
  }
  .previewPrimary {
    left: 50%;
    bottom: 6%;
    transform: translateX(-50%);
    &.side {
      flex-direction: column;
      left: 4%;
      top: 50%;
      bottom: auto;
      transform: translateY(-50%);
    }
  }
  .previewControls {
    left: 4%;
    bottom: 6%;
    &.centered { left: 50%; transform: translateX(-50%); }
  }
  .previewSearch { top: 6%; right: 4%; }
  .previewAgent {
    position: absolute;
    right: 4%;
    bottom: 6%;
    width: 7cqi;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--el-color-primary);
    &.topRight { top: 6%; bottom: auto; }
    &.beside { left: calc(100% + 3px); right: auto; bottom: 50%; transform: translateY(50%); }
  }
}
</style>
