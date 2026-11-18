<template>
  <section class="performancePointEditor" role="dialog" aria-label="锚点编辑" @keydown.stop @pointerdown.stop>
    <header class="editorHeading">
      <i class="trackDot" :style="{ backgroundColor: color }" aria-hidden="true" />
      <strong :title="name">{{ name }} · 第 {{ index + 1 }} 个点</strong>
      <button type="button" :disabled="disabled" aria-label="删除当前路径点" title="删除此点（Delete）" @click="emit('remove')"><icon-trash :size="15" /></button>
      <button type="button" aria-label="关闭锚点编辑" title="关闭" @click="emit('close')"><icon-x :size="15" /></button>
    </header>
    <div class="editorRows">
      <div class="editorRow">
        <span class="rowLabel" title="从上一点走到这里的到达时间；首点是播放起点">到达</span>
        <span class="stepper">
          <button type="button" :disabled="disabled || index === 0 || incomingTeleport" aria-label="提前到达" @click="stepArrival(-0.1)">−</button>
          <input :value="arrivalText" type="number" min="0" max="86400" step="0.1" :disabled="disabled || index === 0 || incomingTeleport" aria-label="到达时间（秒）" @change="changeArrival" />
          <button type="button" :disabled="disabled || index === 0 || incomingTeleport" aria-label="推迟到达" @click="stepArrival(0.1)">+</button>
        </span>
        <small>{{ formatClock(arrival) }}</small>
      </div>
      <div class="editorRow">
        <span class="rowLabel" title="在这个点停留的秒数">停靠</span>
        <span class="stepper">
          <button type="button" :disabled="disabled" aria-label="减少停靠时间" @click="stepDwell(-0.5)">−</button>
          <input :value="dwellText" type="number" min="0" max="300" step="0.5" :disabled="disabled" aria-label="停靠秒数" @change="changeDwell" />
          <button type="button" :disabled="disabled" aria-label="增加停靠时间" @click="stepDwell(0.5)">+</button>
        </span>
        <small>秒</small>
      </div>
      <div class="editorRow">
        <span class="rowLabel" title="从上一点到这里的速度">速度</span>
        <span class="speedOptions" role="group" aria-label="进入该点的速度">
          <button v-for="preset in speedPresets" :key="preset.label" type="button" :class="{ active: preset.value === activeSpeed }" :aria-pressed="preset.value === activeSpeed" :disabled="disabled || index === 0 || incomingTeleport" :title="`进入该点的速度 ${preset.value} m/s`" @click="emit('updateSpeed', preset.value)">{{ preset.label }}</button>
        </span>
        <small>{{ incomingTeleport ? '瞬移' : `${speed.toFixed(2)} m/s` }}</small>
      </div>
      <div v-if="!clipRoute" class="editorRow">
        <span class="rowLabel" title="0 急停；越大减速与转向越平滑">惯性</span>
        <span class="stepper">
          <button type="button" :disabled="disabled" aria-label="减小惯性" @click="stepInertia(-0.1)">−</button>
          <input :value="inertiaText" type="number" min="0" max="1" step="0.1" :disabled="disabled" aria-label="惯性0到1" @change="changeInertia" />
          <button type="button" :disabled="disabled" aria-label="增大惯性" @click="stepInertia(0.1)">+</button>
        </span>
        <small>{{ inertia <= 0 ? '无惯性' : inertia.toFixed(1) }}</small>
      </div>
      <div class="editorRow">
        <span class="rowLabel">高度</span>
        <span class="stepper">
          <button type="button" :disabled="disabled" aria-label="降低高度" @click="stepHeight(-0.5)">−</button>
          <input :value="heightText" type="number" min="-100" max="200" step="0.1" :disabled="disabled" aria-label="高度（米）" @change="changeHeight" />
          <button type="button" :disabled="disabled" aria-label="升高高度" @click="stepHeight(0.5)">+</button>
        </span>
        <small>米</small>
      </div>
      <div v-if="!clipRoute" class="editorRow">
        <span class="rowLabel">瞬移</span>
        <label class="teleportToggle">
          <input type="checkbox" :checked="teleportNext" :disabled="disabled || index + 1 >= total" aria-label="到下一点瞬移" @change="changeTeleport" />
          <span>{{ index + 1 >= total ? '最后一个点' : '到下一点瞬移' }}</span>
        </label>
        <small>{{ index + 1 >= total ? '终点' : '不走路' }}</small>
      </div>
      <div class="editorRow" title="开：整条动线严格沿画的线贴地走，不自动绕路，车辆和大物体不会被卡住；关：按真实通路寻路、避障">
        <span class="rowLabel">沿线</span>
        <el-switch :modelValue="followLine" size="small" :disabled="disabled" aria-label="严格沿画的线走" @change="value => emit('updateFollowLine', !!value)" />
        <small>{{ followLine ? '照线走' : '自动寻路' }}</small>
      </div>
      <div class="editorRow" title="开：能落在屋顶、屋脊、墙头上，走不通或要绕远的段直接飞身跨过去（上房、跨巷、翻墙、跃下）；关：只走楼梯和门洞">
        <span class="rowLabel">轻功</span>
        <el-switch :modelValue="parkour" size="small" :disabled="disabled || followLine" aria-label="飞檐走壁" @change="value => emit('updateParkour', !!value)" />
        <small>{{ parkour && !followLine ? '飞檐走壁' : '只走路' }}</small>
      </div>
    </div>
    <details class="eventSettings">
      <summary>关键事件</summary>
      <label><span>到达后</span><input :value="eventText" maxlength="160" :disabled="disabled" aria-label="关键事件内容" placeholder="例如：开门、观察" @change="changeEventText" /></label>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconTrash, IconX } from "@tabler/icons-vue";
import { ElSwitch } from "element-plus";

const props = defineProps<{ name: string; color: string; index: number; total: number; arrival: number; dwell: number; speed: number; height: number; inertia: number; eventText: string; teleportNext: boolean; incomingTeleport: boolean; followLine?: boolean; parkour?: boolean; disabled?: boolean;
  // 片段式动线（Agent或剪辑生成）：没有逐点惯性和瞬移，这两行不显示。
  clipRoute?: boolean }>();
const emit = defineEmits<{ updateArrival: [seconds: number]; updateDwell: [seconds: number]; updateSpeed: [speed: number]; updateHeight: [meters: number]; updateInertia: [value: number]; updateEventText: [text: string]; updateTeleport: [value: boolean]; updateFollowLine: [value: boolean]; updateParkour: [value: boolean]; remove: []; close: [] }>();

const speedPresets = [{ label: "慢", value: 0.8 }, { label: "中", value: 1.35 }, { label: "快", value: 2.5 }, { label: "飞快", value: 5 }];
const arrivalText = computed(() => props.arrival.toFixed(1));
const dwellText = computed(() => props.dwell.toFixed(1));
const heightText = computed(() => props.height.toFixed(1));
const inertiaText = computed(() => props.inertia.toFixed(1));
const activeSpeed = computed(() => speedPresets.find(preset => Math.abs(preset.value - props.speed) < 0.01)?.value);

function formatClock(seconds: number) {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${(total - minutes * 60).toFixed(1).padStart(4, "0")}`;
}
function round(value: number, step = 0.1) { return Math.round(value / step) * step; }
function stepArrival(delta: number) { if (props.index === 0) return; emit("updateArrival", Math.max(0.1, round(props.arrival + delta))); }
function stepDwell(delta: number) { emit("updateDwell", Math.max(0, round(props.dwell + delta, 0.5))); }
function stepHeight(delta: number) { emit("updateHeight", round(props.height + delta, 0.1)); }
function stepInertia(delta: number) { emit("updateInertia", Math.max(0, Math.min(1, round(props.inertia + delta, 0.1)))); }
function changeArrival(event: Event) {
  const input = event.target as HTMLInputElement;
  if (props.index === 0 || !input.checkValidity() || !Number.isFinite(input.valueAsNumber)) { input.value = arrivalText.value; return; }
  emit("updateArrival", Math.max(0.1, round(input.valueAsNumber)));
}
function changeDwell(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) { input.value = dwellText.value; return; }
  emit("updateDwell", Math.max(0, round(Math.min(300, input.valueAsNumber), 0.5)));
}
function changeInertia(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) { input.value = inertiaText.value; return; }
  emit("updateInertia", Math.max(0, Math.min(1, round(input.valueAsNumber, 0.1))));
}
function changeHeight(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) { input.value = heightText.value; return; }
  emit("updateHeight", round(Math.max(-100, Math.min(200, input.valueAsNumber))));
}
function changeEventText(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("updateEventText", input.value.trim());
}
function changeTeleport(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("updateTeleport", input.checked);
}
</script>

<style scoped lang="scss">
.performancePointEditor {
  min-width: 248px;
  max-width: 292px;
  padding: 10px 12px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 94%, transparent);
  color: var(--el-text-color-primary);
  font: inherit;
  font-size: 12px;
  box-shadow: 0 10px 28px rgb(0 0 0 / 16%);
  button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent;
    &:hover:not(:disabled) { background: var(--studioHoverBackground); }
    &:disabled { opacity: 0.4; cursor: default; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }
  input { min-width: 0; width: 100%; padding: 5px 6px; border: 1px solid var(--el-border-color-lighter); border-radius: 7px; background: var(--studioControlBackground); color: inherit; font: inherit; text-align: center;
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    &:disabled { opacity: 0.55; }
  }
  input[type="number"] { appearance: textfield; }
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { appearance: none; margin: 0; }
  .editorHeading { display: flex; align-items: center; gap: 6px;
    > strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
    > button { width: 26px; height: 26px; padding: 4px; color: var(--el-text-color-regular); }
    > button:first-of-type:hover:not(:disabled) { color: var(--el-color-danger); }
  }
  .trackDot { flex-shrink: 0; width: 9px; height: 9px; border-radius: 50%; }
  .editorRows { display: grid; gap: 8px; margin-top: 10px; }
  .teleportToggle { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); font-size: 11px; cursor: pointer;
    > input { width: 14px; height: 14px; margin: 0; accent-color: var(--el-color-primary); }
  }
  .editorRow { display: grid; grid-template-columns: 34px minmax(0, 1fr) 62px; align-items: center; gap: 8px;
    > small { color: var(--el-text-color-regular); font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  }
  .rowLabel { color: var(--el-text-color-regular); }
  .stepper { display: grid; grid-template-columns: 26px minmax(0, 1fr) 26px; align-items: center; gap: 3px; padding: 2px; border-radius: 9px; background: var(--studioControlBackground);
    > button { width: 26px; height: 26px; padding: 0; border-radius: 7px; color: var(--el-text-color-regular); font-size: 14px; line-height: 1; }
    > input { border-color: transparent; background: transparent; padding: 3px 2px; font-variant-numeric: tabular-nums; }
  }
  .speedOptions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px; padding: 2px; border-radius: 9px; background: var(--studioControlBackground);
    > button { min-height: 26px; padding: 2px 0; border-radius: 7px; color: var(--el-text-color-regular); font-size: 11px;
      &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); }
    }
  }
  .eventSettings { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter);
    > summary { width: fit-content; padding: 2px 0; color: var(--el-text-color-regular); font-size: 11px; cursor: pointer;
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
    }
    > label { display: grid; gap: 5px; margin-top: 6px; color: var(--el-text-color-regular); font-size: 11px;
      > input { padding: 6px 8px; text-align: left; }
    }
  }
}
</style>
