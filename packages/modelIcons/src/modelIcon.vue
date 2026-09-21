<template>
  <img v-if="icon" class="modelIcon" :class="{ monochrome: icon.monochrome }" :src="icon.src" :width="size" :height="size" :alt="model" />
  <span v-else class="modelIcon fallback" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.75}px` }" role="img" :aria-label="model || '未知模型'">?</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getModelIcon } from "./getModelIcon";

const props = withDefaults(defineProps<{ model: string; size?: number }>(), { size: 16 });
const icon = computed(() => getModelIcon(props.model));
</script>

<style scoped>
.modelIcon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  object-fit: contain;

  &.monochrome {
    .dark & {
      filter: invert(1);
    }
  }

  &.fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--el-fill-color, #f0f0f0);
    color: var(--el-text-color-secondary, #666);
    font-weight: 600;
    line-height: 1;
  }
}
</style>
