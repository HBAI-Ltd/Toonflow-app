<template>
  <section class="agentQuestionCard" role="group" :aria-label="title" @keydown.stop @keyup.stop>
    <header class="questionHeader">
      <icon-message-question :size="16" aria-hidden="true" />
      <span class="questionTitle">{{ title }}</span>
      <el-tag size="small" :type="answered && !skipped ? 'success' : 'info'" disable-transitions>{{ statusText }}</el-tag>
    </header>
    <p v-if="questionText" class="questionText">{{ questionText }}</p>
    <form v-if="waiting" class="questionForm" @submit.prevent="submit(false)">
      <template v-if="fields.length">
        <label v-for="field in fields" :key="field.field" class="questionField">
          <span class="fieldTitle">{{ field.title }}<em v-if="field.required" aria-hidden="true">*</em></span>
          <el-radio-group v-if="field.type === 'radio'" v-model="values[field.field]" :disabled="submitting">
            <el-radio v-for="option in field.options ?? []" :key="option" :value="option" border size="small">{{ option }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="values[field.field]" :disabled="submitting">
            <el-checkbox v-for="option in field.options ?? []" :key="option" :value="option" border size="small">{{ option }}</el-checkbox>
          </el-checkbox-group>
          <el-select v-else-if="field.type === 'select'" v-model="values[field.field]" clearable size="small" :teleported="false" :placeholder="field.placeholder || '请选择'" :disabled="submitting">
            <el-option v-for="option in field.options ?? []" :key="option" :label="option" :value="option" />
          </el-select>
          <el-input-number v-else-if="field.type === 'inputNumber'" v-model="values[field.field]" size="small" controlsPosition="right" :disabled="submitting" />
          <el-switch v-else-if="field.type === 'switch'" v-model="values[field.field]" :disabled="submitting" />
          <el-input v-else v-model="values[field.field]" size="small" :type="field.type === 'textarea' ? 'textarea' : 'text'" :autosize="field.type === 'textarea' ? { minRows: 2, maxRows: 5 } : undefined" :maxlength="8000" :placeholder="field.placeholder" :disabled="submitting" />
        </label>
      </template>
      <template v-else>
        <el-radio-group v-if="options.length" v-model="selected" class="questionOptions" :disabled="submitting" :aria-label="questionText">
          <el-radio v-for="option in options" :key="option" :value="option" border size="small">{{ option }}</el-radio>
          <el-radio value="" border size="small">自行填写</el-radio>
        </el-radio-group>
        <el-input v-model="text" type="textarea" size="small" :autosize="{ minRows: 1, maxRows: 5 }" :maxlength="8000" :disabled="submitting" :placeholder="options.length ? '也可以直接回答或补充说明' : '输入你的回答'" aria-label="回答问题" @keydown.enter.exact.prevent="submit(false)" />
      </template>
      <p v-if="error" class="questionError" role="alert">{{ error }}</p>
      <div class="questionActions">
        <el-button type="primary" size="small" nativeType="submit" :loading="submitting" :disabled="!canSubmit">提交回答</el-button>
        <el-button size="small" :disabled="submitting" @click="submit(true)">跳过</el-button>
      </div>
    </form>
    <p v-else-if="answerText" class="answerText">{{ answerText }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElButton, ElCheckbox, ElCheckboxGroup, ElInput, ElInputNumber, ElOption, ElRadio, ElRadioGroup, ElSelect, ElSwitch, ElTag } from "element-plus";
import { IconMessageQuestion } from "@tabler/icons-vue";
import { answerAgentQuestion, type AgentQuestionAnswer } from "../singleAgent";
import type { AgentToolCall } from "../agentConversation";

/**
 * 与宿主提问器（askUser）的提问卡同构：单选题给选项 + 自行填写，多个问题按字段出表单；提交回答或跳过。
 * 回答走宿主 /api/singleAgent/answer；模型拿到回答后这张卡变成“已回答”。
 */
const props = defineProps<{ tool: AgentToolCall }>();
const question = computed(() => props.tool.question);
// 存盘读回的工具参数是截短的 JSON 文字：能解析就用来显示标题和问题。
const args = computed(() => {
  const value = props.tool.args;
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") try { const parsed = JSON.parse(value); if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>; } catch { /* 截短的 JSON 读不出就不显示 */ }
  return {} as Record<string, unknown>;
});
const title = computed(() => question.value?.title || (typeof args.value.title === "string" ? args.value.title : "") || "请确认");
const questionText = computed(() => question.value?.question || (typeof args.value.question === "string" ? args.value.question : ""));
const options = computed(() => question.value?.options ?? []);
const fields = computed(() => question.value?.fields ?? []);
const selected = ref("");
const text = ref("");
// 表单值随字段类型变（文字、数字、开关、多选），模板里直接 v-model。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const values = reactive<Record<string, any>>({});
const submitting = ref(false);
const submitted = ref<{ answer: string; skipped: boolean }>();
const error = ref("");

watch(fields, items => {
  for (const field of items) if (!(field.field in values)) values[field.field] = field.type === "checkbox" ? [] : field.type === "switch" ? false : field.type === "inputNumber" ? undefined : "";
}, { immediate: true });

const result = computed(() => {
  if (props.tool.status !== "success" || !props.tool.result) return undefined;
  try {
    const value = JSON.parse(props.tool.result) as { answer?: unknown; skipped?: unknown };
    return { answer: typeof value.answer === "string" ? value.answer : "", skipped: value.skipped === true };
  } catch { return undefined; }
});
const waiting = computed(() => props.tool.status === "running" && !!question.value && !submitted.value);
const answered = computed(() => !!(result.value || submitted.value));
const skipped = computed(() => (result.value ?? submitted.value)?.skipped ?? false);
const answerText = computed(() => skipped.value ? "已跳过" : (result.value ?? submitted.value)?.answer ?? "");
const statusText = computed(() => waiting.value ? "等你回答" : answered.value ? skipped.value ? "已跳过" : "已回答" : props.tool.status === "running" ? "准备中" : "已结束");
const draftAnswer = computed(() => [selected.value, text.value.trim()].filter(Boolean).join("\n"));
const missingRequired = computed(() => fields.value.some(field => {
  if (!field.required) return false;
  const value = values[field.field];
  return value === undefined || value === "" || Array.isArray(value) && !value.length;
}));
const canSubmit = computed(() => !!question.value && (fields.value.length ? !missingRequired.value : !!draftAnswer.value && draftAnswer.value.length <= 8000));

async function submit(skip: boolean) {
  const current = question.value;
  if (!current || submitting.value || !skip && !canSubmit.value) return;
  submitting.value = true;
  error.value = "";
  let body: AgentQuestionAnswer;
  if (skip) body = { skipped: true };
  else if (fields.value.length) body = { values: Object.fromEntries(fields.value.map(field => [field.field, values[field.field] === undefined || values[field.field] === "" ? null : values[field.field]!])) };
  else body = { answer: draftAnswer.value };
  try {
    await answerAgentQuestion(current, body);
    submitted.value = { answer: skip ? "" : body.answer ?? fields.value.flatMap(field => {
      const value = values[field.field];
      if (value === undefined || value === "" || Array.isArray(value) && !value.length) return [];
      return [`${field.title}：${Array.isArray(value) ? value.join("、") : typeof value === "boolean" ? value ? "是" : "否" : value}`];
    }).join("\n"), skipped: skip };
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : "提交失败，请重试";
  } finally { submitting.value = false; }
}
</script>

<style scoped lang="scss">
.agentQuestionCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 6px 0;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--ui-radius, 8px);
  background: var(--el-bg-color);

  .questionHeader { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--el-text-color-primary); font-size: 13px; font-weight: 500;
    > svg { flex-shrink: 0; color: var(--el-color-primary); }
    .questionTitle { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
  .questionText, .answerText { margin: 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.7; white-space: pre-wrap; }
  .answerText { color: var(--el-text-color-primary); }
  .questionForm { display: flex; flex-direction: column; gap: 8px; }
  .questionField { display: flex; flex-direction: column; gap: 4px; font-size: 12px; .fieldTitle { color: var(--el-text-color-regular); em { margin-left: 2px; color: var(--el-color-danger); font-style: normal; } } }
  .questionOptions, :deep(.el-radio-group), :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 6px; }
  :deep(.el-radio.is-bordered), :deep(.el-checkbox.is-bordered) { margin: 0; }
  .questionError { margin: 0; color: var(--el-color-danger); font-size: 12px; }
  .questionActions { display: flex; gap: 6px; :deep(.el-button + .el-button) { margin-left: 0; } }
}
</style>
