<template>
  <div class="normalEditor">
    <div class="images">
      <figure><img ref="source" :src="src" alt="材质原图" @load="emit('ready', true)" @error="emit('ready', false)" /><figcaption>材质原图</figcaption></figure>
      <figure v-if="normal"><canvas ref="canvas" width="256" height="256" aria-label="中心纹理法线预览" /><figcaption>中心纹理 · 法线预览</figcaption></figure>
    </div>
    <div><el-button size="small" :loading="!!pending" :disabled="!!normal" @click="preview">预览中心纹理</el-button></div>
    <normalMapOptions :tool="tool" :values="values" @updateValues="emit('updateValues', $event)" />
    <span v-if="error" class="feedback" role="alert">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import { predictNormals, storeNormal } from "../materialNormals";
import normalMapOptions from "./normalMapOptions.vue";

const props = defineProps<{ tool: MediaTool; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ ready: [value: boolean]; updateValues: [values: Record<string, string | number>] }>();
const source = shallowRef<HTMLImageElement>(), canvas = shallowRef<HTMLCanvasElement>();
const normal = shallowRef<{ channels: Float32Array; sourcePixels: Uint8ClampedArray }>();
const pending = shallowRef<AbortController>(), error = ref("");
const model = useNodeModel();
function reset() { pending.value?.abort(); pending.value = undefined; normal.value = undefined; error.value = ""; }
watch(() => props.src, () => { reset(); emit("ready", false); });
onScopeDispose(reset);
async function preview() {
  const image = source.value;
  if (!image?.naturalWidth || pending.value || normal.value) return;
  const controller = new AbortController();
  pending.value = controller; error.value = "";
  try {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 256;
    const ctx = tile.getContext("2d");
    if (!ctx) throw new Error("无法读取纹理像素");
    const pattern = ctx.createPattern(image, "repeat");
    if (!pattern) throw new Error("无法读取纹理像素");
    ctx.translate(128 - Math.floor(image.naturalWidth / 2), 128 - Math.floor(image.naturalHeight / 2));
    ctx.fillStyle = pattern;
    ctx.fillRect(Math.floor(image.naturalWidth / 2) - 128, Math.floor(image.naturalHeight / 2) - 128, 256, 256);
    const pixels = ctx.getImageData(0, 0, 256, 256).data;
    const gray = Float32Array.from({ length: 256 * 256 }, (_, i) => (pixels[i * 4]! + pixels[i * 4 + 1]! + pixels[i * 4 + 2]!) / 765);
    const channels = await predictNormals(gray, model.run, controller.signal);
    controller.signal.throwIfAborted();
    normal.value = { channels, sourcePixels: pixels };
  } catch (cause) { if (!controller.signal.aborted) error.value = cause instanceof Error ? cause.message : "纹理预览失败"; }
  finally { if (pending.value === controller) pending.value = undefined; }
}
watch([normal, canvas, () => props.values.convention, () => props.values.strength], () => {
  const sample = normal.value, ctx = canvas.value?.getContext("2d");
  if (!sample || !ctx) return;
  const data = sample.channels;
  const area = 256 * 256, pixels = ctx.createImageData(256, 256);
  const options = { strength: Number(props.values.strength), convention: props.values.convention === "directX" ? "directX" : "openGl" } as const;
  for (let i = 0; i < area; i++) {
    storeNormal(pixels.data, i * 4, data[i]! - 0.5, data[area + i]! - 0.5, data[area * 2 + i]! - 0.5, options);
    pixels.data[i * 4 + 3] = sample.sourcePixels[i * 4 + 3]!;
  }
  ctx.putImageData(pixels, 0, 0);
}, { flush: "post" });
</script>

<style scoped lang="scss">
.normalEditor {
  display: grid; gap: 10px;
  .images {
    display: flex; flex-wrap: wrap; gap: 8px;
    figure {
      flex: 1 1 160px; margin: 0; min-width: 0;
      img, canvas { display: block; width: 100%; height: min(35dvh, 260px); object-fit: contain; background: var(--el-fill-color-dark); }
      figcaption { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
    }
  }
  .feedback { color: var(--el-color-danger); }
}
</style>
