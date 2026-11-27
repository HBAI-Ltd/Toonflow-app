<template>
  <div class="enhanceEditor">
    <videoPlayer v-show="!frameUrl" class="sourceVideo" :src="src" readOnly :inert="!!capturing" label="原视频预览"
      @loadedmetadata="video = $event.target as HTMLVideoElement" @ready="playable = $event" />
    <div v-if="!interpolate" class="frameActions">
      <span>{{ frameUrl ? '当前帧 · ' + frameTime.toFixed(2) + ' 秒' : '拖动播放头，选择要查看细节的画面' }}</span>
      <el-button v-if="frameUrl" size="small" @click="closeFrame">返回视频</el-button>
      <el-button v-else size="small" :loading="!!capturing" :disabled="!playable || !width || seeking || oversized" @click="capture">查看当前帧细节</el-button>
    </div>
    <p v-if="frameError" role="alert">{{ frameError }}</p>
    <imageUpscaleEditor v-if="frameUrl" :src="frameUrl" :values="values" videoFrame @updateValues="emit('updateValues', $event)" />
    <videoScaleOptions :label="scaleLabel" :options="scales" :modelValue="factor" :isDisabled="scaleDisabled"
      @update:modelValue="emit('updateValues', { [key]: $event })">
      <template v-if="interpolate && fps" #default="{ option }">{{ displayRate(fps * option) }}</template>
    </videoScaleOptions>
    <p v-if="readError || oversized" role="alert">{{ readError || '输出画面过大，请降低倍率或先裁剪原片。' }}</p>
    <p v-else-if="width && height">
      {{ interpolate ? `帧率　${displayRate(fps)} → ${displayRate(fps * factor)} 帧/秒` : `画面　${width} × ${height} → ${outputWidth} × ${outputHeight} 像素` }}
    </p>
    <p v-else role="status">正在读取原片参数…</p>
    <p v-if="!interpolate" class="modelHint">Real-ESRGAN 以 4 倍增强细节，2 倍和 3 倍按目标尺寸缩小。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { useNodeFfmpeg, useNodeFiles, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { probeMedia, runCommand } from "@toonflow/node-shared/mediaCommands";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { fitsUpscaleSize, upscaleScales } from "@toonflow/node-image/upscaleTiles";
import imageUpscaleEditor from "@toonflow/node-image/imageUpscaleEditor";
import videoPlayer from "./videoPlayer.vue";
import videoScaleOptions, { interpolationFactors } from "./videoScaleOptions.vue";
import { videoFrameRate } from "../videoToolJob";

const props = defineProps<{ tool: MediaTool; src: string; source: NodeMediaValue; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [value: boolean] }>();
const ffmpeg = useNodeFfmpeg();
const files = useNodeFiles();
const interpolate = computed(() => props.tool.id === "rifeInterpolation");
const scaleLabel = computed(() => interpolate.value ? translate("每秒画面数") : translate("放大倍数"));
const scales = computed(() => interpolate.value ? interpolationFactors : upscaleScales);
const key = computed(() => interpolate.value ? "factor" : "scale");
const factor = computed(() => Number(props.values[key.value]));
const width = ref(0), height = ref(0), fps = ref(0), readError = ref("");
function scaleDisabled(option: number) {
  return !interpolate.value && !!width.value && !fitsUpscaleSize(width.value, height.value, option);
}
const outputWidth = computed(() => Math.ceil(width.value * factor.value / 2) * 2);
const outputHeight = computed(() => Math.ceil(height.value * factor.value / 2) * 2);
const oversized = computed(() => !interpolate.value && !fitsUpscaleSize(width.value, height.value, factor.value));
const displayRate = (value: number) => Number(value.toFixed(2));
const video = shallowRef<HTMLVideoElement>();
const playable = ref(false), seeking = ref(false), frameUrl = ref(""), frameError = ref(""), frameTime = ref(0);
const capturing = shallowRef<AbortController>();

function closeFrame() {
  capturing.value?.abort();
  capturing.value = undefined;
  if (frameUrl.value) URL.revokeObjectURL(frameUrl.value);
  frameUrl.value = frameError.value = "";
}
onScopeDispose(closeFrame);
watch(() => props.src, closeFrame);
watch(video, (el, _, cleanup) => {
  if (!el) return;
  const sync = () => { seeking.value = el.seeking; };
  sync();
  el.addEventListener("seeking", sync);
  el.addEventListener("seeked", sync);
  cleanup(() => { el.removeEventListener("seeking", sync); el.removeEventListener("seeked", sync); });
});

// 兼容预览已转码，非方形像素也可能被浏览器缩放。这两种情况直接从源文件读取选中帧。
async function decodeSourceFrame(time: number, signal: AbortSignal) {
  const workspace = files.getWorkspaceFiles();
  const path = `assets/${crypto.randomUUID()}.png`;
  await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
  const command = (await ffmpeg(signal))(props.source.url).seekInput(time).inputOptions("-noaccurate_seek")
    .outputOptions("-copyts", "-start_at_zero", "-map", "0:V:0", "-frames:v", "1", "-update", "1")
    .videoFilters(`setpts=PTS-${time}/TB,fps=1:start_time=0:round=up:eof_action=pass`).output(path);
  try {
    await runCommand(command, signal);
    return new Blob([await workspace.read(path)], { type: "image/png" });
  } finally {
    await workspace.remove(path).catch(error => { if (error?.response?.data?.data?.code !== "ENOENT") showNodeError(error, "临时视频帧清理失败"); });
  }
}

async function capture() {
  const el = video.value;
  if (!el || !playable.value || el.seeking || capturing.value || oversized.value) return;
  el.pause();
  const controller = capturing.value = new AbortController();
  frameTime.value = el.currentTime;
  frameError.value = "";
  try {
    let blob: Blob;
    if (el.currentSrc === new URL(props.src, document.baseURI).href && el.videoWidth === width.value && el.videoHeight === height.value) {
      const canvas = document.createElement("canvas");
      canvas.width = el.videoWidth;
      canvas.height = el.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("无法读取当前视频帧");
      context.drawImage(el, 0, 0);
      try {
        blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("视频帧读取失败")), "image/png"));
      } finally { canvas.width = canvas.height = 0; }
    } else {
      blob = await decodeSourceFrame(Math.max(0, Math.min(el.currentTime, el.duration - 0.0001)), controller.signal);
    }
    controller.signal.throwIfAborted();
    frameUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    if (!controller.signal.aborted) frameError.value = error instanceof Error ? error.message : "无法读取当前视频帧";
  } finally { if (capturing.value === controller) capturing.value = undefined; }
}

watch(() => props.source.url, async (path, _, cleanup) => {
  const controller = new AbortController();
  cleanup(() => controller.abort());
  width.value = height.value = fps.value = 0;
  readError.value = "";
  try {
    const media = await probeMedia(await ffmpeg(controller.signal), path, controller.signal);
    controller.signal.throwIfAborted();
    const stream = media.streams.find(item => item.codec_type === "video" && !item.disposition?.attached_pic);
    if (!stream?.width || !stream.height) throw new Error("无法读取视频画面尺寸");
    const swap = Math.abs(Number(stream.side_data_list?.find((item: { rotation?: number }) => item.rotation !== undefined)?.rotation ?? stream.tags?.rotate ?? 0) % 180) === 90;
    const rate = videoFrameRate(stream)?.fps;
    if (interpolate.value && !rate) throw new Error("无法读取视频帧率");
    fps.value = rate ?? 0;
    width.value = swap ? stream.height : stream.width;
    height.value = swap ? stream.width : stream.height;
  } catch (error) {
    if (!controller.signal.aborted) readError.value = error instanceof Error ? error.message : "无法读取原片参数";
  }
}, { immediate: true });
watch(() => !!width.value && !!height.value && !oversized.value, value => emit("ready", value), { immediate: true });
</script>

<style scoped lang="scss">
.enhanceEditor {
  display: grid; gap: 14px;
  .sourceVideo {
    height: auto;
    :deep(.videoPreview) { height: auto; max-height: min(38dvh, 320px); }
    :deep(.videoPreview:fullscreen) { height: 100%; max-height: none; }
    :deep(.playerControls) { position: relative; opacity: 1; pointer-events: auto; background: var(--el-fill-color-light); }
  }
  .frameActions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
  .frameActions, .modelHint { color: var(--el-text-color-regular); font-size: 12px; }
  p { margin: 0; color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; }
  p[role="alert"] { color: var(--el-color-danger); }
}
</style>
