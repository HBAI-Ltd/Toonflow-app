<template>
  <section class="documentPanel" :aria-label="t('documentEditor')" @keydown.ctrl.f.prevent="searchVisible = true" @keydown.meta.f.prevent="searchVisible = true">
    <fileTree :directory="workspaceStore.project?.directory" @selectNode="openNode" />
    <div v-loading="opening" class="editorSurface">
      <div v-if="selectedNode" class="documentHeader">
        <span class="documentName" :title="`${selectedPath} / ${selectedNode.label}`">{{ selectedNode.label }}</span>
        <el-select
          v-if="nodeOutputs.length > 1"
          :modelValue="outputId"
          class="outputSelect"
          size="small"
          :aria-label="t('textOutput')"
          :disabled="opening"
          @change="openOutput">
          <el-option v-for="output in nodeOutputs" :key="output.id" :label="output.label" :value="output.id" />
        </el-select>
        <el-button v-if="saveError" text type="danger" size="small" :title="getErrorDisplay(saveError)" @click="flushSave().catch(() => {})">{{ t("saveFailedRetry") }}</el-button>
        <span v-else class="saveStatus" role="status">{{ dirty ? t("saving") : t("saved") }}</span>
      </div>
      <div v-if="editor" class="editorToolbar" role="group" :aria-label="t('documentFormatting')">
        <div class="toolbarGroup">
          <el-button
            class="toolButton"
            text
            size="small"
            :disabled="!editor.can().undo()"
            :aria-label="t('undo')"
            :title="t('undo')"
            @mousedown.prevent
            @click="editor.chain().focus().undo().run()">
            <icon-arrow-back-up :size="17" />
          </el-button>
          <el-button
            class="toolButton"
            text
            size="small"
            :disabled="!editor.can().redo()"
            :aria-label="t('redo')"
            :title="t('redo')"
            @mousedown.prevent
            @click="editor.chain().focus().redo().run()">
            <icon-arrow-forward-up :size="17" />
          </el-button>
        </div>
        <div class="toolbarGroup">
          <el-dropdown trigger="click" @command="setTextStyle">
            <el-button
              class="dropdownButton"
              :class="{ active: editor.isActive('heading') }"
              text
              size="small"
              :aria-label="t('paragraphStyle')"
              :title="textStyle">
              <icon-heading :size="17" />
              <icon-chevron-down :size="12" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="0">{{ t("body") }}</el-dropdown-item>
                <el-dropdown-item v-for="level in headingLevels" :key="level" :command="level">{{ t("headingLevel", { level }) }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="(index: number) => listTools[index]?.run(editor!.chain().focus()).run()">
            <el-button
              class="dropdownButton"
              :class="{ active: listTools.some(item => editor!.isActive(item.name)) }"
              text
              size="small"
              :aria-label="t('list')"
              :title="t('list')">
              <icon-list :size="17" />
              <icon-chevron-down :size="12" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="(item, index) in listTools" :key="item.name" :command="index" :icon="item.icon">
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-tooltip v-for="item in blockTools" :key="item.name" :content="item.label" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive(item.name) }"
              text
              size="small"
              :aria-label="item.label"
              :aria-pressed="editor.isActive(item.name)"
              @mousedown.prevent
              @click="item.run(editor.chain().focus()).run()">
              <component :is="item.icon" :size="17" />
            </el-button>
          </el-tooltip>
        </div>
        <div class="toolbarGroup">
          <el-tooltip v-for="item in formatTools" :key="item.name" :content="item.label" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive(item.name) }"
              text
              size="small"
              :aria-label="item.label"
              :aria-pressed="editor.isActive(item.name)"
              @mousedown.prevent
              @click="item.run(editor.chain().focus()).run()">
              <component :is="item.icon" :size="17" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('link')" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive('link') }"
              text
              size="small"
              :aria-label="t('link')"
              :aria-pressed="editor.isActive('link')"
              @mousedown.prevent
              @click="editLink">
              <icon-link :size="17" />
            </el-button>
          </el-tooltip>
        </div>
        <div class="toolbarGroup">
          <el-tooltip v-for="item in scriptTools" :key="item.name" :content="item.label" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive(item.name) }"
              text
              size="small"
              :aria-label="item.label"
              :aria-pressed="editor.isActive(item.name)"
              @mousedown.prevent
              @click="item.run(editor.chain().focus()).run()">
              <component :is="item.icon" :size="17" />
            </el-button>
          </el-tooltip>
        </div>
        <div class="toolbarGroup">
          <el-tooltip v-for="item in alignmentTools" :key="item.value" :content="item.label" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive({ textAlign: item.value }) }"
              text
              size="small"
              :aria-label="item.label"
              :aria-pressed="editor.isActive({ textAlign: item.value })"
              @mousedown.prevent
              @click="editor.chain().focus().setTextAlign(item.value).run()">
              <component :is="item.icon" :size="17" />
            </el-button>
          </el-tooltip>
        </div>
        <div class="toolbarGroup">
          <el-dropdown trigger="click" @command="insertContent">
            <el-button text size="small" :aria-label="t('insertContent')">
              <icon-photo :size="17" />
              {{ t("add") }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="image" :icon="IconPhoto">{{ t("imageUrl") }}</el-dropdown-item>
                <el-dropdown-item command="table" :icon="IconTable">{{ t("table") }}</el-dropdown-item>
                <el-dropdown-item command="divider" :icon="IconSeparator">{{ t("divider") }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="editor.isActive('table')" trigger="click" @command="editTable">
            <el-button text size="small">
              {{ t("table") }}
              <icon-chevron-down :size="12" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in tableTools" :key="item.command" :command="item.command">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="toolbarGroup">
          <el-tooltip :content="t('copyMarkdown')" placement="bottom">
            <el-button class="toolButton" text size="small" :disabled="editor.isEmpty" :aria-label="t('copyMarkdown')" @click="copyMarkdown">
              <icon-copy :size="17" />
            </el-button>
          </el-tooltip>
          <el-popover
            v-model:visible="searchVisible"
            trigger="click"
            :width="300"
            placement="bottom-end"
            @show="openSearch"
            @hide="editor.commands.clearSearch()">
            <template #reference>
              <el-button class="toolButton" :class="{ active: searchVisible }" text size="small" :aria-label="t('findInDocument')" :title="t('findInDocument')">
                <icon-search :size="17" />
              </el-button>
            </template>
            <div class="findPanel" @keydown.esc.stop="searchVisible = false">
              <el-input
                ref="searchInput"
                v-model="searchTerm"
                size="small"
                :placeholder="t('findInDocument')"
                :aria-label="t('findInDocument2')"
                clearable
                @input="value => editor!.commands.setSearchTerm(value)"
                @keydown.enter.prevent="editor.commands.goToNextResult()" />
              <div class="findActions">
                <span aria-live="polite">{{ searchStatus }}</span>
                <el-button
                  text
                  size="small"
                  :disabled="!editor.storage.findAndReplace.results.length"
                  :aria-label="t('previousMatch')"
                  @click="editor.commands.goToPreviousResult()">
                  <icon-chevron-up :size="16" />
                </el-button>
                <el-button
                  text
                  size="small"
                  :disabled="!editor.storage.findAndReplace.results.length"
                  :aria-label="t('nextMatch')"
                  @click="editor.commands.goToNextResult()">
                  <icon-chevron-down :size="16" />
                </el-button>
                <el-button text size="small" :aria-label="t('closeFind')" @click="searchVisible = false"><icon-x :size="16" /></el-button>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
      <editor-content class="editorBody" :editor="editor" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { t } from "@/pages/i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from "vue";
import { debounce } from "lodash-es";
import { ElMessage, ElMessageBox, type InputInstance } from "element-plus";
import { Editor, EditorContent, useEditor } from "@tiptap/vue-3";
import type { ChainedCommands, EditorOptions } from "@tiptap/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { uiLocale } from "@/stores/settings";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { writeClipboardText } from "@/lib/clipboard";
import fileTree, { type TreeSelection } from "./components/fileTree.vue";
import markdownExtensions, { serializeMarkdown } from "./markdownExtensions";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconBlockquote,
  IconSourceCode,
  IconLink,
  IconPhoto,
  IconTable,
  IconSeparator,
  IconHeading,
  IconChevronDown,
  IconChevronUp,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCopy,
  IconX,
  IconUnderline,
  IconHighlight,
  IconSuperscript,
  IconSubscript,
  IconSearch,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
} from "@tabler/icons-vue";

type TextOutput = { id: string; label: string; text: string };
const props = defineProps<{
  readNode: (directory: string, canvasPath: string, nodeId: string) => Promise<{ label: string; outputs: TextOutput[] }>;
  saveNode: (directory: string, canvasPath: string, nodeId: string, handleId: string, text: string) => Promise<void>;
}>();
const workspaceStore = useWorkspaceStore();
const selectedNode = ref<TreeSelection>();
const nodeOutputs = ref<TextOutput[]>([]);
const outputId = ref("");
const opening = ref(false);
const dirty = ref(false);
const saveError = shallowRef<Error>();
const selectedPath = computed(() => {
  const selection = selectedNode.value;
  if (!selection) return "";
  return "filePath" in selection ? selection.filePath : selection.canvasPath;
});
let openRequest = 0;
let draft: { directory: string; selection: TreeSelection; handleId: string; text: string } | undefined;
let saving = Promise.resolve();
const saveDocument = debounce((change: NonNullable<typeof draft>) => {
  // ACT: 同一面板顺序落盘；每次保存固定目录、文件或画布节点，不随当前选择漂移。
  saving = saving
    .catch(() => {})
    .then(() => ("filePath" in change.selection
      ? useWorkspaceFiles(change.directory).write(change.selection.filePath, change.text)
      : props.saveNode(change.directory, change.selection.canvasPath, change.selection.nodeId, change.handleId, change.text)))
    .then(() => {
      if (draft === change) {
        dirty.value = false;
        saveError.value = undefined;
      }
    })
    .catch((error) => {
      saveError.value = error instanceof Error ? error : createDisplayError("文本保存失败", () => t("couldNotSaveText"));
      throw error;
    });
  void saving.catch(() => {});
}, 400);
const searchVisible = ref(false);
const searchTerm = ref("");
const searchInput = ref<InputInstance>();
function createEditorProps(): NonNullable<EditorOptions["editorProps"]> {
  return {
    attributes: { role: "textbox", "aria-label": t("markdownDocument"), "aria-multiline": "true" },
    handlePaste: (_view, event) => {
      const clipboard = event.clipboardData;
      const markdown = clipboard?.getData("text/markdown");
      const text = markdown || clipboard?.getData("text/plain");
      if (!text || (!markdown && clipboard?.getData("text/html")) || editor.value?.isActive("codeBlock")) return false;
      return editor.value?.commands.insertContent(text, { contentType: "markdown" }) ?? false;
    },
  };
}
const editorOptions: Partial<EditorOptions> = {
  extensions: markdownExtensions,
  content: "",
  contentType: "markdown",
  onUpdate({ editor }) {
    const directory = workspaceStore.project?.directory;
    if (!directory || !selectedNode.value || opening.value) return;
    const text = serializeMarkdown(editor);
    const output = nodeOutputs.value.find((output) => output.id === outputId.value);
    if (output) output.text = text;
    draft = { directory, selection: selectedNode.value, handleId: outputId.value, text };
    dirty.value = true;
    saveError.value = undefined;
    saveDocument(draft);
  },
};
const editor = useEditor({ ...editorOptions, editorProps: createEditorProps() });
watch(uiLocale, () => {
  const current = editor.value;
  if (current) current.setOptions({ editorProps: { ...current.options.editorProps, attributes: createEditorProps().attributes } });
});

async function flushSave() {
  if (saveError.value && draft) saveDocument(draft);
  saveDocument.flush();
  await saving;
}

function showOutput(id: string) {
  const output = nodeOutputs.value.find((output) => output.id === id);
  if (!output) throw createDisplayError("文本输出不存在", () => t("textOutputNotFound"));
  outputId.value = id;
  searchVisible.value = false;
  draft = undefined;
  dirty.value = false;
  saveError.value = undefined;
  // 每个节点/输出重新建立编辑器，避免撤销跨文档修改。
  editor.value?.destroy();
  editor.value = new Editor({ ...editorOptions, editorProps: createEditorProps(), content: output.text });
}

async function openNode(selection: TreeSelection, reportError = true, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const directory = workspaceStore.project?.directory;
  if (!directory) return;
  const request = ++openRequest;
  opening.value = true;
  editor.value?.setEditable(false, false);
  try {
    await flushSave();
    signal?.throwIfAborted();
    if ("filePath" in selection) {
      const text = await useWorkspaceFiles(directory).readText(selection.filePath);
      signal?.throwIfAborted();
      if (request !== openRequest || directory !== workspaceStore.project?.directory) return;
      selectedNode.value = selection;
      nodeOutputs.value = [{ id: "text", label: selection.label, text }];
      showOutput("text");
      return;
    }
    const document = await props.readNode(directory, selection.canvasPath, selection.nodeId);
    signal?.throwIfAborted();
    if (request !== openRequest || directory !== workspaceStore.project?.directory) return;
    if (!document.outputs.length) throw createDisplayError("节点没有文本输出", () => t("nodeHasNoTextOutput"));
    selectedNode.value = { ...selection, label: document.label };
    nodeOutputs.value = document.outputs;
    showOutput(document.outputs[0]!.id);
  } catch (error) {
    if (!reportError) throw error;
    if (request === openRequest) {
      const fallback = "filePath" in selection ? t("couldNotReadFile") : t("couldNotReadNode");
      ElMessage.error(error instanceof Error ? getErrorDisplay(error) : fallback);
    }
  } finally {
    if (request === openRequest) {
      opening.value = false;
      editor.value?.setEditable(true, false);
    }
  }
}

async function openOutput(id: string, reportError = true, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const request = ++openRequest;
  opening.value = true;
  editor.value?.setEditable(false, false);
  try {
    await flushSave();
    signal?.throwIfAborted();
    if (request === openRequest) showOutput(id);
  } catch (error) {
    if (!reportError) throw error;
    if (request === openRequest) ElMessage.error(error instanceof Error ? getErrorDisplay(error) : t("couldNotSwitchTextOutput"));
  } finally {
    if (request === openRequest) {
      opening.value = false;
      editor.value?.setEditable(true, false);
    }
  }
}

onBeforeUnmount(() => {
  openRequest++;
  saveDocument.cancel();
});
function getDocument(includeText = true) {
  return {
    selection: selectedNode.value ?? null,
    handleId: outputId.value || null,
    dirty: dirty.value,
    saveError: saveError.value?.message || null,
    ...(includeText ? { text: editor.value ? serializeMarkdown(editor.value) : "" } : {}),
  };
}

async function openDocument(args: Record<string, unknown>, signal: AbortSignal) {
  signal.throwIfAborted();
  let selection: TreeSelection;
  if (typeof args.path === "string" && /\.(md|markdown)$/i.test(args.path)) {
    selection = { filePath: args.path, label: args.path.split(/[\\/]/).at(-1)! };
  } else if (typeof args.canvasPath === "string" && typeof args.nodeId === "string") {
    selection = { canvasPath: args.canvasPath, nodeId: args.nodeId, label: args.nodeId };
  } else throw createDisplayError("请指定 Markdown 文件 path，或画布 canvasPath 和 nodeId", () => t("specifyAMarkdownFilePath"));
  await openNode(selection, false, signal);
  signal.throwIfAborted();
  const current = selectedNode.value;
  if (!current || ("filePath" in selection
    ? !("filePath" in current) || current.filePath !== selection.filePath
    : !("canvasPath" in current) || current.canvasPath !== selection.canvasPath || current.nodeId !== selection.nodeId)) {
    throw createDisplayError("文档已切换，请重新读取当前文档", () => t("theDocumentChangedReadThe"));
  }
  if (typeof args.handleId === "string") {
    if (!nodeOutputs.value.some(output => output.id === args.handleId)) throw createDisplayError("文本输出不存在", () => t("textOutputNotFound"));
    await openOutput(args.handleId, false, signal);
    signal.throwIfAborted();
  }
}

async function writeDocument(args: Record<string, unknown>, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!selectedNode.value || !editor.value || opening.value) throw createDisplayError("请先打开需要编辑的文档", () => t("openADocumentToEdit"));
  if (typeof args.text !== "string" || typeof args.expectedText !== "string") throw createDisplayError("需要 text 和读取时的 expectedText", () => t("bothTextAndTheExpectedtext"));
  if (serializeMarkdown(editor.value) !== args.expectedText) throw createDisplayError("文档内容已变化，请重新读取后编辑", () => t("theDocumentChangedReadIt"));
  editor.value.commands.setContent(args.text, { contentType: "markdown" });
  await flushSave();
  signal.throwIfAborted();
}

defineExpose({ flushSave, cancelSave: () => saveDocument.cancel(), getDocument, openDocument, writeDocument });

const headingLevels = [1, 2, 3, 4, 5, 6] as const;
type HeadingLevel = (typeof headingLevels)[number];
const textStyle = computed(() => {
  const level = headingLevels.find((level) => editor.value?.isActive("heading", { level }));
  return level ? t("headingLevel", { level }) : t("body");
});
const searchStatus = computed(() => {
  const search = editor.value?.storage.findAndReplace;
  return search?.results.length ? `${(search.currentIndex ?? 0) + 1} / ${search.results.length}` : "0 / 0";
});
const formatTools = computed(() => [
  { name: "bold", label: t("bold"), icon: IconBold, run: (chain: ChainedCommands) => chain.toggleBold() },
  { name: "italic", label: t("italic"), icon: IconItalic, run: (chain: ChainedCommands) => chain.toggleItalic() },
  { name: "strike", label: t("strikethrough"), icon: IconStrikethrough, run: (chain: ChainedCommands) => chain.toggleStrike() },
  { name: "code", label: t("inlineCode"), icon: IconCode, run: (chain: ChainedCommands) => chain.toggleCode() },
  { name: "underline", label: t("underline"), icon: IconUnderline, run: (chain: ChainedCommands) => chain.toggleUnderline() },
  { name: "highlight", label: t("highlight"), icon: IconHighlight, run: (chain: ChainedCommands) => chain.toggleHighlight() },
]);
const listTools = computed(() => [
  { name: "bulletList", label: t("bulletedList"), icon: IconList, run: (chain: ChainedCommands) => chain.toggleBulletList() },
  { name: "orderedList", label: t("numberedList"), icon: IconListNumbers, run: (chain: ChainedCommands) => chain.toggleOrderedList() },
  { name: "taskList", label: t("taskList"), icon: IconListCheck, run: (chain: ChainedCommands) => chain.toggleTaskList() },
]);
const blockTools = computed(() => [
  { name: "blockquote", label: t("blockquote"), icon: IconBlockquote, run: (chain: ChainedCommands) => chain.toggleBlockquote() },
  { name: "codeBlock", label: t("codeBlock"), icon: IconSourceCode, run: (chain: ChainedCommands) => chain.toggleCodeBlock() },
]);
const scriptTools = computed(() => [
  { name: "superscript", label: t("superscript"), icon: IconSuperscript, run: (chain: ChainedCommands) => chain.unsetSubscript().toggleSuperscript() },
  { name: "subscript", label: t("subscript"), icon: IconSubscript, run: (chain: ChainedCommands) => chain.unsetSuperscript().toggleSubscript() },
]);
const alignmentTools = computed(() => [
  { value: "left", label: t("alignLeft"), icon: IconAlignLeft },
  { value: "center", label: t("alignCenter"), icon: IconAlignCenter },
  { value: "right", label: t("alignRight"), icon: IconAlignRight },
  { value: "justify", label: t("justify"), icon: IconAlignJustified },
]);
const tableTools = computed(() => [
  { command: "addRowAfter", label: t("insertRowBelow") },
  { command: "addColumnAfter", label: t("insertColumnRight") },
  { command: "deleteRow", label: t("deleteRow") },
  { command: "deleteColumn", label: t("deleteColumn") },
  { command: "deleteTable", label: t("deleteTable") },
] as const);

function setTextStyle(level: HeadingLevel | 0) {
  const chain = editor.value?.chain().focus();
  if (level === 0) chain?.setParagraph().run();
  else chain?.setHeading({ level }).run();
}

function editTable(command: (typeof tableTools.value)[number]["command"]) {
  editor.value?.chain().focus()[command]().run();
}

async function openSearch() {
  editor.value?.commands.setSearchTerm(searchTerm.value);
  await nextTick();
  searchInput.value?.focus();
}

async function editLink() {
  const currentEditor = editor.value;
  if (!currentEditor) return;
  try {
    const { value } = await ElMessageBox.prompt(t("enterALinkUrlOr"), t("link"), {
      inputValue: currentEditor.getAttributes("link").href || "",
      inputValidator: (value) => !value?.trim() || /^(https?:\/\/|mailto:)\S+$/i.test(value.trim()) || t("enterAValidHttpsHttp"),
      confirmButtonText: t("confirm"),
      cancelButtonText: t("cancel"),
    });
    if (currentEditor.isDestroyed) return;
    const chain = currentEditor.chain().focus().extendMarkRange("link");
    if (value?.trim()) chain.setLink({ href: value.trim() }).run();
    else chain.unsetLink().run();
  } catch {
    // 关闭弹窗时保留原有内容。
  }
}

async function insertContent(command: "image" | "table" | "divider") {
  const currentEditor = editor.value;
  if (!currentEditor) return;
  if (command === "table") return currentEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  if (command === "divider") return currentEditor.chain().focus().setHorizontalRule().run();
  try {
    const { value } = await ElMessageBox.prompt(t("enterAnImageUrl"), t("insertImage"), {
      inputValidator: (value) => /^https?:\/\/\S+$/i.test(value?.trim() || "") || t("enterAValidHttpsOr"),
      confirmButtonText: t("insert"),
      cancelButtonText: t("cancel"),
    });
    if (!currentEditor.isDestroyed) currentEditor.chain().focus().setImage({ src: value.trim() }).run();
  } catch {
    // 关闭弹窗时保留原有内容。
  }
}

async function copyMarkdown() {
  if (!editor.value) return;
  try {
    await writeClipboardText(serializeMarkdown(editor.value));
    ElMessage.success(t("markdownCopied"));
  } catch {
    ElMessage.error(t("copyFailedCheckClipboardPermissions"));
  }
}

onDeactivated(() => {
  searchVisible.value = false;
  editor.value?.commands.clearSearch();
  editor.value?.commands.blur();
});
</script>

<style scoped lang="scss">
.documentPanel {
  display: grid;
  grid-template-columns: 220px minmax(min-content, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 64px 20px 20px;
  padding-right: calc(20px + var(--agentWidth, 0px));
  overflow: hidden;
  background: var(--el-fill-color-light);

  .editorSurface {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    min-width: min-content;
    max-width: 960px;
    height: 100%;
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius-large, 12px);
    background: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-lighter);

    .documentHeader {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      padding: 8px 16px;
      font-size: 12px;

      .documentName {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .outputSelect {
        width: 160px;
      }
      .saveStatus {
        color: var(--el-text-color-secondary);
      }
    }

    .editorToolbar {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      :deep(.el-button) {
        gap: 4px;
        margin-left: 0;

        > span {
          gap: 4px;
        }
      }

      .toolbarGroup {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 2px;
        padding: 0 7px;

        + .toolbarGroup {
          border-left: 1px solid var(--el-border-color-lighter);
        }
      }

      .toolButton,
      .dropdownButton {
        height: 32px;
        border-radius: 7px;

        &.active {
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }
      }

      .toolButton {
        width: 30px;
        padding: 0;
      }

      .dropdownButton {
        padding: 0 5px;
      }
    }

    .editorBody {
      contain: inline-size;
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 48px clamp(24px, 5vw, 64px) 64px;

      :deep(.tiptap) {
        box-sizing: border-box;
        width: 100%;
        min-height: 100%;
        cursor: text;
        outline: none;
        color: var(--el-text-color-primary);
        font-size: 15px;
        line-height: 1.8;
        overflow-wrap: anywhere;

        > :first-child {
          margin-top: 0;
        }
        p {
          margin: 0.6em 0;
        }
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 1.4em 0 0.5em;
          font-weight: 600;
          line-height: 1.35;
        }
        h1 {
          font-size: 2em;
        }
        h2 {
          font-size: 1.6em;
        }
        h3 {
          font-size: 1.3em;
        }
        h4,
        h5,
        h6 {
          font-size: 1.1em;
        }
        ul,
        ol {
          padding-left: 1.6em;
        }
        li > p {
          margin: 0.2em 0;
        }
        a {
          color: var(--el-color-primary);
          text-decoration: underline;
        }
        mark {
          padding: 1px 2px;
          border-radius: 3px;
          background: var(--el-color-warning-light-7);
          color: inherit;
        }
        blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 3px solid var(--el-border-color);
          color: var(--el-text-color-secondary);
        }
        code {
          padding: 2px 5px;
          border-radius: 4px;
          background: var(--el-fill-color);
          font-family: monospace;
          font-size: 0.9em;
        }
        pre {
          padding: 14px 18px;
          border-radius: 8px;
          background: var(--el-fill-color-light);
          overflow-x: auto;
          code {
            padding: 0;
            background: none;
          }
        }
        hr {
          margin: 1.5em 0;
          border: 0;
          border-top: 1px solid var(--el-border-color);
        }
        img {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .ProseMirror-selectednode {
          outline: 2px solid var(--el-color-primary);
        }
        ul[data-type="taskList"] {
          padding-left: 0;
          list-style: none;
          li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            > label {
              flex: 0 0 auto;
              padding-top: 3px;
              user-select: none;
            }
            > div {
              flex: 1;
              min-width: 0;
            }
            input {
              accent-color: var(--el-color-primary);
              cursor: pointer;
            }
          }
        }
        table {
          width: 100%;
          margin: 1em 0;
          border-collapse: collapse;
          table-layout: fixed;
          td,
          th {
            position: relative;
            min-width: 40px;
            padding: 6px 10px;
            border: 1px solid var(--el-border-color);
            vertical-align: top;
          }
          th {
            background: var(--el-fill-color-light);
            font-weight: 600;
            text-align: left;
          }
          .selectedCell {
            background: var(--el-color-primary-light-9);
          }
        }
      }
    }
  }
}

.findPanel {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .findActions {
    display: flex;
    align-items: center;
    gap: 2px;

    > span {
      flex: 1;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
    :deep(.el-button) {
      margin-left: 0;
      padding: 5px;
    }
  }
}
</style>
