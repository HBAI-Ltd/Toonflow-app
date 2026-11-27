<template>
  <el-card
    v-if="visible"
    class="selectionToolbar nodrag nopan nowheel"
    shadow="never"
    :bodyStyle="{ padding: '4px' }"
    :style="toolbarStyle"
    @pointerdown.stop
    @mousedown.stop
    @click.stop
    @dblclick.stop
    @contextmenu.stop
    @keydown.stop
    @keydown.esc.prevent="colorMenuVisible = false">
    <div class="toolbarActions">
      <el-popover v-if="hasGroup" v-model:visible="colorMenuVisible" trigger="click" placement="bottom-start" :width="274" :showArrow="false" :disabled="busy || disabled">
        <template #reference>
          <el-button text class="colorButton" :disabled="busy || disabled" title="分组背景颜色" aria-label="分组背景颜色">
            <span class="colorPreview" :style="{ background: selectedColors[0]?.value }" />
          </el-button>
        </template>
        <div
          class="groupColors nodrag nopan nowheel"
          role="group"
          aria-label="分组背景颜色"
          @pointerdown.stop
          @mousedown.stop
          @click.stop
          @dblclick.stop
          @keydown.stop
          @keydown.esc.prevent="colorMenuVisible = false">
          <button
            v-for="color in colors"
            :key="color.value"
            type="button"
            class="colorSwatch"
            :style="{ background: color.value }"
            :title="color.label"
            :aria-label="color.label"
            :aria-pressed="selectedColors.every(item => item.value === color.value && item.opacity === 25)"
            :disabled="busy || disabled"
            @click="changeGroupColor(color.value)" />
          <el-color-picker
            class="customColor"
            :modelValue="customColor"
            showAlpha
            colorFormat="hex"
            :clearable="false"
            :teleported="false"
            :disabled="busy || disabled"
            title="自定义颜色和透明度"
            aria-label="自定义分组颜色和透明度"
            @change="changeGroupColor" />
        </div>
      </el-popover>
      <el-button
        v-for="action in layoutActions"
        :key="action.mode"
        text
        :icon="action.icon"
        :disabled="!canArrangeSelection"
        @click="operate(action.mode)">{{ action.label }}</el-button>
      <span class="toolbarDivider" aria-hidden="true" />
      <el-button text :icon="IconCopyPlus" :disabled="busy || disabled" @click="operate('duplicate')">创建副本</el-button>
      <el-button text :icon="IconBoxMultiple" :disabled="busy || disabled" @click="operate('group')">打组</el-button>
      <el-button text :icon="IconDeselect" :disabled="busy || disabled || !hasGroup" @click="operate('ungroup')">解组</el-button>
      <el-button text :icon="IconTrash" :disabled="busy || disabled || !canDelete" @click="emit('deleteSelection')">删除</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { getRectOfNodes, useVueFlow, type GraphNode, type Node, type XYPosition } from "@vue-flow/core";
import { ElButton, ElCard, ElColorPicker, ElMessage, ElPopover } from "element-plus";
import {
  IconCopyPlus, IconBoxMultiple, IconDeselect, IconTrash,
  IconLayoutGrid, IconLayoutColumns, IconLayoutRows,
} from "@tabler/icons-vue";
import { useNodeEvent } from "@toonflow/nodes-scaffold/nodeEvent";
import { finishGroupDrag, getSelectionRoots, getSelectionTree } from "../selectionNodes";
import { arrangeSelection, type ArrangeSelectionMode } from "../arrangeSelection";
import { remapNodeReferences } from "../canvasFiles";

const props = defineProps<{
  batchHistory: (action: () => Promise<void>) => Promise<void>;
  getSignal: () => AbortSignal;
  canDelete: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ deleteSelection: [] }>();
const flow = useVueFlow();
const busy = ref(false);
const colorMenuVisible = ref(false);
const colors = [
  { label: "灰色", value: "#808080" },
  { label: "红色", value: "#ef4444" },
  { label: "橙色", value: "#f98b28" },
  { label: "黄色", value: "#f8bd3e" },
  { label: "绿色", value: "#2acb70" },
  { label: "青色", value: "#0db5d0" },
  { label: "蓝色", value: "#3b82f6" },
  { label: "紫色", value: "#8b5cf6" },
  { label: "粉色", value: "#ec399d" },
  { label: "棕色", value: "#b7794e" },
  { label: "白色", value: "#e6e6e6" },
];
const layoutActions = [
  { mode: "horizontal", label: "水平排列", icon: IconLayoutColumns },
  { mode: "vertical", label: "垂直排列", icon: IconLayoutRows },
  { mode: "grid", label: "宫格排列", icon: IconLayoutGrid },
] as const;
const selectionRoots = computed(() => getSelectionRoots(flow.getSelectedNodes.value, flow.getNodes.value));
const canArrangeSelection = computed(() => !busy.value && !props.disabled && selectionRoots.value.length > 1
  && selectionRoots.value.every(node => node.draggable !== false
    && Number.isFinite(node.dimensions.width) && node.dimensions.width > 0
    && Number.isFinite(node.dimensions.height) && node.dimensions.height > 0));
const selectedGroups = computed(() => flow.getSelectedNodes.value.filter(node => node.type === "canvasGroup"));
const hasGroup = computed(() => selectedGroups.value.length > 0);
const selectedColors = computed(() => selectedGroups.value.map(node => {
  const style = typeof node.style === "function" ? node.style(node) : node.style;
  return {
    value: style?.["--groupColor"] ?? colors[0]!.value,
    opacity: Number.parseFloat(String(style?.["--groupOpacity"] ?? "25%")),
  };
}));
const customColor = computed(() => {
  const color = selectedColors.value[0];
  return color ? `${color.value}${Math.round(color.opacity / 100 * 255).toString(16).padStart(2, "0")}` : undefined;
});
const visible = computed(() => !props.disabled && !flow.userSelectionActive.value && flow.getSelectedNodes.value.length > 0
  && (flow.nodesSelectionActive.value || hasGroup.value));
watch(() => visible.value && hasGroup.value, value => {
  if (!value) colorMenuVisible.value = false;
});
const selectionBounds = computed(() => getRectOfNodes(flow.getSelectedNodes.value));
const toolbarStyle = computed(() => {
  const bounds = selectionBounds.value;
  const { x, y, zoom } = flow.viewport.value;
  return {
    "--selectionCenter": `${x + (bounds.x + bounds.width / 2) * zoom}px`,
    "--selectionTop": `${y + bounds.y * zoom - 12 - (hasGroup.value ? 30 * zoom : 0)}px`,
    "--canvasWidth": `${flow.dimensions.value.width}px`,
    "--canvasHeight": `${flow.dimensions.value.height}px`,
  };
});

function changeGroupColor(color: string | null) {
  if (busy.value || props.disabled || !color) return;
  const opacity = color.length === 9 ? Math.round(Number.parseInt(color.slice(7), 16) / 255 * 100) : 25;
  for (const node of selectedGroups.value) {
    const style = typeof node.style === "function" ? node.style(node) : node.style;
    flow.updateNode(node.id, { style: { ...style, "--groupColor": color.slice(0, 7), "--groupOpacity": `${opacity}%` } });
  }
  colorMenuVisible.value = false;
}

async function duplicateNodes(selection: GraphNode[], signal: AbortSignal, withEdges = true, positions?: Map<string, XYPosition>) {
  const nodes = getSelectionTree(selection, flow.getNodes.value);
  const roots = getSelectionRoots(nodes, flow.getNodes.value);
  const rootsIds = new Set(roots.map(node => node.id));
  const bounds = getRectOfNodes(nodes);
  const ids = new Map(nodes.map(node => [node.id, crypto.randomUUID()]));
  const snapshot = flow.toObject();
  const savedNodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const incomingEdges = withEdges ? snapshot.edges.filter(edge => ids.has(edge.target)) : [];
  const copies = await Promise.all(nodes.map(async node => {
    const patch = await useNodeEvent(node.id, flow).emit("copy");
    signal.throwIfAborted();
    const saved = savedNodes.get(node.id)!;
    const copy = JSON.parse(JSON.stringify({ ...saved, data: { ...saved.data, ...patch } })) as Node;
    remapNodeReferences(copy, ids);
    Reflect.deleteProperty(copy, "initialized");
    copy.id = ids.get(node.id)!;
    copy.parentNode = ids.get(saved.parentNode ?? "") ?? saved.parentNode;
    copy.position = positions ? { ...positions.get(node.id)! }
      : { x: saved.position.x + (rootsIds.has(node.id) ? bounds.width + 64 : 0), y: saved.position.y };
    copy.data = { ...copy.data, label: `${copy.data?.label || "未命名节点"} - 副本` };
    return copy;
  }));
  signal.throwIfAborted();
  if (nodes.some(node => flow.findNode(node.id) !== node)) throw new Error("节点已变化，请重新创建副本");
  const edges = incomingEdges.filter(edge => ids.has(edge.source) || flow.findNode(edge.source)).map(edge => ({
    ...JSON.parse(JSON.stringify(edge)),
    id: crypto.randomUUID(),
    source: ids.get(edge.source) ?? edge.source,
    target: ids.get(edge.target)!,
    selected: false,
  }));
  flow.addNodes(copies);
  flow.addEdges(edges);
  return { ids, rootIds: roots.map(node => ids.get(node.id)!) };
}

function groupNodes(selection: GraphNode[]) {
  const roots = getSelectionRoots(selection, flow.getNodes.value);
  if (!roots.length) return [];
  const rootIds = new Set(roots.map(node => node.id));
  const bounds = getRectOfNodes(roots);
  const parentNode = roots.every(node => node.parentNode === roots[0]!.parentNode) ? roots[0]!.parentNode : undefined;
  const parentPosition = flow.findNode(parentNode)?.computedPosition ?? { x: 0, y: 0 };
  const position = { x: bounds.x - 24, y: bounds.y - 40 };
  const id = crypto.randomUUID();
  const group: Node = {
    id,
    type: "canvasGroup",
    parentNode,
    position: { x: position.x - parentPosition.x, y: position.y - parentPosition.y },
    style: { width: `${bounds.width + 48}px`, height: `${bounds.height + 64}px` },
    connectable: false,
    expandParent: false,
    data: { label: "分组" },
  };
  const nodes: Node[] = flow.getNodes.value.map(node => rootIds.has(node.id) ? {
    ...node,
    parentNode: id,
    position: { x: node.computedPosition.x - position.x, y: node.computedPosition.y - position.y },
    extent: undefined,
    expandParent: false,
  } : node);
  nodes.splice(nodes.findIndex(node => rootIds.has(node.id)), 0, group);
  flow.setNodes(nodes);
  return [id];
}

function ungroupNodes(selection: GraphNode[]) {
  const groups = new Map(selection.filter(node => node.type === "canvasGroup").map(node => [node.id, node]));
  const promoted: string[] = [];
  for (const node of flow.getNodes.value) {
    if (!node.parentNode || !groups.has(node.parentNode) || groups.has(node.id)) continue;
    const visited = new Set<string>();
    let parentNode: string | undefined = node.parentNode;
    while (parentNode && groups.has(parentNode) && !visited.has(parentNode)) {
      visited.add(parentNode);
      parentNode = groups.get(parentNode)!.parentNode;
    }
    if (parentNode && visited.has(parentNode)) parentNode = undefined;
    const parentPosition = flow.findNode(parentNode)?.computedPosition ?? { x: 0, y: 0 };
    flow.updateNode(node.id, {
      parentNode,
      position: { x: node.computedPosition.x - parentPosition.x, y: node.computedPosition.y - parentPosition.y },
      extent: undefined,
      expandParent: false,
    });
    promoted.push(node.id);
  }
  flow.removeNodes([...groups.keys()], true, false);
  return [...selection.filter(node => !groups.has(node.id)).map(node => node.id), ...promoted];
}

function mergeGroups(selection: GraphNode[]) {
  const groups = getSelectionRoots(selection.filter(node => node.type === "canvasGroup"), flow.getNodes.value);
  if (groups.length < 2) throw new Error("请至少选择两个分组");
  const first = groups[0]!;
  const groupIds = new Set(groups.map(node => node.id));
  const bounds = getRectOfNodes(groups);
  const parentNode = groups.every(node => node.parentNode === first.parentNode) ? first.parentNode : undefined;
  const parentPosition = flow.findNode(parentNode)?.computedPosition ?? { x: 0, y: 0 };
  const style = typeof first.style === "function" ? first.style(first) : first.style;
  const merged: GraphNode = {
    ...first,
    parentNode,
    position: { x: bounds.x - parentPosition.x, y: bounds.y - parentPosition.y },
    dimensions: { width: bounds.width, height: bounds.height },
    style: { ...style, width: `${bounds.width}px`, height: `${bounds.height}px` },
  };
  const nodes: Node[] = flow.getNodes.value.flatMap(node => {
    if (groupIds.has(node.id)) return [];
    return node.parentNode && groupIds.has(node.parentNode) ? [{
      ...node,
      parentNode: first.id,
      position: { x: node.computedPosition.x - bounds.x, y: node.computedPosition.y - bounds.y },
      extent: undefined,
      expandParent: false,
    }] : [node];
  });
  const firstChild = nodes.findIndex(node => node.parentNode === first.id);
  nodes.splice(firstChild < 0 ? nodes.length : firstChild, 0, merged);
  flow.setNodes(nodes);
  return [first.id];
}

async function selectNodes(ids: string[], signal: AbortSignal) {
  await nextTick();
  signal.throwIfAborted();
  flow.removeSelectedElements();
  const nodes = ids.flatMap(id => flow.findNode(id) ?? []);
  flow.addSelectedNodes(getSelectionRoots(nodes, flow.getNodes.value));
  flow.nodesSelectionActive.value = true;
  flow.updateNodeInternals(ids);
}

function startDragCopy(selection: GraphNode[], withEdges: boolean) {
  const nodes = getSelectionTree(selection, flow.getNodes.value);
  if (busy.value || props.disabled || !nodes.length) return;
  const roots = getSelectionRoots(nodes, flow.getNodes.value);
  const startPositions = new Map(nodes.map(node => [node.id, { ...node.position }]));
  const positions = new Map(startPositions);
  const signal = props.getSignal();
  const ended = Promise.withResolvers<void>();
  const finish = () => ended.resolve();
  let copies: Map<string, string> | undefined;
  let started = false;

  function moveCopies() {
    for (const node of roots) {
      const copy = flow.findNode(copies?.get(node.id));
      if (copy) {
        copy.position = { ...positions.get(node.id)! };
        copy.dragging = true;
      }
    }
  }

  async function createCopies() {
    busy.value = true;
    signal.addEventListener("abort", finish, { once: true });
    try {
      await props.batchHistory(async () => {
        signal.throwIfAborted();
        const result = await duplicateNodes(selection, signal, withEdges, positions);
        copies = result.ids;
        moveCopies();
        await ended.promise;
        signal.throwIfAborted();
        const created = result.rootIds.flatMap(id => flow.findNode(id) ?? []);
        created.forEach(node => { node.dragging = false; });
        await nextTick();
        signal.throwIfAborted();
        finishGroupDrag(flow.getNodes.value, created);
      });
    } catch (error) {
      if (!signal.aborted) ElMessage.error(error instanceof Error ? error.message : "拖动复制失败");
    } finally {
      signal.removeEventListener("abort", finish);
      busy.value = false;
    }
  }

  return {
    update() {
      if (signal.aborted) return;
      // ACT: Vue Flow 固定拖动原节点 ID；同一帧还原原位置，只让副本跟随，松手后统一提交历史。
      for (const node of roots) {
        if (flow.findNode(node.id) !== node) continue;
        positions.set(node.id, { ...node.position });
        node.position = { ...startPositions.get(node.id)! };
        node.dragging = false;
      }
      moveCopies();
      if (!started) {
        started = true;
        void createCopies();
      }
    },
    finish,
  };
}

async function operate(command: "duplicate" | "group" | "ungroup" | "mergeGroup" | ArrangeSelectionMode) {
  if (busy.value || props.disabled) return;
  const selection = [...flow.getSelectedNodes.value];
  if (!selection.length) return;
  const signal = props.getSignal();
  busy.value = true;
  try {
    await props.batchHistory(async () => {
      signal.throwIfAborted();
      if (command === "duplicate" || command === "group" || command === "ungroup" || command === "mergeGroup") {
        const ids = command === "duplicate" ? (await duplicateNodes(selection, signal)).rootIds
          : command === "group" ? groupNodes(selection)
          : command === "mergeGroup" ? mergeGroups(selection) : ungroupNodes(selection);
        await selectNodes(ids, signal);
      } else {
        arrangeSelection(flow, selection, command);
      }
    });
  } catch (error) {
    if (!signal.aborted) ElMessage.error(error instanceof Error ? error.message : "选区操作失败");
  } finally {
    busy.value = false;
  }
}

defineExpose({ operate, startDragCopy, busy });
</script>

<style scoped lang="scss">
.selectionToolbar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 6;
  width: max-content;
  max-width: calc(100% - 16px);
  max-height: calc(100% - 72px);
  overflow-y: auto;
  transition-property: box-shadow;
  // translate 的百分比随工具栏实际尺寸变化，换行时仍贴近选区并避开顶部导航。
  transform: translate(
    clamp(8px, calc(var(--selectionCenter) - 50%), calc(var(--canvasWidth) - 100% - 8px)),
    clamp(64px, calc(var(--selectionTop) - 100%), calc(var(--canvasHeight) - 100% - 8px))
  );

  .toolbarActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2px;

    .el-button {
      max-width: 100%;
      min-height: 28px;
      height: auto;
      margin: 0;
      padding: 4px 8px;
      line-height: 1.35;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .colorButton {
      width: 28px;
      padding: 0;

      .colorPreview {
        width: 18px;
        height: 18px;
        border: 1px solid rgb(255 255 255 / 20%);
        border-radius: 50%;
      }
    }

    .toolbarDivider {
      height: 16px;
      margin: 0 4px;
      border-left: 1px solid var(--el-border-color-lighter);
    }
  }
}

.groupColors {
  display: grid;
  grid-template-columns: repeat(6, 28px);
  gap: 16px;

  :deep(.customColor) {
    width: 28px;
    height: 28px;

    &.is-disabled {
      opacity: 0.5;
    }

    .el-color-picker__trigger {
      padding: 0;
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 50%;
      background: radial-gradient(circle at 30% 25%, rgb(255 255 255 / 70%), transparent 60%),
        conic-gradient(#ef4444, #f8bd3e, #2acb70, #0db5d0, #3b82f6, #8b5cf6, #ec399d, #ef4444);
    }

    .el-color-picker__color {
      display: none;
    }
  }

  .colorSwatch {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid rgb(255 255 255 / 20%);
    border-radius: 50%;
    cursor: pointer;

    &[aria-pressed="true"],
    &:focus-visible {
      outline: 2px solid var(--el-text-color-primary);
      outline-offset: 3px;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
}
</style>
