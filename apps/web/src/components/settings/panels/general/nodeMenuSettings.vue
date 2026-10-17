<template>
  <section class="nodeMenuSettings" aria-labelledby="nodeMenuTitle" :aria-busy="loading">
    <div class="menuHeader">
      <h3 id="nodeMenuTitle">节点菜单管理</h3>
      <div class="menuActions">
        <el-button text size="small" :icon="IconRestore" :disabled="loading || !!loadError" @click="resetMenu">恢复默认</el-button>
      </div>
    </div>
    <p class="description">像右键菜单一样整理节点。拖动调整顺序或移入子菜单，点击眼睛隐藏，修改后自动保存。</p>
    <div v-if="loadError" class="loadError" role="alert">
      <span>{{ loadError }}</span>
      <el-button size="small" :loading="loading" @click="loadNodes">重试</el-button>
    </div>
    <p v-else-if="loading" class="description" role="status">正在读取节点列表…</p>
    <template v-else>
      <div class="menuBoard" role="region" aria-label="节点菜单编辑器" @dragleave="leaveBoard">
        <section
          v-for="column in menuColumns"
          :key="column.id"
          class="menuCard"
          :class="{ dropAtEnd: dropTarget?.parentId === column.id && dropTarget?.mode === 'end' }"
          :aria-label="levelNames[column.depth - 1]"
          :data-menu-id="column.id || 'root'"
          @dragover="previewDrop($event, column)"
          @drop="dropItem($event, column)">
          <header class="cardHeader">
            <span class="cardLevel">{{ levelNames[column.depth - 1] }}</span>
            <h4 :title="column.label">{{ column.label }}</h4>
          </header>
          <div class="menuList">
            <div
              v-for="item in column.items"
              :key="item.id"
              class="menuRow"
              :class="{
                selectedItem: selectedId === item.id || openGroups.includes(item.id),
                editingItem: editingId === item.id,
                hiddenItem: item.hidden,
                draggingItem: draggedId === item.id,
                dropBefore: dropTarget?.itemId === item.id && dropTarget?.mode === 'before',
                dropAfter: dropTarget?.itemId === item.id && dropTarget?.mode === 'after',
                dropInside: dropTarget?.itemId === item.id && dropTarget?.mode === 'inside',
              }"
              :data-item-id="item.id"
              draggable="true"
              @dragstart="startDrag($event, item)"
              @dragend="endDrag"
              @dragover.stop="previewDrop($event, column, item)"
              @drop.stop="dropItem($event, column, item)">
              <button class="itemSelect" type="button" :aria-label="`选择${displayLabel(item)}`" :aria-pressed="selectedId === item.id" @click="selectItem(item)">
                <component :is="item.children ? openGroups.includes(item.id) ? IconFolderOpen : IconFolder : nodeIcons[item.type ?? ''] ?? IconBox" class="itemIcon" :size="18" aria-hidden="true" />
                <span class="itemLabel" :title="displayLabel(item)">{{ displayLabel(item) }}</span>
                <span v-if="item.type && disabledTypes.has(item.type)" class="itemStatus" title="已停用">停用</span>
              </button>
              <div class="rowActions" @dragstart.stop.prevent>
                <el-popover
                  :visible="editingId === item.id"
                  trigger="click"
                  placement="bottom-start"
                  :width="260"
                  :showArrow="false"
                  :persistent="false"
                  :hideAfter="0"
                  :popperStyle="{ padding: '14px', borderRadius: '12px' }"
                  @update:visible="visible => setEditingVisible(item.id, visible)"
                  @afterEnter="focusName">
                  <template #reference>
                    <button class="rowAction" type="button" :aria-label="`编辑${displayLabel(item)}`" title="编辑" @click.stop>
                      <icon-edit :size="14" aria-hidden="true" />
                    </button>
                  </template>
                  <div v-if="editing?.item.id === item.id" class="menuItemEditor" @keydown.stop @keydown.esc="setEditingVisible(item.id, false)">
                    <div class="editorHeader">{{ editing.item.children ? '编辑菜单' : '编辑节点' }}</div>
                    <label class="editorField">
                      <span>{{ editing.item.children ? '菜单名称' : '节点别名（留空恢复原名）' }}</span>
                      <el-input
                        ref="nameInputs"
                        v-model="itemName"
                        maxlength="40"
                        size="small"
                        :placeholder="nodeDisplayName(editing.item.type, originalName)"
                        :aria-label="editing.item.children ? '分组名称' : '节点别名'"
                        @blur="renameItem"
                        @keydown.enter.prevent="renameItem" />
                    </label>
                  </div>
                </el-popover>
                <button
                  class="rowAction visibilityButton"
                  :class="{ isHidden: item.hidden }"
                  type="button"
                  :aria-label="`${item.hidden ? '显示' : '隐藏'} ${displayLabel(item)}`"
                  :title="item.hidden ? '显示' : '隐藏'"
                  :aria-pressed="!item.hidden"
                  @click.stop="setVisible(item, item.hidden)"
                  @keydown.stop>
                  <icon-eye-off v-if="item.hidden" :size="14" aria-hidden="true" />
                  <icon-eye v-else :size="14" aria-hidden="true" />
                </button>
                <button v-if="item.children" class="rowAction deleteButton" type="button" :aria-label="`移除${displayLabel(item)}菜单`" title="移除菜单，保留子项" @click.stop="removeGroup(item.id)">
                  <icon-folder-minus :size="14" aria-hidden="true" />
                </button>
              </div>
              <icon-chevron-right v-if="item.children" class="submenuArrow" :size="14" aria-hidden="true" />
            </div>
            <div v-if="!column.items.length" class="emptyDrop" :aria-label="`${levelNames[column.depth - 1]}空白投放区`">
              <icon-drag-drop :size="22" aria-hidden="true" />
              <span>拖入节点{{ column.depth < 3 ? "或子菜单" : "" }}</span>
            </div>
          </div>
          <button v-if="column.depth < 3" class="newGroupButton" type="button" @click="addGroup(column.id)">
            <icon-plus :size="15" aria-hidden="true" />
            新建{{ levelNames[column.depth] }}
          </button>
        </section>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { nodeDisplayName } from "@/lib/i18n";
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from "vue";
import { ElMessage, type InputInstance } from "element-plus";
import { IconBox, IconFolder, IconFolderOpen, IconFolderMinus, IconRestore, IconChevronRight, IconEdit, IconEye, IconEyeOff, IconPlus, IconDragDrop, IconFileText, IconPhoto, IconVideo, IconMusic, IconMusicBolt, IconCube3dSphere, IconPhotoAi, IconCameraAi } from "@tabler/icons-vue";
import { normalizeNodeMenu, resolveNodeMenu, serializeNodeMenu, type NodeMenuItem } from "@toonflow/server/nodeMenu";
import { generalSettings, updateGeneralSettings } from "@/stores/settings";

type MenuEntry = { item: NodeMenuItem; parentId: string; depth: number; siblings: NodeMenuItem[]; index: number; path: string[] };
type MenuColumn = { id: string; depth: number; label: string; items: NodeMenuItem[] };
type DropTarget = { parentId: string; index: number; itemId?: string; mode: "before" | "after" | "inside" | "end" };
const levelNames = computed(() => [translate("一级菜单"), translate("二级菜单"), translate("三级菜单")]);
const nodeIcons: Record<string, Component> = {
  "remote-textNode": IconFileText,
  "remote-imageNode": IconPhoto,
  "remote-videoNode": IconVideo,
  "remote-audioNode": IconMusic,
  "remote-audioGenerationNode": IconMusicBolt,
  "remote-director3dNode": IconCube3dSphere,
  "remote-imageGenerationNode": IconPhotoAi,
  "remote-videoGenerationNode": IconCameraAi,
};
const installedNodes = ref<{ type: string; label: string; enabled: boolean }[]>([]);
const installedTypes = computed(() => new Set(installedNodes.value.map(node => node.type)));
const disabledTypes = computed(() => new Set(installedNodes.value.filter(node => !node.enabled).map(node => node.type)));
const menuItems = ref<NodeMenuItem[]>([]);
const selectedId = ref("");
const editingId = ref("");
const nameInputs = ref<InputInstance[]>([]);
const openGroups = ref<string[]>([]);
const draggedId = ref("");
const dropTarget = ref<DropTarget>();
const itemName = ref("");
const loading = ref(true);
const loadError = ref("");
let loadRequest = 0;

watch([() => generalSettings.value.nodeMenu, installedNodes], () => {
  const saved = normalizeNodeMenu(serializeNodeMenu(generalSettings.value.nodeMenu, installedTypes.value));
  menuItems.value = resolveNodeMenu(saved, installedNodes.value);
}, { immediate: true });

const menuEntries = computed(() => {
  const entries: MenuEntry[] = [];
  function visit(items: NodeMenuItem[], parentId = "", depth = 1, path: string[] = []) {
    items.forEach((item, index) => {
      entries.push({ item, parentId, depth, siblings: items, index, path });
      if (item.children) visit(item.children, item.id, depth + 1, [...path, item.id]);
    });
  }
  visit(menuItems.value);
  return entries;
});
const editing = computed(() => menuEntries.value.find(entry => entry.item.id === editingId.value));
const originalName = computed(() => installedNodes.value.find(node => node.type === editing.value?.item.type)?.label ?? "");
const menuColumns = computed(() => {
  const columns: MenuColumn[] = [{ id: "", depth: 1, label: "添加节点", items: menuItems.value }];
  for (const id of openGroups.value) {
    const item = columns.at(-1)!.items.find(item => item.id === id);
    if (!item?.children || columns.length === 3) break;
    columns.push({ id, depth: columns.length + 1, label: item.label, items: item.children });
  }
  return columns;
});
watch(editing, entry => { itemName.value = entry?.item.type ? entry.item.alias ?? "" : entry?.item.label ?? ""; });

function displayLabel(item: NodeMenuItem): string {
  return item.alias ? item.label : nodeDisplayName(item.type, item.label);
}

function itemHeight(item: NodeMenuItem): number {
  return item.children ? 1 + Math.max(1, ...item.children.map(itemHeight)) : 1;
}

function canPlace(item: NodeMenuItem, parentId: string) {
  if (!parentId) return itemHeight(item) <= 3;
  const parent = menuEntries.value.find(entry => entry.item.id === parentId);
  return !!parent?.item.children && parentId !== item.id && !parent.path.includes(item.id) && parent.depth + itemHeight(item) <= 3;
}

function selectItem(item: NodeMenuItem) {
  const entry = menuEntries.value.find(entry => entry.item.id === item.id);
  if (!entry) return;
  selectedId.value = item.id;
  openGroups.value = [...entry.path, ...(item.children ? [item.id] : [])];
}

function setEditingVisible(id: string, visible: boolean) {
  if (visible) {
    if (editingId.value !== id) renameItem();
    editingId.value = id;
    const item = editing.value?.item;
    itemName.value = item?.type ? item.alias ?? "" : item?.label ?? "";
  } else if (editingId.value === id) {
    renameItem();
    editingId.value = "";
  }
}

function focusName() {
  nameInputs.value[0]?.focus();
  nameInputs.value[0]?.select();
}

function startDrag(event: DragEvent, item: NodeMenuItem) {
  setEditingVisible(editingId.value, false);
  draggedId.value = item.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }
}

function endDrag() {
  draggedId.value = "";
  dropTarget.value = undefined;
}

function getDropTarget(event: DragEvent, column: MenuColumn, item?: NodeMenuItem): DropTarget | undefined {
  const source = menuEntries.value.find(entry => entry.item.id === draggedId.value);
  if (!source) return;
  let target: DropTarget = { parentId: column.id, index: column.items.length, mode: "end" };
  if (item) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = (event.clientY - rect.top) / rect.height;
    target = item.children && position > 0.25 && position < 0.75
      ? { parentId: item.id, index: item.children.length, itemId: item.id, mode: "inside" }
      : { parentId: column.id, index: column.items.indexOf(item) + (position >= 0.5 ? 1 : 0), itemId: item.id, mode: position >= 0.5 ? "after" : "before" };
  }
  return canPlace(source.item, target.parentId) ? target : undefined;
}

function previewDrop(event: DragEvent, column: MenuColumn, item?: NodeMenuItem) {
  dropTarget.value = getDropTarget(event, column, item);
  if (!dropTarget.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function dropItem(event: DragEvent, column: MenuColumn, item?: NodeMenuItem) {
  const target = getDropTarget(event, column, item);
  const source = menuEntries.value.find(entry => entry.item.id === draggedId.value);
  if (source && target) {
    event.preventDefault();
    moveEntry(source, target.parentId, target.index);
  }
  endDrag();
}

function leaveBoard(event: DragEvent) {
  if (!(event.relatedTarget instanceof Node) || !(event.currentTarget as HTMLElement).contains(event.relatedTarget)) dropTarget.value = undefined;
}

function moveEntry(entry: MenuEntry, parentId: string, index: number) {
  if (!canPlace(entry.item, parentId)) return;
  const parent = menuEntries.value.find(entry => entry.item.id === parentId);
  const items = parent?.item.children ?? menuItems.value;
  const position = index - (entry.siblings === items && entry.index < index ? 1 : 0);
  if (entry.siblings === items && entry.index === position) return;
  entry.siblings.splice(entry.index, 1);
  items.splice(position, 0, entry.item);
  selectItem(entry.item);
  saveMenu();
}

function saveMenu() {
  updateGeneralSettings({ nodeMenu: serializeNodeMenu(menuItems.value, installedTypes.value) });
}

function setVisible(item: NodeMenuItem, visible: boolean) {
  item.hidden = !visible;
  saveMenu();
}

function addGroup(parentId: string) {
  const parent = menuEntries.value.find(entry => entry.item.id === parentId);
  if (parentId && (!parent?.item.children || parent.depth >= 2)) return;
  const labels = new Set(menuEntries.value.filter(entry => entry.item.children).map(entry => entry.item.label));
  let label = translate("新分组");
  for (let index = 2; labels.has(label); index++) label = `${translate("新分组")} ${index}`;
  const group = { id: `group:${crypto.randomUUID()}`, label, hidden: false, children: [] };
  (parent?.item.children ?? menuItems.value).push(group);
  selectItem(group);
  saveMenu();
  setEditingVisible(group.id, true);
}

function renameItem() {
  const item = editing.value?.item;
  if (!item) return;
  const label = itemName.value.trim();
  if (!item.type && !label) {
    ElMessage.warning("分组名称不能为空");
    itemName.value = item.label;
    return;
  }
  itemName.value = label;
  if (item.type) {
    const alias = label && label !== originalName.value ? label : undefined;
    if (item.alias === alias) return;
    if (alias) item.alias = alias;
    else delete item.alias;
    item.label = alias || originalName.value || item.type;
  } else {
    if (item.label === label) return;
    item.label = label;
  }
  saveMenu();
}

function removeGroup(id: string) {
  const entry = menuEntries.value.find(entry => entry.item.id === id);
  if (!entry?.item.children) return;
  if (editingId.value === id) editingId.value = "";
  const children = entry.item.children;
  if (entry.item.hidden) children.forEach(item => { item.hidden = true; });
  entry.siblings.splice(entry.index, 1, ...children);
  if (children[0]) selectItem(children[0]);
  else {
    selectedId.value = entry.parentId;
    openGroups.value = entry.path;
  }
  saveMenu();
}

function resetMenu() {
  selectedId.value = "";
  editingId.value = "";
  openGroups.value = [];
  updateGeneralSettings({ nodeMenu: [] });
}

async function loadNodes() {
  const request = ++loadRequest;
  loading.value = true;
  try {
    const { data } = await axios.get<{ code: number; data: { name: string; displayName: string; enabled?: boolean }[] }>("/api/nodes/get", {
      headers: { "Cache-Control": "no-cache", "x-toonflow-workspace": "1" },
    });
    if (request !== loadRequest) return;
    if (data.code !== 200 || !Array.isArray(data.data) || data.data.some(node => !node || typeof node.name !== "string" || !/^[a-z][a-zA-Z0-9]*$/.test(node.name))) {
      throw new Error("节点列表格式错误");
    }
    installedNodes.value = data.data.map(node => ({ type: `remote-${node.name}`, label: typeof node.displayName === "string" && node.displayName ? node.displayName : node.name, enabled: node.enabled !== false }));
    loadError.value = "";
  } catch {
    if (request === loadRequest) loadError.value = "节点列表读取失败，请重试。已保存的菜单配置仍会保留。";
  } finally {
    if (request === loadRequest) loading.value = false;
  }
}

function refreshInstalled(event: WindowEventMap["toonflow:plugin-installed"]) {
  if (event.detail.type === "node") void loadNodes();
}

onMounted(() => {
  void loadNodes();
  window.addEventListener("toonflow:plugin-installed", refreshInstalled);
});
onBeforeUnmount(() => {
  loadRequest++;
  window.removeEventListener("toonflow:plugin-installed", refreshInstalled);
});
</script>

<style lang="scss" scoped>
.nodeMenuSettings {
  .menuHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;

    h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
    .menuActions {
      display: flex;
      gap: 4px;
      .el-button { margin-left: 0; }
    }
  }
  .description { margin: 8px 0 12px; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }
  .loadError {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border-radius: var(--el-border-radius-base);
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    font-size: 12px;
  }
  .menuBoard {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    overflow-x: auto;
    padding: 16px;
    border-radius: 12px;
    background-color: var(--el-fill-color-lighter);
    background-image: radial-gradient(var(--el-border-color) 0.7px, transparent 0.7px);
    background-size: 12px 12px;

    .menuCard {
      flex: 0 0 224px;
      min-width: 0;
      padding: 6px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 12px;
      background: var(--el-bg-color-overlay);
      box-shadow: 0 4px 16px rgb(0 0 0 / 6%);
      transition: border-color 0.15s, box-shadow 0.15s;

      &.dropAtEnd {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        .emptyDrop { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
      }
      .cardHeader {
        padding: 7px 9px 9px;

        .cardLevel { font-size: 10px; color: var(--el-text-color-placeholder); }
        h4 { margin: 3px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 500; color: var(--el-text-color-secondary); }
      }
      .menuList {
        min-height: 42px;

        .menuRow {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          min-height: 35px;
          padding: 0 8px;
          border-radius: 7px;
          color: var(--el-text-color-primary);
          cursor: grab;
          user-select: none;
          outline: none;

          &:hover, &.selectedItem { background: var(--el-fill-color); }
          &:focus-within { box-shadow: inset 0 0 0 2px var(--el-color-primary); }
          &.draggingItem { opacity: 0.35; }
          &.hiddenItem {
            .itemIcon, .itemLabel, .submenuArrow { opacity: 0.4; }
            .itemSelect { padding-right: 50px; }
          }
          &:hover, &:focus-within, &.editingItem {
            .itemSelect { padding-right: 76px; }
            .submenuArrow { opacity: 0; }
            .rowActions { background: var(--el-fill-color); }
            .rowActions .rowAction { opacity: 1; pointer-events: auto; }
          }
          &.dropInside { background: var(--el-color-primary-light-9); box-shadow: inset 0 0 0 1px var(--el-color-primary); }
          &.dropBefore::before, &.dropAfter::after {
            position: absolute;
            right: 4px;
            left: 4px;
            z-index: 1;
            height: 2px;
            border-radius: 2px;
            background: var(--el-color-primary);
            content: "";
          }
          &.dropBefore::before { top: -1px; }
          &.dropAfter::after { bottom: -1px; }
          .submenuArrow { flex-shrink: 0; pointer-events: none; }
          .itemSelect {
            display: flex;
            align-items: center;
            flex: 1;
            gap: 7px;
            min-width: 0;
            height: 35px;
            padding: 0;
            border: 0;
            outline: none;
            background: transparent;
            color: inherit;
            text-align: left;
            cursor: inherit;

            .itemIcon { flex-shrink: 0; }
            .itemLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
            .itemStatus { flex-shrink: 0; color: var(--el-text-color-placeholder); font-size: 10px; }
          }
          .rowActions {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            gap: 1px;
            border-radius: 5px;
            pointer-events: none;

            .rowAction {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 25px;
              height: 27px;
              padding: 0;
              border: 0;
              border-radius: 5px;
              outline: none;
              background: transparent;
              color: var(--el-text-color-secondary);
              opacity: 0;
              pointer-events: none;
              cursor: pointer;
              transition: opacity 0.12s, background 0.12s;

              &.isHidden { opacity: 1; pointer-events: auto; color: var(--el-text-color-placeholder); }
              &:hover, &:focus-visible { color: var(--el-color-primary); background: var(--el-fill-color-dark); }
              &.deleteButton:hover, &.deleteButton:focus-visible { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
            }
          }
        }
        .emptyDrop {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 112px;
          margin: 3px;
          border: 1px dashed var(--el-border-color);
          border-radius: 7px;
          color: var(--el-text-color-placeholder);
          font-size: 11px;
        }
      }
      .newGroupButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        margin-top: 6px;
        padding: 10px 4px 5px;
        border: 0;
        border-top: 1px solid var(--el-border-color-lighter);
        background: transparent;
        color: var(--el-color-primary);
        font: inherit;
        font-size: 11px;
        cursor: pointer;

        &:hover { color: var(--el-color-primary-light-3); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; border-radius: 4px; }
      }
    }
  }
}
.menuItemEditor {
  .editorHeader { margin-bottom: 12px; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
  .editorField {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;

    > span { color: var(--el-text-color-secondary); font-size: 11px; }
    .el-input { width: 100%; }
  }
}
</style>
