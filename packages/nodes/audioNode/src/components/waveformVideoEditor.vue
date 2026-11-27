<template>
  <div class="waveformVideoEditor">
    <div class="videoFrame">
      <img v-if="background.src.value" :src="background.src.value" alt="" />
      <svg v-if="wavePath" viewBox="0 0 480 100" preserveAspectRatio="none" aria-hidden="true">
        <path :d="wavePath" :stroke="String(values.color)" />
      </svg>
    </div>
    <p v-if="background.error.value" class="previewError" role="alert">{{ background.error.value }}</p>
    <label class="waveColor">波形颜色<input type="color" :value="values.color" @input="changeColor" /></label>
    <audioPlayer ref="player" v-model:pcmOptions="pcmOptions" :src="src" :mimeType="source.mimeType" seekOnWaveform @decoded="samples = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, shallowRef, watch, type Ref } from "vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import { getPcmOptions, isPcmMimeType, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { useMediaToolAttachment } from "@toonflow/node-shared/useMediaToolAttachment";
import audioPlayer from "./audioPlayer.vue";

const props = defineProps<{ src: string; source: NodeMediaValue; values: Record<string, string | number>; attachments: MediaToolAttachment[] }>();
const emit = defineEmits<{ updateValues: [changes: { color: string }]; ready: [value: boolean] }>();
const pcmOptions = inject<Ref<Partial<PcmOptions>>>("audioEffectPcm", ref({}));
const background = useMediaToolAttachment(() => props.attachments[0]);
const player = ref<InstanceType<typeof audioPlayer>>();
const samples = shallowRef<AudioBuffer>();
const channels = computed(() => {
  const buffer = samples.value;
  return buffer ? Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel)) : [];
});
const frame = computed(() => Math.floor((player.value?.currentTime ?? 0) * 25));
const wavePath = computed(() => {
  const buffer = samples.value;
  const tracks = channels.value;
  if (!buffer || !tracks.length) return "";
  // ACT: 预览每帧取 40 毫秒，用 480 列绘制居中波形。导出由 FFmpeg 按 1280 像素绘制。
  const length = Math.min(buffer.length, Math.ceil(buffer.sampleRate / 25));
  const start = Math.min(buffer.length - length, Math.round(frame.value * buffer.sampleRate / 25));
  const path: string[] = [];
  for (let x = 0; x < 480; x++) {
    const from = start + Math.floor(x * length / 480);
    const end = start + Math.ceil((x + 1) * length / 480);
    let peak = 0;
    for (let index = from; index < end; index++) {
      let mono = 0;
      for (const track of tracks) mono += track[index]!;
      peak = Math.max(peak, Math.abs(mono / tracks.length));
    }
    const height = Math.min(100, Math.round(peak * 100));
    if (height) path.push(`M${x + 0.5} ${50 - height / 2}v${height}`);
  }
  return path.join("");
});

function changeColor(event: Event) {
  emit("updateValues", { color: (event.currentTarget as HTMLInputElement).value });
}

watch(() => !background.error.value && (!isPcmMimeType(props.source.mimeType) || !!getPcmOptions(pcmOptions.value)),
  value => emit("ready", value), { immediate: true });
</script>

<style scoped lang="scss">
.waveformVideoEditor {
  display: grid; gap: 12px; min-width: 0;
  .videoFrame {
    position: relative; width: min(100%, 480px); aspect-ratio: 16 / 9; justify-self: center; overflow: hidden;
    border-radius: var(--el-border-radius-base); background: #172028;
    img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    svg { position: absolute; inset: 25% 0; width: 100%; height: 50%; }
  }
  .waveColor { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--el-text-color-primary);
    input { width: 48px; height: 30px; padding: 2px; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); background: var(--el-fill-color-blank); cursor: pointer; }
  }
  .previewError { margin: 0; color: var(--el-color-danger); }
}
</style>
