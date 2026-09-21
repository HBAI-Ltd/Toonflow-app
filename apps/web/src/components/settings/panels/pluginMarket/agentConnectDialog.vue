<template>
  <el-dialog v-model="visible" title="连接远程 Agent" width="min(520px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="emit('closed')">
    <el-form labelPosition="top" :disabled="saving" @submit.prevent="connect">
      <el-form-item label="标识"><el-input v-model="name" placeholder="例如 storyAgent" autocomplete="off" :maxlength="96" /></el-form-item>
      <el-form-item label="Agent Card URL"><el-input v-model="cardUrl" placeholder="https://example.com/.well-known/agent-card.json" autocomplete="off" /></el-form-item>
      <el-form-item label="访问令牌（可选）"><el-input v-model="token" type="password" showPassword autocomplete="off" /></el-form-item>
      <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!name.trim() || !cardUrl.trim()" @click="connect">连接</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref } from "vue";
import { ElMessage } from "element-plus";

const emit = defineEmits<{ saved: []; closed: [] }>();
const visible = ref(true);
const name = ref("");
const cardUrl = ref("");
const token = ref("");
const saving = ref(false);
const error = ref("");

async function connect() {
  if (saving.value) return;
  error.value = "";
  if (!/^[a-z][a-zA-Z0-9]{0,95}$/.test(name.value.trim())) {
    error.value = "标识须以小写字母开头，仅包含字母和数字";
    return;
  }
  if (!URL.canParse(cardUrl.value.trim()) || !["http:", "https:"].includes(new URL(cardUrl.value.trim()).protocol)) {
    error.value = "请输入有效的 HTTP 或 HTTPS Agent Card 地址";
    return;
  }
  saving.value = true;
  try {
    const { data } = await axios.post("/api/agents/connect", {
      name: name.value.trim(), cardUrl: cardUrl.value.trim(), ...(token.value.trim() ? { token: token.value.trim() } : {}),
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || "连接失败");
    emit("saved");
    ElMessage.success("远程 Agent 已连接");
    visible.value = false;
  } catch (cause) {
    error.value = axios.isAxiosError(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : "连接失败";
  } finally { saving.value = false; }
}
</script>
