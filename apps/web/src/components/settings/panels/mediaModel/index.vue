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
              <el-text class="providerName" tag="strong">{{ provider.label }}</el-text>
            </div>
            <el-text class="providerId" size="small" type="info">v{{ provider.version }}</el-text>
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
            :disabled="saving"
            @keyup.enter="saveKey" />
          <el-button type="primary" :loading="saving" :disabled="!draftKey.trim() || saving" @click="saveKey">保存</el-button>
        </div>
        <el-text v-if="error" class="keyError" size="small" type="danger" role="alert">{{ error }}</el-text>
        <div class="providerFooter">
          <div class="providerMeta">
            <el-text size="small" type="info">{{ provider.models.length }} 个模型</el-text>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { mediaProviders } from "@toonflow/providers";
import logoUrl from "@toonflow/assets/logo.svg";
import { getProviderApiKey, saveProviderApiKey } from "@/lib/providerKey";

const provider = mediaProviders[0]!;
const draftKey = ref(getProviderApiKey());
const saving = ref(false);
const error = ref("");

async function saveKey() {
  const key = draftKey.value.trim();
  if (!key || saving.value) return;
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
</script>

<style lang="scss" scoped src="../../providerList.scss"></style>
