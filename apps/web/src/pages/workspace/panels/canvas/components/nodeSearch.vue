<template>
  <el-dialog v-model="visible" title="画布节点搜索" width="min(480px, calc(100vw - 32px))" alignCenter appendToBody @opened="searchInput?.focus()">
    <div class="nodeSearch">
      <el-input
        ref="searchInput"
        v-model="query"
        :prefixIcon="IconSearch"
        placeholder="搜索节点名称或类型"
        aria-label="搜索画布节点"
        aria-controls="canvasSearchResults"
        :aria-activedescendant="results[activeIndex] ? `canvasSearchResult-${activeIndex}` : undefined"
        clearable
        @keydown="navigateResults" />
      <div id="canvasSearchResults" ref="resultList" class="resultList" role="listbox" aria-label="画布节点">
        <button
          v-for="(item, index) in results"
          :id="`canvasSearchResult-${index}`"
          :key="item.node.id"
          class="nodeResult"
          type="button"
          role="option"
          tabindex="-1"
          :aria-selected="activeIndex === index"
          @mouseenter="activeIndex = index"
          @click="selectNode(index)">
          <span class="nodeLabel">{{ item.label }}</span>
          <span class="nodeType">{{ item.node.type === 'canvasGroup' ? '分组' : item.node.type?.replace(/^remote-/, '') }}</span>
        </button>
        <p v-if="!results.length" class="empty">没有匹配的节点</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useVueFlow } from "@vue-flow/core";
import { IconSearch } from "@tabler/icons-vue";
import type { InputInstance } from "element-plus";

const props = defineProps<{ disabled?: boolean }>();
const flow = useVueFlow();
const visible = ref(false);
const query = ref("");
const activeIndex = ref(0);
const searchInput = ref<InputInstance>();
const resultList = ref<HTMLElement>();
const results = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase();
  return flow.getNodes.value.filter(node => !node.hidden).map(node => ({
    node, label: String(node.data.label || node.type || "未命名节点"),
  })).filter(item => `${item.label} ${item.node.type} ${item.node.id}`.toLocaleLowerCase().includes(keyword));
});
watch(query, () => { activeIndex.value = 0; });
watch(activeIndex, async index => {
  await nextTick();
  resultList.value?.children[index]?.scrollIntoView({ block: "nearest" });
});
watch(() => props.disabled, disabled => { if (disabled) visible.value = false; });

function open() {
  if (props.disabled) return;
  query.value = "";
  activeIndex.value = 0;
  visible.value = true;
}

function navigateResults(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent) || event.isComposing || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "ArrowDown") activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  else if (event.key === "ArrowUp") activeIndex.value = Math.max(activeIndex.value - 1, 0);
  else void selectNode(activeIndex.value);
}

async function selectNode(index: number) {
  const node = results.value[index]?.node;
  if (!node || props.disabled) return;
  visible.value = false;
  flow.removeSelectedElements();
  flow.addSelectedNodes([node]);
  flow.nodesSelectionActive.value = false;
  await nextTick();
  await flow.fitView({ nodes: [node.id], padding: 0.4, maxZoom: 1.4, duration: 200 });
}

defineExpose({ open });
</script>

<style lang="scss" scoped>
.nodeSearch {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .resultList {
    max-height: min(360px, 50vh);
    overflow-y: auto;

    .nodeResult {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: var(--el-border-radius-base);
      background: transparent;
      color: var(--el-text-color-primary);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &[aria-selected="true"] { background: var(--el-color-primary-light-9); }
      .nodeLabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .nodeType { flex-shrink: 0; color: var(--el-text-color-secondary); font-size: 12px; }
    }
    .empty { margin: 24px 0; color: var(--el-text-color-secondary); text-align: center; }
  }
}
</style>
