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
      :linkOptions="{ safetyCheck: false }"
      :cdnOptions="cdnOptions"
      :components="markdownOverlays"
      :nodeRenderers="nodeRenderers"
      :postnormalize="resolveImageReferences"
      :parseMarkdownIntoBlocks="definitions ? keepChunk : undefined"
      :locale="markdownLocale" />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from "vue";
import { Markdown, COMPONENT_RENDERERS, parseMarkdownIntoBlocks } from "vue-stream-markdown";
import { MarkdownAstParser, postnormalize, type DefinitionNode, type ParsedNode, type SyntaxTree } from "@markmend/ast";
import type { CodeOptions, ImageNodeRendererProps, LinkNodeRendererProps, ShikiOptions } from "vue-stream-markdown";
import "vue-stream-markdown/index.css";
import "vue-stream-markdown/theme.css";
import markdownOverlays from "./markdownOverlays";
import markdownImage from "./markdownImage.vue";
import { markdownLocale } from "@/lib/i18n";

const { content, streaming = false, codeOptions, directory } = defineProps<{ content: string; streaming?: boolean; codeOptions?: CodeOptions; directory?: string }>();
const renderImage = (image: ImageNodeRendererProps) => h(markdownImage, { image, directory: directory! });
const nodeRenderers = computed(() => directory ? { image: renderImage, link: renderLink } : {});
const shikiOptions: ShikiOptions = { theme: ["github-light", "github-dark"] };
const cdnOptions = { shiki: false } as const;
const keepChunk = (value: string) => [value];
const blocks = computed(() => parseMarkdownIntoBlocks(content));
const definitionParser = new MarkdownAstParser({ mode: "static" });
const isDefinition = (block: string) => /^ {0,3}\[(?!\^)[^\]\n]+\]:/.test(block)
  && definitionParser.markdownToAst(block).children.every(node => node.type === "definition");
const definitions = computed(() => blocks.value.length > 1 ? blocks.value.filter(isDefinition).join("\n\n") : "");

function renderLink(link: LinkNodeRendererProps) {
  const renderedLink = h(COMPONENT_RENDERERS.link, link);
  let url: URL;
  try { url = new URL(link.node.url.startsWith("//") ? `https:${link.node.url}` : link.node.url); }
  catch { return renderedLink; }
  // ACT: 只预览带图片后缀的纯文字链接；普通网页和已含缩略图的链接保持原样。
  if (!/^https?:$/.test(url.protocol) || !/\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(url.pathname)
    || !link.node.children.every(node => node.type === "text")) return renderedLink;
  return h("span", { class: "imageLink" }, [renderedLink, h("br"), renderImage({
    ...link, nodeKey: `${link.nodeKey}:image`,
    node: { type: "image", url: url.href, alt: "网络图片", loading: link.markdownParser.hasLoadingNode([link.node]) },
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
  }
}
</style>
