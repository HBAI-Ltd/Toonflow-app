<template>
  <div class="providerList">
    <div class="itemList">
      <toonflowProviderCard scope="media" :provider="providers.find(item => item.id === 'toonflow')" />
      <el-card v-for="item in visibleProviders" :key="item.fileName" class="providerItem" shadow="never">
        <div class="providerHeader">
          <div v-if="item.icon" class="providerMark" aria-hidden="true">
            <img class="providerLogo" :src="item.icon" alt="" />
          </div>
          <div class="providerInfo">
            <div class="providerHeading">
              <el-text class="providerName" tag="strong">{{ item.label }}</el-text>
            </div>
            <el-text class="providerId" size="small" type="info" :title="item.fileName">{{ item.fileName }}</el-text>
          </div>
        </div>
        <el-alert v-if="item.loadError" :title="item.loadError" type="error" :closable="false" showIcon />
        <div class="providerFooter">
          <div class="providerMeta">
            <el-tag v-if="item.version" size="small" type="info" effect="plain">v{{ item.version }}</el-tag>
            <el-tag v-if="upgradeVersion(item)" size="small" type="warning" effect="plain">可升级至 v{{ upgradeVersion(item) }}</el-tag>
            <el-text size="small" type="info">{{ item.models.length }} 个模型</el-text>
          </div>
          <el-space class="itemActions" wrap>
            <el-popconfirm v-if="upgradeVersion(item)" title="升级会用新版代码覆盖此供应商，自行修改的代码和模型不会保留，连接配置保留。确定升级？" width="280" confirmButtonText="升级" cancelButtonText="取消" @confirm="upgradeProvider(item)">
              <template #reference><el-button text type="warning" :icon="IconArrowUp" :loading="upgradingFile === item.fileName" :disabled="busy || !item.revision">升级</el-button></template>
            </el-popconfirm>
            <el-button v-if="item.modelsUrl" text :icon="IconDownload" :loading="fetchingFile === item.fileName" :disabled="busy || !!item.loadError || !item.revision" @click="fetchModels(item)">获取模型</el-button>
            <el-button text :icon="IconEdit" :disabled="busy || !!item.loadError" @click="editProvider(item)">编辑模型</el-button>
            <el-button text :icon="IconCode" :disabled="busy || !item.revision" @click="editProviderCode(item)">编辑代码</el-button>
            <el-popconfirm title="确定删除此供应商及其模型？" confirmButtonText="删除" cancelButtonText="取消" @confirm="deleteProvider(item)">
              <template #reference><el-button text type="danger" :icon="IconTrash" :loading="deletingFile === item.fileName" :disabled="busy || !item.revision">删除</el-button></template>
            </el-popconfirm>
          </el-space>
        </div>
      </el-card>
    </div>
    <div class="providerActions">
      <el-button class="addButton" :icon="IconPlus" @click="openAdd">添加供应商</el-button>
    </div>
    <component :is="mediaProviderDialog" v-model="providerDialogVisible" :provider="editingSourceProvider" @added="saveProviderItem" @saved="saveProviderItem" />
    <component :is="editProviderDialog" v-model="editorVisible" :provider="editingProvider" @saved="saveProviderItem" />
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import axios from "axios";
import { computed, defineAsyncComponent, onMounted, onBeforeUnmount, ref, shallowRef, type Component } from "vue";
import { ElMessage } from "element-plus";
import { IconPlus, IconEdit, IconTrash, IconDownload, IconCode, IconArrowUp } from "@tabler/icons-vue";
import type { MediaProvider } from "@toonflow/provider-web/types";
import { saveSettings } from "@/stores/settings";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { getBuiltinSource, useBuiltinUpgrades } from "@/lib/builtinProviders";
import { withTerminalConfirm } from "@/lib/pluginInstallConfirmation";
import toonflowProviderCard from "../../toonflowProviderCard.vue";

defineProps<{ visible?: boolean }>();
const upgradeVersion = useBuiltinUpgrades("media");
const mediaProviderDialog = shallowRef<Component>();
const editProviderDialog = shallowRef<Component>();
const providers = ref<MediaProvider[]>([]);
const visibleProviders = computed(() => providers.value.filter(item => item.id !== "toonflow"));
const providerDialogVisible = ref(false);
const editorVisible = ref(false);
const editingProvider = ref<MediaProvider>();
const editingSourceProvider = ref<MediaProvider>();
const deletingFile = ref("");
const fetchingFile = ref("");
const upgradingFile = ref("");
const busy = computed(() => !!fetchingFile.value || !!deletingFile.value || !!upgradingFile.value);
let loadRequest = 0;

function refreshInstalled(event: WindowEventMap["toonflow:plugin-installed"]) {
  if (event.detail.type === "provider") void loadProviders();
}
onMounted(() => {
  void loadProviders();
  window.addEventListener("toonflow:plugin-installed", refreshInstalled);
});
onBeforeUnmount(() => {
  loadRequest++;
  window.removeEventListener("toonflow:plugin-installed", refreshInstalled);
});

async function loadProviders() {
  const request = ++loadRequest;
  try {
    const { data } = await axios.get<{ data: MediaProvider[] }>("/api/providers/media/list");
    if (request === loadRequest) providers.value = data.data;
  } catch (error) {
    if (request === loadRequest) ElMessage.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "读取媒体供应商失败");
  }
}

function openAdd() {
  mediaProviderDialog.value ??= defineAsyncComponent(() => import("./addCustomProviderDialog.vue"));
  editingSourceProvider.value = undefined;
  providerDialogVisible.value = true;
}

function editProviderCode(provider: MediaProvider) {
  if (provider.id === "toonflow" || busy.value || !provider.revision) return;
  openAdd();
  editingSourceProvider.value = provider;
}

function editProvider(provider: MediaProvider) {
  if (provider.id === "toonflow" || busy.value || provider.loadError) return;
  editProviderDialog.value ??= defineAsyncComponent(() => import("./editProviderDialog.vue"));
  editingProvider.value = provider;
  editorVisible.value = true;
}

async function fetchModels(provider: MediaProvider) {
  if (provider.id === "toonflow" || busy.value || !provider.modelsUrl || !provider.revision || provider.loadError) return;
  fetchingFile.value = provider.fileName;
  try {
    const { data } = await axios.post<{ code: number; data: MediaProvider; message: string }>("/api/providers/media/models", {
      fileName: provider.fileName, revision: provider.revision,
    }, { timeout: 35000 });
    if (data.code !== 200 || !data.data) throw new Error(data.message || "获取模型失败");
    saveProviderItem(data.data);
    invalidateNodeModels("media");
    ElMessage.success("模型列表已更新");
  } catch (error) {
    ElMessage.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "获取模型失败，请重试");
  } finally { fetchingFile.value = ""; }
}

async function upgradeProvider(provider: MediaProvider) {
  if (provider.id === "toonflow" || busy.value || !provider.revision || !upgradeVersion(provider)) return;
  upgradingFile.value = provider.fileName;
  try {
    const { source } = await getBuiltinSource<MediaProvider>("media", provider.id);
    // ACT: 沿用「编辑代码」的保存接口，按 revision 防止覆盖其他地方的修改；连接配置在 settings 中，不受影响。
    const response = await withTerminalConfirm(allowTerminal => axios.put<{ code: number; data: MediaProvider; message?: string }>("/api/providers/media/save", {
      fileName: provider.fileName, revision: provider.revision, source, allowTerminal,
    }, { headers: { "x-toonflow-workspace": "1" } }));
    if (!response) return;
    const { data } = response;
    if (data.code !== 200 || !data.data) throw new Error(data.message || "升级失败，请重试");
    saveProviderItem(data.data);
    invalidateNodeModels("media");
    ElMessage.success(`${data.data.label}已更新`);
  } catch (error) {
    ElMessage.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "升级失败，请重试");
  } finally { upgradingFile.value = ""; }
}

async function deleteProvider(provider: MediaProvider) {
  if (provider.id === "toonflow" || busy.value || !provider.revision) return;
  deletingFile.value = provider.fileName;
  let deleted = false;
  try {
    await axios.delete("/api/providers/media/delete", { data: { fileName: provider.fileName, revision: provider.revision } });
    deleted = true;
    loadRequest++;
    invalidateNodeModels("media");
    providers.value = providers.value.filter(item => item.fileName !== provider.fileName);
    await saveSettings(settings => {
      const configs = settings.mediaProviderConfigs;
      if (!configs || typeof configs !== "object" || Array.isArray(configs) || !Object.hasOwn(configs, provider.id)) return;
      const current = { ...configs } as Record<string, unknown>;
      delete current[provider.id];
      return { mediaProviderConfigs: current };
    });
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : translate("删除失败，请重试");
    ElMessage.error(deleted ? `供应商已删除，但相关连接配置清理失败：${message}` : message);
  } finally { deletingFile.value = ""; }
}

function saveProviderItem(provider: MediaProvider) {
  loadRequest++;
  const index = providers.value.findIndex(item => item.fileName === provider.fileName);
  if (index < 0) providers.value.push(provider);
  else providers.value.splice(index, 1, provider);
}
</script>

<style lang="scss" scoped src="../../providerList.scss"></style>
