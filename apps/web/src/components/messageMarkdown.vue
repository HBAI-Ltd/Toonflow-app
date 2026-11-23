<template>
  <div class="messageMarkdown">
    <markdown
      v-for="(chunk, index) in chunks"
      :key="index + '-' + !!definitions"
      v-memo="[chunk, streaming && index === chunks.length - 1, codeOptions, directory, markdownLocale]"
      class="markdownChunk"
      :content="chunk"
      :mode="streaming && index === chunks.length - 1 ? 'streaming' : 'static'"
      :enableAnimate="false"
      :shikiOptions="shikiOptions"
      :codeOptions="codeOptions"
      :cdnOptions="cdnOptions"
      :components="markdownOverlays"
      :nodeRenderers="nodeRenderers"
      :postnormalize="resolveImageReferences"
      :parseMarkdownIntoBlocks="definitions ? keepChunk : undefined"
      :locale="markdownLocale" />
    <el-dialog v-model="fileVisible" :title="filePath.split('/').at(-1)" width="min(800px, 90vw)" alignCenter appendToBody destroyOnClose>
      <p v-if="fileError" role="alert">{{ fileError }}</p>
      <p v-else-if="fileLoading" role="status">正在读取文件…</p>
      <video v-if="fileUrl && fileKind === 'video'" :src="fileUrl" controls autoplay playsinline style="width: 100%; max-height: 65vh" />
      <audio v-if="fileUrl && fileKind === 'audio'" :src="fileUrl" controls autoplay style="width: 100%" />
      <el-button @click="revealFile">打开所在文件夹</el-button>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { Markdown, NodeList, parseMarkdownIntoBlocks, useSanitizers } from "vue-stream-markdown";
import { MarkdownAstParser, postnormalize, type DefinitionNode, type ParsedNode, type SyntaxTree } from "@markmend/ast";
import type { CodeOptions, ImageNodeRendererProps, LinkNodeRendererProps, ShikiOptions } from "vue-stream-markdown";
import "vue-stream-markdown/index.css";
import "vue-stream-markdown/theme.css";
import markdownOverlays from "./markdownOverlays";
import markdownImage from "./markdownImage.vue";
import { markdownLocale } from "@/lib/i18n";
import useWorkspaceFiles from "@/lib/workspaceFiles";

const { content, streaming = false, codeOptions, directory } = defineProps<{ content: string; streaming?: boolean; codeOptions?: CodeOptions; directory?: string }>();
const renderImage = (image: ImageNodeRendererProps) => h(markdownImage, { image: { ...image }, directory: directory! });
const nodeRenderers = computed(() => ({ link: renderLink, ...(directory ? { image: renderImage } : {}) }));
const shikiOptions: ShikiOptions = { theme: ["github-light", "github-dark"] };
const cdnOptions = { shiki: false } as const;
const { transformHardenUrl } = useSanitizers({});
const keepChunk = (value: string) => [value];
const blocks = computed(() => parseMarkdownIntoBlocks(content));
const definitionParser = new MarkdownAstParser({ mode: "static" });
const isDefinition = (block: string) => /^ {0,3}\[(?!\^)[^\]\n]+\]:/.test(block)
  && definitionParser.markdownToAst(block).children.every(node => node.type === "definition");
const definitions = computed(() => blocks.value.length > 1 ? blocks.value.filter(isDefinition).join("\n\n") : "");
const fileVisible = ref(false), filePath = ref(""), fileUrl = ref(""), fileError = ref(""), fileLoading = ref(false);
const fileKind = computed(() => /\.(mp4|webm|mov|m4v)$/i.test(filePath.value) ? "video" : /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(filePath.value) ? "audio" : "file");
let fileDirectory = "";
watch(fileVisible, (visible, _previous, onCleanup) => {
  if (!visible || fileKind.value === "file") return;
  let active = true;
  const file = useWorkspaceFiles(fileDirectory).acquireUrl(filePath.value);
  fileLoading.value = true;
  onCleanup(() => { active = false; file.release(); fileUrl.value = ""; });
  void file.url.then(url => { if (active) fileUrl.value = url; }).catch(() => { if (active) fileError.value = "无法读取文件，请检查文件是否存在。"; }).finally(() => { if (active) fileLoading.value = false; });
});
async function revealFile() {
  try { await useWorkspaceFiles(fileDirectory).reveal(filePath.value); }
  catch { fileError.value = "无法打开所在文件夹，请检查文件是否存在及是否使用本机桌面版。"; }
}
function openFileLink(event: MouseEvent, href: string) {
  if (!directory || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || /^(?:[a-z][a-z\d+.-]*:|[\\/]|#|\?)/i.test(href)) return;
  let path: string;
  try { path = decodeURIComponent(href.split(/[?#]/, 1)[0]!); } catch { return; }
  if (!path || path.includes("\\") || path.includes("\0") || path.split("/").includes("..") || !/\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a|flac|aac|opus|png|jpe?g|webp|gif|bmp|pdf|txt|md|json|srt|zip)$/i.test(path)) return;
  event.preventDefault();
  fileDirectory = directory; filePath.value = path; fileError.value = ""; fileVisible.value = true;
}

function renderLink(link: LinkNodeRendererProps) {
  // ACT: 解析器会把端口后紧跟的全角括号说明并入网址；仅修正端口尾部，保留路径中的括号。
  const href = link.node.url.replace(/^(https?:\/\/[^/?#（）]+:\d+)（[^（）]*）$/i, "$1");
  const allowed = transformHardenUrl(href) !== null;
  const loading = streaming && link.markdownParser.hasLoadingNode([link.node]);
  // ACT: 只复用协议过滤，保留相对链接地址；正常链接仍直接交给浏览器打开。
  const renderedLink = h("a", {
    class: "messageLink", href: loading || !allowed ? undefined : href, title: link.node.title, onClick: (event: MouseEvent) => openFileLink(event, href),
    target: "_blank", rel: "noreferrer", "data-stream-markdown": "link", "data-stream-markdown-loading": loading,
  }, h(NodeList, { ...link, parentNode: link.node, nodes: link.node.children, deep: link.deep + 1 }));
  if (!directory || !allowed) return renderedLink;
  let url: URL;
  try { url = new URL(href.startsWith("//") ? `https:${href}` : href); }
  catch { return renderedLink; }
  // ACT: 只预览带图片后缀的纯文字链接；普通网页和已含缩略图的链接保持原样。
  if (!/^https?:$/.test(url.protocol) || !/\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(url.pathname)
    || !link.node.children.every(node => node.type === "text")) return renderedLink;
  return h("span", { class: "imageLink" }, [renderedLink, h("br"), renderImage({
    ...link, nodeKey: `${link.nodeKey}:image`,
    node: { type: "image", url: url.href, alt: translate("网络图片"), loading: link.markdownParser.hasLoadingNode([link.node]) },
  })]);
}

function resolveImageReferences(tree: SyntaxTree) {
  const imageDefinitions = new Map<string, DefinitionNode>();
  function collect(nodes: ParsedNode[]) {
    for (const node of nodes) {
      if (node.type === "definition" && !imageDefinitions.has(node.identifier)) imageDefinitions.set(node.identifier, node);
      if ("children" in node) collect(node.children);
    }
  }
  function resolve(nodes: ParsedNode[]) {
    for (const [index, node] of nodes.entries()) {
      if (node.type === "imageReference") {
        const definition = imageDefinitions.get(node.identifier);
        if (definition) nodes[index] = { type: "image", alt: node.alt, title: definition.title, url: definition.url, loading: node.loading || definition.loading };
      }
      if ("children" in node) resolve(node.children);
    }
  }
  collect(tree.children);
  tree = postnormalize(tree);
  resolve(tree.children);
  return tree;
}

const chunks = computed(() => {
  if (blocks.value.length < 2) return blocks.value;
  const groups: string[] = [];
  let current = "";
  // ACT: 不拆语法块，稳定组不重渲染；单个语法块仍完整交给库处理。
  for (const block of blocks.value) {
    if (isDefinition(block)) continue;
    if (current && current.length + block.length > 8192) {
      groups.push(current);
      current = "";
    }
    current += block;
  }
  if (current) groups.push(current);
  // 定义放在组前，避免落入末尾尚未闭合的代码块。
  return definitions.value ? groups.map(group => `${definitions.value}\n\n${group}`) : groups;
});
</script>

<style scoped lang="scss">
.messageMarkdown {
  min-width: 0;

  .markdownChunk {
    --background: var(--el-bg-color);
    --foreground: var(--el-text-color-primary);
    --muted: var(--el-fill-color-light);
    --muted-foreground: var(--el-text-color-secondary);
    --border: var(--el-border-color-lighter);
    --primary: var(--el-color-primary);
    font-size: inherit;
    line-height: inherit;

    & + .markdownChunk {
      margin-top: 12px;
    }

    :deep([data-stream-markdown="code-block-header"]) {
      position: relative;
    }

    :deep(.messageLink) {
      color: var(--el-color-primary);
      text-decoration: underline;
      overflow-wrap: anywhere;

      &[data-stream-markdown-loading="true"] {
        text-decoration: none;
        pointer-events: none;
      }
    }
  }
}
</style>
