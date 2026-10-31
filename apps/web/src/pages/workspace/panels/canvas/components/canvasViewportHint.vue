<template>
  <div v-if="viewportEmpty && !dismissed" class="canvasViewportHint" @pointerdown.stop @click.stop @dblclick.stop @wheel.stop>
    <span class="hintText" role="status">当前视窗没有节点</span>
    <el-button class="returnButton" type="primary" text @click="fitView({ duration: 250 })">返回节点</el-button>
    <el-button class="closeButton" text aria-label="关闭提示" @click="dismissed = true">
      <icon-x :size="14" aria-hidden="true" />
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getNodesInside, useVueFlow } from "@vue-flow/core";
import { IconX } from "@tabler/icons-vue";

const { nodes, dimensions, viewport, fitView } = useVueFlow();
const dismissed = ref(false);
const viewportEmpty = computed(() => {
  const { width, height } = dimensions.value;
  return width > 0 && height > 0
    && nodes.value.some(node => !node.hidden)
    && !getNodesInside(nodes.value, { x: 0, y: 0, width, height }, viewport.value, true).length;
});

watch(viewportEmpty, empty => {
  if (!empty) dismissed.value = false;
});
</script>

<style scoped lang="scss">
.canvasViewportHint {
  position: absolute;
  bottom: 58px;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: calc(100% - 32px);
  box-sizing: border-box;
  padding: 4px 4px 4px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ui-radius-large);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: var(--el-box-shadow-light);
  transform: translateX(-50%);

  .hintText {
    min-width: 0;
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 18px;
  }

  .returnButton,
  .closeButton {
    flex-shrink: 0;
    height: 24px;
    margin: 0;
    border-radius: var(--ui-radius);

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }
  }

  .returnButton {
    padding: 0 6px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
  }

  .closeButton {
    width: 24px;
    padding: 0;
    color: var(--el-text-color-secondary);
  }
}

@container canvasWorkspace (max-width: 1040px) {
  .canvasViewportHint { bottom: 104px; }
}

@container canvasWorkspace (max-width: 768px) {
  :global(.vue-flow:has(.canvasMiniMap) .canvasViewportHint) { bottom: 270px; }
}
</style>
