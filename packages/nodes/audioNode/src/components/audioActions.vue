<template>
  <mediaToolDialog ref="toolDialog" :file="file" :src="src" :disabled="disabled" :run="runTool" />
</template>

<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { t } from "@toonflow/i18n/vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolRunner, MediaToolSelection } from "@toonflow/node-shared/mediaTools";
import mediaToolDialog from "@toonflow/node-shared/mediaToolDialog";
import { getPcmOptions, isPcmMimeType, pcmToWav, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { audioSourceTools, runAudioSourceTool } from "@toonflow/node-video/soundTools";
import { audioEffects, audioGroups, clipTool, renderAudioEffect, speedTool, splitTool } from "../audioEffects";
import { audioPresets } from "../audioPresets";
import { processAudio, splitAudio, type AudioSegment } from "../audioProcessing";
import { processSpeechTool, separateAudio, separationTool, speechTools } from "../audioSeparation";
import audioEffectEditor from "./audioEffectEditor.vue";
import waveformVideoEditor from "./waveformVideoEditor.vue";

const props = defineProps<{ file?: NodeMediaValue; src: string; disabled?: boolean }>();
const pcmOptions = defineModel<Partial<PcmOptions>>("pcmOptions", { default: () => ({}) });
provide("audioEffectPcm", pcmOptions);
const toolDialog = ref<InstanceType<typeof mediaToolDialog>>();
const processing = computed(() => !!toolDialog.value?.busy);
const emit = defineEmits<{ pause: [] }>();
function withAudioEditor(tool: MediaTool): MediaTool {
  const presets = tool.presets ?? audioPresets[tool.id]?.map(([label, values]) => ({ label, values }));
  return { ...tool, presets, editor: audioEffectEditor };
}
const tools = computed<MediaTool[]>(() => [
  ...audioEffects.map(withAudioEditor),
  ...audioSourceTools.map(tool => tool.id === "remove-silence" ? { ...tool, group: audioGroups.timeline, editor: audioEffectEditor }
    : tool.id === "audio-waveform-video" ? { ...tool, editor: waveformVideoEditor } : tool),
  separationTool, ...speechTools,
]);

const runTool: MediaToolRunner = async (id, context) => {
  const pcm = isPcmMimeType(context.source.mimeType) ? getPcmOptions(pcmOptions.value) : undefined;
  if (isPcmMimeType(context.source.mimeType) && !pcm) throw new Error("请先在音频播放器中填写 PCM 采样率、声道数和采样格式");
  if (id === separationTool.id) return separateAudio(context, pcm);
  if (speechTools.some(tool => tool.id === id)) return processSpeechTool(id, context, pcm);
  if (audioSourceTools.some(tool => tool.id === id)) {
    if (!pcm) return runAudioSourceTool(id, context);
    const url = `${context.outputDirectory}/source.wav`;
    const bytes = await context.workspace.read(context.source.url);
    context.signal.throwIfAborted();
    await context.workspace.write(url, pcmToWav(bytes, pcm), true);
    return runAudioSourceTool(id, { ...context, source: { url, mimeType: "audio/wav" } });
  }
  const ffmpeg = await context.ffmpeg();
  if (id === splitTool.id) return splitAudio(ffmpeg, context, pcm);
  if (id === "audioClip" || id === "audioSpeed") {
    const path = `${context.outputDirectory}/audio.mp3`;
    const options = id === "audioClip" ? { action: id, segments: JSON.parse(String(context.values.segments)) as AudioSegment[] } as const
      : { action: id, speed: Number(context.values.speed) } as const;
    await processAudio(ffmpeg, context.source.url, { ...options, outputPath: path, pcm }, context.signal);
    return [{ path, mimeType: "audio/mpeg", label: options.action === "audioSpeed" ? t`调整播放速度 · ${options.speed}×` : clipTool.label }];
  }
  const tool = audioEffects.find(tool => tool.id === id);
  if (!tool) throw new Error("未知的音频效果");
  const target = `${context.outputDirectory}/audio.wav`;
  await renderAudioEffect(ffmpeg, { tool, source: context.source.url, values: context.values, target, pcm,
    attachments: context.attachments, reportProgress: context.reportProgress, signal: context.signal });
  return [{ path: target, mimeType: "audio/wav" }];
};

function openTool(choice: MediaToolSelection) {
  if (processing.value || props.disabled) return;
  emit("pause");
  toolDialog.value?.open(choice);
}

function open(id: "audioSpeed" | "audioClip", event: MouseEvent) {
  const tool = [speedTool, clipTool].find(item => item.id === id);
  if (tool && event.currentTarget instanceof HTMLElement) openTool({ tool: withAudioEditor(tool), anchor: event.currentTarget });
}

defineExpose({ open, openTool, processing, audioSourceTools: tools, cancelAndWait: () => toolDialog.value?.cancelAndWait() });
</script>
