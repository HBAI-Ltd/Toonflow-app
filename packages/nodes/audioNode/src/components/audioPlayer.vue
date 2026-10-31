<template>
  <div class="audioPlayer" :aria-busy="preparing || pcmLoading" @keydown.stop>
    <audio ref="audio" :src="playbackSrc || undefined" preload="auto" :aria-label="label" @loadedmetadata="readMetadata" @loadeddata="readPreview" @durationchange="readDuration" @timeupdate="readTime" @play="startProgress(); emit('play')" @pause="stopProgress" @ended="stopProgress" @volumechange="readVolume" @error="mediaError" />
    <div v-if="isPcm" class="pcmSettings nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop>
      <label>采样率（Hz）<el-input-number :modelValue="pcmOptions.sampleRate" :min="1" :max="384000" :controls="false" size="small" placeholder="填写采样率" @update:modelValue="pcmOptions = { ...pcmOptions, sampleRate: $event ?? undefined }" /></label>
      <label>声道<el-input-number :modelValue="pcmOptions.channels" :min="1" :max="32" :controls="false" size="small" placeholder="填写声道数" @update:modelValue="pcmOptions = { ...pcmOptions, channels: $event ?? undefined }" /></label>
      <label class="pcmFormat">采样格式<el-select :modelValue="pcmOptions.format" size="small" placeholder="选择采样格式" @update:modelValue="pcmOptions = { ...pcmOptions, format: $event }"><el-option v-for="option in pcmFormats" :key="option.value" :label="option.label" :value="option.value" /></el-select></label>
      <p>裸 PCM 不含格式信息，请按来源填写以上参数后预览。原文件保持不变。</p>
    </div>
    <p v-if="statusMessage" class="audioStatus" :role="failed ? 'alert' : 'status'">{{ statusMessage }}</p>
    <div class="waveformPanel" :class="{ unavailable: !duration || failed }">
      <div class="waveformTrack">
        <slot name="track" :duration="duration" :currentTime="currentTime" :peaks="peaks">
          <template v-if="peaks.length">
            <svg v-for="played in [false, true]" :key="String(played)" class="waveform" :class="{ played }" :style="played ? { clipPath: `inset(0 ${100 - progress}% 0 0)` } : undefined" viewBox="0 0 512 100" preserveAspectRatio="none" aria-hidden="true">
              <rect v-for="(peak, index) in peaks" :key="index" :x="index * 4 + 1" :y="50 - Math.max(2, peak * 78) / 2" width="2" :height="Math.max(2, peak * 78)" rx="1" />
            </svg>
          </template>
          <span v-else-if="!statusMessage" class="waveformStatus">{{ waveformLoading ? '正在读取波形…' : '当前音频无法显示波形' }}</span>
          <span v-if="duration && !failed" class="playhead" :style="{ left: `${progress}%` }" aria-hidden="true" />
          <input
            class="seekInput nodrag nopan nowheel"
            type="range"
            min="0"
            :max="duration || 1"
            step="0.01"
            :value="currentTime"
            :disabled="!duration || failed"
            aria-label="音频播放进度"
            :aria-valuetext="`${formatTime(currentTime)} / ${formatTime(duration)}`"
            @pointerdown.stop
            @mousedown.stop
            @dblclick.stop
            @input="seek"
            @keydown.space.prevent="togglePlayback" />
        </slot>
      </div>
    </div>
    <div class="playerControls">
      <el-button class="playButton nodrag nopan nowheel" :icon="playing ? IconPlayerPause : IconPlayerPlay" :disabled="!duration || failed" circle :aria-label="playing ? '暂停音频' : '播放音频'" :title="playing ? '暂停' : '播放'" @pointerdown.stop @mousedown.stop @dblclick.stop @click="togglePlayback" />
      <span class="timeLabel"><slot name="time"><span>{{ formatTime(currentTime) }}</span><span class="timeSeparator">/</span>{{ formatTime(duration) }}</slot></span>
      <div class="volumeControl nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop>
        <el-button class="volumeButton" :icon="muted || !volume ? IconVolumeOff : IconVolume" text circle :disabled="failed" :aria-label="muted || !volume ? '取消静音' : '静音音频'" :title="muted || !volume ? '取消静音' : '静音'" :aria-pressed="muted || !volume" @click="toggleMute" />
        <input class="volumeInput" type="range" min="0" max="100" :value="muted ? 0 : volume" :disabled="failed" aria-label="音频音量" @input="setVolume" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { ElButton, ElInputNumber, ElMessage, ElOption, ElSelect } from "element-plus";
import { IconPlayerPlay, IconPlayerPause, IconVolume, IconVolumeOff } from "@tabler/icons-vue";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";
import { getPcmOptions, isPcmMimeType, pcmFormats, pcmToWav, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { getWaveformPeaks } from "../audioWaveform";

const { src, mimeType, label = "节点音频" } = defineProps<{ src: string; mimeType?: string; label?: string }>();
const pcmOptions = defineModel<Partial<PcmOptions>>("pcmOptions", { default: () => ({}) });
const emit = defineEmits<{ loadedmetadata: [event: Event]; play: [] }>();
const isPcm = computed(() => isPcmMimeType(mimeType));
const pcmUrl = ref("");
const pcmError = ref("");
const pcmLoading = ref(false);
const mediaPreview = useMediaPreview(() => isPcm.value ? pcmUrl.value : src, "audio");
const { src: playbackSrc, preparing, error: previewError } = mediaPreview;
const audio = ref<HTMLAudioElement>();
const peaks = shallowRef<number[]>([]);
const waveformLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playing = ref(false);
const failed = ref(false);
const volume = ref(100);
const muted = ref(false);
const statusMessage = computed(() => pcmError.value || previewError.value || (preparing.value || pcmLoading.value ? "正在生成兼容预览…" : ""));
const progress = computed(() => duration.value ? Math.min(100, Math.max(0, currentTime.value / duration.value * 100)) : 0);
let animationFrame = 0;
let disposed = false;

// ACT: 裸 PCM 没有可靠元数据，仅使用用户本次会话明确填写的参数，不猜测声道、位深或端序。
watch([() => src, isPcm, () => pcmOptions.value.sampleRate, () => pcmOptions.value.channels, () => pcmOptions.value.format], async ([value, rawPcm], _previous, onCleanup) => {
  const controller = new AbortController();
  let url = "";
  onCleanup(() => { controller.abort(); if (url) URL.revokeObjectURL(url); });
  pcmUrl.value = "";
  pcmError.value = "";
  pcmLoading.value = false;
  if (!rawPcm || !value) return;
  const options = getPcmOptions(pcmOptions.value);
  if (!options) { pcmError.value = "请填写有效的采样率、声道数和采样格式，才能预览裸 PCM"; return; }
  pcmLoading.value = true;
  try {
    const response = await fetch(value, { signal: controller.signal });
    if (!response.ok) throw new Error("无法读取 PCM 音频");
    const content = await response.arrayBuffer();
    controller.signal.throwIfAborted();
    url = URL.createObjectURL(pcmToWav(content, options));
    pcmUrl.value = url;
  } catch (error) {
    if (!controller.signal.aborted) pcmError.value = error instanceof Error ? error.message : "PCM 预览失败";
  } finally {
    if (!controller.signal.aborted) pcmLoading.value = false;
  }
}, { immediate: true, flush: "sync" });

watch(playbackSrc, async (value, _previous, onCleanup) => {
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  audio.value?.pause();
  stopProgress();
  currentTime.value = duration.value = 0;
  failed.value = false;
  peaks.value = [];
  waveformLoading.value = !!value;
  if (!value) return;
  try {
    const response = await fetch(value, { signal: controller.signal });
    if (!response.ok) throw new Error("无法读取音频");
    const content = await response.arrayBuffer();
    controller.signal.throwIfAborted();
    // ACT: 使用浏览器完整解码后仅保留 128 个峰值；超长素材的解码内存开销可通过服务端分段提取优化。
    const context = new OfflineAudioContext(1, 1, 48000);
    const buffer = await context.decodeAudioData(content);
    controller.signal.throwIfAborted();
    peaks.value = getWaveformPeaks(Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index)));
  } catch {
    // ACT: 浏览器能播放但不能解码的格式仍保留播放和定位，波形区域提示不可用。
  } finally {
    if (!controller.signal.aborted) waveformLoading.value = false;
  }
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => {
  disposed = true;
  audio.value?.pause();
  stopProgress();
});

function formatTime(value: number) {
  const seconds = Math.floor(Number.isFinite(value) ? Math.max(0, value) : 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function readDuration() {
  const value = audio.value?.duration ?? 0;
  duration.value = Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readMetadata(event: Event) {
  if (!isCurrent(event)) return;
  readDuration();
  emit("loadedmetadata", event);
}

function isCurrent(event: Event) {
  const target = event.currentTarget as HTMLAudioElement;
  return !!playbackSrc.value && target.currentSrc === playbackSrc.value;
}

function readPreview(event: Event) {
  if (isCurrent(event) && mediaPreview.handleLoaded(event)) failed.value = false;
}

function readTime() {
  currentTime.value = audio.value?.currentTime ?? 0;
}

function updateProgress() {
  readTime();
  animationFrame = requestAnimationFrame(updateProgress);
}

function startProgress() {
  cancelAnimationFrame(animationFrame);
  playing.value = true;
  updateProgress();
}

function stopProgress() {
  cancelAnimationFrame(animationFrame);
  playing.value = false;
  readTime();
}

async function togglePlayback() {
  const element = audio.value;
  if (!element || !duration.value || failed.value) return;
  if (!element.paused) return element.pause();
  try { await element.play(); }
  catch (error) {
    if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) ElMessage.error("音频播放失败");
  }
}

function seek(event: Event) {
  seekTo((event.target as HTMLInputElement).valueAsNumber);
}

function seekTo(value: number) {
  if (!audio.value || !duration.value) return;
  if (!Number.isFinite(value)) return;
  audio.value.currentTime = Math.min(duration.value, Math.max(0, value));
  readTime();
}

function pause() {
  audio.value?.pause();
}

defineExpose({ duration, currentTime, playing, failed, seekTo, pause });

function readVolume() {
  volume.value = Math.round((audio.value?.volume ?? 1) * 100);
  muted.value = audio.value?.muted ?? false;
}

function setVolume(event: Event) {
  if (!audio.value) return;
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (!Number.isFinite(value)) return;
  audio.value.volume = Math.min(100, Math.max(0, value)) / 100;
  audio.value.muted = value === 0;
}

function toggleMute() {
  if (!audio.value) return;
  if (!audio.value.volume) audio.value.volume = 1;
  audio.value.muted = !(muted.value || !volume.value);
}

function mediaError(event: Event) {
  if (!isCurrent(event)) return;
  failed.value = true;
  stopProgress();
  mediaPreview.handleError(event);
}
</script>

<style scoped lang="scss">
.audioPlayer {
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);

  audio { display: none; }
  .pcmSettings {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
    label {
      display: flex;
      flex: 1 1 120px;
      flex-direction: column;
      gap: 4px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      .el-input-number, .el-select { width: 100%; }
      &.pcmFormat { flex-basis: 100%; }
    }
    p { flex-basis: 100%; margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
  }
  .audioStatus { margin: 0 0 10px; color: var(--el-text-color-secondary); font-size: 12px; overflow-wrap: anywhere; }
  .waveformPanel {
    padding: 10px 14px;
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-light);
    &.unavailable { opacity: 0.65; }

    .waveformTrack {
      position: relative;
      height: 96px;
      .waveform { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--el-text-color-placeholder); &.played { fill: var(--el-color-primary); } }
      .waveformStatus { position: absolute; inset: 0; display: grid; place-items: center; font-size: 12px; color: var(--el-text-color-secondary); }
      .playhead {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        transform: translateX(-50%);
        background: var(--el-color-primary);
        pointer-events: none;
        &::before { content: ""; position: absolute; top: 0; left: 50%; width: 8px; height: 8px; border-radius: 3px; background: inherit; transform: translate(-50%, -2px); }
      }
      .seekInput {
        position: absolute;
        inset: 0 -6px;
        width: calc(100% + 12px);
        height: 100%;
        margin: 0;
        opacity: 0;
        appearance: none;
        // ACT: 只让位置线附近的滑块接收拖动，波形其余区域交给节点拖拽。
        pointer-events: none;
        touch-action: none;
        &::-webkit-slider-thumb { appearance: none; width: 12px; height: 96px; pointer-events: auto; cursor: ew-resize; }
        &::-moz-range-thumb { width: 12px; height: 96px; border: 0; pointer-events: auto; cursor: ew-resize; }
        &:disabled::-webkit-slider-thumb { pointer-events: none; }
        &:disabled::-moz-range-thumb { pointer-events: none; }
      }
      &:has(.seekInput:focus-visible) { outline: 2px solid var(--el-color-primary); outline-offset: 5px; border-radius: 3px; }
    }
  }
  .playerControls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 2px 0;
    .playButton { width: 30px; height: 30px; color: var(--el-color-primary); border-color: var(--el-color-primary-light-8); background: var(--el-color-primary-light-9); }
    .timeLabel { display: flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); > span:first-child { color: var(--el-text-color-primary); } .timeSeparator { opacity: 0.5; } }
    .volumeControl {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      .volumeButton { width: 26px; height: 26px; padding: 4px; }
      .volumeInput { width: 56px; height: 16px; margin: 0; cursor: pointer; accent-color: var(--el-color-primary); }
    }
  }
}
</style>
