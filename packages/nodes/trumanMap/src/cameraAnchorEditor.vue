<template>
  <section class="cameraAnchorEditor" role="dialog" aria-label="机位锚点" :style="{ '--cameraColor': color }" @keydown.stop @pointerdown.stop @wheel.stop>
    <header class="anchorHeading">
      <i class="cameraDot" aria-hidden="true" />
      <strong :title="name">{{ name }} · 锚点 {{ index + 1 }}/{{ total }}</strong>
      <el-button text circle size="small" :disabled="disabled || total <= 2" aria-label="删除锚点" title="删除锚点（也可双击锚点）" @click="emit('remove')"><icon-trash :size="15" /></el-button>
      <el-button text circle size="small" aria-label="关闭" title="关闭" @click="emit('close')"><icon-x :size="15" /></el-button>
    </header>
    <label class="anchorRow" title="离地高度；也可以直接上下拖空中的锚点">
      <span>高度</span>
      <el-input-number :modelValue="Math.round(height * 100) / 100" :min="-100" :max="2000" :step="0.1" :precision="2" size="small" controlsPosition="right" :disabled="disabled" aria-label="离地高度（米）" @change="changeHeight" />
      <small>m</small>
    </label>
  </section>
</template>

<script setup lang="ts">
import { ElButton, ElInputNumber } from "element-plus";
import { IconTrash, IconX } from "@tabler/icons-vue";

// ACT: 锚点只管机位走到哪、多高；焦段、转向、俯仰、翻滚放在时间轴上的镜头关键点里按时间控制。
const props = defineProps<{ name: string; color: string; index: number; total: number; height: number; disabled?: boolean }>();
const emit = defineEmits<{ update: [patch: { height?: number }, live: boolean]; remove: []; close: [] }>();
function changeHeight(value: number | undefined) {
  if (value !== undefined && Number.isFinite(value) && Math.abs(value - props.height) > 1e-6) emit("update", { height: value }, false);
}
</script>

<style scoped lang="scss">
.cameraAnchorEditor {
  position: absolute; z-index: 12; width: 240px; padding: 10px 12px 8px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px;
  background: var(--el-bg-color-overlay); box-shadow: var(--el-box-shadow-light); color: var(--el-text-color-primary); font-size: 12px;
  .anchorHeading { display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
    strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .el-button + .el-button { margin-left: 0; }
  }
  .cameraDot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--cameraColor); }
  .anchorRow { display: grid; grid-template-columns: 30px minmax(0, 1fr) 20px; align-items: center; gap: 8px; min-height: 30px;
    > span { color: var(--el-text-color-regular); }
    > small { color: var(--el-text-color-secondary); }
    .el-input-number { width: 100%; }
  }
}
</style>
