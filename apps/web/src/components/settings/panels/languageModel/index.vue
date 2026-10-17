<template>
  <div class="providerList">
    <div class="itemList">
      <el-card class="providerItem" shadow="never">
        <div class="providerHeader">
          <div class="providerMark" aria-hidden="true">
            <img class="providerLogo monochrome" :src="logoUrl" alt="" />
          </div>
          <div class="providerInfo">
            <div class="providerHeading">
              <el-text class="providerName" tag="strong">{{ tfRouter.label }}</el-text>
            </div>
            <el-text class="providerId" size="small" type="info">v{{ tfRouter.version }}</el-text>
          </div>
        </div>
        <div class="keyForm">
          <el-input
            v-model="draftKey"
            dir="ltr"
            type="password"
            showPassword
            placeholder="粘贴影幻 API Key"
            aria-label="影幻 API Key"
            :disabled="saving || refreshing"
            @keyup.enter="saveKey" />
          <el-button type="primary" :loading="saving" :disabled="!draftKey.trim() || saving || refreshing" @click="saveKey">保存</el-button>
          <el-button :icon="IconRefresh" :loading="refreshing" :disabled="saving || refreshing" @click="refreshModels">更新模型</el-button>
        </div>
        <el-text v-if="error" class="keyError" size="small" type="danger" role="alert">{{ error }}</el-text>
        <div class="providerFooter">
          <div class="providerMeta">
            <el-text size="small" type="info">{{ modelCount }} 个模型</el-text>
          </div>
          <el-text size="small" type="info">模型可在影幻平台的渠道设置中管理，保存 Key 或点击更新模型后自动同步。</el-text>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { IconRefresh } from "@tabler/icons-vue";
import tfRouter from "@toonflow/providers/language/tfRouter";
import logoUrl from "@toonflow/assets/logo.svg";
import { customProviders, saveSettings, type CustomProvider } from "@/stores/settings";
import { fetchProviderModels, getProviderApiKey, saveProviderApiKey } from "@/lib/providerKey";

const draftKey = ref(getProviderApiKey());
const saving = ref(false);
const refreshing = ref(false);
const error = ref("");
const modelCount = computed(() => customProviders.value
  .find(item => item.id.toLowerCase() === tfRouter.id.toLowerCase())?.models.length ?? 0);

async function saveKey() {
  const key = draftKey.value.trim();
  if (!key || saving.value || refreshing.value) return;
  saving.value = true;
  error.value = "";
  try {
    await saveProviderApiKey(key);
    draftKey.value = key;
    ElMessage.success("API Key 已保存");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "保存失败，请重试";
  } finally {
    saving.value = false;
  }
}

async function refreshModels() {
  const key = getProviderApiKey();
  if (!key || saving.value || refreshing.value) return;
  refreshing.value = true;
  error.value = "";
  try {
    const models = await fetchProviderModels(key);
    if (!models.length) throw new Error("未获取到文本模型，请先在影幻平台添加对话模型");
    await saveSettings(current => {
      const providers = Array.isArray(current.customProviders) ? current.customProviders as CustomProvider[] : [];
      const index = providers.findIndex(item => typeof item?.id === "string" && item.id.toLowerCase() === tfRouter.id.toLowerCase());
      if (index < 0) throw new Error("请先保存 API Key");
      return { customProviders: providers.map((item, position) => position === index ? { ...item, models } : item) };
    });
    ElMessage.success("模型列表已更新");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取模型列表失败，请重试";
  } finally {
    refreshing.value = false;
  }
}
</script>

<style lang="scss" scoped src="../../providerList.scss"></style>
