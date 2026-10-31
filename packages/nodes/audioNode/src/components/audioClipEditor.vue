<template>
  <div class="audioClipEditor nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.capture="handleKeydown" @keydown.stop>
    <audioPlayer ref="player" v-model:pcmOptions="pcmOptions" :src="src" :mimeType="mimeType" label="音频剪辑预览" :inert="disabled" @loadedmetadata="readDuration" @play="startPlayback">
      <template #track="{ peaks }">
        <div class="timeline">
          <div class="timeRuler" @click="seekTimeline">
            <span v-for="tick in 6" :key="tick" :style="{ left: `${(tick - 1) * 20}%` }">{{ formatTime((tick - 1) * timelineDuration / 5) }}</span>
          </div>
          <div class="segmentTrack" role="group" aria-label="音频剪辑轨道">
            <button v-for="(clip, index) in clips" :key="index" class="segmentItem" :class="{ selected: selectedIndex === index }" :style="{ left: `${clip.offset / timelineDuration * 100}%`, width: `${clip.length / timelineDuration * 100}%` }" type="button" :disabled="disabled" :aria-pressed="selectedIndex === index" :aria-label="`片段 ${index + 1}，时长 ${clip.length.toFixed(2)} 秒`" @click="selectSegment(index, $event)" @keydown.left.prevent="seekAt(playhead - 0.1)" @keydown.right.prevent="seekAt(playhead + 0.1)" @keydown.delete.prevent="selectedIndex = index; removeSegment()">
              <span class="segmentName">片段 {{ index + 1 }}</span>
              <template v-if="peaks.length"><svg v-for="(part, partIndex) in clip.parts" :key="partIndex" class="segmentWaveform" :style="{ left: `${part.offset / clip.length * 100}%`, width: `${part.length / clip.length * 100}%` }" :viewBox="`${part.start / duration * 512} 0 ${part.length / duration * 512} 100`" preserveAspectRatio="none" aria-hidden="true"><rect v-for="(peak, bar) in peaks" :key="bar" :x="bar * 4 + 1" :y="50 - Math.max(2, peak * 78) / 2" width="2" :height="Math.max(2, peak * 78)" rx="1" /></svg></template>
              <span class="segmentDuration">{{ clip.length.toFixed(2) }} 秒</span>
            </button>
          </div>
          <span v-if="segments.length" class="playhead" :style="{ left: `${playhead / timelineDuration * 100}%` }" aria-hidden="true" />
          <input class="cursorInput" type="range" min="0" :max="totalDuration || 1" step="0.01" :value="playhead" :disabled="disabled || !valid" aria-label="剪辑游标" :aria-valuetext="`${formatTime(playhead)} / ${formatTime(totalDuration)}`" @pointerdown.stop @input="seekCursor" />
        </div>
      </template>
      <template #time><span>{{ formatTime(playhead) }}</span><span>/</span><span>{{ formatTime(totalDuration) }}</span></template>
    </audioPlayer>
    <div class="editActions">
      <el-button :icon="IconArrowBackUp" :disabled="disabled || !undoStack.length" title="撤销（Ctrl+Z）" @click="undo">撤销</el-button>
      <el-button :icon="IconArrowForwardUp" :disabled="disabled || !redoStack.length" title="恢复（Ctrl+Y）" @click="redo">恢复</el-button>
      <el-button :icon="IconScissors" :disabled="disabled || !canSplit" @click="splitSegment">分割</el-button>
      <el-button :icon="IconLink" :disabled="disabled || !canMerge" :title="selectedIndex > 0 ? '与前一片段粘合' : '与后一片段粘合'" @click="mergeSegment">粘合</el-button>
      <el-button :icon="IconTrash" :disabled="disabled || !activeSegment" @click="removeSegment">删除选中片段</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElButton } from "element-plus";
import { IconArrowBackUp, IconArrowForwardUp, IconLink, IconScissors, IconTrash } from "@tabler/icons-vue";
import type { AudioSegment } from "../audioProcessing";
import audioPlayer from "./audioPlayer.vue";
import type { PcmOptions } from "@toonflow/node-shared/pcmPreview";

type EditState = { groups: AudioSegment[][]; selectedIndex: number; playhead: number };
const props = defineProps<{ src: string; mimeType?: string; disabled?: boolean }>();
const segments = defineModel<AudioSegment[]>({ required: true });
const pcmOptions = defineModel<Partial<PcmOptions>>("pcmOptions", { default: () => ({}) });
const player = ref<InstanceType<typeof audioPlayer>>();
const duration = ref(0);
const selectedIndex = ref(0);
const playhead = ref(0);
// ACT: 分组只用于编辑器的粘合显示，导出仍展开为原始区间，保留删除造成的缺口。
const groups = ref<AudioSegment[][]>([]);
const undoStack = ref<EditState[]>([]);
const redoStack = ref<EditState[]>([]);
const activeSegment = computed(() => groups.value[selectedIndex.value]);
const clips = computed(() => {
  let offset = 0;
  return groups.value.map(ranges => {
    let length = 0;
    const parts = ranges.map(range => {
      const part = { ...range, offset: length, length: range.end - range.start };
      length += part.length;
      return part;
    });
    const clip = { parts, offset, length };
    offset += length;
    return clip;
  });
});
const totalDuration = computed(() => clips.value.reduce((total, clip) => total + clip.length, 0));
const timelineDuration = computed(() => totalDuration.value || duration.value || 1);
const valid = computed(() => !!player.value?.duration && !player.value.failed && duration.value > 0 && groups.value.length > 0 && groups.value.flat().every(segment => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.start >= 0 && segment.end > segment.start && segment.end <= duration.value));
const canSplit = computed(() => {
  const clip = clips.value[selectedIndex.value];
  return clip && playhead.value - clip.offset >= 0.01 && clip.offset + clip.length - playhead.value >= 0.01;
});
const canMerge = computed(() => !!activeSegment.value && groups.value.length > 1);
let playbackClipIndex = 0;
let playbackPartIndex = 0;

watch([() => props.src, () => pcmOptions.value.sampleRate, () => pcmOptions.value.channels, () => pcmOptions.value.format], () => {
  duration.value = 0;
  undoStack.value = redoStack.value = [];
  applyState({ groups: [], selectedIndex: 0, playhead: 0 });
});
watch(() => props.disabled, value => { if (value) pause(); });
watch(() => player.value?.currentTime, updatePlayback);
onBeforeUnmount(pause);
defineExpose({ valid, pause });

function formatTime(value: number) {
  const safe = Math.round(Math.max(0, Number.isFinite(value) ? value : 0) * 100);
  return `${Math.floor(safe / 6000)}:${(safe % 6000 / 100).toFixed(2).padStart(5, "0")}`;
}

function pause() {
  player.value?.pause();
}

function readDuration(event: Event) {
  const value = (event.currentTarget as HTMLAudioElement).duration;
  duration.value = Number.isFinite(value) && value > 0 ? value : 0;
  if (duration.value && !groups.value.length) {
    const ranges = segments.value.length ? segments.value : [{ start: 0, end: duration.value }];
    applyState({ groups: ranges.map(range => [{ ...range }]), selectedIndex: 0, playhead: 0 });
  }
}

function snapshot(): EditState {
  return { groups: groups.value.map(group => group.map(range => ({ ...range }))), selectedIndex: selectedIndex.value, playhead: playhead.value };
}

function applyState(state: EditState) {
  pause();
  groups.value = state.groups;
  segments.value = state.groups.flat().map(range => ({ ...range }));
  playhead.value = Math.min(totalDuration.value, Math.max(0, state.playhead));
  seekPlayer();
  selectedIndex.value = state.selectedIndex;
}

function commit(next: AudioSegment[][], index: number, time = playhead.value) {
  undoStack.value.push(snapshot());
  redoStack.value = [];
  applyState({ groups: next, selectedIndex: index, playhead: time });
}

function undo() {
  if (props.disabled || !undoStack.value.length) return;
  redoStack.value.push(snapshot());
  applyState(undoStack.value.pop()!);
}

function redo() {
  if (props.disabled || !redoStack.value.length) return;
  undoStack.value.push(snapshot());
  applyState(redoStack.value.pop()!);
}

function handleKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key !== "z" && key !== "y") return;
  event.preventDefault();
  if (key === "y" || event.shiftKey) redo();
  else undo();
}

function selectSegment(index: number, event?: MouseEvent) {
  const clip = clips.value[index];
  if (props.disabled || !clip) return;
  let time = clip.offset;
  if (event?.detail) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    time += clip.length * Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }
  seekAt(time);
}

function seekTimeline(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  seekAt((event.clientX - rect.left) / rect.width * timelineDuration.value);
}

function seekCursor(event: Event) {
  seekAt((event.target as HTMLInputElement).valueAsNumber);
}

function seekAt(time: number) {
  if (props.disabled || !Number.isFinite(time)) return;
  pause();
  playhead.value = Math.min(totalDuration.value, Math.max(0, time));
  seekPlayer();
}

function seekPlayer() {
  const index = clips.value.findIndex(clip => clip.offset + clip.length > playhead.value);
  selectedIndex.value = playbackClipIndex = index < 0 ? Math.max(0, clips.value.length - 1) : index;
  const clip = clips.value[playbackClipIndex];
  if (!clip) { playbackPartIndex = 0; return; }
  const partIndex = clip.parts.findIndex(part => clip.offset + part.offset + part.length > playhead.value);
  playbackPartIndex = partIndex < 0 ? clip.parts.length - 1 : partIndex;
  const part = clip.parts[playbackPartIndex]!;
  player.value?.seekTo(part.start + playhead.value - clip.offset - part.offset);
}

function splitSegment() {
  const clip = clips.value[selectedIndex.value];
  if (props.disabled || !canSplit.value || !clip) return;
  const left: AudioSegment[] = [];
  const right: AudioSegment[] = [];
  const time = playhead.value - clip.offset;
  for (const part of clip.parts) {
    if (part.offset + part.length <= time) left.push({ start: part.start, end: part.end });
    else if (part.offset >= time) right.push({ start: part.start, end: part.end });
    else {
      const sourceTime = part.start + time - part.offset;
      left.push({ start: part.start, end: sourceTime });
      right.push({ start: sourceTime, end: part.end });
    }
  }
  const next = [...groups.value];
  next.splice(selectedIndex.value, 1, left, right);
  commit(next, selectedIndex.value + 1);
}

function mergeSegment() {
  if (props.disabled || !canMerge.value) return;
  const index = Math.max(0, selectedIndex.value - 1);
  const next = [...groups.value];
  next.splice(index, 2, [...next[index]!, ...next[index + 1]!]);
  commit(next, index);
}

function removeSegment() {
  if (props.disabled || !activeSegment.value) return;
  const next = groups.value.filter((_, index) => index !== selectedIndex.value);
  const index = Math.max(0, Math.min(selectedIndex.value, next.length - 1));
  const time = clips.value.slice(0, index).reduce((total, clip) => total + clip.length, 0);
  commit(next, index, time);
}

function startPlayback() {
  if (props.disabled || !valid.value) return pause();
  if (playhead.value >= totalDuration.value) playhead.value = 0;
  seekPlayer();
}

function updatePlayback(time: number | undefined) {
  const clip = clips.value[playbackClipIndex];
  const part = clip?.parts[playbackPartIndex];
  if (!clip || !part || time === undefined || !Number.isFinite(time)) return;
  playhead.value = clip.offset + part.offset + Math.min(part.length, Math.max(0, time - part.start));
  if (!player.value?.playing || time < part.end) return;
  // ACT: 复用播放器帧更新跳过已删除片段；试听切点受帧率限制，导出由 FFmpeg 精确裁剪。
  let next = clip.parts[++playbackPartIndex];
  if (!next) {
    next = clips.value[++playbackClipIndex]?.parts[0];
    playbackPartIndex = 0;
  }
  if (!next) return pause();
  selectedIndex.value = playbackClipIndex;
  player.value.seekTo(next.start);
}
</script>

<style scoped lang="scss">
.audioClipEditor {
  min-width: 0;
  :deep(.audioPlayer .waveformPanel .waveformTrack) { height: 148px; }
  .timeline {
    position: absolute; inset: 0;
    .timeRuler {
      position: relative; height: 28px; cursor: crosshair;
      span { position: absolute; top: 2px; transform: translateX(-50%); color: var(--el-text-color-secondary); font-size: 10px; font-variant-numeric: tabular-nums; &::after { content: ""; position: absolute; top: 17px; left: 50%; height: 6px; border-left: 1px solid var(--el-border-color); } &:first-child { transform: none; } &:last-child { transform: translateX(-100%); } }
    }
    .segmentTrack {
      position: relative; height: 120px;
      .segmentItem {
        position: absolute; top: 0; bottom: 0; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 8px 10px; border: 1px solid var(--el-color-primary-light-5); border-radius: 4px; text-align: left; color: var(--el-color-primary); background: var(--el-color-primary-light-9); cursor: pointer;
        .segmentName, .segmentDuration { position: relative; z-index: 1; max-width: 100%; overflow: hidden; white-space: nowrap; font-size: 11px; }
        .segmentWaveform { position: absolute; top: 30px; left: 0; width: 100%; height: 58px; fill: currentColor; opacity: 0.5; pointer-events: none; }
        &.selected { border: 2px solid var(--el-color-primary); background: var(--el-color-primary-light-8); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -3px; } &:disabled { cursor: default; opacity: 0.65; }
      }
    }
    .playhead { position: absolute; top: 22px; bottom: 0; width: 1px; background: var(--el-color-danger); pointer-events: none; &::before { content: ""; position: absolute; top: -4px; left: -4px; width: 9px; height: 9px; background: inherit; clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%); } }
    .cursorInput {
      position: absolute; inset: 0 -6px; width: calc(100% + 12px); height: 100%; margin: 0; opacity: 0; appearance: none; pointer-events: none; touch-action: none;
      // ACT: 仅游标附近的滑块接收拖动，其余区域用于选择片段。
      &::-webkit-slider-thumb { appearance: none; width: 12px; height: 148px; pointer-events: auto; cursor: ew-resize; }
      &::-moz-range-thumb { width: 12px; height: 148px; border: 0; pointer-events: auto; cursor: ew-resize; }
      &:disabled::-webkit-slider-thumb, &:disabled::-moz-range-thumb { pointer-events: none; }
    }
    &:has(.cursorInput:focus-visible) { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
  }
  .editActions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 12px; .el-button { margin: 0; } }
}
</style>
