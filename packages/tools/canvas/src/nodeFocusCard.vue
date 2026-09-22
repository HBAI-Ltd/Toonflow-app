<template>
  <div v-if="nodes.length" class="nodeFocusCard" @keydown.stop @keyup.stop>
    <div class="nodeFocusChips">
      <button
        v-for="item in nodes"
        :key="item.nodeId"
        type="button"
        class="nodeFocusChip"
        :title="`聚焦节点：${item.label}`"
        :aria-label="`聚焦节点：${item.label}`"
        @click="focusNode(item.nodeId)">
        <icon-focus2 :size="14" aria-hidden="true" />
        <span class="nodeFocusName">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick } from "vue";
import { ElMessage } from "element-plus";
import "element-plus/es/components/base/style/css";
import "element-plus/es/components/message/style/css";
import { IconFocus2 } from "@tabler/icons-vue";
import type { ToolCall, CanvasContext } from "@toonflow/tools-scaffold/runtime";

const props = defineProps<{ tool: ToolCall; directory?: string }>();

type NodeSummary = { nodeId: string; label: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toSummary(node: unknown): NodeSummary | undefined {
  if (!node || typeof node !== "object") return undefined;
  const { id, data } = node as { id?: unknown; data?: { label?: unknown } };
  if (typeof id !== "string") return undefined;
  return { nodeId: id, label: typeof data?.label === "string" && data.label.trim() ? data.label : id };
}

const nodeSummaries = computed<NodeSummary[]>(() => {
  const args = props.tool.args ?? {};
  if (props.tool.name === "nodeTools") {
    return typeof args.nodeId === "string" && args.nodeId ? [{ nodeId: args.nodeId, label: args.nodeId }] : [];
  }
  if (props.tool.status !== "success") return [];
  let result: Record<string, unknown>;
  try {
    result = asRecord(JSON.parse(props.tool.result ?? "{}"));
  } catch {
    result = {};
  }
  const summaries = [toSummary(result.node)];
  if (Array.isArray(result.nodes)) summaries.push(...result.nodes.map(entry => toSummary(asRecord(entry).node)));
  const ids: unknown[] = [];
  for (const value of [result.nodeIds, result.selectedNodeIds, result.arrangedNodeIds, args.nodeIds]) {
    if (Array.isArray(value)) ids.push(...value);
  }
  for (const value of [args.moves, args.renames]) {
    if (Array.isArray(value)) ids.push(...value.map(entry => asRecord(entry).nodeId));
  }
  if (Array.isArray(args.connections)) {
    ids.push(...args.connections.flatMap(entry => [asRecord(entry).source, asRecord(entry).target]));
  }
  const unique = new Map<string, NodeSummary>();
  for (const item of summaries) if (item) unique.set(item.nodeId, item);
  for (const id of ids) if (typeof id === "string" && id && !unique.has(id)) unique.set(id, { nodeId: id, label: id });
  return [...unique.values()];
});

const getCanvas = inject<() => CanvasContext | undefined>("canvas");
const activateCanvasPanel = inject<() => Promise<boolean>>("activateCanvasPanel");
const nodes = computed(() => {
  const canvas = getCanvas?.();
  return nodeSummaries.value.map(item => ({ ...item, label: canvas?.getNodeLabel?.(item.nodeId) || item.label }));
});

async function focusNode(nodeId: string) {
  if (await activateCanvasPanel?.() === false) return;
  await nextTick();
  const canvas = getCanvas?.();
  if (!canvas) {
    ElMessage.error("画布尚未就绪");
    return;
  }
  try {
    await canvas.call({ name: "fitCanvas", args: { nodeIds: [nodeId] } });
    await canvas.call({ name: "selectNodes", args: { nodeIds: [nodeId] } });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "聚焦节点失败");
  }
}
</script>

<style scoped lang="scss">
.nodeFocusCard {
  min-width: 0;
  font-size: 12px;

  .nodeFocusChips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .nodeFocusChip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      max-width: min(100%, 180px);
      padding: 2px 6px;
      font: inherit;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border: 1px solid transparent;
      border-radius: var(--ui-radius, 6px);
      cursor: pointer;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 2px;
      }

      svg {
        flex-shrink: 0;
      }

      .nodeFocusName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
