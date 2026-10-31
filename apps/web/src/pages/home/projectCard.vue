<template>
  <el-card class="projectCard" shadow="never" :bodyStyle="{ padding: '0', height: '100%' }">
    <button class="projectEntry" type="button" :disabled="disabled" :title="project.directory" :aria-label="`${translate(actionLabel)} ${project.name}`" @click="emit('select')">
      <projectCover :directory="project.directory" />
      <span class="projectInfo">
        <span class="projectName" :title="project.name">{{ project.name }}</span>
        <span class="projectTime">最近打开 {{ new Date(project.lastOpenedAt).toLocaleString(locale, { hour12: false }) }}</span>
      </span>
    </button>
    <div v-if="$slots.actions" class="projectActions" :class="{ actionsVisible }">
      <slot name="actions" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { locale, translate } from "@toonflow/i18n/vue";
import type { Project } from "@/stores/workspace";
import projectCover from "./projectCover.vue";

withDefaults(defineProps<{
  project: Project;
  disabled?: boolean;
  actionLabel?: string;
  actionsVisible?: boolean;
}>(), { actionLabel: "打开项目" });
const emit = defineEmits<{ select: [] }>();
</script>

<style lang="scss" scoped>
.projectCard {
  position: relative;
  border-radius: calc(var(--ui-radius) * 2.5);
  border-color: var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  box-shadow: var(--el-box-shadow-lighter);

  &:focus-within { border-color: var(--el-color-primary-light-5); }

  .projectEntry {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 240px;
    padding: 0;
    border: 0;
    border-radius: calc(var(--ui-radius) * 2.5);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    &:disabled { cursor: wait; opacity: 0.6; }

    .projectInfo {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      min-width: 0;
      margin-top: auto;
      padding: 12px 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      background: transparent;

      .projectName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.5;
      }

      .projectTime { font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }
    }
  }

  .projectActions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 4px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;

    :deep(.el-button) {
      width: 32px;
      height: 32px;
      margin: 0;
      padding: 0;
      box-shadow: var(--el-box-shadow-lighter);
    }
  }

  &:hover .projectActions, &:focus-within .projectActions, .projectActions.actionsVisible { opacity: 1; pointer-events: auto; }

  @media (hover: none), (any-pointer: coarse) {
    .projectActions { opacity: 1; pointer-events: auto; }
  }

  @media (prefers-reduced-motion: reduce) {
    .projectActions { transition: none; }
  }
}
</style>
