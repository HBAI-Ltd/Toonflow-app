<template>
  <div class="agentConversation" @keydown.esc="closeSummary">
    <div class="messageViewport">
      <div ref="list" class="messageList" role="region" aria-label="对话消息" tabindex="0" @scroll.passive="readFollowing">
        <template v-for="message in messages" :key="message.id">
          <agentMessageItem :message="message" :locked="locked" :editing="editingId === message.id" @edit="emit('edit', $event)" @branch="emit('branch', $event)" @remove="emit('remove', $event)" @cancelEdit="emit('cancelEdit')" />
          <el-popover v-if="summary && message.id === summaryThrough" v-model:visible="summaryOpen" trigger="click" placement="top" :width="320" :showArrow="false" popperClass="agentSummaryPopover">
            <template #reference>
              <button type="button" class="compactedMark" aria-label="以上对话已压缩，查看记忆摘要" title="查看记忆摘要"><icon-arrows-minimize :size="12" /><span>以上对话已压缩</span></button>
            </template>
            <p class="agentSummaryText">{{ summary }}</p>
          </el-popover>
        </template>
        <p v-if="previewing" class="previewNotice">场景中正显示创作草稿，完成后正式应用。</p>
      </div>
    </div>
    <el-button v-if="messages.length && !following" class="scrollBottom" circle aria-label="回到最新消息" title="回到最新消息" @click="scrollToLatest(true)">
      <icon-arrow-down :size="18" />
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElButton, ElPopover } from "element-plus";
import { IconArrowDown, IconArrowsMinimize } from "@tabler/icons-vue";
import type { AgentMessage } from "./agentConversation";
import { useAgentFollow } from "./agentConversation/useAgentFollow";
import agentMessageItem from "./agentConversation/agentMessageItem.vue";

/** summaryThrough 及之前的消息已压缩进 summary：在那条消息后面画一条分隔，点开可看摘要。 */
const props = defineProps<{ messages: AgentMessage[]; previewing?: boolean; summary?: string; summaryThrough?: string; locked?: boolean; editingId?: string }>();
const emit = defineEmits<{ edit: [message: AgentMessage]; branch: [message: AgentMessage]; remove: [message: AgentMessage]; cancelEdit: [] }>();
const { list, following, readFollowing, scrollToLatest } = useAgentFollow(() => props.messages);
const summaryOpen = ref(false);
// 摘要弹层开着时，Esc 只关弹层，不把整个对话面板也收起来。
function closeSummary(event: KeyboardEvent) {
  if (!summaryOpen.value) return;
  event.stopPropagation();
  event.preventDefault();
  summaryOpen.value = false;
}
</script>

<style scoped lang="scss">
.agentConversation {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: var(--agentConversationMax, min(420px, max(0px, calc(100dvh - 280px - var(--performanceBottom)))));
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;

  .messageViewport { display: flex; flex: 1; min-height: 0; }
  .messageList {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px 4px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color) transparent;
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }
  .compactedMark {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin: 0 0 16px;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: var(--el-text-color-secondary);
    font: inherit;
    font-size: 11px;
    cursor: pointer;
    &::before, &::after { content: ""; flex: 1; height: 1px; background: var(--el-border-color-lighter); }
    &:hover { color: var(--el-color-primary); }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
    svg { flex-shrink: 0; }
  }
  .scrollBottom { position: absolute; right: 12px; bottom: 10px; z-index: 1; }
  .previewNotice { margin: 8px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.6; }
}
</style>

<style lang="scss">
.agentSummaryPopover .agentSummaryText { max-height: 280px; margin: 0; overflow-y: auto; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
