<template>
  <el-tooltip v-model:visible="infoVisible" :content="priceLabel" :disabled="!priceLabel" placement="top" :showArrow="false" :trigger="['hover', 'focus']" :triggerKeys="[]" :popperStyle="{ maxWidth: '280px', lineHeight: '1.6', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }">
    <button type="button" class="mediaPrice" :aria-label="state.price?.price || priceLabel" :aria-busy="state.loading" @pointerdown.stop @click.stop="infoVisible = Boolean(priceLabel)">
      <span>{{ state.loading ? "正在估价…" : state.price ? state.price.price : "无法计算价格" }}</span>
      <icon-info-circle v-if="!state.loading && (!state.price || state.price.tips)" :size="14" aria-hidden="true" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref } from "vue";
import { ElTooltip } from "element-plus";
import { IconInfoCircle } from "@tabler/icons-vue";
import { useNodeAi, type NodeMediaPriceRequest } from "@toonflow/nodes-scaffold/nodeAi";
import { useMediaPrice, type MediaQuote } from "../useMediaPrice";

const props = defineProps<{
  quote?: MediaQuote;
  input?: Omit<NodeMediaPriceRequest, "directory">;
  supported?: boolean;
}>();
const quote = props.quote ?? useMediaPrice(useNodeAi(), () => props.input!.mediaType, () => props.input, () => props.supported === true);
const { state } = quote;
quote.visible.value = true;
onScopeDispose(() => { quote.visible.value = false; });
const infoVisible = ref(false);
const priceLabel = computed(() => !state.value.supported ? "当前供应商尚未提供预估价格，无法提前计算费用。你仍可发起生成，实际费用以供应商结算为准。" : state.value.loading ? "正在查询预估价格" : state.value.error
  ? `价格查询失败：${state.value.error}。请检查供应商配置或稍后重试。`
  : state.value.price ? state.value.price.tips : "当前模型或参数组合暂无预估价格。你仍可发起生成，实际费用以供应商结算为准。");
</script>

<style lang="scss" scoped>
.mediaPrice {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  max-width: 160px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--el-text-color-secondary);
  font-family: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: help;

  > span { overflow: hidden; text-overflow: ellipsis; }
  > svg { flex-shrink: 0; transform: translateY(1px); }
  &:hover { color: var(--el-text-color-primary); }
  &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; border-radius: 2px; }
}
</style>
