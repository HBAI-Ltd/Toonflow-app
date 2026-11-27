<template>
  <section class="subtitleEditor">
    <videoPlayer :src="src" readOnly label="字幕时间轴预览" @loadedmetadata="loadVideo" @ready="playable = $event" />
    <subtitleCuePicker v-if="cues.length" :cues="cues" :modelValue="currentCue" label="选择字幕句子" @choose="index => seek(cues[index]?.start)">
      <template #navigation>
        <el-button-group>
          <el-button size="small" :disabled="previous === undefined" @click="seek(previous)">上一句</el-button>
          <el-button size="small" :disabled="next === undefined" @click="seek(next)">下一句</el-button>
        </el-button-group>
      </template>
    </subtitleCuePicker>
    <span v-if="failure" role="alert">{{ failure }}</span>
    <span v-else-if="loading" role="status">正在读取字幕时间轴…</span>
    <span v-else-if="styled && cues.length" class="styleHint">这里可核对对白和时间，成片将使用字幕文件中的字体与特效。</span>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { ElButton, ElButtonGroup } from "element-plus";
import { useNodeFfmpeg, useNodeFiles } from "@toonflow/nodes-scaffold/runtime";
import { runCommand } from "@toonflow/node-shared/mediaCommands";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import type { MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import { subtitleFileName } from "../videoOverlay";
import { readSubtitleCues, timestamp } from "../videoSubtitleTiming";
import videoPlayer from "./videoPlayer.vue";
import subtitleCuePicker from "./subtitleCuePicker.vue";

const props = defineProps<{ src: string; attachments: MediaToolAttachment[] }>();
const emit = defineEmits<{ ready: [value: boolean] }>();
const files = useNodeFiles(), loadFfmpeg = useNodeFfmpeg();
const video = shallowRef<HTMLVideoElement>();
const playable = ref(false), loading = ref(false), failure = ref(""), subtitle = ref("");
const cues = shallowRef<{ start: number; end: number; text: string }[]>([]), currentTime = ref(0);
const attachment = computed(() => props.attachments[0]);
const styled = computed(() => /\.(ass|ssa)$/i.test(attachment.value?.name ?? ""));
const currentCue = computed(() => cues.value.findLastIndex(cue => cue.start <= currentTime.value && cue.end > currentTime.value));
const previous = computed(() => cues.value.findLast(cue => cue.start < currentTime.value - .05)?.start);
const next = computed(() => cues.value.find(cue => cue.start > currentTime.value + .05)?.start);
function loadVideo(event: Event) { video.value = event.target as HTMLVideoElement; }
function seek(at?: number) {
  if (!video.value || at === undefined) return;
  video.value.currentTime = at;
  currentTime.value = at;
}

watch(attachment, async (item, _, cleanup) => {
  const controller = new AbortController();
  let url = "";
  cleanup(() => { controller.abort(); if (url) URL.revokeObjectURL(url); });
  subtitle.value = failure.value = "";
  loading.value = !!item;
  if (!item) return;
  const folder = `assets/${crypto.randomUUID()}`;
  const workspace = files.getWorkspaceFiles();
  let created = false;
  try {
    const name = subtitleFileName(item instanceof File ? item.name : item.path);
    let bytes = item instanceof File ? await item.arrayBuffer() : await workspace.read(item.path);
    let previewText: string | undefined;
    if (name === "captions.srt") {
      try {
        const cues = readSubtitleCues(new TextDecoder("utf-8", { fatal: true }).decode(bytes), true);
        if (cues.every(cue => !cue.settings.trim() && !cue.text.includes("{\\"))) {
          previewText = "WEBVTT\n\n" + cues.map(cue => `${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}`).join("\n\n");
        }
      } catch {
        // 继续使用 FFmpeg 读取非标准 SRT 或其他编码，保留原来的兼容性。
      }
    }
    if (name !== "captions.vtt" && previewText === undefined) {
      const ffmpeg = await loadFfmpeg(controller.signal);
      controller.signal.throwIfAborted();
      await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
      await workspace.mkdir(folder);
      created = true;
      await workspace.write(`${folder}/${name}`, bytes, true);
      const target = folder + "/preview.vtt";
      await runCommand(ffmpeg(`${folder}/${name}`).outputOptions("-map", "0:s:0", "-c:s", "webvtt").output(target), controller.signal);
      bytes = await workspace.read(target);
    }
    controller.signal.throwIfAborted();
    url = URL.createObjectURL(new Blob([previewText ?? bytes], { type: "text/vtt" }));
    subtitle.value = url;
  } catch (error) {
    if (!controller.signal.aborted) failure.value = error instanceof Error ? error.message : "无法读取字幕";
  } finally {
    if (created) await workspace.remove(folder, true).catch(error => showNodeError(error, "临时字幕清理失败"));
    if (!controller.signal.aborted) loading.value = false;
  }
}, { immediate: true, flush: "sync" });

watch([video, subtitle], ([el, url], _, cleanup) => {
  cues.value = [];
  if (!el || !url) return;
  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = "对白";
  track.default = true;
  track.src = url;
  track.onload = () => {
    cues.value = Array.from(track.track.cues ?? []).filter((cue): cue is VTTCue => cue instanceof VTTCue && cue.startTime < el.duration && cue.endTime > 0)
      .map(cue => ({ start: cue.startTime, end: cue.endTime, text: cue.getCueAsHTML().textContent || cue.text }));
    if (!cues.value.length) failure.value = "原片时长内没有可显示的字幕，请检查字幕时间。";
    else if (el.paused && !el.seeking && el.currentTime === 0 && cues.value[0]!.start > 0) seek(cues.value[0]!.start);
  };
  track.onerror = () => { failure.value = "无法加载字幕，请检查字幕文件。"; };
  const sync = () => { currentTime.value = el.currentTime; };
  sync();
  el.append(track);
  track.track.mode = "showing";
  el.addEventListener("timeupdate", sync);
  cleanup(() => { track.onload = track.onerror = null; track.remove(); el.removeEventListener("timeupdate", sync); });
}, { flush: "sync" });
watch(() => playable.value && !!cues.value.length && !failure.value, valid => emit("ready", valid), { immediate: true });
</script>

<style scoped lang="scss">
.subtitleEditor {
  display: grid;
  gap: 10px;
  .styleHint { color: var(--el-text-color-regular); }
  [role="alert"] { color: var(--el-color-danger); }
}
</style>
