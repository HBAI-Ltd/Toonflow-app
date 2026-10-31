<template>
  <span class="modelLabel">
    <modelIcon v-if="modelId" :model="modelId" aria-hidden="true" />
    <span class="labelText">{{ label }}</span>
    <el-tag v-if="providerId?.toLowerCase() === 'toonflow'" class="officialTag" type="info" size="small" effect="plain">官方</el-tag>
  </span>
</template>

<script setup lang="ts">
import { ElTag } from "element-plus";
import { modelIcon } from "@toonflow/model-icons";

defineProps<{ label: string; providerId?: string; modelId?: string }>();
</script>

<style scoped lang="scss">
.modelLabel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;

  .labelText {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .officialTag {
    flex-shrink: 0;
    height: 16px;
    padding: 0 4px;
    border-color: var(--el-border-color-lighter);
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    font-weight: 400;
  }
}
</style>
