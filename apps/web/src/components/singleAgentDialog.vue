<template>
  <el-dialog
    v-model="visible"
    class="singleAgentDialog"
    :title="title"
    :width="slots.aside ? 'min(1240px, calc(100vw - 32px))' : 'min(800px, calc(100vw - 32px))'"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false">
    <div class="singleAgentBody" :class="{ withAside: !!slots.aside }">
      <div class="conversationColumn">
        <div ref="messageList" class="messageList" role="region" aria-label="对话消息" tabindex="0" @scroll="updateFollowing">
          <article v-for="message in msgList" :key="message.id" class="messageItem" :class="{ userMessage: message.role === 'user' }" :aria-label="message.role === 'user' ? '我的消息' : '助手回复'">
            <div v-if="message.role === 'user'" class="userContent">{{ message.content }}</div>
            <messageMarkdown v-else-if="!message.parts?.length && message.content" :content="message.content" :streaming="!!message.streaming" :directory="sessionDirectory" />
            <template v-for="part in message.parts" :key="part.id">
              <details v-if="part.type === 'thinking' && part.content" class="thinkingContent">
                <summary>思考<span v-if="part.duration !== undefined"> · {{ part.duration.toFixed(1) }} 秒</span></summary>
                <messageMarkdown :content="part.content" :streaming="!!message.streaming" :directory="sessionDirectory" />
              </details>
              <slot v-else-if="part.type === 'tool'" name="tool" :tool="part.tool" :sessionId="sessionId" :status="status" :pause="pause" :resume="resume">
                <toolMessage v-model:collapsed="part.collapsed" :tool="part.tool" :directory="sessionDirectory" :toolSessionId="sessionId || undefined" @copy="copyMessage" />
              </slot>
              <messageMarkdown v-else-if="part.type === 'text' && part.content" :content="part.content" :streaming="!!message.streaming" :directory="sessionDirectory" />
            </template>
            <span v-if="message.streaming && !message.parts?.length && !message.content" class="replyPending" role="status">正在处理…</span>
            <div v-if="message.error" class="messageError" role="alert">{{ message.error }}</div>
          </article>
        </div>
        <div class="composerArea">
          <div v-if="formError" class="formError" role="alert">{{ formError }}</div>
          <div class="messageComposer">
            <el-input v-model="draft" type="textarea" :rows="3" resize="none" :placeholder="placeholder" :disabled="busy" aria-label="对话消息输入" @keydown="handleInputKeydown" />
            <div class="composerActions">
              <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" :active="visible" :disabled="busy" />
              <span v-if="status !== 'idle'" class="executionStatus" :class="{ pausedStatus: status === 'paused' }" role="status" aria-live="polite">{{ statusLabels[status] }}</span>
              <div class="executionActions">
                <el-button v-if="status === 'running'" text :icon="IconPlayerPause" @click="pause">暂停</el-button>
                <el-button v-if="status === 'pausing' || status === 'paused'" text :icon="IconPlayerPlay" @click="resume">继续</el-button>
                <el-button v-if="busy" class="sendButton" type="primary" circle aria-label="停止生成" title="停止生成" @click="stop"><icon-player-stop-filled :size="14" /></el-button>
                <el-button v-else class="sendButton" type="primary" circle :disabled="!draft.trim() || !selectedModel" aria-label="发送消息" title="发送消息" @click="send()"><icon-arrow-up :size="16" /></el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside v-if="slots.aside" class="auxiliaryArea">
        <slot name="aside" v-bind="slotContext" />
      </aside>
    </div>
    <template v-if="slots.footer" #footer><slot name="footer" v-bind="slotContext" /></template>
  </el-dialog>
</template>

<script lang="ts">
import type { SingleAgentToolDescriptor, SingleAgentToolReference, SingleAgentToolResult, SingleAgentResult } from "@toonflow/server/singleAgent/types";
import type { AgentMessage } from "./agent/types";

export type SingleAgentTool = SingleAgentToolReference | (SingleAgentToolDescriptor & {
  execute(id: string, args: Record<string, unknown>, signal: AbortSignal, onUpdate: (result: SingleAgentToolResult) => void): SingleAgentToolResult | Promise<SingleAgentToolResult>;
});
export type SingleAgentDialogResult = SingleAgentResult & { messages: AgentMessage[] };
</script>

<script setup lang="ts">
import axios from "axios";
import { computed, nextTick, onBeforeUnmount, reactive, ref, useSlots, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconArrowUp, IconPlayerPause, IconPlayerPlay, IconPlayerStopFilled } from "@tabler/icons-vue";
import type { SingleAgentEvent } from "@toonflow/server/singleAgent/types";
import type { ToolCall } from "@toonflow/tools-scaffold/runtime";
import modelPopover from "@/components/modelPopover.vue";
import messageMarkdown from "@/components/messageMarkdown.vue";
import toolMessage from "./agent/toolMessage.vue";
import { createReplyStream, readAgentEvents } from "./agent/replyStream";
import { modelChoices } from "@/stores/settings";
import { writeClipboardText } from "@/lib/clipboard";

const props = withDefaults(defineProps<{
  tools?: SingleAgentTool[];
  systemPrompt?: string;
  initialMessage?: string;
  directory?: string;
  title?: string;
  placeholder?: string;
}>(), { tools: () => [], systemPrompt: "", initialMessage: "", title: "Agent 对话", placeholder: "输入消息" });
const visible = defineModel<boolean>({ default: false });
const msgList = defineModel<AgentMessage[]>("msgList", { default: () => [] });
const selectedModel = defineModel<string>("model", { default: "" });
const thinkingLevel = defineModel<"off" | "low" | "medium" | "high">("thinkingLevel", { default: "off" });
const emit = defineEmits<{
  complete: [result: SingleAgentDialogResult];
  error: [error: Error];
  toolEvent: [event: Extract<SingleAgentEvent, { type: "tool" | "toolResult" | "clientTool" }>];
  statusChange: [status: "idle" | "running" | "pausing" | "paused"];
}>();
const slots = useSlots();
const draft = ref("");
const formError = ref("");
const sessionId = ref("");
const sessionDirectory = ref<string>();
const status = ref<"idle" | "running" | "pausing" | "paused">("idle");
const busy = ref(false);
const messageList = ref<HTMLElement>();
const tools = computed<ToolCall[]>(() => msgList.value.flatMap(message => message.parts?.flatMap(part => part.type === "tool" ? [part.tool] : []) ?? []));
const reasoningEffort = computed({ get: () => thinkingLevel.value === "off" ? "" : thinkingLevel.value, set: value => { thinkingLevel.value = value as typeof thinkingLevel.value || "off"; } });
const statusLabels = { idle: "", running: "执行中", pausing: "等待当前操作结束…", paused: "已暂停，可人工操作" };
const requestHeaders = { "x-toonflow-workspace": "1" };
let lifecycle = new AbortController();
let turnController: AbortController | undefined;
let turnId: string | undefined;
let stopping: Promise<void> | undefined;
let preparing: Promise<string> | undefined;
let activeTools: SingleAgentTool[] = [];
let following = true;

function changeStatus(value: typeof status.value) {
  if (status.value === value) return;
  status.value = value;
  emit("statusChange", value);
}

function reportError(error: unknown) {
  const message = axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "对话执行失败";
  const reason = new Error(message);
  formError.value = message;
  emit("error", reason);
  return reason;
}

async function closeSession(id: string) {
  if (!id) return;
  const response = await fetch("/api/singleAgent/control", {
    method: "POST", headers: { ...requestHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: id, action: "close" }), keepalive: true,
  });
  if (!response.ok && response.status !== 404) throw new Error("临时会话清理失败");
}

async function ensureSession(owner: AbortController, signal: AbortSignal) {
  if (sessionId.value) return sessionId.value;
  if (preparing) return preparing;
  activeTools = [...props.tools];
  sessionDirectory.value = props.directory;
  preparing = axios.post<{ data: { sessionId: string } }>("/api/singleAgent/create", {
    systemPrompt: props.systemPrompt, directory: sessionDirectory.value,
    tools: activeTools.map(tool => typeof tool === "object" && "execute" in tool
      ? { name: tool.name, label: tool.label, description: tool.description, parameters: tool.parameters, executionMode: tool.executionMode }
      : tool),
  }, { headers: requestHeaders, signal }).then(async ({ data }) => {
    const id = data.data.sessionId;
    if (owner.signal.aborted || lifecycle !== owner) {
      await closeSession(id);
      throw new DOMException("对话已关闭", "AbortError");
    }
    sessionId.value = id;
    return id;
  });
  const pending = preparing;
  try { return await pending; }
  finally { if (preparing === pending) preparing = undefined; }
}

async function executeClientTool(event: Extract<SingleAgentEvent, { type: "clientTool" }>, id: string, signal: AbortSignal, owner: AbortController, controller: AbortController) {
  const tool = activeTools.find((item): item is Exclude<SingleAgentTool, SingleAgentToolReference> => typeof item === "object" && "execute" in item && item.name === event.name);
  const sendResult = async (body: Record<string, unknown>) => {
    signal.throwIfAborted();
    await axios.post("/api/singleAgent/toolResult", { sessionId: id, callId: event.callId, ...body }, { headers: requestHeaders, signal });
  };
  let updates = Promise.resolve();
  let acceptingUpdates = true;
  try {
    if (!tool) throw new Error(`未找到工具：${event.name}`);
    const result = await tool.execute(event.toolCallId, event.args, signal, partial => {
      if (!acceptingUpdates || signal.aborted) return;
      updates = updates.then(() => sendResult({ result: partial, partial: true }));
      // ACT: 增量按顺序回传；失败在最终结果前统一上报，不产生未处理的 Promise。
      void updates.catch(() => {});
    });
    acceptingUpdates = false;
    await updates;
    await sendResult({ result });
  } catch (error) {
    acceptingUpdates = false;
    if (signal.aborted) return;
    try { await sendResult({ error: error instanceof Error ? error.message : "工具执行失败" }); }
    catch (reason) {
      if (!signal.aborted && lifecycle === owner && turnController === controller) {
        reportError(reason);
        controller.abort();
      }
    }
  }
}

async function send(content = draft.value) {
  const prompt = content.trim();
  if (busy.value || !visible.value || !prompt) return;
  const model = modelChoices.value.find(item => item.value === selectedModel.value);
  if (!model) { reportError(new Error("请选择已配置的文本模型")); return; }
  busy.value = true;
  formError.value = "";
  const owner = lifecycle;
  const controller = new AbortController();
  turnController = controller;
  const signal = AbortSignal.any([owner.signal, controller.signal]);
  const reply = reactive<AgentMessage>({ id: crypto.randomUUID(), role: "assistant", content: "", parts: [], streaming: true });
  turnId = reply.id;
  const stream = createReplyStream(reply);
  let accepted = false;
  try {
    const id = await ensureSession(owner, signal);
    signal.throwIfAborted();
    changeStatus("running");
    following = true;
    msgList.value = [...msgList.value, { id: crypto.randomUUID(), role: "user", content: prompt }, reply];
    draft.value = "";
    accepted = true;
    const response = await fetch("/api/singleAgent/run", {
      method: "POST", headers: { ...requestHeaders, "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ sessionId: id, runId: reply.id, prompt, providerId: model.providerId, modelId: model.modelId, thinkingLevel: thinkingLevel.value }),
    });
    for await (const event of readAgentEvents<SingleAgentEvent>(response, signal)) {
      if (lifecycle !== owner) break;
      if (event.type === "text" || event.type === "thinking" || event.type === "tool" || event.type === "question") stream.receive(event);
      if (event.type === "status") changeStatus(event.status);
      if (event.type === "tool" || event.type === "toolResult" || event.type === "clientTool") emit("toolEvent", event);
      if (event.type === "clientTool") void executeClientTool(event, id, signal, owner, controller);
      if (event.type === "complete") {
        stream.finish();
        emit("complete", { text: event.text, toolResults: event.toolResults, messages: JSON.parse(JSON.stringify(msgList.value)) });
      }
    }
  } catch (error) {
    if (lifecycle !== owner || owner.signal.aborted) return;
    if (controller.signal.aborted) {
      if (accepted) reply.error = "已停止";
    } else {
      const reason = reportError(error);
      if (accepted) reply.error = reason.message;
    }
  } finally {
    controller.abort();
    stream.finish();
    const pendingStop = lifecycle === owner ? stopping : undefined;
    if (pendingStop) await pendingStop;
    if (lifecycle === owner && turnController === controller) {
      turnController = undefined;
      turnId = undefined;
      busy.value = false;
      changeStatus("idle");
    }
  }
}

async function control(action: "pause" | "resume" | "stop") {
  if (!busy.value || !sessionId.value) return;
  const owner = lifecycle;
  const controller = turnController;
  try {
    // ACT: 状态以有序回复流为准，避免较晚返回的暂停请求覆盖已恢复的状态。
    await axios.post("/api/singleAgent/control", { sessionId: sessionId.value, runId: turnId, action }, { headers: requestHeaders, signal: owner.signal });
  } catch (error) { if (!owner.signal.aborted && lifecycle === owner && turnController === controller) reportError(error); }
}

function pause() { return control("pause"); }
function resume() { return control("resume"); }
function stop() {
  if (stopping || !busy.value) return;
  const controller = turnController;
  const pending = control("stop");
  stopping = pending;
  controller?.abort();
  void pending.finally(() => { if (stopping === pending) stopping = undefined; });
}

async function copyMessage(content: string) {
  try { await writeClipboardText(content); }
  catch { ElMessage.error("复制失败"); }
}

function updateFollowing() {
  const element = messageList.value;
  following = !element || element.scrollHeight - element.scrollTop - element.clientHeight < 48;
}

function handleInputKeydown(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent) || event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  void send();
}

function reset() {
  lifecycle.abort();
  turnController?.abort();
  const id = sessionId.value;
  if (id) void closeSession(id).catch(error => { emit("error", error instanceof Error ? error : new Error("临时会话清理失败")); });
  lifecycle = new AbortController();
  preparing = undefined;
  turnController = undefined;
  turnId = undefined;
  stopping = undefined;
  sessionId.value = "";
  sessionDirectory.value = undefined;
  activeTools = [];
  draft.value = props.initialMessage;
  formError.value = "";
  busy.value = false;
  following = true;
  changeStatus("idle");
}

const slotContext = computed(() => ({ sessionId: sessionId.value, directory: sessionDirectory.value, messages: msgList.value, tools: tools.value, status: status.value, busy: busy.value, send, pause, resume, stop }));
watch(visible, () => { reset(); }, { immediate: true });
watch(msgList, async () => {
  if (!following) return;
  await nextTick();
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight });
}, { deep: true });
onBeforeUnmount(reset);
defineExpose({ send, pause, resume, stop, sessionId, msgList, tools, status });
</script>

<style lang="scss">
.singleAgentDialog.el-dialog {
  display: flex;
  height: min(780px, calc(100dvh - 48px));
  flex-direction: column;
  overflow: hidden;

  .el-dialog__header, .el-dialog__footer { flex-shrink: 0; }
  .el-dialog__body { display: flex; flex: 1; min-height: 0; }

  .singleAgentBody {
    display: grid;
    flex: 1;
    min-width: 0;
    min-height: 0;
    gap: 24px;

    &.withAside { grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); }

    .conversationColumn {
      display: flex;
      min-width: 0;
      min-height: 0;
      flex-direction: column;
      overflow: hidden;

      .messageList {
        flex: 1;
        min-height: 0;
        overflow: auto;
        overscroll-behavior: contain;
        padding: 8px 4px 20px;
        font-size: 13px;
        line-height: 1.6;
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }

        .messageItem {
          margin-bottom: 16px;
          overflow-wrap: anywhere;
          &:last-child { margin-bottom: 0; }
          &.userMessage { display: flex; flex-direction: column; align-items: flex-end; }

          .userContent {
            max-width: 80%;
            padding: 6px 10px;
            border-radius: var(--el-border-radius-base);
            background: color-mix(in srgb, var(--el-text-color-secondary) 12%, var(--el-bg-color));
            white-space: pre-wrap;
          }
          .thinkingContent {
            margin: 10px 0;
            summary { width: fit-content; color: var(--el-text-color-secondary); font-size: 12px; cursor: pointer; }
            &[open] summary { margin-bottom: 8px; }
          }
          .replyPending { color: var(--el-text-color-secondary); }
          .messageError { margin-top: 8px; color: var(--el-color-danger); }
        }
      }

      .composerArea {
        flex-shrink: 0;
        padding: 8px 2px 2px;

        .formError { max-height: 80px; margin-bottom: 10px; overflow: auto; color: var(--el-color-danger); overflow-wrap: anywhere; }
        .messageComposer {
          border: 1px solid var(--el-border-color-light);
          border-radius: calc(var(--ui-radius) * 2.75);
          background: var(--el-bg-color);
          box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
          transition: border-color .2s;
          &:focus-within { border-color: var(--el-color-primary-light-5); }

          .el-textarea__inner {
            min-height: 80px;
            padding: 12px 12px 4px;
            background: transparent;
            box-shadow: none;
            line-height: 24px;
          }
          .composerActions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            padding: 2px 8px 6px;

            .modelPopover { flex: 1; min-width: 120px; }
            .executionStatus { color: var(--el-text-color-secondary); font-size: 12px; &.pausedStatus { color: var(--el-color-warning); } }
            .executionActions {
              display: flex;
              flex-shrink: 0;
              align-items: center;
              gap: 4px;
              margin-left: auto;
              .el-button { margin: 0; padding-inline: 10px; }
              .sendButton { width: 34px; height: 34px; padding: 0; border: none; }
            }
          }
        }
      }
    }

    .auxiliaryArea { min-width: 0; min-height: 0; overflow: hidden; }
  }

  @media (max-width: 960px) {
    .singleAgentBody.withAside {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      .conversationColumn { flex-shrink: 0; height: 380px; }
      .auxiliaryArea { flex-shrink: 0; min-height: 280px; overflow: visible; }
    }
  }
  @media (max-width: 480px) {
    .singleAgentBody { gap: 16px; }
  }
}
</style>
