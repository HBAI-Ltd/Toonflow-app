<template>
  <section ref="panel" class="sceneAssetsPanel" tabindex="-1" aria-label="当前场景资产">
    <div class="selectionActions">
      <span>已选 <strong>{{ selection.length }}</strong></span>
      <button type="button" :disabled="disabled || !selection.length" title="聚焦所选物体（F）" @click="emit('focus', selection)"><icon-focus-centered :size="15" />聚焦</button>
      <button type="button" :disabled="disabled || !selection.length" title="将所选物体放入新分组" @click="emit('group')"><icon-folder-plus :size="15" />打组</button>
      <button type="button" class="deleteAction" :disabled="disabled || !selection.length" title="删除所选物体（Delete）" @click="emit('remove', selection)"><icon-trash :size="15" />删除</button>
    </div>
    <div class="assetTree" role="list" aria-label="场景物体和分组">
      <div v-for="row in rows" :key="row.key" class="assetRow" :class="{ groupRow: row.kind === 'group', childRow: row.kind === 'object' && row.grouped, selected: row.kind === 'group' ? groupSelected(row.ids) : selectedSet.has(row.object.id), hiddenObject: row.kind === 'object' && !row.object.visible }" role="listitem">
        <template v-if="row.kind === 'group'">
          <button type="button" class="iconAction collapseAction" :aria-label="`${collapsed.has(row.group.id) ? '展开' : '收起'}分组${row.group.name}`" :aria-expanded="!collapsed.has(row.group.id)" @click="toggleGroup(row.group.id)"><icon-chevron-right :size="14" /></button>
          <input v-if="renaming === row.group.id" :ref="setGroupInput" v-model="groupName" class="groupNameInput" maxlength="160" aria-label="分组名称" :disabled="disabled" @blur="finishRename()" @keydown.enter.prevent.stop="finishRename(true)" @keydown.esc.prevent.stop="cancelRename()" />
          <button v-else type="button" class="assetSelect" :disabled="disabled || !row.ids.length" :title="row.group.name" :aria-pressed="groupSelected(row.ids)" @click="select(row.ids, $event)" @dblclick="beginRename(row.group)"><icon-folder :size="15" /><span>{{ row.group.name }}</span><small>{{ row.ids.length }}</small></button>
          <button type="button" class="iconAction" :disabled="disabled" :aria-label="`重命名分组${row.group.name}`" title="重命名分组" @click="beginRename(row.group)"><icon-pencil :size="14" /></button>
          <button type="button" class="iconAction" :disabled="disabled || !row.ids.length" :aria-label="`聚焦分组${row.group.name}`" title="聚焦分组" @click="emit('focus', row.ids)"><icon-focus-centered :size="14" /></button>
          <button type="button" class="iconAction" :disabled="disabled" :aria-label="`解组${row.group.name}`" title="解组，保留物体" @click="emit('ungroup', row.group.id)"><icon-folder-off :size="14" /></button>
          <button type="button" class="iconAction deleteAction" :disabled="disabled" :aria-label="`删除分组${row.group.name}及其物体`" title="删除分组及其物体" @click="emit('removeGroup', row.group.id)"><icon-trash :size="14" /></button>
        </template>
        <template v-else>
          <button type="button" class="assetSelect" :disabled="disabled" :aria-label="`选择${row.object.name}`" :title="row.object.name + (row.object.visible ? '' : '（已隐藏）')" :aria-pressed="selectedSet.has(row.object.id)" @click="select([row.object.id], $event)" @dblclick="emit('focus', [row.object.id])"><icon-box :size="15" /><span>{{ row.object.name }}</span></button>
          <button type="button" class="iconAction" :disabled="disabled" :aria-label="`聚焦${row.object.name}`" title="聚焦物体" @click="emit('focus', [row.object.id])"><icon-focus-centered :size="14" /></button>
          <button type="button" class="iconAction deleteAction" :disabled="disabled" :aria-label="`删除${row.object.name}`" title="删除物体" @click="emit('remove', [row.object.id])"><icon-trash :size="14" /></button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { IconBox, IconChevronRight, IconFocusCentered, IconFolder, IconFolderOff, IconFolderPlus, IconPencil, IconTrash } from "@tabler/icons-vue";
import type { SceneObject, SceneObjectGroup } from "./sceneDocument";

type AssetRow = { kind: "group"; key: string; group: SceneObjectGroup; ids: string[] } | { kind: "object"; key: string; object: SceneObject; grouped: boolean };
const props = defineProps<{ objects: SceneObject[]; groups?: SceneObjectGroup[]; selectedIds: string[]; disabled?: boolean }>();
const emit = defineEmits<{ select: [ids: string[], additive?: boolean]; focus: [ids: string[]]; remove: [ids: string[]]; removeGroup: [id: string]; group: []; ungroup: [id: string]; renameGroup: [id: string, name: string] }>();
const panel = ref<HTMLElement>();
const collapsed = ref(new Set<string>());
const renaming = ref("");
const groupName = ref("");
let groupInput: HTMLInputElement | undefined;
const selectedSet = computed(() => new Set(props.selectedIds));
const selection = computed(() => props.objects.filter(object => selectedSet.value.has(object.id)).map(object => object.id));
const rows = computed(() => {
  const result: AssetRow[] = [];
  const objects = new Map(props.objects.map(object => [object.id, object]));
  const assigned = new Set<string>();
  for (const group of props.groups ?? []) {
    const members = group.objectIds.flatMap(id => {
      const object = objects.get(id);
      if (!object || assigned.has(id)) return [];
      assigned.add(id);
      return [object];
    });
    result.push({ kind: "group", key: "group:" + group.id, group, ids: members.map(object => object.id) });
    if (!collapsed.value.has(group.id)) for (const object of members) result.push({ kind: "object", key: "object:" + object.id, object, grouped: true });
  }
  for (const object of props.objects) if (!assigned.has(object.id)) result.push({ kind: "object", key: "object:" + object.id, object, grouped: false });
  return result;
});
function select(ids: string[], event: MouseEvent) { if (!props.disabled) emit("select", ids, event.ctrlKey || event.metaKey || event.shiftKey); }
function groupSelected(ids: string[]) { return ids.length > 0 && ids.every(id => selectedSet.value.has(id)); }
function toggleGroup(id: string) { const next = new Set(collapsed.value); next.has(id) ? next.delete(id) : next.add(id); collapsed.value = next; }
function setGroupInput(value: unknown) { groupInput = value instanceof HTMLInputElement ? value : undefined; }
function beginRename(group: SceneObjectGroup) {
  if (props.disabled) return;
  renaming.value = group.id;
  groupName.value = group.name;
  void nextTick(() => { groupInput?.focus(); groupInput?.select(); });
}
function finishRename(restoreFocus = false) {
  const id = renaming.value;
  const name = groupName.value.trim();
  renaming.value = "";
  if (id && name && !props.disabled && name !== props.groups?.find(group => group.id === id)?.name) emit("renameGroup", id, name);
  if (restoreFocus) panel.value?.focus({ preventScroll: true });
}
function cancelRename() { renaming.value = ""; panel.value?.focus({ preventScroll: true }); }
</script>

<style scoped lang="scss">
.sceneAssetsPanel {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 12px;
  button, input { color: inherit; font: inherit; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 5px; background: transparent; cursor: pointer; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &:disabled { opacity: 0.4; cursor: default; } &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  .selectionActions { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding-bottom: 12px; background: var(--studioGlassBackground); > span { margin-inline-end: auto; color: var(--el-text-color-regular); white-space: nowrap; strong { font-weight: 500; font-variant-numeric: tabular-nums; } } > button { min-height: 32px; padding: 5px 8px; background: var(--studioControlBackground); } }
  .assetRow { display: flex; align-items: center; gap: 2px; min-width: 0; min-height: 34px; padding: 1px 3px; border-radius: 6px; &.selected { background: var(--studioActiveBackground); } &.hiddenObject .assetSelect { color: var(--el-text-color-placeholder); } &.childRow { padding-inline-start: 28px; } &.groupRow { margin-top: 5px; font-weight: 500; }
    .assetSelect { flex: 1; justify-content: flex-start; min-width: 0; min-height: 32px; padding: 4px 5px; text-align: start; > svg { flex-shrink: 0; color: var(--el-text-color-regular); } > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } > small { color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; } }
    .iconAction { flex-shrink: 0; width: 28px; height: 30px; padding: 4px; color: var(--el-text-color-regular); }
    .collapseAction { width: 21px; &[aria-expanded="true"] > svg { transform: rotate(90deg); } }
    .groupNameInput { flex: 1; min-width: 0; width: 40px; height: 28px; box-sizing: border-box; border: 1px solid var(--el-color-primary); border-radius: 4px; background: var(--studioControlBackground); padding: 3px 5px; outline: none; }
  }
  .deleteAction:hover:not(:disabled) { color: var(--el-color-danger); }
}
</style>
