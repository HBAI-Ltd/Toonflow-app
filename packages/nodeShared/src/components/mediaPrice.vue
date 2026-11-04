<template>
  <el-tooltip v-model:visible="infoVisible" :content="priceLabel" :disabled="!priceLabel" placement="top" :showArrow="false" :trigger="['hover', 'focus']" :triggerKeys="[]" :popperStyle="{ maxWidth: '280px', lineHeight: '1.6', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }">
    <button type="button" class="mediaPrice" :aria-label="price?.price || priceLabel" :aria-busy="loading" @pointerdown.stop @click.stop="infoVisible = Boolean(priceLabel)">
      <span>{{ loading ? "正在估价…" : price ? price.price : "无法计算价格" }}</span>
      <icon-info-circle v-if="!loading && (!price || price.tips)" :size="14" aria-hidden="true" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, inject, onScopeDispose, ref, watch } from "vue";
import { ElTooltip } from "element-plus";
import { IconInfoCircle } from "@tabler/icons-vue";
import { subscribeNodeModels, useNodeAi, type NodeMediaPrice, type NodeMediaPriceRequest } from "@toonflow/nodes-scaffold/nodeAi";

const props = defineProps<{ input: Omit<NodeMediaPriceRequest, "directory">; supported: boolean }>();
const ai = useNodeAi();
const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
const price = ref<NodeMediaPrice | null>();
const infoVisible = ref(false);
const loading = ref(false);
const error = ref("");
const revision = ref(0);
const priceLabel = computed(() => !props.supported ? "当前供应商尚未提供预估价格，无法提前计算费用。你仍可发起生成，实际费用以供应商结算为准。" : loading.value ? "正在查询预估价格" : error.value
  ? `价格查询失败：${error.value}。请检查供应商配置或稍后重试。`
  : price.value ? price.value.tips : "当前模型或参数组合暂无预估价格。你仍可发起生成，实际费用以供应商结算为准。");

onScopeDispose(subscribeNodeModels(type => { if (type === "media") revision.value++; }));

function currentDirectory() {
  try { return getDirectory?.(); }
  catch { return undefined; }
}

watch([() => JSON.stringify(props.input), () => props.supported, currentDirectory, revision], ([serialized, supported, directory], _previous, onCleanup) => {
  price.value = undefined;
  error.value = "";
  loading.value = false;
  if (!supported) return;
  const controller = new AbortController();
  loading.value = true;
  // ACT: 仅底部设置挂载时查询；合并连续输入，素材只传路径，不在节点端读取文件。
  const timer = setTimeout(async () => {
    try {
      if (!directory) throw new Error("请先选择工作目录");
      const result = await ai.getMediaPrice({ ...JSON.parse(serialized), directory }, controller.signal);
      if (!controller.signal.aborted) price.value = result;
    } catch (failure) {
      if (!controller.signal.aborted) error.value = failure instanceof Error ? failure.message : "价格查询失败";
    } finally {
      if (!controller.signal.aborted) loading.value = false;
    }
  }, 800);
  onCleanup(() => {
    clearTimeout(timer);
    controller.abort();
  });
}, { immediate: true });
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
