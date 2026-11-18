<template>
  <details class="toolCall" :open="!collapsed" @toggle="syncOpen">
    <summary class="toolHeader" :data-status="tool.status">
      <icon-chevron-right class="toolChevron" :size="14" aria-hidden="true" />
      <icon-tool :size="14" aria-hidden="true" />
      <span class="toolName" :title="tool.name">{{ tool.label || tool.name || "工具调用" }}</span>
      <span class="toolState">{{ agentToolStatusLabels[tool.status] }}</span>
    </summary>
    <div v-if="!collapsed" class="toolDetails">
      <template v-if="argsText">
        <span class="toolLabel">
          参数
          <el-button text size="small" :icon="IconCopy" aria-label="复制工具参数" title="复制工具参数" @click="copy(argsText)" />
        </span>
        <pre class="toolData" tabindex="0" aria-label="工具参数">{{ argsText }}</pre>
      </template>
      <template v-if="resultText">
        <span class="toolLabel">
          结果
          <el-button text size="small" :icon="IconCopy" aria-label="复制工具结果" title="复制工具结果" @click="copy(resultText)" />
        </span>
        <p v-if="tool.error && !resultText.includes(tool.error)" class="toolErrorText">{{ tool.error }}</p>
        <pre class="toolData" :class="{ toolError: tool.status === 'error' }" tabindex="0" aria-label="工具结果">{{ resultText }}</pre>
      </template>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton } from "element-plus";
import { IconChevronRight, IconCopy, IconTool } from "@tabler/icons-vue";
import { agentToolStatusLabels, type AgentToolCall } from "../agentConversation";
import { copyText } from "./useClipboard";

const props = defineProps<{ tool: AgentToolCall }>();
const collapsed = defineModel<boolean>("collapsed", { default: true });

function format(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  let text: string;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    text = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2) ?? "";
  } catch {
    text = String(value);
  }
  return text.length > 12_000 ? `${text.slice(0, 12_000)}…` : text;
}

const argsText = computed(() => format(props.tool.args));
const resultText = computed(() => format(props.tool.result) || (props.tool.error ? format(props.tool.error) : ""));
function copy(text: string) { void copyText(text); }
function syncOpen(event: Event) {
  const open = (event.target as HTMLDetailsElement).open;
  if (collapsed.value === open) collapsed.value = !open;
}
</script>

<style scoped lang="scss">
.toolCall {
  min-width: 0;
  margin: 6px 0;

  summary { list-style: none; &::-webkit-details-marker { display: none; } }

  .toolHeader {
    display: flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    max-width: 100%;
    min-width: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
    cursor: pointer;
    user-select: none;

    .toolChevron { flex-shrink: 0; transition: transform 120ms ease; }
    .toolName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .toolState { flex-shrink: 0; }
    &[data-status="error"] .toolState { color: var(--el-color-danger); }
    &[data-status="interrupted"] .toolState { color: var(--el-color-warning); }
  }

  &[open] .toolHeader { margin-bottom: 6px; }
  &[open] .toolChevron { transform: rotate(90deg); }

  .toolDetails {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding-left: 20px;

    .toolLabel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      :deep(.el-button) { height: 20px; padding: 0 3px; }
    }

    .toolErrorText { margin: 0 0 4px; color: var(--el-color-danger); font-size: 12px; line-height: 1.6; white-space: pre-wrap; }

    .toolData {
      max-height: 240px;
      margin: 0 0 6px;
      padding: 12px;
      overflow: auto;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--ui-radius);
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre;
      overflow-wrap: normal;
      overscroll-behavior: contain;
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      &.toolError { border-color: var(--el-color-danger-light-5); color: var(--el-color-danger); }
    }
  }
}

@media (prefers-reduced-motion: reduce) { .toolChevron { transition: none; } }
</style>
