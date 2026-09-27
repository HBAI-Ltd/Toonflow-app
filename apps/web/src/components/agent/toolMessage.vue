<template>
  <component v-if="renderer" :is="renderer" :tool="tool" :directory="directory" @copy="emit('copy', $event)" />
  <el-text v-if="rendererError" type="danger">{{ t("toolInterfaceLoadFailed", { error: rendererError }) }}</el-text>
  <chat-reasoning v-model:collapsed="collapsed" class="messageReasoning toolCall" expandIconPlacement="left">
    <template #header>
      <span class="toolHeader" :data-status="tool.status">
        <icon-tool :size="14" />
        <span class="toolName">{{ renderer ? t("toolAction") : tool.name || t("toolCall") }}</span>
        <span class="toolState">{{ tool.name === 'subAgent' && tool.status === 'success' ? t("subAgentCallReturned") : toolStatusLabel(tool.status) }}</span>
      </span>
    </template>
    <div v-if="!collapsed" class="toolDetails">
      <template v-for="(data, index) in [args, result]" :key="index">
        <template v-if="data">
          <span class="toolLabel">
            {{ index === 0 ? t("parameters") : t("result") }}
            <el-button v-if="!data.markdown" text size="small" :icon="IconCopy" :aria-label="index === 0 ? t('copyToolParameters') : t('copyToolResult')" @click="emit('copy', data.content)" />
          </span>
          <messageMarkdown v-if="data.markdown" class="toolData" :class="{ toolError: index === 1 && tool.status === 'error' }" :content="data.markdown" :codeOptions="toolCodeOptions" />
          <pre v-else class="toolData toolPlain" :class="{ toolError: index === 1 && tool.status === 'error' }" tabindex="0" :aria-label="index === 0 ? t('toolParameters') : t('toolResult')">{{ data.content }}</pre>
        </template>
      </template>
    </div>
  </chat-reasoning>
</template>

<script setup lang="ts">
import { computed, onErrorCaptured, ref, shallowRef, watch, type Component } from "vue";
import { loadToolComponent } from "@toonflow/tools-scaffold/client";
import { createDisplayError, createTranslator, getErrorDisplay } from "@toonflow/i18n";
import { IconCopy, IconTool } from "@tabler/icons-vue";
import chatReasoning from "@tdesign-vue-next/chat/es/chat-reasoning";
import type { AgentToolCall } from "@toonflow/server/agent/types";
import messageMarkdown from "@/components/messageMarkdown.vue";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
const { tool, directory } = defineProps<{ tool: AgentToolCall; directory?: string }>();
const emit = defineEmits<{ copy: [content: string] }>();
const renderer = shallowRef<Component>();
const rendererFailure = shallowRef<unknown>();
const rendererError = computed(() => rendererFailure.value === undefined ? "" : getErrorDisplay(rendererFailure.value));
watch(() => [tool.name, tool.question?.callId] as const, async ([name], _previous, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  renderer.value = undefined;
  rendererFailure.value = undefined;
  if (name === "subAgent") return;
  try {
    const component = await loadToolComponent(name);
    if (active) {
      renderer.value = component;
      if (!component && tool.status === "running" && tool.question?.callId) {
        rendererFailure.value = createDisplayError("该工具未提供可用的交互组件", () => t("toolInteractiveComponentMissing"));
      }
    }
  } catch (error) {
    if (active) rendererFailure.value = error;
  }
}, { immediate: true });
onErrorCaptured(error => {
  if (!renderer.value) return;
  renderer.value = undefined;
  rendererFailure.value = error;
  return false;
});
const collapsed = ref(true);
const toolStatusKeys = { running: "toolStatusRunning", success: "toolStatusSuccess", error: "toolStatusError", interrupted: "toolStatusInterrupted" };
const toolStatusLabel = (status: keyof typeof toolStatusKeys) => t(toolStatusKeys[status]);
const toolCodeOptions = { maxHeight: 240, lineNumbers: false };
const args = computed(() => formatToolData(tool.args));
const result = computed(() => formatToolData(tool.result));

function formatToolData(value: unknown) {
  if (value === undefined) return;
  try {
    const content = JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2) ?? "";
    // ACT: 超过 16K 字符只渲染完整文本，限制高亮与 token DOM 开销；更大数据量可改为虚拟行。
    return { content, markdown: content.length <= 16_384 ? `~~~json\n${content}\n~~~` : undefined };
  } catch {
    return { content: String(value), markdown: undefined };
  }
}
</script>

<style scoped lang="scss">
.toolCall {
  min-width: 0;

  .toolHeader {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--el-text-color-secondary);

    .toolName {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toolState {
      flex-shrink: 0;
      font-size: 12px;
    }

    &[data-status="error"] .toolState { color: var(--el-color-danger); }
  }

  .toolDetails {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    font-size: 12px;

    .toolLabel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--el-text-color-secondary);
    }

    .toolData {
      margin: 0 0 6px;
      font-size: 12px;
      line-height: 1.5;

      :deep([data-stream-markdown="code-block"]) {
        margin: 0;
        border-radius: var(--ui-radius);
      }

      :deep([data-stream-markdown="code-block-content"]) {
        overscroll-behavior: contain;
        pre {
          white-space: pre;
          overflow-wrap: normal;
        }
      }

      &.toolError :deep([data-stream-markdown="code-block"]) { border-color: var(--el-color-danger-light-5); }

      &.toolPlain {
        min-width: 0;
        max-width: 100%;
        max-height: 240px;
        padding: 12px;
        overflow: auto;
        overscroll-behavior: contain;
        white-space: pre;
        overflow-wrap: normal;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        color: var(--el-text-color-primary);
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--ui-radius);

        &.toolError { border-color: var(--el-color-danger-light-5); }
      }
    }
  }
}
</style>
