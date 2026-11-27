<template>
  <component :is="usesDialog ? ElDialog : ElPopover" v-if="visible" v-bind="surfaceProps" @afterEnter="focusPanel" @opened="focusPanel"
    @close="usesDialog && close(true)">
    <form v-if="selection" ref="panel" class="toolPanel nodrag nopan nowheel" :class="{ visualPanel: usesDialog }" :aria-label="title" tabindex="-1"
      @submit.prevent="start" @pointerdown.stop @mousedown.stop @wheel.stop @dblclick.stop @keydown.stop @play.capture="handlePlay">
      <strong v-if="!usesDialog" class="toolTitle">{{ title }}</strong>
      <div class="toolFields" :class="{ inspectorLayout: selection.tool.accept && !selection.tool.multiple, sequenceLayout: selection.tool.multiple }">
        <div class="editArea">
          <div v-if="showOriginal && file" class="originalSource" :class="{ audioSource: file.mimeType.startsWith('audio/') }">
            <span>{{ selectedClip?.name || translate('当前素材') }}</span>
            <mediaChoicePreview class="originalPreview" v-bind="stageSource" :name="selectedClip?.name || node.data.label" active />
          </div>
          <component :is="toRaw(editor)" v-if="editor && file" :key="selection.tool.id" :tool="selection.tool" :source="file"
            :src="src ?? ''" :values="values" v-bind="selection.tool.multiple ? { attachments, previewIndex } : selection.tool.accept ? { attachments } : {}"
            v-on="selection.tool.multiple ? { 'update:previewIndex': (index: number) => previewIndex = index } : {}"
            @updateValues="applyValues" @ready="editorReady = $event" />
          <div v-if="parameterPresets.length" class="parameterPresets" role="group" :aria-label="title">
            <el-button v-for="preset in parameterPresets" :key="preset.label" size="small" :type="matchesPreset(preset.values) ? 'primary' : 'default'"
              :aria-pressed="matchesPreset(preset.values)" @click="applyValues(preset.values)">{{ translate(preset.label) }}</el-button>
          </div>
          <fieldset v-for="field in choiceFields" :key="field.key" class="fieldChoices">
            <legend>{{ translate(field.label) }}</legend>
            <div class="choices">
              <label v-for="option in field.options" :key="option.value">
                <input v-model="values[field.key]" type="radio" :name="formId + field.key" :value="option.value" />
                {{ translate(option.label) }}
              </label>
            </div>
          </fieldset>
          <component :is="parameterPresets.length ? 'details' : 'div'" v-if="detailFields.length" class="parameterFields">
            <summary v-if="parameterPresets.length">{{ translate('微调参数') }}</summary>
            <div v-for="field in detailFields" :key="field.key" class="toolField">
              <label :for="formId + field.key">{{ translate(field.label) }}</label>
              <el-input-number v-if="field.type === 'number'" :id="formId + field.key" :modelValue="typeof values[field.key] === 'number' ? Number(values[field.key]) : undefined" :min="field.min" :max="field.max"
                :step="field.step ?? 1" controlsPosition="right" :aria-label="translate(field.label)" @update:modelValue="value => values[field.key] = value ?? ''" />
              <el-color-picker v-else-if="field.type === 'color'" :id="formId + field.key" :modelValue="String(values[field.key])" :aria-label="translate(field.label)" :popperClass="optionClass"
                @update:modelValue="value => values[field.key] = value || field.value" />
              <el-input v-else :id="formId + field.key" v-model="values[field.key]" :type="field.type === 'textarea' ? 'textarea' : 'text'" :rows="3" :aria-label="translate(field.label)" />
            </div>
          </component>
        </div>
        <aside v-if="selection.tool.accept || selection.tool.extraInput" class="inputSources">
          <mediaToolInputs v-if="selection.tool.accept" v-model="attachments" v-model:previewIndex="previewIndex" :tool="selection.tool" :disabled="busy"
            :optional="selection.tool.attachmentsRequired === false" :largePreview="showOriginal && !selection.tool.multiple && selection.tool.accept.startsWith('image/')"
            :original="selection.tool.multiple ? file : undefined" :originalPreviewUrl="src" :originalName="node.data.label" @browse="pausePlayers" />
          <mediaToolInputs v-if="selection.tool.extraInput" v-model="extraAttachments" optional :tool="selection.tool.extraInput" :disabled="busy" @browse="pausePlayers" />
        </aside>
      </div>
      <footer>
        <el-button v-if="usesDialog" @click="close(true)">取消</el-button>
        <el-button type="primary" nativeType="submit" :title="translate('应用到新节点')" :disabled="disabled || !file || !inputsReady">
          {{ translate(selection.tool.actionLabel || selection.tool.label) }}
        </el-button>
      </footer>
    </form>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, toRaw, useId, watch } from "vue";
import { useNode, useVueFlow, type Node } from "@vue-flow/core";
import { translate } from "@toonflow/i18n/vue";
import { getAssetOutputs } from "@toonflow/nodes-scaffold/connection";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import mediaToolInputs from "./mediaToolInputs.vue";
import mediaChoicePreview from "./mediaChoicePreview.vue";
import { ElButton, ElColorPicker, ElDialog, ElInput, ElInputNumber, ElMessage, ElPopover } from "element-plus";
import { useNodeEvent, useNodeFfmpeg, useNodeFiles, type NodeMediaValue, type WorkspaceFiles } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "../showNodeError";
import type { MediaTool, MediaToolAttachment, MediaToolOutput, MediaToolResults, MediaToolRunner, MediaToolSelection } from "../mediaTools";

const props = defineProps<{
  file?: NodeMediaValue;
  src?: string;
  disabled?: boolean;
  run: MediaToolRunner;
}>();
const { node } = useNode();
const { findNode, getNodes, nodeTypes, getSelectedNodes, onMoveStart, onNodeDragStart, onSelectionStart } = useVueFlow();
const files = useNodeFiles();
const model = useNodeModel();
const loadFfmpeg = useNodeFfmpeg();
const nodeEvent = useNodeEvent();
const getCanvas = inject<() => { id: string } | undefined>("canvas", () => undefined);
const getDirectory = inject<() => string>("workspaceDirectory", () => "");
const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
const resultHost = inject<MediaToolResults>("mediaToolResults");
const formId = useId();
const kindLabels: Record<string, string> = { image: "图片", video: "视频", audio: "音频", text: "文本" };
function subtitleFormat(mime: string) {
  return mime === "text/vtt" ? "vtt" : ["text/srt", "application/x-subrip"].includes(mime) ? "srt" : undefined;
}
const visible = ref(false);
const selection = shallowRef<MediaToolSelection>();
const anchor = computed(() => selection.value?.anchor);
const panel = ref<HTMLElement>();
const optionClass = "mediaToolOption" + formId.replace(/\W/g, "");
const title = computed(() => selection.value ? translate(selection.value.tool.label) : "");
const editor = computed(() => selection.value?.tool.editor);
const formFields = computed(() => editor.value ? [] : selection.value?.tool.fields ?? []);
const choiceFields = computed(() => formFields.value.filter(field => field.type === "select"));
const detailFields = computed(() => formFields.value.filter(field => field.type !== "select"));
const parameterPresets = computed(() => formFields.value.length ? selection.value?.tool.presets ?? [] : []);
const editorReady = ref(false);
const usesDialog = computed(() => !!(editor.value || selection.value?.tool.accept || selection.value?.tool.extraInput || choiceFields.value.length || parameterPresets.value.length));
const showOriginal = computed(() => !editor.value && usesDialog.value && !!props.file);
const surfaceProps = computed(() => usesDialog.value ? {
  modelValue: true, title: title.value, class: "mediaVisualDialog", width: selection.value?.tool.accept || selection.value?.tool.extraInput ? "860px" : "720px", alignCenter: true,
  appendToBody: true, destroyOnClose: true, closeOnClickModal: false, closeOnPressEscape: false,
} : {
  visible: true, virtualTriggering: true, virtualRef: anchor.value, trigger: [], placement: "bottom-end",
  fallbackPlacements: ["top-end", "bottom-start", "top-start"], width: 340, persistent: false, showArrow: false,
  popperStyle: { maxWidth: "calc(100vw - 16px)", padding: "14px", borderRadius: "var(--el-border-radius-base)" },
});
const values = ref<Record<string, string | number>>({});
const attachments = shallowRef<MediaToolAttachment[]>([]);
const previewIndex = ref(0);
const selectedClip = computed(() => selection.value?.tool.multiple && previewIndex.value > 0 ? attachments.value[previewIndex.value - 1] : undefined);
const stageSource = computed(() => {
  const item = selectedClip.value;
  if (!item) return { media: props.file, previewUrl: props.src };
  return item instanceof File ? { file: item } : { media: { url: item.path, mimeType: item.mimeType } };
});
const extraAttachments = shallowRef<MediaToolAttachment[]>([]);
const missingAttachment = computed(() => !!selection.value?.tool.accept && selection.value.tool.attachmentsRequired !== false && !attachments.value.length);
const inputsReady = computed(() => {
  if (missingAttachment.value || (editor.value && !editorReady.value)) return false;
  return (selection.value?.tool.fields ?? []).every(field => {
    if (field.type !== "number") return true;
    const value = values.value[field.key];
    return typeof value === "number" && Number.isFinite(value) && (field.min === undefined || value >= field.min) && (field.max === undefined || value <= field.max);
  });
});
const controller = shallowRef<AbortController>();
const cancelling = ref(false);
const busy = computed(() => !!controller.value);
const progress = ref<number>();
let job: Promise<void> | undefined;

function applyValues(update: Record<string, string | number>) {
  Object.assign(values.value, update);
}

function matchesPreset(preset: Record<string, string | number>) {
  return Object.entries(preset).every(([key, value]) => values.value[key] === value);
}

function focusPanel() {
  if (usesDialog.value) { panel.value?.focus({ preventScroll: true }); return; }
  const target = panel.value?.querySelector<HTMLElement>("input:not([type=hidden]):not(:disabled), textarea:not(:disabled), button:not(:disabled)");
  (target ?? panel.value)?.focus({ preventScroll: true });
}

function open(choice: MediaToolSelection) {
  if (props.disabled || !props.file || busy.value) return;
  attachments.value = [];
  previewIndex.value = 0;
  extraAttachments.value = [];
  editorReady.value = false;
  selection.value = choice;
  values.value = { ...Object.fromEntries((choice.tool.fields ?? []).map(field => [field.key, field.value])), ...choice.initialValues };
  visible.value = true;
  if (!usesDialog.value && !formFields.value.length) start();
}

function handlePlay(event: Event) {
  const playing = event.target;
  if (!(playing instanceof HTMLMediaElement)) return;
  const sources = ".mediaInputs, .originalSource";
  for (const other of panel.value?.querySelectorAll<HTMLMediaElement>("audio, video") ?? []) {
    if (other !== playing && !other.paused && (playing.closest(sources) || other.closest(sources))) other.pause();
  }
}

function pausePlayers() {
  for (const player of panel.value?.querySelectorAll<HTMLMediaElement>("audio, video") ?? []) {
    if (!player.paused) player.pause();
  }
}

function close(restoreFocus = false) {
  visible.value = false;
  if (restoreFocus && anchor.value?.isConnected) anchor.value.focus({ preventScroll: true });
}

function cancel() {
  if (!controller.value || cancelling.value) return;
  cancelling.value = true;
  controller.value.abort();
}

function reset() {
  cancel();
  close();
}

async function cancelAndWait() {
  reset();
  await job;
}

function outside(event: PointerEvent) {
  if (usesDialog.value) return;
  const target = event.target;
  if (!(target instanceof Element) || panel.value?.contains(target) || target.closest("." + optionClass)) return;
  close();
}

function handleEscape(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.isComposing || !(event.target instanceof Element)) return;
  const popup = event.target.closest("." + optionClass);
  const expanded = panel.value?.querySelector<HTMLElement>('[aria-expanded="true"][aria-controls]:is([aria-haspopup],[role="combobox"])');
  if (popup && expanded) {
    requestAnimationFrame(() => {
      if (expanded.isConnected && expanded.getAttribute("aria-expanded") === "false"
        && (popup.contains(document.activeElement) || document.activeElement === document.body)) {
        expanded.focus({ preventScroll: true });
      }
    });
  }
  if (popup || expanded || !(usesDialog.value ? panel.value?.closest('[role="dialog"]') : panel.value)?.contains(event.target)) return;
  event.preventDefault();
  event.stopPropagation();
  close(true);
}

watch(visible, (shown, _, onCleanup) => {
  if (!shown) return;
  document.addEventListener("pointerdown", outside, true);
  document.addEventListener("keydown", handleEscape, true);
  onCleanup(() => {
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", handleEscape, true);
  });
});
watch([() => node.selected, () => getSelectedNodes.value.length], ([selected, count]) => { if (!selected || count !== 1) close(); });
onMoveStart(() => close());
onNodeDragStart(() => close());
onSelectionStart(() => close());
watch([() => props.file?.url, () => getCanvas()?.id], reset, { flush: "sync" });
watch(() => props.disabled, value => { if (value) reset(); }, { flush: "sync" });
onBeforeUnmount(reset);
nodeEvent.on("delete", cancelAndWait);
nodeEvent.on("save", reason => { if (reason === "reload" && busy.value) throw new Error("请先完成或取消素材处理"); });

function start() {
  if (busy.value || props.disabled || !selection.value || !props.file || !inputsReady.value) return;
  progress.value = undefined;
  cancelling.value = false;
  close(true);
  const current = controller.value = new AbortController();
  job = process(selection.value.tool, { ...props.file }, current);
}

async function process(selected: MediaTool, source: NodeMediaValue, current: AbortController) {
  const signal = current.signal;
  let directory: string;
  let canvasId: string | undefined;
  const outputDirectory = `assets/${crypto.randomUUID()}`;
  const inputDirectory = `${outputDirectory}/inputs`;
  let workspace: WorkspaceFiles | undefined;
  const temporaryDirectories: string[] = [];
  const destinations: Node[] = [];
  const resultTitle = title.value;
  const state = {
    source,
    get text() {
      if (cancelling.value) return translate("正在取消…");
      return progress.value === undefined ? translate("正在处理…") : `${progress.value}%`;
    },
    get cancelling() { return cancelling.value; },
    cancel,
  };
  const x = node.computedPosition.x + (node.dimensions.width || 320) + 80;
  let y = node.computedPosition.y;
  function checkSource() {
    signal.throwIfAborted();
    if (getDirectory() !== directory || getCanvas()?.id !== canvasId || findNode(node.id) !== node || props.file?.url !== source.url) {
      throw new Error("画布或节点素材已变化，请重新操作");
    }
  }
  function previewOutputs(outputs: MediaToolOutput[]) {
    checkSource();
    if (!resultHost) throw new Error("画布尚未就绪");
    const neighbours = outputs.length > destinations.length
      ? [...getNodes.value].sort((a, b) => a.computedPosition.y - b.computedPosition.y) : [];
    for (const [index, output] of outputs.entries()) {
      const mime = output.mimeType.split(";")[0].trim().toLowerCase();
      const kind = subtitleFormat(mime) ? "text" : /^(image|audio|video)\/[a-z\d.+-]+$/.exec(mime)?.[1];
      if (!kind) throw new Error("此处理结果缺少对应的节点类型");
      const type = `remote-${kind}Node`;
      if (!nodeTypes?.value?.[type]) throw new Error(`请先启用${kindLabels[kind]}节点插件`);
      const label = output.label ? translate(output.label) : resultTitle;
      const existing = destinations[index];
      if (existing) {
        if (existing.type === type && existing.data?.label === label) continue;
        existing.type = type;
        existing.data = { label };
        resultHost.add(existing, state);
        continue;
      }
      const sameMedia = source.mimeType.startsWith(kind + "/");
      const width = sameMedia && node.dimensions.width || 360;
      const height = sameMedia && node.dimensions.height || 300;
      for (const other of neighbours) {
        const pos = other.computedPosition;
        if (pos.x < x + width && pos.x + (other.dimensions.width || 320) > x && pos.y < y + height && pos.y + (other.dimensions.height || 300) > y) y = pos.y + (other.dimensions.height || 300) + 40;
      }
      const destination: Node = { id: crypto.randomUUID(), type, position: { x, y }, data: { label } };
      destinations.push(destination);
      resultHost.add(destination, state);
      y += height + 40;
    }
    if (outputs.length < destinations.length) resultHost.discard(destinations.splice(outputs.length).map(item => item.id));
  }
  try {
    directory = getDirectory();
    canvasId = getCanvas()?.id;
    previewOutputs(selected.outputs ?? [source]);
    workspace = files.getWorkspaceFiles();
    await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    await workspace.mkdir(outputDirectory);
    temporaryDirectories.push(outputDirectory);
    const inputs: string[] = [];
    const primaryCount = attachments.value.length;
    const chosen = [...attachments.value, ...extraAttachments.value];
    if (chosen.some(item => item instanceof File)) await workspace.mkdir(inputDirectory);
    for (const [index, file] of chosen.entries()) {
      checkSource();
      if (!(file instanceof File)) {
        const other = findNode(file.nodeId);
        const exists = other && getAssetOutputs(other.data).some(({ output }) => typeof output.value === "object" && output.value.url === file.path);
        if (!exists) throw new Error("选中的画布素材已变化，请重新选择");
        inputs.push(file.path);
        continue;
      }
      const extension = file.name.match(/\.[a-z\d]{1,10}$/i)?.[0].toLowerCase() ?? "";
      const path = `${inputDirectory}/${index + 1}${extension}`;
      await workspace.write(path, file, true);
      inputs.push(path);
    }
    checkSource();
    const results = await props.run(selected.id, {
      directory, source, sourcePreviewUrl: props.src, model, workspace, values: { ...values.value }, attachments: inputs.slice(0, primaryCount),
      extraAttachments: inputs.slice(primaryCount), outputDirectory, signal,
      reportOutputs: previewOutputs,
      reportProgress: (completed, total) => {
        if (!signal.aborted && Number.isFinite(completed) && Number.isFinite(total) && total > 0) {
          progress.value = Math.min(99, Math.max(0, Math.floor(completed / total * 100)));
        }
      },
      ffmpeg: () => { checkSource(); return loadFfmpeg(signal); },
    });
    checkSource();
    if (!results.length) throw new Error("处理未生成结果");
    previewOutputs(results);
    for (const [index, item] of results.entries()) {
      checkSource();
      const name = item.path.split("/").at(-1);
      if (!name || !item.path.startsWith(outputDirectory + "/") || item.path.startsWith(inputDirectory + "/") || /\\/.test(item.path) || item.path.split("/").includes("..")) throw new Error("处理结果路径无效");
      const destination = destinations[index];
      const mimeType = item.mimeType.split(";")[0].trim().toLowerCase();
      const format = subtitleFormat(mimeType);
      const kind = format ? "text" : mimeType.split("/")[0];
      const resultDirectory = `assets/${destination.id}`;
      await workspace.mkdir(resultDirectory);
      temporaryDirectories.push(resultDirectory);
      const url = `${resultDirectory}/${format ? "content.md" : name}`;
      await workspace.rename(item.path, url);
      if (format) {
        destination.data = { ...destination.data, textPath: url, subtitleFormat: format };
        continue;
      }
      const output = { dataType: kind.toUpperCase(), value: { url, mimeType } };
      destination.data = { ...destination.data, outputs: { [kind]: output } };
      if (kind === "image" && source.mimeType.startsWith("image/")) {
        destination.data.imageComparison = { original: source, resultUrl: url };
      }
    }
    await batchHistory(async () => {
      checkSource();
      if (destinations.some(result => !nodeTypes?.value?.[result.type!])) throw new Error("结果节点插件已变化，请重新操作");
      resultHost!.commit(destinations);
      // 结果目录随节点进入画布历史；任务的输入和中间文件仍需清理。
      temporaryDirectories.splice(1);
    });
    ElMessage.success(`已生成 ${destinations.length} 个结果节点`);
  } catch (error) {
    if (!signal.aborted) showNodeError(error, "素材处理失败");
  } finally {
    resultHost?.discard(destinations.map(item => item.id));
    for (const path of temporaryDirectories) await workspace!.remove(path, true).catch(error => showNodeError(error, "临时素材清理失败"));
    controller.value = undefined;
    cancelling.value = false;
  }
}

defineExpose({ open, busy, close, visible, cancelAndWait });
</script>

<style scoped lang="scss">
.toolPanel {
  display: grid;
  gap: 12px;
  max-height: min(70dvh, 500px);
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--el-text-color-primary);
  &:focus { outline: none; }

  .toolTitle { overflow-wrap: anywhere; font-size: 14px; }
  .toolFields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    &:empty { display: none; }
    .parameterPresets {
      display: flex; flex-wrap: wrap; gap: 6px;
      .el-button { margin: 0; }
    }
    .fieldChoices {
      border: 0; min-inline-size: 0; padding: 0; margin: 0;
      legend { padding: 0; font-weight: 600; font-size: 13px; }
      .choices {
        display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
        label {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; min-height: 32px; box-sizing: border-box;
          border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); cursor: pointer; font-size: 13px;
          input { margin: 0; accent-color: var(--el-color-primary); }
          &:has(:checked) { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-text-color-primary); }
          &:has(:focus-visible) { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
        }
      }
    }
    .parameterFields {
      summary { cursor: pointer; color: var(--el-text-color-regular); font-size: 13px; }
      .toolField + .toolField, summary + .toolField { margin-top: 8px; }
    }
    .toolField {
      display: grid;
      gap: 4px;
      label { color: var(--el-text-color-regular); font-size: 12px; }
      .el-input-number { width: 100%; }
    }
    :deep(.mediaInputs) { margin: 0; }
    .editArea {
      display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 12px; min-width: 0;
      &:empty { display: none; }
      .originalSource {
        display: grid; gap: 10px; font-size: 13px; font-weight: 600;
        .originalPreview { width: 100%; height: clamp(96px, 24dvh, 180px); border-radius: var(--el-border-radius-base); }
        &.audioSource .originalPreview { height: 54px; }
      }
    }
    .inputSources { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-content: start; }
    &.inspectorLayout {
      grid-template-columns: minmax(0, 1.55fr) minmax(245px, 1fr); gap: 16px;
      .inputSources { border-inline-start: 1px solid var(--el-border-color-lighter); padding-inline-start: 14px; }
      @container (max-width: 630px) {
        grid-template-columns: minmax(0, 1fr);
        .inputSources { padding-inline-start: 0; border-inline-start: 0; }
      }
    }
    &.sequenceLayout {
      .inputSources { padding-block-start: 12px; border-top: 1px solid var(--el-border-color-lighter); }
    }
  }
  footer .el-button { width: 100%; }
  &.visualPanel {
    container-type: inline-size;
    width: 100%;
    display: flex;
    flex-direction: column;
    max-height: none;
    min-height: 0;
    overflow: hidden;
    .toolFields { min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 4px 3px; }
    footer {
      display: flex;
      flex-shrink: 0;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
      .el-button { width: auto; }
    }
  }
}
:global(.mediaVisualDialog.el-dialog) {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 32px);
}
:global(.mediaVisualDialog .el-dialog__body) { display: flex; flex-direction: column; min-height: 0; }
</style>
