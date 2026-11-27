<template>
  <div class="canvasEmpty">
    <div class="emptyHint">
      <icon-click :size="24" aria-hidden="true" />
      <span>双击画布 自由生成节点</span>
    </div>
    <div class="emptyActions">
      <button
        v-for="item in actions"
        :key="item.type"
        class="emptyAction"
        type="button"
        :disabled="!availableNodes.some(node => node.type === item.type)"
        @pointerdown.stop
        @dblclick.stop
        @click.stop="emit('create', item.type)">
        <span class="actionIcon"><component :is="getNodeIcon(item.type) ?? IconBox" :size="22" aria-hidden="true" /></span>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBox, IconClick } from "@tabler/icons-vue";
import { getNodeIcon } from "../loadNodeComponent";

defineProps<{ availableNodes: { type: string }[] }>();
const emit = defineEmits<{ create: [type: string] }>();
const actions = [
  { type: "remote-imageGenerationNode", label: "图片生成" },
  { type: "remote-videoGenerationNode", label: "视频生成" },
  { type: "remote-audioGenerationNode", label: "音频生成" },
  { type: "remote-trumanMap", label: "白模预演" },
];
</script>

<style scoped lang="scss">
.canvasEmpty {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  pointer-events: none;
  user-select: none;

  .emptyHint {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  .emptyActions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 100%;

    .emptyAction {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 200px;
      max-width: 100%;
      min-height: 56px;
      padding: 6px 8px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 16px;
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      pointer-events: auto;
      transition: background-color 0.15s, border-color 0.15s;

      &:hover:not(:disabled) {
        background: var(--el-fill-color);
        border-color: var(--el-border-color-darker);
      }

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 3px;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .actionIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--el-fill-color-darker);
      }
    }
  }
}
</style>
