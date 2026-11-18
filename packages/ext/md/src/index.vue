<template>
  <section class="markdownEditor" :aria-label="translate('文档编辑')" @keydown="handleShortcut" @paste.capture="pasteImages" @dragover="dragImages" @drop.capture="dropImages">
    <div class="editorSurface" :inert="context.loading">
      <div class="modeToolbar" role="group" :aria-label="translate('编辑模式')">
        <el-button text size="small" :type="mode === 'rich' ? 'primary' : undefined" :aria-pressed="mode === 'rich'" @click="setMode('rich')">{{ translate("富文本") }}</el-button>
        <el-button text size="small" :type="mode === 'source' ? 'primary' : undefined" :aria-pressed="mode === 'source'" @click="setMode('source')">{{ translate("原文") }}</el-button>
        <span v-if="context.files" class="attachmentStatus" aria-live="polite">{{ importing ? translate("正在导入图片…") : translate("粘贴截图或拖入图片") }}</span>
      </div>
      <p v-if="largeDocument" class="largeDocumentNotice" role="status">{{ translate("超过 50,000 字符或 1,000 行的文档默认使用原文；可手动开启富文本，加载和编辑可能较慢。") }}</p>
      <div v-if="editor && mode === 'rich'" class="editorToolbar" role="group" :aria-label="translate('文档格式')">
        <div class="toolbarGroup">
          <el-button
            class="toolButton"
            text
            size="small"
            :disabled="!editor.can().undo()"
            :aria-label="translate('撤销')"
            :title="translate('撤销')"
            @mousedown.prevent
            @click="editor.chain().focus().undo().run()">
            <icon-arrow-back-up :size="17" />
          </el-button>
          <el-button
            class="toolButton"
            text
            size="small"
            :disabled="!editor.can().redo()"
            :aria-label="translate('重做')"
            :title="translate('重做')"
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
              :aria-label="translate('段落样式')"
              :title="textStyle">
              <icon-heading :size="17" />
              <icon-chevron-down class="menuChevron" :size="12" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="0">{{ translate("正文") }}</el-dropdown-item>
                <el-dropdown-item v-for="level in headingLevels" :key="level" :command="level">{{ translate("标题 {0}", { 0: (level) }) }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="(index: number) => listTools[index]?.run(editor!.chain().focus()).run()">
            <el-button
              class="dropdownButton"
              :class="{ active: listTools.some(item => editor!.isActive(item.name)) }"
              text
              size="small"
              :aria-label="translate('列表')"
              :title="translate('列表')">
              <icon-list :size="17" />
              <icon-chevron-down class="menuChevron" :size="12" />
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
          <el-tooltip :content="translate('链接')" placement="bottom">
            <el-button
              class="toolButton"
              :class="{ active: editor.isActive('link') }"
              text
              size="small"
              :aria-label="translate('链接')"
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
            <el-button text size="small" :aria-label="translate('插入内容')">
              <icon-photo :size="17" />
              {{ translate("添加") }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="image" :icon="IconPhoto">{{ translate("图片链接") }}</el-dropdown-item>
                <el-dropdown-item command="table" :icon="IconTable">{{ translate("表格") }}</el-dropdown-item>
                <el-dropdown-item command="divider" :icon="IconSeparator">{{ translate("分隔线") }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="editor.isActive('table')" trigger="click" @command="editTable">
            <el-button text size="small">
              {{ translate("表格") }}
              <icon-chevron-down class="menuChevron" :size="12" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in tableTools" :key="item.command" :command="item.command">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="toolbarGroup">
          <el-tooltip :content="translate('复制 Markdown')" placement="bottom">
            <el-button class="toolButton" text size="small" :disabled="editor.isEmpty" :aria-label="translate('复制 Markdown')" @click="copyMarkdown">
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
              <el-button class="toolButton" :class="{ active: searchVisible }" text size="small" :aria-label="translate('查找正文')" :title="translate('查找正文')">
                <icon-search :size="17" />
              </el-button>
            </template>
            <div class="findPanel" @keydown.esc.stop="searchVisible = false">
              <el-input
                ref="searchInput"
                v-model="searchTerm"
                size="small"
                :placeholder="translate('查找正文')"
                :aria-label="translate('查找正文内容')"
                clearable
                @input="value => editor!.commands.setSearchTerm(value)"
                @keydown.enter.prevent="editor.commands.goToNextResult()" />
              <div class="findActions">
                <span aria-live="polite">{{ searchStatus }}</span>
                <el-button
                  text
                  size="small"
                  :disabled="!editor.storage.findAndReplace.results.length"
                  :aria-label="translate('上一个匹配')"
                  @click="editor.commands.goToPreviousResult()">
                  <icon-chevron-up :size="16" />
                </el-button>
                <el-button
                  text
                  size="small"
                  :disabled="!editor.storage.findAndReplace.results.length"
                  :aria-label="translate('下一个匹配')"
                  @click="editor.commands.goToNextResult()">
                  <icon-chevron-down :size="16" />
                </el-button>
                <el-button text size="small" :aria-label="translate('关闭查找')" @click="searchVisible = false"><icon-x :size="16" /></el-button>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
      <editor-content v-show="mode === 'rich'" class="editorBody" :editor="editor" />
      <textarea v-if="mode === 'source'" ref="sourceInput" class="sourceEditor" wrap="off" :value="context.text" :disabled="context.loading" :spellcheck="false" :aria-label="translate('Markdown 原文')" @input="updateSource" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { computed, nextTick, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch } from "vue";
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElInput, ElMessage, ElMessageBox, ElPopover, ElTooltip, type InputInstance } from "element-plus";
import { Editor, EditorContent } from "@tiptap/vue-3";
import type { ChainedCommands, EditorOptions } from "@tiptap/core";
import type { MarkdownEditorContext } from "./index";
import markdownExtensions, { parseMarkdownContent, resolveDocumentPath, serializeBlocks } from "./markdownExtensions";
import { captureSourceBlocks, joinSourceBlocks, mergeSourceBlocks, type SourceBlocks } from "./markdownContent";
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

const props = defineProps<{ context: MarkdownEditorContext; preserveFrontmatter?: boolean }>();
// 技能头部只在原文中编辑，连同正文前的空行原样保留。
const frontmatter = computed(() => {
  if (!props.preserveFrontmatter) return "";
  return props.context.text.match(/^\uFEFF?---(?=[\r\n])[\s\S]*?[\r\n]---(?:[\r\n]+|$)/)?.[0] ?? "";
});
let displayedBody = "";
// 富文本只改写变化的块，其余块保留原文，避免改一处就重排整篇文件。
let sourceBlocks: SourceBlocks | undefined;
const largeDocument = computed(() => props.context.text.length > 50_000 || props.context.text.split("\n").length > 1_000);
const mode = ref<"rich" | "source">(largeDocument.value ? "source" : "rich");
const mounted = ref(false);
const editor = shallowRef<Editor>();
let richRequested = false;
const sourceInput = ref<HTMLTextAreaElement>();
const importing = ref(0);
const lifetime = new AbortController();
let imageQueue = Promise.resolve();
const searchVisible = ref(false);
const searchTerm = ref("");
const searchInput = ref<InputInstance>();
const editorOptions: Partial<EditorOptions> = {
  extensions: markdownExtensions(props.context),
  contentType: "html",
  editable: !props.context.loading,
  onUpdate({ editor: currentEditor }) {
    if (!editor.value || !props.context.active || props.context.loading || mode.value !== "rich") return;
    const prefix = frontmatter.value;
    const keys = serializeBlocks(currentEditor);
    sourceBlocks = sourceBlocks && mergeSourceBlocks(sourceBlocks, keys);
    const markdown = sourceBlocks ? joinSourceBlocks(sourceBlocks) : keys.join("\n\n");
    const body = markdown.replace(/\n+$/, "");
    // 序列化与原文块均按 LF 拼接；写回时沿用原文的换行符和结尾换行数。
    const eol = props.context.text.includes("\r\n") ? "\r\n" : "\n";
    const ending = (props.context.text.slice(prefix.length) || markdown).match(/(?:\r?\n)*$/)![0].replace(/\r/g, "").length;
    displayedBody = body && body.replace(/\r?\n/g, eol) + eol.repeat(ending);
    // 只有头部且末尾没有换行的文档，首次写正文时沿用头部的换行符。
    const separator = prefix.endsWith("---") && displayedBody ? prefix.match(/\r\n?|\n/)![0] : "";
    props.context.updateText(prefix + separator + displayedBody);
  },
  editorProps: {
    attributes: { role: "textbox", get "aria-label"() { return translate("Markdown 文档"); }, "aria-multiline": "true" },
    transformPastedHTML: html => parseMarkdownContent(html),
    handlePaste: (_view, event) => {
      const clipboard = event.clipboardData;
      const markdown = clipboard?.getData("text/markdown");
      const text = markdown || clipboard?.getData("text/plain");
      if (!text || (!markdown && clipboard?.getData("text/html")) || editor.value?.isActive("codeBlock")) return false;
      return editor.value?.commands.insertContent(parseMarkdownContent(text), { contentType: "html" }) ?? false;
    },
    handleClick: (_view, _position, event) => {
      if (!(event.ctrlKey || event.metaKey) || event.button !== 0 || !(event.target instanceof Element)) return false;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return false;
      try {
        const path = resolveDocumentPath(link.getAttribute("href") || "", props.context.resource.path);
        if (!path) return false;
        event.preventDefault();
        void props.context.openFile(path).catch(error => ElMessage.error(error instanceof Error ? error.message : translate("无法打开文档链接")));
      } catch (error) { event.preventDefault(); ElMessage.error(error instanceof Error ? error.message : translate("文档链接无效")); }
      return true;
    },
  },
};
onMounted(() => { mounted.value = true; });
watch([() => props.context.text, () => props.context.active, () => props.context.loading, mode, mounted, frontmatter], ([text, active, loading, currentMode, ready, prefix]) => {
  if (largeDocument.value && !richRequested) mode.value = currentMode = "source";
  const editable = active && !loading && currentMode === "rich";
  if (editor.value && editor.value.isEditable !== editable) editor.value.setEditable(editable, false);
  if (!ready || !active || loading || currentMode !== "rich") return;
  const body = text.slice(prefix.length);
  // ACT: 可见富文本仍同步解析完整正文，确保输入前没有陈旧副本；大文档默认原文，手动开启富文本仍有全文解析成本。
  if (!editor.value || displayedBody !== body) {
    if (editor.value) editor.value.commands.setContent(parseMarkdownContent(body), { contentType: "html", emitUpdate: false });
    else editor.value = new Editor({ ...editorOptions, content: parseMarkdownContent(body) });
    sourceBlocks = captureSourceBlocks(body, serializeBlocks(editor.value));
  }
  displayedBody = body;
}, { flush: "post" });

function updateSource(event: Event) { props.context.updateText((event.target as HTMLTextAreaElement).value); }
function setMode(value: "rich" | "source") {
  if (value === "rich") richRequested = true;
  searchVisible.value = false;
  editor.value?.commands.clearSearch();
  // Tiptap 的 blur 命令会在下一帧清除全局选区，不能让它覆盖原文视图刚设置的定位。
  editor.value?.view.dom.blur();
  // 模式切换仅读取当前正文，不触发富文本序列化，保留原文的空白和自定义语法。
  mode.value = value;
}
function handleShortcut(event: KeyboardEvent) {
  if (mode.value === "rich" && (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "f") {
    event.preventDefault(); event.stopPropagation(); searchVisible.value = true;
  }
}

function imageFiles(transfer: DataTransfer | null) {
  return Array.from(transfer?.files ?? []).filter(file => file.type.startsWith("image/") || (!file.type && /\.(png|jpe?g|webp|gif|bmp|svg|avif|ico)$/i.test(file.name)));
}
function pasteImages(event: ClipboardEvent) {
  const files = imageFiles(event.clipboardData);
  if (!files.length) return;
  event.preventDefault(); event.stopPropagation();
  queueImages(files);
}
function dragImages(event: DragEvent) {
  if (!event.dataTransfer || !Array.from(event.dataTransfer.types).includes("Files")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = !props.context.files || props.context.loading ? "none" : "copy";
}
function dropImages(event: DragEvent) {
  if (!event.dataTransfer?.files.length) return;
  event.preventDefault(); event.stopPropagation();
  if (!props.context.files) return;
  const files = imageFiles(event.dataTransfer);
  if (files.length) queueImages(files);
  else ElMessage.warning(translate("请拖入图片文件"));
}
function queueImages(files: File[]) {
  const workspaceFiles = props.context.files;
  if (!workspaceFiles || !props.context.active || props.context.loading || lifetime.signal.aborted) return;
  importing.value += files.length;
  imageQueue = imageQueue.then(async () => {
    let completed = 0;
    try {
      if (props.context.loading) throw new Error(translate("文档正在加载或关闭，请稍后重试"));
      for (const directory of ["assets", "assets/documentAttachments"]) {
        lifetime.signal.throwIfAborted();
        await workspaceFiles.mkdir(directory).catch(async error => {
          if ((error as { response?: { status?: number } }).response?.status !== 409) throw error;
          await workspaceFiles.list(directory);
        });
      }
      for (const file of files) {
        lifetime.signal.throwIfAborted();
        const mimeSuffix: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/bmp": "bmp", "image/svg+xml": "svg", "image/avif": "avif", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" };
        const suffix = mimeSuffix[file.type] ?? file.name.split(".").at(-1)?.toLowerCase();
        if (!suffix || !/^(png|jpe?g|webp|gif|bmp|svg|avif|ico)$/.test(suffix)) throw new Error(translate("暂不支持这种图片格式"));
        const path = `assets/documentAttachments/${crypto.randomUUID()}.${suffix}`;
        await workspaceFiles.write(path, file, true, lifetime.signal);
        lifetime.signal.throwIfAborted();
        await nextTick();
        lifetime.signal.throwIfAborted();
        if (props.context.loading) throw new Error(translate("文档正在加载或关闭，图片已保存至 {0}", { 0: path }));
        if (!props.context.active) throw new Error(translate("文档当前不可见，图片已保存至 {0}", { 0: path }));
        const from = props.context.resource.path.replaceAll("\\", "/").split("/").slice(0, -1);
        const to = path.split("/");
        while (from.length && to.length && from[0] === to[0]) { from.shift(); to.shift(); }
        const src = "../".repeat(from.length) + to.join("/");
        // ACT: 使用完成时的正文和光标保留并发输入；关闭后保留已落盘附件，不自动清理可能被其他文档引用的文件。
        if (mode.value === "source") {
          const input = sourceInput.value;
          if (!input) throw new Error(translate("原文编辑器尚未就绪"));
          const start = input.selectionStart;
          const end = input.selectionEnd;
          const text = `![](${src})`;
          // textarea 将 CRLF 规范为 LF，光标偏移必须对应当前控件的原文。
          props.context.updateText(input.value.slice(0, start) + text + input.value.slice(end));
          await nextTick();
          input.setSelectionRange(start + text.length, start + text.length);
        } else if (!editor.value || editor.value.isDestroyed || !editor.value.commands.setImage({ src })) {
          throw new Error(translate("图片已保存，无法插入当前文档：{0}", { 0: path }));
        }
        completed++;
      }
    } catch (error) {
      if (!lifetime.signal.aborted) ElMessage.error(translate("已导入 {0}/{1} 张图片：{2}", { 0: completed, 1: files.length, 2: error instanceof Error ? error.message : translate("图片导入失败") }));
    } finally { importing.value -= files.length; }
  });
}

watch(() => props.context.location, async location => {
  if (!location) return;
  setMode("source");
  await nextTick();
  if (lifetime.signal.aborted || props.context.location !== location || !sourceInput.value) return;
  const lines = sourceInput.value.value.split("\n");
  const line = Math.min(Math.max(0, location.line - 1), lines.length - 1);
  const start = lines.slice(0, line).reduce((length, text) => length + text.length + 1, 0) + Math.min(Math.max(0, location.column - 1), lines[line]!.length);
  sourceInput.value.focus();
  sourceInput.value.setSelectionRange(start, Math.min(sourceInput.value.value.length, start + location.query.length));
  sourceInput.value.scrollTop = Math.max(0, line * 24 - sourceInput.value.clientHeight / 2);
}, { immediate: true });

const headingLevels = [1, 2, 3, 4, 5, 6] as const;
type HeadingLevel = (typeof headingLevels)[number];
const textStyle = computed(() => {
  const level = headingLevels.find((level) => editor.value?.isActive("heading", { level }));
  return level ? translate("标题 {0}", { 0: level }) : translate("正文");
});
const searchStatus = computed(() => {
  const search = editor.value?.storage.findAndReplace;
  return search?.results.length ? `${(search.currentIndex ?? 0) + 1} / ${search.results.length}` : "0 / 0";
});
const formatTools = [
  { name: "bold", get label() { return translate("加粗"); }, icon: IconBold, run: (chain: ChainedCommands) => chain.toggleBold() },
  { name: "italic", get label() { return translate("斜体"); }, icon: IconItalic, run: (chain: ChainedCommands) => chain.toggleItalic() },
  { name: "strike", get label() { return translate("删除线"); }, icon: IconStrikethrough, run: (chain: ChainedCommands) => chain.toggleStrike() },
  { name: "code", get label() { return translate("行内代码"); }, icon: IconCode, run: (chain: ChainedCommands) => chain.toggleCode() },
  { name: "underline", get label() { return translate("下划线"); }, icon: IconUnderline, run: (chain: ChainedCommands) => chain.toggleUnderline() },
  { name: "highlight", get label() { return translate("高亮"); }, icon: IconHighlight, run: (chain: ChainedCommands) => chain.toggleHighlight() },
];
const listTools = [
  { name: "bulletList", get label() { return translate("无序列表"); }, icon: IconList, run: (chain: ChainedCommands) => chain.toggleBulletList() },
  { name: "orderedList", get label() { return translate("有序列表"); }, icon: IconListNumbers, run: (chain: ChainedCommands) => chain.toggleOrderedList() },
  { name: "taskList", get label() { return translate("任务列表"); }, icon: IconListCheck, run: (chain: ChainedCommands) => chain.toggleTaskList() },
];
const blockTools = [
  { name: "blockquote", get label() { return translate("引用"); }, icon: IconBlockquote, run: (chain: ChainedCommands) => chain.toggleBlockquote() },
  { name: "codeBlock", get label() { return translate("代码块"); }, icon: IconSourceCode, run: (chain: ChainedCommands) => chain.toggleCodeBlock() },
];
const scriptTools = [
  { name: "superscript", get label() { return translate("上标"); }, icon: IconSuperscript, run: (chain: ChainedCommands) => chain.unsetSubscript().toggleSuperscript() },
  { name: "subscript", get label() { return translate("下标"); }, icon: IconSubscript, run: (chain: ChainedCommands) => chain.unsetSuperscript().toggleSubscript() },
];
const alignmentTools = [
  { value: "left", get label() { return translate("左对齐"); }, icon: IconAlignLeft },
  { value: "center", get label() { return translate("居中对齐"); }, icon: IconAlignCenter },
  { value: "right", get label() { return translate("右对齐"); }, icon: IconAlignRight },
  { value: "justify", get label() { return translate("两端对齐"); }, icon: IconAlignJustified },
];
const tableTools = [
  { command: "addRowAfter", get label() { return translate("在下方插入行"); } },
  { command: "addColumnAfter", get label() { return translate("在右侧插入列"); } },
  { command: "deleteRow", get label() { return translate("删除当前行"); } },
  { command: "deleteColumn", get label() { return translate("删除当前列"); } },
  { command: "deleteTable", get label() { return translate("删除表格"); } },
] as const;

function setTextStyle(level: HeadingLevel | 0) {
  const chain = editor.value?.chain().focus();
  if (level === 0) chain?.setParagraph().run();
  else chain?.setHeading({ level }).run();
}

function editTable(command: (typeof tableTools)[number]["command"]) {
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
    const { value } = await ElMessageBox.prompt(translate("输入链接地址，留空可移除链接"), translate("链接"), {
      inputValue: currentEditor.getAttributes("link").href || "",
      inputValidator: (value) => {
        if (!value?.trim() || /^(https?:\/\/|mailto:)\S+$/i.test(value.trim())) return true;
        try { if (resolveDocumentPath(value.trim(), props.context.resource.path)) return true; } catch { /* 表单保留输入供修正。 */ }
        return translate("请输入网址或工作区内的相对文件路径");
      },
      get confirmButtonText() { return translate("确定"); },
      get cancelButtonText() { return translate("取消"); },
    });
    if (currentEditor.isDestroyed || !props.context.active || mode.value !== "rich") return;
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
    const { value } = await ElMessageBox.prompt(translate("输入图片地址"), translate("插入图片"), {
      inputValidator: (value) => !!value?.trim() && !/^(?!(?:https?):)[a-z][a-z\d+.-]*:/i.test(value.trim()) || translate("请输入图片网址或工作区内的相对路径"),
      get confirmButtonText() { return translate("插入"); },
      get cancelButtonText() { return translate("取消"); },
    });
    if (!currentEditor.isDestroyed && props.context.active && mode.value === "rich") currentEditor.chain().focus().setImage({ src: value.trim() }).run();
  } catch {
    // 关闭弹窗时保留原有内容。
  }
}

async function copyMarkdown() {
  if (!editor.value) return;
  try {
    await props.context.writeClipboardText(props.context.text);
    ElMessage.success(translate("已复制 Markdown"));
  } catch {
    ElMessage.error(translate("复制失败，请检查剪贴板权限"));
  }
}

onDeactivated(() => {
  searchVisible.value = false;
  editor.value?.commands.clearSearch();
  editor.value?.view.dom.blur();
});
onBeforeUnmount(() => { lifetime.abort(new Error("编辑器已关闭")); editor.value?.destroy(); });
</script>

<style scoped lang="scss">
.markdownEditor {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;

  .editorSurface {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    background: var(--el-bg-color-overlay);

    .largeDocumentNotice {
      flex-shrink: 0;
      margin: 0;
      padding: 7px 12px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      font-size: 12px;
      line-height: 1.5;
    }

    .modeToolbar {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 4px;
      min-height: 36px;
      padding: 2px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      :deep(.el-button) { margin-left: 0; }

      .attachmentStatus {
        margin-left: auto;
        overflow: hidden;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    .sourceEditor {
      flex: 1;
      box-sizing: border-box;
      min-width: 0;
      min-height: 0;
      width: 100%;
      padding: 16px 20px;
      border: 0;
      outline: none;
      resize: none;
      overflow: auto;
      background: transparent;
      color: var(--el-text-color-primary);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 14px;
      line-height: 24px;
      tab-size: 2;
    }

    .editorToolbar {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      flex-wrap: wrap;
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

        [aria-expanded="true"] .menuChevron {
          transform: rotate(180deg);
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
      padding: 32px clamp(24px, 5vw, 64px) 48px;

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
