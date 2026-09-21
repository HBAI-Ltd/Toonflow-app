<template>
  <el-dialog v-model="visible" title="A2A 服务" width="min(560px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="emit('closed')">
    <el-form v-loading="loading" labelPosition="top" :disabled="loading || saving" @submit.prevent="save">
      <el-form-item label="允许外部 Agent 调用本地团队"><el-switch v-model="enabled" aria-label="开启 A2A 服务" /></el-form-item>
      <el-form-item label="授权工作区">
        <div class="directoryField"><el-input v-model="directory" placeholder="选择允许团队操作的工作区" /><workspacePicker v-model="directory" :disabled="loading || saving" /></div>
      </el-form-item>
      <el-form-item label="文本模型">
        <el-select v-model="selectedModel" placeholder="选择团队使用的文本模型" filterable style="width: 100%">
          <el-option v-for="model in modelChoices" :key="model.value" :value="model.value" :label="model.label" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="url" label="服务地址"><el-input :modelValue="url" readonly /></el-form-item>
      <el-form-item v-if="token" label="访问令牌"><el-input :modelValue="token" type="password" showPassword readonly autocomplete="off" /></el-form-item>
      <el-text size="small" type="info">保存开启后，本地团队卡片可复制各自的 Agent Card 地址。外部调用使用访问令牌，仅操作这里授权的工作区。</el-text>
      <el-alert v-if="error" class="settingsError" :title="error" type="error" :closable="false" showIcon />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || !loaded || (enabled && (!directory.trim() || !selectedModel))" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
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
const error = ref("");
const headers = { "x-toonflow-workspace": "1" };
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(async () => {
  try { await load(); }
  catch (cause) { error.value = errorMessage(cause); }
  finally { loading.value = false; }
});

function errorMessage(cause: unknown) {
  return axios.isAxiosError(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : "操作失败";
}

async function load() {
  const { data } = await axios.get<{ code: number; data: A2aSettings; message?: string }>("/api/agents/a2a/get", { headers, signal: controller.signal });
  if (data.code !== 200) throw new Error(data.message || "读取 A2A 设置失败");
  applySettings(data.data);
}

function applySettings(value: A2aSettings) {
  if (!value || typeof value.enabled !== "boolean" || typeof value.directory !== "string") throw new Error("A2A 设置格式错误");
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
  error.value = "";
  try {
    const model = modelChoices.value.find(item => item.value === selectedModel.value);
    if (enabled.value && !model) throw new Error("请选择可用的文本模型");
    const { data } = await axios.put("/api/agents/a2a/save", {
      enabled: enabled.value, directory: directory.value.trim(), providerId: model?.providerId ?? "", modelId: model?.modelId ?? "",
      ...(thinkingLevel.value ? { thinkingLevel: thinkingLevel.value } : {}),
    }, { headers });
    if (data.code !== 200) throw new Error(data.message || "保存 A2A 设置失败");
    applySettings(data.data);
    emit("saved");
    ElMessage.success("A2A 设置已保存");
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
