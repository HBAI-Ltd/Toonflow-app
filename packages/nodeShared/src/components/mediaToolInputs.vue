<template>
  <fieldset ref="container" class="mediaInputs" :class="{ dragging }"
    @dragover="dragOver" @dragleave="dragLeave" @drop="dropFiles">
    <legend class="accessibleLabel">{{ translate(tool.attachmentLabel || '添加素材') }}</legend>
    <div class="inputHeader">
      <span class="inputLabel" aria-hidden="true">{{ translate(tool.attachmentLabel || '添加素材') }}</span>
      <div class="sourceActions">
        <el-button ref="canvasButton" text :icon="IconLayoutGrid" :aria-expanded="showCanvas" :disabled="locked" @click="openCanvas">{{ translate('画布素材') }}</el-button>
        <el-button v-if="files.pickAssets" text :icon="IconFolderOpen" :disabled="locked" @click="pickLibrary">{{ translate('素材库') }}</el-button>
        <el-button text :icon="IconUpload" :disabled="locked" :title="translate('选择或拖入文件')" @click="fileInput?.click()">{{ translate('本地文件') }}</el-button>
        <input ref="fileInput" type="file" :accept="tool.accept" :multiple="tool.multiple" hidden @change="selectFiles" />
      </div>
    </div>
    <mediaCanvasGallery v-if="showCanvas" :choices="choices" :order="selectionOrder" :multiple="tool.multiple" :inline="inlineGallery"
      @choose="choose" @confirm="applyDraft" @close="closeCanvas" />
    <p v-if="failure" class="inputFailure" role="alert">{{ failure }}</p>
    <template v-if="tool.multiple && (original || items.length)">
      <div class="sequenceStrip" :aria-label="translate('已选素材')">
        <button v-if="original" type="button" class="clipTile fixedClip" :class="{ active: previewIndex === 0 }" :aria-pressed="previewIndex === 0"
          :aria-label="translate('当前素材')" :title="originalName || translate('当前素材')" @click="previewIndex = 0">
          <mediaChoicePreview class="clipPreview" :media="original" :previewUrl="originalPreviewUrl" />
          <span class="clipIndex">1</span><span class="clipName">{{ originalName || translate('当前素材') }}</span>
        </button>
        <vue-draggable :modelValue="items" class="clipList" direction="horizontal" :disabled="locked" :animation="140" ghostClass="clipGhost" filter=".removeClip" :preventOnFilter="false" :clone="keepItem" @update:modelValue="setOrder">
          <div v-for="(item, index) in items" :key="itemKey(item)" class="clipTile" :class="{ active: previewIndex === index + firstOffset }">
            <button type="button" class="clipSelect" :aria-pressed="previewIndex === index + firstOffset" :title="item.name"
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight" @click="previewIndex = index + firstOffset"
              @keydown.alt.left.stop.prevent="move(index, -1)" @keydown.alt.right.stop.prevent="move(index, 1)">
              <mediaChoicePreview class="clipPreview" v-bind="previewProps(item)" :name="item.name" />
              <span class="clipIndex">{{ index + firstOffset + 1 }}</span><span class="clipName">{{ item.name }}</span>
            </button>
            <button type="button" class="removeClip" :aria-label="t`移除 ${item.name}`" :title="t`移除 ${item.name}`" :disabled="locked" @click="remove(index)"><icon-x :size="13" /></button>
          </div>
        </vue-draggable>
      </div>
      <span v-if="items.length > 1" class="sortHint">{{ translate('拖动调整顺序') }}</span>
    </template>
    <div v-else-if="items[0]" class="singleSelection" :class="{ largePreview }">
      <mediaChoicePreview class="selectedPreview" v-bind="previewProps(items[0])" :name="items[0].name" active />
      <div class="selectedDetails"><span class="selectedName" :title="items[0].name">{{ items[0].name }}</span>
        <el-button text size="small" :icon="IconX" :disabled="locked" :aria-label="t`移除 ${items[0].name}`" @click="remove(0)" />
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onScopeDispose, ref, shallowRef } from "vue";
import { t, translate } from "@toonflow/i18n/vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { ElButton } from "element-plus";
import { IconFolderOpen, IconLayoutGrid, IconUpload, IconX } from "@tabler/icons-vue";
import { VueDraggable } from "vue-draggable-plus";
import mediaCanvasGallery, { type CanvasChoice } from "./mediaCanvasGallery.vue";
import { getAssetOutputs } from "@toonflow/nodes-scaffold/connection";
import { useNodeFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolAttachment } from "../mediaTools";
import { acceptsMediaFile } from "../mediaTypes";
import mediaChoicePreview from "./mediaChoicePreview.vue";

const props = defineProps<{ tool: Pick<MediaTool, "accept" | "multiple" | "attachmentLabel">; disabled?: boolean; optional?: boolean; inlineGallery?: boolean; largePreview?: boolean; original?: NodeMediaValue; originalPreviewUrl?: string; originalName?: string }>();
const items = defineModel<MediaToolAttachment[]>({ required: true });
const emit = defineEmits<{ browse: [] }>();
const previewIndex = defineModel<number>("previewIndex", { default: 0 });
const firstOffset = computed(() => props.original ? 1 : 0);
const { node } = useNode();
const { getNodes, getEdges } = useVueFlow();
const files = useNodeFiles();
const container = ref<HTMLElement>();
const canvasButton = ref<InstanceType<typeof ElButton>>();
const fileInput = ref<HTMLInputElement>();
const dragging = ref(false);
const failure = ref("");
const showCanvas = ref(!!props.inlineGallery && !items.value.length);
const draft = shallowRef<MediaToolAttachment[]>([]);
const picking = shallowRef<AbortController>();
const locked = computed(() => props.disabled || !!picking.value);
const fileKeys = new WeakMap<File, string>();

const incoming = computed(() => Map.groupBy(getEdges.value.filter(edge => edge.target === node.id), edge => edge.source));
const choices = computed(() => {
  const list: CanvasChoice[] = [];
  const accept = props.tool.accept ?? "";
  const generatedName = /^(?:[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}|[a-f\d]{24,})(?:\.[\w]+)?$/i;
  for (const other of getNodes.value) {
    if (other.id === node.id) continue;
    const edges = incoming.value.get(other.id);
    const label = String(other.data.label ?? "").split(" · ").filter(part => part && !generatedName.test(part)).join(" · ");
    const format = other.data.subtitleFormat;
    const content = other.data.outputs?.text?.value;
    if (other.type === "remote-textNode" && (format === "srt" || format === "vtt") && typeof content === "string" && content.trim()) {
      const name = (label || translate("字幕")).replace(/\.(srt|vtt)$/i, "") + "." + format;
      if (acceptsMediaFile(accept, { name, type: "text/" + format })) list.push({ key: other.id + "/text", nodeId: other.id, name, title: name, text: content, format, connected: !!edges?.some(edge => edge.sourceHandle === "text") });
    }
    const paths = new Set<string>();
    for (const { output, label: outputLabel } of getAssetOutputs(other.data)) {
      const media = output.value;
      if (!media || typeof media !== "object" || paths.has(media.url)) continue;
      const fileName = media.url.split(/[\\/]/).at(-1) ?? "";
      if (!acceptsMediaFile(accept, { name: fileName, type: media.mimeType })) continue;
      paths.add(media.url);
      const name = label || (fileName && !generatedName.test(fileName) ? fileName : translate(outputLabel) + " " + (list.length + 1));
      list.push({ key: other.id + "/" + media.url, nodeId: other.id, name, title: name === fileName ? name : name + " · " + fileName, media,
        connected: !!edges?.some(edge => edge.sourceHandle && other.data.outputs?.[edge.sourceHandle] === output) });
    }
  }
  return list.sort((a, b) => Number(b.connected) - Number(a.connected));
});
function itemKey(item: MediaToolAttachment) {
  if (!(item instanceof File)) return item.nodeId + "/" + item.path;
  if (!fileKeys.has(item)) fileKeys.set(item, crypto.randomUUID());
  return fileKeys.get(item)!;
}
const selectionOrder = computed(() => new Map((props.inlineGallery ? items.value : draft.value).map((item, index) => [itemKey(item), index + firstOffset.value + 1])));
function previewProps(item: MediaToolAttachment) {
  return item instanceof File ? { file: item } : { media: { url: item.path, mimeType: item.mimeType } };
}
function keepItem(item: MediaToolAttachment) { return item; }
function setOrder(next: MediaToolAttachment[]) {
  const current = items.value[previewIndex.value - firstOffset.value];
  const index = current ? next.indexOf(current) : -1;
  const position = index < 0 ? Math.max(0, Math.min(previewIndex.value, next.length - 1 + firstOffset.value)) : index + firstOffset.value;
  items.value = next;
  previewIndex.value = position;
}
function remove(index: number) {
  setOrder(items.value.filter((_, i) => i !== index));
  if (props.inlineGallery && items.value.length <= 1) showCanvas.value = true;
}
function add(next: MediaToolAttachment[]) {
  if (!next.length) return;
  failure.value = "";
  setOrder(props.tool.multiple ? [...items.value, ...next] : next.slice(0, 1));
  showCanvas.value = false;
}
function openCanvas() {
  if (locked.value) return;
  if (props.inlineGallery && showCanvas.value) { showCanvas.value = false; return; }
  draft.value = [...items.value];
  emit("browse");
  showCanvas.value = true;
}
function closeCanvas() {
  showCanvas.value = false;
  draft.value = [];
  void nextTick(() => canvasButton.value?.$el?.focus({ preventScroll: true }));
}
function applyDraft() {
  if (!locked.value) { setOrder(draft.value); failure.value = ""; }
  closeCanvas();
}
function canvasAttachment(choice: CanvasChoice): MediaToolAttachment | undefined {
  if (choice.media) return { nodeId: choice.nodeId, path: choice.media.url, mimeType: choice.media.mimeType, name: choice.name };
  if (choice.text === undefined) return;
  const file = new File([choice.text], choice.name, { type: "text/" + choice.format });
  fileKeys.set(file, choice.key);
  return file;
}
function choose(choice: CanvasChoice) {
  if (locked.value) return;
  if (!props.inlineGallery && props.tool.multiple) {
    if (selectionOrder.value.has(choice.key)) draft.value = draft.value.filter(item => itemKey(item) !== choice.key);
    else {
      const item = canvasAttachment(choice);
      if (item) draft.value = [...draft.value, item];
    }
    return;
  }
  const item = canvasAttachment(choice);
  if (item) add([item]);
  closeCanvas();
}

onMounted(() => {
  if (props.optional || items.value.length) return;
  const linked = choices.value.filter(entry => entry.connected);
  const item = linked.length === 1 && canvasAttachment(linked[0]);
  if (item) add([item]);
});
onScopeDispose(() => picking.value?.abort());

async function pickLibrary() {
  if (locked.value || !files.pickAssets || !props.tool.accept) return;
  emit("browse");
  const current = picking.value = new AbortController();
  failure.value = "";
  try {
    const picked = await files.pickAssets(node.id, props.tool.accept, !!props.tool.multiple, current.signal);
    if (!current.signal.aborted && !props.disabled) addFiles(picked);
  } catch (error) {
    if (!current.signal.aborted) failure.value = error instanceof Error ? error.message : translate("读取素材失败");
  } finally { if (current === picking.value) picking.value = undefined; }
}

function selectFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = Array.from(input.files ?? []);
  input.value = "";
  if (!locked.value) addFiles(selected);
}
function addFiles(selected: File[]) {
  if (!selected.length) return;
  if (!props.tool.multiple && selected.length > 1) { failure.value = translate("请一次选择一个文件"); return; }
  if (selected.some(file => !acceptsMediaFile(props.tool.accept ?? "", file))) { failure.value = translate("所选文件格式与此工具不匹配"); return; }
  add(selected);
}
function dragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault(); event.stopPropagation();
  event.dataTransfer.dropEffect = locked.value ? "none" : "copy";
  dragging.value = !locked.value;
}
function dragLeave(event: DragEvent) {
  if (!(event.relatedTarget instanceof Node && container.value?.contains(event.relatedTarget))) dragging.value = false;
}
function dropFiles(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault(); event.stopPropagation(); dragging.value = false;
  if (locked.value) return;
  addFiles(Array.from(event.dataTransfer.files));
}
function move(index: number, offset: number) {
  const target = index + offset;
  if (locked.value || target < 0 || target >= items.value.length) return;
  const next = [...items.value];
  next.splice(target, 0, ...next.splice(index, 1));
  setOrder(next);
}
</script>

<style scoped lang="scss">
.mediaInputs {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-primary);
  &.dragging { outline: 2px dashed var(--el-color-primary); outline-offset: 2px; background: var(--el-color-primary-light-9); }
  .accessibleLabel { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .inputHeader { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding-block: 2px 6px; }
  .inputLabel { padding: 0; font-size: 13px; font-weight: 600; line-height: 1.5; }
  .sourceActions {
    display: inline-flex; max-width: 100%; flex-wrap: wrap; gap: 2px; padding: 2px;
    border-radius: var(--el-border-radius-base); background: var(--el-fill-color-light);
    .el-button { margin: 0; padding: 5px 8px; min-height: 28px; height: auto; font-size: 12px; }
  }
  .sequenceStrip {
    display: flex; align-items: flex-start; gap: 8px; min-width: 0; padding: 3px 2px 5px; overflow-x: auto; overscroll-behavior-x: contain;
    .clipList { display: flex; gap: 8px; }
    .clipTile {
      position: relative; flex: none; width: 92px; min-width: 0; margin: 0; padding: 0; border: 0; color: var(--el-text-color-regular); background: transparent; font: inherit; text-align: start;
      .clipSelect { display: block; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: inherit; font: inherit; cursor: grab; }
      .clipPreview { width: 100%; height: 54px; border-radius: var(--el-border-radius-base); overflow: hidden; }
      .clipName { display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 16px; }
      .clipIndex, .removeClip { position: absolute; top: 3px; display: grid; place-items: center; border: 0; height: 18px; min-width: 18px; padding: 0 3px; border-radius: 4px; background: #101114c9; color: white; font-size: 11px; }
      .clipIndex { inset-inline-start: 3px; pointer-events: none; }
      .removeClip { inset-inline-end: 3px; opacity: 0; cursor: pointer; }
      &.active .clipPreview { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      &:hover .removeClip, &:focus-within .removeClip { opacity: 1; }
      @media (hover: none) { .removeClip { opacity: 1; } }
      &.fixedClip { cursor: pointer; }
      &.clipGhost { opacity: .4; }
    }
  }
  .sortHint { display: block; font-size: 11px; color: var(--el-text-color-secondary); }
  .singleSelection {
    display: grid; gap: 3px; min-width: 0;
    .selectedPreview { height: 72px; width: 100%; overflow: hidden; border-radius: var(--el-border-radius-base); }
    &:has(audio) .selectedPreview { height: 44px; }
    &.largePreview .selectedPreview { height: clamp(105px, 24dvh, 200px); }
    .selectedDetails { display: flex; align-items: center; justify-content: space-between; min-width: 0; gap: 6px; }
    .selectedName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
  }
  .inputFailure { margin: 6px 0; color: var(--el-color-danger); font-size: 13px; }
  button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
}
</style>
