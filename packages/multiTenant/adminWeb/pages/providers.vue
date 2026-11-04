<template>
  <article class="providersPage">
    <header class="pageHeading">
      <div><h1>{{ translate("供应商管理") }}</h1><p>{{ translate("配置模型连接与上游能力，再由模型路由发布给创作端。") }}</p></div>
      <div class="headingActions">
        <el-button :loading="loading" :disabled="busy" @click="reload">{{ translate("重新加载") }}</el-button>
        <el-button v-if="activeTab !== 'cloud'" type="primary" :disabled="busy || !loaded" @click="openProvider()">{{ translate("添加供应商") }}</el-button>
      </div>
    </header>
    <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
    <el-tabs v-model="activeTab" class="providerTabs">
      <el-tab-pane :label="translate('文本供应商')" name="text" />
      <el-tab-pane :label="translate('媒体供应商')" name="media" />
      <el-tab-pane :label="translate('Toonflow 云端')" name="cloud" />
    </el-tabs>
    <section v-if="activeTab === 'cloud'" class="cloudSection" aria-labelledby="providerCloudTitle">
      <header class="sectionHeading"><h2 id="providerCloudTitle">{{ translate("Toonflow 云端凭据") }}</h2><el-tag :type="cloudConfigured ? 'success' : 'info'" size="small">{{ cloudConfigured ? translate("已配置") : translate("未配置") }}</el-tag></header>
      <p>{{ translate("使用平台专用云端凭据同步上游模型，凭据不会返回创作端。") }}</p>
      <el-form class="cloudForm" labelPosition="top" :disabled="busy || !loaded" @submit.prevent="syncCloud">
        <el-form-item class="tokenField" :label="translate('云端访问令牌')" for="providerCloudToken"><el-input id="providerCloudToken" v-model="cloudToken" type="password" autocomplete="off" :maxlength="16384" /></el-form-item>
        <el-button nativeType="submit" :loading="cloudSaving" :disabled="busy || !loaded || (!cloudConfigured && !cloudToken.trim())">{{ translate("保存并同步云端") }}</el-button>
      </el-form>
      <p v-if="cloudConfigured" class="credentialHint">{{ translate("留空时沿用已保存的云端凭据。") }}</p>
    </section>
    <section v-else v-loading="loading" class="providerList" :aria-busy="loading">
      <el-table :data="visibleProviders" :rowKey="providerKey" :emptyText="translate('暂无供应商')">
        <el-table-column :label="translate('供应商')" minWidth="220"><template #default="{ row }"><div class="providerIdentity"><strong>{{ row.label }}</strong><span>{{ row.id }}</span></div></template></el-table-column>
        <el-table-column :label="translate('配置来源')" minWidth="150"><template #default="{ row }"><el-tag type="info" effect="plain">{{ row.source ? translate("TypeScript 供应商") : translate("手动连接") }}</el-tag></template></el-table-column>
        <el-table-column :label="translate('上游模型')" minWidth="250"><template #default="{ row }"><div class="modelsSummary"><span class="modelCount">{{ row.models.length }}</span><span class="modelNames">{{ modelNames(row as ManagedModelProvider) }}</span></div></template></el-table-column>
        <el-table-column :label="translate('操作')" width="100" align="right"><template #default="{ row }"><el-button link type="primary" :disabled="busy" @click="openProvider(row as ManagedModelProvider)">{{ translate("编辑") }}</el-button></template></el-table-column>
      </el-table>
    </section>
    <providerEditor v-model="editorVisible" :kind="editorKind" :initial="editingProvider" :saving="saving" :error="editorError" :inspect="inspectProvider" @save="saveProvider" @reload="reload" />
  </article>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElTabPane, ElTabs, ElTable, ElTableColumn, ElTag, vLoading } from "element-plus";
import providerEditor from "@toonflow/provider-web/providerEditor";
import type { ProviderConfiguration, ProviderDescription, ProviderInspection, ProviderKind } from "@toonflow/provider-web/providerTypes";
import type { ManagedModelProvider, ProviderConfigurationSnapshot } from "@toonflow/multi-tenant-models/config";
import type { AdminRequest } from "../types";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/tab-pane/style/css";
import "element-plus/es/components/tabs/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/table-column/style/css";
import "element-plus/es/components/tag/style/css";

const props = defineProps<{ request: AdminRequest; enabled: boolean; saving: boolean; creationUrl: string }>();
const emit = defineEmits<{ sessionExpired: [] }>();
const providers = shallowRef<ManagedModelProvider[]>([]);
const revision = ref(0);
const loaded = ref(false);
const loading = ref(false);
const saving = ref(false);
const cloudSaving = ref(false);
const cloudConfigured = ref(false);
const cloudToken = ref("");
const activeTab = ref("text");
const requestError = ref("");
const editorVisible = ref(false);
const editorKind = ref<ProviderKind>("text");
const editingProvider = shallowRef<ProviderDescription>();
const editorError = ref("");
const confirmingReload = ref(false);
const busy = computed(() => loading.value || saving.value || cloudSaving.value || confirmingReload.value || props.saving);
const visibleProviders = computed(() => providers.value.filter(provider => provider.kind === activeTab.value));
const controller = new AbortController();
let closeReloadPrompt: (() => void) | undefined;

function providerKey(provider: Pick<ManagedModelProvider, "kind" | "id">) { return JSON.stringify([provider.kind, provider.id]); }
function modelNames(provider: ManagedModelProvider) { return provider.models.slice(0, 3).map(model => model.label).join(" · "); }
function applySnapshot(snapshot: ProviderConfigurationSnapshot) {
  providers.value = snapshot.providers;
  revision.value = snapshot.revision;
  cloudConfigured.value = snapshot.cloudConfigured;
  loaded.value = true;
}
function errorMessage(cause: unknown, fallback: string) {
  if ((cause as { status?: number } | null)?.status === 401) emit("sessionExpired");
  return cause instanceof Error ? cause.message : fallback;
}

async function load() {
  loading.value = true;
  requestError.value = "";
  try {
    const result = await props.request<ProviderConfigurationSnapshot>({ method: "GET", url: "/api/multiTenant/providers/get", signal: controller.signal });
    if (!controller.signal.aborted) applySnapshot(result);
  } catch (cause) { if (!controller.signal.aborted) requestError.value = errorMessage(cause, translate("读取供应商配置失败")); }
  finally { loading.value = false; }
}

async function reload() {
  if (busy.value) return;
  if (editorVisible.value) {
    confirmingReload.value = true;
    try {
      await ElMessageBox.confirm(({ close }) => { closeReloadPrompt = close; return h("p", translate("重新加载会放弃当前编辑，是否继续？")); }, translate("重新加载"), {
        type: "warning", confirmButtonText: translate("重新加载"), cancelButtonText: translate("取消"), closeOnClickModal: false,
      });
    } catch { return; }
    finally { closeReloadPrompt = undefined; confirmingReload.value = false; }
    editorVisible.value = false;
  }
  if (!controller.signal.aborted) await load();
}

function openProvider(provider?: ManagedModelProvider) {
  if (busy.value || !loaded.value || activeTab.value === "cloud") return;
  editorKind.value = activeTab.value === "media" ? "media" : "text";
  editingProvider.value = provider ? JSON.parse(JSON.stringify(provider)) : undefined;
  editorError.value = "";
  editorVisible.value = true;
}

async function inspectProvider(input: ProviderInspection, signal: AbortSignal) {
  try { return await props.request<ManagedModelProvider>({ method: "POST", url: "/api/multiTenant/providers/inspect", data: input, signal }); }
  catch (cause) { throw new Error(errorMessage(cause, translate("解析供应商失败")), { cause }); }
}

async function saveProvider(provider: ProviderConfiguration) {
  if (busy.value || !loaded.value || !editorVisible.value) return;
  saving.value = true;
  editorError.value = "";
  try {
    const configurations: ProviderConfiguration[] = providers.value.map(item => ({ kind: item.kind, id: item.id, label: item.label, ...(item.source ? { source: item.source } : {}), config: item.config }));
    const previous = editingProvider.value;
    if (previous) {
      if (provider.kind !== previous.kind || provider.id !== previous.id) throw new Error(translate("不能修改已有供应商的 ID"));
      const index = configurations.findIndex(item => providerKey(item) === providerKey(previous));
      if (index < 0) throw new Error(translate("供应商配置已变更，请重新加载"));
      configurations.splice(index, 1, provider);
    } else {
      if (configurations.some(item => providerKey(item) === providerKey(provider))) throw new Error(translate("供应商 ID 不能重复"));
      configurations.push(provider);
    }
    const result = await props.request<ProviderConfigurationSnapshot>({ method: "PUT", url: "/api/multiTenant/providers/save", data: { providers: configurations, expectedRevision: revision.value }, signal: controller.signal });
    if (controller.signal.aborted) return;
    applySnapshot(result);
    editorVisible.value = false;
    ElMessage.success(translate("供应商配置已保存"));
  } catch (cause) { if (!controller.signal.aborted) editorError.value = errorMessage(cause, translate("保存供应商失败")); }
  finally { saving.value = false; }
}

async function syncCloud() {
  if (busy.value || !loaded.value || !cloudConfigured.value && !cloudToken.value.trim()) return;
  cloudSaving.value = true;
  requestError.value = "";
  const token = cloudToken.value.trim();
  try {
    const result = await props.request<{ revision: number; cloudConfigured: boolean }>({ method: "POST", url: "/api/multiTenant/models/cloud", data: { ...(token ? { token } : {}), expectedRevision: revision.value }, signal: controller.signal });
    if (controller.signal.aborted) return;
    revision.value = result.revision;
    cloudConfigured.value = result.cloudConfigured;
    ElMessage.success(translate("云端模型已同步"));
  } catch (cause) { if (!controller.signal.aborted) requestError.value = errorMessage(cause, translate("同步云端模型失败")); }
  finally { cloudToken.value = ""; cloudSaving.value = false; }
}

onMounted(load);
onBeforeUnmount(() => { closeReloadPrompt?.(); controller.abort(); cloudToken.value = ""; providers.value = []; editingProvider.value = undefined; });
</script>

<style lang="scss" scoped>
.providersPage {
  min-width: 0;
  .pageHeading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 28px; h1 { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; } p { margin: 10px 0 0; color: var(--el-text-color-regular); overflow-wrap: anywhere; } .headingActions { display: flex; gap: 12px; flex-shrink: 0; .el-button { margin: 0; min-height: 40px; } } }
  .requestError { margin-bottom: 20px; }
  .providerTabs { margin-bottom: 20px; :deep(.el-tabs__item) { min-height: 44px; } }
  .providerList { min-width: 0; .providerIdentity { display: flex; flex-direction: column; gap: 3px; strong { font-size: 14px; font-weight: 600; } span { font-size: 12px; color: var(--el-text-color-secondary); overflow-wrap: anywhere; } } .modelsSummary { display: flex; align-items: baseline; gap: 12px; .modelCount { flex-shrink: 0; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); } .modelNames { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } } :deep(.el-table__cell) { padding-block: 16px; } }
  .cloudSection { max-width: 760px; padding-block: 12px 24px; .sectionHeading { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; h2 { margin: 0; font-size: 16px; font-weight: 600; } } > p { margin: 0; color: var(--el-text-color-regular); overflow-wrap: anywhere; } .cloudForm { display: flex; gap: 12px; align-items: flex-end; margin-top: 24px; .tokenField { flex: 1; min-width: 0; margin: 0; } .el-button { min-height: 44px; margin: 0; flex-shrink: 0; } :deep(.el-input__wrapper) { min-height: 42px; } :deep(.el-form-item__label) { height: auto; line-height: 1.5; padding-bottom: 8px; } } .credentialHint { margin-top: 12px; font-size: 13px; color: var(--el-text-color-secondary); } }
  @media (max-width: 760px) { .pageHeading { flex-direction: column; align-items: stretch; .headingActions { flex-wrap: wrap; } } .cloudSection .cloudForm { align-items: stretch; flex-direction: column; .el-button { align-self: flex-start; } } }
}
</style>
