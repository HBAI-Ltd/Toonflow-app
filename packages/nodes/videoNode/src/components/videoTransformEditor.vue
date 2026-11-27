<template>
  <section class="transformEditor nodrag nopan nowheel">
    <videoPlayer class="outputPreview" :src="src" :readOnly="true" :style="previewStyle" label="变换后的视频预览"
      @loadedmetadata="readSize" @ready="loaded = $event">
      <template #frameOverlay><span class="outputFrame" aria-hidden="true" /></template>
    </videoPlayer>
    <div v-if="sourceWidth" class="dimensions"><span>原片 {{ sourceWidth }} × {{ sourceHeight }}</span><span>输出 {{ outputWidth && outputHeight ? outputWidth + ' × ' + outputHeight : '—' }}</span></div>
    <template v-if="isRotation">
      <div class="settingGroup" role="group" aria-label="旋转角度">
        <strong>旋转</strong>
        <div class="choices">
          <el-button v-for="option in rotationOptions" :key="option.value" size="small" :icon="option.icon"
            :type="angle === option.value ? 'primary' : 'default'" :aria-pressed="angle === option.value" :aria-label="option.label"
            @click="emit('updateValues', { angle: option.value })">{{ option.label }}</el-button>
        </div>
      </div>
      <div class="settingGroup" role="group" aria-label="旋转后翻转">
        <strong>翻转</strong>
        <div class="choices">
          <el-button size="small" :icon="IconFlipHorizontal" :type="horizontal ? 'primary' : 'default'"
            :aria-pressed="horizontal" @click="changeFlip(!horizontal, vertical)">水平翻转</el-button>
          <el-button size="small" :icon="IconFlipVertical" :type="vertical ? 'primary' : 'default'"
            :aria-pressed="vertical" @click="changeFlip(horizontal, !vertical)">垂直翻转</el-button>
        </div>
      </div>
      <span v-if="angle === 'none' && !horizontal && !vertical" class="validation" role="status">请选择旋转角度或翻转方向</span>
    </template>
    <template v-else>
      <div class="settingGroup" role="group" aria-label="常用视频尺寸">
        <strong>常用尺寸</strong>
        <div class="choices">
          <el-button v-for="[width, height] in presets" :key="width + 'x' + height" size="small"
            :type="width === values.width && height === values.height ? 'primary' : 'default'"
            :aria-pressed="width === values.width && height === values.height"
            @click="emit('updateValues', { width, height })">{{ width }} × {{ height }}</el-button>
        </div>
      </div>
      <div class="sizeFields">
        <label v-for="dimension in sizeFields" :key="dimension.key"><span>{{ dimension.label }}（px）</span>
          <el-input-number :modelValue="Number(values[dimension.key]) || undefined" :min="2" :max="8192" :step="2" :precision="0"
            controlsPosition="right" size="small" :aria-label="dimension.label"
            @update:modelValue="value => emit('updateValues', { [dimension.key]: value ?? '' })" />
        </label>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElButton, ElInputNumber } from "element-plus";
import { IconFlipHorizontal, IconFlipVertical, IconRotate, IconRotateClockwise, IconRotate2, IconSquare } from "@tabler/icons-vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [delta: Record<string, string | number>]; ready: [value: boolean] }>();
const rotationOptions = [
  { value: "none", label: "原角度", icon: IconSquare }, { value: "left", label: "逆时针 90°", icon: IconRotate },
  { value: "right", label: "顺时针 90°", icon: IconRotateClockwise }, { value: "half", label: "180°", icon: IconRotate2 },
];
const presets = [[1280, 720], [1920, 1080], [1080, 1920], [1080, 1080]] as const;
const sizeFields = [{ key: "width", label: "输出宽度" }, { key: "height", label: "输出高度" }] as const;
const isRotation = computed(() => props.tool.id === "rotate-video");
const angle = computed(() => String(props.values.angle ?? "none"));
const horizontal = computed(() => props.values.axis === "h" || props.values.axis === "both");
const vertical = computed(() => props.values.axis === "v" || props.values.axis === "both");
const quarterTurn = computed(() => angle.value === "left" || angle.value === "right");
const sourceWidth = ref(0);
const sourceHeight = ref(0);
const loaded = ref(false);
const outputWidth = computed(() => isRotation.value ? Math.ceil((quarterTurn.value ? sourceHeight.value : sourceWidth.value) / 2) * 2 : Math.floor(Number(props.values.width) / 2) * 2);
const outputHeight = computed(() => isRotation.value ? Math.ceil((quarterTurn.value ? sourceWidth.value : sourceHeight.value) / 2) * 2 : Math.floor(Number(props.values.height) / 2) * 2);
const ready = computed(() => loaded.value && sourceWidth.value > 0 && sourceHeight.value > 0 && (isRotation.value
  ? angle.value !== "none" || horizontal.value || vertical.value
  : sizeFields.every(field => {
    const value = Number(props.values[field.key]);
    return Number.isInteger(value) && value >= 2 && value <= 8192;
  })));
watch(ready, value => emit("ready", value), { immediate: true });
watch(() => props.src, () => { loaded.value = false; sourceWidth.value = sourceHeight.value = 0; });

function readSize(event: Event) {
  const video = event.target as HTMLVideoElement;
  sourceWidth.value = video.videoWidth;
  sourceHeight.value = video.videoHeight;
}

function changeFlip(horizontal: boolean, vertical: boolean) {
  emit("updateValues", { axis: horizontal ? vertical ? "both" : "h" : vertical ? "v" : "none" });
}

const previewStyle = computed(() => {
  const w = outputWidth.value, h = outputHeight.value;
  const sw = sourceWidth.value, sh = sourceHeight.value;
  if (!w || !h || !sw || !sh) return {};
  const fit = Math.min(w / sw, h / sh);
  const drawWidth = isRotation.value ? sw : Math.max(2, Math.round(sw * fit / 2) * 2);
  const drawHeight = isRotation.value ? sh : Math.max(2, Math.round(sh * fit / 2) * 2);
  const degrees = ({ left: -90, right: 90, half: 180 } as Record<string, number>)[angle.value] || 0;
  // 画面使用输出像素坐标缩放，随后旋转，最后沿输出画面的轴翻转，与 FFmpeg 的滤镜顺序一致。
  return {
    "--outputAspect": w / h,
    "--videoTransform": `scale(${horizontal.value ? -1 : 1}, ${vertical.value ? -1 : 1}) rotate(${degrees}deg) scale(${drawWidth / w}, ${drawHeight / h})`,
  };
});
</script>

<style scoped lang="scss">
.transformEditor {
  display: grid; gap: 12px; min-width: 0;
  .outputPreview {
    :deep(.videoPreview), :deep(.overlayViewport) {
      width: min(100%, calc(var(--frameMaxHeight) * var(--outputAspect, var(--frameAspect))));
      aspect-ratio: var(--outputAspect, var(--frameAspect));
    }
    :deep(.videoPreview) { position: relative; z-index: 1; object-fit: fill; transform: var(--videoTransform); }
    :deep(.overlayViewport) { z-index: 0; background: #000; outline: 1px solid var(--el-border-color); }
    :deep(.previewStatus) { z-index: 2; }
  }
  .dimensions {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px;
    color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums;
  }
  .settingGroup {
    display: grid; gap: 6px;
    strong { font-size: 12px; font-weight: 500; color: var(--el-text-color-regular); }
    .choices { display: flex; flex-wrap: wrap; gap: 5px; .el-button { margin: 0; } }
  }
  .sizeFields {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px 20px;
    label { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--el-text-color-regular); .el-input-number { width: 94px; } }
  }
  .validation { font-size: 12px; color: var(--el-text-color-secondary); }
}
</style>
