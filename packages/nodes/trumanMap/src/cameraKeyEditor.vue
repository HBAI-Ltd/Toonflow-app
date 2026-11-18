<template>
  <section class="cameraKeyEditor" role="dialog" aria-label="镜头关键点" :style="{ '--cameraColor': color }" @keydown.stop @pointerdown.stop @wheel.stop>
    <header class="keyHeading">
      <i class="keyDiamond" aria-hidden="true" />
      <strong :title="name">{{ name }} · 关键点 {{ time }}</strong>
      <el-button text circle size="small" :disabled="disabled" aria-label="删除关键点" title="删除关键点（Delete）" @click="emit('remove')"><icon-trash :size="15" /></el-button>
      <el-button text circle size="small" aria-label="关闭" title="关闭" @click="emit('close')"><icon-x :size="15" /></el-button>
    </header>
    <div class="keyRows">
      <label v-for="item in fields" :key="item.key" class="keyRow" :title="item.title">
        <span>{{ item.label }}</span>
        <el-slider :modelValue="clampSlider(item, values[item.key])" :min="item.min" :max="item.max" :step="1" :showTooltip="false" :disabled="disabled" :aria-label="item.title" @input="value => change(item.key, value, true)" @change="value => change(item.key, value, false)" />
        <el-input-number :modelValue="Math.round(values[item.key] * 10) / 10" :min="item.limit[0]" :max="item.limit[1]" :step="item.step" :precision="item.key === 'focal' ? 0 : 1" :controls="false" size="small" :disabled="disabled" :aria-label="item.title" @change="value => change(item.key, value, false)" />
        <span v-if="item.turns" class="turnButtons">
          <el-button text size="small" :disabled="disabled" :title="`${item.label}反向一整圈`" @click="change(item.key, values[item.key] - 360, false)"><icon-rotate :size="13" /></el-button>
          <el-button text size="small" :disabled="disabled" :title="`${item.label}再转一整圈`" @click="change(item.key, values[item.key] + 360, false)"><icon-rotate-clockwise :size="13" /></el-button>
        </span>
        <i v-else />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElButton, ElInputNumber, ElSlider } from "element-plus";
import { IconRotate, IconRotateClockwise, IconTrash, IconX } from "@tabler/icons-vue";
import type { ShotKeyValues } from "./cameraDocument";

type Key = keyof ShotKeyValues;
type Field = { key: Key; label: string; title: string; min: number; max: number; limit: [number, number]; step: number; turns?: boolean };
defineProps<{ name: string; color: string; time: string; values: ShotKeyValues; disabled?: boolean }>();
const emit = defineEmits<{ update: [patch: Partial<ShotKeyValues>, live: boolean]; remove: []; close: [] }>();

// ACT: 滑块管常用范围，右边的数字框能填更大的角度；翻滚、俯仰一键整圈，翻跟头、转圈不用一点点拖。
const fields: Field[] = [
  { key: "focal", label: "焦段", title: "这一刻的焦段（毫米），小是广角、大是长焦；取景窗里滚轮也能调", min: 12, max: 200, limit: [12, 200], step: 1 },
  { key: "pan", label: "转向", title: "这一刻镜头相对原朝向向左右转多少度", min: -180, max: 180, limit: [-1440, 1440], step: 5, turns: true },
  { key: "tilt", label: "俯仰", title: "这一刻镜头抬头或低头多少度，超过90°就是翻跟头", min: -90, max: 90, limit: [-1440, 1440], step: 5, turns: true },
  { key: "roll", label: "翻滚", title: "这一刻画面绕镜头转多少度，360°就是整圈翻滚", min: -180, max: 180, limit: [-1440, 1440], step: 5, turns: true },
];
function clampSlider(item: Field, value: number) { return Math.min(item.max, Math.max(item.min, value)); }
function change(key: Key, value: number | number[] | undefined | null, live: boolean) {
  const next = Array.isArray(value) ? value[0] : value;
  const field = fields.find(item => item.key === key)!;
  if (next !== undefined && next !== null && Number.isFinite(next)) emit("update", { [key]: Math.min(field.limit[1], Math.max(field.limit[0], next)) }, live);
}
</script>

<style scoped lang="scss">
.cameraKeyEditor {
  position: absolute; z-index: 12; width: 320px; padding: 10px 12px 8px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px;
  background: var(--el-bg-color-overlay); box-shadow: var(--el-box-shadow-light); color: var(--el-text-color-primary); font-size: 12px;
  .keyHeading { display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
    strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .el-button + .el-button { margin-left: 0; }
  }
  .keyDiamond { width: 9px; height: 9px; flex-shrink: 0; transform: rotate(45deg); border-radius: 2px; background: var(--cameraColor); }
  .keyRows { display: grid; gap: 2px; }
  .keyRow { display: grid; grid-template-columns: 30px minmax(0, 1fr) 58px 48px; align-items: center; gap: 6px; min-height: 30px;
    > span:first-child { color: var(--el-text-color-regular); }
    .el-slider { --el-slider-height: 4px; --el-slider-button-size: 12px; --el-slider-main-bg-color: var(--cameraColor); height: 28px; margin-inline: 6px; }
    .el-input-number { width: 100%; }
    .turnButtons { display: flex; .el-button { width: 22px; padding: 0; margin: 0; } }
  }
}
</style>
