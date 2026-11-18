<template>
  <details class="thinkingContent" :open="!collapsed" @toggle="syncOpen">
    <summary>
      <icon-chevron-right class="thinkingChevron" :size="14" aria-hidden="true" />
      <span>思考</span>
      <span v-if="part.duration !== undefined" class="thinkingDuration">· {{ part.duration.toFixed(1) }} 秒</span>
      <span v-else-if="part.streaming" class="thinkingDuration">中…</span>
    </summary>
    <agentMarkdown :content="part.content" :streaming="!!part.streaming" />
  </details>
</template>

<script setup lang="ts">
import { IconChevronRight } from "@tabler/icons-vue";
import type { AgentThinkingPart } from "../agentConversation";
import agentMarkdown from "./agentMarkdown.vue";

const props = defineProps<{ part: AgentThinkingPart }>();
const collapsed = defineModel<boolean>("collapsed", { default: true });

function syncOpen(event: Event) {
  const open = (event.target as HTMLDetailsElement).open;
  if (collapsed.value === open) collapsed.value = !open;
}
</script>

<style scoped lang="scss">
.thinkingContent {
  margin: 10px 0;
  min-width: 0;

  summary {
    display: flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
    cursor: pointer;
    user-select: none;
    &::-webkit-details-marker { display: none; }
  }

  &[open] summary { margin-bottom: 8px; }
  &[open] .thinkingChevron { transform: rotate(90deg); }
  .thinkingChevron { flex-shrink: 0; transition: transform 120ms ease; }
  .thinkingDuration { font-variant-numeric: tabular-nums; }
}

@media (prefers-reduced-motion: reduce) { .thinkingChevron { transition: none; } }
</style>
