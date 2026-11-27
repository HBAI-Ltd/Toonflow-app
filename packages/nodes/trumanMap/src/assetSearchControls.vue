<template>
  <div class="searchRow">
    <label class="searchField"><icon-search :size="15" /><input v-model="search" type="search" :placeholder="translate('搜索主素材')" :aria-label="translate('搜索主素材')" /></label>
  </div>
  <div class="assetFilters">
    <label><span>{{ translate("分类") }}</span><select v-model="category" :disabled="disabled" :aria-label="translate('素材分类')"><option v-for="item in categories" :key="item" :value="item">{{ item === "全部" ? translate("全部分类") : translate(item) }}</option><option v-if="!selecting" value="整套景">{{ translate("整套景") }}</option><option v-if="hasRecent" value="最近用过">{{ translate("最近用过") }}</option></select></label>
    <label><span>{{ translate("题材") }}</span><select v-model="theme" :disabled="disabled || filterDisabled" :aria-label="translate('素材题材')"><option value="">{{ translate("全部题材") }}</option><option v-for="item in assetThemes" :key="item" :value="item">{{ translate(item) }}</option></select></label>
    <label><span>{{ translate("类型") }}</span><select v-model="itemType" :disabled="disabled || filterDisabled" :aria-label="translate('物品类型')"><option value="">{{ translate("全部类型") }}</option><option v-for="item in assetItemTypes" :key="item" :value="item">{{ translate(item) }}</option></select></label>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconSearch } from "@tabler/icons-vue";
import { markMessages, translate } from "@toonflow/i18n/vue";
import { assetThemes, assetItemTypes, type AssetCategory, type AssetTheme, type AssetItemType } from "./sceneDocument";

defineProps<{ disabled?: boolean; selecting?: boolean; hasRecent?: boolean }>();
const search = defineModel<string>({ default: "" });
const category = defineModel<string>("category", { default: "全部" });
const theme = defineModel<AssetTheme | "">("theme", { default: "" });
const itemType = defineModel<AssetItemType | "">("itemType", { default: "" });
const categories: AssetCategory[] = markMessages(["全部", "基础", "自然", "道具", "建筑", "本地", "生成"]);
const filterDisabled = computed(() => category.value === "基础" || category.value === "整套景");
</script>

<style scoped lang="scss">
.searchRow {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  margin: 0 12px 8px;
  .searchField {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 6px;
    min-width: 0;
    padding: 0 8px;
    border: 1px solid var(--studioBorderColor, var(--el-border-color-light));
    border-radius: var(--ui-radius-small, 4px);
    color: var(--el-text-color-secondary);
    background: var(--studioControlBackground);
    &:focus-within { border-color: var(--el-color-primary); }
    > svg { flex-shrink: 0; }
    input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      min-height: 32px;
      padding: 5px 0;
      border: 0;
      background: transparent;
      color: var(--el-text-color-primary);
      outline: none;
      font: inherit;
      caret-color: var(--el-color-primary);
      &::placeholder { color: var(--el-text-color-placeholder); }
    }
  }
}
.assetFilters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex-shrink: 0;
  gap: 8px;
  margin: 0 12px 8px;
  label {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    > span { flex-shrink: 0; }
    select {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      min-height: 30px;
      padding: 4px 6px;
      border: 1px solid var(--studioBorderColor, var(--el-border-color-light));
      border-radius: var(--ui-radius-small, 4px);
      color: var(--el-text-color-primary);
      background: var(--studioControlBackground);
      font: inherit;
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      &:disabled { opacity: 0.45; }
      option { color: var(--el-text-color-primary); background: var(--el-bg-color-overlay); }
    }
  }
  @media (max-width: 420px) { gap: 5px; label > span { display: none; } }
}
</style>
