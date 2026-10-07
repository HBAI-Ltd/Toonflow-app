<template>
  <teleport :to="target ?? 'body'" :disabled="!target">
    <section v-show="!!target" class="multiAnglePanel nodrag nopan nowheel" aria-label="图片多角度" @pointerdown.stop @mousedown.stop @dblclick.stop @wheel.stop @keydown.stop>
      <header class="panelHeader">
        <div class="panelTitle"><icon-camera :size="18" /><strong>多角度</strong></div>
        <div class="headerActions">
          <el-button :icon="IconRestore" text size="small" :disabled="busy" @click="reset">重置</el-button>
          <el-button :icon="IconX" text :disabled="generating" aria-label="关闭多角度" @click="emit('close')" />
        </div>
      </header>
      <div class="angleWorkspace">
        <div class="presetColumn" role="group" aria-label="常用视角">
          <span>常用视角</span>
          <button v-for="preset in multiAnglePresets" :key="preset.id" type="button" :aria-pressed="activePreset?.id === preset.id" :disabled="busy" @click="selectPreset(preset)">{{ preset.label }}</button>
        </div>
        <div class="stageColumn">
          <div class="stageHeader">
            <span>{{ activePreset?.label ?? '自定义' }}</span>
            <div class="viewSwitch" role="group" aria-label="预览模式">
              <button type="button" :aria-pressed="settings.viewMode === 'orbit'" :disabled="busy" @click="settings.viewMode = 'orbit'">空间总览</button>
              <button type="button" :aria-pressed="settings.viewMode === 'camera'" :disabled="busy" @click="settings.viewMode = 'camera'">参考平面</button>
            </div>
          </div>
          <imageMultiAngleStage
            v-if="target"
            v-model:azimuth="settings.azimuth"
            v-model:elevation="settings.elevation"
            v-model:distance="settings.distance"
            :src="src"
            :lens="settings.lens"
            :viewMode="settings.viewMode"
            :disabled="busy"
            @aspectRatio="sourceRatio = $event" />
        </div>
      </div>
      <div class="parameterRow">
        <div class="rangeControl">
          <div class="rangeHeader"><span>水平环绕</span><label class="numberControl"><input :value="Math.round(settings.azimuth)" type="number" min="-180" max="180" step="1" :disabled="busy" aria-label="水平环绕数值" @change="setParameter($event, 'azimuth')" /><span>°</span></label></div>
          <input v-model.number="settings.azimuth" type="range" min="-180" max="180" step="1" :disabled="busy" aria-label="相机水平环绕" />
        </div>
        <div class="rangeControl">
          <div class="rangeHeader"><span>垂直俯仰</span><label class="numberControl"><input :value="Math.round(settings.elevation)" type="number" min="-80" max="80" step="1" :disabled="busy" aria-label="垂直俯仰数值" @change="setParameter($event, 'elevation')" /><span>°</span></label></div>
          <input v-model.number="settings.elevation" type="range" min="-80" max="80" step="1" :disabled="busy" aria-label="相机垂直俯仰" />
        </div>
        <div class="rangeControl">
          <div class="rangeHeader"><span>拍摄距离</span><label class="numberControl"><input :value="settings.distance.toFixed(1)" type="number" min="2" max="10" step="0.1" :disabled="busy" aria-label="拍摄距离数值" @change="setParameter($event, 'distance')" /><span>{{ getMultiAngleShot(settings.distance) }}</span></label></div>
          <input v-model.number="settings.distance" type="range" min="2" max="10" step="0.1" :disabled="busy" aria-label="相机拍摄距离" />
        </div>
      </div>
      <div class="lensRow">
        <div class="lensControl"><span>镜头</span><div class="lensSwitch" role="group" aria-label="镜头类型"><button type="button" :aria-pressed="settings.lens === 'standard'" :disabled="busy" @click="settings.lens = 'standard'">标准</button><button type="button" :aria-pressed="settings.lens === 'wide'" :disabled="busy" @click="settings.lens = 'wide'">广角</button></div></div>
        <span class="angleSummary">相对原图 · {{ Math.round(settings.azimuth) }}° / {{ Math.round(settings.elevation) }}° · {{ getMultiAngleShot(settings.distance) }}</span>
      </div>
      <imageVariationGenerator
        v-model:generating="generating"
        :settings="settings"
        :source="source"
        :aspectRatio="sourceRatio"
        :prompt="buildMultiAnglePrompt(settings)"
        :disabled="props.disabled"
        label="多角度"
        buttonLabel="生成新视角"
        @generated="emit('close')" />
    </section>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useNode } from "@vue-flow/core";
import { ElButton } from "element-plus";
import { IconCamera, IconRestore, IconX } from "@tabler/icons-vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { buildMultiAnglePrompt, getMultiAngleShot, multiAnglePresets, readMultiAngleSettings, type MultiAngleSettings } from "../imageMultiAngle";
import imageMultiAngleStage from "./imageMultiAngleStage.vue";
import imageVariationGenerator from "./imageVariationGenerator.vue";

const props = defineProps<{ src: string; source?: NodeMediaValue; target?: HTMLElement; disabled?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const { node } = useNode();
node.data.multiAngle = readMultiAngleSettings(node.data.multiAngle);
const settings = computed(() => node.data.multiAngle as MultiAngleSettings);
const generating = ref(false);
const sourceRatio = ref(0);
const busy = computed(() => props.disabled || generating.value);
const activePreset = computed(() => multiAnglePresets.find(preset => preset.settings.azimuth === ((settings.value.azimuth + 180) % 360 + 360) % 360 - 180 && preset.settings.elevation === settings.value.elevation));

defineExpose({ generating });

function selectPreset(preset: typeof multiAnglePresets[number]) {
  if (busy.value) return;
  Object.assign(settings.value, preset.settings);
}

function setParameter(event: Event, key: "azimuth" | "elevation" | "distance") {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  if (!busy.value && input.value.trim() && Number.isFinite(value)) {
    const nextValue = key === "distance" ? Math.round(value * 10) / 10 : Math.round(value);
    settings.value[key] = readMultiAngleSettings({ ...settings.value, [key]: nextValue })[key];
  }
  input.value = key === "distance" ? settings.value[key].toFixed(1) : String(Math.round(settings.value[key]));
}

function reset() {
  if (busy.value) return;
  const { azimuth, elevation, distance, lens, viewMode } = readMultiAngleSettings({});
  Object.assign(settings.value, { azimuth, elevation, distance, lens, viewMode });
}
</script>

<style scoped lang="scss">
.multiAnglePanel {
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  box-shadow: var(--el-box-shadow-light);
  font-size: 12px;

  .panelHeader {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    .panelTitle { display: flex; align-items: center; gap: 8px; strong { font-size: 14px; } }
    .headerActions {
      display: flex; align-items: center; gap: 4px;
      .el-button { margin-left: 0; }
      .el-button:last-child { width: 26px; height: 26px; padding: 0; }
    }
  }
  .angleWorkspace {
    display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 12px;
    .presetColumn {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: 28px repeat(5, minmax(0, 1fr)); gap: 7px;
      > span { grid-column: 1 / -1; display: flex; align-items: center; color: var(--el-text-color-secondary); }
      button { min-height: 39px; padding: 7px 4px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; color: inherit; background: var(--el-fill-color-light); font: inherit; cursor: pointer; }
      button[aria-pressed="true"] { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
      button:disabled { opacity: .5; cursor: default; }
    }
    .stageColumn {
      min-width: 0;
      .stageHeader {
        display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px;
        > span { color: var(--el-text-color-secondary); }
        .viewSwitch {
          display: flex; gap: 3px; padding: 3px; border-radius: 8px; background: var(--el-fill-color-light);
          button { padding: 4px 10px; border: 0; border-radius: 5px; color: var(--el-text-color-secondary); background: transparent; font: inherit; cursor: pointer; }
          button[aria-pressed="true"] { color: var(--el-color-primary); background: var(--el-bg-color-overlay); box-shadow: 0 1px 3px #0001; }
          button:disabled { opacity: .5; cursor: default; }
        }
      }
    }
  }
  .parameterRow {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 16px;
    .rangeControl {
      display: grid; gap: 10px; min-width: 0;
      .rangeHeader {
        display: flex; align-items: center; justify-content: space-between; gap: 4px; white-space: nowrap;
        .numberControl {
          display: flex; align-items: center; gap: 4px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums;
          input { width: 62px; min-width: 0; box-sizing: border-box; padding: 3px 4px; border: 1px solid var(--el-border-color); border-radius: 5px; color: inherit; background: var(--el-bg-color); font: inherit; }
          input:focus { outline: 1px solid var(--el-color-primary); border-color: var(--el-color-primary); }
          input:disabled { opacity: .5; }
        }
      }
      > input { width: 100%; margin: 0; accent-color: var(--el-color-primary); cursor: pointer; }
      input:disabled { cursor: default; }
    }
  }
  .lensRow {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px;
    .lensControl {
      display: flex; align-items: center; gap: 12px;
      .lensSwitch {
        display: flex; gap: 3px; padding: 3px; border-radius: 8px; background: var(--el-fill-color-light);
        button { min-width: 54px; padding: 5px 8px; border: 0; border-radius: 5px; color: var(--el-text-color-secondary); background: transparent; font: inherit; cursor: pointer; }
        button[aria-pressed="true"] { color: var(--el-color-primary); background: var(--el-bg-color-overlay); box-shadow: 0 1px 3px #0001; }
        button:disabled { opacity: .5; cursor: default; }
      }
    }
    .angleSummary { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
  }
}
</style>
