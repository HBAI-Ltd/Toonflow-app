<template>
  <div class="agentConversation">
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
                <el-button v-for="item in welcomeSuggestions" :key="item.label" class="welcomeSuggestion" text bg :disabled="locked" :aria-label="`填入提示：${item.label}`" @click="fillPrompt(item.prompt)">
                  <component :is="item.icon" :size="19" aria-hidden="true" />
                  <span class="suggestionContent"><strong>{{ item.label }}</strong><span>{{ item.description }}</span></span>
                  <icon-arrow-up-right class="suggestionArrow" :size="15" aria-hidden="true" />
                </el-button>
              </div>
              <p class="welcomeHint">点击填入提示，也可以直接输入，或粘贴图片、视频。</p>
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
            class="messageRow"
            :style="{ transform: `translateY(${row.start}px)` }"
            :class="{ userMessage: item.role === 'user', editingMessage: editingId === item.id }">
            <chat-item :role="item.role" :variant="item.role === 'user' ? 'base' : 'text'" :textLoading="!!item.streaming && !compacting && !item.parts?.some(part => part.type === 'tool' || part.content)" animation="moving">
              <template #content>
                <div class="messageContent">
                  <div v-if="item.report" class="reportHeader"><icon-users-group :size="14" />{{ item.report.name }} 上报</div>
                  <template v-for="part in item.parts" :key="part.id">
                    <chat-reasoning v-if="part.type === 'thinking' && part.content" class="messageReasoning" :collapsed="part.collapsed ?? true" expandIconPlacement="left" @update:collapsed="part.collapsed = $event">
                      <template #header>
                        <span class="reasoningHeader">
                          <icon-atom :size="14" />
                          <span>思考</span>
                          <span v-if="part.duration !== undefined" class="thinkingDuration">{{ part.duration.toFixed(1) }} 秒</span>
                        </span>
                      </template>
                      <messageMarkdown v-if="!(part.collapsed ?? true)" :content="part.content" :streaming="!!item.streaming" :directory="directory" />
                    </chat-reasoning>
                    <toolMessage v-else-if="part.type === 'tool'" v-model:collapsed="part.collapsed" :tool="part.tool" :directory="directory" @copy="copyMessage" />
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
                <el-button text size="small" :disabled="busy || deletingId !== undefined" @click="cancelEdit"><icon-x :size="14" />取消</el-button>
                <span class="editingHint">正在下方编辑</span>
              </template>
              <template v-else>
                <el-button v-if="item.content" class="messageAction" text circle aria-label="复制消息" title="复制消息" @click="copyMessage(mentionPlainText(item.content, item.mentions))"><icon-copy :size="14" /></el-button>
                <template v-if="item.role === 'user'">
                  <el-button class="messageAction" text circle :disabled="locked || remoteRunning" aria-label="编辑消息" title="编辑消息" @click="editMessage(item)"><icon-pencil :size="14" /></el-button>
                </template>
                <el-button v-if="!item.report" class="messageAction" text circle :loading="deletingId === item.id" :disabled="locked || remoteRunning" aria-label="删除消息" title="删除消息" @click="deleteMessage(item)"><icon-trash v-if="deletingId !== item.id" :size="14" /></el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
      <el-button v-if="messages.length && !atLatestMessage" class="scrollBottom" circle aria-label="回到最新消息" title="回到最新消息" @click="messageVirtualizer.scrollToEnd()"><icon-arrow-down :size="18" /></el-button>
    </div>
    <div v-if="compacting" class="compactionStatus" role="status">
      <el-icon class="is-loading" aria-hidden="true"><icon-loader-2 :size="14" /></el-icon>
      <span>正在压缩上下文…</span>
    </div>
    <div class="messageInput">
      <div v-if="editingId" class="editingBanner"><span>编辑消息</span><el-button text size="small" :disabled="busy" @click="cancelEdit">取消</el-button></div>
      <div
        class="senderResizeHandle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整输入框高度"
        aria-valuemin="44"
        :aria-valuemax="senderMaxHeight"
        :aria-valuenow="senderHeight"
        tabindex="0"
        title="拖动调整输入框高度"
        @focus="senderHeight = sender?.chatElement.rollBox.clientHeight ?? 44"
        @pointerdown="startSenderResize"
        @pointermove="moveSenderResize"
        @pointerup="stopSenderResize"
        @pointercancel="stopSenderResize"
        @lostpointercapture="stopSenderResize"
        @keydown.up.prevent="setSenderHeight((sender?.chatElement.rollBox.clientHeight ?? 44) + 16)"
        @keydown.down.prevent="setSenderHeight((sender?.chatElement.rollBox.clientHeight ?? 44) - 16)" />
      <attachmentList v-if="draftAttachments.length" class="draftAttachments" :attachments="draftAttachments" :directory="directory" removable restorable :disabled="locked" @remove="draftAttachments.splice($event, 1)" @restore="restoreTextAttachment" />
      <div ref="senderElement" class="senderEditor" @keydown.capture="handleSenderKeydown"></div>
      <teleport v-for="target in draftMentionTargets" :key="target.key" :to="target.element"><mentionThumbnail v-bind="mentionThumbnailProps(target.mention)" :directory="directory"><icon-photo :size="14" /></mentionThumbnail></teleport>
      <mentionContent ref="draftMentionPreview" :mentions="draftMentions" :directory="directory" removable @remove="removeDraftMention" />
      <div class="senderActions">
        <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" :active="active" :disabled="disabled" />
        <mentionMenu ref="mentionMenuRef" :directory="directory" :active="active" :disabled="locked || !directory" :query="mentionQuery" :editor="senderElement" :currentCanvasId="createCanvasContext?.()?.id" @open="captureMentionPosition" @select="insertMentions" @dismiss="mentionQuery = undefined" />
        <commandMenu ref="commandMenuRef" :active="active" :disabled="locked" :query="commandQuery" :editor="senderElement" @select="selectCommand" @dismiss="commandQuery = undefined" />
        <skillMenu ref="skillMenuRef" :directory="directory" :active="active" :disabled="locked || !directory" :query="skillQuery" :editor="senderElement" @select="selectSkill" @dismiss="skillQuery = undefined" />
        <el-popover
          v-model:visible="contextMenuVisible"
          trigger="click"
          placement="top"
          :width="280"
          :offset="10"
          :showArrow="false"
          popperClass="agentContextPopover">
          <template #reference>
            <el-button class="contextButton" text circle aria-label="查看上下文用量" title="查看上下文用量">
              <icon-circle-dashed :size="14" />
            </el-button>
          </template>
          <div class="contextUsage">
            <div class="contextHeader"><span>上下文用量</span><span class="contextHint">估算</span></div>
            <template v-if="contextUsage?.tokens != null">
              <div class="contextTokens">
                <span>{{ contextUsage.tokens.toLocaleString() }} / {{ contextWindow.toLocaleString() }} tok</span>
                <span>{{ contextPercent.toFixed(1) }}%</span>
              </div>
              <el-progress :percentage="Math.min(100, contextPercent)" :showText="false" />
            </template>
            <span v-else class="contextHint">{{ contextUsage ? "等待下一次回复更新用量" : "尚无用量数据" }}</span>
            <div v-if="stats" class="contextStats">
              <div class="contextHeader">对话累计用量</div>
              <div class="contextTokens"><span>输入</span><span>{{ inputTokens.toLocaleString() }} tok</span></div>
              <div class="contextTokens"><span>输出</span><span>{{ stats.tokens.output.toLocaleString() }} tok</span></div>
              <div v-if="inputTokens > 0" class="contextTokens"><span>缓存命中</span><span>{{ (stats.tokens.cacheRead / inputTokens * 100).toFixed(1) }}%</span></div>
              <div v-if="stats.tokensPerSecond !== undefined" class="contextTokens"><span>生成速度</span><span>{{ stats.tokensPerSecond.toFixed(1) }} tok/s</span></div>
            </div>
          </div>
        </el-popover>
        <el-button class="sendButton" type="primary" circle :disabled="!busy && locked" :aria-label="busy ? '停止生成' : editingId ? '重发消息' : '发送消息'" :title="busy ? '停止生成' : editingId ? '重发消息' : '发送消息'" @click="busy ? stopMessage() : submitMessage()">
          <icon-player-stop-filled v-if="busy" :size="14" />
          <icon-arrow-up v-else :size="16" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { locale, t, translate } from "@toonflow/i18n/vue";
import { computed, inject, nextTick, reactive, ref, shallowRef, watch, type ComponentPublicInstance } from "vue";
import { defaultRangeExtractor, observeElementRect, useVirtualizer } from "@tanstack/vue-virtual";
import axios from "axios";
import {
  IconArrowUp, IconArrowDown, IconAtom, IconCopy,
  IconCircleDashed, IconPencil, IconPlayerStopFilled, IconX, IconLoader2,
  IconTrash, IconLayoutGrid, IconMovie, IconPhoto, IconArrowUpRight, IconUsersGroup,
} from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import logoUrl from "@toonflow/assets/logo.svg";
import modelPopover from "@/components/modelPopover.vue";
import commandMenu from "./commandMenu.vue";
import skillMenu from "./skillMenu.vue";
import mentionMenu from "./mentionMenu.vue";
import mentionContent from "./mentionContent.vue";
import mentionThumbnail from "./mentionThumbnail.vue";
import { mentionName, mentionParts, mentionPlainText, mentionThumbnailProps } from "./mentionText";
import toolMessage from "./toolMessage.vue";
import attachmentList from "./attachmentList.vue";
import { createPastedTextFile, readTextAttachment } from "./textAttachments";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { writeClipboardText } from "@/lib/clipboard";
import anonymousData from "@/lib/anonymousData";
import { modelChoices } from "@/stores/settings";
import { useWorkspaceStore } from "@/stores/workspace";
import type { AgentAttachment, AgentConversation, AgentMessage } from "./types";
import type { AgentEvent, AgentMention } from "@toonflow/server/agent/types";
import { createConversationStream, readAgentEvents } from "./replyStream";
import type { CanvasContext } from "@toonflow/tool-canvas/runtime";
import chatItem from "@tdesign-vue-next/chat/es/chat-item";
import chatReasoning from "@tdesign-vue-next/chat/es/chat-reasoning";
import messageMarkdown from "@/components/messageMarkdown.vue";
import xSender, { type AnyTagProps } from "x-sender";
import "tdesign-vue-next/es/style/index.css";
import "@tdesign-vue-next/chat/es/style/index.css";
import "x-sender/lib/XSender.css";

const props = defineProps<{ active: boolean; initialSession: AgentConversation | null; sessionFile?: string; disabled: boolean }>();
const emit = defineEmits<{ session: [file: string]; sent: [prompt: string]; event: [event: AgentEvent] }>();
const workspaceStore = useWorkspaceStore();
const directory = workspaceStore.project?.directory;
const draftAttachments = ref<AgentAttachment[]>([]);
const createCanvasContext = inject<(() => CanvasContext | undefined) | undefined>("canvas", undefined);
const messages = ref<AgentMessage[]>((props.initialSession?.messages ?? []).map(message => ({ ...message })));
const stream = createConversationStream(messages);
const remoteRunning = ref(props.initialSession?.running ?? false);
const stats = ref(props.initialSession?.stats);
const contextUsage = ref(props.initialSession?.contextUsage);
const busy = ref(false);
const compacting = ref(false);
const deletingId = ref<string>();
const restoringAttachment = ref(false);
const locked = computed(() => props.disabled || busy.value || deletingId.value !== undefined || restoringAttachment.value);
const editingId = ref<string>();
const draftMentions = ref<AgentMention[]>([]);
const draftMentionTargets = shallowRef<{ key: symbol; element: HTMLElement; mention: AgentMention }[]>([]);
const draftMentionPreview = ref<InstanceType<typeof mentionContent>>();
let editDraft: { model: AnyTagProps[][]; mentions: AgentMention[]; attachments: AgentAttachment[] } | undefined;
const messageList = ref<HTMLDivElement>();
const atLatestMessage = ref(true);
let messageListInitialized = false;
let messageScrollOffset = 0;
const messageKeys = computed(() => messages.value.map(item => item.id));
const retainedMessages = computed(() => messages.value.flatMap((item, index) => item.streaming || item.id === editingId.value ? [index] : []));
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
    useAnimationFrameWithResizeObserver: true,
    useCachedMeasurements: !props.active,
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
const visibleMessages = computed(() => messageVirtualizer.value.getVirtualItems().map(row => ({ row, item: messages.value[row.index]! })));

function measureMessage(element: Element | ComponentPublicInstance | null) {
  messageVirtualizer.value.measureElement(element instanceof HTMLDivElement ? element : null);
}

watch([() => props.active, messageList], async ([active, element]) => {
  if (!active || !element) return;
  await nextTick();
  if (!props.active) return;
  if (!messageListInitialized || atLatestMessage.value) messageVirtualizer.value.scrollToEnd();
  else messageVirtualizer.value.scrollToOffset(messageScrollOffset);
  messageListInitialized = true;
}, { immediate: true, flush: "post" });
let sender: xSender | undefined;
watch(locale, () => {
  if (!sender) return;
  sender.updateConfig({ placeholder: translate("输入消息，@ 提及节点输出或全局素材…") });
  sender.chatElement.richText.setAttribute("aria-label", translate("消息"));
  for (const line of sender.chatEditor.NODES) for (const tag of line.children) {
    if (tag.type === "Mention") tag.$el.setAttribute("aria-label", t`预览 ${tag.name}`);
  }
});
let controller: AbortController | undefined;
const senderElement = ref<HTMLElement>();
const skillMenuRef = ref<InstanceType<typeof skillMenu>>();
const skillQuery = ref<string>();
const commandMenuRef = ref<InstanceType<typeof commandMenu>>();
const commandQuery = ref<string>();
const mentionMenuRef = ref<InstanceType<typeof mentionMenu>>();
const mentionQuery = ref<string>();
let mentionPosition: { node: ReturnType<xSender["getCurrentNode"]>; remove: number } | undefined;
let insertingMentions = false;
const senderHeight = ref(44);
const senderMaxHeight = ref(Math.max(44, window.innerHeight / 2));
let senderResize: { pointerId: number; y: number; height: number } | undefined;
const pendingMessage = props.initialSession?.parentFile ? undefined : workspaceStore.pendingAgentMessage;
const selectedModel = ref(pendingMessage?.model ?? (props.initialSession?.providerId && props.initialSession.modelId
  ? JSON.stringify([props.initialSession.providerId, props.initialSession.modelId]) : ""));
const contextMenuVisible = ref(false);
const reasoningEffort = ref(pendingMessage?.reasoningEffort ?? (props.initialSession?.thinkingLevel === "off" ? "" : props.initialSession?.thinkingLevel ?? ""));
const selectedModelChoice = computed(() => modelChoices.value.find(item => item.value === selectedModel.value));
const contextWindow = computed(() => contextUsage.value?.contextWindow ?? selectedModelChoice.value?.contextWindow ?? 262144);
const contextPercent = computed(() => (contextUsage.value?.tokens ?? 0) / contextWindow.value * 100);
const inputTokens = computed(() => stats.value ? stats.value.tokens.input + stats.value.tokens.cacheRead + stats.value.tokens.cacheWrite : 0);
const welcomeSuggestions = [
  { label: "搭建创作画布", description: "把创意串成清晰的节点流程", icon: IconLayoutGrid, prompt: "帮我搭建一个创作画布，先和我确认需要的节点与流程。" },
  { label: "梳理故事分镜", description: "拆解故事，安排画面与镜头", icon: IconMovie, prompt: "帮我把故事整理成分镜，先和我确认故事内容、时长和画面风格。" },
  { label: "生成图片素材", description: "为角色和场景寻找视觉方向", icon: IconPhoto, prompt: "帮我生成图片素材，先和我确认画面内容、风格和使用的模型。" },
];
watch([locked, () => props.active], ([locked, active]) => {
  if (!active || locked) sender?.disable();
  else sender?.enable();
});
watch(() => props.active, active => {
  if (!active) contextMenuVisible.value = false;
});

function applyEvent(event: AgentEvent) {
  switch (event.type) {
    case "subAgent":
    case "subAgentEvent": emit("event", event); break;
    case "report":
      if (event.parentFile !== props.sessionFile) { emit("event", event); break; }
      if (!messages.value.some(message => message.id === event.id)) messages.value.push({
        id: event.id, role: "assistant", content: event.content,
        parts: [{ id: event.id, type: "text", content: event.content }], report: { file: event.file, name: event.name },
      });
      break;
    case "compaction": compacting.value = event.active; break;
    case "session": emit("session", event.file); break;
    case "stats": stats.value = event.stats; contextUsage.value = event.contextUsage; break;
    default: stream.receive(event);
  }
}

function receiveEvent(event: AgentEvent) {
  if (event.type === "done" || event.type === "error") {
    remoteRunning.value = false;
    compacting.value = false;
  } else if (["userMessage", "text", "thinking", "tool"].includes(event.type)) remoteRunning.value = true;
  applyEvent(event);
}

defineExpose({ receiveEvent });

function getDraftContent() {
  return sender?.getModel().map((line, lineIndex) => line.map((tag, tagIndex) => {
    if (tag.type === "Mention") return `{{mention:${tag.id}}}`;
    if (tag.type === "Write") return tag.text;
    return sender?.chatEditor.NODES[lineIndex]?.children[tagIndex]?.$el.textContent ?? "";
  }).join("")).join("\n").replace(/[\ufeff\u200b]/g, "") ?? "";
}

function captureMentionPosition() {
  const node = sender?.getCurrentNode();
  mentionPosition = node?.instance?.$el.isConnected ? { node: { ...node }, remove: mentionQuery.value === undefined ? 0 : mentionQuery.value.length + 1 } : undefined;
  skillQuery.value = undefined;
}

function updateMentionQuery() {
  if (!sender || insertingMentions || sender.chatEditor.isComposition || !sender.chatElement.richText.contains(sender.getSelection().anchorNode)) return;
  const current = sender.getCurrentNode();
  const before = current?.instance?.type === "Write" ? current.instance.text.slice(0, current.offset) : "";
  mentionQuery.value = /(?:^|[^\w@])@([^\s@]*)$/.exec(before)?.[1];
  if (mentionQuery.value !== undefined) captureMentionPosition();
}

function handleSenderKeydown(event: KeyboardEvent) {
  const id = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-agent-mention]")?.dataset.agentMention : undefined;
  if (id && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    draftMentionPreview.value?.preview(id);
    return;
  }
  if (mentionMenuRef.value?.handleKeydown(event)) return;
  if (commandMenuRef.value?.handleKeydown(event)) return;
  skillMenuRef.value?.handleKeydown(event);
}

async function insertMentions(mentions: AgentMention[]) {
  const instance = sender;
  if (!instance || locked.value || !props.active) return;
  const currentIds = new Set(instance.getTagData().mention.map(item => item.id));
  if (currentIds.size + mentions.length > 20) return ElMessage.warning("每条消息最多提及 20 个输出或素材");
  insertingMentions = true;
  try {
    if (mentionPosition?.node.instance.$el.isConnected) mentionPosition.node.instance.focus(mentionPosition.node.offset);
    else instance.focus("last");
    if (mentionPosition?.remove) await instance.backspace(-mentionPosition.remove);
    for (const mention of mentions) {
      if (sender !== instance || !props.active) break;
      draftMentions.value.push(mention);
      await instance.setMention({ id: mention.id, name: mentionName(mention) });
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "添加提及失败");
  } finally {
    mentionQuery.value = undefined;
    mentionPosition = undefined;
    insertingMentions = false;
  }
}

async function removeDraftMention(id: string) {
  if (!locked.value) await sender?.removeMention([id]);
}

function submitMessage() {
  return sendMessage(editingId.value ? messages.value.find(item => item.id === editingId.value) : undefined);
}

async function selectSkill(name: string) {
  const instance = sender;
  if (!instance || locked.value) return;
  const model = instance.getModel();
  const first = model[0]?.[0];
  if (first?.type === "Write") first.text = `/skill:${name} ${first.text.replace(skillQuery.value !== undefined ? /^\/\S*/ : /^\s*\/skill:\S+(?:\s+|$)/, "")}`;
  if (!model.length) model.push([]);
  if (first?.type !== "Write") model[0]!.unshift({ type: "Write", text: `/skill:${name} ` });
  skillQuery.value = undefined;
  mentionMenuRef.value?.closeMenu();
  await instance.reset({ clearHistory: false, chatNode: model });
  if (sender === instance) instance.focus("last");
}

async function selectCommand(name: string) {
  const instance = sender;
  if (!instance || locked.value) return;
  commandQuery.value = undefined;
  if (name === "clear") {
    try {
      if (props.sessionFile && directory) {
        const { data } = await axios.delete<{ code: number; data: AgentConversation; message?: string }>("/api/agent/message", {
          data: { directory, sessionFile: props.sessionFile, clear: true },
          headers: { "x-toonflow-workspace": "1" },
        });
        if (data.code !== 200) throw new Error(data.message || "清空对话失败");
      }
      messages.value = [];
      stats.value = undefined;
      contextUsage.value = undefined;
      draftAttachments.value = [];
      draftMentions.value = [];
      await instance.reset({ clearHistory: false });
      commandQuery.value = undefined;
      if (sender === instance) instance.focus("last");
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "清空对话失败");
    }
    return;
  }
  await instance.reset({ clearHistory: false, chatNode: [[{ type: "Write", text: `/${name}` }]] });
  commandQuery.value = undefined;
  if (sender === instance) {
    await sendMessage();
    if (name === "compact") messages.value = messages.value.filter(message => message.content !== "/compact" || message.entryId);
  }
}

async function fillPrompt(prompt: string) {
  const instance = sender;
  if (!instance || locked.value) return;
  draftMentions.value = [];
  await instance.reset({ clearHistory: false, chatNode: [[{ type: "Write", text: prompt }]] });
  if (sender === instance) instance.focus("last");
}

async function copyMessage(content: string) {
  try {
    await writeClipboardText(content);
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请重试");
  }
}

async function editMessage(item: AgentMessage) {
  const instance = sender;
  if (!instance || locked.value || remoteRunning.value || item.role !== "user") return;
  if (!editingId.value) editDraft = { model: instance.getModel(), mentions: [...draftMentions.value], attachments: [...draftAttachments.value] };
  editingId.value = item.id;
  draftMentions.value = [...item.mentions ?? []];
  draftAttachments.value = [...item.attachments ?? []];
  mentionMenuRef.value?.closeMenu();
  const model: AnyTagProps[][] = item.content.split("\n").map(line => mentionParts(line, item.mentions).map(part => part.mention
    ? { type: "Mention", id: part.mention.id, name: mentionName(part.mention) } : { type: "Write", text: part.text }));
  await instance.reset({ chatNode: model });
  if (sender === instance) instance.focus("last");
}

async function restoreEditingDraft() {
  const draft = editDraft;
  editDraft = undefined;
  editingId.value = undefined;
  draftMentions.value = draft?.mentions ?? [];
  draftAttachments.value = draft?.attachments ?? [];
  await sender?.reset({ chatNode: draft?.model });
}

async function cancelEdit() {
  if (busy.value || deletingId.value !== undefined) return;
  await restoreEditingDraft();
}

async function deleteMessage(item: AgentMessage) {
  if (locked.value || remoteRunning.value || item.streaming || item.report) return;
  deletingId.value = item.id;
  try {
    if (item.entryId || item.replyTo) {
      if (!directory || !props.sessionFile) throw new Error("请重新打开对话后再删除");
      const { data } = await axios.delete<{ code: number; data: AgentConversation; message?: string }>("/api/agent/message", {
        data: {
          directory, sessionFile: props.sessionFile,
          ...(item.replyTo ? { replyTo: item.replyTo } : { entryIds: [item.entryId!] }),
        },
        headers: { "x-toonflow-workspace": "1" },
      });
      if (data.code !== 200) throw new Error(data.message || "删除消息失败");
      stats.value = data.data.stats;
      contextUsage.value = data.data.contextUsage;
    }
    messages.value = messages.value.filter(message => message.id !== item.id);
  } catch (error) {
    const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
    ElMessage.error(message || (error instanceof Error ? error.message : "删除消息失败"));
  } finally {
    deletingId.value = undefined;
  }
}

function setSenderHeight(height: number) {
  if (!sender) return;
  senderMaxHeight.value = Math.max(44, window.innerHeight / 2);
  senderHeight.value = Math.max(44, Math.min(senderMaxHeight.value, Math.round(height)));
  sender.chatElement.rollBox.style.height = `${senderHeight.value}px`;
}

function startSenderResize(event: PointerEvent) {
  if (event.button !== 0 || senderResize || !sender) return;
  event.preventDefault();
  senderResize = { pointerId: event.pointerId, y: event.clientY, height: sender.chatElement.rollBox.getBoundingClientRect().height };
  senderHeight.value = senderResize.height;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveSenderResize(event: PointerEvent) {
  if (senderResize?.pointerId !== event.pointerId) return;
  setSenderHeight(senderResize.height + senderResize.y - event.clientY);
}

function stopSenderResize(event: PointerEvent) {
  if (senderResize?.pointerId === event.pointerId) senderResize = undefined;
}

function stopMessage() {
  controller?.abort();
}

async function uploadAttachments(attachments: AgentAttachment[], directory: string, signal: AbortSignal) {
  if (!attachments.some(item => item.file)) return;
  const files = useWorkspaceFiles(directory);
  for (const path of ["assets", "assets/chat"]) {
    await files.mkdir(path).catch(error => {
      if (error?.response?.data?.data?.code !== "EEXIST") throw error;
    });
    signal.throwIfAborted();
  }
  for (const attachment of attachments) {
    if (!attachment.file) continue;
    const extension = attachment.name.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0].toLowerCase() ?? "";
    const path = `assets/chat/${crypto.randomUUID()}${extension}`;
    await files.write(path, attachment.file, true, signal);
    attachment.path = path;
    attachment.file = undefined;
    signal.throwIfAborted();
  }
}

async function sendCanvasResult(event: Extract<AgentEvent, { type: "canvasCall" }>, canvasContext: CanvasContext | undefined, signal: AbortSignal) {
  let body: string;
  try {
    if (!canvasContext) throw new Error("当前页面没有激活的画布");
    const result = await canvasContext.call(event, signal);
    body = JSON.stringify({ directory, callId: event.callId, result: result ?? null });
  } catch (error) {
    body = JSON.stringify({ directory, callId: event.callId, error: (error instanceof Error && error.message ? error.message : translate("画布操作失败")).slice(0, 8000) });
  }
  const cancelled = signal.aborted;
  if (cancelled) body = JSON.stringify({ directory, callId: event.callId, error: translate("画布操作已取消") });
  const response = await fetch("/api/agent/canvasResult", {
    method: "POST",
    headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
    body,
    keepalive: cancelled,
    signal: cancelled ? AbortSignal.timeout(5000) : signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "画布操作结果回传失败");
  }
}

async function sendMessage(source?: AgentMessage) {
  const instance = sender;
  const editing = source && editingId.value === source.id;
  const prompt = (source && !editing ? source.content : getDraftContent()).trim();
  const attachments = reactive((source && !editing ? source.attachments ?? [] : draftAttachments.value).map(item => ({ ...item })));
  const mentionedIds = source && !editing ? (source.mentions ?? []).filter(mention => prompt.includes(`{{mention:${mention.id}}}`)).map(mention => mention.id)
    : instance?.getTagData().mention.map(mention => mention.id) ?? [];
  const references = source && !editing ? source.mentions ?? [] : draftMentions.value;
  const mentions = references.filter(mention => mentionedIds.includes(mention.id)).map(mention => ({ ...mention }));
  if (mentionedIds.some(id => !mentions.some(mention => mention.id === id))) return ElMessage.warning("存在无法读取的提及，请删除后重新选择");
  if (!source && editingId.value !== undefined) return;
  const resendIndex = source ? messages.value.findIndex(item => item.id === source.id) : -1;
  if (source && (source.role !== "user" || resendIndex < 0)) return;
  const resendFrom = source ? source.entryId ?? messages.value.slice(resendIndex + 1).find(item => item.role === "user" && item.entryId)?.entryId : undefined;
  if (locked.value || !instance || (!prompt && !attachments.length)) return;
  const model = selectedModelChoice.value;
  if (!directory) return ElMessage.warning("请先打开项目");
  if (!model) return ElMessage.warning("请先选择模型");

  const requestController = new AbortController();
  const canvasContext = createCanvasContext?.();
  controller = requestController;
  busy.value = true;
  compacting.value = false;
  instance.disable();
  const reply = reactive<AgentMessage>({ id: crypto.randomUUID(), role: "assistant", content: "", parts: [], streaming: true });
  const userMessage = reactive<AgentMessage>({ id: crypto.randomUUID(), role: "user", content: prompt, attachments, mentions });
  let ownsStream = !remoteRunning.value;
  let forwarded = false;
  if (!source) {
    messages.value.push(userMessage);
    if (ownsStream) messages.value.push(reply);
    draftAttachments.value = [];
    draftMentions.value = [];
  }
  let accepted = false;
  if (ownsStream) stream.begin(reply);
  const handledCanvasCalls = new Set<string>();
  const pendingQuestions = new Map<string, string>();
  const activeChildFiles = new Set<string>();
  const finishStats = anonymousData.startAgent();
  try {
    if (!source) await instance.reset();
    requestController.signal.throwIfAborted();
    await uploadAttachments(attachments, directory, requestController.signal);
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ prompt, mentions, attachments: attachments.map(({ name, path, mimeType }) => ({ name, path, mimeType })), directory, providerId: model.providerId, modelId: model.modelId, thinkingLevel: reasoningEffort.value || undefined, sessionFile: props.sessionFile, resendFrom, canvas: canvasContext ? { id: canvasContext.id, tools: canvasContext.tools } : undefined }),
      signal: requestController.signal,
    });
    for await (const event of readAgentEvents(response, requestController.signal)) {
      // 子任务复用发起委派时的画布与取消通道，界面切换不改变工具执行目标。
      let toolEvent: AgentEvent = event;
      let scope = "";
      while (toolEvent.type === "subAgentEvent") {
        if (toolEvent.event.type === "done" || toolEvent.event.type === "error") activeChildFiles.delete(toolEvent.file);
        else activeChildFiles.add(toolEvent.file);
        scope += `${toolEvent.file}/`;
        toolEvent = toolEvent.event;
      }
      if (toolEvent.type === "question") pendingQuestions.set(`${scope}${toolEvent.toolCallId}`, toolEvent.callId);
      if (toolEvent.type === "tool" && toolEvent.tool.status !== "running") pendingQuestions.delete(`${scope}${toolEvent.tool.id}`);
      if (toolEvent.type === "canvasCall") {
        if (handledCanvasCalls.has(toolEvent.callId)) throw new Error("收到重复的画布调用");
        handledCanvasCalls.add(toolEvent.callId);
        await sendCanvasResult(toolEvent, canvasContext, requestController.signal);
        continue;
      }
      switch (event.type) {
        case "accepted":
          forwarded = true;
          if (ownsStream) {
            stream.finish();
            messages.value = messages.value.filter(message => message !== reply);
          }
          break;
        case "userMessage":
          if (!ownsStream) {
            messages.value.push(reply);
            stream.begin(reply);
          }
          userMessage.entryId = event.id;
          reply.replyTo = event.id;
          if (source && !accepted) {
            messages.value.splice(resendIndex, messages.value.length - resendIndex, userMessage, reply);
            stats.value = undefined;
            contextUsage.value = undefined;
            await restoreEditingDraft();
          }
          accepted = true;
          ownsStream = true;
          applyEvent(event);
          break;
        case "stats":
          if (source && !accepted) break;
          applyEvent(event);
          break;
        default: applyEvent(event);
      }
    }
    if (source && !accepted) throw new Error("服务端未确认重发，请重新打开对话后重试");
    finishStats("success");
    emit("sent", mentionPlainText(prompt, mentions) || attachments[0]?.name || "新对话");
  } catch (error) {
    finishStats(requestController.signal.aborted ? "cancelled" : "failed");
    const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    const message = requestController.signal.aborted ? "已停止生成" : responseMessage || (error instanceof Error ? error.message : "发送失败，请重试");
    if ((source && !accepted) || !ownsStream) { userMessage.error = message; ElMessage.error(message); }
    else reply.error = message;
    if (ownsStream && props.initialSession?.parentFile && props.sessionFile) {
      emit("event", { type: "subAgentEvent", file: props.sessionFile, event: { type: "error", message } });
    }
  } finally {
    for (const file of activeChildFiles) emit("event", { type: "subAgentEvent", file, event: { type: "error", message: "委派连接已结束，请重新打开子会话查看结果" } });
    // ACT: Bun 的流断开事件可能不触发；主动结束仍在等待的提问，不依赖断开通知。
    for (const callId of pendingQuestions.values()) {
      void fetch("/api/agent/answer", {
        method: "POST", headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
        body: JSON.stringify({ directory, callId, cancelled: true }), keepalive: true,
      }).catch(() => {});
    }
    if (ownsStream && !forwarded) stream.finish();
    compacting.value = false;
    busy.value = false;
    controller = undefined;
  }
}

async function restoreTextAttachment(index: number) {
  const instance = sender;
  const attachment = draftAttachments.value[index];
  if (!instance || locked.value || !props.active || attachment?.mimeType !== "text/plain") return;
  restoringAttachment.value = true;
  try {
    const text = await readTextAttachment(attachment, directory);
    if (sender !== instance || !props.active || props.disabled || !draftAttachments.value.includes(attachment)) return;
    instance.focus("last");
    await instance.setText(`${instance.isEmpty(false) ? "" : "\n"}${text}`);
    if (sender === instance) draftAttachments.value = draftAttachments.value.filter(item => item !== attachment);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "还原文本附件失败，请重试");
  } finally {
    restoringAttachment.value = false;
  }
}

function pasteAttachments(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (!files.length) {
    try {
      const file = createPastedTextFile(event.clipboardData?.getData("text/plain") ?? "");
      if (file) files.push(file);
    } catch (error) {
      event.preventDefault();
      event.stopImmediatePropagation();
      ElMessage.warning(error instanceof Error ? error.message : "无法添加文本附件");
      return;
    }
  }
  if (!files.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (locked.value) return;
  for (const file of files) {
    if (!/^(image|video)\//.test(file.type) && file.type !== "text/plain") {
      ElMessage.warning("只支持图片、视频和纯文本文件");
      continue;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      ElMessage.warning("附件不能为空且不能超过 100 MB");
      continue;
    }
    if (file.type === "text/plain" && file.size > 400000) {
      ElMessage.warning("文本附件不能超过 400000 字节");
      continue;
    }
    if (draftAttachments.value.length >= 20) {
      ElMessage.warning("每条消息最多添加 20 个附件");
      break;
    }
    draftAttachments.value.push({ name: file.name, path: "", mimeType: file.type, file });
  }
}

watch(senderElement, (element, _previous, onCleanup) => {
  if (!element) return;
  const instance = new xSender(element, {
    autoFocus: props.active,
    placeholder: translate("输入消息，@ 提及节点输出或全局素材…"),
    chatStyle: { minHeight: "44px", maxHeight: "50vh", fontSize: "14px", lineHeight: "24px" },
    keyboardSendFun: event => event.key === "Enter" && !event.shiftKey && !event.isComposing,
    keyboardWrapFun: event => event.key === "Enter" && event.shiftKey && !event.isComposing,
  });
  sender = instance;
  if (!props.active || locked.value) instance.disable();
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_SEND, () => void submitMessage());
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_CHANGE, () => {
    const text = instance.getText();
    const command = /^\/([^\s/]*)$/.exec(text)?.[1];
    commandQuery.value = command && !text.startsWith("/skill:") ? command : undefined;
    skillQuery.value = /^\/skill:([^\s/]*)$/.exec(text)?.[1];
    const targets: typeof draftMentionTargets.value = [];
    for (const line of instance.chatEditor.NODES) for (const tag of line.children) {
      if (tag.type !== "Mention") continue;
      tag.$el.dataset.agentMention = tag.id;
      tag.$el.setAttribute("role", "button");
      tag.$el.setAttribute("tabindex", "0");
      tag.$el.setAttribute("aria-label", t`预览 ${tag.name}`);
      const mention = draftMentions.value.find(item => item.id === tag.id);
      if (!mention || !mentionThumbnailProps(mention).thumbnail) continue;
      const content = tag.$el.querySelector<HTMLElement>(".chat-tag-mention");
      if (!content) continue;
      let element = content.querySelector<HTMLElement>(".agentMentionThumbnail");
      if (!element) {
        element = document.createElement("span");
        element.className = "agentMentionThumbnail";
        const label = document.createElement("span");
        label.className = "agentMentionLabel";
        label.textContent = content.textContent;
        content.replaceChildren(element, label);
      }
      targets.push({ key: draftMentionTargets.value.find(target => target.element === element)?.key ?? Symbol(), element, mention });
    }
    draftMentionTargets.value = targets;
    void instance.nextTick(() => { if (sender === instance) updateMentionQuery(); });
  });
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_TAG_CLICK, (tag: { type: string; id?: string }) => {
    if (tag.type === "Mention" && tag.id) draftMentionPreview.value?.preview(tag.id);
  });
  const editor = instance.chatElement.richText;
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", translate("消息"));
  editor.setAttribute("aria-multiline", "true");
  element.addEventListener("paste", pasteAttachments, true);
  const updateCursor = (event: Event) => { if (!(event instanceof KeyboardEvent) || event.key !== "Escape") updateMentionQuery(); };
  editor.addEventListener("keyup", updateCursor);
  editor.addEventListener("compositionend", updateCursor);
  onCleanup(() => {
    controller?.abort();
    draftMentionTargets.value = [];
    sender = undefined;
    senderResize = undefined;
    element.removeEventListener("paste", pasteAttachments, true);
    editor.removeEventListener("keyup", updateCursor);
    editor.removeEventListener("compositionend", updateCursor);
    instance.destroy();
  });
});

watch(() => !props.initialSession?.parentFile && !!workspaceStore.pendingAgentMessage && props.active && !locked.value && !!senderElement.value && !!createCanvasContext?.(), async ready => {
  const message = workspaceStore.pendingAgentMessage;
  const instance = sender;
  if (!ready || !message || !instance || message.directory !== directory) return;
  workspaceStore.pendingAgentMessage = null;
  draftAttachments.value = [...message.attachments ?? []];
  await fillPrompt(message.prompt);
  if (sender === instance && props.active) void sendMessage();
}, { flush: "post" });
</script>

<style lang="scss">
.agentConversation {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

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

            .t-fake-arrow {
              transform: rotate(-90deg);
            }

            &.t-collapse-panel__icon--active .t-fake-arrow {
              transform: rotate(0deg);
            }
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

  .compactionStatus {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 6px;
    margin: 0 12px 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .messageInput {
    --chat-text: var(--el-text-color-primary);
    --chat-text-placeholder: var(--el-text-color-placeholder);
    --chat-rect-padding: 12px;
    --chat-mention-text: var(--el-color-primary);
    position: relative;
    flex-shrink: 0;
    margin: 0 12px 8px;
    border: 1px solid var(--el-border-color-light);
    border-radius: calc(var(--ui-radius) * 2.75);
    background: var(--el-bg-color);
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);

    &:focus-within {
      border-color: var(--el-color-primary-light-5);
    }

    .senderResizeHandle {
      position: absolute;
      z-index: 12;
      top: -4px;
      right: 12px;
      left: 12px;
      height: 8px;
      border-radius: 4px;
      cursor: ns-resize;
      touch-action: none;
      user-select: none;

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 2px;
      }
    }

    .draftAttachments {
      padding: 12px 12px 0;
    }

    .senderEditor .chat-placeholder-wrap {
      font-size: 14px;
      font-style: normal;
      line-height: 24px;
    }

    .editingBanner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .senderEditor .chat-tag-mention {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      vertical-align: middle;
      border-radius: var(--el-border-radius-small);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      white-space: normal;
      overflow-wrap: anywhere;
      cursor: pointer;

      .agentMentionThumbnail {
        display: inline-flex;
        flex-shrink: 0;

        .mentionThumbnail { width: 24px; height: 24px; border-radius: 3px; }
      }
      .agentMentionLabel { min-width: 0; }
    }

    .senderActions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding: 2px 8px 6px;

      > .el-button {
        margin-left: 0;
      }

      .modelPopover {
        flex: 1;
        margin-right: auto;
      }

      .contextButton {
        width: 24px;
        height: 24px;
        margin: 0;
        padding: 0;

        &.is-text {
          background-color: transparent;
        }
      }

      .sendButton {
        width: 34px;
        height: 34px;
        border: none;
        transform: translateY(-2px);
      }
    }
  }

}
.agentContextPopover {
  .contextUsage {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .contextStats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contextHeader,
    .contextTokens {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .contextHeader {
      color: var(--el-text-color-primary);
    }

    .contextTokens {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .contextHint {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}
</style>
