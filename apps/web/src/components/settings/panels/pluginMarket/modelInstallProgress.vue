<template>
  <div class="modelProgress">
    <div class="progressDetails">
      <bdi>{{ transferred }}</bdi>
      <bdi>{{ percentage }}%</bdi>
    </div>
    <el-progress :percentage="percentage" :showText="false" :strokeWidth="5"
      :aria-label="installPhaseLabel(progress)" :aria-valuetext="transferred" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LocalModelItem } from "@toonflow/server/localModels";
import { formatModelSize, installPhaseLabel } from "./modelInstallation";

const { progress } = defineProps<{ progress: NonNullable<LocalModelItem["progress"]> }>();
const percentage = computed(() => progress.total ? Math.min(100, Math.floor(progress.received * 100 / progress.total)) : 0);
const transferred = computed(() => `${formatModelSize(progress.received)} / ${formatModelSize(progress.total)}`);
</script>

<style scoped lang="scss">
.modelProgress {
  margin-block-start: 8px;
  .progressDetails {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 2px 8px;
    margin-block-end: 4px;
    color: var(--el-text-color-regular);
    font-size: var(--el-font-size-extra-small);
    font-variant-numeric: tabular-nums;
  }
}
</style>
