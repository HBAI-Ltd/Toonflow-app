<template>
  <el-card class="projectLaunchCard" shadow="never" :bodyStyle="{ padding: '0', height: '100%' }">
    <button class="projectLaunch" type="button" :disabled="disabled || loading" :aria-busy="loading" title="选择空文件夹新建，或打开已有项目" @click="emit('create')">
      <span class="launchIcon">
        <icon-loader-2 v-if="loading" class="isLoading" :size="24" aria-hidden="true" />
        <icon-plus v-else :size="24" aria-hidden="true" />
      </span>
      <span class="launchText">
        <span class="launchTitle">新建项目</span>
        <span class="launchDescription">或打开已有项目</span>
      </span>
    </button>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ disabled: boolean; loading: boolean }>();
const emit = defineEmits<{ create: [] }>();
</script>

<style lang="scss" scoped>
.projectLaunchCard {
  position: relative;
  border-radius: calc(var(--ui-radius) * 2.5);
  border-color: var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  box-shadow: var(--el-box-shadow-lighter);

  &:focus-within {
    border-color: var(--el-color-primary-light-5);
  }

  .projectLaunch {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    height: 100%;
    min-height: 240px;
    padding: 20px;
    border: 0;
    border-radius: calc(var(--ui-radius) * 2.5);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: center;
    cursor: pointer;

    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    &:disabled { cursor: wait; opacity: 0.6; }
    .launchIcon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--el-color-primary);
      color: var(--el-color-white);

      .isLoading { animation: launchSpin 1.5s linear infinite; }

      @media (prefers-reduced-motion: reduce) {
        .isLoading { animation: none; }
      }
    }

    .launchText {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .launchTitle { font-size: 15px; font-weight: 500; line-height: 1.8; }
      .launchDescription { color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
    }
  }
}
@keyframes launchSpin {
  to { transform: rotate(360deg); }
}
</style>
