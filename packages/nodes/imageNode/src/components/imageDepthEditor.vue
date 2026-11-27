<template>
  <div class="depthEditor">
    <figure>
      <img ref="source" class="depthSource" :src="src" :alt="translate('原图')" @load="setReady(true)" @error="setReady(false)" />
      <figcaption>
        <span>{{ translate("原图") }}</span>
        <el-button v-if="!previewUrl" size="small" :disabled="!ready" :loading="pending" @click="preview">{{ translate("预览") }}</el-button>
      </figcaption>
    </figure>
    <fieldset>
      <legend>{{ translate("深度图明暗") }}</legend>
      <div class="depthChoices">
        <label v-for="option in tool.fields?.[0]?.options" :key="option.value" :class="{ selected: values.depthDirection === option.value }">
          <input type="radio" :name="choiceName" :value="option.value" :checked="values.depthDirection === option.value"
            @change="emit('updateValues', { depthDirection: option.value })" />
          <div class="depthSample" :class="{ inverted: option.value === 'farWhite' }" aria-hidden="true">
            <img v-if="previewUrl" :src="previewUrl" alt="" />
          </div>
          <span>{{ translate(option.label) }}</span>
        </label>
      </div>
    </fieldset>
    <p v-if="failure" role="alert">{{ failure }}</p>
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, useId, watch } from "vue";
import { ElButton } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { useNodeModel } from "@toonflow/nodes-scaffold/nodeModel";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { estimateImageMap } from "../imageModels";

const props = defineProps<{ tool: MediaTool; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ ready: [value: boolean]; updateValues: [values: Record<string, string | number>] }>();
const source = ref<HTMLImageElement>();
const ready = ref(false), pending = ref(false), previewUrl = ref(""), failure = ref("");
const model = useNodeModel();
const choiceName = useId();
let job: AbortController | undefined;

function setReady(value: boolean) {
  ready.value = value;
  emit("ready", value);
}
function reset() {
  job?.abort();
  job = undefined;
  pending.value = false;
  failure.value = "";
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}
watch(() => props.src, () => { reset(); setReady(false); }, { flush: "sync" });
onScopeDispose(reset);

async function preview() {
  const image = source.value;
  if (!image || !ready.value || job || previewUrl.value) return;
  const controller = job = new AbortController();
  pending.value = true;
  failure.value = "";
  let sample: ImageBitmap | undefined, canvas: HTMLCanvasElement | undefined;
  try {
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    sample = await createImageBitmap(image, { resizeWidth: Math.max(1, Math.round(image.naturalWidth * scale)), resizeHeight: Math.max(1, Math.round(image.naturalHeight * scale)) });
    controller.signal.throwIfAborted();
    canvas = await estimateImageMap({ model, signal: controller.signal, values: { depthDirection: "nearWhite" } }, "depthAnything", sample);
    const blob = await new Promise<Blob>((resolve, reject) => canvas!.toBlob(value => value ? resolve(value) : reject(new Error("图片编码失败")), "image/png"));
    controller.signal.throwIfAborted();
    previewUrl.value = URL.createObjectURL(blob);
  } catch (cause) {
    if (!controller.signal.aborted) failure.value = translate(cause instanceof Error ? cause.message : "预览失败");
  } finally {
    sample?.close();
    if (canvas) canvas.width = canvas.height = 0;
    if (job === controller) { pending.value = false; job = undefined; }
  }
}
</script>

<style scoped lang="scss">
.depthEditor {
  display: grid; gap: 14px;
  figure { margin: 0; }
  .depthSource { display: block; width: 100%; height: min(33dvh, 240px); object-fit: contain; background: var(--el-fill-color-dark); }
  figcaption { min-height: 26px; margin-top: 4px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--el-text-color-secondary); }
  fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
  legend { margin-bottom: 6px; padding: 0; font-size: 13px; }
  .depthChoices {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;
    label { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 6px; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); padding: 7px; cursor: pointer; font-size: 12px; }
    label.selected, label:focus-within { border-color: var(--el-color-primary); }
    input { grid-row: 2; margin: 0; accent-color: var(--el-color-primary); }
    .depthSample { grid-column: span 2; min-height: 12px; background: linear-gradient(to right, white, black); border-radius: 2px; }
    .depthSample:has(img) { background: var(--el-fill-color-dark); }
    .depthSample.inverted { background: linear-gradient(to right, black, white); }
    .depthSample.inverted:has(img) { background: var(--el-fill-color-dark); }
    .inverted img { filter: invert(1); }
    img { display: block; height: min(21dvh, 145px); width: 100%; object-fit: contain; }
  }
  p { margin: 0; color: var(--el-color-danger); }
}
</style>
