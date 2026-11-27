<template>
  <section class="planReview" aria-label="计划评审">
    <header><icon-list-check :size="16" aria-hidden="true" /><strong>计划评审</strong></header>
    <div class="planBody" tabindex="0"><messageMarkdown :content="question.question" :directory="directory" /></div>
    <footer>
      <el-button text size="small" :disabled="submitted" @click="answer('discuss')">讨论</el-button>
      <el-button size="small" :disabled="submitted" @click="answer('reject')">继续规划</el-button>
      <el-button type="primary" size="small" :disabled="submitted" @click="answer('approve')">批准执行</el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { IconListCheck } from "@tabler/icons-vue";
import type { AgentToolCall } from "@toonflow/server/agent/types";
import messageMarkdown from "@/components/messageMarkdown.vue";
import http from "@/lib/http";

const props = defineProps<{ question: NonNullable<AgentToolCall["question"]>; directory: string }>();
const emit = defineEmits<{ answered: [callId: string] }>();
const submitted = ref(false);
async function answer(decision: "approve" | "reject" | "discuss") {
  if (submitted.value) return;
  submitted.value = true;
  try {
    await http({ method: "POST", url: "/api/agent/answer", data: { directory: props.directory, callId: props.question.callId,
      ...(decision === "discuss" ? { cancelled: true } : { values: { decision } }) } });
    emit("answered", props.question.callId);
  } catch (error) {
    submitted.value = false;
    ElMessage.error(error instanceof Error ? error.message : "请求失败");
  }
}
</script>

<style scoped lang="scss">
.planReview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 55%;
  margin: 0 12px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  header, footer { display: flex; flex-shrink: 0; align-items: center; gap: 7px; padding: 9px 12px; }
  header { color: var(--el-text-color-regular); border-bottom: 1px solid var(--el-border-color-lighter); font-size: 13px; }
  .planBody { min-height: 0; overflow: auto; padding: 4px 12px; }
  footer { justify-content: flex-end; border-top: 1px solid var(--el-border-color-lighter); .el-button { margin: 0; } }
}
</style>
