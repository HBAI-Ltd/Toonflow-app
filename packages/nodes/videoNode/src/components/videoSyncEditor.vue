<template>
  <section class="syncEditor">
    <video ref="picture" :src="videoPreview.src.value" muted playsinline preload="auto" aria-label="音画同步预览"
      @loadeddata="readPicture" @error="videoPreview.handleError" @playing="startClock" @waiting="stopClock"
      @seeking="stopClock" @seeked="afterSeek" @pause="stopClock" @ended="stopClock" @timeupdate="readPosition" />
    <audio ref="track" :src="audioPreview.src.value" preload="auto" @loadeddata="readTrack" @error="audioPreview.handleError" />
    <div class="transport">
      <el-button :icon="playing ? IconPlayerPause : IconPlayerPlay" :disabled="!ready" @click="togglePlayback">
        {{ playing ? '暂停试听' : '试听同步效果' }}
      </el-button>
      <span>试听位置 <output>{{ formatTime(position) }} / {{ formatTime(duration) }}</output></span>
    </div>
    <div class="filmTrack">
      <videoFilmstrip :src="videoPreview.src.value" :duration="duration" />
      <span class="playhead" :style="{ left: (duration ? position / duration * 100 : 0) + '%' }" />
      <input type="range" min="0" :max="duration || 1" step="0.01" :value="position" :disabled="!ready"
        aria-label="选择试听位置" :aria-valuetext="formatTime(position)" @input="seek" />
    </div>
    <div class="direction">
      <el-radio-group :modelValue="direction" aria-label="声音偏移方向" @change="changeDirection">
        <el-radio-button value="earlier">声音提前</el-radio-button>
        <el-radio-button value="later">声音延后</el-radio-button>
      </el-radio-group>
      <label>偏移时长
        <el-input-number :modelValue="amount" :min="0" :max="limit" :step="0.01" :precision="2" controlsPosition="right"
          :disabled="!ready" aria-label="声音偏移时长（秒）" @update:modelValue="changeAmount" /> 秒
      </label>
    </div>
    <div class="fineTune">
      <span>0 秒</span>
      <el-slider :modelValue="amount" :min="0" :max="fineLimit || 0.01" :step="0.01" :disabled="!ready || !limit"
        aria-label="微调声音偏移" :formatTooltip="value => value.toFixed(2) + ' 秒'" @input="value => changeAmount(Number(value))" />
      <span>{{ fineLimit }} 秒</span>
    </div>
    <p v-if="error || playbackError" role="alert">{{ error || playbackError }}</p>
    <p v-else-if="!ready" role="status">{{ videoPreview.preparing.value || audioPreview.preparing.value ? '正在生成兼容预览…' : '正在读取画面和音轨…' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElButton, ElInputNumber, ElRadioButton, ElRadioGroup, ElSlider } from "element-plus";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-vue";
import { useNodeFfmpeg, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { probeMedia } from "@toonflow/node-shared/mediaCommands";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import videoFilmstrip from "./videoFilmstrip.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, number>]; ready: [value: boolean] }>();
const ffmpeg = useNodeFfmpeg();
const videoPreview = useMediaPreview(() => props.src, "video");
const audioPreview = useMediaPreview(() => props.src, "audio");
const picture = ref<HTMLVideoElement>();
const track = ref<HTMLAudioElement>();
const direction = ref(Number(props.values.delay) < 0 ? "earlier" : "later");
const delay = computed(() => Number(props.values.delay) || 0);
const amount = computed(() => Math.abs(delay.value));
const duration = ref(0), position = ref(0);
const hasAudio = ref(false), trackReady = ref(false), playing = ref(false);
const readError = ref(""), playbackError = ref("");
const error = computed(() => readError.value || videoPreview.error.value || audioPreview.error.value);
const ready = computed(() => duration.value > 0 && hasAudio.value && trackReady.value && !error.value);
const limit = computed(() => duration.value ? Math.min(120, Math.max(0, (Math.ceil(duration.value * 100) - 1) / 100)) : 120);
const fineLimit = computed(() => Math.min(limit.value, Math.max(2, Math.ceil(amount.value))));
let frame = 0;

function formatTime(value: number) {
  const ticks = Math.round(value * 100);
  return Math.floor(ticks / 6000) + ":" + (ticks % 6000 / 100).toFixed(2).padStart(5, "0");
}

function changeAmount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return;
  const seconds = Math.min(limit.value, Math.max(0, value));
  emit("updateValues", { delay: direction.value === "earlier" ? -seconds : seconds });
}
function changeDirection(value: unknown) {
  direction.value = value === "earlier" ? "earlier" : "later";
  changeAmount(amount.value);
}
function readPicture(event: Event) {
  if (!videoPreview.handleLoaded(event)) return;
  const seconds = picture.value?.duration;
  duration.value = seconds && Number.isFinite(seconds) ? seconds : 0;
  if (amount.value > limit.value) changeAmount(limit.value);
}
function readTrack(event: Event) {
  trackReady.value = audioPreview.handleLoaded(event);
  align();
}
function readPosition() {
  position.value = picture.value?.currentTime || 0;
}
function seek(event: Event) {
  if (!ready.value || !picture.value) return;
  stopClock();
  picture.value.currentTime = position.value = (event.target as HTMLInputElement).valueAsNumber;
}
function stopClock() {
  cancelAnimationFrame(frame);
  track.value?.pause();
  playing.value = !!picture.value && !picture.value.paused && !picture.value.ended;
}
function playbackFailed(cause: unknown) {
  if (cause instanceof DOMException && cause.name === "AbortError") return;
  playbackError.value = "无法试听这段素材，请重新播放";
  picture.value?.pause();
  stopClock();
}

function sync(force: boolean) {
  const video = picture.value, audio = track.value;
  if (!video || !audio || !trackReady.value) return;
  readPosition();
  const at = video.currentTime - delay.value;
  if (at < 0 || at >= audio.duration) {
    audio.pause();
    return;
  }
  // 独立解码器的时钟可能缓慢漂移，用短暂的速率微调对齐，避免连续 seek 切断对白。
  const drift = at - audio.currentTime;
  if (force || (!audio.seeking && (audio.paused || Math.abs(drift) > 0.18))) {
    audio.playbackRate = 1;
    audio.currentTime = at;
  } else if (!audio.seeking) {
    const rate = Math.abs(drift) < 0.005 ? 1 : Math.max(0.94, Math.min(1.06, 1 + drift * 2));
    if (Math.abs(audio.playbackRate - rate) > 0.003) audio.playbackRate = rate;
  }
  if (video.paused || video.ended || video.seeking || video.readyState < 3) audio.pause();
  else if (audio.paused) audio.play().catch(playbackFailed);
}
function align() { sync(true); }
function afterSeek() {
  align();
  if (picture.value && !picture.value.paused && picture.value.readyState >= 3) startClock();
}
function startClock() {
  cancelAnimationFrame(frame);
  playing.value = true;
  function tick() { sync(false); frame = requestAnimationFrame(tick); }
  tick();
}
function togglePlayback() {
  const video = picture.value, audio = track.value;
  if (!video || !audio || !ready.value) return;
  if (!video.paused) { video.pause(); return; }
  playbackError.value = "";
  if (video.ended) video.currentTime = 0;
  // 直接在用户的播放手势中激活音轨，以覆盖开头有一段静音的延后试听。
  audio.play().catch(playbackFailed);
  audio.pause();
  video.play().catch(playbackFailed);
}

watch(delay, align);
watch(ready, value => emit("ready", value), { immediate: true });
watch(() => props.source.url, async (path, _, cleanup) => {
  const controller = new AbortController();
  cleanup(() => controller.abort());
  hasAudio.value = false;
  readError.value = "";
  try {
    const media = await probeMedia(await ffmpeg(controller.signal), path, controller.signal);
    controller.signal.throwIfAborted();
    hasAudio.value = media.streams.some(stream => stream.codec_type === "audio");
    if (!hasAudio.value) readError.value = "原视频没有音轨，请选择包含声音的视频";
  } catch (cause) {
    if (!controller.signal.aborted) readError.value = cause instanceof Error ? cause.message : "无法读取原视频的音轨";
  }
}, { immediate: true });
watch(() => videoPreview.src.value, () => { stopClock(); duration.value = position.value = 0; playbackError.value = ""; });
watch(() => audioPreview.src.value, () => { trackReady.value = false; stopClock(); });
onBeforeUnmount(() => { picture.value?.pause(); stopClock(); });
</script>

<style scoped lang="scss">
.syncEditor {
  display: grid; gap: 12px; min-width: 0;
  video { display: block; width: 100%; height: clamp(120px, 32dvh, 300px); object-fit: contain; border-radius: var(--el-border-radius-base); background: #101010; }
  audio { display: none; }
  .transport, .direction, .fineTune { display: flex; align-items: center; justify-content: space-between; gap: 8px 16px; }
  .transport, .direction { flex-wrap: wrap; }
  .transport span, .fineTune span { color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
  .transport output { margin-left: 4px; color: var(--el-text-color-regular); }
  .filmTrack {
    position: relative; height: 40px; border-radius: 5px; overflow: hidden;
    input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; }
    .playhead { position: absolute; inset-block: 0; width: 3px; max-width: 100%; transform: translateX(-50%); background: #fff; box-shadow: 0 0 3px #000; pointer-events: none; }
    &:focus-within { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
  }
  .direction {
    label { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); font-size: 13px; }
    .el-input-number { width: 100px; }
  }
  .fineTune { span { white-space: nowrap; } .el-slider { flex: 1; min-width: 40px; } }
  p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
  p[role="alert"] { color: var(--el-color-danger); }
}
</style>
