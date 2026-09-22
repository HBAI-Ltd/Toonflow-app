<template>
  <el-dialog v-model="visible" title="Agent 系统提示词" width="min(960px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving">
    <div v-if="loading" class="loadState" role="status">正在读取系统提示词…</div>
    <div v-else-if="loadError" class="loadState">
      <el-text type="danger" role="alert">{{ loadError }}</el-text>
      <el-button @click="loadPrompt">重试</el-button>
    </div>
    <div v-else class="promptEditor">
      <div class="promptDescription">
        <p>保存后下一条消息生效，留空使用默认提示词。</p>
        <p v-pre>保留 {{tools}}、{{guidelines}}、{{environment}} 及相关条件块，以自动填入工具规则和运行环境。</p>
      </div>
      <el-input v-model="draft" class="promptInput" type="textarea" :maxlength="maxLength" showWordLimit resize="none" :disabled="saving" aria-label="Agent 系统提示词" />
      <el-text v-if="saveError" type="danger" role="alert">{{ saveError }}</el-text>
    </div>
    <template #footer>
      <div class="dialogFooter">
        <el-button :disabled="loading || !!loadError || saving" @click="draft = defaultSystemPrompt">恢复默认</el-button>
        <div>
          <el-button :disabled="saving" @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="saving" :disabled="loading || !!loadError || !maxLength || draft.length > maxLength" @click="save">保存</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { saveSettings, settings } from "@/stores/settings";

const visible = defineModel<boolean>({ default: false });
const draft = ref("");
const defaultSystemPrompt = ref("");
const maxLength = ref(0);
const loading = ref(false);
const saving = ref(false);
const loadError = ref("");
const saveError = ref("");
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(loadPrompt);

async function loadPrompt() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = "";
  try {
    const { data } = await axios.get<{ code: number; data: { defaultSystemPrompt: string; maxLength: number }; message?: string }>("/api/settings/systemPrompt", {
      headers: { "x-toonflow-workspace": "1", "Cache-Control": "no-cache" }, signal: controller.signal,
    });
    if (data.code !== 200) throw new Error(data.message || "读取系统提示词失败");
    if (typeof data.data?.defaultSystemPrompt !== "string" || !Number.isSafeInteger(data.data.maxLength) || data.data.maxLength <= 0) {
      throw new Error("系统提示词格式错误");
    }
    defaultSystemPrompt.value = data.data.defaultSystemPrompt;
    maxLength.value = data.data.maxLength;
    const saved = settings.value.agentSystemPrompt;
    draft.value = typeof saved === "string" && saved.trim() ? saved : defaultSystemPrompt.value;
  } catch (error) {
    loadError.value = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "读取系统提示词失败，请重试" : error instanceof Error ? error.message : "读取系统提示词失败，请重试";
  } finally { loading.value = false; }
}

async function save() {
  if (saving.value || loading.value || loadError.value || !maxLength.value || draft.value.length > maxLength.value) return;
  const agentSystemPrompt = !draft.value.trim() || draft.value === defaultSystemPrompt.value ? "" : draft.value;
  saving.value = true;
  saveError.value = "";
  try {
    await saveSettings(() => ({ agentSystemPrompt }));
    ElMessage.success("系统提示词已保存");
    visible.value = false;
  } catch (error) {
    saveError.value = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "保存失败，请重试；当前内容已保留" : error instanceof Error ? error.message : "保存失败，请重试；当前内容已保留";
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
