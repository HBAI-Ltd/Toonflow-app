<template>
  <audioClipEditor v-if="tool.id === 'audioClip' || tool.id === 'audioSplit'" ref="clipEditor" v-model="segments" v-model:pcmOptions="pcmOptions"
    :splitOutputs="tool.id === 'audioSplit'" :src="src" :mimeType="source.mimeType" />
  <div v-else class="effectEditor">
    <div class="sourceHeader">
      <strong>{{ tool.id === 'audioMerge' ? playingTrack?.name || translate('当前素材') : '原声' }}</strong>
      <span v-if="resultDuration" class="resultLength">处理后约 {{ resultDuration }} 秒</span>
    </div>
    <audioPlayer ref="original" v-model:pcmOptions="pcmOptions" :src="playingTrack ? selectedTrack.src.value : src" :mimeType="playingTrack ? undefined : source.mimeType"
      :label="playingTrack?.name || translate('节点音频')" seekOnWaveform @play="sample?.pause()">
      <template v-if="replacing && duration" #overlay><span class="selectionBand" :style="{ left: range[0] / duration * 100 + '%', width: (range[1] - range[0]) / duration * 100 + '%' }" /></template>
    </audioPlayer>
    <p v-if="selectedTrack.error.value" class="errorText" role="alert">{{ selectedTrack.error.value }}</p>
    <div v-if="replacing && duration" class="replaceRange">
      <audio v-if="selectedTrack.src.value" :key="selectedTrack.src.value" :src="selectedTrack.src.value" hidden preload="metadata" @loadedmetadata="readRecordingDuration" />
      <div class="controlHeader"><strong>替换范围</strong><span>{{ range[0].toFixed(2) }} – {{ range[1].toFixed(2) }} 秒</span></div>
      <el-slider range :modelValue="range" :min="0" :max="duration" :step="0.01" startLabel="替换起点" endLabel="替换终点" @input="setRange" />
      <div class="presets">
        <el-button v-if="recordingDuration" size="small" @click="matchRecording(original?.currentTime ?? 0)">从游标匹配补录时长</el-button>
        <el-button size="small" @click="setBoundary(false)">游标设为起点</el-button>
        <el-button size="small" @click="setBoundary(true)">游标设为终点</el-button>
      </div>
      <small>补录会调整语速以贴合选区，后续对白保持同步。</small>
    </div>
    <div v-else-if="fields.length" class="parameters">
      <div v-if="presets.length" class="presets" role="group" :aria-label="tool.label">
        <el-button v-for="preset in presets" :key="preset.label" size="small" :type="preset.selected ? 'primary' : 'default'"
          :aria-pressed="preset.selected" @click="emit('updateValues', preset.values)">{{ translate(preset.label) }}</el-button>
      </div>
      <component :is="presets.length ? 'details' : 'div'" class="fineControls">
        <summary v-if="presets.length">微调参数</summary>
        <div v-for="field in fields" :key="field.key" class="control">
          <div class="controlHeader">
            <span>{{ field.label }}</span>
            <el-input-number size="small" :modelValue="typeof values[field.key] === 'number' ? Number(values[field.key]) : undefined" controlsPosition="right"
              :min="field.min" :max="limit(field)" :step="field.step" :aria-label="field.label" @update:modelValue="value => emit('updateValues', { [field.key]: value ?? '' })" />
          </div>
          <el-slider :modelValue="Number(values[field.key]) || 0" :min="field.min" :max="limit(field)" :step="field.step" :aria-label="field.label"
            @input="value => emit('updateValues', { [field.key]: Number(value) })" />
        </div>
      </component>
    </div>
    <p v-if="invalid" class="errorText" role="alert">{{ invalid }}</p>
    <div v-if="(fields.length || tool.id === 'audioReverse') && tool.id !== 'remove-silence'" class="audition">
      <div class="auditionHeader">
        <el-button :icon="IconHeadphones" :loading="rendering" :disabled="!canRun || rendering" @click="audition">试听效果</el-button>
        <span>{{ auditionHint }}</span>
      </div>
      <audio v-if="sampleUrl" ref="sample" :src="sampleUrl" controls controlslist="nodownload" aria-label="处理效果试听" @play="original?.pause()" />
      <p v-if="previewError" class="errorText" role="alert">{{ previewError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onScopeDispose, ref, watch, type Ref } from "vue";
import { ElButton, ElInputNumber, ElSlider } from "element-plus";
import { IconHeadphones } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";
import { useNodeFfmpeg, useNodeFiles, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolAttachment, ToolField } from "@toonflow/node-shared/mediaTools";
import { useMediaToolAttachment } from "@toonflow/node-shared/useMediaToolAttachment";
import { getPcmOptions, isPcmMimeType, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import { renderAudioEffect } from "../audioEffects";
import type { AudioSegment } from "../audioProcessing";
import audioClipEditor from "./audioClipEditor.vue";
import audioPlayer from "./audioPlayer.vue";

const props = withDefaults(defineProps<{
  tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number>; attachments?: MediaToolAttachment[]; previewIndex?: number;
}>(), { attachments: () => [], previewIndex: 0 });
const emit = defineEmits<{ updateValues: [changes: Record<string, string | number>]; ready: [value: boolean] }>();
const pcmOptions = inject<Ref<Partial<PcmOptions>>>("audioEffectPcm", ref({}));
const files = useNodeFiles();
const loadFfmpeg = useNodeFfmpeg();
const original = ref<InstanceType<typeof audioPlayer>>();
const clipEditor = ref<InstanceType<typeof audioClipEditor>>();
const segments = ref<AudioSegment[]>([]);
const fields = computed(() => (props.tool.fields ?? []).filter(field => field.type === "number"));
const replacing = computed(() => props.tool.id === "replaceDialogue");
const playingTrack = computed(() => props.tool.id === "audioMerge" ? props.attachments[props.previewIndex - 1] : undefined);
const selectedTrack = useMediaToolAttachment(() => replacing.value ? props.attachments[0] : playingTrack.value);
const recordingDuration = ref(0);
const sampleUrl = ref("");
const sample = ref<HTMLAudioElement>();
const rendering = ref(false);
const previewError = ref("");
let controller: AbortController | undefined;
let sampleStart = 0;
const duration = computed(() => original.value?.duration ?? 0);
const previewStart = computed(() => {
  const playhead = original.value?.currentTime ?? 0;
  if (replacing.value) return Math.max(0, range.value[0] - 0.8);
  if (props.tool.id === "audioSpeed") return playhead / Number(props.values.speed);
  if (props.tool.id === "audioReverse" && playhead > 0) return Math.max(0, duration.value - playhead);
  if (previewFadeEnd.value) return Math.max(0, duration.value - 8);
  return playhead;
});
const previewFadeEnd = computed(() => props.tool.id === "audioFade" && Number(props.values.fadeIn) === 0 && Number(props.values.fadeOut) > 0 && !original.value?.currentTime);
const auditionHint = computed(() => {
  if (replacing.value) return translate("试听替换处，最长 8 秒");
  if (previewFadeEnd.value) return translate("试听结尾淡出，最长 8 秒");
  if (props.tool.id === "audioReverse") return translate("试听倒放效果，最长 8 秒");
  return translate("从波形游标处试听，最长 8 秒");
});
function fitFade(values: Record<string, number | string>) {
  const fadeIn = Number(values.fadeIn), fadeOut = Number(values.fadeOut);
  const total = fadeIn + fadeOut;
  if (!duration.value || total <= duration.value) return values;
  const scale = duration.value / total;
  return { fadeIn: Math.floor(fadeIn * scale * 1000) / 1000, fadeOut: Math.floor(fadeOut * scale * 1000) / 1000 };
}
const presets = computed(() => (props.tool.presets ?? []).map(preset => {
  const values = props.tool.id === "audioFade" ? fitFade(preset.values) : preset.values;
  return { label: preset.label, values, selected: Object.entries(values).every(([key, value]) => props.values[key] === value) };
}));
const range = computed<[number, number]>(() => [Number(props.values.start) || 0, Math.min(Number(props.values.end) || 0, duration.value)]);
function setRange(value: number | number[]) {
  if (Array.isArray(value) && value.length === 2) emit("updateValues", { start: value[0]!, end: value[1]! });
}
function matchRecording(cursor: number) {
  const length = Math.min(recordingDuration.value, duration.value);
  const start = Math.min(cursor, duration.value - length);
  setRange([start, Math.min(duration.value, start + length)]);
}
function readRecordingDuration(event: Event) {
  const length = (event.currentTarget as HTMLAudioElement).duration;
  if (!length || !Number.isFinite(length)) return;
  recordingDuration.value = length;
  matchRecording(range.value[0]);
}
function setBoundary(end: boolean) {
  const cursor = Math.round((original.value?.currentTime ?? 0) * 100) / 100;
  setRange(end ? [range.value[0], Math.max(range.value[0], cursor)] : [Math.min(range.value[1], cursor), range.value[1]]);
}
const invalid = computed(() => {
  if (props.tool.id === "audioFade" && duration.value && Number(props.values.fadeIn) + Number(props.values.fadeOut) > duration.value + 0.001) return translate("淡入和淡出时长之和超过了音频时长");
  if (replacing.value && recordingDuration.value) {
    const ratio = recordingDuration.value / (range.value[1] - range.value[0]);
    if (ratio < 0.5 || ratio > 2) return translate("补录时长与选区相差超过两倍，请调整选区或裁剪补录音频");
  }
  return "";
});
const canRun = computed(() => {
  if (props.tool.id === "audioClip") return !!clipEditor.value?.valid;
  if (props.tool.id === "audioSplit") return !!clipEditor.value?.valid && segments.value.length > 1;
  if (isPcmMimeType(props.source.mimeType) && !getPcmOptions(pcmOptions.value)) return false;
  if (props.tool.accept && !props.attachments.length) return false;
  if (props.tool.id === "audioFade" && !duration.value) return false;
  if (replacing.value) return !invalid.value && !!duration.value && range.value[1] > range.value[0] && Number(props.values.end) <= duration.value;
  return !invalid.value && fields.value.every(field => typeof props.values[field.key] === "number" && Number.isFinite(props.values[field.key]));
});
const resultDuration = computed(() => {
  if (!duration.value) return "";
  if (props.tool.id === "audioSpeed") return (duration.value / Number(props.values.speed)).toFixed(2);
  if (props.tool.id === "audioLoop") return (duration.value * Number(props.values.count)).toFixed(2);
  return "";
});

function limit(field: ToolField) {
  if (props.tool.id === "audioFade" && duration.value) return Math.min(field.max!, duration.value);
  return field.max;
}

function clearSample() {
  controller?.abort();
  controller = undefined;
  rendering.value = false;
  previewError.value = "";
  sample.value?.pause();
  if (sampleUrl.value) URL.revokeObjectURL(sampleUrl.value);
  sampleUrl.value = "";
}

async function audition() {
  original.value?.pause();
  const start = previewStart.value;
  if (sample.value && sampleUrl.value && start === sampleStart) {
    sample.value.currentTime = 0;
    await sample.value.play().catch(() => {});
    return;
  }
  clearSample();
  const current = controller = new AbortController();
  rendering.value = true;
  const folder = `assets/${crypto.randomUUID()}`;
  let scratch: ReturnType<typeof files.getWorkspaceFiles> | undefined;
  try {
    const workspace = files.getWorkspaceFiles();
    const ffmpeg = await loadFfmpeg(current.signal);
    current.signal.throwIfAborted();
    await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    await workspace.mkdir(folder);
    scratch = workspace;
    const target = `${folder}/sample.wav`;
    const attachments: string[] = [];
    for (const [index, item] of props.attachments.entries()) {
      if (!(item instanceof File)) { attachments.push(item.path); continue; }
      const ext = item.name.match(/\.[a-z\d]{1,10}$/i)?.[0] ?? "";
      const path = `${folder}/input${index}${ext}`;
      await workspace.write(path, item, true);
      attachments.push(path);
    }
    await renderAudioEffect(ffmpeg, { tool: props.tool, source: props.source.url, values: { ...props.values }, target,
      pcm: isPcmMimeType(props.source.mimeType) ? getPcmOptions(pcmOptions.value) : undefined, attachments, signal: current.signal, previewStart: start });
    const audio = await workspace.read(target);
    current.signal.throwIfAborted();
    sampleStart = start;
    sampleUrl.value = URL.createObjectURL(new Blob([audio], { type: "audio/wav" }));
    await nextTick();
    if (!current.signal.aborted) await sample.value?.play().catch(() => {});
  } catch (error) {
    if (!current.signal.aborted) previewError.value = error instanceof Error ? error.message : "试听生成失败";
  } finally {
    if (scratch) await scratch.remove(folder, true).catch(error => showNodeError(error, "临时试听清理失败"));
    if (controller === current) rendering.value = false;
  }
}

watch(canRun, value => emit("ready", value), { immediate: true });
watch(segments, value => emit("updateValues", props.tool.id === "audioSplit"
  ? { cuts: JSON.stringify(value.slice(1).map(part => part.start)) } : { segments: JSON.stringify(value) }), { deep: true });
watch(() => props.attachments, clearSample);
watch(() => selectedTrack.src.value, () => { recordingDuration.value = 0; }, { flush: "sync" });
watch(duration, length => {
  if (replacing.value && length > 0 && Number(props.values.end) > length) emit("updateValues", { end: length });
  if (props.tool.id === "audioFade" && length > 0) {
    const values = { fadeIn: Number(props.values.fadeIn), fadeOut: Number(props.values.fadeOut) };
    if (values.fadeIn + values.fadeOut > length) emit("updateValues", fitFade(values));
  }
});
watch([() => props.src, () => props.values, pcmOptions], clearSample, { deep: true, flush: "sync" });
onScopeDispose(clearSample);
</script>

<style scoped lang="scss">
.effectEditor {
  display: grid;
  gap: 10px;
  .sourceHeader, .controlHeader, .auditionHeader, .presets { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .sourceHeader {
    justify-content: space-between;
    strong { font-weight: 600; overflow-wrap: anywhere; }
    .resultLength { color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; }
  }
  .parameters {
    display: grid;
    gap: 12px;
    margin-top: 4px;
    .presets { gap: 6px; .el-button { margin: 0; } }
    .fineControls {
      summary { cursor: pointer; width: fit-content; font-size: 13px; color: var(--el-text-color-regular); }
      summary + .control, .control + .control { margin-top: 10px; }
      .control {
        min-width: 0;
        .controlHeader { justify-content: space-between; .el-input-number { width: 108px; } }
        .el-slider { width: calc(100% - 14px); margin: 0 7px; }
      }
    }
  }
  .selectionBand { position: absolute; inset-block: 0; pointer-events: none; background: var(--el-color-primary-light-8); opacity: 0.45; border-inline: 1px solid var(--el-color-primary); }
  .replaceRange {
    display: grid; gap: 6px;
    .presets { gap: 6px; .el-button { margin: 0; } }
    .controlHeader { justify-content: space-between; font-variant-numeric: tabular-nums; }
    .el-slider { margin-inline: 7px; width: calc(100% - 14px); }
    small { color: var(--el-text-color-regular); }
  }
  .audition {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 12px;
    .auditionHeader span { font-size: 12px; color: var(--el-text-color-regular); }
    audio { display: block; width: 100%; height: 34px; margin-top: 10px; }
  }
  .errorText { margin: 0; font-size: 13px; color: var(--el-color-danger); }
}
</style>
