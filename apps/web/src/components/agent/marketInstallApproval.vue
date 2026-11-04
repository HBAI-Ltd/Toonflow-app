<template>
  <el-card v-if="tool.status === 'running' && tool.question" class="marketInstallApproval" shadow="never">
    <strong>{{ tool.question.title }}</strong>
    <p>{{ tool.question.question }}</p>
    <el-button :disabled="!directory || submitted === tool.question.callId" @click="answer(false)">取消</el-button>
    <el-button type="primary" :disabled="!directory || submitted === tool.question.callId" @click="answer(true)">确认安装</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { AgentToolCall } from "@toonflow/server/agent/types";
import http from "@/lib/http";

const { tool, directory } = defineProps<{ tool: AgentToolCall; directory?: string }>();
const submitted = ref("");

async function answer(approved: boolean) {
  const callId = tool.question?.callId;
  if (!directory || tool.status !== "running" || !callId || submitted.value === callId) return;
  submitted.value = callId;
  try {
    await http({ method: "POST", url: "/api/agent/answer", data: { directory, callId, values: { approved } } });
  } catch (error) {
    if (submitted.value === callId) submitted.value = "";
    ElMessage.error(error instanceof Error ? error.message : "请求失败");
  }
}
</script>

<style scoped lang="scss">
.marketInstallApproval {
  p {
    margin: 8px 0 12px;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
}
</style>
