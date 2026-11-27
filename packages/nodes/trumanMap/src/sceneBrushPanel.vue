<template>
  <section class="sceneBrushPanel" :class="{ pickingAssets }" aria-label="场景画笔" @keydown.esc="cancelAssetSelection">
    <template v-if="pickingAssets">
      <assetShelf class="brushAssetPicker" :localAssets="availableBrushAssets" :loadModel="loadModel" :disabled="disabled" :selectedIds="draftAssets.map(asset => asset.id)" @select="toggleDraftAsset" />
      <div class="selectionActions"><button type="button" :disabled="disabled" @click="cancelAssetSelection">取消</button><button type="button" class="useSelection" :disabled="disabled || !draftAssets.length" @click="applyAssetSelection">使用所选（{{ draftAssets.length }}）</button></div>
    </template>
    <template v-else>
      <div class="brushModes" role="group" aria-label="场景画笔类型">
        <button v-for="mode in brushModes" :key="mode.id" type="button" :class="{ active: modelValue.mode === mode.id }" :aria-pressed="modelValue.mode === mode.id" :disabled="disabled" @click="chooseMode(mode.id)"><component :is="mode.icon" :size="15" /><span>{{ translate(mode.name) }}</span></button>
      </div>
      <template v-if="modelValue.mode === 'assets'">
        <div class="brushSelection"><div><h3>涂放物件</h3><span>已选 {{ modelValue.assets.length }} 种</span></div><button type="button" :disabled="disabled" @click="openAssetSelection"><icon-plus :size="14" />{{ modelValue.assets.length ? '更换素材' : '选择素材' }}</button></div>
        <ul v-if="modelValue.assets.length" class="brushSlots" aria-label="已选涂放物件">
          <li v-for="choice in visibleChoices" :key="choice.id" class="brushSlot" :title="translate(choice.name)">
            <assetThumbnail :asset="choice.asset" :loadModel="loadModel" />
            <span>{{ translate(choice.name) }}</span>
            <button type="button" class="removeBrushAsset" :disabled="disabled" :aria-label="'移出笔刷：' + translate(choice.name)" :title="'移出笔刷：' + translate(choice.name)" @click="removeAsset(choice.id)"><icon-x :size="13" /></button>
          </li>
        </ul>
        <p v-else class="emptySelection">先选择素材，可以同时选多种。</p>
      </template>
      <template v-else>
        <label class="brushSearch"><icon-search :size="15" /><input v-model="search" type="search" :placeholder="'搜索' + brushName" :aria-label="'搜索' + brushName + '笔刷'" :disabled="disabled" /></label>
        <div class="brushFilters"><label><span>{{ modelValue.mode === 'wall' ? '类型' : '用途' }}</span><select v-model="group" :disabled="disabled" :aria-label="brushName + '分类'"><option value="">全部</option><option v-for="item in groups" :key="item" :value="item">{{ translate(item) }}</option></select></label><span>{{ choices.length }} 种</span></div>
        <div class="brushAssets" :aria-label="brushName + '样式'">
          <button v-for="choice in visibleChoices" :key="choice.id" type="button" class="brushAsset" :class="{ active: selectedChoice === choice.id }" :aria-pressed="selectedChoice === choice.id" :disabled="disabled" :title="translate(choice.name)" @click="chooseAsset(choice)"><assetThumbnail :asset="choice.asset" :loadModel="loadModel" /><span>{{ translate(choice.name) }}</span></button>
        </div>
        <p v-if="!choices.length" class="emptySelection">没有匹配的样式，换个关键词试试。</p>
      </template>
      <nav v-if="choicePageCount > 1" class="choicePages" :aria-label="modelValue.mode === 'assets' ? '已选物件分页' : '笔刷样式分页'"><button type="button" :disabled="disabled || choicePage === 1" aria-label="上一组" @click="choicePage--"><icon-chevron-left :size="14" /></button><span>{{ choicePage }} / {{ choicePageCount }}</span><button type="button" :disabled="disabled || choicePage === choicePageCount" aria-label="下一组" @click="choicePage++"><icon-chevron-right :size="14" /></button></nav>

      <div class="brushParameters">
        <template v-if="modelValue.mode === 'assets'">
          <label class="brushRange"><span>范围 <output>{{ modelValue.radius.toFixed(1) }} <small>m</small></output></span><el-slider :modelValue="modelValue.radius" :min="1" :max="16" :step="0.5" :disabled="controlsDisabled" :showTooltip="false" aria-label="涂放范围半径" @update:modelValue="value => changeNumber('radius', value, 1, 16)" /></label>
          <label class="brushRange"><span>疏密 <output>间隔 {{ modelValue.spacing.toFixed(1) }} <small>m</small></output></span><el-slider :modelValue="13 - modelValue.spacing" :min="1" :max="12" :step="0.5" :disabled="controlsDisabled" :showTooltip="false" aria-label="物件疏密，向右更密集" @update:modelValue="changeDensity" /></label>
          <div class="densityChoices" role="group" aria-label="物件疏密快捷选择"><button v-for="density in densityChoices" :key="density.name" type="button" :class="{ active: Math.abs(modelValue.spacing - density.spacing) < 0.01 }" :aria-pressed="Math.abs(modelValue.spacing - density.spacing) < 0.01" :disabled="controlsDisabled" @click="changeNumber('spacing', density.spacing, 1, 12)">{{ translate(density.name) }}</button></div>
          <label class="brushRange"><span>大小 <output>{{ Math.round(modelValue.size * 100) }}<small>%</small></output></span><el-slider :modelValue="modelValue.size" :min="0.25" :max="3" :step="0.05" :disabled="controlsDisabled" :showTooltip="false" aria-label="涂放物件大小" @update:modelValue="value => changeNumber('size', value, 0.25, 3)" /></label>
        </template>
        <template v-else-if="modelValue.mode === 'wall'">
          <label class="brushRange"><span>高度 <output>{{ modelValue.height.toFixed(1) }} <small>m</small></output></span><el-slider :modelValue="modelValue.height" :min="0.2" :max="8" :step="0.1" :disabled="controlsDisabled" :showTooltip="false" aria-label="围墙高度" @update:modelValue="value => changeNumber('height', value, 0.2, 8)" /></label>
          <label class="brushRange"><span>厚度 <output>{{ modelValue.width.toFixed(2) }} <small>m</small></output></span><el-slider :modelValue="modelValue.width" :min="0.08" :max="2" :step="0.02" :disabled="controlsDisabled" :showTooltip="false" aria-label="围墙厚度" @update:modelValue="value => changeNumber('width', value, 0.08, 2)" /></label>
        </template>
        <label v-else class="brushRange"><span>宽度 <output>{{ modelValue.width.toFixed(1) }} <small>m</small></output></span><el-slider :modelValue="modelValue.width" :min="0.4" :max="20" :step="0.2" :disabled="controlsDisabled" :showTooltip="false" aria-label="铺装路面宽度" @update:modelValue="value => changeNumber('width', value, 0.4, 20)" /></label>
      </div>

      <div class="paintingControls">
        <div class="brushStatus" role="status" aria-live="polite" aria-atomic="true"><icon-check v-if="brushReady && !disabled" :size="13" /><span>{{ statusLabel }}</span></div>
        <progress v-if="painting && hasSelection && !brushReady && status?.loading" class="prepareProgress" :max="prepareTotal || 1" :value="prepareTotal ? preparedCount : undefined" aria-label="准备素材进度"></progress>
        <button type="button" class="paintingButton" :class="{ active: painting && brushReady }" :disabled="paintingActionDisabled" :aria-pressed="painting" @click="togglePainting"><icon-player-pause v-if="painting" :size="16" /><icon-brush v-else :size="16" /><span>{{ painting ? '暂停绘制' : '继续绘制' }}</span></button>
      </div>
      <p class="brushHint">{{ modelValue.mode === 'assets' ? '按住左键涂放，多选混刷；每件物体都可单独编辑。' : modelValue.mode === 'wall' ? '按住左键画围墙，松手完成。' : '按住左键铺路面，松手完成。' }}</p>
      <p class="brushHint shortcutHint">Esc 取消本笔 · Ctrl+Z 撤销</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElSlider } from "element-plus";
import { markMessages, t, translate } from "@toonflow/i18n/vue";
import { IconBrush, IconCheck, IconChevronLeft, IconChevronRight, IconCube, IconPlayerPause, IconPlus, IconRoad, IconSearch, IconWall, IconX } from "@tabler/icons-vue";
import assetThumbnail from "./assetThumbnail.vue";
import assetShelf from "./assetShelf.vue";
import { treeBrushAssets, wallBrushStyles, pavingBrushStyles, type SceneBrushMode, type SceneBrushSettings, type SceneBrushStatus } from "./sceneBrushAssets";
import type { SceneAsset } from "./sceneDocument";

const props = defineProps<{ modelValue: SceneBrushSettings; availableAssets: SceneAsset[]; loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>; disabled?: boolean; painting: boolean; status?: SceneBrushStatus }>();
const emit = defineEmits<{ "update:modelValue": [value: SceneBrushSettings]; choose: [value: SceneBrushSettings]; assetsLoaded: [assets: SceneAsset[]]; selecting: [value: boolean]; togglePainting: [] }>();
type BrushChoice = (typeof wallBrushStyles)[number];
const brushModes = markMessages([{ id: "assets", name: "素材", icon: IconCube }, { id: "wall", name: "围墙", icon: IconWall }, { id: "paving", name: "铺装", icon: IconRoad }] as const);
const densityChoices = markMessages([{ name: "稀疏", spacing: 6 }, { name: "适中", spacing: 3 }, { name: "密集", spacing: 1.5 }]);
const pickingAssets = ref(false);
const draftAssets = ref<SceneAsset[]>([]);
const availableBrushAssets = computed(() => [...new Map([...treeBrushAssets, ...props.availableAssets, ...props.modelValue.assets].map(asset => [asset.id, asset])).values()]);
const search = ref("");
const group = ref("");
const choicePage = ref(1);
const pageSize = computed(() => props.modelValue.mode === "assets" ? 6 : 9);
const brushName = computed(() => translate(brushModes.find(mode => mode.id === props.modelValue.mode)!.name));
const allChoices = computed<BrushChoice[]>(() => {
  if (props.modelValue.mode === "wall") return wallBrushStyles;
  if (props.modelValue.mode === "paving") return pavingBrushStyles;
  return props.modelValue.assets.map(asset => ({ id: asset.id, name: asset.name, asset }));
});
const groups = computed(() => [...new Set(allChoices.value.map(choice => choice.group).filter((value): value is string => !!value))]);
const choices = computed(() => {
  if (props.modelValue.mode === "assets") return allChoices.value;
  const query = search.value.trim().toLocaleLowerCase();
  return allChoices.value.filter(choice => (!group.value || choice.group === group.value) && (!query || (choice.name + " " + choice.id + " " + (choice.group ?? "")).toLocaleLowerCase().includes(query)));
});
const choicePageCount = computed(() => Math.max(1, Math.ceil(choices.value.length / pageSize.value)));
const visibleChoices = computed(() => choices.value.slice((choicePage.value - 1) * pageSize.value, choicePage.value * pageSize.value));
const selectedChoice = computed(() => props.modelValue.style);
const hasSelection = computed(() => props.modelValue.mode === "assets" ? props.modelValue.assets.length > 0 : !!props.modelValue.style);
const controlsDisabled = computed(() => !!props.disabled || !hasSelection.value);
const brushReady = computed(() => hasSelection.value && (props.status?.ready ?? true));
const prepareTotal = computed(() => Math.max(0, props.status?.total ?? props.modelValue.assets.length));
const preparedCount = computed(() => Math.max(0, Math.min(prepareTotal.value, prepareTotal.value - (props.status?.loading ?? 0))));
const paintingActionDisabled = computed(() => !!props.disabled || !hasSelection.value);
const statusLabel = computed(() => {
  if (props.disabled) return translate("暂不可绘制");
  if (!hasSelection.value) return translate("选择素材后即可涂放");
  if (!props.painting) return translate("已暂停 · 可以自由浏览");
  if (!brushReady.value && prepareTotal.value > 0 && props.status?.loading === 0) return translate("素材准备失败，请重新选择");
  if (!brushReady.value) return t`准备素材 ${preparedCount.value} / ${prepareTotal.value}`;
  return props.modelValue.mode === "assets" ? translate("可涂放 · 按住左键开始") : translate("可绘制 · 按住左键开始");
});

function openAssetSelection() {
  if (props.disabled) return;
  draftAssets.value = [...props.modelValue.assets];
  pickingAssets.value = true;
}
function toggleDraftAsset(asset: SceneAsset) {
  if (props.disabled) return;
  draftAssets.value = draftAssets.value.some(item => item.id === asset.id) ? draftAssets.value.filter(item => item.id !== asset.id) : [...draftAssets.value, asset];
}
function cancelAssetSelection(event?: Event) {
  if (!pickingAssets.value) return;
  event?.preventDefault();
  event?.stopPropagation();
  pickingAssets.value = false;
}
function applyAssetSelection() {
  if (props.disabled || !draftAssets.value.length) return;
  const assets = [...draftAssets.value];
  pickingAssets.value = false;
  choicePage.value = 1;
  emit("assetsLoaded", assets);
  emit("choose", { ...props.modelValue, mode: "assets", assets });
}
function chooseMode(mode: SceneBrushMode) {
  if (props.disabled || mode === props.modelValue.mode) return;
  const settings = { ...props.modelValue, mode };
  if (mode !== "assets") {
    const choice = (mode === "wall" ? wallBrushStyles : pavingBrushStyles)[0]!;
    settings.style = choice.id;
    settings.width = choice.width ?? (mode === "wall" ? 0.25 : 3);
    settings.height = choice.height ?? (mode === "wall" ? 1.8 : 0.08);
  }
  emit("choose", settings);
}
function removeAsset(id: string) {
  if (!props.disabled) emit("update:modelValue", { ...props.modelValue, assets: props.modelValue.assets.filter(asset => asset.id !== id) });
}
function chooseAsset(choice: BrushChoice) {
  if (props.disabled || props.modelValue.style === choice.id) return;
  emit("choose", { ...props.modelValue, style: choice.id, width: choice.width ?? (props.modelValue.mode === "wall" ? 0.25 : 3), height: choice.height ?? (props.modelValue.mode === "wall" ? 1.8 : 0.08) });
}
function changeDensity(value: number | number[]) {
  if (typeof value === "number") changeNumber("spacing", 13 - value, 1, 12);
}
function changeNumber(field: "radius" | "spacing" | "size" | "width" | "height", value: number | number[], minimum: number, maximum: number) {
  if (!controlsDisabled.value && typeof value === "number" && Number.isFinite(value)) emit("update:modelValue", { ...props.modelValue, [field]: Math.min(maximum, Math.max(minimum, value)) });
}
function togglePainting() { if (!paintingActionDisabled.value) emit("togglePainting"); }
watch([search, group], () => { choicePage.value = 1; });
watch(() => props.modelValue.mode, () => { search.value = ""; group.value = ""; choicePage.value = 1; });
watch(choicePageCount, count => { choicePage.value = Math.min(choicePage.value, count); });
watch(pickingAssets, value => emit("selecting", value), { flush: "sync" });
onMounted(() => { emit("assetsLoaded", treeBrushAssets); });
onBeforeUnmount(() => emit("selecting", false));
</script>

<style scoped lang="scss">
.sceneBrushPanel {
  padding: 10px 0 14px;
  &.pickingAssets { display: flex; flex-direction: column; height: min(640px, 68vh); min-height: 320px; padding: 0; }
  > .brushAssetPicker { flex: 1; min-height: 0; height: auto; }
  button, input, select { font: inherit; color: inherit; }
  button { border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; &:disabled { opacity: 0.4; cursor: default; } &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  .brushModes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; margin-bottom: 14px; > button { display: inline-flex; justify-content: center; align-items: center; gap: 5px; min-height: 32px; padding: 5px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 12px; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } } }
  .brushSelection { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; > div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; min-width: 0; h3 { margin: 0; font-size: 12px; font-weight: 600; } > span { color: var(--el-text-color-regular); font-size: 10px; font-variant-numeric: tabular-nums; } } > button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; gap: 4px; min-height: 30px; padding: 5px 7px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); font-size: 11px; &:hover:not(:disabled) { background: var(--studioHoverBackground); } } }
  .brushSlots { display: flex; gap: 6px; margin: 0; padding: 3px 1px 7px; overflow-x: auto; overscroll-behavior: contain; list-style: none; scrollbar-width: thin; scrollbar-color: var(--el-border-color) transparent;
    .brushSlot { position: relative; display: flex; flex: 0 0 66px; flex-direction: column; gap: 4px; min-width: 0; padding: 5px; border-radius: 7px; background: var(--studioControlBackground); > :deep(.assetThumbnail) { width: 100%; height: 50px; min-height: 50px; aspect-ratio: auto; background: transparent; } > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; line-height: 16px; text-align: center; } .removeBrushAsset { position: absolute; top: 1px; right: 1px; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border-radius: 5px; background: var(--studioControlBackground); color: var(--el-text-color-regular); &:hover:not(:disabled) { color: var(--el-text-color-primary); background: var(--studioHoverBackground); } } }
  }
  .emptySelection { margin: 0; padding: 14px 6px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.6; text-align: center; }
  .selectionActions { display: flex; justify-content: flex-end; flex-shrink: 0; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--studioBorderColor); > button { min-height: 34px; padding: 5px 12px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.useSelection { background: var(--studioActiveBackground); color: var(--studioActiveText); } } }
  .brushSearch { display: flex; align-items: center; gap: 7px; min-height: 32px; margin-bottom: 8px; padding: 0 8px; border: 1px solid var(--studioBorderColor); border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); color: var(--el-text-color-regular); &:focus-within { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } > input { min-width: 0; width: 100%; height: 30px; padding: 5px 0; border: 0; outline: none; background: transparent; &::placeholder { color: var(--el-text-color-regular); } } }
  .brushFilters { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: var(--el-text-color-regular); font-size: 11px;
    > label { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; > span { flex-shrink: 0; } > select { min-width: 0; width: 100%; min-height: 30px; padding: 4px 7px; border: 1px solid var(--studioBorderColor); border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } option { color: var(--el-text-color-primary); background: var(--el-bg-color-overlay); } } } > span { flex-shrink: 0; font-variant-numeric: tabular-nums; }
  }
  .brushAssets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px;
    .brushAsset { display: flex; flex-direction: column; align-items: stretch; gap: 3px; min-width: 0; padding: 3px 3px 5px; border-radius: 7px; background: var(--studioControlBackground); color: var(--el-text-color-regular); &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { outline: 1px solid var(--el-color-primary); outline-offset: -1px; color: var(--studioActiveText); background: var(--studioActiveBackground); } > :deep(.assetThumbnail) { width: 100%; height: 48px; min-height: 48px; aspect-ratio: auto; background: transparent; } > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; line-height: 16px; text-align: center; } }
  }
  .choicePages { display: flex; justify-content: flex-end; align-items: center; gap: 7px; margin-top: 6px; > button { display: grid; place-items: center; min-width: 28px; min-height: 26px; padding: 3px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); &:hover:not(:disabled) { background: var(--studioHoverBackground); } } > span { color: var(--el-text-color-regular); font-size: 10px; font-variant-numeric: tabular-nums; } }
  .brushParameters { display: grid; gap: 7px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter);
    .brushRange { display: grid; grid-template-columns: 112px minmax(0, 1fr); align-items: center; gap: 8px; min-height: 28px; > span { display: flex; align-items: center; justify-content: space-between; gap: 5px; color: var(--el-text-color-regular); font-size: 11px; output { color: var(--el-text-color-primary); font-size: 10px; font-variant-numeric: tabular-nums; small { color: var(--el-text-color-regular); font-size: 10px; } } } .el-slider { height: 26px; min-width: 0; padding-inline: 4px; --el-slider-height: 3px; --el-slider-button-size: 10px; } }
    .densityChoices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; > button { min-height: 26px; padding: 3px 5px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 10px; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } } }
  }
  .paintingControls { margin-top: 14px;
    .brushStatus { display: flex; align-items: center; gap: 5px; min-height: 20px; color: var(--el-text-color-regular); font-size: 10px; line-height: 1.6; font-variant-numeric: tabular-nums; }
    .prepareProgress { display: block; width: 100%; height: 3px; margin: 5px 0 8px; border: 0; border-radius: 3px; overflow: hidden; background: var(--studioControlBackground); accent-color: var(--el-color-primary); &::-webkit-progress-bar { background: var(--studioControlBackground); } &::-webkit-progress-value { background: var(--el-color-primary); } &::-moz-progress-bar { background: var(--el-color-primary); } }
    .paintingButton { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; min-height: 38px; margin-top: 5px; padding: 8px 10px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); font-size: 12px; font-weight: 500; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } }
  }
  .brushHint { margin: 8px 0 0; color: var(--el-text-color-regular); font-size: 10px; line-height: 1.6; &.shortcutHint { margin-top: 3px; } }
}
</style>
