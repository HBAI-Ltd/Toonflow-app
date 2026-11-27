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
import { useVueFlow } from "@vue-flow/core";
import { IconX } from "@tabler/icons-vue";

const { nodes, dimensions, vueFlowRef, fitView } = useVueFlow();
const dismissed = ref(false);
const allOutside = ref(false);
const hasPendingNode = computed(() => nodes.value.some(node => !node.hidden && (node.dragging || !node.dimensions.width || !node.dimensions.height)));
const viewportEmpty = computed(() => allOutside.value && dimensions.value.width > 0 && dimensions.value.height > 0 && !hasPendingNode.value);

watch(vueFlowRef, (surface, _, cleanup) => {
  const layer = surface?.querySelector(".vue-flow__nodes");
  if (!surface || !layer) return;
  const visible = new Set<Element>();
  function update() {
    allOutside.value = !!layer?.childElementCount && !visible.size;
  }
  const intersections = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target.parentElement === layer && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    update();
  }, { root: surface, threshold: Number.EPSILON });
  function observe(element: Element) {
    // 首次相交结果在下一帧返回，挂载期间先不显示空视口提示。
    visible.add(element);
    intersections.observe(element);
  }
  const changes = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (!(node instanceof Element)) continue;
        intersections.unobserve(node);
        visible.delete(node);
      }
      for (const node of record.addedNodes) {
        if (node instanceof Element) observe(node);
      }
    }
    update();
  });
  for (const element of layer.children) observe(element);
  changes.observe(layer, { childList: true });
  cleanup(() => {
    changes.disconnect();
    intersections.disconnect();
    allOutside.value = false;
  });
}, { immediate: true, flush: "post" });

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
  [data-canvas-layout="default"] .canvasViewportHint { bottom: 104px; }
}

@container canvasWorkspace (max-width: 768px) {
  .vue-flow:has(.canvasMiniMap) .canvasViewportHint { bottom: 230px; }
  [data-canvas-layout="default"] .vue-flow:has(.canvasMiniMap) .canvasViewportHint { bottom: 270px; }
}

@container canvasWorkspace (max-width: 390px) {
  [data-agent-position="bottomRight"] .canvasViewportHint { bottom: 108px; }

  @media (max-height: 720px) {
    .sideToolbar .canvasViewportHint {
      left: calc(50% + 27px);
      max-width: calc(100% - 84px);
    }
  }
}
</style>
