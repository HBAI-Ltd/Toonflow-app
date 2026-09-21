<template>
  <div class="nodeSkeleton" @wheel.capture="zoomCanvas" @dblclick.stop="focusNode">
    <el-dropdown
      ref="menu"
      trigger="contextmenu"
      virtualTriggering
      :virtualRef="menuAnchor"
      placement="bottom-start"
      :showArrow="false"
      :showTimeout="0"
      :hideTimeout="0"
      @command="handleCommand">
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="assetOutputs.length && saveNodeToAssets" command="saveAsset" :icon="IconFolderPlus">保存到素材库</el-dropdown-item>
          <el-dropdown-item :divided="!!(assetOutputs.length && saveNodeToAssets)" command="copy" :icon="IconCopy">复制节点</el-dropdown-item>
          <el-dropdown-item command="duplicate" :icon="IconCopyPlus">创建副本</el-dropdown-item>
          <el-dropdown-item command="delete" :icon="IconTrash">删除节点</el-dropdown-item>
          <el-dropdown-item divided command="clipboard" :icon="IconCopy" :disabled="!copyNodeToClipboard || copyingToClipboard">
            复制到剪贴板
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div
      v-if="topVisible && slotsVisible"
      class="floatingSlot topSlot nodrag nopan nowheel"
      :style="{ width: typeof topWidth === 'number' ? `${topWidth}px` : topWidth }"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
      @keydown.stop
      @contextmenu.stop>
      <slot name="top">
        <el-card class="mediaToolbar" shadow="never" :bodyStyle="{ padding: '6px' }">
          <el-button
            :icon="IconFolderPlus"
            :disabled="!assetOutputs.length || !saveNodeToAssets"
            text
            title="添加到素材库"
            aria-label="添加到素材库"
            @click.stop="handleCommand('saveAsset')" />
          <slot name="topActions" />
          <el-button
            :tag="downloadUrl ? 'a' : 'button'"
            :href="downloadUrl || undefined"
            :download="downloadName"
            :icon="IconDownload"
            :disabled="!downloadUrl"
            :loading="downloading"
            :aria-busy="downloading"
            text
            :title="downloading ? '正在保存…' : '下载'"
            aria-label="下载"
            @downloadstate="downloading = $event.detail"
            @click.stop />
          <el-button
            :icon="IconMaximize"
            :disabled="!downloadUrl"
            text
            title="全屏"
            aria-label="全屏"
            @click.stop="emit('fullscreen')" />
        </el-card>
      </slot>
    </div>
    <div
      v-if="bottomVisible && $slots.bottom && slotsVisible"
      class="floatingSlot bottomSlot nodrag nopan nowheel"
      :style="{ width: typeof bottomWidth === 'number' ? `${bottomWidth}px` : bottomWidth }"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
      @keydown.stop
      @contextmenu.stop>
      <slot name="bottom" />
    </div>
    <div class="titleBar">
      <component :is="icon ?? IconBox" class="titleIcon" :size="16" aria-hidden="true" />
      <input
        v-if="editingLabel"
        ref="labelInput"
        v-model="labelDraft"
        class="labelInput nodrag nopan"
        aria-label="节点名称"
        @pointerdown.stop
        @mousedown.stop
        @dblclick.stop
        @keydown.stop
        @keydown.enter="confirmLabel"
        @keydown.esc.prevent="editingLabel = false"
        @blur="saveLabel" />
      <span
        v-else
        class="labelText"
        tabindex="0"
        :title="`${label}（双击编辑名称）`"
        @dblclick.stop="editLabel"
        @keydown.enter.stop.prevent="editLabel">
        {{ label }}
      </span>
      <div class="nodeActions nodrag nopan" @pointerdown.stop @mousedown.stop @dblclick.stop>
        <el-button
          :icon="IconRefresh"
          :loading="loading || reloading"
          :disabled="loading || !reloadRemoteNode"
          text
          title="刷新节点"
          aria-label="刷新节点"
          @click.stop="reloadNode" />
        <el-button :icon="IconX" text title="移除节点" aria-label="移除节点" @click.stop="deleteNode" :loading="deleting" />
      </div>
    </div>
    <div class="cardContainer">
      <el-card
        class="contentCard"
        :class="{ selected: node.selected }"
        shadow="never"
        :bodyStyle="{ padding: '8px' }"
        :style="{ minHeight: `${cardHeight}px` }">
        <div v-if="loading" class="loadingContent" role="status" aria-label="节点加载中">
          <icon-loader2 class="loadingIcon" :size="24" aria-hidden="true" />
          <span>加载中...</span>
        </div>
        <slot v-else-if="previewReady" />
      </el-card>
      <template v-for="group in handleGroups" :key="group.type">
        <handle
          v-for="(item, index) in group.items"
          :id="item.id"
          :key="item.id"
          class="nodeHandle"
          :class="{
            connected: isHandleConnected(item),
            linking: localStartHandle?.id === item.id && localStartHandle.type === group.type,
          }"
          :type="group.type"
          :connectable="!loading"
          :position="group.position"
          :isValidConnection="validateConnection"
          :data-connection-status="getHandleStatus(item)"
          :style="{ top: `${((index + 1) / (group.items.length + 1)) * 100}%` }"
          :title="`${item.label ?? item.id} · ${Array.isArray(item.dataType) ? item.dataType.join(' / ') : item.dataType}`"
          :aria-label="`${item.label ?? item.id} · ${Array.isArray(item.dataType) ? item.dataType.join(' / ') : item.dataType}`"
          @pointermove="moveHandle"
          @pointerleave="resetHandle"
          @pointercancel="resetHandle">
          <component :is="isHandleConnected(item) ? IconCircleDot : IconCircleDashed" class="handleIcon" :size="18" aria-hidden="true" />
        </handle>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch, watchEffect, type Component, type ShallowRef } from "vue";
import { Handle, Position, getTransformForBounds, pointToRendererPoint, useNode, useVueFlow, wheelDelta } from "@vue-flow/core";
import {
  IconRefresh,
  IconX,
  IconTrash,
  IconCopy,
  IconCopyPlus,
  IconFolderPlus,
  IconDownload,
  IconMaximize,
  IconBox,
  IconCircleDashed,
  IconCircleDot,
  IconLoader2,
} from "@tabler/icons-vue";
import { ElCard, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from "element-plus";
import type { DropdownInstance } from "element-plus";
import { validateConnection } from "./connection";
import { useNodeEvent } from "./nodeEvent";
import type { NodeConnectionFeedback, NodeData, NodeHandle } from "./connection";
import type { NodeOutput } from "./values";

const topVisible = defineModel<boolean>("topVisible", { default: false });
const bottomVisible = defineModel<boolean>("bottomVisible", { default: false });
const emit = defineEmits<{ fullscreen: [] }>();
const downloading = ref(false);
const props = withDefaults(
  defineProps<
    NodeData & {
      icon?: Component;
      loading?: boolean;
      previewReady?: boolean;
      topWidth?: string | number;
      bottomWidth?: string | number;
      downloadUrl?: string;
      downloadName?: string;
    }
  >(),
  {
    label: "未命名节点",
    handles: () => [],
    outputs: () => ({}),
    previewReady: true,
    topWidth: "20vw",
    bottomWidth: "20vw",
  }
);
const handleGroups = computed(() => [
  { type: "target" as const, position: Position.Left, items: props.handles.filter((item) => item.type === "target") },
  { type: "source" as const, position: Position.Right, items: props.handles.filter((item) => item.type === "source") },
]);
const cardHeight = computed(() => Math.max(100, ...handleGroups.value.map((group) => (group.items.length + 1) * 44)));
const { id: nodeId, node } = useNode();
const selectionConnection = inject<ShallowRef<NodeConnectionFeedback | undefined>>("selectionConnection");
const nodeEvent = useNodeEvent();
node.isValidTargetPos = (...args) => nodeEvent.emit("canConnect", ...args);
const {
  d3Zoom,
  d3Selection,
  zoomActivationKeyCode,
  zoomOnPinch,
  setViewport,
  minZoom,
  maxZoom,
  viewport,
  vueFlowRef,
  addNodes,
  addEdges,
  toObject,
  getNodes,
  getSelectedNodes,
  findNode,
  addSelectedNodes,
  removeSelectedElements,
  removeNodes,
  removeEdges,
  updateNodeInternals,
  connectionLookup,
  connectionStartHandle,
  connectionEndHandle,
  connectionStatus,
  onPaneClick,
  onPaneContextMenu,
  onSelectionContextMenu,
  onConnectStart,
  onMoveStart,
  onNodeContextMenu,
  onNodeDragStart,
  onNodeClick,
  onSelectionStart,
} = useVueFlow();
const localStartHandle = computed(() => (connectionStartHandle.value?.nodeId === nodeId ? connectionStartHandle.value : undefined));
const localEndHandle = computed(() => (connectionEndHandle.value?.nodeId === nodeId ? connectionEndHandle.value : undefined));
const localSelectionConnection = computed(() => (selectionConnection?.value?.nodeId === nodeId ? selectionConnection.value : undefined));
const connectedHandles = computed<Set<string>>((previous) => {
  const connected = new Set(
    props.handles.filter((item) => connectionLookup.value.get(`${nodeId}-${item.type}-${item.id}`)?.size).map((item) => `${item.type}-${item.id}`)
  );
  return previous?.size === connected.size && [...connected].every((key) => previous.has(key)) ? previous : connected;
});

async function focusNode(event: MouseEvent) {
  const element = event.currentTarget as HTMLElement;
  await nextTick();
  const flowElement = vueFlowRef.value;
  if (!flowElement || !element.isConnected) return;
  const flowRect = flowElement.getBoundingClientRect();
  const agentWidth = Math.max(0, parseFloat(getComputedStyle(flowElement).getPropertyValue("--agentWidth")) || 0);
  const availableWidth = flowRect.width - agentWidth;
  if (availableWidth <= 0 || flowRect.height <= 0) return;
  const rects = [element, ...element.querySelectorAll<HTMLElement>(":scope > .floatingSlot")]
    .filter((item) => item.getClientRects().length)
    .map((item) => item.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const origin = pointToRendererPoint({ x: left - flowRect.left, y: top - flowRect.top }, viewport.value);
  const targetViewport = getTransformForBounds(
    {
      ...origin,
      width: (Math.max(...rects.map((rect) => rect.right)) - left) / viewport.value.zoom,
      height: (Math.max(...rects.map((rect) => rect.bottom)) - top) / viewport.value.zoom,
    },
    availableWidth, flowRect.height, minZoom.value, maxZoom.value, 0.2
  );
  await setViewport(targetViewport, { duration: 300 });
}

function zoomCanvas(event: WheelEvent) {
  if (document.fullscreenElement) return;
  if (!(zoomActivationKeyCode.value === true || (event.ctrlKey && zoomOnPinch.value)) || !d3Zoom.value || !d3Selection.value) return;
  const bounds = d3Selection.value.node()?.getBoundingClientRect();
  if (!bounds) return;
  event.preventDefault();
  event.stopPropagation();
  d3Zoom.value.scaleBy(d3Selection.value, 2 ** wheelDelta(event), [event.clientX - bounds.left, event.clientY - bounds.top]);
}

const slotsHiddenByInteraction = ref(false);
// ACT: 多选只操作节点；未选中的节点仍可通过 v-model 主动打开槽位。
const slotsVisible = computed(() => !slotsHiddenByInteraction.value && (!node.selected || getSelectedNodes.value.length <= 1));
onSelectionStart(() => {
  slotsHiddenByInteraction.value = true;
});
onNodeDragStart(({ nodes }) => {
  if (nodes.some((item) => item.id === nodeId)) slotsHiddenByInteraction.value = true;
});
onNodeClick(({ node: clickedNode }) => {
  if (clickedNode.id === nodeId) slotsHiddenByInteraction.value = false;
});
const editingLabel = ref(false);
const labelDraft = ref("");
const labelInput = ref<HTMLInputElement>();

const reloadRemoteNode = inject<((type: string) => Promise<void>) | undefined>("reloadRemoteNode", undefined);
const reloading = ref(false);
const deleting = ref(false);
const menu = ref<DropdownInstance>();
const menuAnchor = shallowRef({ getBoundingClientRect: () => new DOMRect() });
onPaneClick(() => menu.value?.handleClose());
onPaneContextMenu(() => menu.value?.handleClose());
onSelectionContextMenu(() => menu.value?.handleClose());
onConnectStart(() => menu.value?.handleClose());
onMoveStart(() => menu.value?.handleClose());
onNodeContextMenu(({ event, node }) => {
  if (node.id === nodeId) void openMenu(event);
  else menu.value?.handleClose();
});

async function reloadNode() {
  if (!reloadRemoteNode || reloading.value) return;
  reloading.value = true;
  try {
    await reloadRemoteNode(node.type);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "节点刷新失败");
  } finally {
    reloading.value = false;
  }
}

async function openMenu(event: MouseEvent | TouchEvent) {
  event.preventDefault();
  menu.value?.handleClose();
  const point = "changedTouches" in event ? event.changedTouches[0] : event;
  if (!point) return;
  menuAnchor.value = { getBoundingClientRect: () => new DOMRect(point.clientX, point.clientY, 0, 0) };
  await nextTick();
  menu.value?.handleOpen();
}

async function deleteNode() {
  if (deleting.value) return;
  deleting.value = true;
  try {
    await nodeEvent.emit("delete");
    removeNodes(nodeId);
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(message || (error instanceof Error ? error.message : "节点删除失败"));
  } finally {
    deleting.value = false;
  }
}

const copyNodeToClipboard = inject<((node: { type?: string; data: NodeData }) => Promise<void>) | undefined>("copyNodeToClipboard", undefined);
const copyingToClipboard = ref(false);
const saveNodeToAssets = inject<((label: string, outputs: { label: string; output: NodeOutput }[]) => void) | undefined>(
  "saveNodeToAssets",
  undefined
);
const assetOutputs = computed(() =>
  props.handles.flatMap((handle) => {
    const output = props.outputs[handle.id];
    if (handle.type !== "source" || !output || (output.dataType === "STRING" && !output.value.trim())) return [];
    return [{ label: handle.label ?? handle.id, output }];
  })
);

async function handleCommand(command: string) {
  if (command === "saveAsset") saveNodeToAssets?.(props.label, assetOutputs.value);
  if (command === "clipboard" && copyNodeToClipboard && !copyingToClipboard.value) {
    copyingToClipboard.value = true;
    try {
      const patch = await nodeEvent.emit("copy");
      const data = { ...node.data, ...patch };
      await copyNodeToClipboard({ type: node.type, data });
      ElMessage.success("已复制，可在其他画布粘贴");
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "节点复制失败");
    } finally {
      copyingToClipboard.value = false;
    }
  }
  if (command === "delete") void deleteNode();
  if (command === "copy" || command === "duplicate") {
    let data: NodeData;
    try {
      const patch = await nodeEvent.emit("copy");
      data = JSON.parse(JSON.stringify({ ...node.data, ...patch }));
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "节点复制失败");
      return;
    }
    if (findNode(nodeId) !== node) return;
    const id = crypto.randomUUID();
    const incomingEdges = command === "duplicate" ? toObject().edges.filter((edge) => edge.target === nodeId) : [];
    const copyPosition = { x: node.position.x, y: node.position.y + node.dimensions.height + 32 };
    const nearbyNodes = getNodes.value
      .filter(
        (item) =>
          item.parentNode === node.parentNode &&
          item.position.x < copyPosition.x + node.dimensions.width &&
          item.position.x + item.dimensions.width > copyPosition.x
      )
      .sort((a, b) => a.position.y - b.position.y);
    for (const item of nearbyNodes) {
      if (copyPosition.y < item.position.y + item.dimensions.height + 32 && copyPosition.y + node.dimensions.height + 32 > item.position.y)
        copyPosition.y = item.position.y + item.dimensions.height + 32;
    }
    removeSelectedElements();
    addNodes({
      id,
      zIndex: node.zIndex,
      type: node.type,
      position: copyPosition,
      data: { ...data, label: `${props.label} - 副本` },
      parentNode: node.parentNode,
    });
    await nextTick();
    addSelectedNodes([findNode(id)!]);
    addEdges(incomingEdges.map((edge) => ({ ...JSON.parse(JSON.stringify(edge)), id: crypto.randomUUID(), target: id, selected: false })));
  }
}

async function editLabel() {
  labelDraft.value = props.label;
  editingLabel.value = true;
  await nextTick();
  labelInput.value?.select();
}

function saveLabel() {
  if (!editingLabel.value) return;
  const label = labelDraft.value.trim();
  if (label) node.data.label = label;
  editingLabel.value = false;
}

function confirmLabel(event: KeyboardEvent) {
  if (event.isComposing) return;
  event.preventDefault();
  saveLabel();
}

function moveHandle(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  // 以 Handle 中心为原点，按画布缩放还原距离，限制总偏移半径为 6px。
  const x = ((event.clientX - rect.left - rect.width / 2) / rect.width) * 18;
  const y = ((event.clientY - rect.top - rect.height / 2) / rect.height) * 18;
  const strength = Math.min(0.3, 6 / (Math.hypot(x, y) || 1));
  element.style.setProperty("--handleX", `${x * strength}px`);
  element.style.setProperty("--handleY", `${y * strength}px`);
}

function resetHandle(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement;
  element.style.removeProperty("--handleX");
  element.style.removeProperty("--handleY");
}

function isHandleConnected(item: NodeHandle) {
  return connectedHandles.value.has(`${item.type}-${item.id}`);
}

function getHandleStatus(item: NodeHandle) {
  const selection = localSelectionConnection.value;
  if (selection?.handles.some((handle) => handle.id === item.id && handle.type === item.type)) return selection.status;
  const target = localEndHandle.value;
  return target?.id === item.id && target.type === item.type ? connectionStatus.value : null;
}

watchEffect(() => {
  if (props.loading) return;
  // 仅同步端口快照供跨节点校验；端口状态由具体 node 维护。
  if (JSON.stringify(node.data.handles) !== JSON.stringify(props.handles)) node.data.handles = props.handles.map((item) => ({ ...item }));
});
watchEffect(() => {
  if (props.loading) return;
  // 输出由 node 持有，画布仅共享当前值；不使用 JSON 比较或触发端口重测。
  node.data.outputs = props.outputs;
});
// 比较内容，避免内联数组的新引用触发渲染循环。
watch(
  () => JSON.stringify([props.label, props.handles]),
  () => {
    if (props.loading) return;
    removeEdges((edges) =>
      edges.filter(
        (edge) =>
          (edge.source === nodeId && !props.handles.some((item) => item.type === "source" && item.id === edge.sourceHandle)) ||
          (edge.target === nodeId && !props.handles.some((item) => item.type === "target" && item.id === edge.targetHandle))
      )
    );
    updateNodeInternals([nodeId]);
  },
  { flush: "post" }
);
</script>

<style scoped>
.nodeSkeleton {
  position: relative;
  width: 220px;
  color: var(--el-text-color-primary);
  text-align: left;

  &:hover .cardContainer .nodeHandle .handleIcon {
    opacity: 1;
  }

  &:hover .titleBar .nodeActions {
    visibility: visible;
  }

  .floatingSlot {
    position: absolute;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);

    &.topSlot {
      bottom: calc(100% + 12px);
    }
    &.bottomSlot {
      top: calc(100% + 12px);
    }

    .mediaToolbar {
      :deep(.el-button) {
        width: 32px;
        height: 32px;
        margin: 0;
        padding: 0;
      }
    }
  }

  .titleBar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px 8px;
    font-size: 14px;
    line-height: 20px;

    .titleIcon {
      flex-shrink: 0;
    }

    .labelText {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: grab;
      user-select: none;

      &:active {
        cursor: grabbing;
      }
    }

    .labelInput {
      flex: 1;
      min-width: 0;
      width: 100%;
      padding: 0 4px;
      border: 1px solid var(--el-color-primary);
      border-radius: var(--el-border-radius-small);
      outline: none;
      background: var(--el-bg-color);
      color: inherit;
      font: inherit;
      line-height: inherit;
    }

    .nodeActions {
      visibility: hidden;
      display: flex;
      flex-shrink: 0;
      gap: 2px;

      .el-button {
        width: 24px;
        height: 24px;
        margin: 0;
        padding: 0;
      }
    }
  }

  .cardContainer {
    position: relative;

    .contentCard.selected {
      border-color: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-border-color-light));
    }

    .contentCard .loadingContent {
      display: flex;
      min-height: 84px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      .loadingIcon {
        color: var(--el-color-primary);
        animation: nodeLoading 1s linear infinite;
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      }
    }

    .nodeHandle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: 0;
      background: transparent;
      color: var(--el-text-color-secondary);

      &.vue-flow__handle-left {
        left: -12px;
      }

      &.vue-flow__handle-right {
        right: -12px;
      }

      &::before {
        content: "";
        position: absolute;
        inset: -13px;
        border-radius: 50%;
      }

      .handleIcon {
        pointer-events: none;
        opacity: 0;
        transform: translate(var(--handleX, 0px), var(--handleY, 0px));
        transition: transform 120ms ease-out, opacity 120ms ease-out;
      }

      &.connected .handleIcon,
      &.linking .handleIcon,
      &.connecting .handleIcon,
      &[data-connection-status] .handleIcon {
        opacity: 1;
      }

      &:hover,
      &.linking,
      &.connecting,
      &[data-connection-status="valid"] {
        color: var(--el-color-primary);
      }

      &[data-connection-status="invalid"] {
        color: var(--el-color-danger);
        cursor: not-allowed;
      }

      @media (prefers-reduced-motion: reduce) {
        .handleIcon {
          transform: none;
          transition: none;
        }
      }
    }
  }
}
@keyframes nodeLoading {
  to {
    transform: rotate(360deg);
  }
}
</style>
