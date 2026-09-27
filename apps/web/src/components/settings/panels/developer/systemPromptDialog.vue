<template>
  <el-dialog v-model="visible" :title="t('developer.systemPromptTitle')" width="min(960px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving">
    <div v-if="loading" class="loadState" role="status">{{ t("systemPrompt.loading") }}</div>
    <div v-else-if="loadError" class="loadState">
      <el-text type="danger" role="alert">{{ getErrorDisplay(loadError) }}</el-text>
      <el-button @click="loadPrompt">{{ t("common.retry") }}</el-button>
    </div>
    <div v-else class="promptEditor">
      <div class="promptDescription">
        <p>{{ t("systemPrompt.saveHint") }}</p>
        <p>{{ t("systemPrompt.preservePlaceholders") }}</p>
      </div>
      <el-input v-model="draft" class="promptInput" type="textarea" :maxlength="maxLength" showWordLimit resize="none" :disabled="saving" :aria-label="t('developer.systemPromptTitle')" />
      <el-text v-if="saveError" type="danger" role="alert">{{ getErrorDisplay(saveError) }}</el-text>
    </div>
    <template #footer>
      <div class="dialogFooter">
        <el-button :disabled="loading || !!loadError || saving" @click="draft = defaultSystemPrompt">{{ t("common.restoreDefault") }}</el-button>
        <div>
          <el-button :disabled="saving" @click="visible = false">{{ t("common.cancel") }}</el-button>
          <el-button type="primary" :loading="saving" :disabled="loading || !!loadError || !maxLength || draft.length > maxLength" @click="save">{{ t("common.save") }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import axios from "axios";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { saveSettings, settings } from "@/stores/settings";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";

const visible = defineModel<boolean>({ default: false });
const draft = ref("");
const defaultSystemPrompt = ref("");
const maxLength = ref(0);
const loading = ref(false);
const saving = ref(false);
const loadError = shallowRef<Error>();
const saveError = shallowRef<Error>();
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(loadPrompt);

async function loadPrompt() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = undefined;
  try {
    const { data } = await axios.get<{ code: number; data: { defaultSystemPrompt: string; maxLength: number }; message?: string }>("/api/settings/systemPrompt", {
      headers: { "x-toonflow-workspace": "1", "Cache-Control": "no-cache" }, signal: controller.signal,
    });
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("读取系统提示词失败", () => t("systemPrompt.loadFailed"));
    if (typeof data.data?.defaultSystemPrompt !== "string" || !Number.isSafeInteger(data.data.maxLength) || data.data.maxLength <= 0) {
      throw createDisplayError("系统提示词格式错误", () => t("systemPrompt.invalidFormat"));
    }
    defaultSystemPrompt.value = data.data.defaultSystemPrompt;
    maxLength.value = data.data.maxLength;
    const saved = settings.value.agentSystemPrompt;
    draft.value = typeof saved === "string" && saved.trim() ? saved : defaultSystemPrompt.value;
  } catch (error) {
    loadError.value = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ? new Error(error.response.data.message) : createDisplayError("读取系统提示词失败，请重试", () => t("systemPrompt.loadFailedRetry"))
      : error instanceof Error ? error : createDisplayError("读取系统提示词失败，请重试", () => t("systemPrompt.loadFailedRetry"));
  } finally { loading.value = false; }
}

async function save() {
  if (saving.value || loading.value || loadError.value || !maxLength.value || draft.value.length > maxLength.value) return;
  const agentSystemPrompt = !draft.value.trim() || draft.value === defaultSystemPrompt.value ? "" : draft.value;
  saving.value = true;
  saveError.value = undefined;
  try {
    await saveSettings(() => ({ agentSystemPrompt }));
    ElMessage.success(t("systemPrompt.saved"));
    visible.value = false;
  } catch (error) {
    saveError.value = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ? new Error(error.response.data.message) : createDisplayError("保存失败，请重试；当前内容已保留", () => t("systemPrompt.saveFailed"))
      : error instanceof Error ? error : createDisplayError("保存失败，请重试；当前内容已保留", () => t("systemPrompt.saveFailed"));
  } finally { saving.value = false; }
}
</script>

<style lang="scss" scoped>
.loadState {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
}

.promptEditor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: min(640px, 65dvh);
  min-height: 0;

  .promptDescription {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
    p { margin: 0; }
  }

  .promptInput {
    flex: 1;
    min-height: 0;
    :deep(.el-textarea__inner) { height: 100%; }
  }
}

.dialogFooter {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
