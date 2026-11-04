<template>
  <article class="modelsPage">
    <header class="pageHeading">
      <div>
        <h1>{{ translate("模型路由") }}</h1>
        <p>{{ translate("创作端模型统一经过多租户后端，转发到指定模型。") }}</p>
      </div>
      <div class="headingActions">
        <el-button :disabled="busy" :loading="loading" @click="reload">{{ translate("重新加载") }}</el-button>
        <el-button type="primary" :disabled="busy || !loaded" @click="openRoute()">{{ translate("新增模型路由") }}</el-button>
      </div>
    </header>
    <nav class="relatedLinks" :aria-label="translate('模型服务配置')">
      <router-link :to="{ name: 'multiTenantProviders' }">{{ translate("管理供应商") }}</router-link>
      <router-link :to="{ name: 'multiTenantPrices' }">{{ translate("配置售价与成本") }}</router-link>
    </nav>
    <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
    <el-alert v-if="availableError" class="requestError" :title="availableError" type="warning" :closable="false" showIcon />
    <div v-loading="loading" class="routesList" :aria-busy="loading">
      <el-table :data="routes" rowKey="id" :emptyText="requestError ? translate('读取模型路由失败') : translate('暂无模型路由')">
        <el-table-column :label="translate('创作端模型')" minWidth="210">
          <template #default="{ row }"><div class="modelIdentity"><strong class="modelId">{{ getPublicModelId(row as ModelRoute) }}</strong><span v-if="row.label !== getPublicModelId(row as ModelRoute)" class="secondaryText">{{ row.label }}</span></div></template>
        </el-table-column>
        <el-table-column :label="translate('平台转发目标')" minWidth="265">
          <template #default="{ row }"><div class="upstreamIdentity"><strong class="modelId">{{ row.upstreamModelId }}</strong><span class="secondaryText">{{ providerLabel(row as ModelRoute) }} · {{ targetLabel(row.target) }}</span></div></template>
        </el-table-column>
        <el-table-column :label="translate('类型')" width="80"><template #default="{ row }">{{ typeLabel(row.type) }}</template></el-table-column>
        <el-table-column :label="translate('状态')" width="90"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? translate("已启用") : translate("已禁用") }}</el-tag></template></el-table-column>
        <el-table-column :label="translate('操作')" width="145" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="busy" @click="openRoute(row as ModelRoute)">{{ translate("编辑") }}</el-button>
            <el-button link :type="row.enabled ? 'danger' : 'primary'" :disabled="busy" :loading="stateTargetId === row.id" @click="changeState(row as ModelRoute)">{{ row.enabled ? translate("禁用") : translate("启用") }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="formVisible" :title="editingId ? translate('编辑模型路由') : translate('新增模型路由')" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="!formSaving && !confirmingReload" :closeOnPressEscape="!formSaving && !confirmingReload" :showClose="!formSaving && !confirmingReload" @closed="clearForm">
      <el-alert v-if="formError" class="routeFormError" :title="formError" type="error" :closable="false" showIcon />
      <div class="routeDialogBody">
        <div v-if="form.publicId && form.upstreamModelId" class="forwardingSummary" role="group" :aria-label="translate('转发关系')">
          <div class="flowEndpoint"><span>{{ translate("创作端模型 ID") }}</span><strong :title="form.publicId">{{ form.publicId }}</strong></div>
          <icon-arrow-right :size="16" aria-hidden="true" />
          <span class="platformNode">{{ translate("多租户后端") }}</span>
          <icon-arrow-right :size="16" aria-hidden="true" />
          <div class="flowEndpoint"><span>{{ translate("实际请求模型") }}</span><strong :title="form.upstreamModelId">{{ form.upstreamModelId }}</strong></div>
        </div>
        <el-form id="modelRouteForm" class="routeForm" labelPosition="top" :disabled="formSaving || confirmingReload" @submit.prevent="saveRoute">
          <section class="clientFields" :aria-label="translate('创作端模型')">
            <div class="formGrid">
              <el-form-item :label="translate('创作端模型 ID')" for="modelRoutePublicId" required><el-input id="modelRoutePublicId" v-model="form.publicId" dir="ltr" :maxlength="128" /></el-form-item>
              <el-form-item :label="translate('创作端显示名称')" for="modelRouteLabel" required><el-input id="modelRouteLabel" v-model="form.label" :maxlength="128" /></el-form-item>
            </div>
            <div class="routeMeta">
              <div v-if="editingId" class="modelKind"><span>{{ translate("模型类型") }}</span><el-tag type="info" size="small">{{ typeLabel(form.type) }}</el-tag></div>
              <el-form-item v-else class="kindField" :label="translate('模型类型')" for="modelRouteType" required><el-select id="modelRouteType" v-model="form.type" @change="typeChanged"><el-option v-for="type in modelTypes" :key="type" :value="type" :label="typeLabel(type)" /></el-select></el-form-item>
              <div class="routeState"><label for="modelRouteEnabled">{{ translate("启用路由") }}</label><el-switch id="modelRouteEnabled" v-model="form.enabled" :aria-label="translate('启用路由')" /></div>
            </div>
          </section>
          <section class="forwardFields" :aria-label="translate('平台转发目标')">
            <div class="formGrid">
              <el-form-item :label="translate('目标来源')" for="modelRouteTarget" required>
                <el-select id="modelRouteTarget" v-model="form.target" @change="sourceChanged"><el-option value="backend" :label="translate('第三方模型')" /><el-option value="toonflowCloud" :label="translate('Toonflow 云端')" /></el-select>
              </el-form-item>
              <el-form-item :label="translate('目标供应商')" for="modelRouteProvider" required>
                <el-select id="modelRouteProvider" v-model="form.providerId" filterable :noDataText="translate('当前没有可用的供应商')" @change="providerChanged">
                  <el-option v-if="form.providerId && !providerChoices.some(item => item.id === form.providerId)" :value="form.providerId" :label="form.providerId" disabled />
                  <el-option v-for="item in providerChoices" :key="item.id" :value="item.id" :label="item.label" />
                </el-select>
              </el-form-item>
              <el-form-item class="upstreamField" :label="translate('实际请求模型')" for="modelRouteUpstream" required>
                <el-select id="modelRouteUpstream" v-model="form.upstreamModelId" filterable :noDataText="translate('当前没有可用模型')">
                  <el-option v-if="form.upstreamModelId && !selectedUpstream" :value="form.upstreamModelId" :label="form.upstreamModelId" disabled />
                  <el-option v-for="item in upstreamChoices" :key="item.modelId" :value="item.modelId" :label="item.label + ' · ' + item.modelId" />
                </el-select>
              </el-form-item>
            </div>
            <el-alert v-if="availableError" class="formNotice" :title="availableError" type="warning" :closable="false" showIcon />
            <el-alert v-else-if="form.upstreamModelId && !selectedUpstream" class="formNotice" :title="translate('所选模型已不可用，请重新选择。')" type="warning" :closable="false" showIcon />
            <el-alert v-else-if="!scopedModels.length" class="formNotice" :title="translate('当前没有可用模型，请先配置供应商或同步云端模型。')" type="info" :closable="false" showIcon />
          </section>
          <section v-if="!editingId" class="formSection" :aria-label="translate('初始价格')">
            <h3>{{ translate("初始价格") }}</h3>
            <priceEditor v-model:salePrice="salePrice" v-model:costPrice="costPrice" :type="form.type" :disabled="formSaving || confirmingReload" />
          </section>
          <p v-else class="priceHint">{{ translate("修改转发目标不影响售价与成本。") }}</p>
        </el-form>
      </div>
      <template #footer><div class="dialogActions"><el-button :disabled="formSaving || confirmingReload" @click="reload">{{ translate("重新加载") }}</el-button><div><el-button :disabled="formSaving || confirmingReload" @click="formVisible = false">{{ translate("取消") }}</el-button><el-button type="primary" nativeType="submit" form="modelRouteForm" :loading="formSaving" :disabled="formSaving || confirmingReload">{{ translate("保存") }}</el-button></div></div></template>
    </el-dialog>
  </article>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { translate } from "@toonflow/i18n/vue";
import { getPublicModelId, modelRouteSchema, modelRoutesSchema, type ModelPrice, type ModelRoute, type ModelRoutingSnapshot } from "@toonflow/multi-tenant-models/config";
import { IconArrowRight } from "@tabler/icons-vue";
import { ElAlert, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag, vLoading } from "element-plus";
import priceEditor from "./components/priceEditor.vue";
import type { AdminRequest } from "../types";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/switch/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/table-column/style/css";
import "element-plus/es/components/tag/style/css";

type AvailableModel = Pick<ModelRoute, "target" | "providerId" | "type"> & { providerLabel: string; modelId: string; label: string };
const props = defineProps<{ request: AdminRequest; enabled: boolean; saving: boolean; creationUrl: string }>();
const emit = defineEmits<{ sessionExpired: [] }>();
const modelTypes = ["text", "image", "video", "audio"] as const;
const routes = ref<ModelRoute[]>([]);
const availableModels = ref<AvailableModel[]>([]);
const revision = ref(0);
const loaded = ref(false);
const loading = ref(true);
const stateTargetId = ref("");
const formVisible = ref(false);
const formSaving = ref(false);
const confirmingReload = ref(false);
const editingId = ref("");
const formId = ref("");
const form = ref({ publicId: "", label: "", type: "text" as ModelRoute["type"], target: "backend" as ModelRoute["target"], providerId: "", upstreamModelId: "", enabled: true });
const salePrice = ref<ModelPrice>(blankPrice("text"));
const costPrice = ref<ModelPrice | null>(null);
const requestError = ref("");
const availableError = ref("");
const formError = ref("");
const controller = new AbortController();
let closeReloadPrompt: (() => void) | undefined;
const busy = computed(() => loading.value || formSaving.value || !!stateTargetId.value || confirmingReload.value || props.saving);
const scopedModels = computed(() => availableModels.value.filter(item => item.type === form.value.type && item.target === form.value.target));
const providerChoices = computed(() => [...new Map(scopedModels.value.map(item => [item.providerId, { id: item.providerId, label: item.providerLabel }])).values()]);
const upstreamChoices = computed(() => scopedModels.value.filter(item => item.providerId === form.value.providerId));
const selectedUpstream = computed(() => upstreamChoices.value.find(item => item.modelId === form.value.upstreamModelId));

function blankPrice(type: ModelRoute["type"]): ModelPrice {
  return type === "text" ? { mode: "perMillionTokens", currency: "CNY", input: "", output: "", cacheRead: "", cacheWrite: "" } : { mode: "perRequest", currency: "CNY", amount: "" };
}
function typeLabel(type: ModelRoute["type"]) { return translate({ text: "文本", image: "图片", video: "视频", audio: "音频" }[type]); }
function targetLabel(target: ModelRoute["target"]) { return translate(target === "backend" ? "第三方模型" : "Toonflow 云端"); }
function providerLabel(route: ModelRoute) { return availableModels.value.find(item => item.target === route.target && item.providerId === route.providerId && item.type === route.type)?.providerLabel ?? route.providerId; }
function applySnapshot(snapshot: ModelRoutingSnapshot) { routes.value = modelRoutesSchema.parse(snapshot.routes); revision.value = snapshot.revision; loaded.value = true; }
function showError(cause: unknown, fallback: string, inForm = false) {
  if (controller.signal.aborted) return;
  if ((cause as { status?: number } | null)?.status === 401) emit("sessionExpired");
  if (inForm) formError.value = cause instanceof Error ? cause.message : fallback;
  else requestError.value = cause instanceof Error ? cause.message : fallback;
}
async function load() {
  loading.value = true;
  requestError.value = availableError.value = "";
  const [snapshot, available] = await Promise.allSettled([
    props.request<ModelRoutingSnapshot>({ method: "GET", url: "/api/multiTenant/models/get", signal: controller.signal }),
    props.request<AvailableModel[]>({ method: "GET", url: "/api/multiTenant/models/available", signal: controller.signal }),
  ]);
  if (controller.signal.aborted) return;
  if (snapshot.status === "fulfilled") {
    try { applySnapshot(snapshot.value); } catch (cause) { showError(cause, translate("读取模型路由失败")); }
  } else showError(snapshot.reason, translate("读取模型路由失败"));
  if (available.status === "fulfilled") availableModels.value = available.value;
  else {
    availableModels.value = [];
    if (available.reason?.status === 401) emit("sessionExpired");
    availableError.value = available.reason instanceof Error ? available.reason.message : translate("读取可用模型失败");
  }
  loading.value = false;
}
async function reload() {
  if (busy.value) return;
  if (formVisible.value) {
    confirmingReload.value = true;
    try {
      await ElMessageBox.confirm(({ close }) => { closeReloadPrompt = close; return h("span", translate("重新加载会放弃当前编辑，是否继续？")); }, translate("重新加载"), {
        confirmButtonText: translate("重新加载"), cancelButtonText: translate("取消"), type: "warning",
      });
    } catch { return; }
    finally { confirmingReload.value = false; closeReloadPrompt = undefined; }
    formVisible.value = false;
  }
  if (!controller.signal.aborted) await load();
}
function clearForm() { if (!formVisible.value) { editingId.value = ""; formId.value = ""; formError.value = ""; } }
function openRoute(route?: ModelRoute) {
  if (busy.value || !loaded.value) return;
  editingId.value = route?.id ?? "";
  formId.value = route?.id ?? crypto.randomUUID();
  form.value = { publicId: route ? getPublicModelId(route) : "", label: route?.label ?? "", type: route?.type ?? "text", target: route?.target ?? "backend", enabled: route?.enabled ?? true,
    providerId: route?.providerId ?? "", upstreamModelId: route?.upstreamModelId ?? "" };
  salePrice.value = route ? { ...route.salePrice } : blankPrice("text");
  costPrice.value = route?.costPrice ? { ...route.costPrice } : null;
  formError.value = "";
  formVisible.value = true;
}
function sourceChanged() { form.value.providerId = ""; form.value.upstreamModelId = ""; formError.value = ""; }
function providerChanged() { form.value.upstreamModelId = ""; formError.value = ""; }
function typeChanged() { sourceChanged(); salePrice.value = blankPrice(form.value.type); costPrice.value = null; }
async function saveRoute() {
  if (busy.value || !formVisible.value) return;
  const previous = routes.value.find(route => route.id === editingId.value);
  const keepsEnabledBinding = previous?.enabled && previous.type === form.value.type && previous.target === form.value.target
    && previous.providerId === form.value.providerId && previous.upstreamModelId === form.value.upstreamModelId;
  if (form.value.enabled && !keepsEnabledBinding && !selectedUpstream.value) { formError.value = translate("所选模型已不可用，请重新选择。"); return; }
  const parsed = modelRouteSchema.safeParse({ id: formId.value, ...form.value, publicId: form.value.publicId.trim(), label: form.value.label.trim(), salePrice: salePrice.value, costPrice: costPrice.value });
  if (!parsed.success) { formError.value = translate("请检查创作端模型 ID、显示名称、转发目标和价格格式，价格最多支持 6 位小数。"); return; }
  const next = editingId.value ? routes.value.map(route => route.id === editingId.value ? parsed.data : route) : [...routes.value, parsed.data];
  const checked = modelRoutesSchema.safeParse(next);
  if (!checked.success) { formError.value = checked.error.issues.map(issue => translate(issue.message)).join("；"); return; }
  formSaving.value = true;
  formError.value = "";
  try {
    const result = await props.request<ModelRoutingSnapshot>({ method: "PUT", url: "/api/multiTenant/models/save", data: { routes: checked.data, expectedRevision: revision.value }, signal: controller.signal });
    if (controller.signal.aborted) return;
    applySnapshot(result);
    formVisible.value = false;
    ElMessage.success(translate("模型路由已保存"));
  } catch (cause) { showError(cause, translate("保存模型路由失败"), true); }
  finally { formSaving.value = false; }
}
async function changeState(route: ModelRoute) {
  if (busy.value || !loaded.value) return;
  stateTargetId.value = route.id;
  requestError.value = "";
  try {
    const result = await props.request<ModelRoutingSnapshot>({ method: "PUT", url: "/api/multiTenant/models/save", data: { routes: routes.value.map(item => item.id === route.id ? { ...item, enabled: !item.enabled } : item), expectedRevision: revision.value }, signal: controller.signal });
    if (!controller.signal.aborted) applySnapshot(result);
  } catch (cause) { showError(cause, translate("保存模型路由失败")); }
  finally { stateTargetId.value = ""; }
}

onMounted(load);
onBeforeUnmount(() => { controller.abort(); closeReloadPrompt?.(); });
</script>

<style lang="scss" scoped>
.modelsPage {
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);
  .pageHeading {
    display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px;
    h1 { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.4; letter-spacing: -0.02em; }
    p { max-width: 72ch; margin: 8px 0 0; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
    .headingActions { display: flex; flex-wrap: wrap; gap: 12px; .el-button { min-height: 44px; margin: 0; } }
  }
  .relatedLinks { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 16px; a { display: inline-flex; align-items: center; min-height: 44px; color: var(--el-color-primary); text-underline-offset: 4px; &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; } } }
  .requestError { margin-bottom: 20px; align-items: flex-start; :deep(.el-alert__title) { line-height: 1.7; overflow-wrap: anywhere; } }
  .routesList {
    min-width: 0; width: 100%; overflow: hidden;
    .modelIdentity, .upstreamIdentity { display: flex; flex-direction: column; gap: 4px; min-width: 0; .modelId { overflow-wrap: anywhere; font-variant-numeric: tabular-nums; } .secondaryText { color: var(--el-text-color-regular); font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; } }
    .upstreamIdentity .modelId { font-weight: 500; }
  }
  @media (max-width: 600px) { .pageHeading h1 { font-size: 24px; } }
}
.routeDialogBody {
  max-height: min(640px, calc(100dvh - 210px)); overflow-y: auto; padding: 2px 4px 2px 0;
  .forwardingSummary {
    display: grid; grid-template-columns: minmax(0, 1fr) 16px auto 16px minmax(0, 1fr); align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter);
    .flowEndpoint { display: flex; flex-direction: column; gap: 3px; min-width: 0; span { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; } strong { font-size: 15px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; } }
    > svg { color: var(--el-text-color-secondary); &:dir(rtl) { transform: rotate(180deg); } }
    .platformNode { max-width: 120px; padding: 4px 8px; border-radius: var(--el-border-radius-base); background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 12px; line-height: 1.5; text-align: center; overflow-wrap: anywhere; }
  }
  .routeForm {
    .formSection { min-width: 0; margin: 8px 0 0; padding-top: 8px; h3 { margin: 0 0 16px; font-size: 15px; line-height: 1.5; font-weight: 600; } }
    .formGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 24px; .upstreamField { grid-column: 1 / -1; } }
    .el-form-item { margin-bottom: 16px; }
    .el-select { width: 100%; }
    :deep(.el-input__wrapper), :deep(.el-select__wrapper) { min-height: 44px; }
    :deep(.el-form-item__label) { height: auto; padding-bottom: 6px; line-height: 1.5; }
    .routeMeta {
      display: flex; align-items: flex-end; gap: 12px 24px; margin-bottom: 16px;
      .modelKind { display: flex; align-items: center; gap: 10px; min-height: 44px; span { color: var(--el-text-color-regular); font-size: 13px; } }
      .kindField { flex: 1; max-width: calc(50% - 12px); min-width: 0; margin-bottom: 0; }
      .routeState { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0 10px; min-height: 44px; margin-inline-start: auto; label { display: flex; align-items: center; min-height: 44px; color: var(--el-text-color-regular); font-size: 13px; cursor: pointer; } :deep(.el-switch) { min-height: 44px; } }
    }
    .formNotice { margin-bottom: 16px; }
    .priceHint { margin: 2px 0 0; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
  }
  @media (max-width: 600px) {
    .forwardingSummary { gap: 8px; .platformNode { max-width: 88px; padding-inline: 6px; } .flowEndpoint strong { font-size: 14px; } }
    .routeForm { .formGrid { grid-template-columns: minmax(0, 1fr); } .routeMeta { gap: 12px; .kindField { max-width: none; } } }
  }
}
.routeFormError { margin-bottom: 20px; }
.dialogActions { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; .el-button { min-height: 44px; } }
</style>
