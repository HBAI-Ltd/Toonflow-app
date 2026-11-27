<template>
  <teleport v-if="dragNodes.length && pointer && flow.vueFlowRef.value" :to="flow.vueFlowRef.value">
    <svg class="selectionConnection" aria-hidden="true">
      <path class="vue-flow__connection-path" :d="connectionPath" :class="{ valid: !!connections, invalid: !!target && !connections }" />
    </svg>
  </teleport>
  <button
    v-if="(nodes !== undefined || (nodesSelectionActive && !userSelectionActive && getSelectedNodes.length) || dragNodes.length) && connectionNodes.length"
    class="selectionHandle nodrag nopan"
    :style="{ transform: `translate(${anchor.x}px, ${anchor.y}px) translate(-50%, -50%)` }"
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
import { useNodeInputs } from "@toonflow/nodes-scaffold/nodeInputs";
import { getSelectionConnections } from "../selectionConnections";
import { getSelectionTree } from "../selectionNodes";

const props = defineProps<{ nodes?: GraphNode[] }>();
const emit = defineEmits<{
  start: [];
  release: [event: PointerEvent, nodes: GraphNode[]];
}>();
const flow = useVueFlow();
const { getTargetEdges } = useNodeInputs(flow);
const { getSelectedNodes, nodesSelectionActive, userSelectionActive, viewport } = flow;
const selectionConnection = inject<ShallowRef<NodeConnectionFeedback | undefined>>("selectionConnection")!;
const selectionLinkVisible = inject<ShallowRef<boolean>>("selectionLinkVisible")!;
const sourceNodes = computed(() => props.nodes ?? getSelectedNodes.value);
const dragNodes = shallowRef<GraphNode[]>([]);
const connectionNodes = computed(() => getSelectionTree(
  dragNodes.value.length ? dragNodes.value : sourceNodes.value,
  flow.getNodes.value,
).filter(node => node.type !== "canvasGroup"));
const sourceIds = computed(() => new Set(connectionNodes.value.map(node => node.id)));
const pointer = ref<{ x: number; y: number }>();
const target = shallowRef<{ node: GraphNode; handleId?: string; handleType?: NodeHandle["type"] }>();
const dragging = ref(false);
const anchor = computed(() => {
  const bounds = getRectOfNodes(dragNodes.value.length ? dragNodes.value : sourceNodes.value);
  return { x: bounds.x + bounds.width + 8, y: bounds.y + bounds.height / 2 };
});
function resolveConnections() {
  if (target.value && target.value.handleType !== "source" && flow.nodesConnectable.value) {
    return getSelectionConnections(connectionNodes.value, target.value.node, flow, target.value.handleId);
  }
}
const connections = computed(resolveConnections);
const connectionPath = computed(() => pointer.value ? getBezierPath({
  sourceX: viewport.value.x + anchor.value.x * viewport.value.zoom,
  sourceY: viewport.value.y + anchor.value.y * viewport.value.zoom, sourcePosition: Position.Right,
  targetX: pointer.value.x, targetY: pointer.value.y, targetPosition: Position.Left,
})[0] : "");
let feedback: NodeConnectionFeedback | undefined;
let connectionFrame = 0;
let lastPointer: PointerEvent | undefined;

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
  const matchedHandles = new Set(connections.value?.map(edge => edge.targetHandle));
  if (connections.value && !hovered.handleType) {
    for (const edge of getTargetEdges(hovered.node.id)) {
      if (sourceIds.value.has(edge.source)) matchedHandles.add(edge.targetHandle);
    }
  }
  const handles = ((hovered.node.data.handles as NodeHandle[] | undefined) ?? []).filter(handle => hovered.handleType
    ? handle.id === hovered.handleId && handle.type === hovered.handleType
    : handle.type === "target" && (!connections.value || matchedHandles.has(handle.id)));
  feedback = { nodeId: hovered.node.id, handles, status: connections.value ? "valid" : "invalid" };
  selectionConnection.value = feedback;
});

function clear() {
  if (!dragNodes.value.length) return;
  cancelAnimationFrame(connectionFrame);
  connectionFrame = 0;
  lastPointer = undefined;
  selectionLinkVisible.value = false;
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
  selectionLinkVisible.value = true;
  dragging.value = true;
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  updateConnection(event);
}

function drawConnection() {
  connectionFrame = 0;
  if (dragging.value && lastPointer) updateConnection(lastPointer);
}

function moveConnection(event: PointerEvent) {
  if (!dragging.value) return;
  lastPointer = event;
  if (!connectionFrame) connectionFrame = requestAnimationFrame(drawConnection);
}

function updateConnection(event: PointerEvent) {
  const bounds = flow.vueFlowRef.value?.getBoundingClientRect();
  if (!bounds) return;
  const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
  if (pointer.value?.x !== x || pointer.value.y !== y) pointer.value = { x, y };
  if (dragging.value) {
    // 与节点拖线共用 40px 边缘区；视口发生平移时，即使指针停住也要重新命中经过的节点。
    const velocity = (value: number, size: number) => value < 40 ? Math.min(40 - value, 40) / 40 : value > size - 40 ? -Math.min(value - size + 40, 40) / 40 : 0;
    const speed = flow.autoPanSpeed.value;
    if (flow.panBy({ x: velocity(x, bounds.width) * speed, y: velocity(y, bounds.height) * speed })) {
      lastPointer = event;
      connectionFrame = requestAnimationFrame(drawConnection);
    }
  }
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
  dragging.value = false;
  cancelAnimationFrame(connectionFrame);
  connectionFrame = 0;
  lastPointer = undefined;
  updateConnection(event);
  clearFeedback();
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  const confirmed = resolveConnections();
  if (confirmed) {
    flow.addEdges(confirmed);
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
  top: 0;
  left: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  pointer-events: auto;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  cursor: crosshair;
  touch-action: none;
}
</style>
