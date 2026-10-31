<template>
  <img class="modelIcon" :class="{ monochrome: icon.monochrome }" :src="icon.src" :width="size" :height="size" :alt="model || '未知模型'" />
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
}
</style>
