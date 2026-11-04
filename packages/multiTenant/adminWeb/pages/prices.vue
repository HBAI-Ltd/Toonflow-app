<template>
  <article class="pricesPage">
    <header class="pageHeading">
      <div>
        <h1>{{ translate("价格配置") }}</h1>
        <p>{{ translate("按对外模型配置用户售价与上游成本，路由映射在模型路由中维护。") }}</p>
      </div>
      <el-button :disabled="busy" :loading="loading" @click="reload">{{ translate("重新加载") }}</el-button>
    </header>
    <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
    <div v-loading="loading" class="priceList" :aria-busy="loading">
      <el-table :data="routes" rowKey="id" :emptyText="requestError ? translate('读取模型价格失败') : translate('暂无模型路由')">
        <el-table-column :label="translate('对外模型 ID')" minWidth="180">
          <template #default="{ row }"><strong class="modelId">{{ getPublicModelId(row as ModelRoute) }}</strong><span v-if="row.label !== getPublicModelId(row as ModelRoute)" class="modelName">{{ row.label }}</span></template>
        </el-table-column>
        <el-table-column :label="translate('类型')" width="80"><template #default="{ row }">{{ typeLabel(row.type) }}</template></el-table-column>
        <el-table-column :label="translate('用户售价')" minWidth="230">
          <template #default="{ row }"><p v-for="line in priceLines(row.salePrice)" :key="line" class="priceLine">{{ line }}</p></template>
        </el-table-column>
        <el-table-column :label="translate('上游成本')" minWidth="230">
          <template #default="{ row }"><template v-if="row.costPrice"><p v-for="line in priceLines(row.costPrice)" :key="line" class="priceLine">{{ line }}</p></template><span v-else>{{ translate("未配置") }}</span></template>
        </el-table-column>
        <el-table-column :label="translate('操作')" width="100" align="right"><template #default="{ row }"><el-button link type="primary" :disabled="busy || !loaded" @click="openPrice(row as ModelRoute)">{{ translate("编辑价格") }}</el-button></template></el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="formVisible" :title="translate('编辑价格')" width="min(720px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="!formSaving && !confirmingReload" :closeOnPressEscape="!formSaving && !confirmingReload" :showClose="!formSaving && !confirmingReload" @closed="clearForm">
      <el-alert v-if="formError" class="priceFormError" :title="formError" type="error" :closable="false" showIcon />
      <div v-if="editingRoute" class="priceDialogBody">
        <div class="modelIdentity"><strong>{{ getPublicModelId(editingRoute) }}</strong><span>{{ editingRoute.label !== getPublicModelId(editingRoute) ? `${editingRoute.label} · ` : "" }}{{ typeLabel(editingRoute.type) }}</span></div>
        <el-form id="modelPriceForm" labelPosition="top" :disabled="busy" @submit.prevent="savePrice">
          <priceEditor v-model:salePrice="salePrice" v-model:costPrice="costPrice" :type="editingRoute.type" :disabled="busy" />
        </el-form>
      </div>
      <template #footer>
        <div class="dialogActions">
          <el-button :disabled="busy" @click="reload">{{ translate("重新加载") }}</el-button>
          <div><el-button :disabled="busy" @click="formVisible = false">{{ translate("取消") }}</el-button><el-button type="primary" nativeType="submit" form="modelPriceForm" :loading="formSaving" :disabled="busy">{{ translate("保存") }}</el-button></div>
        </div>
      </template>
    </el-dialog>
  </article>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, toRaw } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { getPublicModelId, modelRouteSchema, modelRoutesSchema, type ModelPrice, type ModelRoute, type ModelRoutingSnapshot } from "@toonflow/multi-tenant-models/config";
import { ElAlert, ElButton, ElDialog, ElForm, ElMessage, ElMessageBox, ElTable, ElTableColumn, vLoading } from "element-plus";
import type { AdminRequest } from "../types";
import priceEditor from "./components/priceEditor.vue";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/table-column/style/css";

const props = defineProps<{ request: AdminRequest; enabled: boolean; saving: boolean; creationUrl: string }>();
const emit = defineEmits<{ sessionExpired: [] }>();
const routes = ref<ModelRoute[]>([]);
const revision = ref(0);
const loading = ref(true);
const loaded = ref(false);
const requestError = ref("");
const formError = ref("");
const formVisible = ref(false);
const formSaving = ref(false);
const confirmingReload = ref(false);
const editingRoute = ref<ModelRoute>();
const salePrice = ref<ModelPrice>({ mode: "perRequest", currency: "CNY", amount: "" });
const costPrice = ref<ModelPrice | null>(null);
const controller = new AbortController();
const busy = computed(() => loading.value || formSaving.value || confirmingReload.value || props.saving);
let closeReloadPrompt: (() => void) | undefined;

function typeLabel(type: ModelRoute["type"]) { return translate({ text: "文本", image: "图片", video: "视频", audio: "音频" }[type]); }
function modeLabel(mode: ModelPrice["mode"]) { return mode === "perMillionTokens" ? translate("每百万 Token") : mode === "perSecond" ? translate("每秒") : translate("每次请求"); }
function priceLines(price: ModelPrice) {
  return price.mode === "perMillionTokens" ? [
    `${price.currency} · ${modeLabel(price.mode)}`,
    `${translate("输入")} ${price.input} / ${translate("输出")} ${price.output}`,
    `${translate("缓存读取")} ${price.cacheRead} / ${translate("缓存写入")} ${price.cacheWrite}`,
  ] : [`${price.currency} ${price.amount} / ${modeLabel(price.mode)}`];
}
function trimPrice(price: ModelPrice): ModelPrice {
  return price.mode === "perMillionTokens" ? { ...price, input: price.input.trim(), output: price.output.trim(), cacheRead: price.cacheRead.trim(), cacheWrite: price.cacheWrite.trim() }
    : { ...price, amount: price.amount.trim() };
}
function applySnapshot(snapshot: ModelRoutingSnapshot) {
  routes.value = modelRoutesSchema.parse(snapshot.routes);
  revision.value = snapshot.revision;
  loaded.value = true;
}
function showError(cause: unknown, fallback: string, inForm = false) {
  if (controller.signal.aborted) return;
  if ((cause as { status?: number } | null)?.status === 401) emit("sessionExpired");
  const message = cause instanceof Error ? cause.message : fallback;
  if (inForm) formError.value = message;
  else requestError.value = message;
}
async function load() {
  loading.value = true;
  requestError.value = "";
  try {
    const result = await props.request<ModelRoutingSnapshot>({ method: "GET", url: "/api/multiTenant/models/get", signal: controller.signal });
    if (!controller.signal.aborted) applySnapshot(result);
  } catch (cause) { showError(cause, translate("读取模型价格失败")); }
  finally { loading.value = false; }
}
async function reload() {
  if (busy.value) return;
  if (formVisible.value) {
    confirmingReload.value = true;
    try {
      await ElMessageBox.confirm(({ close }) => {
        closeReloadPrompt = close;
        return h("span", translate("重新加载会放弃当前编辑，是否继续？"));
      }, translate("重新加载"), { confirmButtonText: translate("重新加载"), cancelButtonText: translate("取消"), type: "warning", closeOnClickModal: false });
    } catch { return; }
    finally { confirmingReload.value = false; closeReloadPrompt = undefined; }
    formVisible.value = false;
  }
  if (!controller.signal.aborted) await load();
}
function openPrice(route: ModelRoute) {
  if (busy.value || !loaded.value) return;
  const selected = structuredClone(toRaw(route));
  editingRoute.value = selected;
  salePrice.value = structuredClone(selected.salePrice);
  costPrice.value = selected.costPrice ? structuredClone(selected.costPrice) : null;
  formError.value = "";
  formVisible.value = true;
}
function clearForm() { if (!formVisible.value) { editingRoute.value = undefined; formError.value = ""; } }
async function savePrice() {
  if (busy.value || !editingRoute.value) return;
  const parsed = modelRouteSchema.safeParse({ ...editingRoute.value, salePrice: trimPrice(salePrice.value), costPrice: costPrice.value ? trimPrice(costPrice.value) : null });
  if (!parsed.success) { formError.value = translate("请检查价格格式，价格最多支持 6 位小数。"); return; }
  const next = routes.value.map(route => route.id === editingRoute.value!.id ? parsed.data : route);
  formSaving.value = true;
  formError.value = "";
  try {
    const result = await props.request<ModelRoutingSnapshot>({ method: "PUT", url: "/api/multiTenant/models/save", data: { routes: next, expectedRevision: revision.value }, signal: controller.signal });
    if (controller.signal.aborted) return;
    applySnapshot(result);
    formVisible.value = false;
    ElMessage.success(translate("模型价格已保存"));
  } catch (cause) { showError(cause, translate("保存模型价格失败"), true); }
  finally { formSaving.value = false; }
}

onMounted(load);
onBeforeUnmount(() => { controller.abort(); closeReloadPrompt?.(); });
</script>

<style lang="scss" scoped>
.pricesPage {
  min-width: 0;
  width: 100%;
  color: var(--el-text-color-primary);

  .pageHeading {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 28px;

    h1 { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.4; letter-spacing: -0.02em; }
    p { max-width: 72ch; margin: 8px 0 0; color: var(--el-text-color-regular); line-height: 1.7; }
    .el-button { min-height: 44px; margin: 0; }
  }
  .requestError { margin-bottom: 20px; }
  .priceList {
    min-width: 0;
    width: 100%;
    overflow: hidden;

    .modelId, .modelName { display: block; overflow-wrap: anywhere; }
    .modelName { margin-top: 3px; color: var(--el-text-color-regular); }
    .priceLine { margin: 0; font-variant-numeric: tabular-nums; line-height: 1.7; overflow-wrap: anywhere; }
    .el-button { min-height: 44px; }
  }
  @media (max-width: 600px) { .pageHeading h1 { font-size: 24px; } }
}
.priceDialogBody {
  max-height: min(65vh, 720px);
  overflow-y: auto;
  padding: 2px 4px 2px 0;

  .modelIdentity { display: flex; flex-direction: column; gap: 3px; margin-bottom: 28px; overflow-wrap: anywhere; span { color: var(--el-text-color-regular); } }
}
.priceFormError { margin-bottom: 20px; }
.dialogActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;

  .el-button { min-height: 44px; }
}
</style>
