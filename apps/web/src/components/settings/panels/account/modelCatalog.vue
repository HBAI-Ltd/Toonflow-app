<template>
  <section class="modelCatalog" aria-label="模型列表" :aria-busy="loading">
    <div class="catalogToolbar">
      <el-segmented v-model="selectedType" class="typeSwitch" :options="typeOptions" aria-label="模型分类" />
      <el-input v-model="search" class="modelSearch" :prefixIcon="IconSearch" placeholder="搜索模型名称" aria-label="搜索模型名称" clearable />
    </div>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon>
      <el-button size="small" @click="refresh">重试</el-button>
    </el-alert>
    <div v-loading="loading" class="catalogGrid">
      <article v-for="model in filteredModels" :key="model.id" class="modelCard" :aria-label="model.name">
        <div class="modelGlow" aria-hidden="true"><modelIcon :model="model.name" :size="112" /></div>
        <header class="modelHeader">
          <div class="modelIconBox" aria-hidden="true"><modelIcon :model="model.name" :size="24" /></div>
          <div class="modelHeading">
            <h3>{{ model.name }}</h3>
            <span class="modelType">{{ typeLabels[model.type] }}</span>
          </div>
          <el-tag v-if="!model.available" class="statusTag" type="info" size="small" effect="plain">已下架</el-tag>
        </header>
        <div v-if="model.abilities.length || model.qualities.length" class="modelTags">
          <el-tag v-for="ability in model.abilities" :key="`ability:${ability}`" size="small" effect="light">{{ ability }}</el-tag>
          <el-tag v-for="quality in model.qualities" :key="`quality:${quality}`" type="info" size="small" effect="plain">{{ quality }}</el-tag>
        </div>
        <footer class="modelFooter">
          <div v-if="model.available" class="billingSummary">
            <span class="billingLabel">{{ billingLabels[model.billing.type] }}</span>
            <div v-if="model.billing.type === 0" class="pricePreview">
              <span><span class="priceLabel">输入</span>{{ formatPrice(model.billing.inputPrice, model) }}</span>
              <span><span class="priceLabel">输出</span>{{ formatPrice(model.billing.outputPrice, model) }}</span>
            </div>
            <span v-else-if="model.billing.type === 1" class="fixedPrice">{{ formatPrice(model.billing.fixedPrice, model) }}</span>
          </div>
          <el-button class="detailsButton" link type="primary" :aria-label="`查看 ${model.name} 的详情`" @click="openDetails(model)">
            查看详情<icon-chevron-right :size="14" aria-hidden="true" />
          </el-button>
        </footer>
      </article>
    </div>
    <el-dialog v-model="detailsVisible" :title="selectedModel?.name" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div v-if="selectedModel" class="modelDetails">
        <div class="detailTags">
          <el-tag size="small">{{ typeLabels[selectedModel.type] }}</el-tag>
          <el-tag v-if="!selectedModel.available" type="info" size="small">已下架</el-tag>
          <el-tag v-for="ability in selectedModel.abilities" :key="`ability:${ability}`" size="small" effect="plain">{{ ability }}</el-tag>
          <el-tag v-for="quality in selectedModel.qualities" :key="`quality:${quality}`" type="info" size="small" effect="plain">{{ quality }}</el-tag>
        </div>
        <p v-if="selectedModel.description" class="modelDescription">{{ selectedModel.description }}</p>
        <template v-if="selectedModel.available">
          <h3>{{ billingLabels[selectedModel.billing.type] }}</h3>
          <p v-if="selectedModel.currency !== 'cny'" class="currencyNote">外币标价，实际扣费按当天汇率计算（人民币结算）。</p>
          <dl v-if="selectedModel.billing.type === 0 || selectedModel.billing.type === 1" class="priceList">
            <template v-if="selectedModel.billing.type === 0">
              <div><dt>输入价格</dt><dd>{{ formatPrice(selectedModel.billing.inputPrice, selectedModel) }}</dd></div>
              <div><dt>输出价格</dt><dd>{{ formatPrice(selectedModel.billing.outputPrice, selectedModel) }}</dd></div>
            </template>
            <div v-else><dt>固定价格</dt><dd>{{ formatPrice(selectedModel.billing.fixedPrice, selectedModel) }}</dd></div>
          </dl>
          <div v-else-if="selectedModel.billing.type === 4" class="ruleDescription" v-html="ruleDescription"></div>
          <template v-else>
            <p v-if="selectedModel.billing.type === 5" class="timeNote">以下时段均为北京时间，其他时间按空闲时段计费。</p>
            <section v-for="(group, index) in priceGroups" :key="index" class="priceGroup">
              <h4 v-if="group.title">{{ group.title }}</h4>
              <p v-if="group.schedule" class="periodSchedule">{{ group.schedule }}</p>
              <el-table :data="group.steps" size="small" emptyText="">
                <el-table-column label="输入 Token" minWidth="155">
                  <template #default="{ row }">{{ formatRange(row.inputMinTokens, row.inputMaxTokens) }}</template>
                </el-table-column>
                <el-table-column label="输出 Token" minWidth="155">
                  <template #default="{ row }">{{ formatRange(row.outputMinTokens, row.outputMaxTokens) }}</template>
                </el-table-column>
                <el-table-column label="输入价格" minWidth="115">
                  <template #default="{ row }">{{ formatPrice(row.inputPrice, selectedModel) }}</template>
                </el-table-column>
                <el-table-column label="输出价格" minWidth="115">
                  <template #default="{ row }">{{ formatPrice(row.outputPrice, selectedModel) }}</template>
                </el-table-column>
              </el-table>
              <dl v-if="group.cacheRead !== undefined || group.cacheWrite !== undefined" class="priceList">
                <div v-if="group.cacheRead !== undefined"><dt>缓存读取</dt><dd>{{ formatPrice(group.cacheRead, selectedModel) }}</dd></div>
                <div v-if="group.cacheWrite !== undefined"><dt>缓存写入</dt><dd>{{ formatPrice(group.cacheWrite, selectedModel) }}</dd></div>
              </dl>
            </section>
          </template>
        </template>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { IconChevronRight, IconSearch } from "@tabler/icons-vue";
import { modelIcon } from "@toonflow/model-icons";
import DOMPurify from "dompurify";
import type { ModelData, ModelPriceStep, ModelType } from "@toonflow/server/channel";
import http from "@/lib/http";

const props = defineProps<{ visible: boolean; token: string }>();
const loading = defineModel<boolean>("loading", { default: false });
const selectedType = ref<ModelType | "all">("all");
const search = ref("");
const models = ref<ModelData[]>([]);
const errorMessage = ref("");
const selectedModel = ref<ModelData>();
const detailsVisible = ref(false);
const typeLabels: Record<ModelType, string> = { text: "文本", image: "图片", video: "视频", audio: "音频" };
const typeOptions = computed(() => [{ label: translate("全部"), value: "all" }, ...Object.entries(typeLabels).map(([value, label]) => ({ value, label }))]);
const billingLabels: Record<number, string> = { 0: "按 Token 计费", 1: "按次计费", 3: "阶梯计费", 4: "规则计费", 5: "分时计费" };
const numberFormat = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 8 });
const filteredModels = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase();
  return models.value.filter(model => model.name.toLocaleLowerCase().includes(keyword));
});
const ruleDescription = computed(() => DOMPurify.sanitize((selectedModel.value?.billing.ruleDescription ?? "").replace(/\\n/g, "\n"), {
  ALLOWED_TAGS: ["p", "div", "span", "br", "strong", "b", "em", "i", "s", "del", "u", "ul", "ol", "li"],
  ALLOWED_ATTR: [],
}));
type PriceGroup = { title: string; schedule?: string; steps: ModelPriceStep[]; cacheRead?: number; cacheWrite?: number };
const priceGroups = computed<PriceGroup[]>(() => {
  const billing = selectedModel.value?.billing;
  if (!billing) return [];
  if (billing.type === 3) return [{ title: "", steps: billing.steps ?? [] }];
  if (billing.type !== 5) return [];
  const weekdays = [translate("周日"), translate("周一"), translate("周二"), translate("周三"), translate("周四"), translate("周五"), translate("周六")];
  return [
    ...(billing.periods ?? []).map(period => ({
      title: period.type === "peak" ? "高峰时段" : "分时时段",
      schedule: `${period.weekdays.map(day => weekdays[day % 7]).join("、")} ${period.startTime}–${period.endTime}`,
      steps: period.steps, cacheRead: period.cacheRead, cacheWrite: period.cacheWrite,
    })),
    { title: "空闲时段", steps: billing.idleSteps ?? [], cacheRead: billing.idleCacheRead, cacheWrite: billing.idleCacheWrite },
  ];
});
let activeRequest: AbortController | undefined;

function formatPrice(value: number | undefined, model?: ModelData) {
  if (value === undefined || !model) return "";
  const unit = model.billing.tokenUnit === 1000000 ? "/1M Token" : model.billing.tokenUnit
    ? `/${numberFormat.format(model.billing.tokenUnit)} Token` : model.billing.type === 1 ? translate("/次") : "";
  return `${numberFormat.format(value)}${model.priceUnit}${unit}`;
}

function formatRange(min: number, max: number) {
  return `${numberFormat.format(min)}–${numberFormat.format(max)}`;
}

function openDetails(model: ModelData) {
  selectedModel.value = model;
  detailsVisible.value = true;
}

async function refresh() {
  activeRequest?.abort();
  loading.value = false;
  errorMessage.value = "";
  models.value = [];
  detailsVisible.value = false;
  selectedModel.value = undefined;
  const token = props.token;
  if (!props.visible || !token) return;
  const request = new AbortController();
  activeRequest = request;
  loading.value = true;
  try {
    const result = await http<ModelData[]>({
      method: "GET", url: "/api/channel/model/getModelData",
      params: { type: selectedType.value }, signal: request.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!request.signal.aborted && props.token === token) models.value = result;
  } catch (error) {
    if (!request.signal.aborted) errorMessage.value = error instanceof Error && "status" in error && error.status === 401
      ? "账号登录已失效，请重新登录" : error instanceof Error ? error.message : "获取模型列表失败";
  } finally {
    if (activeRequest === request) loading.value = false;
  }
}

watch([() => props.visible, () => props.token, selectedType], refresh, { immediate: true, flush: "sync" });
onBeforeUnmount(() => {
  activeRequest?.abort();
  loading.value = false;
});
defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.modelCatalog {
  display: grid;
  gap: 16px;
  min-width: 0;

  .catalogToolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .typeSwitch { --el-border-radius-base: var(--ui-radius); max-width: 100%; overflow-x: auto; }
    .modelSearch { width: 220px; max-width: 100%; margin-left: auto; }
  }

  .catalogGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 12px;
    min-width: 0;
    min-height: 120px;
    align-items: stretch;

    .modelCard {
      position: relative;
      isolation: isolate;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
      padding: 18px;
      overflow: hidden;
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--ui-radius-large);
      background: var(--el-fill-color-extra-light);
      transition: border-color 150ms ease;

      &:hover { border-color: var(--el-border-color-dark); }

      .modelGlow {
        position: absolute;
        z-index: -1;
        top: -32px;
        left: -24px;
        width: 112px;
        height: 112px;
        opacity: 0.18;
        filter: blur(24px);
        pointer-events: none;
      }

      .modelHeader {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;

        .modelIconBox {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: var(--ui-radius);
          background: var(--el-fill-color-light);
        }

        .modelHeading {
          flex: 1;
          min-width: 0;

          h3 { margin: 0 0 5px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
          .modelType { color: var(--el-text-color-secondary); font-size: 12px; }
        }

        .statusTag { flex-shrink: 0; }
      }

      .modelTags {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 6px;

        .el-tag {
          height: auto;
          max-width: 100%;
          padding: 3px 7px;
          line-height: 1.4;
          white-space: normal;

          :deep(.el-tag__content) { min-width: 0; overflow-wrap: anywhere; }
        }
      }

      .modelFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid var(--el-border-color-lighter);

        .billingSummary {
          display: grid;
          flex: 1;
          gap: 6px;
          min-width: 0;
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;

          .billingLabel { color: var(--el-text-color-secondary); }
          .pricePreview, .fixedPrice { color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
          .pricePreview {
            display: grid;
            gap: 3px;

            .priceLabel { margin-right: 8px; color: var(--el-text-color-secondary); }
          }
          .fixedPrice { font-size: 15px; font-weight: 600; }
        }

        .detailsButton { flex-shrink: 0; margin-left: auto; font-size: 12px; }
      }
    }
  }
}

.modelDetails {
  display: grid;
  gap: 14px;
  color: var(--el-text-color-regular);

  .detailTags { display: flex; flex-wrap: wrap; gap: 6px; }
  .modelDescription { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
  h3 { margin: 6px 0 0; color: var(--el-text-color-primary); font-size: 15px; }
  .currencyNote, .timeNote { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
  .priceList {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 32px;
    margin: 0;

    > div {
      display: grid;
      gap: 6px;

      dt { color: var(--el-text-color-secondary); font-size: 12px; }
      dd { margin: 0; font-variant-numeric: tabular-nums; }
    }
  }
  .ruleDescription {
    overflow-wrap: anywhere;
    line-height: 1.8;

    :deep(p) { margin: 0 0 8px; }
    :deep(s), :deep(del) { color: var(--el-text-color-placeholder); }
  }
  .priceGroup {
    display: grid;
    gap: 12px;
    min-width: 0;

    h4 { margin: 0; color: var(--el-text-color-primary); font-size: 13px; }
    .periodSchedule { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
  }
}
</style>
