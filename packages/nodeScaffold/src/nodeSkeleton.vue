<template>
  <div v-if="documentTarget" class="nodeDocumentPlaceholder" :style="canvasSize" aria-hidden="true" />
  <teleport :to="documentTarget ?? 'body'" :disabled="!documentTarget">
  <div ref="skeletonElement" v-bind="boundAttrs" class="nodeSkeleton" :class="{ documentNode: documentTarget, userSized: userSized, nodeSelected: node.selected, nodeResizing: !!resizeState }" @wheel.capture="zoomCanvas" @dblclick.stop="focusNode" @contextmenu="documentTarget && openMenu($event)">
    <el-dropdown
      v-if="!readOnly"
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
      v-if="!readOnly && (documentTarget || (topVisible && slotsVisible))"
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
            @click.stop="handleCommand('saveAsset')">添加到素材库</el-button>
          <slot name="topActions" />
          <el-divider direction="vertical" />
          <slot name="topRightActions" />
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
            v-if="fullscreenVisible"
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
      v-if="!readOnly && $slots.bottom && (documentTarget || (bottomVisible && slotsVisible))"
      class="floatingSlot bottomSlot nodrag nopan nowheel"
      :style="{ width: typeof bottomWidth === 'number' ? `${bottomWidth}px` : bottomWidth }"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
      @keydown.stop
      @contextmenu.stop>
      <slot name="bottom" />
    </div>
    <div v-show="!documentTarget" class="titleBar">
      <component :is="icon ?? IconBox" class="titleIcon" :size="16" aria-hidden="true" />
      <input
        v-if="editingLabel && !readOnly"
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
        :tabindex="readOnly ? undefined : 0"
        :title="readOnly ? label : `${label}（双击编辑名称）`"
        @dblclick="!readOnly && ($event.stopPropagation(), editLabel())"
        @keydown.enter.stop.prevent="editLabel">
        {{ label }}
      </span>
      <div v-if="!readOnly" class="nodeActions nodrag nopan" @pointerdown.stop @mousedown.stop @dblclick.stop>
        <el-button
          :icon="IconRefresh"
          :loading="loading || reloading"
          :disabled="loading || !reloadRemoteNode"
          text
          title="刷新节点"
          aria-label="刷新节点"
          @click.stop="reloadNode" />
        <el-button :icon="IconTrash" text title="移除节点" aria-label="移除节点" @click.stop="deleteNode" :loading="deleting" />
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
        <slot v-else-if="previewReady || documentTarget" />
      </el-card>
      <template v-for="group in handleGroups" :key="group.type">
        <handle
          v-for="(item, index) in group.items"
          :id="item.id"
          :key="item.id"
          v-show="!documentTarget"
          class="nodeHandle"
          :class="{
            connected: isHandleConnected(item),
            connectedNodeActive: isHandleNodeActive(item),
            linking: localStartHandle?.id === item.id && localStartHandle.type === group.type,
          }"
          :type="group.type"
          :connectable="!readOnly && !loading"
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
    <button
      v-if="resizeEnabled"
      class="resizeCorner nodrag nopan"
      type="button"
      aria-label="调整节点大小"
      @pointerdown.stop.prevent="startResize"
      @pointermove.stop="moveResize"
      @pointerup.stop="finishResize"
      @pointercancel="finishResize"
      @lostpointercapture="finishResize"
      @mousedown.stop
      @click.stop
      @dblclick.stop />
  </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onScopeDispose, ref, shallowRef, useAttrs, watch, watchEffect, type Component, type ShallowRef } from "vue";
import { Handle, Position, getTransformForBounds, pointToRendererPoint, useNode, useVueFlow, wheelDelta, type GraphNode } from "@vue-flow/core";
import {
  IconRefresh,
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
import { ElCard, ElButton, ElDivider, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from "element-plus";
import type { DropdownInstance } from "element-plus";
import { validateConnection } from "./connection";
import { useNodeEvent } from "./nodeEvent";
import type { NodeConnectionFeedback, NodeData, NodeHandle } from "./connection";
import type { NodeOutput } from "./values";
import type { NodeDocumentContext } from "./nodeDocument";

defineOptions({ inheritAttrs: false });

const topVisible = defineModel<boolean>("topVisible", { default: false });
const bottomVisible = defineModel<boolean>("bottomVisible", { default: false });
const emit = defineEmits<{ fullscreen: [] }>();
const downloading = ref(false);
const props = withDefaults(
  defineProps<
    NodeData & {
      icon?: Component;
      loading?: boolean;
      readOnly?: boolean;
      previewReady?: boolean;
      topWidth?: string | number;
      bottomWidth?: string | number;
      downloadUrl?: string;
      downloadName?: string;
      fullscreenVisible?: boolean;
    }
  >(),
  {
    label: "未命名节点",
    handles: () => [],
    outputs: () => ({}),
    previewReady: true,
    readOnly: false,
    fullscreenVisible: true,
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
const documentContext = inject<NodeDocumentContext | undefined>("nodeDocument", undefined);
const documentTarget = computed(() => props.readOnly ? undefined : documentContext?.targets.get(nodeId));
const skeletonElement = ref<HTMLElement>();
const canvasSize = shallowRef<{ width: string; height: string }>();
let documentLease: symbol | undefined;
function mountDocument(target: HTMLElement) {
  if (props.readOnly) throw new Error("只读节点不能挂载到工作区文档");
  const element = skeletonElement.value;
  if (!documentContext || !element || !target.isConnected) throw new Error("节点视图尚未就绪");
  if (!documentTarget.value) canvasSize.value = {
    width: `${element.offsetWidth || node.dimensions.width || 220}px`,
    height: `${element.offsetHeight || node.dimensions.height || 128}px`,
  };
  const lease = Symbol();
  documentLease = lease;
  // ACT: 只移动原节点的界面，保留画布中的运行实例和尺寸；同一节点仅允许一个文档显示位置。
  documentContext.targets.set(nodeId, target);
  return () => {
    if (documentLease !== lease) return;
    documentLease = undefined;
    documentContext.targets.delete(nodeId);
    void nextTick(() => {
      if (!documentTarget.value) updateNodeInternals([nodeId]);
    });
  };
}
watch(() => props.loading, loading => {
  if (props.readOnly) return;
  if (loading) {
    if (documentContext?.mounts.get(nodeId) === mountDocument) documentContext.mounts.delete(nodeId);
  } else documentContext?.mounts.set(nodeId, mountDocument);
}, { immediate: true });
onScopeDispose(() => {
  documentLease = undefined;
  if (documentContext?.mounts.get(nodeId) !== mountDocument) return;
  documentContext.mounts.delete(nodeId);
  documentContext.targets.delete(nodeId);
});
const batchHistory = inject<((action: () => Promise<void>) => Promise<void>) | undefined>("batchCanvasHistory", undefined);
const resizeState = shallowRef<{
  node: GraphNode;
  element: HTMLElement;
  pointerId: number;
  point: { x: number; y: number };
  width: number;
  height: number;
  chrome: number;
  resolve: () => void;
}>();
const selectionConnection = inject<ShallowRef<NodeConnectionFeedback | undefined> | undefined>("selectionConnection", undefined);
const nodeEvent = useNodeEvent();
if (!props.readOnly) node.isValidTargetPos = (...args) => !props.readOnly && nodeEvent.emit("canConnect", ...args);
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
  updateNode,
  updateNodeInternals,
  screenToFlowCoordinate,
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
  if (documentTarget.value) return;
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
  if (documentTarget.value) return;
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
// ACT: 右下角缩放拖柄的门控：只读、文档模式、多选（>1）、连线中均不显示；悬停/选中/缩放中的显隐由 CSS 控制（与 groupNode 一致）。
// slotsHiddenByInteraction 门控是本功能额外引入（spec"隐藏场景"已确认）：框选开始或拖动节点期间隐藏，
// 框选后需点击节点（onNodeClick 复位）才会重新显示——与槽位显隐行为一致。
const resizeEnabled = computed(
  () => !props.readOnly && !documentTarget.value && !slotsHiddenByInteraction.value && !connectionStartHandle.value && getSelectedNodes.value.length <= 1
);
// ACT: 文档模式下不视为 userSized——否则内联 height:100% 会把文档视图从内容高度拉伸为面板满高（.documentNode 只强制 width）。
const userSized = computed(() => {
  if (documentTarget.value) return false;
  const style = node.style;
  return !!style && typeof style === "object" && !!(style.width || style.height);
});
const attrs = useAttrs();
const boundAttrs = computed(() => ({
  ...attrs,
  // ACT: 用户缩放过（style 有尺寸）时，节点自带的内联宽度让位于骨架 100% 填充，避免内联样式压过 wrapper 尺寸。
  // userSized 时整体替换 style 是有意为之（现有节点只传 width）。
  style: userSized.value ? { width: "100%", height: "100%" } : attrs.style,
}));
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
  if (props.readOnly || !reloadRemoteNode || reloading.value) return;
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
  if (props.readOnly) return;
  event.preventDefault();
  if (documentTarget.value) event.stopPropagation();
  menu.value?.handleClose();
  const point = "changedTouches" in event ? event.changedTouches[0] : event;
  if (!point) return;
  menuAnchor.value = { getBoundingClientRect: () => new DOMRect(point.clientX, point.clientY, 0, 0) };
  await nextTick();
  menu.value?.handleOpen();
}

async function deleteNode() {
  if (props.readOnly || deleting.value) return;
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

const copyNodeToClipboard = inject<((node: { type?: string; data: NodeData; style?: GraphNode["style"] }) => Promise<void>) | undefined>(
  "copyNodeToClipboard",
  undefined
);
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
  if (props.readOnly) return;
  if (command === "saveAsset") saveNodeToAssets?.(props.label, assetOutputs.value);
  if (command === "clipboard" && copyNodeToClipboard && !copyingToClipboard.value) {
    copyingToClipboard.value = true;
    try {
      const patch = await nodeEvent.emit("copy");
      const data = { ...node.data, ...patch };
      await copyNodeToClipboard({ type: node.type, data, style: node.style });
      ElMessage.success("已复制到剪贴板");
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
      style: typeof node.style === "object" && node.style ? { ...node.style } : node.style,
      data: { ...data, label: `${props.label} - 副本` },
      parentNode: node.parentNode,
    });
    await nextTick();
    addSelectedNodes([findNode(id)!]);
    addEdges(incomingEdges.map((edge) => ({ ...JSON.parse(JSON.stringify(edge)), id: crypto.randomUUID(), target: id, selected: false })));
  }
}

async function editLabel() {
  if (props.readOnly) return;
  labelDraft.value = props.label;
  editingLabel.value = true;
  await nextTick();
  labelInput.value?.select();
}

function saveLabel() {
  if (props.readOnly || !editingLabel.value) return;
  const label = labelDraft.value.trim();
  if (label) node.data.label = label;
  editingLabel.value = false;
}

function confirmLabel(event: KeyboardEvent) {
  if (props.readOnly || event.isComposing) return;
  event.preventDefault();
  saveLabel();
}

function startResize(event: PointerEvent) {
  if (!resizeEnabled.value || event.button !== 0 || resizeState.value) return;
  const target = findNode(nodeId);
  if (!target) return;
  const action = () => new Promise<void>(resolve => {
    const element = event.currentTarget as HTMLElement;
    const chrome = element.closest(".nodeSkeleton")?.querySelector<HTMLElement>(".titleBar")?.offsetHeight ?? 0;
    resizeState.value = {
      node: target, element, pointerId: event.pointerId,
      point: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
      width: target.dimensions.width, height: target.dimensions.height, chrome, resolve,
    };
    target.resizing = true;
    element.setPointerCapture(event.pointerId);
  });
  void (batchHistory ? batchHistory(action) : action()).catch(error => {
    finishResize();
    ElMessage.error(error instanceof Error ? error.message : "节点缩放失败");
  });
}

function moveResize(event: PointerEvent) {
  const state = resizeState.value;
  if (!state || event.pointerId !== state.pointerId) return;
  if (findNode(nodeId) !== state.node) return finishResize();
  const point = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  const width = Math.max(120, state.width + (point.x - state.point.x));
  // 最小高度须容纳标题栏 + 卡片 chrome。
  const height = Math.max(80, state.chrome + cardHeight.value, state.height + (point.y - state.point.y));
  updateNode(nodeId, {
    style: { ...(typeof state.node.style === "object" ? state.node.style : {}), width: `${width}px`, height: `${height}px` },
  });
  state.node.dimensions = { width, height };
}

function finishResize(event?: PointerEvent) {
  const state = resizeState.value;
  if (!state || (event && event.pointerId !== state.pointerId)) return;
  resizeState.value = undefined;
  state.node.resizing = false;
  if (state.element.hasPointerCapture(state.pointerId)) state.element.releasePointerCapture(state.pointerId);
  state.resolve();
}

onBeforeUnmount(() => finishResize());
watch(() => props.readOnly, readOnly => {
  if (readOnly) finishResize();
});

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

function isHandleNodeActive(item: NodeHandle) {
  const connections = connectionLookup.value.get(`${nodeId}-${item.type}-${item.id}`);
  if (!connections?.size) return false;
  if (node.selected || node.dragging) return true;
  for (const connection of connections.values()) {
    const otherNode = findNode(item.type === "source" ? connection.target : connection.source);
    if (otherNode?.selected || otherNode?.dragging) return true;
  }
  return false;
}

function getHandleStatus(item: NodeHandle) {
  const selection = localSelectionConnection.value;
  if (selection?.handles.some((handle) => handle.id === item.id && handle.type === item.type)) return selection.status;
  const target = localEndHandle.value;
  return target?.id === item.id && target.type === item.type ? connectionStatus.value : null;
}

watchEffect(() => {
  if (props.readOnly || props.loading) return;
  // 仅同步端口快照供跨节点校验；端口状态由具体 node 维护。
  if (JSON.stringify(node.data.handles) !== JSON.stringify(props.handles)) node.data.handles = props.handles.map((item) => ({ ...item }));
});
watchEffect(() => {
  if (props.readOnly || props.loading) return;
  // 输出由 node 持有，画布仅共享当前值；不使用 JSON 比较或触发端口重测。
  node.data.outputs = props.outputs;
});
// 比较内容，避免内联数组的新引用触发渲染循环。
watch(
  () => JSON.stringify([props.label, props.handles, props.readOnly]),
  () => {
    if (props.readOnly || props.loading) return;
    removeEdges((edges) =>
      edges.filter(
        (edge) =>
          (edge.source === nodeId && !props.handles.some((item) => item.type === "source" && item.id === edge.sourceHandle)) ||
          (edge.target === nodeId && !props.handles.some((item) => item.type === "target" && item.id === edge.targetHandle))
      )
    );
    if (!documentTarget.value) updateNodeInternals([nodeId]);
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

  &.documentNode {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100% !important;
    min-width: 0;

    .floatingSlot {
      position: static;
      width: 100% !important;
      transform: none;

      &.topSlot { order: 0; }
      &.bottomSlot { order: 2; }
    }

    .cardContainer {
      order: 1;
      min-width: 0;
    }
  }

  &.userSized {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .cardContainer {
      flex: 1;
      min-height: 0;
    }

    .contentCard {
      height: 100%;
      min-height: 0;

      /* ACT: 必须写成 &:deep——裸 :deep(X) 在嵌套里会编译成 `[data-v] X`（多一层后代），
         选择器永远落空；&:deep(X) 才编译为 `.contentCard[data-v] X`。
         body 进 flex 链后子级高度可解析，媒体层的 height:100% 才有意义。 */
      &:deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      &:deep(.el-card__body > *) {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        height: 100%;
      }

      /* ACT: 图片/视频内容层拉伸后用 object-fit:contain 填满用户高度，避免拉伸变形。
         只打到 imageEditor/videoPreview，不碰 markdownPreview 内嵌 img（那些应保持 height:auto）。
         imageContent/videoContent 是 grid（place-items:center）：行轨道不给确定高度时，
         子级 height:100% 会因“行高由内容决定”解析成 auto，故在此定死轨道。 */
      &:deep(.imageContent),
      &:deep(.videoContent) {
        grid-template-rows: minmax(0, 1fr);
        grid-auto-rows: minmax(0, 1fr);
      }

      &:deep(.imageEditor),
      &:deep(.videoPlayer) {
        width: 100%;
        height: 100%;
        min-height: 0;
        align-self: stretch;
      }

      &:deep(.imageEditor > img),
      &:deep(.videoPreview) {
        width: 100%;
        height: 100%;
        max-height: none;
        object-fit: contain;
      }

      /* ACT: 文本预览去掉 240 封顶，占满剩余高度并保持内部滚动（编辑按钮仍贴底）。 */
      &:deep(.textContent) {
        display: flex;
        flex-direction: column;
      }

      &:deep(.textContent > .textPreview) {
        flex: 1 1 auto;
        min-height: 0;
        max-height: none;
        overflow: auto;
      }

      /* ACT: 拉片节点的视频区同样跟随高度；下方信息/按钮仍按内容高度排布。 */
      &:deep(.analysisContent) {
        display: flex;
        flex-direction: column;
      }

      &:deep(.analysisContent > .videoArea) {
        flex: 1 1 auto;
        min-height: 0;
      }
    }
  }

  &.nodeSelected .resizeCorner,
  &:hover .resizeCorner,
  &.nodeResizing .resizeCorner {
    opacity: 1;
    pointer-events: auto;
  }

  .resizeCorner {
    position: absolute;
    right: -5px;
    bottom: -5px;
    width: 9px;
    height: 9px;
    padding: 0;
    border: 1px solid var(--el-color-primary);
    border-radius: 2px;
    background: var(--el-bg-color);
    opacity: 0;
    pointer-events: none;
    touch-action: none;
    cursor: nwse-resize;
    z-index: 3;
    transition: opacity 120ms ease-out;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }

    &:focus-visible {
      opacity: 1;
      pointer-events: auto;
    }
  }

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
      &:deep(.el-button) {
        width: auto;
        min-width: 32px;
        height: 32px;
        margin: 0;
        padding: 0 8px;
        text-decoration: none;
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
