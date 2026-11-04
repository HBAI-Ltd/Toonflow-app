<template>
  <span class="modelLabel">
    <modelIcon v-if="modelId && modelIcon" :model="modelId" aria-hidden="true" />
    <span class="labelText">{{ label }}</span>
    <el-tag v-if="providerId?.toLowerCase() === 'toonflow'" class="officialTag" type="info" size="small" effect="plain">官方</el-tag>
  </span>
</template>

<script setup lang="ts">
import { ElTag } from "element-plus";
import * as modelIcons from "@toonflow/model-icons";

defineProps<{ label: string; providerId?: string; modelId?: string }>();
// ACT: 旧宿主缺少图标模块时保留文字标签，不让装饰图标阻断节点运行。
const modelIcon = modelIcons?.modelIcon;
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
