<template>
  <div class="messageMarkdown">
    <markdown
      v-for="(chunk, index) in chunks"
      :key="index + '-' + !!definitions"
      v-memo="[chunk, streaming && index === chunks.length - 1, codeOptions]"
      class="markdownChunk"
      :content="chunk"
      :mode="streaming && index === chunks.length - 1 ? 'streaming' : 'static'"
      :enableAnimate="false"
      :shikiOptions="shikiOptions"
      :codeOptions="codeOptions"
      :linkOptions="{ safetyCheck: false }"
      :cdnOptions="cdnOptions"
      :components="markdownOverlays"
      :parseMarkdownIntoBlocks="definitions ? keepChunk : undefined"
      locale="zh-CN" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Markdown, parseMarkdownIntoBlocks } from "vue-stream-markdown";
import { MarkdownAstParser } from "@markmend/ast";
import type { CodeOptions, ShikiOptions } from "vue-stream-markdown";
import "vue-stream-markdown/index.css";
import "vue-stream-markdown/theme.css";
import markdownOverlays from "./markdownOverlays";

const { content, streaming = false, codeOptions } = defineProps<{ content: string; streaming?: boolean; codeOptions?: CodeOptions }>();
const shikiOptions: ShikiOptions = { theme: ["github-light", "github-dark"] };
const cdnOptions = { shiki: false } as const;
const keepChunk = (value: string) => [value];
const blocks = computed(() => parseMarkdownIntoBlocks(content));
const definitionParser = new MarkdownAstParser({ mode: "static" });
const isDefinition = (block: string) => /^ {0,3}\[(?!\^)[^\]\n]+\]:/.test(block)
  && definitionParser.markdownToAst(block).children.every(node => node.type === "definition");
const definitions = computed(() => blocks.value.length > 1 ? blocks.value.filter(isDefinition).join("\n\n") : "");
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
