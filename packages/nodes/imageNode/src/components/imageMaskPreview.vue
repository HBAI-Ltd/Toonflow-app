<template>
  <div class="maskPreview">
    <el-button v-if="!map" size="small" :loading="loading" :disabled="!source" @click="predict">{{ translate("预览") }}</el-button>
    <canvas v-show="map" ref="preview" aria-label="识别效果预览" />
    <span v-if="error" role="alert">{{ error }}</span>
  </div>
</template>
<script setup lang="ts">
import { onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import { predictParts, renderParts, type PartsOptions } from "../imageParts";

const props = defineProps<{ source?: HTMLImageElement; options: PartsOptions; src: string }>();
const emit = defineEmits<{ selectPart: [part: number] }>();
const model = useNodeModel();
const preview = ref<HTMLCanvasElement>(), map = shallowRef<Awaited<ReturnType<typeof predictParts>>>();
const loading = ref(false), error = ref("");
let frame: ImageData | undefined, job: AbortController | undefined;
let point: { x: number; y: number } | undefined;
function reset() {
  job?.abort(); job = undefined; frame = undefined; point = undefined;
  loading.value = false; error.value = ""; map.value = undefined;
}
watch(() => props.src, reset);
watch(() => props.options, () => { point = undefined; }, { flush: "sync" });
onScopeDispose(reset);
function applyPoint() {
  const prediction = map.value;
  if (!point || !prediction || props.options.operation !== "animeMask") return;
  const x = Math.max(0, Math.min(prediction.sw - 1, Math.floor(point.x * prediction.sw)));
  const y = Math.max(0, Math.min(prediction.sh - 1, Math.floor(point.y * prediction.sh)));
  emit("selectPart", prediction.map[y * prediction.w + x]!);
  point = undefined;
}
function pickPart(x: number, y: number) {
  point = { x, y };
  if (map.value) applyPoint();
  else void predict();
}
defineExpose({ pickPart });
async function predict() {
  const image = props.source, canvas = preview.value;
  if (!image || !canvas || job || map.value) return;
  const controller = job = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    await image.decode();
    controller.signal.throwIfAborted();
    const scale = Math.min(1, 384 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("无法显示识别预览");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const value = await predictParts({ width: frame.width, height: frame.height, rgba: frame.data },
      props.options.operation === "lineArt", model.run, controller.signal, 192);
    controller.signal.throwIfAborted();
    map.value = value;
    applyPoint();
  } catch (cause) { if (!controller.signal.aborted) error.value = cause instanceof Error ? cause.message : "预览失败"; }
  finally { if (job === controller) { loading.value = false; job = undefined; } }
}
watch([map, () => props.options], () => {
  if (!frame || !map.value || !preview.value) return;
  const result = renderParts({ width: frame.width, height: frame.height, rgba: frame.data }, props.options, map.value);
  const ctx = preview.value.getContext("2d")!;
  const pixels = ctx.createImageData(frame.width, frame.height);
  pixels.data.set(result); ctx.putImageData(pixels, 0, 0);
});
</script>
<style scoped lang="scss">
.maskPreview {
  display: grid; place-items: center; gap: 8px;
  width: 100%; min-height: min(32dvh, 260px); background: var(--el-fill-color-dark);
  canvas { display: block; width: 100%; height: min(32dvh, 260px); object-fit: contain; }
  span { color: var(--el-color-danger); }
}
</style>
