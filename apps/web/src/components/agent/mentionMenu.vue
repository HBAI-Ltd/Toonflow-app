<template>
  <div v-click-outside:[clickOutsideExclude]="closeMenu" class="mentionMenu" @keydown.capture="handleKeydown">
    <el-button class="mentionButton" text circle :disabled="disabled" :aria-expanded="visible" :aria-controls="listId" aria-label="提及节点输出或素材" title="提及节点输出或素材" @mousedown.prevent @click="visible ? closeMenu() : openMenu()"><icon-at :size="16" /></el-button>
    <teleport to="body">
      <div v-if="visible" ref="popupElement" class="mentionMenu mentionOverlay" :style="popupStyle" @keydown.capture="handleKeydown">
        <el-card class="mentionPopup" shadow="always" :bodyStyle="{ padding: '0' }" :style="{ maxHeight: `${popupHeight}px` }">
          <div class="mentionHeader"><strong>提及输出与素材</strong><el-button text circle size="small" aria-label="关闭提及" @click="closeMenu"><icon-x :size="14" /></el-button></div>
          <div class="mentionScopes" aria-label="提及来源">
            <button v-for="item in scopes" :key="item.id" type="button" :class="{ selected: scope === item.id }" :aria-pressed="scope === item.id" @click="changeScope(item.id)">{{ item.name }}</button>
          </div>
          <div v-if="selectedNode || selectedCanvas || assetPath" class="mentionBreadcrumb">
            <el-button text circle size="small" aria-label="返回上一级" @click="goBack"><icon-chevron-left :size="15" /></el-button>
            <span :title="breadcrumb">{{ breadcrumb }}</span>
          </div>
          <div class="mentionSearch"><el-input v-model="search" clearable :placeholder="searchPlaceholder" aria-label="搜索提及内容"><template #prefix><icon-search :size="15" /></template></el-input></div>
          <el-scrollbar ref="listScrollbar" class="mentionScroll" :maxHeight="`${Math.max(90, popupHeight - (selectedNode || selectedCanvas || assetPath ? 218 : 188))}px`">
            <div :id="listId" class="mentionList" role="listbox" aria-label="可提及内容" :aria-busy="loading || selecting" :aria-multiselectable="!!selectedNode">
              <div v-if="loading && !rows.length" class="mentionStatus" role="status">正在加载…</div>
              <div v-else-if="loadError" class="mentionStatus" role="alert"><span>{{ loadError }}</span><el-button text type="primary" size="small" @click="loadList()">重试</el-button></div>
              <div v-else-if="!rows.length" class="mentionStatus" role="status">{{ emptyText }}</div>
              <div class="mentionRows" :style="{ height: `${listVirtualizer.getTotalSize()}px` }">
                <button v-for="{ row, index, start } in visibleRows" :id="`${listId}-${index}`" :key="`${row.kind}-${row.id}`" class="mentionItem" :style="{ transform: `translateY(${start}px)` }" :class="{ active: index === activeIndex, unavailable: !row.available, checked: row.kind === 'output' && selectedOutputs.includes(row.id) }" type="button" role="option" :aria-selected="row.kind === 'output' ? selectedOutputs.includes(row.id) : index === activeIndex" :aria-disabled="!row.available || selecting" :aria-posinset="index + 1" :aria-setsize="rows.length" :title="row.name" @mouseenter="activeIndex = index" @mousedown.prevent @click="chooseRow(row)">
                  <mentionThumbnail :thumbnail="row.thumbnail" :directory="directory" :globalAsset="row.kind === 'file'"><component :is="row.kind === 'canvas' ? IconVector : row.kind === 'directory' ? IconFolder : row.dataType === 'image' || row.dataType === 'mask' ? IconPhoto : row.dataType === 'video' ? IconVideo : row.dataType === 'audio' ? IconMusic : row.dataType ? IconFileText : IconBox" :size="18" /></mentionThumbnail>
                  <span class="mentionContent"><span class="mentionName">{{ row.name }}</span><span v-if="row.description" class="mentionDescription">{{ row.description }}</span></span>
                  <span v-if="!row.available || row.kind === 'node' && !row.outputCount" class="mentionState">{{ row.kind === 'file' ? '不支持' : '暂无输出' }}</span>
                  <span v-else-if="row.kind === 'output'" class="mentionCheck" :class="{ selected: selectedOutputs.includes(row.id) }"><icon-check v-if="selectedOutputs.includes(row.id)" :size="12" /></span>
                  <icon-chevron-right v-else-if="['canvas', 'directory'].includes(row.kind) || row.kind === 'node' && row.outputCount > 1" :size="14" class="mentionArrow" />
                </button>
              </div>
              <el-button v-if="hasMore && !loadError" class="mentionMore" text :loading="loading" :disabled="selecting" @click="loadMore">加载更多</el-button>
            </div>
          </el-scrollbar>
          <div class="mentionFooter"><span>{{ selectedNode ? `已选 ${selectedOutputs.length} 项` : '↑ ↓ 选择 · Enter 确认 · Esc 关闭' }}</span><el-button v-if="selectedNode" type="primary" size="small" :loading="selecting" :disabled="!selectedOutputs.length" @click="confirmOutputs">插入引用</el-button><span v-else-if="selecting">正在插入…</span></div>
          <div v-if="selectionError" class="mentionError" role="alert">{{ selectionError }}</div>
        </el-card>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";

import { computed, nextTick, onBeforeUnmount, ref, useId, watch, type CSSProperties } from "vue";
import { ClickOutside as vClickOutside, type ScrollbarInstance } from "element-plus";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { IconAt, IconBox, IconCheck, IconChevronLeft, IconChevronRight, IconFileText, IconFolder, IconVector, IconVideo, IconMusic, IconPhoto, IconSearch, IconX } from "@tabler/icons-vue";
import type { AgentMention } from "@toonflow/server/agent/types";
import { mentionAssetType } from "@toonflow/server/agent/mentionSources";
import { useMentionSources, type MentionAsset, type MentionNode, type MentionOutput } from "./mentionSources";
import mentionThumbnail from "./mentionThumbnail.vue";

const props = defineProps<{ directory?: string; active: boolean; disabled: boolean; query?: string; editor?: HTMLElement; currentCanvasId?: string }>();
const emit = defineEmits<{ select: [mentions: AgentMention[]]; dismiss: []; open: [] }>();
const sources = useMentionSources(() => props.directory);
const listId = useId();
const scopes = [{ id: "current", get name() { return translate("当前画布"); } }, { id: "other", get name() { return translate("其他画布"); } }, { id: "assets", get name() { return translate("全局素材"); } }] as const;
type MentionScope = typeof scopes[number]["id"];
type MentionRow = { id: string; name: string; kind: "canvas" | "node" | "output" | "file" | "directory"; available: boolean; description: string; dataType?: string; thumbnail?: { url: string; mimeType: string }; outputCount: number };
const typeLabels: Record<string, string> = { STRING: "文本", INT: "整数", FLOAT: "数字", BOOLEAN: "布尔值", IMAGE: "图片", MASK: "遮罩", VIDEO: "视频", AUDIO: "音频", FILE: "文件" };
const scope = ref<MentionScope>("current");
const buttonVisible = ref(false);
const visible = computed(() => props.active && !props.disabled && (buttonVisible.value || props.query !== undefined));
const search = ref(props.query ?? "");
const canvases = ref<{ id: string; name: string }[]>([]);
const nodes = ref<MentionNode[]>([]);
const outputs = ref<MentionOutput[]>([]);
const assets = ref<MentionAsset[]>([]);
const selectedCanvas = ref<{ id: string; name: string }>();
const selectedNode = ref<MentionNode>();
const selectedOutputs = ref<string[]>([]);
const assetPath = ref("");
const activeIndex = ref(0);
const listScrollbar = ref<ScrollbarInstance>();
const nextCursor = ref<string>();
const loading = ref(false);
const loadError = ref("");
const selecting = ref(false);
const selectionError = ref("");
const popupHeight = ref(400);
const popupElement = ref<HTMLElement>();
const popupStyle = ref<CSSProperties>({});
const clickOutsideExclude = computed(() => [props.editor, popupElement.value]);
const canvasId = computed(() => scope.value === "current" ? props.currentCanvasId ?? sources.currentCanvasId() : selectedCanvas.value?.id);
const listingCanvases = computed(() => scope.value === "other" && !selectedCanvas.value);
const searchText = computed(() => search.value.trim().toLocaleLowerCase());
const filteredCanvases = computed(() => canvases.value.filter(item => item.id !== (props.currentCanvasId ?? sources.currentCanvasId()) && `${item.name} ${item.id}`.toLocaleLowerCase().includes(searchText.value)));
const filteredOutputs = computed(() => outputs.value.filter(item => `${item.name} ${item.preview}`.toLocaleLowerCase().includes(searchText.value)));
const rows = computed<MentionRow[]>(() => {
  if (listingCanvases.value) return filteredCanvases.value.map(item => ({ ...item, kind: "canvas", available: true, description: translate("画布"), outputCount: 0 }));
  if (selectedNode.value) return filteredOutputs.value.map(item => ({ ...item, kind: "output", dataType: item.dataType.toLocaleLowerCase(), description: typeLabels[item.dataType] ?? translate("数据"), outputCount: 0 }));
  if (scope.value === "assets") return assets.value.map(item => ({ ...item, id: item.path, kind: item.type, available: item.type === "directory" || !!item.dataType, dataType: item.dataType?.toLocaleLowerCase(),
    thumbnail: ["IMAGE", "MASK", "VIDEO"].includes(item.dataType ?? "") ? { url: item.path, mimeType: mentionAssetType(item.path).mimeType } : undefined,
    description: item.type === "directory" ? translate("文件夹") : typeLabels[item.dataType ?? ""] ?? translate("文件"), outputCount: 0 }));
  return nodes.value.map(item => ({ ...item, kind: "node", available: true, dataType: item.dataType?.toLocaleLowerCase(), description: typeLabels[item.dataType ?? ""] ?? translate("节点"), outputCount: item.hasOutput ? item.outputCount : 0 }));
});
const listVirtualizer = useVirtualizer<HTMLDivElement, HTMLButtonElement>(computed(() => ({
  count: rows.value.length,
  getScrollElement: () => listScrollbar.value?.wrapRef ?? null,
  getItemKey: (index: number) => `${rows.value[index]!.kind}-${rows.value[index]!.id}`,
  estimateSize: () => 52,
  overscan: 3,
  enabled: visible.value,
})));
const visibleRows = computed(() => listVirtualizer.value.getVirtualItems().map(item => ({ row: rows.value[item.index]!, index: item.index, start: item.start })));
const hasMore = computed(() => !listingCanvases.value && !selectedNode.value && !!nextCursor.value);
const breadcrumb = computed(() => selectedNode.value ? [selectedCanvas.value?.name ?? translate("当前画布"), selectedNode.value.name].join(" / ") : selectedCanvas.value?.name ?? assetPath.value);
const searchPlaceholder = computed(() => selectedNode.value ? "搜索该节点的输出" : listingCanvases.value ? "搜索其他画布" : scope.value === "assets" ? "搜索素材" : "搜索节点名称或 ID");
const emptyText = computed(() => scope.value === "current" && !canvasId.value ? translate("打开画布后即可提及节点输出") : search.value ? translate("没有找到匹配的内容") : selectedNode.value ? translate("该节点暂无可用输出") : listingCanvases.value ? translate("暂无其他画布") : scope.value === "assets" ? translate("暂无素材") : translate("当前画布暂无节点"));
let requestController: AbortController | undefined;
let selectionController: AbortController | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

function openMenu() {
  if (props.disabled || !props.active) return;
  buttonVisible.value = true;
}

function closeMenu() {
  if (!visible.value) return;
  buttonVisible.value = false;
  emit("dismiss");
}

function changeScope(value: MentionScope) {
  if (scope.value === value) return;
  scope.value = value;
  selectedCanvas.value = undefined;
  selectedNode.value = undefined;
  assetPath.value = "";
  search.value = "";
}

function goBack() {
  if (selectedNode.value) selectedNode.value = undefined;
  else if (selectedCanvas.value) selectedCanvas.value = undefined;
  else assetPath.value = assetPath.value.split("/").slice(0, -1).join("/");
  search.value = "";
}

async function loadList(append = false) {
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  loading.value = true;
  loadError.value = "";
  try {
    if (listingCanvases.value) {
      const result = await sources.canvases(controller.signal);
      if (controller.signal.aborted) return;
      canvases.value = result;
    } else if (scope.value === "assets") {
      let result = await sources.assets({ path: assetPath.value, query: search.value, cursor: append ? nextCursor.value : undefined, signal: controller.signal });
      while (!controller.signal.aborted && !result.items.length && result.nextCursor) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (controller.signal.aborted) return;
        result = await sources.assets({ path: assetPath.value, query: search.value, cursor: result.nextCursor, signal: controller.signal });
      }
      if (controller.signal.aborted) return;
      assets.value = append ? [...assets.value, ...result.items] : result.items;
      nextCursor.value = result.nextCursor;
    } else if (canvasId.value && selectedNode.value) {
      const result = await sources.outputs({ canvasId: canvasId.value, nodeId: selectedNode.value.id, signal: controller.signal });
      if (controller.signal.aborted) return;
      outputs.value = result;
    } else if (canvasId.value) {
      let result = await sources.nodes({ canvasId: canvasId.value, query: search.value, cursor: append ? nextCursor.value : undefined, signal: controller.signal });
      while (!controller.signal.aborted && !result.items.length && result.nextCursor) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (controller.signal.aborted) return;
        result = await sources.nodes({ canvasId: canvasId.value!, query: search.value, cursor: result.nextCursor, signal: controller.signal });
      }
      if (controller.signal.aborted) return;
      nodes.value = append ? [...nodes.value, ...result.items] : result.items;
      nextCursor.value = result.nextCursor;
    }
  } catch (error) {
    if (!controller.signal.aborted) loadError.value = error instanceof Error ? error.message : "加载失败，请重试";
  } finally {
    if (!controller.signal.aborted) loading.value = false;
  }
}

function loadMore() {
  void loadList(true);
}

async function chooseRow(row: MentionRow) {
  if (!row.available || selecting.value) return;
  selectionError.value = "";
  if (row.kind === "canvas") {
    selectedCanvas.value = { id: row.id, name: row.name };
    search.value = "";
    return;
  }
  if (row.kind === "directory") {
    assetPath.value = row.id;
    search.value = "";
    return;
  }
  if (row.kind === "output") {
    selectedOutputs.value = selectedOutputs.value.includes(row.id) ? selectedOutputs.value.filter(id => id !== row.id) : [...selectedOutputs.value, row.id];
    return;
  }
  if (row.kind === "node" && row.outputCount > 1) {
    selectedNode.value = nodes.value.find(item => item.id === row.id);
    search.value = "";
    return;
  }
  const controller = new AbortController();
  selectionController = controller;
  selecting.value = true;
  try {
    let mention: AgentMention;
    if (row.kind === "file") mention = await sources.selectAsset({ path: row.id, signal: controller.signal });
    else {
      const id = canvasId.value;
      if (!id) return;
      const result = await sources.outputs({ canvasId: id, nodeId: row.id, signal: controller.signal });
      if (controller.signal.aborted) return;
      const output = result.find(item => item.available);
      mention = await sources.selectCanvas({ canvasId: id, nodeId: row.id, outputId: output?.id, signal: controller.signal });
    }
    if (controller.signal.aborted) return;
    emit("select", [mention]);
    closeMenu();
  } catch (error) {
    if (!controller.signal.aborted) selectionError.value = error instanceof Error ? error.message : "引用失败，请重试";
  } finally {
    if (!controller.signal.aborted) selecting.value = false;
  }
}

async function confirmOutputs() {
  if (!selectedNode.value || !canvasId.value || !selectedOutputs.value.length || selecting.value) return;
  const controller = new AbortController();
  selectionController = controller;
  const id = canvasId.value;
  const nodeId = selectedNode.value.id;
  selecting.value = true;
  selectionError.value = "";
  try {
    const mentions = await Promise.all(selectedOutputs.value.map(outputId => sources.selectCanvas({ canvasId: id, nodeId, outputId, signal: controller.signal })));
    if (controller.signal.aborted) return;
    emit("select", mentions);
    closeMenu();
  } catch (error) {
    if (!controller.signal.aborted) selectionError.value = error instanceof Error ? error.message : "引用失败，请重试";
  } finally {
    if (!controller.signal.aborted) selecting.value = false;
  }
}

function handleKeydown(event: KeyboardEvent): boolean {
  if (!visible.value || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    return true;
  }
  const target = event.target;
  if (target instanceof HTMLElement && target.closest("button") && !target.closest(".mentionItem")) return false;
  if (!["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) return false;
  event.preventDefault();
  event.stopPropagation();
  if (loading.value || selecting.value || loadError.value || !rows.value.length) return true;
  if (event.key === "Enter") {
    void chooseRow(rows.value[activeIndex.value]!);
    return true;
  }
  const direction = event.key === "ArrowDown" ? 1 : -1;
  for (let step = 1; step <= rows.value.length; step++) {
    const index = (activeIndex.value + direction * step + rows.value.length) % rows.value.length;
    if (rows.value[index]?.available) {
      activeIndex.value = index;
      listVirtualizer.value.scrollToIndex(index, { align: "auto" });
      break;
    }
  }
  return true;
}

watch(() => props.query, query => { if (query !== undefined) search.value = query; });
watch(visible, open => {
  if (open) emit("open");
  else buttonVisible.value = false;
});
watch([visible, () => props.editor], ([open, editor], _previous, onCleanup) => {
  if (!open || !editor) return;
  const input = editor.closest(".messageInput") ?? editor;
  function updatePopupPosition() {
    const bounds = input.getBoundingClientRect();
    const above = Math.max(0, bounds.top - 16);
    const below = Math.max(0, window.innerHeight - bounds.bottom - 16);
    const openBelow = above < 220 && below > above;
    const available = openBelow ? below : above;
    const width = Math.min(bounds.width, Math.max(0, window.innerWidth - 16));
    popupHeight.value = Math.min(420, available);
    popupStyle.value = {
      width: `${width}px`,
      left: `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`,
      top: openBelow ? `${bounds.bottom + 8}px` : "auto",
      bottom: openBelow ? "auto" : `${window.innerHeight - bounds.top + 8}px`,
    };
  }
  const observer = new ResizeObserver(updatePopupPosition);
  for (const element of [input, editor.closest(".agentConversation"), editor.closest(".floatingAgent")]) if (element) observer.observe(element);
  window.addEventListener("resize", updatePopupPosition);
  window.addEventListener("scroll", updatePopupPosition, true);
  updatePopupPosition();
  onCleanup(() => {
    observer.disconnect();
    window.removeEventListener("resize", updatePopupPosition);
    window.removeEventListener("scroll", updatePopupPosition, true);
  });
}, { flush: "post" });
watch([visible, scope, canvasId, selectedNode, assetPath, () => props.directory], () => {
  clearTimeout(searchTimer);
  requestController?.abort();
  selectionController?.abort();
  selecting.value = false;
  loading.value = false;
  selectionError.value = "";
  loadError.value = "";
  nodes.value = [];
  outputs.value = [];
  assets.value = [];
  canvases.value = [];
  selectedOutputs.value = [];
  nextCursor.value = undefined;
  if (!visible.value) return;
  loading.value = true;
  searchTimer = setTimeout(() => void loadList(), search.value ? 180 : 0);
}, { immediate: true });
watch(search, () => {
  if (!visible.value || listingCanvases.value || selectedNode.value) return;
  clearTimeout(searchTimer);
  requestController?.abort();
  selectionController?.abort();
  selecting.value = false;
  selectionError.value = "";
  loadError.value = "";
  nodes.value = [];
  assets.value = [];
  nextCursor.value = undefined;
  loading.value = true;
  searchTimer = setTimeout(() => void loadList(), search.value ? 180 : 0);
});
watch(rows, async (items, previous) => {
  const previousId = previous[activeIndex.value]?.id;
  const retainedIndex = items.findIndex(item => item.id === previousId);
  activeIndex.value = retainedIndex >= 0 ? retainedIndex : Math.max(0, items.findIndex(item => item.available));
  if (retainedIndex >= 0 || !items.length) return;
  await nextTick();
  listVirtualizer.value.scrollToIndex(activeIndex.value, { align: "start" });
});
watch([visible, visibleRows, activeIndex, loading], async () => {
  await nextTick();
  const editor = props.editor?.querySelector('[role="textbox"]');
  if (visible.value) {
    editor?.setAttribute("aria-haspopup", "listbox");
    editor?.setAttribute("aria-expanded", "true");
    editor?.setAttribute("aria-controls", listId);
    const id = `${listId}-${activeIndex.value}`;
    if (!loading.value && document.getElementById(id)) {
      editor?.setAttribute("aria-activedescendant", id);
    } else editor?.removeAttribute("aria-activedescendant");
  } else if (editor?.getAttribute("aria-controls") === listId) {
    editor.setAttribute("aria-expanded", "false");
    editor.removeAttribute("aria-activedescendant");
  }
});
onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  requestController?.abort();
  selectionController?.abort();
});
defineExpose({ handleKeydown, openMenu, closeMenu });
</script>

<style lang="scss" scoped>
.mentionMenu {
  flex-shrink: 0;

  &.mentionOverlay { position: fixed; z-index: 3001; font-size: 13px; }

  .mentionButton { width: 24px; height: 24px; padding: 0; }

  .mentionPopup {
    min-width: 0;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    color: var(--el-text-color-primary);

    .mentionHeader { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px 0; font-size: 13px; }
    .mentionScopes {
      display: flex;
      gap: 3px;
      padding: 6px 9px;

      button {
        flex: 1;
        min-width: 0;
        padding: 6px 2px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--el-text-color-secondary);
        font: inherit;
        font-size: 12px;
        white-space: nowrap;
        cursor: pointer;

        &.selected { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      }
    }
    .mentionBreadcrumb {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 0 8px 4px;
      font-size: 12px;

      span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
    .mentionSearch { padding: 0 9px 7px; }
    .mentionList {
      padding: 0 5px 5px;

      .mentionStatus { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px; padding: 22px 10px; color: var(--el-text-color-secondary); font-size: 12px; overflow-wrap: anywhere; }
      .mentionRows {
        position: relative;

        .mentionItem {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 52px;
          box-sizing: border-box;
          padding: 8px 7px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--el-text-color-primary);
          text-align: left;
          font: inherit;
          cursor: pointer;

          &.active, &:focus-visible { background: var(--el-fill-color-light); }
          &.checked { background: var(--el-color-primary-light-9); }
          &.unavailable { opacity: 0.5; cursor: not-allowed; }
          .mentionContent {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 3px;
            min-width: 0;

            .mentionName, .mentionDescription { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .mentionName { font-size: 13px; }
            .mentionDescription { color: var(--el-text-color-secondary); font-size: 11px; }
          }
          .mentionState { flex-shrink: 0; font-size: 11px; color: var(--el-text-color-secondary); }
          .mentionArrow { flex-shrink: 0; color: var(--el-text-color-secondary); }
          .mentionCheck {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 14px;
            height: 14px;
            border: 1px solid var(--el-border-color);
            border-radius: 3px;

            &.selected { background: var(--el-color-primary); border-color: var(--el-color-primary); color: white; }
          }
        }
      }
      .mentionMore { width: 100%; font-size: 12px; }
    }
    .mentionFooter { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-height: 34px; padding: 5px 10px; border-top: 1px solid var(--el-border-color-lighter); color: var(--el-text-color-secondary); font-size: 11px; }
    .mentionError { padding: 0 10px 8px; color: var(--el-color-danger); font-size: 12px; overflow-wrap: anywhere; }
  }
}
</style>
