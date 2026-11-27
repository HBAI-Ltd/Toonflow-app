<template>
  <div class="productionEditor">
    <videoPlayer :src="src" readOnly label="原视频预览" @loadedmetadata="readMetadata" @ready="playable = $event" />
    <div v-if="tool.id === 'repairBadFrame'" class="controls">
      <span>停在需要替换的一帧</span>
      <output v-if="valid">{{ Number(values.time).toFixed(3) }} 秒</output>
    </div>
    <template v-else-if="tool.id === 'blendLoop'">
      <label>首尾过渡时长
        <input type="range" min="0.05" :max="maxOverlap" step="0.01" :value="values.seconds" @input="change('seconds', $event)" />
        <output>{{ Number(values.seconds).toFixed(2) }} 秒</output>
      </label>
      <el-button size="small" :loading="loading" :disabled="!valid" @click="preview">预览首尾过渡</el-button>
      <span v-if="playable && !valid" role="status">过渡时长必须小于片段时长的一半</span>
      <canvas v-show="shown" ref="previewCanvas" aria-label="首尾画面各占一半的接缝中点" />
      <span v-if="error" role="alert">{{ error }}</span>
    </template>
    <label v-else>减少闪烁的力度
      <input type="range" min="2" max="31" step="1" :value="values.frames" @input="change('frames', $event)" />
      <output>{{ values.frames }} 帧</output>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import videoPlayer from "./videoPlayer.vue";
const props = defineProps<{ tool: MediaTool; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, number>]; ready: [ready: boolean] }>();
const video = shallowRef<HTMLVideoElement>(), playable = ref(false), previewCanvas = ref<HTMLCanvasElement>();
const shown = ref(false), loading = ref(false), error = ref("");
const maxOverlap = computed(() => Math.min(5, Math.max(.05, ((video.value?.duration || 10) - .05) / 2)));
const valid = computed(() => playable.value && (props.tool.id === "repairBadFrame" ? Number(props.values.time) > 0 && Number(props.values.time) < video.value!.duration :
  props.tool.id !== "blendLoop" || Number(props.values.seconds) * 2 < video.value!.duration));
watch(valid, value => emit("ready", value), { immediate: true });
function change(key: string, event: Event) { emit("updateValues", { [key]: Number((event.target as HTMLInputElement).value) }); }
function readMetadata(event: Event) {
  const el = event.target as HTMLVideoElement;
  video.value = el;
  if (props.tool.id === "blendLoop" && Number.isFinite(el.duration) && Number(props.values.seconds) * 2 >= el.duration) {
    emit("updateValues", { seconds: Math.max(.05, Math.min(5, Math.round(el.duration * 25) / 100)) });
  }
}
watch(video, (el, _, cleanup) => {
  if (props.tool.id !== "repairBadFrame" || !el) return;
  const syncTime = () => {
    const time = el.paused && !el.seeking && !el.ended ? el.currentTime : -1;
    if (Number(props.values.time) !== time) emit("updateValues", { time });
  };
  const events = ["pause", "play", "seeking", "seeked", "ended"];
  syncTime();
  for (const event of events) el.addEventListener(event, syncTime);
  cleanup(() => { for (const event of events) el.removeEventListener(event, syncTime); });
});
let pending: AbortController | undefined;
function reset() { pending?.abort(); pending = undefined; loading.value = shown.value = false; error.value = ""; }
watch(() => [props.src, props.values.seconds], reset);
onScopeDispose(reset);
async function preview() {
  const el = video.value, canvas = previewCanvas.value;
  if (!el || !canvas || loading.value) return;
  reset(); el.pause();
  const controller = pending = new AbortController(), signal = controller.signal;
  const sample = document.createElement("video");
  sample.muted = true; sample.preload = "auto";
  function wait(event: "loadeddata" | "seeked", action: () => void) {
    return new Promise<void>((resolve, reject) => {
      const clean = () => { sample.removeEventListener(event, done); sample.removeEventListener("error", fail); signal.removeEventListener("abort", fail); };
      const done = () => { clean(); resolve(); }, fail = () => { clean(); reject(new Error("接缝画面读取失败")); };
      sample.addEventListener(event, done); sample.addEventListener("error", fail); signal.addEventListener("abort", fail, { once: true });
      action();
    });
  }
  try {
    loading.value = true;
    await wait("loadeddata", () => { sample.src = el.currentSrc; });
    const scale = Math.min(1, 720 / Math.max(sample.videoWidth, sample.videoHeight));
    canvas.width = Math.max(1, Math.round(sample.videoWidth * scale)); canvas.height = Math.max(1, Math.round(sample.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建预览");
    const half = Number(props.values.seconds) / 2;
    await wait("seeked", () => { sample.currentTime = sample.duration - half; }); ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
    await wait("seeked", () => { sample.currentTime = half; }); ctx.globalAlpha = .5; ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1; shown.value = true;
  } catch (cause) { if (!signal.aborted) error.value = cause instanceof Error ? cause.message : "接缝预览失败"; }
  finally { sample.removeAttribute("src"); sample.load(); if (pending === controller) { pending = undefined; loading.value = false; } }
}
</script>

<style scoped lang="scss">
.productionEditor {
  display: grid; gap: 10px;
  label, .controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
  input { flex: 1; accent-color: var(--el-color-primary); }
  canvas { max-width: 100%; max-height: 180px; justify-self: center; }
  [role="alert"] { color: var(--el-color-danger); }
}
</style>
