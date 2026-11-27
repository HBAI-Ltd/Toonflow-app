<template>
  <div class="nodeMarkdownPreview">
    <div v-if="error" class="previewError" role="status">{{ error }}</div>
    <div ref="content" class="textNodeMarkdown" @click="openLink" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { loadMarkdownImage, markdownDom, resolveMarkdownPath, type MarkdownProps } from "./markdownContent";

const props = withDefaults(defineProps<MarkdownProps>(), { active: true });
const content = ref<HTMLElement>();
const error = ref("");
let frame: number | undefined;
let releases: (() => void)[] = [];
let displayed: HTMLElement | undefined;
function clearPreview() {
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  releases.forEach(release => release());
  releases = [];
  displayed?.replaceChildren();
  displayed = undefined;
}
watch([content, () => props.modelValue, () => props.path, () => props.files, () => props.active], () => {
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  const element = content.value;
  error.value = "";
  if (!element || !props.active) { clearPreview(); return; }
  frame = requestAnimationFrame(() => {
    frame = undefined;
    if (!props.active || content.value !== element) { clearPreview(); return; }
    const nextReleases: (() => void)[] = [];
    try {
      const dom = markdownDom(props.modelValue);
      for (const checkbox of dom.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) checkbox.disabled = true;
      for (const image of dom.querySelectorAll<HTMLImageElement>("img")) nextReleases.push(loadMarkdownImage(image, image.getAttribute("src") || "", props.path || "", props.files));
      // 新批次先持有图片，再释放旧预览，避免同一路径的共享缓存归零后重取。
      clearPreview();
      element.replaceChildren(...dom.childNodes);
      releases = nextReleases;
      displayed = element;
    } catch (cause) {
      nextReleases.forEach(release => release());
      clearPreview();
      error.value = cause instanceof Error ? cause.message : "Markdown 预览失败";
    }
  });
}, { immediate: true, flush: "post" });
onBeforeUnmount(clearPreview);

async function openLink(event: MouseEvent) {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if (!link) return;
  const source = link.getAttribute("href") || "";
  if (/^(https?:|mailto:|#)/i.test(source)) return;
  event.preventDefault();
  try {
    const path = resolveMarkdownPath(source, props.path);
    if (path && props.openFile) await props.openFile(path);
    else error.value = "请从文件树打开工作区内的链接";
  } catch (cause) { error.value = cause instanceof Error ? cause.message : "无法打开链接"; }
}
</script>

<style lang="scss">
.nodeMarkdownPreview {
  .previewError { color: var(--el-color-danger); font-size: 12px; }
  // 节点默认仅 220px 宽，单元格最小宽度会让多列表格撑出横向滚动；预览里按字符折行。
  .textNodeMarkdown :is(td, th) { min-width: 0; padding: 4px 6px; }
}
.textNodeMarkdown {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  > :first-child { margin-top: 0; }
  > :last-child { margin-bottom: 0; }
  p { margin: 0.55em 0; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.4; margin: 1em 0 0.5em; font-weight: 600; }
  h1 { font-size: 1.8em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
  ul, ol { padding-left: 1.7em; }
  li { margin: 0.2em 0; }
  ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
    > li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      > label { flex-shrink: 0; }
      > div { flex: 1; min-width: 0; > p { margin: 0; } }
    }
  }
  blockquote { margin: 0.75em 0; padding: 0.1em 1em; border-left: 3px solid var(--el-color-primary); color: var(--el-text-color-secondary); }
  pre { padding: 12px; overflow: auto; background: var(--el-fill-color-light); white-space: pre; }
  code { font-family: Consolas, monospace; background: var(--el-fill-color-light); padding: 0.1em 0.25em; }
  pre code { padding: 0; background: transparent; }
  a { color: var(--el-color-primary); text-decoration: underline; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; margin: 0.7em 0; }
  td, th { border: 1px solid var(--el-border-color); padding: 6px 10px; min-width: 40px; vertical-align: top; }
  th { background: var(--el-fill-color-light); }
  mark { background: #fff3a3; color: #363322; }
  hr { border: 0; border-top: 1px solid var(--el-border-color); margin: 1.2em 0; }
  li[data-item-type="task"] { list-style: none; position: relative; }
  li[data-item-type="task"]::before { content: "☐"; position: absolute; left: -1.4em; }
  li[data-item-type="task"][data-checked="true"]::before { content: "☑"; color: var(--el-color-primary); }
  li[data-item-type="task"]:has(> input[type="checkbox"], > label input[type="checkbox"])::before { content: none; }
}
</style>
