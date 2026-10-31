<template>
  <div class="messageViewport t-chat t-chat--normal">
    <div ref="messageList" class="messageList t-chat__list" role="region" aria-label="对话消息" tabindex="0">
      <chat-item v-if="!messages.length && !disabled" role="assistant" variant="text">
        <template #content>
          <section class="welcomeMessage" aria-label="开始新对话">
            <div class="welcomeHeader">
              <span class="welcomeIcon" aria-hidden="true"><span class="welcomeLogo" :style="{ maskImage: `url(${logoUrl})` }" /></span>
              <div>
                <p class="welcomeLabel">你好，我是 Toonflow 助手</p>
                <h3>从一个想法开始</h3>
              </div>
            </div>
            <p class="welcomeDescription">聊聊你的故事、画面或镜头，让我们一起把想法落到画布上。</p>
            <div class="welcomeSuggestions">
              <el-button v-for="item in welcomeSuggestions" :key="item.label" class="welcomeSuggestion" text bg :disabled="locked" :aria-label="`填入提示：${item.label}`" @click="emit('fillPrompt', item.prompt)">
                <component :is="item.icon" :size="19" aria-hidden="true" />
                <span class="suggestionContent"><strong>{{ item.label }}</strong><span>{{ item.description }}</span></span>
                <icon-arrow-up-right class="suggestionArrow" :size="15" aria-hidden="true" />
              </el-button>
            </div>
            <p class="welcomeHint">点击填入提示，也可以直接输入，或添加图片、视频和文档。</p>
          </section>
        </template>
      </chat-item>
      <div class="messageSpace" :style="{ height: `${messageVirtualizer.getTotalSize()}px` }">
        <div
          v-for="{ item, row } in visibleMessages"
          :key="item.id"
          :ref="measureMessage"
          :data-index="row.index"
          :data-message-id="item.id"
          :data-live-message="item.streaming || item.id === browserMessages.liveMessageId || undefined"
          class="messageRow"
          :style="{ transform: `translateY(${row.start}px)` }"
          :class="{ userMessage: item.role === 'user', editingMessage: editingId === item.id }">
          <chat-item :role="item.role" :variant="item.role === 'user' ? 'base' : 'text'" :textLoading="!!item.streaming && !compacting && !item.parts?.some(part => part.type === 'tool' || part.content)" animation="moving" @vue:updated="measureMessage($event.el?.parentElement ?? null)">
            <template #content>
              <div class="messageContent">
                <span v-if="item.role === 'user' && item.delivery?.mode === 'steer'" class="steeringLabel" title="当前任务的补充引导，已完成的操作不会撤销"><icon-corner-down-right :size="14" aria-hidden="true" />引导</span>
                <div v-if="item.report" class="reportHeader"><icon-users-group :size="14" />{{ item.report.name }} 上报</div>
                <div v-if="item.agentMessage" class="reportHeader"><icon-users-group :size="14" />来自 {{ item.agentMessage.fromName }} 的消息</div>
                <template v-for="part in item.parts" :key="part.id">
                  <chat-reasoning v-if="part.type === 'thinking' && part.content" class="messageReasoning" :collapsed="part.collapsed ?? true" expandIconPlacement="left" @update:collapsed="part.collapsed = $event">
                    <template #expandIcon><component :is="(part.collapsed ?? true) ? IconChevronRight : IconChevronDown" :size="14" aria-hidden="true" /></template>
                    <template #header>
                      <span class="reasoningHeader">
                        <icon-atom :size="14" />
                        <span>思考</span>
                        <span v-if="part.duration !== undefined" class="thinkingDuration">{{ part.duration.toFixed(1) }} 秒</span>
                      </span>
                    </template>
                    <messageMarkdown v-if="!(part.collapsed ?? true)" :content="part.content" :streaming="!!item.streaming" :directory="directory" />
                  </chat-reasoning>
                  <toolMessage v-else-if="part.type === 'tool' && !isBrowserTool(part.tool)" v-model:collapsed="part.collapsed" :tool="part.tool" :directory="directory" @copy="emit('copy', $event)" />
                  <messageMarkdown v-else-if="part.type === 'text' && part.content" :content="part.content" :streaming="!!item.streaming" :directory="directory" />
                </template>
                <attachmentList v-if="item.attachments?.length" :attachments="item.attachments" :directory="directory" />
                <div v-if="item.role === 'user'" class="messageText"><mentionContent :content="item.content" :mentions="item.mentions" :directory="directory" /></div>
                <div v-if="item.error" class="messageError" role="alert">{{ item.error }}</div>
              </div>
            </template>
          </chat-item>
          <div v-if="!item.streaming" class="messageActions">
            <template v-if="editingId === item.id">
              <el-button text size="small" :disabled="busy || deletingId !== undefined || voiceActive" @click="emit('cancelEdit')"><icon-x :size="14" />取消</el-button>
              <span class="editingHint">正在下方编辑</span>
            </template>
            <template v-else>
              <el-button v-if="item.content" class="messageAction" text circle aria-label="复制消息" title="复制消息" @click="emit('copy', mentionPlainText(item.content, item.mentions))"><icon-copy :size="14" /></el-button>
              <template v-if="item.role === 'user'">
                <el-button class="messageAction" text circle :disabled="locked || remoteRunning" aria-label="编辑消息" title="编辑消息" @click="emit('edit', item)"><icon-pencil :size="14" /></el-button>
              </template>
              <el-button v-if="!item.report && !item.agentMessage" class="messageAction" text circle :loading="branchingId === item.id" :disabled="locked || remoteRunning || !(item.entryId || item.replyTo)" aria-label="从此消息创建分支" title="从此消息创建分支" @click="emit('branch', item)"><icon-arrow-fork v-if="branchingId !== item.id" :size="14" style="transform: rotate(90deg)" aria-hidden="true" /></el-button>
              <el-button v-if="!item.report && !item.agentMessage" class="messageAction" text circle :loading="deletingId === item.id" :disabled="locked || remoteRunning" aria-label="删除消息" title="删除消息" @click="emit('delete', item)"><icon-trash v-if="deletingId !== item.id" :size="14" /></el-button>
            </template>
          </div>
          <browserPanel v-if="browserMessages.tools.has(item.id)" class="browserPreview" :tools="browserMessages.tools.get(item.id)!" :directory="directory" :active="active" :live="item.id === browserMessages.liveMessageId" />
        </div>
      </div>
    </div>
    <el-button v-if="messages.length && !atLatestMessage" class="scrollBottom" circle aria-label="回到最新消息" title="回到最新消息" @click="messageVirtualizer.scrollToEnd()"><icon-arrow-down :size="18" /></el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUpdated, ref, watch, type ComponentPublicInstance } from "vue";
import { defaultRangeExtractor, observeElementRect, useVirtualizer } from "@tanstack/vue-virtual";
import { IconArrowDown, IconArrowFork, IconArrowUpRight, IconAtom, IconChevronDown, IconChevronRight, IconCopy, IconCornerDownRight, IconMovie, IconPencil, IconPhoto, IconTrash, IconUsersGroup, IconVector, IconX } from "@tabler/icons-vue";
import logoUrl from "@toonflow/assets/logo.svg";
import browserPanel from "@toonflow/tool-browser/panel";
import { isBrowserTool } from "@toonflow/tool-browser/client";
import type { AgentToolCall } from "@toonflow/server/agent/types";
import chatItem from "@tdesign-vue-next/chat/es/chat-item";
import chatReasoning from "@tdesign-vue-next/chat/es/chat-reasoning";
import messageMarkdown from "@/components/messageMarkdown.vue";
import attachmentList from "../attachmentList.vue";
import mentionContent from "../mentionContent.vue";
import { mentionPlainText } from "../mentionText";
import toolMessage from "../toolMessage.vue";
import type { AgentMessage } from "../types";
import "tdesign-vue-next/es/style/index.css";
import "@tdesign-vue-next/chat/es/style/index.css";

const props = defineProps<{ messages: AgentMessage[]; directory?: string; active: boolean; disabled: boolean; locked: boolean; busy: boolean; remoteRunning: boolean; compacting: boolean; editingId?: string; deletingId?: string; branchingId?: string; voiceActive: boolean }>();
const emit = defineEmits<{ fillPrompt: [prompt: string]; copy: [content: string]; edit: [message: AgentMessage]; branch: [message: AgentMessage]; delete: [message: AgentMessage]; cancelEdit: [] }>();
const browserMessages = computed(() => {
  const groups = new Map<string, { id: string; tools: AgentToolCall[] }>();
  const taskIds = new Map<string, string>();
  let turnId: string | undefined;
  let liveMessageId: string | undefined;
  for (const message of props.messages) {
    if (message.role === "user") {
      const userId = message.entryId ?? message.id;
      const taskId = message.delivery?.taskMessageId ?? userId;
      taskIds.set(userId, taskId);
      if (taskId !== turnId) {
        turnId = taskId;
        liveMessageId = undefined;
      }
      continue;
    }
    const taskId = message.delivery?.taskMessageId ?? (message.replyTo ? taskIds.get(message.replyTo) ?? message.replyTo : undefined);
    if (taskId && taskId !== turnId) {
      turnId = taskId;
      liveMessageId = undefined;
    }
    const tools = message.parts?.flatMap(part => part.type === "tool" && isBrowserTool(part.tool) ? [part.tool] : []);
    if (!tools?.length) continue;
    const replyId = turnId ?? message.id;
    let group = groups.get(replyId);
    if (!group) { group = { id: message.id, tools: [] }; groups.set(replyId, group); }
    group.tools.push(...tools);
    liveMessageId = group.id;
  }
  return { tools: new Map([...groups.values()].map(group => [group.id, group.tools])), liveMessageId };
});
// 同轮浏览器调用共用该轮首条浏览器消息底部的画面，原始工具记录仍完整保留。
const displayedMessages = computed(() => props.messages.filter(message => browserMessages.value.tools.has(message.id) || message.role === "user" || message.error || message.report || message.agentMessage || message.attachments?.length ||
  !message.parts?.length || message.parts.some(part => part.type !== "tool" || !isBrowserTool(part.tool))));
const messageList = ref<HTMLDivElement>();
const atLatestMessage = ref(true);
let messageListInitialized = false;
let messageScrollOffset = 0;
const messageKeys = computed(() => displayedMessages.value.map(item => item.id));
// ACT: 只常驻当前轮的实时画面，历史浏览器消息仍按需挂载，避免长对话累积连接和 DOM。
const retainedMessages = computed(() => displayedMessages.value.flatMap((item, index) => item.streaming || item.id === props.editingId || item.id === browserMessages.value.liveMessageId ? [index] : []));
const messageVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(computed(() => {
  const keys = messageKeys.value;
  const retained = retainedMessages.value;
  return {
    count: keys.length,
    getScrollElement: () => messageList.value ?? null,
    getItemKey: (index: number) => keys[index]!,
    estimateSize: () => 240,
    overscan: 3,
    paddingStart: 12,
    anchorTo: "end" as const,
    followOnAppend: true,
    scrollEndThreshold: 48,
    measureElement: (element, _entry, instance) => {
      const height = props.active ? element.offsetHeight : 0;
      if (height) return height;
      // active 先于祖先 v-show 恢复；隐藏时不能把零高度写入缓存。
      const index = instance.indexFromElement(element);
      return instance.itemSizeCache.get(instance.options.getItemKey(index)) ?? instance.options.estimateSize(index);
    },
    // ACT: v-show 隐藏时保留视口与行高，避免零尺寸清空正在输入的工具表单。
    observeElementRect: (instance, onChange) => observeElementRect(instance, rect => { if (rect.height) onChange(rect); }),
    rangeExtractor: range => [...new Set([...defaultRangeExtractor(range), ...retained])].sort((left, right) => left - right),
    onChange(instance) {
      if (!messageListInitialized || !props.active || !messageList.value?.clientHeight) return;
      atLatestMessage.value = instance.isAtEnd();
      messageScrollOffset = instance.scrollOffset ?? 0;
    },
  };
}));
const visibleMessages = computed(() => messageVirtualizer.value.getVirtualItems().map(row => ({ row, item: displayedMessages.value[row.index]! })));
// Vue 适配层未在尺寸更新后调用此钩子；占位高度提交后补偿被浏览器截断的滚动。
onUpdated(() => messageVirtualizer.value._willUpdate());
let messageMeasurePending = false;

function measureMessage(element: Element | ComponentPublicInstance | null) {
  const instance = messageVirtualizer.value;
  if (!(element instanceof HTMLDivElement) || !props.active || !element.offsetHeight || !atLatestMessage.value || !element.dataset.liveMessage) {
    instance.measureElement(element instanceof HTMLDivElement ? element : null);
    return;
  }
  const index = instance.indexFromElement(element);
  const height = element.offsetHeight;
  const changed = instance.itemSizeCache.get(instance.options.getItemKey(index)) !== height;
  instance.measureElement(element);
  // 滚动期间库可能跳过同步测量；在本次 DOM 提交内校正，避免画面随换行先下移再被拉回。
  instance.resizeItem(index, height);
  if (!changed || messageMeasurePending) return;
  messageMeasurePending = true;
  void nextTick(() => {
    messageMeasurePending = false;
    if (props.active && atLatestMessage.value) instance.scrollToEnd();
  });
}

watch([() => props.active, messageList], async ([active, element]) => {
  if (!active || !element) return;
  await nextTick();
  if (!props.active) return;
  if (!messageListInitialized || atLatestMessage.value) messageVirtualizer.value.scrollToEnd();
  else messageVirtualizer.value.scrollToOffset(messageScrollOffset);
  messageListInitialized = true;
}, { immediate: true, flush: "post" });
const welcomeSuggestions = [
  { label: "搭建创作画布", description: "把创意串成清晰的节点流程", icon: IconVector, prompt: "帮我搭建一个创作画布，先和我确认需要的节点与流程。" },
  { label: "梳理故事分镜", description: "拆解故事，安排画面与镜头", icon: IconMovie, prompt: "帮我把故事整理成分镜，先和我确认故事内容、时长和画面风格。" },
  { label: "生成图片素材", description: "为角色和场景寻找视觉方向", icon: IconPhoto, prompt: "帮我生成图片素材，先和我确认画面内容、风格和使用的模型。" },
];
</script>

<style lang="scss">
.agentConversation {
  .messageViewport {
    flex: 1;
    min-height: 0;

    .messageList {
      overflow-anchor: none;
      scrollbar-gutter: stable;
    }

    .messageSpace {
      position: relative;
      width: 100%;
    }

    .scrollBottom {
      position: absolute;
      right: 16px;
      bottom: 12px;
      z-index: 1;
    }

    .welcomeMessage {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 28px 16px 16px;
      color: var(--el-text-color-primary);

      .welcomeHeader {
        display: flex;
        align-items: center;
        gap: 12px;

        .welcomeIcon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: var(--ui-radius-large);
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);

          .welcomeLogo {
            width: 28px;
            height: 28px;
            background: currentColor;
            mask-size: contain;
            mask-position: center;
            mask-repeat: no-repeat;
          }
        }

        .welcomeLabel { margin: 0 0 4px; font-size: 12px; color: var(--el-text-color-secondary); }
        h3 { margin: 0; font-size: 18px; font-weight: 600; line-height: 1.4; }
      }

      .welcomeDescription { margin: 0; font-size: 13px; line-height: 1.7; color: var(--el-text-color-regular); }

      .welcomeSuggestions {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .welcomeSuggestion {
          height: auto;
          margin: 0;
          padding: 12px;
          text-align: left;
          white-space: normal;
          line-height: 1.5;

          > span { display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0; }
          svg { flex-shrink: 0; color: var(--el-text-color-secondary); }
          .suggestionContent {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            strong { font-size: 13px; font-weight: 500; }
            span { font-size: 12px; color: var(--el-text-color-secondary); }
          }
          .suggestionArrow { color: var(--el-text-color-placeholder); }
        }
      }

      .welcomeHint { margin: 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }
    }

    .messageRow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0 12px 12px;

      @media (hover: hover) {
        &:not(:hover):not(:has(:focus-visible)) {
          .messageActions {
            opacity: 0;
            pointer-events: none;
          }
        }
      }

      .messageActions {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;

        .el-button {
          margin: 0;

          .tabler-icon {
            flex-shrink: 0;
          }
        }

        .messageAction {
          width: 24px;
          height: 24px;
          padding: 0;
          color: var(--el-text-color-secondary);
        }
      }

      .browserPreview { margin-top: 6px; }

      &.userMessage .messageActions {
        justify-content: flex-end;
      }

      &.editingMessage .t-chat__inner.user .t-chat__content .t-chat__detail {
        width: 100%;
        max-width: 100%;
        padding: 0;
        background: transparent;
      }
    }

    .t-chat__inner {
      margin-bottom: 0;

      .t-chat__content {
        min-width: 0;
        padding-top: 0;

        .t-chat__detail {
          width: 100%;
          max-width: 100%;
          padding: 0;
        }
      }

      &.user .t-chat__content .t-chat__detail {
        width: auto;
        max-width: 80%;
        padding: 6px 10px;
        border-radius: calc(var(--ui-radius) * 1.25);
        background: color-mix(in srgb, var(--el-text-color-secondary) 12%, var(--el-bg-color));
      }
    }

    .messageContent {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--el-text-color-primary);

      .steeringLabel {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        align-self: flex-start;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 18px;
      }

      .messageReasoning {
        padding-top: 0;

        .t-collapse-panel__wrapper {
          background: transparent;

          .t-collapse-panel__header {
            padding: 2px 0;
            font-size: 13px;
            line-height: 20px;
          }

          .t-collapse-panel__icon {
            width: 16px;
            height: 20px;
            margin-right: 6px;
            color: var(--el-text-color-secondary);
          }

          .t-collapse-panel__body {
            background: transparent;

            .t-collapse-panel__content {
              padding: 4px 0 4px 22px;
              background: transparent;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }

      .reasoningHeader {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-secondary);

        .thinkingDuration {
          font-variant-numeric: tabular-nums;
        }
      }

      .messageText {
        white-space: pre-wrap;
        font-size: 13px;
        line-height: 1.6;
      }

      .messageError {
        color: var(--el-color-danger);
        font-size: 12px;
      }

      .reportHeader {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }

      .messageMarkdown {
        display: block;
        min-width: 0;
        max-width: 100%;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}
</style>
