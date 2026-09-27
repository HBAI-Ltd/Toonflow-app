<template>
  <el-dialog v-model="visible" :title="t('agents.a2aService')" width="min(560px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="emit('closed')">
    <el-form v-loading="loading" labelPosition="top" :disabled="loading || saving" @submit.prevent="save">
      <el-form-item :label="t('agents.allowExternalAccess')"><el-switch v-model="enabled" :aria-label="t('agents.enableA2a')" /></el-form-item>
      <el-form-item :label="t('agents.authorizedWorkspace')">
        <div class="directoryField"><el-input v-model="directory" :placeholder="t('agents.workspacePlaceholder')" /><workspacePicker v-model="directory" :disabled="loading || saving" /></div>
      </el-form-item>
      <el-form-item :label="t('settings.languageModels')">
        <el-select v-model="selectedModel" :placeholder="t('agents.modelPlaceholder')" filterable style="width: 100%">
          <el-option v-for="model in modelChoices" :key="model.value" :value="model.value" :label="model.label" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="url" :label="t('agents.endpoint')"><el-input :modelValue="url" readonly /></el-form-item>
      <el-form-item v-if="token" :label="t('agents.accessToken')"><el-input :modelValue="token" type="password" showPassword readonly autocomplete="off" /></el-form-item>
      <el-text size="small" type="info">{{ t("agents.a2aSecurityHint") }}</el-text>
      <el-alert v-if="error" class="settingsError" :title="getErrorDisplay(error)" type="error" :closable="false" showIcon />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ t("common.close") }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || !loaded || (enabled && (!directory.trim() || !selectedModel))" @click="save">{{ t("common.save") }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import axios from "axios";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import workspacePicker from "@/pages/home/workspacePicker.vue";
import { modelChoices } from "@/stores/settings";

type A2aSettings = { enabled: boolean; directory: string; token?: string; url: string; providerId?: string; modelId?: string; thinkingLevel?: string };
const emit = defineEmits<{ saved: []; closed: [] }>();
const visible = ref(true);
const enabled = ref(false);
const directory = ref("");
const selectedModel = ref("");
const thinkingLevel = ref<string>();
const token = ref("");
const url = ref("");
const loading = ref(true);
const loaded = ref(false);
const saving = ref(false);
const error = ref<Error>();
const headers = { "x-toonflow-workspace": "1" };
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(async () => {
  try { await load(); }
  catch (cause) { error.value = errorMessage(cause); }
  finally { loading.value = false; }
});

function errorMessage(cause: unknown) {
  return axios.isAxiosError(cause) && typeof cause.response?.data?.message === "string"
    ? new Error(cause.response.data.message)
    : cause instanceof Error ? cause : createDisplayError("操作失败", () => t("common.operationFailed"));
}

async function load() {
  const { data } = await axios.get<{ code: number; data: A2aSettings; message?: string }>("/api/agents/a2a/get", { headers, signal: controller.signal });
  if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("读取 A2A 设置失败", () => t("agents.a2aLoadFailed"));
  applySettings(data.data);
}

function applySettings(value: A2aSettings) {
  if (!value || typeof value.enabled !== "boolean" || typeof value.directory !== "string") throw createDisplayError("A2A 设置格式错误", () => t("agents.a2aInvalid"));
  enabled.value = value.enabled;
  directory.value = value.directory;
  selectedModel.value = value.providerId && value.modelId ? JSON.stringify([value.providerId, value.modelId]) : "";
  thinkingLevel.value = value.thinkingLevel;
  token.value = value.token ?? "";
  url.value = value.url;
  loaded.value = true;
}

async function save() {
  if (saving.value || loading.value || !loaded.value) return;
  saving.value = true;
  error.value = undefined;
  try {
    const model = modelChoices.value.find(item => item.value === selectedModel.value);
    if (enabled.value && !model) throw createDisplayError("请选择可用的文本模型", () => t("agents.chooseModel"));
    const { data } = await axios.put("/api/agents/a2a/save", {
      enabled: enabled.value, directory: directory.value.trim(), providerId: model?.providerId ?? "", modelId: model?.modelId ?? "",
      ...(thinkingLevel.value ? { thinkingLevel: thinkingLevel.value } : {}),
    }, { headers });
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("保存 A2A 设置失败", () => t("agents.a2aSaveFailed"));
    applySettings(data.data);
    emit("saved");
    ElMessage.success(t("agents.a2aSaved"));
  } catch (cause) { error.value = errorMessage(cause); }
  finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
.directoryField {
  display: flex;
  gap: 8px;
  width: 100%;
  :deep(.workspaceButton) { flex-shrink: 0; max-width: 180px; }
}
.settingsError { margin-top: 12px; }
</style>
