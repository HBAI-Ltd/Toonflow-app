<template>
  <el-popover v-if="available.length" ref="popover" trigger="click" role="menu" placement="bottom-start" :width="columnWidth"
    :persistent="false" :showArrow="false" :disabled="disabled" :popperOptions="rootOptions"
    :popperStyle="{ padding: '5px 0', minWidth: 0, '--cascade-column-width': columnWidth }"
    @beforeEnter="openMenu" @afterEnter="focusMenu" @beforeLeave="expanded = false">
    <template #reference>
      <el-button ref="trigger" text class="moreButton" :class="{ expanded }" :disabled="disabled" aria-haspopup="menu"
        :aria-expanded="expanded" aria-label="更多处理工具" @click.stop @keydown.down.stop.prevent="openFromKeyboard">
        更多<icon-chevron-down class="moreChevron" :size="14" aria-hidden="true" />
      </el-button>
    </template>
    <div v-if="expanded" class="toolMenu nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @wheel.stop @dblclick.stop>
      <p v-if="!mime" class="sourceHint">{{ importSource ? '选好工具后，选择要处理的素材' : '添加或生成素材后即可使用工具' }}</p>
      <label v-if="available.length > 7" class="toolSearch">
        <icon-search :size="15" aria-hidden="true" />
        <input ref="searchInput" v-model.trim="query" type="search" placeholder="搜索工具" aria-label="搜索工具"
          @keydown.stop @keydown.enter="chooseSearchResult" @keydown.down.prevent="menu?.focusFirst(true)" @keydown.esc.prevent="close(true)" />
      </label>
      <ul v-if="items.length" class="toolList" aria-label="更多处理工具">
        <cascadeMenuItems ref="menu" :items="items" @select="select" @close="close(true)" />
      </ul>
      <span v-else class="emptySearch" role="status">没有匹配的工具</span>
    </div>
  </el-popover>
  <mediaSourcePicker v-if="pending" :title="pending.title" :accept="pending.accept" :disabled="importing"
    @select="importFile" @close="pending = undefined" />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { translate } from "@toonflow/i18n/vue";
import { ElButton, ElMessage, ElPopover, type PopoverProps } from "element-plus";
import { IconChevronDown, IconSearch } from "@tabler/icons-vue";
import cascadeMenuItems, { type CascadeMenuItem } from "./cascadeMenuItems.vue";
import mediaSourcePicker from "./mediaSourcePicker.vue";
import type { MediaTool, MediaToolSelection } from "../mediaTools";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { useNodeModel, type LocalModelItem } from "@toonflow/nodes-scaffold/nodeModel";
import { getMediaMimeType } from "../mediaTypes";
import { showNodeError } from "../showNodeError";

const props = defineProps<{
  tools: MediaTool[];
  source?: NodeMediaValue;
  sourceKind?: "image" | "video" | "audio";
  importSource?: (file: File, canCommit: () => boolean) => Promise<string | void>;
  mimeType?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ select: [selection: MediaToolSelection] }>();
const { node } = useNode();
const { findNode, onNodeDragStart, onSelectionStart, onMoveStart } = useVueFlow();
const getCanvas = inject<() => { id: string } | undefined>("canvas", () => undefined);
const getDirectory = inject<() => string>("workspaceDirectory", () => "");
const openModelInstaller = inject<(id: string) => Promise<boolean> | undefined>("openModelInstaller");
const model = useNodeModel();
const modelItems = shallowRef<Map<string, LocalModelItem>>();
const modelError = shallowRef<Error & { status?: number }>();
const retry = ref(0);
const trigger = ref<InstanceType<typeof ElButton>>();
const popover = ref<InstanceType<typeof ElPopover>>();
const menu = ref<InstanceType<typeof cascadeMenuItems>>();
const searchInput = ref<HTMLInputElement>();
const pending = shallowRef<{
  command?: Omit<MediaToolSelection, "anchor">;
  anchor?: HTMLElement;
  title: string;
  accept: string;
  canCommit: () => boolean;
}>();
const importing = ref(false);
const query = ref("");
const expanded = ref(false);
const mime = computed(() => (props.source?.mimeType ?? props.mimeType)?.split(";")[0]?.trim().toLowerCase());

function acceptsSource(tool: MediaTool, sourceType: string) {
  return !tool.sourceMimeTypes || tool.sourceMimeTypes.some(pattern => {
    const type = pattern.toLowerCase();
    return type.endsWith("/*") ? sourceType.startsWith(type.slice(0, -1)) : type === sourceType;
  });
}

const available = computed(() => {
  const sourceType = mime.value;
  return sourceType ? props.tools.filter(tool => acceptsSource(tool, sourceType)) : props.tools;
});

watch([expanded, retry], async ([shown], _, onCleanup) => {
  if (!shown || !available.value.some(tool => tool.modelId)) return;
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  modelItems.value = undefined;
  modelError.value = undefined;
  try {
    const items = await model.list(controller.signal);
    if (!controller.signal.aborted) modelItems.value = new Map(items.map(item => [item.id, item]));
  } catch (error) {
    if (!controller.signal.aborted) modelError.value = error instanceof Error ? error : new Error("模型检测失败");
  }
}, { flush: "sync" });

function modelActionState(id: string): Pick<CascadeMenuItem, "disabled" | "note"> {
  if (modelError.value?.status === 403) return { disabled: true, note: translate("不可用") };
  if (modelError.value) return { note: translate("重新检测") };
  if (!modelItems.value) return { disabled: true, note: translate("检测中") };
  const item = modelItems.value.get(id);
  if (item?.canRun) return {};
  if (!item || !openModelInstaller || (!item.fileName && !item.remoteAvailable) || (item.installed && item.requiredAssetIds?.length === 0)) {
    return { disabled: true, note: translate("不可用") };
  }
  if (item.installing) return { note: translate("正在安装") };
  return { note: item.installed || item.remoteAvailable ? translate("需安装依赖") : translate("需安装") };
}

function requiredModels(tool: MediaTool) {
  return tool.modelId ? [tool.modelId, ...(tool.additionalModelIds ?? [])] : [];
}

function normalizeSearch(value: string) {
  return value.normalize("NFKC").toLowerCase().replaceAll("∶", ":");
}

const catalog = computed(() => {
  const groups = new Map<string, (CascadeMenuItem & { searchText: string })[]>();
  const commands = new Map<string, Omit<MediaToolSelection, "anchor">>();
  for (const tool of available.value) {
    const field = tool.fields?.find(item => item.key === tool.menuField);
    const presets = tool.menuPresets ?? field?.options?.map(option => ({ label: option.label, values: { [field.key]: option.value } }));
    const label = translate(tool.label);
    const searchText = normalizeSearch([translate(tool.group), label, ...(tool.presets ?? []).map(preset => translate(preset.label))].join(" "));
    const item: CascadeMenuItem & { searchText: string } = { id: tool.id, label, icon: tool.icon, searchText };
    const states = requiredModels(tool).map(modelActionState);
    const state = states.find(item => item.disabled) ?? states.find(item => item.note) ?? {};
    const { note } = state;
    const disabled = (!mime.value && !props.importSource) || state.disabled;
    if (presets?.length) {
      item.children = presets.map((preset, index) => {
        const id = `${tool.id}/${index}`;
        commands.set(id, { tool, initialValues: preset.values });
        return { id, type: id, label: translate(preset.label), disabled, note };
      });
    } else {
      item.type = item.id;
      item.disabled = disabled;
      item.note = note;
      commands.set(item.id, { tool });
    }
    const entries = groups.get(tool.group) ?? [];
    entries.push(item);
    groups.set(tool.group, entries);
  }
  return { groups, commands };
});

const grouped = computed(() => catalog.value.groups.size > 1);
const columns = computed(() => 1 + Number(grouped.value) + Number([...catalog.value.groups.values()].some(tools => tools.some(item => item.children?.length))));
const columnWidth = computed(() => `min(216px, calc((100vw - 44px) / ${columns.value}))`);
const rootOptions: NonNullable<PopoverProps["popperOptions"]> = {
  strategy: "fixed",
  modifiers: [{
    name: "reserveMenuColumns",
    enabled: true,
    phase: "afterMain",
    requires: ["preventOverflow"],
    fn: ({ state }) => {
      const offsets = state.modifiersData.popperOffsets;
      if (!offsets) return;
      const width = state.rects.popper.width;
      const rightLimit = document.documentElement.clientWidth - width - 8;
      const reserve = (width + 8) * (columns.value - 1);
      // 从浮层实际落点起算，取能容下所有列、离按钮最近的位置。
      const x = Math.max(8, Math.min(rightLimit, offsets.x));
      const openRight = Math.min(x, rightLimit - reserve);
      const openLeft = Math.max(x, 8 + reserve);
      offsets.x = x - openRight <= openLeft - x ? openRight : openLeft;
    },
  }],
};

const items = computed<CascadeMenuItem[]>(() => {
  const { groups } = catalog.value;
  if (query.value) {
    const tokens = normalizeSearch(query.value).trim().split(/\s+/);
    const matches = (text: string) => tokens.every(token => text.includes(token));
    return [...groups.values()].flatMap(tools => tools.flatMap<CascadeMenuItem>(item => {
      if (matches(item.searchText)) return [item];
      return (item.children ?? []).filter(child => matches(item.searchText + " " + normalizeSearch(child.label)))
        .map(child => ({ ...child, label: `${item.label} · ${child.label}` }));
    }));
  }
  if (!grouped.value) return [...groups.values()].flat();
  return [...groups].map(([group, children]) => ({ id: group, label: translate(group), icon: children[0]?.icon, children }));
});

function chooseSearchResult(event: KeyboardEvent) {
  if (event.isComposing || !query.value || !items.value.length) return;
  event.preventDefault();
  const [item] = items.value;
  if (items.value.length === 1 && item.type && !item.disabled) void select(item.id);
  else menu.value?.focusFirst(true);
}

function openMenu() {
  query.value = "";
  expanded.value = true;
}

function focusMenu() {
  if (!expanded.value || document.activeElement?.closest(".cascadeMenuItems")) return;
  if (searchInput.value) searchInput.value.focus({ preventScroll: true });
  else menu.value?.focusFirst();
}

function openFromKeyboard() {
  if (expanded.value) menu.value?.focusFirst(true);
  else (trigger.value?.$el as HTMLButtonElement | undefined)?.click();
}

function close(returnFocus = false) {
  popover.value?.hide();
  if (returnFocus) void nextTick(() => (trigger.value?.$el as HTMLElement | undefined)?.focus({ preventScroll: true }));
}

async function select(id: string) {
  const entry = catalog.value.commands.get(id);
  const anchor = trigger.value?.$el;
  if (!entry || props.disabled || !(anchor instanceof HTMLElement)) return;
  const search = normalizeSearch(query.value);
  const matching = entry.tool.presets?.filter(preset => search.includes(normalizeSearch(translate(preset.label))));
  const command = matching?.length === 1 ? { ...entry, initialValues: { ...matching[0].values, ...entry.initialValues } } : entry;
  const directory = getDirectory();
  const canvasId = getCanvas()?.id;
  const sameNode = () => findNode(node.id) === node && directory === getDirectory() && canvasId === getCanvas()?.id;
  for (const modelId of requiredModels(command.tool)) {
    if (modelError.value) { retry.value++; return; }
    const item = modelItems.value?.get(modelId);
    if (!item) return;
    if (!item.canRun) {
      const sourceUrl = props.source?.url;
      close();
      const ready = await openModelInstaller?.(item.id);
      if (!sameNode() || !node.selected || !anchor.isConnected || props.disabled || props.source?.url !== sourceUrl) return;
      if (!ready) {
        anchor.focus({ preventScroll: true });
        return;
      }
    }
  }
  if (mime.value) {
    close();
    emit("select", { ...command, anchor });
    return;
  }
  pickSource(translate(command.tool.label), command, anchor);
}

function pickSource(title: string, command?: Omit<MediaToolSelection, "anchor">, anchor?: HTMLElement) {
  if (!props.importSource || !props.sourceKind || pending.value || props.disabled) return;
  const kind = props.sourceKind + "/";
  const accept = command?.tool.sourceMimeTypes?.filter(type => type.startsWith(kind)).join(",") || kind + "*";
  const directory = getDirectory(), canvas = getCanvas()?.id, source = props.source?.url;
  close();
  pending.value = { title, accept, command, anchor, canCommit: () => node.selected && findNode(node.id) === node
    && directory === getDirectory() && canvas === getCanvas()?.id && props.source?.url === source };
}

async function importFile(file: File) {
  const choice = pending.value;
  if (!choice || props.disabled || importing.value || !props.importSource) return;
  const canCommit = () => pending.value === choice && choice.canCommit();
  if (!canCommit()) { pending.value = undefined; return; }
  const { command, anchor } = choice;
  importing.value = true;
  try {
    const fileType = getMediaMimeType(file);
    if (!fileType.startsWith(props.sourceKind + "/") || (command && !acceptsSource(command.tool, fileType))) {
      ElMessage.warning(translate("所选文件格式与此工具不匹配"));
      return;
    }
    const url = await props.importSource(file, canCommit);
    await nextTick();
    if (url && pending.value === choice && command && anchor?.isConnected && node.selected && !props.disabled && props.source?.url === url) {
      emit("select", { ...command, anchor });
    }
  } catch (error) {
    showNodeError(error, "导入素材失败");
  } finally {
    importing.value = false;
    if (pending.value === choice) pending.value = undefined;
  }
}

defineExpose({ replaceSource: (title: string) => pickSource(translate(title)) });
watch([() => node.selected, () => getCanvas()?.id, getDirectory], () => { pending.value = undefined; close(); }, { flush: "sync" });
watch([() => props.disabled, mime], () => close());
onBeforeUnmount(() => { pending.value = undefined; });
onNodeDragStart(() => close());
onMoveStart(() => close());
onSelectionStart(() => close());
</script>

<style scoped lang="scss">
.moreButton {
  .moreChevron { margin-inline-start: 4px; }
  &.expanded { background: var(--el-fill-color-light); .moreChevron { transform: rotate(180deg); } }
}
.toolMenu {
  color: var(--el-text-color-primary);
  .sourceHint { margin: 4px 12px 8px; color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); }
  .toolSearch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 9px;
    margin: 2px 7px 5px;
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    input {
      min-width: 0; width: 100%; border: 0; background: transparent; color: var(--el-text-color-primary); font: inherit; outline: none;
    }
    &:focus-within { outline: 1px solid var(--el-color-primary); }
  }
  .toolList { padding: 0; margin: 0; list-style: none; }
  .emptySearch { display: block; padding: 10px 16px; font-size: 12px; color: var(--el-text-color-secondary); }
}
</style>
