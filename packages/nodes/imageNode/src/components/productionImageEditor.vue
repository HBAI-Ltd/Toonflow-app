<template>
  <div class="productionEditor">
    <div class="imageStage" :class="{ lightStage: tool.id === 'removeMatte' && values.matte === 'black', darkStage: tool.id === 'removeMatte' && values.matte === 'white' }">
      <figure>
        <div v-if="tool.id === 'animeMask'" class="partStage">
          <img ref="source" :src="src" :alt="translate('原图')" @load="loaded" @error="emit('ready', false)" @click="pickPart" />
        </div>
        <img v-else ref="source" :src="src" :alt="translate('原图')" @load="loaded" @error="emit('ready', false)" />
        <figcaption>{{ translate(tool.id === 'animeMask' ? '点击原图选择部位' : '原图') }}</figcaption>
      </figure>
      <figure v-if="texture">
        <canvas ref="result" aria-label="处理效果预览" />
        <figcaption>{{ translate('处理结果') }}</figcaption>
      </figure>
      <figure v-if="maskOptions">
        <imageMaskPreview ref="maskPreview" :source="source" :src="src" :options="maskOptions" @selectPart="part => emit('updateValues', { part: String(part) })" />
        <figcaption>{{ translate('处理结果') }}</figcaption>
      </figure>
    </div>
    <normalMapOptions v-if="tool.id === 'heightNormal'" :tool="tool" :values="values" @updateValues="emit('updateValues', $event)" />
    <template v-else>
      <div v-for="field in tool.fields" :key="field.key" class="controlRow">
        <span>{{ translate(field.label) }}</span>
        <el-slider v-if="field.type === 'number'" :modelValue="Number(values[field.key])" :min="field.min" :max="field.max" :step="field.step || 1"
          :aria-label="translate(field.label)" @update:modelValue="v => emit('updateValues', { [field.key]: Number(v) })" />
        <el-radio-group v-else :modelValue="values[field.key]" :aria-label="translate(field.label)" @change="v => emit('updateValues', { [field.key]: String(v) })">
          <el-radio-button v-for="choice in field.options" :key="choice.value" :value="choice.value">
            <span class="choiceContent">
              <span v-if="field.key === 'ink' || field.key === 'matte'" class="colorSample" :class="{ lightSample: field.key === 'ink' ? choice.value === 'black' : choice.value === 'white' }" aria-hidden="true">
                <icon-scribble v-if="field.key === 'ink'" :size="14" />
              </span>
              {{ translate(choice.label) }}
            </span>
          </el-radio-button>
        </el-radio-group>
        <output v-if="field.type === 'number'">{{ values[field.key] }}</output>
      </div>
    </template>
    <small v-if="tool.id === 'animeMask'">{{ translate('结果中，选中的部位是白色，其余是黑色。') }}</small>
    <p v-if="failure" role="alert">{{ failure }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElRadioButton, ElRadioGroup, ElSlider } from "element-plus";
import { IconScribble } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { texturePixels, type TextureMode } from "../texturePixels";
import type { PartsOptions } from "../imageParts";
import imageMaskPreview from "./imageMaskPreview.vue";
import normalMapOptions from "./normalMapOptions.vue";

const props = defineProps<{ tool: MediaTool; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ ready: [value: boolean]; updateValues: [values: Record<string, string | number>] }>();
const source = ref<HTMLImageElement>(), result = ref<HTMLCanvasElement>();
const maskPreview = ref<InstanceType<typeof imageMaskPreview>>();
const maskOptions = computed<PartsOptions | undefined>(() => {
  if (props.tool.id === "animeMask") return { operation: "animeMask", part: Number(props.values.part) };
  if (props.tool.id === "lineArt") return { operation: "lineArt", ink: props.values.ink === "white" ? "white" : "black" };
});
const failure = ref("");
const texture = computed(() => ["heightNormal", "seamlessTile", "removeMatte"].includes(props.tool.id));
let controller: AbortController | undefined;
let scheduled: ReturnType<typeof setTimeout> | undefined;
let original: ImageData | undefined;

function pickPart(event: MouseEvent) {
  const bounds = source.value?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return;
  maskPreview.value?.pickPart((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
}
function loaded() {
  original = undefined;
  if (texture.value) void render();
  else emit("ready", true);
}

async function render() {
  controller?.abort();
  const image = source.value, canvas = result.value;
  if (!image?.naturalWidth || !canvas) return;
  const job = controller = new AbortController();
  const temp = document.createElement("canvas");
  try {
    const width = image.naturalWidth, height = image.naturalHeight;
    if (width * height > 48_000_000) throw new Error("单张图片不能超过 4800 万像素");
    const scale = Math.min(1, 480 / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
    temp.width = width; temp.height = height;
    const ctx = temp.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("无法显示效果预览");
    if (!original) {
      ctx.drawImage(image, 0, 0);
      original = ctx.getImageData(0, 0, width, height);
    }
    const repeat = props.tool.id === "seamlessTile" ? 2 : 1;
    // 法线依赖原图相邻像素，透明边缘也需先去底色再缩放。三种预览均先按成片分辨率处理。
    const pixels = await texturePixels(props.tool.id as TextureMode, original, { ...props.values }, job.signal);
    job.signal.throwIfAborted();
    ctx.putImageData(pixels, 0, 0);
    canvas.width = w * repeat; canvas.height = h * repeat;
    const view = canvas.getContext("2d")!;
    for (let y = 0; y < repeat; y++) for (let x = 0; x < repeat; x++) view.drawImage(temp, w*x, h*y, w, h);
    emit("ready", true);
    failure.value = "";
  } catch (cause) {
    if (!job.signal.aborted) { failure.value = translate(cause instanceof Error ? cause.message : "预览失败"); emit("ready", false); }
  } finally { temp.width = temp.height = 0; }
}
watch(() => ({ ...props.values }), () => {
  if (!texture.value) return;
  controller?.abort();
  clearTimeout(scheduled);
  emit("ready", false);
  scheduled = setTimeout(render, 120);
}, { flush: "post" });
watch(() => props.src, () => { original = undefined; controller?.abort(); clearTimeout(scheduled); emit("ready", false); });
onBeforeUnmount(() => { controller?.abort(); clearTimeout(scheduled); original = undefined; });
</script>

<style scoped lang="scss">
.productionEditor {
  display: grid;
  gap: 16px;
  .imageStage {
    display: flex; gap: 8px; align-items: start; justify-content: center;
    @container (max-width: 380px) { display: grid; grid-template-columns: minmax(0, 1fr); }
    --previewBackground: var(--el-fill-color-dark);
    &.lightStage { --previewBackground: #fff; }
    &.darkStage { --previewBackground: #202124; }
    figure {
      margin: 0; min-width: 0; flex: 1 1 0;
      img, canvas { display: block; width: 100%; height: min(32dvh, 260px); object-fit: contain; background: var(--previewBackground); }
      .partStage { display: grid; place-items: center; height: min(32dvh, 260px); background: var(--previewBackground);
        img { width: auto; height: auto; max-width: 100%; max-height: min(32dvh, 260px); cursor: crosshair; }
      }
      figcaption { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
    }
  }
  .controlRow {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    .el-slider { flex: 1; min-width: 110px; }
    .choiceContent { display: inline-flex; align-items: center; gap: 5px; }
    .colorSample { display: inline-grid; place-items: center; width: 18px; height: 16px; border: 1px solid #888; border-radius: 3px; color: white; background: #111; }
    .lightSample { background: white; color: #111; }
    output { font-variant-numeric: tabular-nums; }
  }
  p { color: var(--el-color-danger); }
  small { color: var(--el-text-color-regular); }
}
</style>
