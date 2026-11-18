<template>
  <section class="assetShelf" aria-label="素材库" @dragstart.prevent @pointermove="moveAssetDrag" @pointerup="finishAssetDrag" @pointercancel="cancelAssetDrag">
    <header class="shelfHeader">
      <h2>{{ selecting ? '选择笔刷素材' : '添加素材' }}</h2>
      <el-button v-if="!selecting" size="small" :disabled="disabled" title="导入不超过 50 MB 的自包含 GLB" @click="fileInput?.click()"><icon-upload :size="15" />导入 GLB</el-button>
      <input ref="fileInput" class="fileInput" type="file" accept=".glb,model/gltf-binary" @change="importAsset" />
    </header>
    <div class="searchRow">
      <label class="searchField"><icon-search :size="15" /><input v-model="search" type="search" placeholder="搜索主素材" aria-label="搜索主素材" /></label>
    </div>
    <div class="assetFilters">
      <label><span>分类</span><select v-model="categoryChoice" :disabled="disabled" aria-label="素材分类"><option v-for="item in categories" :key="item" :value="item">{{ item === '全部' ? '全部分类' : item }}</option><option v-if="!selecting" value="整套景">整套景</option><option v-if="recentIds.length" value="最近用过">最近用过</option></select></label>
      <label><span>题材</span><select v-model="theme" :disabled="disabled || category === '基础' || setsMode" aria-label="素材题材"><option value="">全部题材</option><option v-for="item in assetThemes" :key="item" :value="item">{{ item }}</option></select></label>
      <label><span>类型</span><select v-model="itemType" :disabled="disabled || category === '基础' || setsMode" aria-label="物品类型"><option value="">全部类型</option><option v-for="item in assetItemTypes" :key="item" :value="item">{{ item }}</option></select></label>
    </div>
    <div class="libraryHeading">
      <span :title="setsMode ? undefined : `${filteredAssets.length.toLocaleString()} 个主素材，另含 ${(assetTotal - filteredAssets.length).toLocaleString()} 个款式与状态`">{{ setsMode ? `${filteredSets.length} 套整套景` : `${assetTotal.toLocaleString()} 个素材` }}</span>
      <span>{{ setsMode ? '点击放到视野附近的空地' : selecting ? `已选 ${selectedIds?.length ?? 0} 种 · 点击多选` : '点击添加 · 拖入放置' }}</span>
    </div>
    <div ref="assetContent" class="assetContent">
      <div v-if="fileError" class="libraryNotice" role="alert"><p>{{ fileError }}</p></div>
      <div v-if="setsMode" class="setGrid">
        <button v-for="template in filteredSets" :key="template.id" type="button" class="setCard" :disabled="disabled" :title="`在视野附近的空地搭好整套${template.name}，每件都可再改`" @click="emit('addSet', template.id)"><strong>{{ template.name }}</strong><span>{{ template.genre }} · 约{{ template.half[0] * 2 }}×{{ template.half[1] * 2 }}米</span></button>
      </div>
      <div v-else class="assetGrid">
        <template v-for="(row, rowIndex) in assetRows" :key="rowIndex">
          <div class="assetRow" :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }">
            <article v-for="asset in row" :key="asset.id" class="assetCard" :class="{ expanded: expandedAsset?.id === asset.id }">
              <button type="button" class="assetMain" :class="{ selected: selecting && selectedIdSet.has(asset.id), selecting }" :disabled="disabled" draggable="false" :aria-pressed="selecting ? selectedIdSet.has(asset.id) : undefined" :title="selecting ? `${asset.name} · 点击${selectedIdSet.has(asset.id) ? '取消选择' : '加入笔刷'}` : `${asset.name} · 点击添加或拖入场景`" @click="addAsset(asset, $event)" @pointerdown="startAssetDrag($event, asset)">
                <assetThumbnail :asset="asset" :loadModel="loadModel" />
                <span v-if="selecting" class="selectionMark" aria-hidden="true"><icon-check v-if="selectedIdSet.has(asset.id)" :size="12" /></span>
                <span class="assetName">{{ asset.name }}</span>
                <span class="assetMeta">{{ asset.theme || asset.category }}<span v-if="asset.theme"> · {{ getAssetItemType(asset) }}</span></span>
              </button>
              <button v-if="derivableIds.has(asset.id)" type="button" class="derivativeToggle" :disabled="disabled" :aria-label="`${asset.name}的款式与状态`" :aria-expanded="expandedAsset?.id === asset.id" :aria-controls="derivativePanelId" @click="toggleDerivatives(asset)"><span>款式与状态</span><icon-chevron-down :size="12" /></button>
            </article>
          </div>
          <section v-if="expandedAsset && row.some(asset => asset.id === expandedAsset?.id)" :id="derivativePanelId" class="derivativePanel" :aria-label="`${expandedAsset.name}的款式与状态`">
            <header class="derivativeHeader"><strong>{{ expandedAsset.name }}</strong><span>{{ derivatives.length }} 个衍生</span><button type="button" aria-label="收起衍生素材" @click="closeDerivatives"><icon-x :size="14" /></button></header>
            <div class="derivativeFilters">
              <label><span>状态</span><select v-model="derivativeState" :disabled="disabled" aria-label="衍生状态"><option value="">全部状态</option><option v-for="item in assetStates" :key="item" :value="item">{{ item }}</option></select></label>
              <label v-if="derivativeVariants.length"><span>款式</span><select v-model="derivativeVariant" :disabled="disabled" aria-label="衍生款式"><option value="">全部款式</option><option v-for="variant in derivativeVariants" :key="variant" :value="variant">{{ variantName(variant) }}</option></select></label>
            </div>
            <div class="derivativeGrid" :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }">
              <button v-for="asset in visibleDerivatives" :key="asset.id" type="button" class="derivativeCard" :class="{ selected: selecting && selectedIdSet.has(asset.id), selecting }" :disabled="disabled" draggable="false" :aria-pressed="selecting ? selectedIdSet.has(asset.id) : undefined" :title="selecting ? `${asset.name} · 点击${selectedIdSet.has(asset.id) ? '取消选择' : '加入笔刷'}` : `${asset.name} · 点击添加或拖入场景`" @click="addAsset(asset, $event)" @pointerdown="startAssetDrag($event, asset)">
                <span v-if="selecting" class="selectionMark" aria-hidden="true"><icon-check v-if="selectedIdSet.has(asset.id)" :size="12" /></span>
                <assetThumbnail :asset="asset" :loadModel="loadModel" /><span>{{ asset.recipe ? `${asset.state || '原始'} · ${variantName(asset.recipe.variant)}` : asset.name }}</span>
              </button>
            </div>
            <nav v-if="derivativePageCount > 1" class="derivativePages" aria-label="衍生素材分页"><button type="button" :disabled="disabled || derivativePage === 1" @click="derivativePage--">上一组</button><span>{{ derivativePage }} / {{ derivativePageCount }}</span><button type="button" :disabled="disabled || derivativePage === derivativePageCount" @click="derivativePage++">下一组</button></nav>
            <p v-if="!filteredDerivatives.length" class="derivativeEmpty">该状态下没有此款式</p>
          </section>
        </template>
      </div>
      <p v-if="setsMode ? !filteredSets.length : !filteredAssets.length" class="emptyMessage">没有匹配的{{ setsMode ? '整套景' : '素材' }}</p>
    </div>
    <nav v-if="!setsMode && assetPageCount > 1" class="assetPages" aria-label="素材分页">
      <button type="button" :disabled="disabled || assetPage === 1" @click="assetPage--">上一页</button>
      <label><input type="number" :value="assetPage" min="1" :max="assetPageCount" step="1" :disabled="disabled" aria-label="素材页码" @change="changeAssetPage" /><span>/ {{ assetPageCount }}</span></label>
      <button type="button" :disabled="disabled || assetPage === assetPageCount" @click="assetPage++">下一页</button>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue";
import { ElButton } from "element-plus";
import { IconCheck, IconChevronDown, IconSearch, IconUpload, IconX } from "@tabler/icons-vue";
import assetThumbnail from "./assetThumbnail.vue";
import { builtinAssets } from "./assetLibrary";
import { assetThemes, assetStates, assetItemTypes, type AssetCategory, type AssetTheme, type AssetState, type AssetItemType, type SceneAsset } from "./sceneDocument";
import { getAssetItemType } from "./assetMetadata";
import { setTemplates } from "./setTemplates";
import { sameJson } from "./sameJson";
import { countAssetDerivatives, getAssetDerivatives, getAssetSearchText, hasAssetDerivatives, isCatalogDerivative, matchesAssetFilters, matchesSearchToken } from "./assetCatalog";

const props = defineProps<{
  localAssets?: SceneAsset[];
  loadModel?: (asset: SceneAsset) => Promise<ArrayBuffer>;
  disabled?: boolean;
  selectedIds?: string[];
}>();
const emit = defineEmits<{ addSet: [templateId: string]; add: [asset: SceneAsset]; select: [asset: SceneAsset]; import: [file: File]; assetsLoaded: [assets: SceneAsset[]]; assetDragStart: [asset: SceneAsset]; assetDragMove: [x: number, y: number]; assetDrop: [x: number, y: number]; assetDragCancel: [] }>();
const selecting = computed(() => props.selectedIds !== undefined);
const selectedIdSet = computed(() => new Set(props.selectedIds));
const fileInput = ref<HTMLInputElement>();
const assetContent = ref<HTMLElement>();
const search = ref("");
const category = ref<AssetCategory>("全部");
// ACT: “整套景”是分类下拉里的一项：选中后列出一键布景模板，给已有场景追加整套景（空场景在输入框上方另有卡片）。
const setsMode = ref(false);
// ACT: “最近用过”也是分类下拉里的一项：最近点过、拖过的素材（最多24种，记在本机），按用的先后排，常用的不用每次重搜。
const recentMode = ref(false);
const recentIds = ref<string[]>((() => { try { const value = JSON.parse(localStorage.getItem("trumanMap.recentAssets") ?? "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(0, 24) : []; } catch { return []; } })());
function rememberAsset(asset: SceneAsset) {
  recentIds.value = [asset.id, ...recentIds.value.filter(id => id !== asset.id)].slice(0, 24);
  try { localStorage.setItem("trumanMap.recentAssets", JSON.stringify(recentIds.value)); } catch { /* 存不下就只在本次生效 */ }
}
const categoryChoice = computed({ get: () => setsMode.value ? "整套景" : recentMode.value ? "最近用过" : category.value, set: (value: string) => { setsMode.value = value === "整套景"; recentMode.value = value === "最近用过"; if (!setsMode.value && !recentMode.value) category.value = value as AssetCategory; else if (recentMode.value) category.value = "全部" as AssetCategory; } });
const filteredSets = computed(() => { const query = search.value.trim(); return setTemplates.filter(template => !query || (template.name + template.genre).includes(query)); });
const theme = ref<AssetTheme | "">("");
const itemType = ref<AssetItemType | "">("");
const categories: AssetCategory[] = ["全部", "基础", "自然", "道具", "建筑", "本地", "生成"];
const assetPage = ref(1);
const assetPageSize = 48;
const columnCount = ref(4);
const derivativePanelId = `assetDerivatives${useId()}`;
const expandedAsset = shallowRef<SceneAsset>();
const derivatives = shallowRef<SceneAsset[]>([]);
const derivativeState = ref<AssetState | "">("原始");
const derivativeVariant = ref<number | "">("");
const derivativePage = ref(1);
const derivativePageSize = 12;
const derivableIds = new Set(builtinAssets.filter(hasAssetDerivatives).map(asset => asset.id));
const localAssets = shallowRef<SceneAsset[]>([]);
const fileError = ref("");
let cardPointer: { id: number; card: HTMLElement; asset: SceneAsset; x: number; y: number; dragging: boolean } | undefined;
let suppressPointerClick = false;
let resizeObserver: ResizeObserver | undefined;

// 变换只改物体位置，不重建目录；仅素材定义、文件或目录实际变化时重新合并。
// 按引用逐层比较（不整份 JSON.stringify）：场景里内联了 AI 模型顶点时，每次提交都序列化几 MB。
watch(() => props.localAssets ?? [], assets => { if (!sameJson(assets, localAssets.value)) localAssets.value = assets; }, { immediate: true });
const allAssets = computed(() => [...new Map([...builtinAssets, ...localAssets.value].filter(asset => !isCatalogDerivative(asset)).map(asset => [asset.id, asset])).values()]);
// ACT: 搜索按空格分词（“古代 椅子”两个词都要对上），名字里就有的排在只是标签沾边的前面，名字正好相同的最前；同档内保持素材库原有顺序。
const filteredAssets = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  if (recentMode.value) { const byId = new Map(allAssets.value.map(asset => [asset.id, asset])); return recentIds.value.map(id => byId.get(id)).filter((asset): asset is SceneAsset => !!asset && (!tokens.length || tokens.every(token => matchesSearchToken(getAssetSearchText(asset), token)))); }
  const matched = allAssets.value.filter(asset => matchesAssetFilters(asset, { category: category.value, theme: theme.value, itemType: itemType.value }) && (!tokens.length || (text => tokens.every(token => matchesSearchToken(text, token)))(getAssetSearchText(asset))));
  if (!tokens.length) return matched;
  const tier = (asset: SceneAsset) => { const name = asset.name.toLocaleLowerCase(); return name === query ? 0 : tokens.some(token => name.includes(token)) ? 1 : 2; };
  return matched.map((asset, index) => ({ asset, index, tier: tier(asset) })).sort((a, b) => a.tier - b.tier || a.index - b.index).map(item => item.asset);
});
// 全部数量 = 列出的主素材 + 展开后能看到的款式与状态（与衍生面板同样按分类、题材、类型及名称筛选，不计面板内的状态/款式选择）。
const assetTotal = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const matchesMetadata = (asset: SceneAsset) => (category.value === "全部" || asset.category === category.value) && (!theme.value || asset.theme === theme.value) && (!itemType.value || getAssetItemType(asset) === itemType.value);
  return filteredAssets.value.reduce((sum, asset) => {
    if (!derivableIds.has(asset.id)) return sum + 1;
    if (!query || getAssetSearchText(asset, false).includes(query)) return sum + 1 + countAssetDerivatives(asset, matchesMetadata);
    return sum + 1 + getAssetDerivatives(asset).filter(child => matchesMetadata(child) && getAssetSearchText(child).includes(query)).length;
  }, 0);
});
const assetPageCount = computed(() => Math.max(1, Math.ceil(filteredAssets.value.length / assetPageSize)));
const visibleAssets = computed(() => filteredAssets.value.slice((assetPage.value - 1) * assetPageSize, assetPage.value * assetPageSize));
const assetRows = computed(() => Array.from({ length: Math.ceil(visibleAssets.value.length / columnCount.value) }, (_, index) => visibleAssets.value.slice(index * columnCount.value, (index + 1) * columnCount.value)));
const derivativeVariants = computed(() => [...new Set(derivatives.value.flatMap(asset => asset.recipe ? [asset.recipe.variant] : []))].sort((first, second) => first - second));
const filteredDerivatives = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const filterByName = !!query && expandedAsset.value && !getAssetSearchText(expandedAsset.value, false).includes(query);
  return derivatives.value.filter(asset => (category.value === "全部" || asset.category === category.value) && (!theme.value || asset.theme === theme.value) && (!itemType.value || getAssetItemType(asset) === itemType.value) && (!derivativeState.value || (asset.state ?? "原始") === derivativeState.value) && (derivativeVariant.value === "" || (asset.recipe?.variant ?? 0) === derivativeVariant.value) && (!filterByName || getAssetSearchText(asset).includes(query)));
});
const derivativePageCount = computed(() => Math.max(1, Math.ceil(filteredDerivatives.value.length / derivativePageSize)));
const visibleDerivatives = computed(() => filteredDerivatives.value.slice((derivativePage.value - 1) * derivativePageSize, derivativePage.value * derivativePageSize));

watch(allAssets, assets => emit("assetsLoaded", assets), { immediate: true });
watch([search, category, theme, itemType], () => { assetPage.value = 1; closeDerivatives(); assetContent.value?.scrollTo({ top: 0 }); });
watch(assetPageCount, count => { assetPage.value = Math.min(assetPage.value, count); });
watch(assetPage, () => { closeDerivatives(); assetContent.value?.scrollTo({ top: 0 }); }, { flush: "post" });
watch(category, value => { if (value === "基础") { theme.value = ""; itemType.value = ""; } });
watch([derivativeState, derivativeVariant], () => { derivativePage.value = 1; });
watch([() => props.disabled, selecting], ([disabled, choosing]) => { if (disabled || choosing) cancelAssetDrag(); });

function closeDerivatives() { expandedAsset.value = undefined; derivatives.value = []; }
function toggleDerivatives(asset: SceneAsset) {
  if (props.disabled) return;
  if (expandedAsset.value?.id === asset.id) { closeDerivatives(); return; }
  derivatives.value = getAssetDerivatives(asset);
  expandedAsset.value = asset;
  derivativeState.value = "原始";
  derivativeVariant.value = "";
  derivativePage.value = 1;
}
function variantName(variant: number) { return variant ? `款式 ${String(variant).padStart(2, "0")}` : "原版"; }

function changeAssetPage(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!props.disabled && Number.isInteger(input.valueAsNumber)) assetPage.value = Math.max(1, Math.min(assetPageCount.value, input.valueAsNumber));
  input.value = String(assetPage.value);
}

function startAssetDrag(event: PointerEvent, asset: SceneAsset) {
  if (!event.isPrimary || event.button !== 0 || cardPointer) return;
  suppressPointerClick = false;
  if (props.disabled || selecting.value) return;
  const card = event.currentTarget as HTMLElement;
  cardPointer = { id: event.pointerId, card, asset, x: event.clientX, y: event.clientY, dragging: false };
  card.setPointerCapture(event.pointerId);
  card.ownerDocument.addEventListener("lostpointercapture", lostAssetCapture, true);
  card.ownerDocument.defaultView?.addEventListener("blur", cancelAssetDrag);
  card.ownerDocument.defaultView?.addEventListener("keydown", escapeAssetDrag, true);
}
function moveAssetDrag(event: PointerEvent) {
  const pointer = cardPointer;
  if (!pointer || pointer.id !== event.pointerId) return;
  if (!(event.buttons & 1) || props.disabled || selecting.value) { cancelAssetDrag(); return; }
  if (!pointer.dragging) {
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (Math.hypot(dx, dy) < 6 || event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) return;
    pointer.dragging = true;
    rememberAsset(pointer.asset);
    emit("assetDragStart", pointer.asset);
  }
  event.preventDefault();
  emit("assetDragMove", event.clientX, event.clientY);
}
function releaseCardPointer() {
  const pointer = cardPointer;
  cardPointer = undefined;
  if (!pointer) return;
  const owner = pointer.card.ownerDocument.defaultView;
  pointer.card.ownerDocument.removeEventListener("lostpointercapture", lostAssetCapture, true);
  owner?.removeEventListener("blur", cancelAssetDrag);
  owner?.removeEventListener("keydown", escapeAssetDrag, true);
  if (pointer.card.hasPointerCapture(pointer.id)) pointer.card.releasePointerCapture(pointer.id);
  return pointer;
}
function finishAssetDrag(event: PointerEvent) {
  if (cardPointer?.id !== event.pointerId || event.button !== 0) return;
  const pointer = releaseCardPointer()!;
  if (pointer.dragging) {
    suppressPointerClick = true;
    emit("assetDrop", event.clientX, event.clientY);
  } else {
    suppressPointerClick = !pointer.card.contains(pointer.card.ownerDocument.elementFromPoint(event.clientX, event.clientY));
  }
}
function cancelAssetDrag(event?: Event) {
  if (event && "pointerId" in event && event.pointerId !== cardPointer?.id) return;
  const pointer = releaseCardPointer();
  if (!pointer) return;
  suppressPointerClick = true;
  if (pointer.dragging) emit("assetDragCancel");
}
function lostAssetCapture(event: PointerEvent) {
  if (cardPointer?.id === event.pointerId && !cardPointer.card.hasPointerCapture(event.pointerId)) cancelAssetDrag();
}
function escapeAssetDrag(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  cancelAssetDrag();
}
function addAsset(asset: SceneAsset, event: MouseEvent) {
  if (props.disabled || event.detail > 0 && suppressPointerClick) return;
  if (selecting.value) emit("select", asset);
  else { rememberAsset(asset); emit("add", asset); }
}

function importAsset(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  fileError.value = "";
  if (!file || props.disabled) return;
  if (!/\.glb$/i.test(file.name) || !file.size || file.size > 50 * 1024 * 1024) {
    fileError.value = "请选择不超过 50 MB 的自包含 GLB 模型";
    return;
  }
  emit("import", file);
}

onMounted(() => {
  const updateColumns = () => { if (assetContent.value?.clientWidth) columnCount.value = Math.max(2, Math.min(4, Math.floor((assetContent.value.clientWidth - 18) / 110))); };
  updateColumns();
  if (typeof ResizeObserver !== "undefined" && assetContent.value) { resizeObserver = new ResizeObserver(updateColumns); resizeObserver.observe(assetContent.value); }
});
onBeforeUnmount(() => { resizeObserver?.disconnect(); cancelAssetDrag(); });
</script>

<style scoped lang="scss">
.assetShelf {
  display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden;
  color: var(--el-text-color-primary); background: transparent; font: inherit; font-size: 12px; line-height: 1.5;
  * { box-sizing: border-box; }
  h2, p { margin: 0; }
  button, input, select { font: inherit; }
  button:not(.el-button) { color: inherit; border: 1px solid transparent; border-radius: var(--ui-radius-small, var(--el-border-radius-small)); background: transparent; cursor: pointer;
    &:hover:not(:disabled) { background: var(--studioHoverBackground, color-mix(in srgb, var(--el-fill-color) 70%, transparent)); }
    &:disabled { cursor: default; opacity: 0.45; }
  }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  select { width: 100%; min-width: 0; min-height: 30px; padding: 4px 6px; border: 1px solid var(--studioBorderColor, var(--el-border-color-light)); border-radius: var(--ui-radius-small, 4px); color: var(--el-text-color-primary); background: var(--studioControlBackground); &:disabled { opacity: 0.45; } option { color: var(--el-text-color-primary); background: var(--el-bg-color-overlay); } }
  .el-button { --el-button-bg-color: var(--studioControlBackground); --el-button-border-color: var(--studioBorderColor, var(--el-border-color-light)); --el-button-hover-bg-color: var(--studioHoverBackground); --el-button-active-bg-color: var(--studioActiveBackground); --el-button-disabled-bg-color: var(--studioControlBackground); }
  .shelfHeader { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 8px; padding: 10px 12px 8px;
    h2 { font-size: 13px; font-weight: 600; }
    .el-button { margin: 0; :deep(> span) { gap: 5px; } }
    .fileInput { display: none; }
  }
  .searchRow { display: flex; flex-shrink: 0; gap: 6px; margin: 0 12px 8px;
    .searchField { display: flex; align-items: center; flex: 1; gap: 6px; min-width: 0; padding: 0 8px; border: 1px solid var(--studioBorderColor, var(--el-border-color-light)); border-radius: var(--ui-radius-small, 4px); color: var(--el-text-color-secondary); background: var(--studioControlBackground);
      &:focus-within { border-color: var(--el-color-primary); }
      > svg { flex-shrink: 0; }
      input { width: 100%; min-width: 0; min-height: 32px; padding: 5px 0; color: var(--el-text-color-primary); border: 0; background: transparent; outline: none; caret-color: var(--el-color-primary); &::placeholder { color: var(--el-text-color-placeholder); } }
    }
  }
  .assetFilters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); flex-shrink: 0; gap: 8px; margin: 0 12px 8px;
    > label { display: flex; align-items: center; gap: 5px; min-width: 0; color: var(--el-text-color-secondary); font-size: 11px; > span { flex-shrink: 0; } }
  }
  .libraryHeading { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 8px; padding: 0 12px 8px; color: var(--el-text-color-secondary); font-size: 11px;
    > span:first-child { color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; }
    > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
  .assetContent { flex: 1; min-height: 0; overflow: auto; padding: 0 12px 12px; scrollbar-width: thin; scrollbar-color: var(--el-border-color) transparent;
    .libraryNotice { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 8px; padding: 8px; border: 1px solid color-mix(in srgb, var(--el-color-warning) 35%, transparent); border-radius: var(--ui-radius-small, 4px); color: var(--el-text-color-regular); background: color-mix(in srgb, var(--el-color-warning) 10%, transparent); overflow-wrap: anywhere;
      details { width: 100%; summary { cursor: pointer; } p { margin-top: 6px; color: var(--el-text-color-secondary); } }
      .el-button { margin: 0; }
    }
    .setGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; .setCard { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 9px 10px; border-radius: 8px; background: var(--el-fill-color-light); text-align: left; strong { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); } span { font-size: 10px; color: var(--el-text-color-secondary); } &:hover:not(:disabled) { outline: 1px solid var(--el-color-primary); } } }
    .assetGrid { display: flex; flex-direction: column; gap: 6px;
      .assetRow { display: grid; gap: 6px; align-items: start;
        .assetCard { min-width: 0; overflow: hidden; border: 1px solid var(--studioBorderColor, var(--el-border-color-light)); border-radius: var(--ui-radius, 8px); background: var(--studioControlBackground);
          &.expanded { border-color: var(--el-color-primary); background: var(--studioActiveBackground); }
          .assetMain { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 0; width: 100%; min-width: 0; padding: 0 0 6px; border: 0; border-radius: 0; text-align: left; cursor: grab; touch-action: pan-y pinch-zoom; user-select: none;
            &:active:not(:disabled) { cursor: grabbing; }
            &.selecting { cursor: pointer; }
            &.selected { background: var(--studioActiveBackground); outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
            .selectionMark { position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid var(--el-text-color-secondary); border-radius: 4px; background: var(--studioControlBackground); color: var(--el-color-white); }
            &.selected .selectionMark { border-color: var(--el-color-primary); background: var(--el-color-primary); }
            > :deep(.assetThumbnail) { aspect-ratio: auto; height: 72px; min-height: 72px; background: transparent; }
            .assetName { padding: 3px 6px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
            .assetMeta { padding: 1px 6px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-secondary); font-size: 10px; }
          }
          .derivativeToggle { display: flex; align-items: center; justify-content: space-between; gap: 3px; width: 100%; min-height: 25px; padding: 3px 6px; border-width: 1px 0 0; border-color: var(--studioBorderColor, var(--el-border-color-light)); border-radius: 0; color: var(--el-text-color-regular); font-size: 10px;
            > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            > svg { flex-shrink: 0; transition: transform 140ms ease-out; }
            &[aria-expanded="true"] { color: var(--el-color-primary); > svg { transform: rotate(180deg); } }
          }
        }
      }
      .derivativePanel { min-width: 0; padding: 10px 0; border-block: 1px solid var(--studioBorderColor, var(--el-border-color-light));
        .derivativeHeader { display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
          > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
          > span { flex-shrink: 0; color: var(--el-text-color-secondary); font-size: 10px; }
          > button { display: grid; place-items: center; flex-shrink: 0; width: 26px; height: 26px; margin-left: auto; padding: 5px; }
        }
        .derivativeFilters { display: flex; gap: 12px; margin-bottom: 8px;
          > label { display: flex; align-items: center; flex: 1; gap: 6px; min-width: 0; color: var(--el-text-color-secondary); font-size: 11px; > span { flex-shrink: 0; } }
        }
        .derivativeGrid { display: grid; gap: 6px;
          .derivativeCard { position: relative; display: flex; flex-direction: column; min-width: 0; padding: 0 0 5px; background: var(--studioControlBackground); cursor: grab; touch-action: pan-y pinch-zoom; user-select: none;
            &.selecting { cursor: pointer; }
            &.selected { background: var(--studioActiveBackground); outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
            > .selectionMark { position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 16px; height: 16px; padding: 0; border: 1px solid var(--el-text-color-secondary); border-radius: 4px; background: var(--studioControlBackground); color: var(--el-color-white); }
            &.selected > .selectionMark { border-color: var(--el-color-primary); background: var(--el-color-primary); }
            > :deep(.assetThumbnail) { height: 64px; min-height: 64px; aspect-ratio: auto; background: transparent; }
            > span { padding: 2px 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
          }
        }
        .derivativePages { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px; color: var(--el-text-color-secondary); font-size: 10px;
          > button { min-height: 26px; padding: 3px 6px; }
          > span { font-variant-numeric: tabular-nums; }
        }
        .derivativeEmpty { padding: 8px 0; color: var(--el-text-color-secondary); font-size: 11px; }
      }
    }
    .emptyMessage { padding: 20px 0; color: var(--el-text-color-secondary); text-align: center; }
  }
  .assetPages { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 6px; padding: 6px 12px; border-top: 1px solid var(--studioBorderColor, var(--el-border-color-light));
    > button { padding: 4px 8px; min-height: 30px; font-size: 11px; white-space: nowrap; }
    > label { display: flex; align-items: center; gap: 5px; min-width: 0; color: var(--el-text-color-secondary); font-size: 11px; font-variant-numeric: tabular-nums;
      input { width: 64px; min-width: 0; min-height: 28px; padding: 3px 5px; border: 1px solid var(--studioBorderColor, var(--el-border-color-light)); border-radius: var(--ui-radius-small, 4px); color: var(--el-text-color-primary); background: var(--studioControlBackground); font-variant-numeric: tabular-nums; }
      > span { white-space: nowrap; }
    }
  }
}
@media (max-width: 420px) { .assetShelf .assetFilters { gap: 5px; > label { > span { display: none; } } } }
@media (prefers-reduced-motion: reduce) { .assetShelf .assetContent .assetGrid .assetRow .assetCard .derivativeToggle > svg { transition: none; } }
</style>
