<template>
  <section class="mediaDocument">
    <form v-if="isPcm" class="pcmToolbar" @submit.prevent>
      <label>采样率（Hz）<el-input-number v-model="sampleRate" :min="1" :max="384000" :step="1000" size="small" /></label>
      <label>声道<el-select v-model="channels" size="small"><el-option label="单声道" :value="1" /><el-option label="双声道" :value="2" /></el-select></label>
      <label>采样格式<el-select v-model="format" size="small"><el-option v-for="option in pcmFormats" :key="option.value" :label="option.label" :value="option.value" /></el-select></label>
      <p>PCM 不包含格式信息，请按文件实际参数设置。多声道数据按交错排列读取。</p>
    </form>
    <div class="mediaPreview" :aria-busy="loading || preparing">
      <span v-if="loading || preparing" class="mediaStatus" role="status">{{ preparing ? '正在生成兼容预览…' : '正在读取…' }}</span>
      <div v-else-if="error" class="mediaError" role="alert">{{ error }}</div>
      <template v-else-if="mediaUrl">
        <p v-if="!isVideo" class="audioLabel">{{ context.resource.label }}</p>
        <component :is="isVideo ? 'video' : 'audio'" :key="mediaUrl" ref="player" :src="mediaUrl" controls playsinline preload="auto" :aria-label="context.resource.label" @loadeddata="handleLoaded" @error="handleError" />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { ElInputNumber, ElOption, ElSelect } from "element-plus";
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";
import { pcmFormats, pcmToWav, type PcmFormat } from "@toonflow/node-shared/pcmPreview";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";

const props = defineProps<{ context: ExtContext }>();
const suffix = computed(() => props.context.resource.path.split(".").at(-1)?.toLowerCase());
const isVideo = computed(() => suffix.value === "mp4");
const isPcm = computed(() => suffix.value === "pcm");
const player = ref<HTMLMediaElement>();
const fileUrl = ref("");
const pcmUrl = ref("");
const pcmData = shallowRef<ArrayBuffer>();
const { src: mediaUrl, preparing, error: playbackError, handleError, handleLoaded } = useMediaPreview(() => isPcm.value ? pcmUrl.value : fileUrl.value, () => isVideo.value ? "video" : "audio");
const loading = ref(false);
const readError = ref("");
const pcmError = ref("");
const error = computed(() => readError.value || pcmError.value || playbackError.value);
const sampleRate = ref(24000);
const channels = ref(1);
const format = ref<PcmFormat>("s16le");

function stopPlayback() {
  player.value?.pause();
  player.value?.removeAttribute("src");
  player.value?.load();
}

watch(() => props.context.active, active => { if (!active) player.value?.pause(); });
onBeforeUnmount(stopPlayback);

watch(() => [props.context.resource.directory, props.context.resource.path], async (_resource, _previous, onCleanup) => {
  let cancelled = false;
  let shared: ReturnType<ExtContext["files"]["acquireUrl"]> | undefined;
  onCleanup(() => { cancelled = true; stopPlayback(); shared?.release(); });
  stopPlayback();
  fileUrl.value = "";
  pcmData.value = undefined;
  readError.value = "";
  playbackError.value = "";
  loading.value = true;
  try {
    const path = props.context.resource.path;
    if (isPcm.value) {
      const data = await props.context.files.read(path);
      if (!cancelled) pcmData.value = data;
    } else {
      const mimeType = isVideo.value ? "video/mp4" : suffix.value === "mp3" ? "audio/mpeg" : suffix.value === "opus" ? "audio/ogg" : "audio/wav";
      shared = props.context.files.acquireUrl(path, mimeType);
      const url = await shared.url;
      if (!cancelled) fileUrl.value = url;
    }
  } catch (reason) {
    if (!cancelled) readError.value = reason instanceof Error ? reason.message : "媒体读取失败";
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });

watch([pcmData, sampleRate, channels, format], ([data, rate, count, sampleFormat], _previous, onCleanup) => {
  stopPlayback();
  pcmUrl.value = "";
  pcmError.value = "";
  playbackError.value = "";
  if (!data) return;
  try {
    const url = URL.createObjectURL(pcmToWav(data, { sampleRate: rate, channels: count, format: sampleFormat }));
    pcmUrl.value = url;
    onCleanup(() => { stopPlayback(); URL.revokeObjectURL(url); });
  } catch (reason) {
    pcmError.value = reason instanceof Error ? reason.message : "PCM 预览失败";
  }
});
</script>

<style scoped lang="scss">
.mediaDocument {
  display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0;
  .pcmToolbar {
    display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-lighter);
    label {
      display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--el-text-color-primary);
      .el-select { width: 170px; }
    }
    p { flex-basis: 100%; margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
  }
  .mediaPreview {
    display: flex; flex: 1; min-height: 0; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; overflow: auto;
    video { display: block; max-width: 100%; max-height: 100%; background: #000; }
    audio { width: min(100%, 640px); flex-shrink: 0; }
    .audioLabel { max-width: 100%; margin: 0; overflow-wrap: anywhere; color: var(--el-text-color-primary); }
    .mediaStatus { color: var(--el-text-color-secondary); font-size: 14px; }
    .mediaError { max-width: 640px; overflow-wrap: anywhere; color: var(--el-color-danger); font-size: 14px; }
  }
}
</style>
