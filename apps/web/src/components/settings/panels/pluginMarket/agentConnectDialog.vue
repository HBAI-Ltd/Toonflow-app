<template>
  <el-dialog v-model="visible" :title="t('agents.connectRemote')" width="min(520px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="emit('closed')">
    <el-form labelPosition="top" :disabled="saving" @submit.prevent="connect">
      <el-form-item :label="t('agents.identifier')"><el-input v-model="name" :placeholder="t('agents.identifierPlaceholder')" autocomplete="off" :maxlength="96" /></el-form-item>
      <el-form-item :label="t('agents.cardUrl')"><el-input v-model="cardUrl" placeholder="https://example.com/.well-known/agent-card.json" autocomplete="off" /></el-form-item>
      <el-form-item :label="t('agents.accessTokenOptional')"><el-input v-model="token" type="password" showPassword autocomplete="off" /></el-form-item>
      <el-alert v-if="error" :title="getErrorDisplay(error)" type="error" :closable="false" showIcon />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ t("common.cancel") }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!name.trim() || !cardUrl.trim()" @click="connect">{{ t("common.connect") }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import axios from "axios";
import { ref } from "vue";
import { ElMessage } from "element-plus";

const emit = defineEmits<{ saved: []; closed: [] }>();
const visible = ref(true);
const name = ref("");
const cardUrl = ref("");
const token = ref("");
const saving = ref(false);
const error = ref<Error>();

async function connect() {
  if (saving.value) return;
  error.value = undefined;
  if (!/^[a-z][a-zA-Z0-9]{0,95}$/.test(name.value.trim())) {
    error.value = createDisplayError("标识须以小写字母开头，仅包含字母和数字", () => t("agents.identifierInvalid"));
    return;
  }
  if (!URL.canParse(cardUrl.value.trim()) || !["http:", "https:"].includes(new URL(cardUrl.value.trim()).protocol)) {
    error.value = createDisplayError("请输入有效的 HTTP 或 HTTPS Agent Card 地址", () => t("agents.cardUrlInvalid"));
    return;
  }
  saving.value = true;
  try {
    const { data } = await axios.post("/api/agents/connect", {
      name: name.value.trim(), cardUrl: cardUrl.value.trim(), ...(token.value.trim() ? { token: token.value.trim() } : {}),
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("连接失败", () => t("agents.connectFailed"));
    emit("saved");
    ElMessage.success(t("agents.connected"));
    visible.value = false;
  } catch (cause) {
    error.value = axios.isAxiosError(cause) && typeof cause.response?.data?.message === "string"
      ? new Error(cause.response.data.message)
      : cause instanceof Error ? cause : createDisplayError("连接失败", () => t("agents.connectFailed"));
  } finally { saving.value = false; }
}
</script>
