<template>
  <div v-if="documentTarget" class="nodeDocumentPlaceholder" :style="canvasSize" aria-hidden="true" />
  <teleport :to="documentTarget ?? 'body'" :disabled="!documentTarget">
  <div ref="skeletonElement" v-bind="$attrs" class="nodeSkeleton" :class="{ documentNode: documentTarget, resized: !!resizedStyle.height || !!mediaWidth, mediaSized: !!mediaWidth, resizing: !!resize }" :style="resizedStyle" @wheel.capture="zoomCanvas" @dblclick.stop="focusNode" @contextmenu="documentTarget && openMenu($event)">
    <el-dropdown
      v-if="interactive && menuAnchor"
      ref="menu"
      class="nodeContextMenu"
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
          <el-dropdown-item :divided="!!(assetOutputs.length && saveNodeToAssets)" command="rename" :icon="IconPencil">重命名</el-dropdown-item>
          <el-dropdown-item command="copy" :icon="IconCopy">复制节点</el-dropdown-item>
          <el-dropdown-item command="duplicate" :icon="IconCopyPlus">创建副本</el-dropdown-item>
          <el-dropdown-item command="delete" :icon="IconTrash">删除节点</el-dropdown-item>
          <el-dropdown-item divided command="clipboard" :icon="IconCopy" :disabled="!copyNodeToClipboard || copyingToClipboard">
            复制到剪贴板
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div
      v-if="interactive && (documentTarget || (topVisible && slotsVisible))"
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
      v-if="interactive && $slots.bottom && (documentTarget || (bottomVisible && slotsVisible))"
      class="floatingSlot bottomSlot nodrag nopan nowheel"
      :style="{ width: typeof bottomWidth === 'number' ? `${bottomWidth}px` : bottomWidth }"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
      @keydown.stop
      @contextmenu.stop>
      <slot name="bottom" />
    </div>
    <div v-show="!documentTarget" class="titleBar" :class="{ touchDetail: interactive && titleDetail && !node.selected }">
      <component :is="icon ?? IconBox" class="titleIcon" :size="16" aria-hidden="true" />
      <input
        v-if="editingLabel && interactive"
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
        :tabindex="interactive ? 0 : undefined"
        :title="interactive ? `${label}（双击编辑名称）` : label"
        @dblclick="interactive && ($event.stopPropagation(), editLabel())"
        @keydown.enter.stop.prevent="editLabel">
        {{ label }}
      </span>
      <span v-if="titleDetail && !processingTask?.cancel" class="titleDetail" dir="ltr">{{ titleDetail }}</span>
      <div v-if="processingTask?.cancel" class="nodeActions processingActions nodrag nopan" @pointerdown.stop @mousedown.stop @dblclick.stop>
        <el-button text :icon="IconPlayerStop" :loading="processingTask.cancelling" :disabled="processingTask.cancelling"
          :title="processingTask.cancelling ? '正在取消…' : '取消处理'" :aria-label="processingTask.cancelling ? '正在取消…' : '取消处理'" @click.stop="processingTask.cancel()" />
      </div>
      <div v-else-if="interactive" class="nodeActions nodrag nopan" @pointerdown.stop @mousedown.stop @dblclick.stop>
        <el-button
          :icon="IconRefresh"
          :loading="loading || reloading"
          :disabled="loading || !reloadRemoteNode"
          text
          title="刷新节点"
          aria-label="刷新节点"
          @click.stop="reloadNode" />
        <el-button :icon="IconTrash" text title="移除节点" aria-label="移除节点" @click.stop="deleteNode" :loading="deleting" />
        <el-button class="moreAction" :icon="IconDots" text title="更多操作" aria-label="更多操作" aria-haspopup="menu" @click.stop="openMenu" />
      </div>
    </div>
    <div
      class="cardContainer"
      :class="{ targetZones: !readOnly && !loading && !documentTarget && !localStartHandle }"
      :style="mediaWidth ? { flex: 'none', height: `${(mediaWidth - 18) / mediaAspect! + 18}px` } : undefined">
      <span v-if="documentTarget && titleDetail" class="documentDetail" dir="ltr">{{ titleDetail }}</span>
      <el-card
        v-loading="loadingOptions"
        class="contentCard"
        :class="{ selected: node.selected || connectionTarget, processingCard: !!processingTask }"
        :aria-busy="processing ? true : undefined"
        :aria-label="processingTask?.text"
        shadow="never"
        :bodyStyle="{ padding: '8px' }"
        :style="{ minHeight: `${cardHeight}px` }">
        <div v-if="loading" class="loadingContent" role="status" aria-label="节点加载中">
          <icon-loader2 class="loadingIcon" :size="24" aria-hidden="true" />
          <span>加载中...</span>
        </div>
        <template v-else-if="previewReady || documentTarget">
          <div v-if="processingTask" class="processingContent" inert><slot /></div>
          <slot v-else />
        </template>
      </el-card>
      <div
        v-for="group in handleGroups"
        :key="group.type"
        class="handleLayer"
        :class="{ [group.position]: group.items.length && interactive && !loading && !documentTarget && !connectionStartHandle }">
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
          :connectable="interactive && !loading"
          :position="group.position"
          :isValidConnection="validateConnection"
          :data-connection-status="getHandleStatus(item)"
          :style="getHandleStyle(index, group.items.length)"
          :title="`${item.label ?? item.id} · ${Array.isArray(item.dataType) ? item.dataType.join(' / ') : item.dataType}`"
          :aria-label="`${item.label ?? item.id} · ${Array.isArray(item.dataType) ? item.dataType.join(' / ') : item.dataType}`"
          @pointermove="moveHandle"
          @pointerleave="resetHandle"
          @pointercancel="resetHandle">
          <component :is="isHandleConnected(item) ? IconCircleDot : IconCircleDashed" class="handleIcon" :size="18" aria-hidden="true" />
        </handle>
      </div>
      <button
        v-if="interactive && !loading && !documentTarget"
        class="resizeCorner nodrag nopan"
        type="button"
        aria-label="调整节点大小（方向键微调）"
        @pointerdown.stop.prevent="startResize"
        @pointermove.stop="moveResize"
        @pointerup.stop="finishResize"
        @pointercancel="finishResize"
        @lostpointercapture="finishResize"
        @keydown.stop="resizeWithKeyboard"
        @mousedown.stop
        @click.stop
        @dblclick.stop />
    </div>
  </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onScopeDispose, ref, shallowRef, watch, watchEffect, type Component, type ShallowRef } from "vue";
import { Handle, Position, getTransformForBounds, pointToRendererPoint, useNode, useVueFlow, wheelDelta } from "@vue-flow/core";
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
  IconPlayerStop,
  IconDots,
  IconPencil,
} from "@tabler/icons-vue";
import { ElCard, ElButton, ElDivider, ElDropdown, ElDropdownMenu, ElDropdownItem, ElLoading, ElMessage } from "element-plus";
import type { DropdownInstance } from "element-plus";
import { getAssetOutputs, validateConnection } from "./connection";
import { useNodeEvent } from "./nodeEvent";
import type { NodeConnectionFeedback, NodeData, NodeHandle } from "./connection";
import type { NodeOutput } from "./values";
import type { NodeDocumentContext } from "./nodeDocument";

defineOptions({ inheritAttrs: false });

const topVisible = defineModel<boolean>("topVisible", { default: false });
const bottomVisible = defineModel<boolean>("bottomVisible", { default: false });
const emit = defineEmits<{ fullscreen: [] }>();
const vLoading = ElLoading.directive;
const downloading = ref(false);
const props = withDefaults(
  defineProps<
    NodeData & {
      icon?: Component;
      titleDetail?: string;
      loading?: boolean;
      processing?: boolean | { text: string; cancelling?: boolean; cancel?: () => void };
      readOnly?: boolean;
      previewReady?: boolean;
      topWidth?: string | number;
      bottomWidth?: string | number;
      downloadUrl?: string;
      downloadName?: string;
      fullscreenVisible?: boolean;
      mediaAspect?: number;
    }
  >(),
  {
    label: "未命名节点",
    handles: () => [],
    outputs: () => ({}),
    processing: false,
    previewReady: true,
    readOnly: false,
    fullscreenVisible: true,
    topWidth: "20vw",
    bottomWidth: "20vw",
  }
);
const processingTask = computed(() => typeof props.processing === "object" ? props.processing : undefined);
const interactive = computed(() => !props.readOnly && !processingTask.value);
const loadingOptions = computed(() => processingTask.value ? { text: processingTask.value.text } : props.processing);
const handleGroups = computed(() => [
  { type: "target" as const, position: Position.Left, items: props.handles.filter((item) => item.type === "target") },
  { type: "source" as const, position: Position.Right, items: props.handles.filter((item) => item.type === "source") },
]);
const cardHeight = computed(() => Math.max(100, ...handleGroups.value.map((group) => (group.items.length + 1) * 44)));
const { id: nodeId, node } = useNode();
const documentContext = inject<NodeDocumentContext | undefined>("nodeDocument", undefined);
const documentTarget = computed(() => interactive.value ? documentContext?.targets.get(nodeId) : undefined);
const skeletonElement = ref<HTMLElement>();
const canvasSize = shallowRef<{ width: string; height: string }>();
let documentLease: symbol | undefined;
function mountDocument(target: HTMLElement) {
  if (!interactive.value) throw new Error("只读节点不能挂载到工作区文档");
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
watch(() => interactive.value && !props.loading, available => {
  if (!available) {
    if (documentContext?.mounts.get(nodeId) === mountDocument) documentContext.mounts.delete(nodeId);
  } else documentContext?.mounts.set(nodeId, mountDocument);
}, { immediate: true });
onScopeDispose(() => {
  documentLease = undefined;
  if (documentContext?.mounts.get(nodeId) !== mountDocument) return;
  documentContext.mounts.delete(nodeId);
  documentContext.targets.delete(nodeId);
});
const selectionConnection = inject<ShallowRef<NodeConnectionFeedback | undefined> | undefined>("selectionConnection", undefined);
const nodeEvent = useNodeEvent();
if (!props.readOnly) node.isValidTargetPos = (...args) => interactive.value && nodeEvent.emit("canConnect", ...args);
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
const batchHistory = inject<((action: () => Promise<void>) => Promise<void>) | undefined>("batchCanvasHistory", undefined);
// 卡片边框 2px 与内边距 16px 之外的内容区按媒体比例铺满；拖动卡片高度不能低于端口所需高度。
const mediaMinWidth = computed(() => Math.max(160, (cardHeight.value - 18) * (props.mediaAspect || 0) + 18));
// 媒体节点只取保存的宽度，高度由比例计算，未缩放时内容高 240。
// 高度写在 cardContainer：el-card 自带全属性过渡，直接改卡片高度会让缩放滞后。
const mediaWidth = computed(() => {
  const aspect = props.mediaAspect;
  if (!aspect || !Number.isFinite(aspect) || documentTarget.value) return;
  const style = typeof node.style === "function" ? node.style(node) : node.style;
  const width = props.readOnly ? NaN : Number.parseFloat(String(style?.width));
  return Math.max(mediaMinWidth.value, Number.isFinite(width) ? width : 240 * aspect + 18);
});
const resizedStyle = computed(() => {
  if (mediaWidth.value) return { width: `${mediaWidth.value}px` };
  const style = typeof node.style === "function" ? node.style(node) : node.style;
  return props.readOnly || documentTarget.value ? {} : {
    ...(style?.width ? { width: style.width } : {}),
    ...(style?.height ? { height: style.height } : {}),
  };
});
const resize = shallowRef<{
  element: HTMLElement;
  pointerId: number;
  point: { x: number; y: number };
  width: number;
  height: number;
  resolve: () => void;
}>();

function startResize(event: PointerEvent) {
  if (!interactive.value || props.loading || documentTarget.value || event.button !== 0 || resize.value) return;
  const element = event.currentTarget as HTMLElement;
  const skeleton = skeletonElement.value;
  if (!skeleton) return;
  const action = () => new Promise<void>(resolve => {
    resize.value = {
      element, pointerId: event.pointerId,
      point: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
      width: skeleton.offsetWidth, height: skeleton.offsetHeight, resolve,
    };
    node.resizing = true;
    element.setPointerCapture(event.pointerId);
  });
  void (batchHistory ? batchHistory(action) : action()).catch(error => {
    finishResize();
    ElMessage.error(error instanceof Error ? error.message : "节点缩放失败");
  });
}

function setNodeSize(base: { width: number; height: number }, dx: number, dy: number) {
  const titleHeight = skeletonElement.value?.querySelector<HTMLElement>(".titleBar")?.offsetHeight ?? 32;
  const style = typeof node.style === "function" ? node.style(node) : node.style;
  const aspect = mediaWidth.value && props.mediaAspect;
  if (!aspect) {
    node.style = { ...style, width: `${Math.max(160, base.width + dx)}px`, height: `${Math.max(cardHeight.value + titleHeight, base.height + dy)}px` };
    return;
  }
  // 媒体节点锁定比例：按位移更大的方向换算宽度；保存高度供媒体清空后保持外框。
  const width = Math.max(mediaMinWidth.value, base.width + (Math.abs(dx) >= Math.abs(dy * aspect) ? dx : dy * aspect));
  node.style = { ...style, width: `${width}px`, height: `${(width - 18) / aspect + 18 + titleHeight}px` };
}

function moveResize(event: PointerEvent) {
  const state = resize.value;
  if (!state || event.pointerId !== state.pointerId) return;
  if (!interactive.value || props.loading || documentTarget.value || findNode(nodeId) !== node) return finishResize();
  const point = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  setNodeSize(state, point.x - state.point.x, point.y - state.point.y);
}

function finishResize(event?: PointerEvent) {
  const state = resize.value;
  if (!state || (event && event.pointerId !== state.pointerId)) return;
  resize.value = undefined;
  node.resizing = false;
  if (state.element.hasPointerCapture(state.pointerId)) state.element.releasePointerCapture(state.pointerId);
  state.resolve();
}

function resizeWithKeyboard(event: KeyboardEvent) {
  if (!interactive.value || props.loading || documentTarget.value || resize.value) return;
  const skeleton = skeletonElement.value;
  if (!skeleton || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const dx = event.key === "ArrowLeft" ? -10 : event.key === "ArrowRight" ? 10 : 0;
  const dy = event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0;
  setNodeSize({ width: skeleton.offsetWidth, height: skeleton.offsetHeight }, dx, dy);
}

onScopeDispose(() => finishResize());
watch(() => [interactive.value, props.loading, documentTarget.value], () => finishResize());
const localStartHandle = computed(() => (connectionStartHandle.value?.nodeId === nodeId ? connectionStartHandle.value : undefined));
// 输入命中区按卡片高度均分，起点相对 18px 端口的左上角计算。
function getHandleStyle(index: number, count: number) {
  const position = (index + 1) / (count + 1);
  return {
    top: `${position * 100}%`,
    "--zoneTop": `calc(9px + ${(index / count - position) * 100}cqh)`,
    "--zoneHeight": `${100 / count}cqh`,
  };
}
const localEndHandle = computed(() => (connectionEndHandle.value?.nodeId === nodeId ? connectionEndHandle.value : undefined));
const localSelectionConnection = computed(() => (selectionConnection?.value?.nodeId === nodeId ? selectionConnection.value : undefined));
// 预连接（松手即可连上）时，卡片边框按选中样式高亮。
const connectionTarget = computed(() => (!!localEndHandle.value && connectionStatus.value === "valid") || localSelectionConnection.value?.status === "valid");
const connectedHandles = computed<Set<string>>((previous) => {
  const connected = new Set(
    props.handles.filter((item) => connectionLookup.value.get(`${nodeId}-${item.type}-${item.id}`)?.size).map((item) => `${item.type}-${item.id}`)
  );
  return previous?.size === connected.size && [...connected].every((key) => previous.has(key)) ? previous : connected;
});

async function focusNode(event: MouseEvent) {
  if (documentTarget.value || processingTask.value) return;
  const element = event.currentTarget as HTMLElement;
  await nextTick();
  const flowElement = vueFlowRef.value;
  if (!flowElement || !element.isConnected) return;
  const flowRect = flowElement.getBoundingClientRect();
  if (flowRect.width <= 0 || flowRect.height <= 0) return;
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
    flowRect.width, flowRect.height, minZoom.value, maxZoom.value, 0.2
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
const menuAnchor = shallowRef<{ getBoundingClientRect: () => DOMRect }>();
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
  if (!interactive.value || !reloadRemoteNode || reloading.value) return;
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
  if (!interactive.value) return;
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
  if (!interactive.value || deleting.value) return;
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
const assetOutputs = computed(() => getAssetOutputs(props));

async function handleCommand(command: string) {
  if (!interactive.value) return;
  if (command === "saveAsset") saveNodeToAssets?.(props.label, assetOutputs.value);
  if (command === "rename") void editLabel();
  if (command === "clipboard" && copyNodeToClipboard && !copyingToClipboard.value) {
    copyingToClipboard.value = true;
    try {
      const patch = await nodeEvent.emit("copy");
      const data = { ...node.data, ...patch };
      await copyNodeToClipboard({ type: node.type, data });
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
      data: { ...data, label: `${props.label} - 副本` },
      parentNode: node.parentNode,
    });
    await nextTick();
    addSelectedNodes([findNode(id)!]);
    addEdges(incomingEdges.map((edge) => ({ ...JSON.parse(JSON.stringify(edge)), id: crypto.randomUUID(), target: id, selected: false })));
  }
}

async function editLabel() {
  if (!interactive.value) return;
  labelDraft.value = props.label;
  editingLabel.value = true;
  await nextTick();
  labelInput.value?.select();
}

function saveLabel() {
  if (!interactive.value || !editingLabel.value) return;
  const label = labelDraft.value.trim();
  if (label) node.data.label = label;
  editingLabel.value = false;
}

function confirmLabel(event: KeyboardEvent) {
  if (!interactive.value || event.isComposing) return;
  event.preventDefault();
  saveLabel();
}

function moveHandle(event: PointerEvent) {
  if (event.pointerType === "touch" || connectionStartHandle.value) return;
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
/* ACT: VueFlow 会把保存的 style 宽高写到外层；媒体节点的尺寸由比例决定，外层随内容自适应，避免为旧尺寸改写画布和撤销历史。 */
:global(.vue-flow__node:has(> .nodeSkeleton.mediaSized)) {
  width: auto !important;
  height: auto !important;
}

.nodeSkeleton {
  position: relative;
  width: 220px;
  color: var(--el-text-color-primary);
  text-align: left;

  .nodeContextMenu { position: absolute; }

  &.resized {
    display: flex;
    flex-direction: column;

    .titleBar { flex-shrink: 0; }
    .cardContainer {
      flex: 1;
      min-height: 0;

      .contentCard {
        height: 100%;
        box-sizing: border-box;

        :deep(.el-card__body) {
          height: 100%;
          box-sizing: border-box;
          overflow: auto;
        }
      }
    }
  }

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

  &:hover .cardContainer .nodeHandle .handleIcon {
    opacity: 1;
  }

  /* 连接点中心离卡片 12px，半径 9px。斜向接近时让这段空隙也保持悬停。 */
  &:hover .cardContainer .handleLayer:is(.left, .right)::before {
    content: "";
    position: absolute;
    inset-block: 0;
    width: 21px;
    pointer-events: auto;
  }

  &:hover .titleBar,
  .titleBar:has(:focus-visible) {
    .nodeActions { visibility: visible; }
    .titleDetail:has(+ .nodeActions) { visibility: hidden; }
  }

  &:hover,
  &.resizing {
    .cardContainer .resizeCorner { opacity: 0.55; }
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
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    padding: 0 4px 8px;
    font-size: 14px;
    line-height: 20px;

    .labelText {
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
      box-sizing: border-box;
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

    .titleDetail,
    .nodeActions {
      grid-area: 1 / 3;
      justify-self: end;
    }

    .nodeActions {
      visibility: hidden;
      display: flex;
      gap: 2px;

      &.processingActions { visibility: visible; }

      .el-button {
        width: 24px;
        height: 24px;
        margin: 0;
        padding: 0;
        transition-property: color, background-color, border-color;
      }

      .moreAction { display: none; }
    }
  }

  .cardContainer {
    position: relative;

    .documentDetail { display: block; text-align: end; }

    .handleLayer {
      position: absolute;
      inset: 0;
      container-type: size;
      pointer-events: none;

      &.left::before { right: 100%; }
      &.right::before { left: 100%; }
    }

    .resizeCorner {
      position: absolute;
      /* 拖柄内侧角轻贴圆角边框，主体留在边框外。 */
      right: calc(var(--ui-radius-large, var(--el-border-radius-base)) * 0.293 - 2px);
      bottom: calc(var(--ui-radius-large, var(--el-border-radius-base)) * 0.293 - 2px);
      transform: translate(50%, 50%);
      box-sizing: border-box;
      width: 4px;
      height: 4px;
      padding: 0;
      border: 1px solid var(--el-border-color);
      border-radius: 1px;
      background: var(--el-bg-color);
      opacity: 0;
      cursor: nwse-resize;
      touch-action: none;

      &::before {
        content: "";
        position: absolute;
        inset: -4px;
      }

      &:focus-visible { opacity: 1; }
    }

    .contentCard.selected {
      border-color: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-border-color-light));
    }

    .contentCard > :deep(.el-loading-mask) {
      pointer-events: none;
    }

    .processingCard {
      .processingContent { display: contents; }
      :deep(.el-loading-spinner) { margin-top: 0; transform: translateY(-50%); }
      :deep(.el-loading-text) { margin: 4px 8px 0; overflow-wrap: anywhere; }
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

    .connectingFromSource &.targetZones {
      .handleLayer { z-index: 10; }

      .nodeHandle.target {
        &::before {
          inset: auto;
          top: var(--zoneTop);
          left: 0;
          width: calc(100cqw + 21px);
          height: var(--zoneHeight);
          border-radius: 0;
        }
      }

      /* 严格模式下输出端不能作为输出连线的终点，避免右缘命中区盖住输入区。 */
      .nodeHandle.source {
        pointer-events: none;
      }
    }
  }

  .titleDetail,
  .documentDetail {
    color: var(--el-text-color-secondary);
    font-size: 10px;
    line-height: 14px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
  }

  /* 纯触屏用点选节点切换尺寸和操作按钮。 */
  @media (any-pointer: coarse) and (hover: none) {
    .cardContainer .nodeHandle .handleIcon { opacity: 1; }

    .cardContainer .resizeCorner {
      width: 10px;
      height: 10px;
      opacity: 0.55;

      &::before { inset: -15px; }
    }

    .titleBar {
      .nodeActions {
        visibility: visible;

        .el-button { width: 32px; height: 32px; }
        .moreAction { display: inline-flex; }
      }

      .titleDetail:has(+ .nodeActions) { visibility: hidden; }
      &.touchDetail:not(:has(:focus-visible)) {
        .titleDetail { visibility: visible; }
        .nodeActions { visibility: hidden; }
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
