<template>
  <article class="messageItem" :class="{ userMessage: message.role === 'user', editing }" :aria-label="message.role === 'user' ? '我的消息' : '助手回复'">
    <template v-if="message.role === 'user'">
      <span v-if="message.delivery === 'steer'" class="steeringLabel" title="当前任务的补充引导，已完成的操作不会撤销"><icon-corner-down-right :size="13" aria-hidden="true" />引导</span>
      <div v-if="message.images?.length" class="userImages">
        <img v-for="(image, index) in message.images" :key="`${message.id}:${index}`" :src="image.dataUrl" :alt="image.name" :title="image.name" />
      </div>
      <div v-if="message.attachments?.length" class="userFiles">
        <span v-for="file in message.attachments" :key="file.name" class="userFile" :title="file.name"><icon-file-text :size="13" aria-hidden="true" /><span>{{ file.name }}</span></span>
      </div>
      <div v-if="message.content" class="userContent">{{ message.content }}</div>
    </template>
    <template v-else>
      <div class="messageContent">
        <template v-for="part in message.parts" :key="part.id">
          <agentThinking v-if="part.type === 'thinking' && part.content" :part="part" :collapsed="part.collapsed ?? true" @update:collapsed="part.collapsed = $event" />
          <agentQuestionCard v-else-if="part.type === 'tool' && (part.tool.question || part.tool.name === 'askUser')" :tool="part.tool" />
          <agentToolCall v-else-if="part.type === 'tool'" :tool="part.tool" :collapsed="part.collapsed ?? true" @update:collapsed="part.collapsed = $event" />
          <agentMarkdown v-else-if="part.type === 'text' && part.content" :content="part.content" :streaming="!!message.streaming" />
        </template>
        <agentMarkdown v-if="!message.parts?.length && message.content" :content="message.content" :streaming="!!message.streaming" />
        <agentViews v-if="message.views?.length" :views="message.views" />
        <p v-for="warning in message.warnings ?? []" :key="warning" class="messageWarning" role="status">{{ warning }}</p>
        <span v-if="message.streaming" class="replyPending" role="status">{{ message.statusText || "正在处理…" }}</span>
        <div v-if="message.error" class="messageError" role="alert">{{ message.error }}</div>
      </div>
    </template>
    <div v-if="!message.streaming" class="messageActions" :class="{ userMessage: message.role === 'user' }">
      <template v-if="editing">
        <el-button text size="small" @click="emit('cancelEdit')"><icon-x :size="14" />取消</el-button>
        <span class="editingHint">正在下方编辑</span>
      </template>
      <template v-else>
        <el-button v-if="plainText" class="messageAction" text circle :aria-label="copied ? '已复制消息' : '复制消息'" :title="copied ? '已复制' : '复制消息'" @click="copyMessage">
          <icon-check v-if="copied" :size="14" />
          <icon-copy v-else :size="14" />
        </el-button>
        <el-button v-if="message.role === 'user'" class="messageAction" text circle :disabled="locked" aria-label="编辑消息" title="编辑后重新发送" @click="emit('edit', message)"><icon-pencil :size="14" /></el-button>
        <el-button class="messageAction" text circle :disabled="locked" aria-label="从此消息创建分支" title="从此消息创建分支" @click="emit('branch', message)"><icon-arrow-fork :size="14" style="transform: rotate(90deg)" aria-hidden="true" /></el-button>
        <el-button class="messageAction" text circle :disabled="locked" aria-label="删除消息" :title="message.role === 'user' ? '删除这条消息和它的回复' : '删除消息'" @click="emit('remove', message)"><icon-trash :size="14" /></el-button>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { ElButton } from "element-plus";
import { IconArrowFork, IconCheck, IconCopy, IconCornerDownRight, IconFileText, IconPencil, IconTrash, IconX } from "@tabler/icons-vue";
import { agentMessageText, type AgentMessage } from "../agentConversation";
import { copyText } from "./useClipboard";
import agentMarkdown from "./agentMarkdown.vue";
import agentQuestionCard from "./agentQuestionCard.vue";
import agentThinking from "./agentThinking.vue";
import agentToolCall from "./agentToolCall.vue";
import agentViews from "./agentViews.vue";

/** 与宿主消息操作同构：复制、编辑重发（用户消息）、从此处分支、删除；生成中（locked）不能改动对话。 */
const props = defineProps<{ message: AgentMessage; locked?: boolean; editing?: boolean }>();
const emit = defineEmits<{ edit: [message: AgentMessage]; branch: [message: AgentMessage]; remove: [message: AgentMessage]; cancelEdit: [] }>();
const plainText = computed(() => agentMessageText(props.message));
const copied = ref(false);
let copiedTimer = 0;

async function copyMessage() {
  if (!plainText.value || !(await copyText(plainText.value))) return;
  copied.value = true;
  window.clearTimeout(copiedTimer);
  copiedTimer = window.setTimeout(() => { copied.value = false; }, 1600);
}
onBeforeUnmount(() => window.clearTimeout(copiedTimer));
</script>

<style scoped lang="scss">
.messageItem {
  margin: 0 0 16px;
  overflow-wrap: anywhere;
  min-width: 0;

  &:last-child { margin-bottom: 0; }
  &.userMessage { display: flex; flex-direction: column; align-items: flex-end; }
  &.editing .userContent { outline: 1px dashed var(--el-color-primary); outline-offset: 2px; }

  .steeringLabel { display: inline-flex; align-items: center; gap: 3px; margin-bottom: 2px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; }
  .userImages { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; max-width: 80%; margin-bottom: 6px; }
  .userImages img { display: block; width: 64px; height: 56px; border-radius: var(--ui-radius); background: var(--el-fill-color-light); object-fit: cover; }
  .userFiles { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; max-width: 80%; margin-bottom: 6px; }
  .userFile { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; padding: 2px 7px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; color: var(--el-text-color-regular); font-size: 11px; line-height: 18px; > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } > svg { flex-shrink: 0; } }
  .userContent { max-width: 80%; padding: 6px 10px; border-radius: var(--el-border-radius-base); background: color-mix(in srgb, var(--el-text-color-secondary) 12%, var(--el-bg-color)); color: var(--el-text-color-primary); font-size: 13px; line-height: 1.6; white-space: pre-wrap; }

  .messageContent { display: flex; flex-direction: column; gap: 4px; min-width: 0; color: var(--el-text-color-primary); font-size: 13px; line-height: 1.6; }
  .replyPending { color: var(--el-text-color-secondary); font-size: 12px; line-height: 20px; }
  .messageWarning { margin: 2px 0; color: var(--el-color-warning); font-size: 12px; line-height: 1.6; }
  .messageError { margin-top: 8px; color: var(--el-color-danger); font-size: 12px; line-height: 1.6; white-space: pre-wrap; }

  .messageActions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    &.userMessage { justify-content: flex-end; }
    .el-button { margin: 0; }
    .messageAction { width: 24px; height: 24px; padding: 0; color: var(--el-text-color-secondary); }
    .editingHint { color: var(--el-text-color-secondary); font-size: 11px; }
  }
}

@media (hover: hover) {
  .messageItem:not(:hover):not(:has(:focus-visible)):not(.editing) .messageActions { opacity: 0; pointer-events: none; }
}
</style>
