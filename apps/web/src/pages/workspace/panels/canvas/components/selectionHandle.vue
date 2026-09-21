<template>
  <svg v-if="dragNodes.length && pointer" class="selectionConnection" aria-hidden="true">
    <path class="vue-flow__connection-path" :d="connectionPath" :class="{ valid: !!connections, invalid: !!target && !connections }" />
  </svg>
  <button
    v-if="connectionNodes.length && (nodes !== undefined || (nodesSelectionActive && !userSelectionActive && getSelectedNodes.length) || dragNodes.length)"
    class="selectionHandle nodrag nopan"
    :style="handleStyle"
    type="button"
    :aria-label="nodes !== undefined ? '连接分组节点' : '连接选中节点'"
    @pointerdown.stop.prevent="startConnection"
    @pointermove="moveConnection"
    @pointerup.stop="finishConnection"
    @pointercancel="clear"
    @mousedown.stop
    @click.stop
    @keydown.esc.stop="clear">
    <icon-circle-dashed :size="18" />
  </button>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, watchEffect, type ShallowRef } from "vue";
import { getBezierPath, getRectOfNodes, Position, useVueFlow, type GraphNode } from "@vue-flow/core";
import { IconCircleDashed } from "@tabler/icons-vue";
import type { NodeConnectionFeedback, NodeHandle } from "@toonflow/nodes-scaffold/connection";
import { getSelectionConnections } from "../selectionConnections";
import { getSelectionTree } from "../selectionNodes";

const props = defineProps<{ nodes?: GraphNode[] }>();
const emit = defineEmits<{
  start: [];
  release: [event: PointerEvent, nodes: GraphNode[]];
}>();
const flow = useVueFlow();
const { getSelectedNodes, nodesSelectionActive, userSelectionActive, viewport } = flow;
const selectionConnection = inject<ShallowRef<NodeConnectionFeedback | undefined>>("selectionConnection")!;
const sourceNodes = computed(() => props.nodes ?? getSelectedNodes.value);
const dragNodes = shallowRef<GraphNode[]>([]);
const connectionNodes = computed(() => getSelectionTree(
  dragNodes.value.length ? dragNodes.value : sourceNodes.value,
  flow.getNodes.value,
).filter(node => node.type !== "canvasGroup"));
const pointer = ref<{ x: number; y: number }>();
const target = shallowRef<{ node: GraphNode; handleId?: string; handleType?: NodeHandle["type"] }>();
const dragging = ref(false);
const anchor = computed(() => {
  const bounds = getRectOfNodes(dragNodes.value.length ? dragNodes.value : sourceNodes.value);
  const { x, y, zoom } = viewport.value;
  return { x: x + (bounds.x + bounds.width + 8) * zoom, y: y + (bounds.y + bounds.height / 2) * zoom };
});
const handleStyle = computed(() => ({
  left: `${anchor.value.x}px`,
  top: `${anchor.value.y}px`,
  transform: `translate(-50%, -50%) scale(${viewport.value.zoom})`,
}));
const connections = computed(() => target.value && target.value.handleType !== "source" && flow.nodesConnectable.value
  ? getSelectionConnections(connectionNodes.value, target.value.node, flow.getNodes.value, flow.getEdges.value, target.value.handleId)
  : undefined);
const connectionPath = computed(() => pointer.value ? getBezierPath({
  sourceX: anchor.value.x, sourceY: anchor.value.y, sourcePosition: Position.Right,
  targetX: pointer.value.x, targetY: pointer.value.y, targetPosition: Position.Left,
})[0] : "");
let feedback: NodeConnectionFeedback | undefined;

function clearFeedback() {
  if (feedback && selectionConnection.value === feedback) selectionConnection.value = undefined;
  feedback = undefined;
}

watchEffect(() => {
  const hovered = target.value;
  if (!dragging.value || !hovered) {
    clearFeedback();
    return;
  }
  const matchedHandles = new Set([
    ...(connections.value ?? []),
    ...flow.getEdges.value.filter(edge => edge.target === hovered.node.id && connectionNodes.value.some(node => node.id === edge.source)),
  ].map(edge => edge.targetHandle));
  const handles = ((hovered.node.data.handles as NodeHandle[] | undefined) ?? []).filter(handle => hovered.handleType
    ? handle.id === hovered.handleId && handle.type === hovered.handleType
    : handle.type === "target" && (!connections.value || matchedHandles.has(handle.id)));
  feedback = { nodeId: hovered.node.id, handles, status: connections.value ? "valid" : "invalid" };
  selectionConnection.value = feedback;
});

function clear() {
  dragging.value = false;
  clearFeedback();
  dragNodes.value = [];
  pointer.value = undefined;
  target.value = undefined;
}

function startConnection(event: PointerEvent) {
  if (event.button !== 0 || !flow.nodesConnectable.value || !connectionNodes.value.length) return;
  emit("start");
  dragNodes.value = [...sourceNodes.value];
  dragging.value = true;
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  moveConnection(event);
}

function moveConnection(event: PointerEvent) {
  if (!dragging.value) return;
  const bounds = flow.vueFlowRef.value!.getBoundingClientRect();
  pointer.value = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const handle = element?.closest(".vue-flow__handle");
  const nodeElement = element?.closest(".vue-flow__node");
  const node = nodeElement && flow.vueFlowRef.value?.contains(nodeElement) ? flow.findNode(nodeElement.getAttribute("data-id")!) : undefined;
  const handleId = handle?.getAttribute("data-handleid") ?? undefined;
  const handleType = handle ? (handle.classList.contains("target") ? "target" : "source") : undefined;
  if (target.value?.node === node && target.value?.handleId === handleId && target.value?.handleType === handleType) return;
  target.value = node ? { node, handleId, handleType } : undefined;
}

function finishConnection(event: PointerEvent) {
  if (!dragging.value) return;
  moveConnection(event);
  dragging.value = false;
  clearFeedback();
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  if (connections.value) {
    flow.addEdges(connections.value);
    flow.removeSelectedElements();
    nodesSelectionActive.value = false;
    clear();
  } else {
    target.value = undefined;
    emit("release", event, [...connectionNodes.value]);
  }
}

flow.onConnectStart(clear);
onBeforeUnmount(clear);
defineExpose({ clear });
</script>

<style lang="scss" scoped>
.selectionConnection {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;

  .valid {
    stroke: var(--el-color-primary);
  }

  .invalid {
    stroke: var(--el-color-danger);
  }
}

.selectionHandle {
  position: absolute;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  cursor: crosshair;
  touch-action: none;
}
</style>
