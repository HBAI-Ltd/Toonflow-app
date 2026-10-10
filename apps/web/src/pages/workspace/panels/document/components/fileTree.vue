<template>
  <aside class="fileTree" aria-label="工作区文件">
    <header class="treeHeader" :class="{ dropTarget: dropTargetKey === 'root' }" @dragover.stop="dragOver($event, rootItem)" @dragleave="dragLeave" @drop.stop="dropFiles($event, rootItem)">
      <span class="treeTitle"><icon-folder :size="16" aria-hidden="true" />工作区文件</span>
      <span class="treeActions">
        <el-button text circle size="small" :disabled="!directory || creating || busy" aria-label="新建文件" title="在当前目录新建文件" @click="createEntry(false)">
          <icon-file-plus :size="15" aria-hidden="true" />
        </el-button>
        <el-button text circle size="small" :disabled="!directory || creating || busy" aria-label="新建文件夹" title="在当前目录新建文件夹" @click="createEntry(true)"><icon-folder-plus :size="15" /></el-button>
        <el-button text circle size="small" :disabled="!directory" aria-label="刷新文件树" title="刷新文件树" @click="refreshTree">
          <icon-refresh :size="15" aria-hidden="true" />
        </el-button>
      </span>
    </header>
    <div class="treeTools">
      <el-input v-model="searchTerm" size="small" clearable placeholder="搜索文件与节点" aria-label="搜索工作区文件与节点" :prefixIcon="IconSearch" />
      <el-button text circle size="small" :disabled="!directory" aria-label="快速打开" title="快速打开" @click="emit('quickOpen'); props.params?.params.quickOpen?.()"><icon-file-search :size="15" /></el-button>
      <el-button text circle size="small" :disabled="!directory" aria-label="全文搜索" title="全文搜索" @click="emit('search'); props.params?.params.search?.()"><icon-search :size="15" /></el-button>
      <el-button text circle size="small" :disabled="!activeSelection" aria-label="定位当前标签" title="定位当前标签" @click="locateCurrent"><icon-focus-2 :size="15" /></el-button>
      <el-button text circle size="small" :aria-pressed="multiple" aria-label="勾选多个文件" title="多选" @click="toggleMultiple"><icon-list-check :size="15" /></el-button>
    </div>
    <div v-if="multiple && checkedItems.length" class="batchActions">
      <span>已选 {{ checkedItems.length }} 项</span>
      <el-button text size="small" :disabled="busy" @click="runChecked('copy')">复制</el-button>
      <el-button text size="small" :disabled="busy" @click="runChecked('cut')">剪切</el-button>
      <el-button text size="small" :disabled="busy" @click="runChecked('delete')">删除</el-button>
    </div>
    <el-alert v-if="loadError" class="loadError" :title="loadError" type="error" :closable="false" showIcon />
    <div ref="treeContent" v-loading="searching" class="treeContent" :class="{ dropTarget: dropTargetKey === 'root' }" role="tree" aria-label="工作区文件树" :aria-multiselectable="multiple" :aria-busy="searching || loadingKeys.size > 0" :aria-activedescendant="activeRowId" tabindex="0" @contextmenu.prevent="openBackgroundMenu" @keydown="onTreeKeydown" @pointerdown="locatingKey = undefined" @wheel.passive="locatingKey = undefined" @touchstart.passive="locatingKey = undefined"
      @dragover.stop="dragOver($event, rootItem)" @dragleave="dragLeave" @drop.stop="dropFiles($event, rootItem)">
      <div v-if="directory && !treeRows.length && !loadingKeys.size && !searching" class="emptyTree">{{ searchTerm.trim() ? '没有匹配的文件或节点' : '暂无文件' }}</div>
      <div class="treeRows" :style="{ height: `${treeVirtualizer.getTotalSize()}px` }">
        <div v-for="{ row, data, index, start } in visibleRows" :id="`${treeId}-${index}`" :key="row.item.key" class="treeRow" :class="{ current: currentKey === row.item.key, focused: focusedItem?.key === row.item.key, dropTarget: dropTargetKey === row.item.key }" :data-key="row.item.key"
          :style="{ transform: `translateY(${start}px)`, paddingLeft: `${(row.level - 1) * 16}px` }" role="treeitem" :aria-label="row.item.displayLabel || row.item.name" :aria-level="row.level" :aria-posinset="row.position" :aria-setsize="row.size"
          :aria-expanded="!row.item.isLeaf ? expandedSet.has(row.item.key) : undefined" :aria-selected="currentKey === row.item.key" :aria-checked="multiple && row.item.type !== 'node' ? checkedKeys.has(row.item.key) : undefined"
          :draggable="!busy && !creating && row.item.type !== 'node'"
          @dragstart.stop="startDrag($event, row.item)" @dragend.stop="clearDrag" @dragover.stop="dragOver($event, row.item)" @dragleave.stop="dragLeave" @drop.stop="dropFiles($event, row.item)"
          @click="clickRow(row.item)" @dblclick.stop="selectNode(row.item, false)" @contextmenu.stop.prevent="openMenu($event, row.item)">
          <span class="expandIcon" :class="{ expanded: expandedSet.has(row.item.key), loading: loadingKeys.has(row.item.key) }" aria-hidden="true" @click.stop="focusRow(row.item); toggleExpanded(row.item)">
            <icon-loader-2 v-if="loadingKeys.has(row.item.key)" :size="13" />
            <icon-chevron-right v-else-if="!row.item.isLeaf" :size="13" />
          </span>
          <el-checkbox v-if="multiple" :modelValue="checkedKeys.has(row.item.key)" :disabled="row.item.type === 'node'" :aria-label="`选择 ${row.item.displayLabel || row.item.name}`" :tabindex="-1" @click.stop @change="toggleChecked(row.item)" />
          <span class="fileItem" :class="{ cutItem: isCut(data) }" :title="itemTitle(data)" @dblclick.stop="selectNode(data, false)">
            <component v-if="data.nodeId" :is="getNodeIcon(data.nodeType) ?? IconBox" :size="16" aria-hidden="true" />
            <img v-else-if="itemIcon(data)" class="fileIcon" :src="itemIcon(data)" :draggable="false" alt="" />
            <icon-layout-dashboard v-else-if="data.type === 'canvas'" :size="16" aria-hidden="true" />
            <icon-folder-open v-else-if="data.type === 'directory' && expandedSet.has(data.key)" :size="16" aria-hidden="true" />
            <icon-folder v-else-if="data.type === 'directory'" :size="16" aria-hidden="true" />
            <icon-file v-else :size="16" aria-hidden="true" />
            <span class="fileName">{{ data.displayLabel || data.name }}<small v-if="searchTerm.trim()">{{ data.path }}</small></span>
            <small v-if="data.displayLabel && data.nodeId" class="nodeId" :title="data.nodeId">({{ data.nodeId.slice(0, 8) }}{{ data.nodeId.length > 8 ? '…' : '' }})</small>
          </span>
        </div>
      </div>
    </div>
    <el-dropdown ref="menu" trigger="contextmenu" virtualTriggering :virtualRef="menuAnchor" placement="bottom-start" :showArrow="false" @command="command => handleCommand(command)">
      <template #dropdown>
        <el-dropdown-menu v-if="menuItem" class="fileActionMenu" :aria-label="menuItem.name">
          <el-dropdown-item v-if="menuItem.type === 'file'" command="openWith" :disabled="busy">打开方式…</el-dropdown-item>
          <template v-if="menuItem.type !== 'node'">
            <el-dropdown-item command="newFile" :disabled="busy">新建文件…</el-dropdown-item>
            <el-dropdown-item command="newFolder" :disabled="busy">新建文件夹…</el-dropdown-item>
            <el-dropdown-item v-if="!isMobile && !isRemoteConnection" command="reveal" :disabled="busy">以资源管理器打开</el-dropdown-item>
            <el-dropdown-item command="copy" :disabled="busy || !menuItem.path" divided>复制</el-dropdown-item>
            <el-dropdown-item command="cut" :disabled="busy || !menuItem.path">剪切</el-dropdown-item>
            <el-dropdown-item command="paste" :disabled="busy || !clipboard?.items.length">粘贴</el-dropdown-item>
          </template>
          <el-dropdown-item command="copyPath" :divided="menuItem.type !== 'node'">{{ menuItem.type === 'node' ? "复制画布相对路径" : "复制路径（相对）" }}</el-dropdown-item>
          <el-dropdown-item command="copyAbsolutePath">{{ menuItem.type === 'node' ? "复制画布绝对路径" : "复制绝对路径" }}</el-dropdown-item>
          <el-dropdown-item v-if="menuItem.type !== 'node' && menuItem.path" command="rename" :disabled="busy" divided>重命名</el-dropdown-item>
          <el-dropdown-item v-if="menuItem.path" command="delete" :disabled="busy" :divided="menuItem.type === 'node'" class="deleteAction">删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, useId, watch, type ShallowRef } from "vue";
import axios from "axios";
import type { IDockviewPanelProps } from "dockview-vue";
import type { DropdownInstance } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/vue-virtual";
import { IconBox, IconChevronRight, IconFile, IconFilePlus, IconFileSearch, IconFocus2, IconFolder, IconFolderOpen, IconFolderPlus, IconLayoutDashboard, IconListCheck, IconLoader2, IconRefresh, IconSearch } from "@tabler/icons-vue";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { settingsStorage } from "@/stores/settings";
import { writeClipboardText } from "@/lib/clipboard";
import { isMobile, isRemoteConnection } from "@/lib/platform";
import { t } from "@toonflow/i18n/vue";
import { isCanvasFile } from "@/pages/workspace/canvasFile";
import { extensionCandidates, extensionIcon, listExtensions } from "../extensions";
import { getNodeIcon } from "../../canvas/loadNodeComponent";
import type { DocumentNode, DocumentNodeOptions } from "../../canvas/canvasFiles";

type CanvasNodeSelection = { canvasPath: string; nodeId: string; label: string };
type FileSelection = { filePath: string; label: string };
export type TreeSelection = CanvasNodeSelection | FileSelection;
export type FileAction = "copy" | "rename" | "move" | "delete" | "reveal" | "create" | "mkdir" | "openWith";
export type FileTreeItem = {
  key: string;
  name: string;
  path: string;
  type: "file" | "directory" | "canvas" | "node";
  isLeaf?: boolean;
  nodeId?: string;
  nodeType?: string;
  displayLabel?: string;
  nodeLocations?: string[];
};
type TreeRow = { item: FileTreeItem; level: number; parentKey?: string; position: number; size: number };

const props = defineProps<{
  directory?: string;
  activeSelection?: TreeSelection;
  params?: IDockviewPanelProps<{
    directory: string;
    revision?: number;
    selection: ShallowRef<TreeSelection | undefined>;
    open: (selection: TreeSelection, preview?: boolean) => void;
    quickOpen?: () => void;
    search?: () => void;
    readNodes: (directory: string, options?: DocumentNodeOptions) => Promise<DocumentNode[]>;
    executeFileAction: (action: FileAction, item: FileTreeItem, target?: string) => Promise<void>;
  }>;
}>();
const emit = defineEmits<{ selectNode: [selection: TreeSelection]; open: [selection: TreeSelection, preview?: boolean]; quickOpen: []; search: [] }>();
const directory = computed(() => props.directory ?? props.params?.params.directory);
const activeSelection = computed(() => props.activeSelection ?? props.params?.params.selection.value);
const treeContent = ref<HTMLDivElement>();
const treeId = useId();
const treeVersion = ref(0);
const loadError = ref("");
const childrenByKey = shallowReactive(new Map<string, FileTreeItem[]>());
const loadingKeys = shallowReactive(new Set<string>());
const pendingLoads = new Map<string, Promise<void>>();
const currentKey = ref<string>();
const menu = ref<DropdownInstance>();
const menuAnchor = shallowRef({ getBoundingClientRect: () => new DOMRect() });
const menuItem = shallowRef<FileTreeItem>();
const focusedItem = shallowRef<FileTreeItem>();
const clipboard = shallowRef<{ directory: string; items: FileTreeItem[]; cut: boolean }>();
const dragged = shallowRef<typeof clipboard.value>();
const draggedKey = ref<string>();
const dropTargetKey = ref<string>();
const treeDragType = "application/x-toonflow-file-tree";
let expandTimer: ReturnType<typeof setTimeout> | undefined;
const multiple = ref(false);
const checkedItems = shallowRef<FileTreeItem[]>([]);
const expandedKeys = ref<string[]>([]);
const searchTerm = ref("");
const searchResults = shallowRef<FileTreeItem[]>([]);
const searching = ref(false);
let searchRevision = 0;
let locatingKey: string | undefined;
const assetNodes = new Map<AbortSignal, Promise<Map<string, DocumentNode[]>>>();
let treeController = new AbortController();
const busy = ref(false);
const rootItem = computed<FileTreeItem>(() => ({ key: "root", name: directory.value?.split(/[\\/]/).filter(Boolean).at(-1) ?? "工作区", path: "", type: "directory" }));
const expandedSet = computed(() => new Set(expandedKeys.value));
const checkedKeys = computed(() => new Set(checkedItems.value.map(item => item.key)));
const treeRows = computed<TreeRow[]>(() => {
  if (searchTerm.value.trim()) return searchResults.value.map((item, index, items) => ({ item, level: 1, position: index + 1, size: items.length }));
  const rows: TreeRow[] = [];
  const append = (items: FileTreeItem[], level: number, parentKey?: string) => {
    items.forEach((item, index) => {
      rows.push({ item, level, parentKey, position: index + 1, size: items.length });
      if (expandedSet.value.has(item.key)) append(childrenByKey.get(item.key) ?? [], level + 1, item.key);
    });
  };
  append(childrenByKey.get("root") ?? [], 1);
  return rows;
});
const rowIndexes = computed(() => new Map(treeRows.value.map((row, index) => [row.item.key, index])));
// ACT: 数据与展开状态完整保留，只挂载可见行和少量缓冲；目录仍按需读取。
const treeVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(computed(() => {
  const sourceIndex = rowIndexes.value.get(draggedKey.value ?? "");
  return {
    count: treeRows.value.length,
    getScrollElement: () => treeContent.value ?? null,
    getItemKey: (index: number) => treeRows.value[index]!.item.key,
    estimateSize: () => 28,
    overscan: 6,
    rangeExtractor: range => {
      const indexes = defaultRangeExtractor(range);
      // 保留拖拽源行，避免滚出视口时 DOM 被回收而取消原生拖拽。
      if (sourceIndex !== undefined && !indexes.includes(sourceIndex)) indexes.push(sourceIndex);
      return indexes.sort((left, right) => left - right);
    },
    useAnimationFrameWithResizeObserver: true,
  };
}));
const visibleRows = computed(() => treeVirtualizer.value.getVirtualItems().map(item => ({ row: treeRows.value[item.index]!, data: treeRows.value[item.index]!.item, index: item.index, start: item.start })));
const activeRowId = computed(() => {
  const row = visibleRows.value.find(({ row }) => row.item.key === focusedItem.value?.key);
  return row ? `${treeId}-${row.index}` : undefined;
});

function pathIdentity(path: string) {
  const normalized = path.replaceAll("\\", "/").replace(/\/+$/, "");
  return /^(?:[a-z]:[\\/]|\\\\|\/\/)/i.test(directory.value ?? "") ? normalized.toLowerCase() : normalized;
}
function storageKey(workspaceDirectory = directory.value ?? "") {
  const normalized = workspaceDirectory.replaceAll("\\", "/").replace(/\/+$/, "");
  return `toonflow:documentTree:${/^(?:[a-z]:[\\/]|\\\\|\/\/)/i.test(workspaceDirectory) ? normalized.toLowerCase() : normalized}`;
}
function persistTreeState(workspaceDirectory = directory.value) {
  if (!workspaceDirectory) return;
  try { settingsStorage.setItem(storageKey(workspaceDirectory), JSON.stringify({ expandedKeys: expandedKeys.value })); }
  catch { ElMessage.warning("无法保存文件树展开状态"); }
}
function loadTreeState() {
  expandedKeys.value = [];
  if (!directory.value) return;
  try {
    const state = JSON.parse(settingsStorage.getItem(storageKey()) ?? "{}");
    if (Array.isArray(state.expandedKeys)) expandedKeys.value = state.expandedKeys.filter((key: unknown) => typeof key === "string");
  } catch { /* 无效的本地状态不影响文件读取。 */ }
}
function expandNode(item: FileTreeItem) {
  if (searchTerm.value.trim() || item.isLeaf) return;
  if (!expandedSet.value.has(item.key)) { expandedKeys.value.push(item.key); persistTreeState(); }
  void loadChildren(item);
}
function collapseNode(item: FileTreeItem) {
  if (searchTerm.value.trim()) return;
  expandedKeys.value = expandedKeys.value.filter(key => {
    try { const path = JSON.parse(key)[1] as string; return key !== item.key && !path.startsWith(`${item.path}/`); }
    catch { return false; }
  });
  persistTreeState();
}
function relocateExpansion(source: string, target?: string) {
  const identity = pathIdentity(source);
  expandedKeys.value = expandedKeys.value.flatMap(key => {
    try {
      const parts = JSON.parse(key) as string[];
      const path = parts[1]!;
      if (pathIdentity(path) !== identity && !pathIdentity(path).startsWith(`${identity}/`)) return [key];
      if (!target) return [];
      parts[1] = target + path.slice(source.length);
      return [JSON.stringify(parts)];
    } catch { return []; }
  });
  persistTreeState();
}
function toggleChecked(item: FileTreeItem) {
  focusRow(item);
  if (!item.path || item.type === "node") return;
  checkedItems.value = checkedKeys.value.has(item.key) ? checkedItems.value.filter(entry => entry.key !== item.key) : [...checkedItems.value, item];
}
function toggleMultiple() { multiple.value = !multiple.value; checkedItems.value = []; }
function currentItem() {
  const index = rowIndexes.value.get(focusedItem.value?.key ?? currentKey.value ?? "");
  return index === undefined ? rootItem.value : treeRows.value[index]!.item;
}
function focusRow(item: FileTreeItem, scroll = false) {
  focusedItem.value = item;
  currentKey.value = item.key;
  treeContent.value?.focus({ preventScroll: true });
  const index = rowIndexes.value.get(item.key);
  if (scroll && index !== undefined) treeVirtualizer.value.scrollToIndex(index, { align: "auto" });
}
function toggleExpanded(item: FileTreeItem) {
  if (item.isLeaf || searchTerm.value.trim()) return;
  if (expandedSet.value.has(item.key)) collapseNode(item);
  else expandNode(item);
}
function clickRow(item: FileTreeItem) {
  focusRow(item);
  toggleExpanded(item);
  selectNode(item, true);
}
function selectedItems(item: FileTreeItem) {
  const items = multiple.value && checkedItems.value.length && (!item.path || checkedItems.value.some(checked => checked.key === item.key)) ? checkedItems.value : [item];
  return items.filter(candidate => candidate.path && candidate.type !== "node" && !items.some(parent => parent !== candidate
    && parent.type === "directory" && pathIdentity(candidate.path).startsWith(`${pathIdentity(parent.path)}/`)));
}
function clearDropTarget() {
  clearTimeout(expandTimer);
  expandTimer = undefined;
  dropTargetKey.value = undefined;
}
function clearDrag() { dragged.value = undefined; draggedKey.value = undefined; clearDropTarget(); }
function startDrag(event: DragEvent, item: FileTreeItem) {
  clearDrag();
  if (!directory.value || busy.value || creating.value || item.type === "node" || !event.dataTransfer) { event.preventDefault(); return; }
  const items = selectedItems(item);
  if (!items.length) { event.preventDefault(); return; }
  locatingKey = undefined;
  menu.value?.handleClose();
  // 使用路径快照，避免拖拽期间选中项或目录展开发生变化。
  dragged.value = { directory: directory.value, items: items.map(entry => ({ ...entry })), cut: true };
  draggedKey.value = item.key;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(treeDragType, treeId);
}
function canDrop(item: FileTreeItem) {
  const source = dragged.value;
  if (!source || source.directory !== directory.value || busy.value || creating.value || item.type !== "directory") return false;
  const destination = pathIdentity(item.path);
  return source.items.every(entry => entry.type !== "directory" || (destination !== pathIdentity(entry.path) && !destination.startsWith(`${pathIdentity(entry.path)}/`)))
    && source.items.some(entry => pathIdentity(parentPath(entry.path)) !== destination);
}
function dragOver(event: DragEvent, item: FileTreeItem) {
  if (!event.dataTransfer?.types.includes(treeDragType) || !canDrop(item)) {
    clearDropTarget();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  if (dropTargetKey.value === item.key) return;
  clearDropTarget();
  dropTargetKey.value = item.key;
  if (item.path && !expandedSet.value.has(item.key)) expandTimer = setTimeout(() => expandNode(item), 650);
}
function dragLeave(event: DragEvent) {
  if (event.currentTarget instanceof Element && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
  clearDropTarget();
}
async function dropFiles(event: DragEvent, item: FileTreeItem) {
  if (!event.dataTransfer?.types.includes(treeDragType)) return;
  event.preventDefault();
  const source = event.dataTransfer.getData(treeDragType) === treeId && canDrop(item) ? dragged.value : undefined;
  clearDrag();
  if (!source) return;
  await handleCommand("paste", item, source);
}
function runChecked(command: string) { menuItem.value = rootItem.value; void handleCommand(command); }
function isCut(item: FileTreeItem) { return clipboard.value?.cut && clipboard.value.items.some(source => pathIdentity(source.path) === pathIdentity(item.path)); }

function itemIcon(item: FileTreeItem) {
  if (!directory.value || item.type !== "file") return;
  return extensionIcon({ kind: "file", directory: directory.value, path: item.path, label: item.name });
}
function itemTitle(item: FileTreeItem) {
  return item.displayLabel ? `${item.displayLabel}\nID: ${item.nodeId}\n${item.path}\n${item.nodeLocations?.join("\n") ?? ""}`
    : item.type === "node" ? `${item.name}\nID: ${item.nodeId}\n${item.path}` : searchTerm.value.trim() ? item.path : item.name;
}
onMounted(() => { void listExtensions().catch(showActionError); });

async function openMenu(event: Event, item: FileTreeItem) {
  event.preventDefault();
  event.stopPropagation();
  menu.value?.handleClose();
  menuItem.value = item;
  focusRow(item);
  const target = event instanceof KeyboardEvent ? document.getElementById(`${treeId}-${rowIndexes.value.get(item.key)}`) ?? treeContent.value
    : event.target instanceof Element ? event.target.closest<HTMLElement>(".treeRow, .treeContent") : undefined;
  const rect = event instanceof MouseEvent ? new DOMRect(event.clientX, event.clientY, 0, 0) : target?.getBoundingClientRect() ?? new DOMRect();
  menuAnchor.value = { getBoundingClientRect: () => rect };
  await nextTick();
  menu.value?.handleOpen();
}

function openBackgroundMenu(event: MouseEvent) {
  if (directory.value) void openMenu(event, rootItem.value);
}

function onTreeKeydown(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLElement) || event.target.closest("input, textarea, [contenteditable='true']")) return;
  locatingKey = undefined;
  const item = currentItem();
  const index = rowIndexes.value.get(item.key) ?? -1;
  if (!event.ctrlKey && !event.metaKey && !event.altKey && ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    let target: TreeRow | undefined;
    if (event.key === "ArrowDown") target = treeRows.value[Math.min(index + 1, treeRows.value.length - 1)];
    else if (event.key === "ArrowUp") target = treeRows.value[Math.max(0, index - 1)];
    else if (event.key === "Home") target = treeRows.value[0];
    else if (event.key === "End") target = treeRows.value.at(-1);
    else if (event.key === "ArrowRight" && !item.isLeaf && !searchTerm.value.trim()) {
      if (!expandedSet.value.has(item.key)) expandNode(item);
      else if (treeRows.value[index + 1]?.parentKey === item.key) target = treeRows.value[index + 1];
    } else if (event.key === "ArrowLeft" && !searchTerm.value.trim()) {
      if (expandedSet.value.has(item.key)) collapseNode(item);
      else { const parentIndex = rowIndexes.value.get(treeRows.value[index]?.parentKey ?? ""); if (parentIndex !== undefined) target = treeRows.value[parentIndex]; }
    } else if (item.path && event.key === "Enter") { toggleExpanded(item); selectNode(item, false); }
    else if (item.path && event.key === " ") { if (multiple.value) toggleChecked(item); else toggleExpanded(item); }
    if (target) focusRow(target.item, true);
    return;
  }
  if ((event.shiftKey && event.key === "F10") || event.key === "ContextMenu") {
    void openMenu(event, item);
    return;
  }
  if (busy.value || creating.value) return;
  const modifier = (event.ctrlKey || event.metaKey) && !event.altKey;
  const command = modifier && event.key.toLowerCase() === "c" ? "copy"
    : modifier && event.key.toLowerCase() === "x" ? "cut"
    : modifier && event.key.toLowerCase() === "v" ? "paste"
    : !modifier && event.key === "F2" ? "rename"
    : !modifier && event.key === "Delete" ? "delete" : undefined;
  if (!command || (item.type === "node" && command !== "delete") || (!item.path && command !== "paste" && !checkedItems.value.length)) return;
  event.preventDefault();
  event.stopPropagation();
  menuItem.value = item;
  void handleCommand(command);
}

function parentPath(path: string) { return path.split(/[\\/]/).slice(0, -1).join("/"); }
function childPath(parent: string, name: string) { return parent ? `${parent}/${name}` : name; }

async function executeFileAction(action: FileAction, item: FileTreeItem, target?: string) {
  const execute = props.params?.params.executeFileAction;
  if (!execute) throw new Error("文件操作宿主尚未就绪");
  await execute(action, item, target);
}

function showActionError(error: unknown) {
  if (error === "cancel" || error === "close") return;
  const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
  ElMessage.error(message || (error instanceof Error ? error.message : "文件操作失败"));
}

async function handleCommand(command: string, item = menuItem.value, source = clipboard.value) {
  const currentDirectory = directory.value;
  menu.value?.handleClose();
  if (!item || !currentDirectory || busy.value || creating.value) return;
  if (command === "newFile" || command === "newFolder") return createEntry(command === "newFolder", item);
  busy.value = true;
  let changed = false;
  let completed = 0;
  let total = 1;
  try {
    if (command === "copyPath" || command === "copyAbsolutePath") {
      const separator = currentDirectory.includes("\\") ? "\\" : "/";
      const absolutePath = item.path ? currentDirectory.replace(/[\\/]+$/, "") + separator + item.path.replace(/[\\/]/g, separator) : currentDirectory;
      await writeClipboardText(command === "copyPath" ? item.path || "." : absolutePath);
      return;
    }
    if (item.type === "node" && command !== "delete") return;
    if (command === "copy" || command === "cut") {
      const items = selectedItems(item);
      if (items.length) clipboard.value = { directory: currentDirectory, items: items.map(item => ({ ...item })), cut: command === "cut" };
      return;
    }
    if (command === "paste") {
      if (!source || source.directory !== currentDirectory) return;
      const usingClipboard = source === clipboard.value;
      const destination = item.type === "directory" ? item.path : parentPath(item.path);
      const { entries } = await useWorkspaceFiles(currentDirectory).list(destination);
      const names = new Set(entries.map(entry => pathIdentity(entry.name)));
      total = source.items.length;
      // ACT: 批量文件操作逐项协调，已完成项保留；错误明确报告进度，剩余剪切项可继续粘贴。
      for (const entry of [...source.items]) {
        if (currentDirectory !== directory.value) throw new Error("工作目录已切换");
        const from = pathIdentity(entry.path);
        const to = pathIdentity(destination);
        if (entry.type === "directory" && (to === from || to.startsWith(`${from}/`))) throw new Error("不能将文件夹粘贴到自身或其子目录");
        let name = entry.name;
        if (!source.cut) {
          const dot = entry.type === "directory" ? -1 : name.lastIndexOf(".");
          const stem = dot > 0 ? name.slice(0, dot) : name;
          const suffix = dot > 0 ? name.slice(dot) : "";
          for (let index = 1; names.has(pathIdentity(name)); index++) name = `${stem} 副本${index === 1 ? "" : ` ${index}`}${suffix}`;
        }
        const target = childPath(destination, name);
        if (!source.cut || pathIdentity(target) !== from) {
          await executeFileAction(source.cut ? "move" : "copy", entry, target);
          if (currentDirectory !== directory.value) throw new Error("工作目录已切换");
          if (source.cut) relocateExpansion(entry.path, target);
          changed = true;
        }
        names.add(pathIdentity(name));
        completed++;
        if (source.cut && usingClipboard) clipboard.value = { ...source, items: source.items.filter(candidate => candidate !== entry) };
        if (source.cut) source.items = source.items.filter(candidate => candidate !== entry);
      }
      if (source.cut && usingClipboard) clipboard.value = undefined;
    } else if (command === "rename" && item.path) {
      const { value } = await ElMessageBox.prompt("名称", "重命名", {
        inputValue: item.name,
        inputValidator: value => !!value?.trim() && !/[\\/\0]/.test(value) && ![".", ".."].includes(value.trim()) || "请输入有效名称，不能包含斜杠",
        confirmButtonText: "保存", cancelButtonText: "取消",
      });
      if (value.trim() === item.name || currentDirectory !== directory.value) return;
      const target = childPath(parentPath(item.path), value.trim());
      await executeFileAction("rename", item, target);
      relocateExpansion(item.path, target);
      changed = true;
      completed++;
      clipboard.value = undefined;
    } else if (command === "delete") {
      const items = item.type === "node" ? [item] : selectedItems(item);
      if (!items.length) return;
      total = items.length;
      const detail = item.type === "node" ? t`该节点会从画布中删除。` : items.some(item => item.type === "directory" || item.type === "canvas") ? t`所选文件夹的全部内容、画布的全部节点会一并删除。` : "";
      await ElMessageBox.confirm(`删除${items.length === 1 ? `“${items[0]!.name}”` : `这 ${items.length} 项`}？${detail}此操作不可恢复。`, item.type === "node" ? "删除节点" : "删除文件", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消", closeOnClickModal: false });
      if (currentDirectory !== directory.value) return;
      for (const entry of items) {
        if (currentDirectory !== directory.value) throw new Error("工作目录已切换");
        await executeFileAction("delete", entry);
        if (entry.type !== "node" && directory.value === currentDirectory) relocateExpansion(entry.path);
        completed++;
        changed = true;
      }
      clipboard.value = undefined;
    } else if (command === "reveal" || command === "openWith") {
      await executeFileAction(command, item);
      return;
    } else return;
    if (total > 1) ElMessage.success(`已完成 ${completed} / ${total} 项`);
  } catch (error) {
    if (total > 1 && error !== "cancel" && error !== "close") {
      const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : error instanceof Error ? error.message : "文件操作失败";
      ElMessage.error(`已完成 ${completed} / ${total} 项，剩余未执行：${message}`);
    } else showActionError(error);
  } finally { busy.value = false; if (changed && currentDirectory === directory.value) refreshTree(); }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function canvasItems(canvas: Record<string, unknown>, path: string): FileTreeItem[] {
  if (!Array.isArray(canvas.nodes)) return [];
  return canvas.nodes.flatMap((node): FileTreeItem[] => {
    if (!isRecord(node) || typeof node.id !== "string" || !node.id || node.type === "canvasGroup" || !isRecord(node.data)) return [];
    return [{
      key: JSON.stringify(["node", path, node.id]),
      name: typeof node.data.label === "string" && node.data.label.trim() ? node.data.label : node.id,
      path,
      type: "node",
      nodeId: node.id,
      nodeType: typeof node.type === "string" ? node.type : undefined,
      isLeaf: true,
    }];
  }).sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
}

function fileExtension(item: FileTreeItem) {
  if (item.type === "canvas") return "json";
  const index = item.name.lastIndexOf(".");
  return index > 0 ? item.name.slice(index + 1).toLowerCase() : "";
}

function selectNode(item: FileTreeItem, preview = false) {
  focusedItem.value = item;
  if (searchTerm.value.trim() && (item.type === "directory" || item.type === "canvas")) { locateItem(item); return; }
  const selection: TreeSelection | undefined = item.type === "node" && item.nodeId
    ? { canvasPath: item.path, nodeId: item.nodeId, label: item.name }
    : item.type === "file" ? { filePath: item.path, label: item.name } : undefined;
  if (!selection) return;
  emit("selectNode", selection);
  emit("open", selection, preview);
  props.params?.params.open(selection, preview);
}

function syncCurrentSelection() {
  const selection = activeSelection.value;
  const key = locatingKey ?? (!selection ? undefined : "nodeId" in selection
    ? JSON.stringify(["node", selection.canvasPath, selection.nodeId])
    : JSON.stringify(["file", selection.filePath]));
  currentKey.value = key;
  if (locatingKey) {
    const index = rowIndexes.value.get(locatingKey);
    if (index !== undefined) {
      focusRow(treeRows.value[index]!.item);
      treeVirtualizer.value.scrollToIndex(index, { align: "center" });
      if (!loadingKeys.size) locatingKey = undefined;
    }
  }
}
watch([activeSelection, treeRows, () => loadingKeys.size], syncCurrentSelection, { immediate: true, flush: "post" });
watch(activeSelection, () => { focusedItem.value = undefined; });

function refreshTree() {
  clearDrag();
  treeController.abort();
  treeController = new AbortController();
  assetNodes.clear();
  treeVersion.value++;
  childrenByKey.clear();
  pendingLoads.clear();
  loadingKeys.clear();
  loadError.value = "";
  checkedItems.value = [];
  if (directory.value) void loadChildren(rootItem.value);
}

function locateItem(item: FileTreeItem) {
  const parts = item.path.split("/");
  const keys = parts.slice(0, -1).map((_part, index) => JSON.stringify(["directory", parts.slice(0, index + 1).join("/")]));
  if (item.type === "node") keys.push(JSON.stringify(["canvas", item.path]));
  if (item.type === "directory" || item.type === "canvas") keys.push(item.key);
  expandedKeys.value = [...new Set([...expandedKeys.value, ...keys])];
  locatingKey = item.key;
  searchTerm.value = "";
  persistTreeState();
  refreshTree();
}
function locateCurrent() {
  const selection = activeSelection.value;
  if (!selection) return;
  locateItem("nodeId" in selection
    ? { key: JSON.stringify(["node", selection.canvasPath, selection.nodeId]), path: selection.canvasPath, name: selection.label, type: "node", nodeId: selection.nodeId }
    : { key: JSON.stringify(["file", selection.filePath]), path: selection.filePath, name: selection.label, type: "file" });
}

const creating = ref(false);

async function createEntry(folder: boolean, item = currentItem()) {
  const currentDirectory = directory.value;
  if (!currentDirectory || creating.value || busy.value) return;
  const destination = item.type === "directory" ? item.path : parentPath(item.path);
  let value: string;
  try {
    ({ value } = await ElMessageBox.prompt(`在“${destination || "工作区根目录"}”中新建${folder ? "文件夹" : "文件"}`, folder ? "新建文件夹" : "新建文件", {
      inputValue: folder ? "新建文件夹" : "文档.md",
      inputValidator: name => !!name?.trim() && !/[\\/\0]/.test(name) && ![".", ".."].includes(name.trim()) || "请输入有效名称，不能包含斜杠",
      confirmButtonText: "创建",
      cancelButtonText: "取消",
    }));
  } catch {
    return;
  }
  const name = value.trim();
  const path = childPath(destination, name);
  if (currentDirectory !== directory.value) return;
  creating.value = true;
  try {
    const entry: FileTreeItem = { key: JSON.stringify([folder ? "directory" : "file", path]), name, path, type: folder ? "directory" : "file", isLeaf: !folder };
    await executeFileAction(folder ? "mkdir" : "create", entry);
    if (currentDirectory === directory.value) {
      locateItem(entry);
      if (!folder && (await extensionCandidates({ kind: "file", directory: currentDirectory, path, label: name })).length) selectNode(entry);
    }
  } catch (error) {
    const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
    ElMessage.error(message || (error instanceof Error ? error.message : "创建文件失败"));
  } finally {
    creating.value = false;
  }
}

watch(directory, () => { clipboard.value = undefined; focusedItem.value = undefined; locatingKey = undefined; menu.value?.handleClose(); loadTreeState(); refreshTree(); }, { flush: "sync", immediate: true });
watch(() => props.params?.params.revision, refreshTree);
onBeforeUnmount(() => { clearDrag(); treeVersion.value++; searchRevision++; treeController.abort(); assetNodes.clear(); menu.value?.handleClose(); });

async function readCanvasItems(currentDirectory: string, path: string, signal: AbortSignal) {
  signal.throwIfAborted();
  if (props.params?.params.readNodes) {
    const nodes = await props.params.params.readNodes(currentDirectory, { canvasPath: path, signal });
    return canvasItems({ nodes: nodes.map(node => ({ id: node.nodeId, type: node.nodeType, data: { label: node.label } })) }, path);
  }
  const canvas = await useWorkspaceFiles(currentDirectory).readJson(path, signal);
  if (!isRecord(canvas) || canvas.toonflowCanvas !== true || !Array.isArray(canvas.nodes)) throw new Error("不是有效的画布文件");
  return canvasItems(canvas, path);
}

function readNodeIndex(currentDirectory: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const cached = assetNodes.get(signal);
  if (cached) return cached;
  // ACT: 素材归属才扫描全部画布；搜索与树各自持有可取消的缓存，失败不缓存。
  const pending = (props.params?.params.readNodes(currentDirectory, { signal, onError: (path, error) => {
    if (!signal.aborted && currentDirectory === directory.value) loadError.value = `无法读取“${path}”的节点，其余文件仍可使用：${error instanceof Error ? error.message : "请检查文件"}`;
  } }) ?? Promise.resolve([])).then(nodes => {
    const index = new Map<string, DocumentNode[]>();
    for (const node of nodes) {
      const key = pathIdentity(node.nodeId);
      const entries = index.get(key);
      if (entries) entries.push(node);
      else index.set(key, [node]);
    }
    return index;
  }).catch(error => {
    if (assetNodes.get(signal) === pending) assetNodes.delete(signal);
    throw error;
  });
  assetNodes.set(signal, pending);
  return pending;
}

async function readDirectory(currentDirectory: string, path: string, signal: AbortSignal) {
  const version = treeVersion.value;
  const files = useWorkspaceFiles(currentDirectory);
  signal.throwIfAborted();
  const { entries } = await files.list(path, signal);
  signal.throwIfAborted();
  if (version !== treeVersion.value || currentDirectory !== directory.value) return [];
  let nodeIndex: Map<string, DocumentNode[]> | undefined;
  if (pathIdentity(path) === pathIdentity("assets") && props.params?.params.readNodes) {
    try { nodeIndex = await readNodeIndex(currentDirectory, signal); }
    catch (error) {
      signal.throwIfAborted();
      if (currentDirectory === directory.value && version === treeVersion.value) loadError.value = `节点名称读取失败，暂时显示原目录名：${error instanceof Error ? error.message : "请刷新重试"}`;
    }
  }
  const items: FileTreeItem[] = [];
  let cursor = 0;
  // 固定四个读取任务，避免大目录一次创建、排队成千上万个 JSON 请求。
  await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
    while (cursor < entries.length) {
      signal.throwIfAborted();
      const entry = entries[cursor++]!;
      const item: FileTreeItem = { ...entry, key: JSON.stringify([entry.type, entry.path]), isLeaf: entry.type === "file" || undefined };
      const nodes = entry.type === "directory" ? nodeIndex?.get(pathIdentity(entry.name)) : undefined;
      if (nodes?.length) {
        const types = new Set(nodes.map(node => node.nodeType));
        items.push({ ...item, displayLabel: [...new Set(nodes.map(node => node.label))].join(" / "), nodeId: entry.name,
          nodeType: types.size === 1 ? nodes[0]!.nodeType : undefined,
          nodeLocations: nodes.map(node => `${node.label} · ${node.canvasPath}`) });
        continue;
      }
      if (entry.type !== "file" || !entry.name.toLowerCase().endsWith(".json")) { items.push(item); continue; }
      try {
        const canvas = await isCanvasFile(files, entry.path, signal);
        if (canvas !== undefined) items.push(canvas ? { ...item, key: JSON.stringify(["canvas", entry.path]), type: "canvas", isLeaf: undefined } : item);
      } catch (error) {
        signal.throwIfAborted();
        items.push(item);
        if (version === treeVersion.value && currentDirectory === directory.value) loadError.value = `无法识别“${entry.path}”，其余文件仍可使用：${error instanceof Error ? error.message : "请检查文件"}`;
      }
    }
  }));
  return items.sort((left, right) => Number(left.type !== "directory") - Number(right.type !== "directory")
    || fileExtension(left).localeCompare(fileExtension(right), "zh-CN") || (left.displayLabel || left.name).localeCompare(right.displayLabel || right.name, "zh-CN", { numeric: true }));
}

watch([searchTerm, directory, treeVersion], ([term, currentDirectory], _previous, onCleanup) => {
  const revision = ++searchRevision;
  const query = term.trim().toLocaleLowerCase();
  focusedItem.value = undefined;
  treeVirtualizer.value.scrollToOffset(0);
  searchResults.value = [];
  searching.value = false;
  checkedItems.value = [];
  if (!query || !currentDirectory) return;
  const controller = new AbortController();
  const timer = setTimeout(async () => {
    searching.value = true;
    const results: FileTreeItem[] = [];
    const pending = [""];
    try {
      // ACT: 搜索按目录逐层读取完整文件名和节点名，不缓存内容；大工作区可改为服务端索引。
      for (let index = 0; index < pending.length; index++) {
        let items: FileTreeItem[];
        try { items = await readDirectory(currentDirectory, pending[index]!, controller.signal); }
        catch (error) {
          controller.signal.throwIfAborted();
          if (revision === searchRevision) loadError.value = `跳过无法读取的目录“${pending[index] || "工作区"}”：${error instanceof Error ? error.message : "请检查权限"}`;
          continue;
        }
        if (revision !== searchRevision) return;
        for (const item of items) {
          if (`${item.displayLabel ?? ""}\n${item.name}\n${item.path}`.toLocaleLowerCase().includes(query)) results.push({ ...item, isLeaf: true });
          if (item.type === "directory") pending.push(item.path);
          if (item.type === "canvas") {
            try {
              const nodes = await readCanvasItems(currentDirectory, item.path, controller.signal);
              if (revision !== searchRevision) return;
              results.push(...nodes.filter(node => `${node.name}\n${node.nodeId}\n${node.path}`.toLocaleLowerCase().includes(query)));
            } catch (error) {
              controller.signal.throwIfAborted();
              if (revision === searchRevision) loadError.value = `跳过无法读取的画布“${item.path}”：${error instanceof Error ? error.message : "请检查文件"}`;
            }
          }
        }
        searchResults.value = [...results];
      }
      void nextTick(syncCurrentSelection);
    } catch (error) { if (revision === searchRevision) loadError.value = error instanceof Error ? error.message : "搜索文件失败"; }
    finally { if (revision === searchRevision) searching.value = false; }
  }, 200);
  onCleanup(() => { clearTimeout(timer); controller.abort(); assetNodes.delete(controller.signal); });
});

function loadChildren(item: FileTreeItem): Promise<void> {
  const currentDirectory = directory.value;
  const version = treeVersion.value;
  const signal = treeController.signal;
  const path = item.path;
  if (!currentDirectory || item.isLeaf || childrenByKey.has(item.key)) return Promise.resolve();
  const pending = pendingLoads.get(item.key);
  if (pending) return pending;
  loadError.value = "";
  loadingKeys.add(item.key);
  const task = (async () => {
    try {
      const items = await (item.type === "canvas" ? readCanvasItems(currentDirectory, path, signal) : readDirectory(currentDirectory, path, signal));
      if (version !== treeVersion.value || currentDirectory !== directory.value) return;
      childrenByKey.set(item.key, items);
      for (const child of items) if (expandedSet.value.has(child.key)) void loadChildren(child);
    } catch (error) {
      if (version === treeVersion.value && currentDirectory === directory.value) {
        const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
        loadError.value = `读取${path || "工作区"}失败：${message || (error instanceof Error ? error.message : "请重试")}。可重新展开目录或刷新重试。`;
      }
    } finally {
      if (version === treeVersion.value) { pendingLoads.delete(item.key); loadingKeys.delete(item.key); }
    }
  })();
  pendingLoads.set(item.key, task);
  return task;
}
</script>

<style scoped lang="scss">
.fileTree {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-regular);

  .dropTarget { outline: 1px solid var(--el-color-primary); outline-offset: -1px; background: var(--el-color-primary-light-9); }

  .treeHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 8px 10px 6px;
    font-size: 12px;

    .treeTitle {
      display: flex;
      align-items: center;
      gap: 7px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .treeActions {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .el-button {
      width: 24px;
      height: 24px;
      padding: 0;
    }
  }

  .loadError {
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  .treeTools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    padding: 4px 8px 8px;
    :deep(.el-input) { flex: 1 1 100%; min-width: 0; margin-bottom: 3px; }
    :deep(.el-button) { margin-left: 0; flex-shrink: 0; }
  }
  .batchActions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 8px 6px;
    font-size: 11px;
    > span { flex: 1; }
    :deep(.el-button) { margin-left: 0; padding: 4px; }
  }

  .treeContent {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 4px 6px;
    overscroll-behavior: contain;
    outline: none;

    .emptyTree { padding: 18px 8px; text-align: center; font-size: 12px; color: var(--el-text-color-secondary); }
    .treeRows { position: relative; width: 100%; }
    .treeRow {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      width: 100%;
      height: 28px;
      box-sizing: border-box;
      cursor: pointer;
      user-select: none;
      &:hover { background: var(--el-fill-color-light); }
      &.current { background: var(--el-color-primary-light-9); }
      :deep(.el-checkbox) { height: 28px; margin-right: 7px; }
      .expandIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 28px;
        flex-shrink: 0;
        color: var(--el-text-color-placeholder);
        &.expanded:not(.loading) svg { transform: rotate(90deg); }
        &.loading svg { animation: treeLoading 1s linear infinite; }
      }
    }
    &:focus-visible .treeRow.focused { outline: 1px solid var(--el-color-primary); outline-offset: -1px; }

    .fileItem {
      display: flex;
      align-items: center;
      gap: 7px;
      flex: 1;
      min-width: 0;
      padding-right: 6px;
      font-size: 13px;
      &.cutItem { opacity: 0.5; }

      svg {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
      }
      .fileIcon { width: 16px; height: 16px; flex-shrink: 0; object-fit: contain; }
      .nodeId { flex-shrink: 0; color: var(--el-text-color-secondary); font: 10px Consolas, monospace; }

      .fileName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        small { margin-left: 8px; color: var(--el-text-color-secondary); font-size: 10px; }
      }
    }
  }
}

.fileActionMenu {
  min-width: 170px;
  .deleteAction { color: var(--el-color-danger); }
}
@keyframes treeLoading { to { transform: rotate(360deg); } }
</style>
