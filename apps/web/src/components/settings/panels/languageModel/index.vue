<template>
  <div class="providerList">
    <div class="itemList">
      <toonflowProviderCard scope="text" :provider="customProviders.find(item => item.id.toLowerCase() === 'toonflow')" />
      <el-card v-for="item in visibleProviders" :key="item.id" class="providerItem" shadow="never">
        <div class="providerHeader">
          <div v-if="item.icon" class="providerMark" aria-hidden="true">
            <img class="providerLogo" :src="item.icon" alt="" />
          </div>
          <div class="providerInfo">
            <div class="providerHeading">
              <el-text class="providerName" tag="strong">{{ item.label }}</el-text>
            </div>
            <el-text class="providerId" size="small" type="info" :title="item.id">{{ item.id }}</el-text>
          </div>
        </div>
        <div class="providerFooter">
          <div class="providerMeta">
            <el-tag v-if="getProviderVersion(item)" size="small" type="info" effect="plain">v{{ getProviderVersion(item) }}</el-tag>
            <el-tag v-if="upgradeVersion(item)" size="small" type="warning" effect="plain">可升级至 v{{ upgradeVersion(item) }}</el-tag>
            <el-text size="small" type="info">{{ item.models.length }} 个模型</el-text>
          </div>
          <el-space class="itemActions" wrap>
            <el-popconfirm v-if="upgradeVersion(item)" title="升级会用新版替换此供应商的地址、请求头和模型列表，API Key 保留。确定升级？" width="280" confirmButtonText="升级" cancelButtonText="取消" @confirm="upgradeProvider(item)">
              <template #reference><el-button text type="warning" :icon="IconArrowUp" :loading="upgradingId === item.id" :disabled="busy">升级</el-button></template>
            </el-popconfirm>
            <el-button text :icon="IconEdit" :disabled="busy" @click="openProvider(item)">编辑</el-button>
            <el-popconfirm title="确定删除此供应商及其模型？" confirmButtonText="删除" cancelButtonText="取消" @confirm="deleteProvider(item.id)">
              <template #reference><el-button text type="danger" :icon="IconTrash" :loading="deletingId === item.id" :disabled="busy">删除</el-button></template>
            </el-popconfirm>
          </el-space>
        </div>
      </el-card>
    </div>
    <div class="providerActions">
      <el-button class="addButton" :icon="IconPlus" @click="openProvider()">添加供应商</el-button>
    </div>
    <component :is="addCustomProviderDialog" v-model="providerDialogVisible" :provider="editingProvider" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowRef, type Component } from "vue";
import { ElMessage } from "element-plus";
import { customProviders, saveSettings, type CustomProvider } from "@/stores/settings";
import { IconPlus, IconEdit, IconTrash, IconArrowUp } from "@tabler/icons-vue";
import { getBuiltinSource, useBuiltinUpgrades, type BuiltinLanguageProvider } from "@/lib/builtinProviders";
import toonflowProviderCard from "../../toonflowProviderCard.vue";

defineProps<{ visible?: boolean }>();
const upgradeVersion = useBuiltinUpgrades("language");
const addCustomProviderDialog = shallowRef<Component>();
const providerDialogVisible = ref(false);
const editingProvider = ref<CustomProvider>();
const deletingId = ref("");
const upgradingId = ref("");
const busy = computed(() => !!deletingId.value || !!upgradingId.value);
const visibleProviders = computed(() => customProviders.value.filter(item => item.id.toLowerCase() !== "toonflow"));

function getProviderVersion(provider: CustomProvider) {
  const version = provider.version;
  return typeof version === "string" ? version.trim() : "";
}

function openProvider(provider?: CustomProvider) {
  if (provider?.id.toLowerCase() === "toonflow") return;
  addCustomProviderDialog.value ??= defineAsyncComponent(() => import("./addCustomProviderDialog.vue"));
  editingProvider.value = provider;
  providerDialogVisible.value = true;
}

async function upgradeProvider(provider: CustomProvider) {
  if (provider.id.toLowerCase() === "toonflow" || busy.value || !upgradeVersion(provider)) return;
  upgradingId.value = provider.id;
  try {
    const { provider: latest } = await getBuiltinSource<BuiltinLanguageProvider>("language", provider.id);
    // ACT: 在线定义带空 apiKey，只取供应商字段；新版没有内置模型（需按 API Key 获取）时保留当前模型列表。
    const upgraded = {
      label: latest.label, icon: latest.icon, version: latest.version, apiUrl: latest.apiUrl, protocol: latest.protocol, headers: latest.headers,
      maxRequestImageBytes: latest.maxRequestImageBytes, maxRequestBytes: latest.maxRequestBytes,
      ...(latest.models.length ? { models: latest.models.map(model => ({ ...model })) } : {}),
    };
    await saveSettings(settings => {
      const current = settings.customProviders;
      if (!Array.isArray(current)) throw new Error("配置格式错误");
      if (!current.some(item => item?.id === provider.id)) throw new Error("供应商已不存在");
      return { customProviders: current.map(item => item?.id === provider.id ? { ...item, ...upgraded } : item) };
    });
    ElMessage.success(`${latest.label}已更新`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "升级失败，请重试");
  } finally { upgradingId.value = ""; }
}

async function deleteProvider(id: string) {
  if (id.toLowerCase() === "toonflow" || busy.value) return;
  deletingId.value = id;
  try {
    await saveSettings(settings => {
      const current = settings.customProviders;
      if (!Array.isArray(current)) throw new Error("配置格式错误");
      return { customProviders: current.filter(item => item?.id !== id) };
    });
  } catch { ElMessage.error("删除失败，请重试"); }
  finally { deletingId.value = ""; }
}
</script>

<style lang="scss" scoped src="../../providerList.scss"></style>
