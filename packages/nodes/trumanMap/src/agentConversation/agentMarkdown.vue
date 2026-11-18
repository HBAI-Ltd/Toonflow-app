<template>
  <div class="agentMarkdown" :class="{ streaming }">
    <div class="markdownBody" v-html="html" />
    <span v-if="streaming" class="streamCaret" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps<{ content: string; streaming?: boolean }>();

function sanitize(html: string) {
  if (typeof window === "undefined") return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

// 宿主 messageMarkdown 使用 vue-stream-markdown；插件侧复用脚手架 external 的 marked + DOMPurify，
// 渲染结果保持宿主 Agent 回复的排版，而不是把模型输出当成纯文本。
const html = computed(() => {
  if (!props.content) return "";
  const rendered = marked.parse(props.content, { async: false, breaks: true, gfm: true });
  return sanitize(typeof rendered === "string" ? rendered : "");
});
</script>

<style scoped lang="scss">
.agentMarkdown {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;

  .markdownBody { min-width: 0; }

  :deep(p) { margin: 0 0 8px; }
  :deep(p:last-child) { margin-bottom: 0; }
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) { margin: 12px 0 6px; font-weight: 600; line-height: 1.4; }
  :deep(h1) { font-size: 18px; }
  :deep(h2) { font-size: 16px; }
  :deep(h3) { font-size: 14px; }
  :deep(h4), :deep(h5), :deep(h6) { font-size: 13px; }
  :deep(ul), :deep(ol) { margin: 0 0 8px; padding-left: 20px; }
  :deep(li + li) { margin-top: 2px; }
  :deep(blockquote) { margin: 8px 0; padding: 4px 10px; border-left: 3px solid var(--el-border-color); color: var(--el-text-color-secondary); }
  :deep(code) { padding: 1px 4px; border-radius: 4px; background: var(--el-fill-color-light); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
  :deep(pre) { max-height: 320px; margin: 8px 0; padding: 12px; overflow: auto; border: 1px solid var(--el-border-color-lighter); border-radius: var(--ui-radius); background: var(--el-fill-color-light); }
  :deep(pre code) { padding: 0; background: transparent; white-space: pre; font-size: 12px; line-height: 1.6; }
  :deep(a) { color: var(--el-color-primary); text-decoration: underline; text-underline-offset: 3px; }
  :deep(table) { width: 100%; margin: 8px 0; border-collapse: collapse; font-size: 12px; }
  :deep(th), :deep(td) { padding: 5px 7px; border: 1px solid var(--el-border-color-lighter); text-align: left; vertical-align: top; }
  :deep(th) { background: var(--el-fill-color-light); font-weight: 500; }
  :deep(img) { max-width: 100%; height: auto; border-radius: var(--ui-radius); }
  :deep(hr) { margin: 12px 0; border: 0; border-top: 1px solid var(--el-border-color-lighter); }

  .streamCaret { display: inline-block; width: 2px; height: 13px; margin-left: 2px; border-radius: 1px; background: var(--el-color-primary); vertical-align: -2px; animation: agentCaret 1s steps(2, start) infinite; }
}

@keyframes agentCaret { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .agentMarkdown .streamCaret { animation: none; } }
</style>
