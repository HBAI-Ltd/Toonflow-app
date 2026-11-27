<template>
  <span ref="element" class="mediaChoicePreview" :class="{ active, textPreview: kind === 'text' }" :title="readError || previewError || undefined">
    <img v-if="kind === 'image' && showMedia" :src="src" alt="" draggable="false" @error="mediaError" />
    <video v-else-if="kind === 'video' && showMedia" :src="src" :controls="active" :muted="!active" playsinline
      :preload="active ? 'metadata' : 'auto'" :aria-label="active ? name || translate('视频') : undefined" :aria-hidden="!active"
      @canplay="playWhenReady" @error="mediaError" />
    <audio v-else-if="kind === 'audio' && active && showMedia" :src="src" controls preload="metadata"
      :aria-label="name || translate('音频')" @canplay="playWhenReady" @error="mediaError" />
    <span v-else-if="kind === 'text' && excerpt" class="excerpt" dir="auto">{{ excerpt }}</span>
    <span v-else class="fileMark" aria-hidden="true"><component :is="icon" :size="22" stroke="1.6" /><small v-if="extension">{{ extension }}</small></span>
  </span>
</template>

<script lang="ts">
// ACT: 工作区视频可能只有原片。分页和可见性筛选后，最多同时读取两份，画布已打开的文件共用宿主 URL。
const previewLanes = [Promise.resolve(), Promise.resolve()];
function queueRead(read: () => Promise<void>) {
  const task = previewLanes.shift()!.then(read);
  previewLanes.push(task.catch(() => {}));
  return task;
}
</script>

<script setup lang="ts">
import { computed, inject, onMounted, onScopeDispose, ref, watch } from "vue";
import { IconFile, IconFileText, IconMusic, IconPhoto, IconVideo } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/values";
import { useNodeFiles, type WorkspaceFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import { useMediaPreview } from "../mediaPreview";
import { getMediaMimeType } from "../mediaTypes";

const props = defineProps<{ file?: File; media?: NodeMediaValue; previewUrl?: string; text?: string; name?: string; active?: boolean; playOnLoad?: boolean }>();
const { getWorkspaceFiles } = useNodeFiles();
const getDirectory = inject<() => string>("workspaceDirectory", () => "");
const element = ref<HTMLElement>();
const visible = ref(false);
let observer: IntersectionObserver | undefined;
onMounted(() => {
  if (!element.value || typeof IntersectionObserver === "undefined") { visible.value = true; return; }
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) visible.value = true;
    else element.value?.querySelector<HTMLMediaElement>("video, audio")?.pause();
  });
  observer.observe(element.value);
});
onScopeDispose(() => observer?.disconnect());

const filename = computed(() => props.file?.name || props.media?.url || props.name || "");
const mime = computed(() => getMediaMimeType({ name: filename.value, type: props.file?.type || props.media?.mimeType || "" }));
const extension = computed(() => (filename.value.match(/\.([a-z0-9]{1,10})$/i)?.[1] || "").toUpperCase());
const kind = computed(() => {
  if (props.text !== undefined || mime.value.startsWith("text/") || mime.value === "application/x-subrip" || /^(SRT|VTT|ASS|SSA)$/.test(extension.value)) return "text";
  if (mime.value.startsWith("image/")) return "image";
  if (mime.value.startsWith("video/")) return "video";
  if (mime.value.startsWith("audio/")) return "audio";
  return "file";
});
const icons = { text: IconFileText, image: IconPhoto, video: IconVideo, audio: IconMusic, file: IconFile };
const icon = computed(() => icons[kind.value]);
const source = ref("");
const readError = ref("");
const failed = ref(false);
const prefix = ref("");
const excerpt = computed(() => {
  const content = (props.text ?? prefix.value).slice(0, 4096).trim();
  const dialogue = content.match(/^Dialogue:\s*(.+)$/im);
  if (dialogue) return dialogue[1].split(",").slice(9).join(",").replace(/\{[^}]*\}/g, "").replace(/\\[Nn]/g, " ");
  const lines = content.split(/\r?\n/);
  const cue = lines.findIndex(line => line.includes("-->"));
  if (cue >= 0) return lines.slice(cue + 1, cue + 3).join(" ").replace(/<[^>]*>/g, "").trim();
  if (/^(WEBVTT|\[Script Info\])/i.test(content)) return "";
  return lines.slice(0, 2).join(" ");
});
const { src, preparing, error: previewError, handleError } = useMediaPreview(() => props.previewUrl || source.value, () => kind.value === "audio" || kind.value === "video" ? kind.value : "image");
const showMedia = computed(() => !!src.value && !failed.value && !preparing.value && !previewError.value);
let started = false;
function playWhenReady(event: Event) {
  if (!props.playOnLoad || started || !(event.target instanceof HTMLMediaElement)) return;
  started = true;
  void event.target.play().catch(() => { /* 浏览器需要再次点击播放时，保留原生控件。 */ });
}
function mediaError(event: Event) {
  if (props.active) handleError(event);
  else failed.value = true;
}

const needsSource = computed(() => !props.previewUrl && visible.value && kind.value !== "file" && (kind.value !== "audio" || props.active) && props.text === undefined);
watch([needsSource, () => props.file, () => props.media?.url, mime, getDirectory], async ([load, file, path, type], _, cleanup) => {
  source.value = prefix.value = readError.value = "";
  failed.value = false;
  if (!load || (!file && !path)) return;
  const controller = new AbortController();
  let shared: ReturnType<NonNullable<WorkspaceFiles["acquireUrl"]>> | undefined;
  let local = "";
  cleanup(() => { controller.abort(); shared?.release(); if (local) URL.revokeObjectURL(local); });
  try {
    if (file) {
      if (kind.value === "text") {
        const text = await file.slice(0, 4096).text();
        if (!controller.signal.aborted) prefix.value = text;
      } else source.value = local = URL.createObjectURL(file);
      return;
    }
    const files = getWorkspaceFiles();
    await queueRead(async () => {
      if (controller.signal.aborted) return;
      if (kind.value === "text") {
        const text = await files.readText(path!, 4096, controller.signal);
        if (!controller.signal.aborted) prefix.value = text;
        return;
      }
      shared = files.acquireUrl?.(path!, type);
      if (shared) {
        const url = await shared.url;
        if (!controller.signal.aborted) source.value = url;
      } else {
        const bytes = await files.read(path!);
        if (!controller.signal.aborted) source.value = local = URL.createObjectURL(new Blob([bytes], { type }));
      }
    });
  } catch (cause) {
    if (!controller.signal.aborted) readError.value = cause instanceof Error ? cause.message : translate("读取引用文件失败");
  }
}, { immediate: true, flush: "sync" });
watch(() => props.active, active => {
  failed.value = false;
  if (!active) element.value?.querySelector<HTMLMediaElement>("video, audio")?.pause();
});
</script>

<style scoped lang="scss">
.mediaChoicePreview {
  display: grid;
  place-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  img, video { display: block; width: 100%; height: 100%; object-fit: contain; }
  &.active {
    audio { width: 100%; max-width: 360px; height: 36px; }
  }
  .fileMark { display: flex; align-items: center; justify-content: center; gap: 5px; small { font-size: 10px; font-weight: 600; } }
  .excerpt { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; padding-inline: 6px; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; text-align: start; }
  &.textPreview.active .excerpt { -webkit-line-clamp: 6; white-space: pre-line; }
}
</style>
