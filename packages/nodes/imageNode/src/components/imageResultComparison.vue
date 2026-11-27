<template>
  <el-dialog :modelValue="true" title="对比原图" width="min(860px, calc(100vw - 24px))" alignCenter appendToBody @close="emit('close')">
    <div class="imageCompare">
      <p v-if="readError || previewError" role="alert">{{ readError || previewError }}</p>
      <div v-else class="compareStage">
        <div class="compareFrame" @pointerdown.prevent="beginDrag" @pointermove="drag">
          <img :src="result" alt="处理结果" draggable="false" :style="ready ? {clipPath: 'inset(0 0 0 ' + split + '%)'} : undefined" />
          <img v-if="originalUrl" class="originalLayer" :src="originalUrl" alt="原图" :style="{clipPath: 'inset(0 ' + (100 - split) + '% 0 0)'}"
            draggable="false" @load="loaded" @error="handleError" />
          <i v-if="ready" class="compareLine" :style="{ left: split + '%' }" />
        </div>
      </div>
      <div v-if="!readError && !previewError" class="compareControls">
        <span>原图</span>
        <input v-model.number="split" type="range" min="0" max="100" :disabled="!ready" aria-label="原图显示比例" :aria-valuetext="split + '%'" />
        <span>处理结果</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElDialog } from "element-plus";
import { useNodeFiles, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";

const props = defineProps<{ original: NodeMediaValue; result: string }>();
const emit = defineEmits<{ close: [] }>();
const readError = ref("");
const url = useNodeFiles().useFileUrl(() => props.original, () => { readError.value = "无法读取原图，请检查工作区中的原始素材"; });
const { src: originalUrl, error: previewError, handleLoaded, handleError } = useMediaPreview(url, "image");
const ready = ref(false);
const split = ref(50);
function loaded(event: Event) { ready.value = handleLoaded(event); }
function drag(event: PointerEvent) {
  const frame = event.currentTarget as HTMLElement;
  if (!ready.value || !frame.hasPointerCapture(event.pointerId)) return;
  const bounds = frame.getBoundingClientRect();
  split.value = Math.round(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)) * 100);
}
function beginDrag(event: PointerEvent) {
  if (event.button !== 0 || !ready.value) return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag(event);
}
</script>

<style scoped lang="scss">
.imageCompare {
  display: grid; gap: 12px;
  .compareStage {
    display: grid; place-items: center; background: var(--el-fill-color-dark);
    .compareFrame {
      position: relative; max-width: 100%; overflow: hidden; cursor: ew-resize; touch-action: none;
      img { display: block; max-width: 100%; max-height: 60dvh; pointer-events: none; }
      .originalLayer { position: absolute; inset: 0; width: 100%; height: 100%; }
      .compareLine { position: absolute; top: 0; bottom: 0; border-inline-start: 2px solid white; box-shadow: 1px 0 2px #0008; pointer-events: none; }
    }
  }
  .compareControls {
    display: flex; align-items: center; gap: 12px; color: var(--el-text-color-regular);
    input { flex: 1; min-width: 0; accent-color: var(--el-color-primary); }
  }
}
</style>
