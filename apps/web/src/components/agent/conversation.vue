<template>
  <div class="agentConversation">
    <messageList
      ref="messageView"
      :messages="messages"
      :directory="directory"
      :active="active"
      :disabled="disabled"
      :locked="locked"
      :busy="busy"
      :remoteRunning="remoteRunning"
      :compacting="compacting"
      :editingId="editingId"
      :deletingId="deletingId"
      :branchingId="branchingId"
      :voiceActive="voiceActive"
      @fillPrompt="input?.fillPrompt($event)"
      @copy="copyMessage"
      @edit="input?.editMessage($event)"
      @branch="!locked && !remoteRunning && emit('branch', $event)"
      @delete="deleteMessage"
      @cancelEdit="input?.cancelEdit()" />
    <div v-if="compacting" class="compactionStatus" role="status">
      <el-icon class="is-loading" aria-hidden="true"><icon-loader-2 :size="14" /></el-icon>
      <span>正在压缩上下文…</span>
    </div>
    <goalBar v-if="goal && goal.status !== 'completed'" :goal="goal" :disabled="queueLocked" :busy="busy || remoteRunning" @command="applyCommand($event)" />
    <automationBar v-if="active && !disabled && !initialSession?.parentFile && !reviewQuestion && automations.length"
      :tasks="automations" :sessionFile="sessionFile" :cancelling="cancellingAutomation" @open="openAutomations(false)" @cancel="emit('cancelAutomation', $event)" />
    <section v-if="queuedMessages.length" class="messageQueue" aria-label="排队消息">
      <div v-for="message in queuedMessages" :key="message.id" class="queueMessage">
        <icon-list-details class="queueIcon" :size="14" aria-hidden="true" />
        <p class="queueContent" :title="message.content">{{ message.content }}</p>
        <div class="queueActions">
          <el-button class="queueSteer" text size="small" :disabled="queueLocked" :loading="queueAction?.id === message.id && queueAction.type === 'steer'" title="发送引导，按这条消息继续当前任务，已完成的操作不会撤销" @click="updateQueuedMessage(message, 'steer')">
            <icon-corner-down-right v-if="!(queueAction?.id === message.id && queueAction.type === 'steer')" :size="14" aria-hidden="true" />
            <span>引导</span>
          </el-button>
          <el-button class="queueIconButton" text circle :disabled="queueLocked" :loading="queueAction?.id === message.id && queueAction.type === 'delete'" aria-label="删除排队消息" title="删除" @click="updateQueuedMessage(message, 'delete')"><icon-trash v-if="!(queueAction?.id === message.id && queueAction.type === 'delete')" :size="14" /></el-button>
          <el-button class="queueIconButton" text circle :disabled="queueLocked" :loading="queueAction?.id === message.id && queueAction.type === 'edit'" aria-label="编辑排队消息" title="编辑，暂时移出队列" @click="updateQueuedMessage(message, 'edit')"><icon-pencil v-if="!(queueAction?.id === message.id && queueAction.type === 'edit')" :size="14" /></el-button>
        </div>
      </div>
    </section>
    <planReview v-if="reviewQuestion && directory" :key="reviewQuestion.callId" :question="reviewQuestion" :directory="directory" @answered="answeredReview = $event" />
    <messageInput
      v-show="!reviewQuestion"
      ref="input"
      v-model:selectedModel="selectedModel"
      v-model:reasoningEffort="reasoningEffort"
      v-model:editingId="editingId"
      v-model:voiceActive="voiceActive"
      v-model:restoringAttachment="restoringAttachment"
      :active="active && !reviewQuestion"
      :planActive="planActive"
      :commandsEnabled="!initialSession?.parentFile"
      :disabled="disabled || compacting || (busy && (!sessionFile || !remoteRunning))"
      :busy="busy"
      :submitting="submitting"
      :remoteRunning="remoteRunning"
      :stopping="stopping || projectStops > 0"
      :deletingId="deletingId"
      :directory="directory"
      :contextUsage="contextUsage"
      :stats="stats"
      :contextWindow="contextWindow"
      @submit="submitMessage"
      @compact="compactContext"
      @automations="openAutomations"
      @exitPlan="applyCommand({ action: 'plan', enabled: false })"
      @stop="stopMessage" />
  </div>
</template>

<script setup lang="ts">
import { locale, translate } from "@toonflow/i18n/vue";
import { computed, inject, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import axios from "axios";
import { IconCornerDownRight, IconListDetails, IconLoader2, IconPencil, IconTrash } from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import { getReadableFileExtension, getReadableFileMimeType } from "@toonflow/server/documentFormats";
import { useNodeModelSelection } from "@toonflow/nodes-scaffold/nodeAi";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import http from "@/lib/http";
import { onAgentStopped, stopAgent } from "@/lib/agentControl";
import { writeClipboardText } from "@/lib/clipboard";
import { showNotification } from "@/lib/notification";
import anonymousData from "@/lib/anonymousData";
import { modelChoices, refreshModelChoices } from "@/stores/settings";
import { useWorkspaceStore } from "@/stores/workspace";
import type { AgentAttachment, AgentAutomationEntry, AgentConversation, AgentMessage } from "./types";
import type { AgentAutomation, AgentCommand, AgentEvent, AgentGoal, AgentPlan, AgentQueue, AgentQueuedMessage } from "@toonflow/server/agent/types";
import { createConversationStream, createReplyStream, readAgentEvents } from "./replyStream";
import { mentionPlainText } from "./mentionText";
import type { CanvasContext } from "@toonflow/tool-canvas/runtime";
import messageList from "./conversation/messageList.vue";
import messageInput from "./conversation/messageInput.vue";
import goalBar from "./conversation/goalBar.vue";
import automationBar from "./conversation/automationBar.vue";
import planReview from "./conversation/planReview.vue";

const props = defineProps<{ active: boolean; initialSession: AgentConversation | null; initialModel?: string; sessionFile?: string; automations: AgentAutomation[]; cancellingAutomation: boolean; disabled: boolean; branchingId?: string }>();
const emit = defineEmits<{ session: [file: string]; sent: [prompt: string]; event: [event: AgentEvent]; branch: [message: AgentMessage]; automations: [entry: AgentAutomationEntry]; automationsChanged: []; cancelAutomation: [task: AgentAutomation] }>();
const workspaceStore = useWorkspaceStore();
const directory = workspaceStore.project?.directory;
const createCanvasContext = inject<(() => CanvasContext | undefined) | undefined>("canvas", undefined);
const messages = ref<AgentMessage[]>((props.initialSession?.messages ?? []).map(message => ({ ...message })));
const planActive = ref(props.initialSession?.plan?.active ?? false);
const goal = ref<AgentGoal | null>(props.initialSession?.goal ?? null);
const answeredReview = ref("");
const reviewQuestion = computed(() => {
  if (!remoteRunning.value) return;
  for (let index = messages.value.length - 1; index >= 0; index--) {
    const part = messages.value[index]?.parts?.findLast(item => item.type === "tool" && item.tool.name === "exit_plan_mode" && item.tool.status === "running" && item.tool.question);
    if (part?.type === "tool" && part.tool.question?.callId !== answeredReview.value) return part.tool.question;
  }
});
const stream = createConversationStream(messages);
const remoteRunning = ref(props.initialSession?.running ?? false);
const stats = ref(props.initialSession?.stats);
const contextUsage = ref(props.initialSession?.contextUsage);
const busy = ref(false);
const submitting = ref(false);
const queue = ref<AgentQueue>(props.initialSession?.queue ?? { runId: "", revision: 0, steering: [], followUp: [] });
const queueAction = ref<{ id: string; type: "steer" | "delete" | "edit" }>();
const queuedMessages = computed(() => queue.value.followUp);
const stopping = ref(false);
const projectStops = ref(0);
const compacting = ref(false);
const deletingId = ref<string>();
const restoringAttachment = ref(false);
const input = ref<InstanceType<typeof messageInput>>();
const messageView = ref<InstanceType<typeof messageList>>();
const voiceActive = ref(false);
const locked = computed(() => props.disabled || busy.value || submitting.value || stopping.value || projectStops.value > 0 || deletingId.value !== undefined || restoringAttachment.value || voiceActive.value);
const editingId = ref<string>();
const queueLocked = computed(() => !props.active || props.disabled || submitting.value || stopping.value || projectStops.value > 0
  || compacting.value || deletingId.value !== undefined || restoringAttachment.value || voiceActive.value || editingId.value !== undefined);
let controller: AbortController | undefined;
let queueController: AbortController | undefined;
let commandController: AbortController | undefined;
let goalEpoch = 0;
let runId = props.initialSession?.runId;
let scheduledRunId = props.initialSession?.scheduled ? runId : undefined;
// 新一轮结束后仍保留标识，避免旧 HTTP 流重新取得回复归并权。
let lastSessionRunId = runId;
const pendingRunIds = new Set<string>();
let connected = false;
let receivingForwardedStream = false;
const pendingMessage = props.initialSession?.parentFile ? undefined : workspaceStore.pendingAgentMessage;
const selectedModel = ref(pendingMessage?.model ?? (props.initialSession?.providerId && props.initialSession.modelId
  ? JSON.stringify([props.initialSession.providerId, props.initialSession.modelId]) : props.initialModel ?? ""));
const reasoningEffort = ref(pendingMessage?.reasoningEffort ?? props.initialSession?.thinkingLevel ?? "");
function openAutomations(timer: boolean, token?: string, prompt?: string, runTaskId?: string) {
  emit("automations", { timer, token, prompt, runTaskId, model: selectedModel.value, thinking: reasoningEffort.value });
}
const selectedModelChoice = useNodeModelSelection(modelChoices, selectedModel);
const contextWindow = computed(() => contextUsage.value?.contextWindow ?? selectedModelChoice.value?.contextWindow ?? 262144);
function showSteeringMessage(message: AgentQueuedMessage) {
  if (messages.value.some(item => item.role === "user" && (item.queueId === message.id || item.id === message.id))) return;
  const user = messages.value.findLast(item => item.role === "user");
  messages.value.push({
    id: message.id, queueId: message.id, role: "user", content: message.content,
    delivery: { mode: "steer", taskMessageId: user?.delivery?.taskMessageId ?? user?.entryId ?? user?.id ?? message.id },
  });
}

for (const message of queue.value.steering) showSteeringMessage(message);

function applyQueue(next: AgentQueue) {
  if (!runId || next.runId !== runId || (next.runId === queue.value.runId && next.revision <= queue.value.revision)) return;
  queue.value = { runId: next.runId, revision: next.revision, steering: next.steering, followUp: next.followUp };
  for (const message of next.steering) showSteeringMessage(message);
}

function clearQueue() {
  queue.value = { ...queue.value, steering: [], followUp: [] };
}

function applyEvent(event: AgentEvent) {
  switch (event.type) {
    case "plan": planActive.value = event.plan.active; break;
    case "goal": goalEpoch++; goal.value = event.goal; break;
    case "subAgent":
    case "subAgentEvent": emit("event", event); break;
    case "report":
      if (event.parentFile !== props.sessionFile) { emit("event", event); break; }
      if (!messages.value.some(message => message.id === event.id)) messages.value.push({
        id: event.id, role: "assistant", content: event.content,
        parts: [{ id: event.id, type: "text", content: event.content }], report: { file: event.file, name: event.name },
      });
      break;
    case "agentMessage":
      if (event.toFile !== props.sessionFile) { emit("event", event); break; }
      if (!messages.value.some(message => message.id === event.id)) messages.value.push({
        id: event.id, role: "assistant", content: event.content,
        parts: [{ id: event.id, type: "text", content: event.content }],
        agentMessage: { fromFile: event.fromFile, fromName: event.fromName, toFile: event.toFile, toName: event.toName, startsTurn: event.startsTurn },
      });
      if (event.startsTurn) stream.receive(event);
      break;
    case "compaction": compacting.value = event.active; break;
    case "queue": applyQueue(event); break;
    case "session":
      if (runId !== event.runId) {
        stream.finish();
        for (const message of messages.value) {
          if (message.role === "assistant" && message.streaming) createReplyStream(message).finish();
        }
        compacting.value = false;
        clearQueue();
      }
      runId = event.runId;
      lastSessionRunId = event.runId;
      emit("session", event.file);
      break;
    case "stats": stats.value = event.stats; contextUsage.value = event.contextUsage; break;
    default: stream.receive(event);
  }
}

function receiveEvent(event: AgentEvent) {
  if (event.type === "done" || event.type === "error") {
    receivingForwardedStream = false;
    remoteRunning.value = false;
    runId = undefined;
    compacting.value = false;
    clearQueue();
  } else if (["session", "userMessage", "text", "thinking", "tool", "queue", "compaction", "stats"].includes(event.type)) {
    receivingForwardedStream = true;
    if (["session", "userMessage", "text", "thinking", "tool"].includes(event.type)) remoteRunning.value = true;
  }
  applyEvent(event);
  if (event.type === "done" || event.type === "error") {
    // 历史快照尚未接入实时归并器时，也要结束其中保留的生成状态。
    for (const message of messages.value) {
      if (message.role === "assistant" && message.streaming) createReplyStream(message).finish();
    }
  }
}

function canRefreshAutomation() {
  return !controller && !submitting.value && !stopping.value && !projectStops.value && !receivingForwardedStream
    && !editingId.value && !deletingId.value && !restoringAttachment.value;
}

function refreshAutomation(session: AgentConversation) {
  if (!canRefreshAutomation() || session.running) return false;
  // 后台轮次只追加消息；保留未发送的草稿和仅在本地的失败消息。
  const known = new Map<string, AgentMessage>();
  const partialReplies = new Map<string, AgentMessage>();
  for (const message of messages.value) {
    known.set(message.id, message);
    if (message.entryId) known.set(message.entryId, message);
    if (message.role === "assistant" && !message.report && !message.agentMessage && message.replyTo
      && (!message.entryId || message.entryId === "streaming")) partialReplies.set(message.replyTo, message);
  }
  for (const message of session.messages) {
    const partial = message.role === "assistant" && !message.report && !message.agentMessage && message.replyTo ? partialReplies.get(message.replyTo) : undefined;
    const saved = known.get(message.entryId ?? message.id) ?? known.get(message.id) ?? partial;
    if (!saved) messages.value.push({ ...message });
    else {
      if (message.automation) saved.automation = message.automation;
      if (saved === partial) partialReplies.delete(message.replyTo!);
      if (saved.streaming || !saved.entryId || saved.entryId === "streaming") {
        Object.assign(saved, message, { id: saved.id === "streaming" ? message.id : saved.id, streaming: false });
      }
    }
  }
  messages.value = messages.value.filter(message => message.entryId !== "streaming");
  stats.value = session.stats;
  contextUsage.value = session.contextUsage;
  planActive.value = session.plan?.active ?? false;
  goal.value = session.goal ?? null;
  remoteRunning.value = false;
  runId = undefined;
  scheduledRunId = undefined;
  clearQueue();
  return true;
}

defineExpose({ receiveEvent, beginProjectStop, canRefreshAutomation, refreshAutomation, openAutomations, clearCommandText: (token?: string) => input.value?.clearCommandText(token),
  getRunId: () => runId, getSelectedModel: () => selectedModel.value,
  revealAutomationResult: (id: string) => messageView.value?.revealAutomationResult(id) });

function submitMessage(mode?: "steer" | "followUp") {
  const draft = input.value?.getDraft();
  const match = !editingId.value && !props.initialSession?.parentFile && draft?.prompt.trim().match(/^\/(plan|goal|compact)(?:\s+([\s\S]*))?$/);
  if (match) {
    const arg = match[2]?.trim() ?? "";
    const hasFiles = !!(draft?.attachments.length || draft?.mentionedIds.length);
    if (match[1] === "compact") {
      if (hasFiles) return ElMessage.warning("此命令仅支持文字");
      return compactContext(draft?.prompt, arg);
    }
    const current = goal.value;
    if (match[1] === "plan") {
      if (arg === "off" && hasFiles) return ElMessage.warning("此命令仅支持文字");
      return applyCommand({ action: "plan", enabled: arg !== "off" }, true, arg && arg !== "off" ? arg : hasFiles ? translate("请根据附件制定计划") : undefined);
    }
    if (!arg) return ElMessage.info(current?.objective ?? translate("输入 /goal 和目标内容来创建目标"));
    if (["pause", "resume", "clear"].includes(arg) || /^edit(?:\s|$)/.test(arg)) {
      if (!current) return ElMessage.warning("当前会话没有目标");
      if (hasFiles) return ElMessage.warning("此命令仅支持文字");
      const target = { id: current.id, revision: current.revision };
      if (arg === "pause" || arg === "resume" || arg === "clear") return applyCommand({ action: arg, ...target }, true);
      const objective = arg.slice(4).trim();
      if (!objective) return ElMessage.warning("请输入目标内容");
      return applyCommand({ action: "edit", objective, ...target }, true);
    }
    return applyCommand({ action: "create", objective: arg }, true);
  }
  if (busy.value || remoteRunning.value) return sendQueuedMessage(mode ?? "followUp");
  return sendMessage(editingId.value ? messages.value.find(item => item.id === editingId.value) : undefined);
}

async function compactContext(tokenToClear?: string, instructions = "") {
  if (queueLocked.value || props.initialSession?.parentFile || !directory) return;
  if (busy.value || remoteRunning.value) return ElMessage.warning("请先停止当前回复");
  const sessionFile = props.sessionFile;
  if (!sessionFile || !messages.value.length) return ElMessage.info("暂无可压缩的上下文");
  if (!selectedModelChoice.value) return ElMessage.warning("请先选择模型");

  const request = new AbortController();
  const requestRunId = crypto.randomUUID();
  controller = request;
  runId = requestRunId;
  busy.value = true;
  compacting.value = true;
  try {
    await refreshModelChoices(true, request.signal);
    request.signal.throwIfAborted();
    const model = selectedModelChoice.value;
    if (!model) throw new Error("请先选择模型");
    const response = await fetch("/api/agent", {
      method: "POST", signal: request.signal,
      headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ operation: "compact", prompt: instructions, directory, sessionFile, runId: requestRunId,
        providerId: model.providerId, modelId: model.modelId, thinkingLevel: reasoningEffort.value || undefined }),
    });
    connected = response.ok;
    for await (const event of readAgentEvents(response, request.signal)) {
      if (runId !== requestRunId) continue;
      if (event.type === "session") remoteRunning.value = true;
      if (event.type === "session" || event.type === "stats") applyEvent(event);
    }
    if (runId !== requestRunId || request.signal.aborted) return;
    await input.value?.clearCommandText(tokenToClear);
    if (props.active) ElMessage.success("上下文已压缩");
  } catch (error) {
    if (props.active && !request.signal.aborted && !stopping.value && !projectStops.value) ElMessage.error(error instanceof Error ? error.message : "请求失败");
  } finally {
    if (runId === requestRunId) {
      runId = undefined;
      remoteRunning.value = false;
      compacting.value = false;
    }
    busy.value = false;
    controller = undefined;
    connected = false;
  }
}

async function applyCommand(command: AgentCommand, fromInput = false, planPrompt?: string) {
  if (!directory || !input.value || queueLocked.value || props.initialSession?.parentFile) return;
  const startsGoal = command.action === "create" || command.action === "resume";
  if ((startsGoal || planPrompt) && (busy.value || remoteRunning.value)) return ElMessage.warning("请先停止当前回复");
  const draft = input.value.getDraft();
  const saveGoalOnly = command.action === "create" && !selectedModelChoice.value && !draft.attachments.length && !draft.mentionedIds.length;
  if ((startsGoal || planPrompt) && !selectedModelChoice.value && !saveGoalOnly) return ElMessage.warning("请先选择模型");
  const request = new AbortController();
  commandController = request;
  submitting.value = true;
  const epoch = goalEpoch;
  let file = props.sessionFile;
  let start: Pick<AgentGoal, "id" | "revision"> | undefined;
  try {
    if (!file) {
      const session = await http<AgentConversation>({ method: "POST", url: "/api/agent/create", data: { directory }, signal: request.signal });
      file = session.file;
      emit("session", file);
      await nextTick();
    }
    const state = await http<{ plan: AgentPlan; goal: AgentGoal | null }>({ method: "POST", url: "/api/agent/command",
      data: { directory, sessionFile: file, command }, signal: request.signal });
    planActive.value = state.plan.active;
    if (epoch === goalEpoch) goal.value = state.goal;
    if (startsGoal && state.goal && !saveGoalOnly) start = { id: state.goal.id, revision: state.goal.revision };
    if (fromInput && !start && !planPrompt) await input.value?.clearDraft();
  } catch (error) {
    if (!request.signal.aborted) {
      ElMessage.error(error instanceof Error ? error.message : "请求失败");
      if ((error as { status?: number }).status === 409 && file) {
        try {
          const session = await http<AgentConversation>({ method: "GET", url: "/api/agent/get", params: { directory, sessionFile: file }, signal: request.signal });
          if (goalEpoch === epoch) goal.value = session.goal ?? null;
          planActive.value = session.plan?.active ?? false;
        } catch { /* 保留原命令错误及草稿 */ }
      }
    }
    return;
  } finally {
    submitting.value = false;
    commandController = undefined;
  }
  if (request.signal.aborted || !props.active || props.sessionFile !== file) return;
  if (saveGoalOnly) { ElMessage.info("请先选择模型"); return; }
  if (start || planPrompt) await sendMessage(undefined, {
    prompt: planPrompt ?? (command.action === "create" ? `/goal ${command.objective}` : "/goal resume"),
    goalStart: start, preserveDraft: !fromInput,
  });
}

async function sendQueuedMessage(streamingBehavior: "steer" | "followUp") {
  const instance = input.value;
  const draft = instance?.getDraft();
  const prompt = draft?.prompt.trim();
  const model = selectedModelChoice.value;
  const expectedRunId = runId;
  const sessionFile = props.sessionFile;
  if (!props.active || props.disabled || submitting.value || stopping.value || projectStops.value > 0 || compacting.value
    || deletingId.value || restoringAttachment.value || voiceActive.value || editingId.value || !instance || !draft || !prompt) return;
  if (draft.attachments.length || draft.mentionedIds.length) return ElMessage.warning("生成中的排队和引导仅支持文字，附件和提及请在本轮结束后发送");
  if (!directory || !sessionFile || !expectedRunId) return ElMessage.warning("对话正在准备，请稍后发送");
  if (!model) return ElMessage.warning("请先选择模型");
  const requestController = new AbortController();
  const requestRunId = crypto.randomUUID();
  queueController = requestController;
  submitting.value = true;
  pendingRunIds.add(requestRunId);
  let accepted = false;
  try {
    await refreshModelChoices(true, requestController.signal);
    const currentModel = selectedModelChoice.value;
    if (!currentModel) throw new Error("请先选择模型");
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ prompt, directory, sessionFile, runId: requestRunId, expectedRunId,
        providerId: currentModel.providerId, modelId: currentModel.modelId, thinkingLevel: reasoningEffort.value || undefined, streamingBehavior }),
      signal: requestController.signal,
    });
    // 队列快照由原回复流发送；这个短请求只确认接收，不能结束或覆盖正在生成的回复。
    for await (const event of readAgentEvents(response, requestController.signal)) {
      if (event.type !== "accepted" || event.runId !== expectedRunId) continue;
      accepted = true;
      if (event.message?.mode === "steer") showSteeringMessage(event.message);
      const currentDraft = instance.getDraft();
      if (input.value === instance && currentDraft.prompt === draft.prompt && !currentDraft.attachments.length && !currentDraft.mentionedIds.length) {
        await instance.clearDraft();
      }
    }
    if (!accepted) throw new Error("服务端未确认接收，请重试");
  } catch (error) {
    if (!accepted && !requestController.signal.aborted) {
      let message = error instanceof Error ? error.message : "发送失败，请重试";
      let refreshed = false;
      if ((error as { terminal?: boolean })?.terminal && !controller && !busy.value && runId === expectedRunId) {
        try {
          const { data } = await axios.get<{ code: number; data: AgentConversation; message?: string }>("/api/agent/get", {
            params: { directory, sessionFile }, headers: { "x-toonflow-workspace": "1" }, signal: requestController.signal, timeout: 10000,
          });
          if (data.code !== 200) throw new Error(data.message || "读取对话失败");
          const session = data.data;
          if (!requestController.signal.aborted && !controller && !busy.value && runId === expectedRunId && props.sessionFile === sessionFile
            && input.value === instance && (!session.running || session.runId !== expectedRunId)) {
            stream.finish();
            messages.value = session.messages.map(message => ({ ...message }));
            stats.value = session.stats;
            contextUsage.value = session.contextUsage;
            remoteRunning.value = session.running ?? false;
            runId = session.runId;
            scheduledRunId = session.scheduled ? session.runId : undefined;
            receivingForwardedStream = false;
            compacting.value = false;
            queue.value = session.queue ?? { runId: session.runId ?? "", revision: 0, steering: [], followUp: [] };
            for (const message of queue.value.steering) showSteeringMessage(message);
            message = "会话状态已更新，草稿已保留，请重新发送";
            refreshed = true;
          }
        } catch {
          message += "；读取最新会话状态失败，请重新打开对话";
        }
      }
      if (!requestController.signal.aborted) {
        if (refreshed) ElMessage.warning(message);
        else ElMessage.error(message);
      }
    }
  } finally {
    pendingRunIds.delete(requestRunId);
    queueController = undefined;
    submitting.value = false;
  }
}

async function copyMessage(content: string) {
  try {
    await writeClipboardText(content);
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请重试");
  }
}

async function updateQueuedMessage(message: AgentQueuedMessage, action: "steer" | "delete" | "edit") {
  const instance = input.value;
  const draft = instance?.getDraft();
  const queueRunId = queue.value.runId;
  if (queueLocked.value || !instance || !draft || !directory || !props.sessionFile || !queueRunId || queueRunId !== runId) return;
  if (action === "edit" && (draft.prompt.trim() || draft.attachments.length || draft.mentionedIds.length)) {
    return ElMessage.warning("请先发送或清空输入框，再编辑排队消息");
  }
  submitting.value = true;
  queueAction.value = { id: message.id, type: action };
  try {
    // 队列操作不随停止生成中断，避免服务端已完成操作却丢失确认结果。
    const { data } = await axios<{ code: number; message?: string; data: {
      message?: AgentQueuedMessage; queue: AgentQueue;
    } }>({
      url: action === "steer" ? "/api/agent/queue/steer" : "/api/agent/queue",
      method: action === "steer" ? "POST" : "DELETE",
      data: { directory, sessionFile: props.sessionFile, runId: queueRunId, messageId: message.id },
      headers: { "x-toonflow-workspace": "1" },
      timeout: 10000,
    });
    if (data.code !== 200) throw new Error(data.message || "操作排队消息失败");
    applyQueue(data.data.queue);
    if (action === "steer") showSteeringMessage(data.data.message ?? message);
    if (action === "edit") await instance.fillQueuedMessage(data.data.message?.content ?? message.content);
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      if (action === "edit") {
        await instance.fillQueuedMessage(message.content);
        ElMessage.warning("取回结果未确认，文字已保留到输入框；原消息可能仍会执行，请核对对话后再发送");
      } else ElMessage.warning("操作结果未确认，请核对队列状态后重试");
    } else {
      const detail = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      ElMessage.error(detail || (error instanceof Error ? error.message : "操作排队消息失败"));
    }
  } finally {
    queueAction.value = undefined;
    submitting.value = false;
  }
}

async function deleteMessage(item: AgentMessage) {
  if (locked.value || remoteRunning.value || item.streaming || item.report || item.agentMessage) return;
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
    messages.value = messages.value.filter(message => message.id !== item.id &&
      !(item.replyTo && message.role === "assistant" && !message.report && !message.agentMessage && message.replyTo === item.replyTo));
  } catch (error) {
    const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
    ElMessage.error(message || (error instanceof Error ? error.message : "删除消息失败"));
  } finally {
    deletingId.value = undefined;
  }
}

function abortRequest() {
  if (controller) remoteRunning.value = true;
  controller?.abort();
  queueController?.abort();
  commandController?.abort();
}

function beginProjectStop() {
  const runIds = [...pendingRunIds, ...(runId ? [runId] : [])].filter(id => id !== scheduledRunId);
  const wasRunning = !!controller || remoteRunning.value;
  projectStops.value++;
  abortRequest();
  let finished = false;
  return {
    runIds,
    finish(success: boolean) {
      if (finished) return;
      finished = true;
      if (success) {
        for (const id of runIds) pendingRunIds.delete(id);
        // 项目停止已断开转发来源；本地主流仍由自己的 finally 收尾。
        if (!controller && (!runId || runId !== scheduledRunId)) receiveEvent({ type: "done" });
      }
      else if (wasRunning) remoteRunning.value = true;
      projectStops.value--;
    },
  };
}

async function stopMessage() {
  if (!directory || stopping.value || projectStops.value > 0 || (!controller && !remoteRunning.value)) return;
  const runIds = [...pendingRunIds, ...(runId ? [runId] : [])];
  stopping.value = true;
  queueController?.abort();
  // 已建立的流继续接收子任务结束事件；准备阶段先取消，避免停止后才发出请求。
  if (!connected) abortRequest();
  try {
    await stopAgent(directory, runIds);
    for (const id of runIds) pendingRunIds.delete(id);
    // 停止确认可能先于原流的最终文本和队列落盘事件，不能提前拆掉归并器。
    if ((!runId || runIds.includes(runId)) && !controller && !receivingForwardedStream) receiveEvent({ type: "done" });
  } catch (error) {
    remoteRunning.value = !!runId || pendingRunIds.size > 0;
    ElMessage.error(error instanceof Error ? error.message : "停止生成失败，请重试");
  } finally {
    stopping.value = false;
  }
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
    attachment.mimeType = getReadableFileMimeType(attachment.name, attachment.mimeType) ?? attachment.mimeType;
    const readableExtension = getReadableFileExtension(attachment.name, attachment.mimeType);
    const extension = readableExtension ? `.${readableExtension}` : attachment.name.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0].toLowerCase() ?? "";
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
    signal.throwIfAborted();
    if (!canvasContext) throw Object.assign(new Error("当前页面没有激活的画布"), { code: "CANVAS_UNAVAILABLE" });
    const result = await canvasContext.call(event, signal);
    body = JSON.stringify({ directory, callId: event.callId, result: result ?? null });
  } catch (error) {
    body = JSON.stringify({
      directory, callId: event.callId,
      error: (error instanceof Error && error.message ? error.message : translate("画布操作失败")).slice(0, 8000),
      unavailable: (error as { code?: string })?.code === "CANVAS_UNAVAILABLE",
      workspaceUnavailable: (error as { code?: string })?.code === "WORKSPACE_UNAVAILABLE",
    });
  }
  const cancelled = signal.aborted;
  if (cancelled) {
    const timedOut = signal.reason?.name === "TimeoutError";
    body = JSON.stringify({ directory, callId: event.callId, error: timedOut ? translate("画布操作超时") : translate("画布操作已取消"), cancelled: !timedOut });
  }
  try {
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
  } catch (error) {
    // 局部停止也可能发生在回传途中，不能因此断开父任务的流。
    if (!signal.aborted) throw error;
  }
}

async function sendMessage(source?: AgentMessage, command?: { prompt: string; goalStart?: Pick<AgentGoal, "id" | "revision">; preserveDraft: boolean }) {
  const instance = input.value;
  const draft = command?.preserveDraft ? undefined : instance?.getDraft();
  const editing = source && editingId.value === source.id;
  const prompt = (command?.prompt ?? (source && !editing ? source.content : (draft?.prompt ?? ""))).trim();
  const attachments = reactive((source && !editing ? source.attachments ?? [] : draft?.attachments ?? []).map(item => ({ ...item })));
  const mentionedIds = source && !editing ? (source.mentions ?? []).filter(mention => prompt.includes(`{{mention:${mention.id}}}`)).map(mention => mention.id)
    : draft?.mentionedIds ?? [];
  const references = source && !editing ? source.mentions ?? [] : draft?.mentions ?? [];
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
  const requestRunId = crypto.randomUUID();
  const wasRemoteRunning = remoteRunning.value;
  const initialSessionRunId = lastSessionRunId;
  const isSuperseded = () => lastSessionRunId !== initialSessionRunId && lastSessionRunId !== requestRunId;
  const canvasContext = createCanvasContext?.();
  controller = requestController;
  if (!remoteRunning.value) runId = requestRunId;
  connected = false;
  busy.value = true;
  compacting.value = false;
  const reply = reactive<AgentMessage>({ id: crypto.randomUUID(), role: "assistant", content: "", parts: [], streaming: true });
  const userMessage = reactive<AgentMessage>({ id: crypto.randomUUID(), role: "user", content: prompt, attachments, mentions });
  let ownsStream = !remoteRunning.value;
  let forwarded = false;
  if (!source) {
    messages.value.push(userMessage);
    if (ownsStream) messages.value.push(reply);
  }
  let accepted = false;
  if (ownsStream) stream.begin(reply);
  const handledCanvasCalls = new Set<string>();
  const pendingQuestions = new Map<string, string>();
  const notifiedQuestions = new Set<string>();
  // ACT: 保留到本流结束，停止后才读到的缓冲调用也不能再执行。
  const stoppedRunIds = new Set<string>();
  const canvasCalls = new Map<string, { controller: AbortController; runIds: string[]; promise: Promise<void> }>();
  let canvasError: Error | undefined;
  const unlistenStop = onAgentStopped(runIds => {
    for (const id of runIds) stoppedRunIds.add(id);
    for (const call of canvasCalls.values()) {
      if (call.runIds.some(id => stoppedRunIds.has(id))) call.controller.abort();
    }
  });
  const finishStats = anonymousData.startAgent();
  try {
    if (!source && !command?.preserveDraft) await instance.clearDraft();
    requestController.signal.throwIfAborted();
    await uploadAttachments(attachments, directory, requestController.signal);
    await refreshModelChoices(true, requestController.signal);
    const currentModel = selectedModelChoice.value;
    if (!currentModel) throw new Error("请先选择模型");
    if (!isSuperseded()) remoteRunning.value = true;
    pendingRunIds.add(requestRunId);
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ prompt, mentions, attachments: attachments.map(({ name, path, mimeType }) => ({ name, path, mimeType })), directory, runId: requestRunId, providerId: currentModel.providerId, modelId: currentModel.modelId, thinkingLevel: reasoningEffort.value || undefined, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, sessionFile: props.sessionFile, resendFrom, goalStart: command?.goalStart, canvas: canvasContext ? { id: canvasContext.id, tools: canvasContext.tools } : undefined }),
      signal: requestController.signal,
    });
    connected = response.ok;
    for await (const event of readAgentEvents(response, requestController.signal)) {
      if (isSuperseded() && !["subAgent", "subAgentEvent", "report", "agentMessage"].includes(event.type)) {
        if (event.type === "userMessage") {
          const existing = messages.value.find(message => message.role === "user"
            && (message.entryId === event.id || (event.queueId && message.queueId === event.queueId)));
          const message: AgentMessage = existing ?? (!accepted && !event.queueId ? userMessage : { id: event.id, role: "user", content: event.content ?? "" });
          Object.assign(message, { entryId: event.id, queueId: event.queueId ?? message.queueId, content: event.content ?? message.content, attachments: event.attachments, mentions: event.mentions, delivery: event.delivery });
          if (!existing && message !== userMessage) messages.value.push(message);
          if (message === userMessage) {
            if (!accepted) { reply.replyTo = event.id; reply.delivery = event.delivery; }
            accepted = true;
          }
        }
        continue;
      }
      // 子任务复用发起委派时的画布与取消通道，界面切换不改变工具执行目标。
      let toolEvent: AgentEvent = event;
      let scope = "";
      const canvasRunIds: string[] = [requestRunId];
      while (toolEvent.type === "subAgentEvent") {
        canvasRunIds.push(toolEvent.runId);
        scope += `${toolEvent.file}/`;
        toolEvent = toolEvent.event;
      }
      if (toolEvent.type === "question") {
        pendingQuestions.set(`${scope}${toolEvent.toolCallId}`, toolEvent.callId);
        if (!notifiedQuestions.has(toolEvent.callId) && !stopping.value && !projectStops.value
          && !requestController.signal.aborted && !canvasRunIds.some(id => stoppedRunIds.has(id))) {
          notifiedQuestions.add(toolEvent.callId);
          void showNotification({ title: "Toonflow", body: translate("工具正在等待你的确认") })
            .catch(error => console.warn("系统通知发送失败", error));
        }
      }
      if (toolEvent.type === "tool" && toolEvent.tool.status !== "running") {
        pendingQuestions.delete(`${scope}${toolEvent.tool.id}`);
        if (toolEvent.tool.name === "manageAutomation" && toolEvent.tool.status === "success") emit("automationsChanged");
        if (toolEvent.tool.name === "installMarketPlugin" && toolEvent.tool.status === "success" && toolEvent.tool.result) {
          const result = JSON.parse(toolEvent.tool.result);
          if (result.installed === true) {
            const { type, name } = result;
            window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type, name } }));
            if (type === "ext") window.dispatchEvent(new CustomEvent("toonflow:ext-updated", { detail: { name } }));
          }
        }
      }
      if (toolEvent.type === "canvasCall") {
        if (handledCanvasCalls.has(toolEvent.callId)) throw new Error("收到重复的画布调用");
        handledCanvasCalls.add(toolEvent.callId);
        const callId = toolEvent.callId;
        const callController = new AbortController();
        if (canvasRunIds.some(id => stoppedRunIds.has(id))) callController.abort();
        const callSignal = AbortSignal.any([requestController.signal, callController.signal,
          ...(toolEvent.name === "transcribeAudio" ? [] : [AbortSignal.timeout(toolEvent.name === "developPlugin" ? 360000 : 120000)])]);
        const promise = sendCanvasResult(toolEvent, canvasContext, callSignal)
          .catch(error => {
            if (requestController.signal.aborted) return;
            canvasError = error instanceof Error ? error : new Error("画布操作结果回传失败");
            requestController.abort(canvasError);
          })
          .finally(() => canvasCalls.delete(callId));
        canvasCalls.set(callId, { controller: callController, runIds: canvasRunIds, promise });
        continue;
      }
      switch (event.type) {
        case "accepted":
          runId = event.runId;
          remoteRunning.value = true;
          forwarded = true;
          if (event.message) {
            const existing = messages.value.find(message => message.role === "user" && message.queueId === event.message.id);
            if (existing && existing !== userMessage) messages.value = messages.value.filter(message => message !== userMessage);
            else {
              userMessage.queueId = event.message.id;
              if (event.message.mode === "steer" && !userMessage.entryId) {
                const previousUser = messages.value.findLast(message => message.role === "user" && message !== userMessage);
                userMessage.delivery = { mode: "steer", taskMessageId: previousUser?.delivery?.taskMessageId ?? previousUser?.entryId ?? previousUser?.id ?? event.message.id };
              }
            }
          }
          if (ownsStream) {
            stream.finish();
            messages.value = messages.value.filter(message => message !== reply);
          }
          break;
        case "userMessage":
          runId = requestRunId;
          remoteRunning.value = true;
          if (!accepted) {
            if (!ownsStream) {
              messages.value.push(reply);
              stream.begin(reply);
            }
            userMessage.entryId = event.id;
            userMessage.queueId = event.queueId;
            userMessage.delivery = event.delivery;
            reply.replyTo = event.id;
            reply.delivery = event.delivery;
            if (source) {
              messages.value.splice(resendIndex, messages.value.length - resendIndex, userMessage, reply);
              stats.value = undefined;
              contextUsage.value = undefined;
              await instance.restoreEditingDraft();
            }
            accepted = true;
            ownsStream = true;
          }
          applyEvent(event);
          break;
        case "stats":
          if (source && !accepted) break;
          applyEvent(event);
          break;
        default: applyEvent(event);
      }
    }
    await Promise.all([...canvasCalls.values()].map(call => call.promise));
    requestController.signal.throwIfAborted();
    if (ownsStream && !forwarded && !isSuperseded()) {
      remoteRunning.value = false;
      clearQueue();
    }
    pendingRunIds.delete(requestRunId);
    if (runId === requestRunId) runId = undefined;
    if (source && !accepted) throw new Error("服务端未确认重发，请重新打开对话后重试");
    finishStats("success");
    emit("sent", mentionPlainText(prompt, mentions) || attachments[0]?.name || "新对话");
    if (accepted && ownsStream && !forwarded && !isSuperseded() && !props.initialSession?.parentFile && !stopping.value && !projectStops.value
      && !requestController.signal.aborted && !stoppedRunIds.has(requestRunId)) {
      void showNotification({ title: "Toonflow", body: translate("Agent 已完成回复") })
        .catch(error => console.warn("系统通知发送失败", error));
    }
  } catch (error) {
    error = canvasError ?? error;
    if ((error as { terminal?: boolean })?.terminal) {
      pendingRunIds.delete(requestRunId);
      if (!isSuperseded() && (!wasRemoteRunning || runId === requestRunId)) {
        remoteRunning.value = false;
        runId = undefined;
        clearQueue();
      }
    }
    const cancelled = !canvasError && requestController.signal.aborted;
    finishStats(cancelled ? "cancelled" : "failed");
    const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    const message = cancelled || stoppedRunIds.has(requestRunId) ? translate("已停止生成") : responseMessage || (error instanceof Error ? error.message : translate("发送失败，请重试"));
    if ((source && !accepted) || !ownsStream) { userMessage.error = message; ElMessage.error(message); }
    else if (isSuperseded()) {
      reply.error = message;
      reply.streaming = false;
      if (!messages.value.includes(reply)) { userMessage.error = message; ElMessage.error(message); }
    }
    else stream.receive({ type: "error", message });
  } finally {
    for (const call of canvasCalls.values()) call.controller.abort();
    await Promise.all([...canvasCalls.values()].map(call => call.promise));
    unlistenStop();
    // ACT: Bun 的流断开事件可能不触发；主动结束仍在等待的提问，不依赖断开通知。
    for (const callId of pendingQuestions.values()) {
      void fetch("/api/agent/answer", {
        method: "POST", headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
        body: JSON.stringify({ directory, callId, cancelled: true }), keepalive: true,
      }).catch(() => {});
    }
    if (ownsStream && !forwarded && !isSuperseded()) stream.finish();
    if (!isSuperseded() && stoppedRunIds.has(requestRunId) && (!runId || runId === requestRunId)) {
      remoteRunning.value = false;
      runId = undefined;
      clearQueue();
    }
    if (!isSuperseded()) compacting.value = false;
    busy.value = false;
    controller = undefined;
    connected = false;
  }
}

watch(() => !props.initialSession?.parentFile && props.active && !locked.value && !!input.value && !!createCanvasContext?.()
  && (!(busy.value || remoteRunning.value) || !workspaceStore.pendingAgentMessage?.attachments?.length) ? workspaceStore.pendingAgentMessage : null, async message => {
  const instance = input.value;
  if (!message || !instance || message.directory !== directory) return;
  const filled = await instance.fillPrompt(message.prompt, message.attachments ?? []);
  if (!filled || input.value !== instance || !props.active || workspaceStore.pendingAgentMessage !== message) return;
  workspaceStore.pendingAgentMessage = null;
  void submitMessage();
}, { flush: "post" });

onBeforeUnmount(abortRequest);
</script>

<style lang="scss">
.agentConversation {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .compactionStatus {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 6px;
    margin: 0 12px 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .messageQueue {
    flex-shrink: 0;
    max-height: 160px;
    margin: 0 24px -1px;
    border: 1px solid var(--el-border-color-light);
    border-bottom: 0;
    border-radius: 14px 14px 0 0;
    background: var(--el-fill-color-extra-light);
    overflow-y: auto;

    .queueMessage {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      color: var(--el-text-color-regular);
      font-size: 12px;

      & + .queueMessage { border-top: 1px solid var(--el-border-color-extra-light); }

      .queueIcon {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
      }

      .queueContent {
        flex: 1;
        min-width: 0;
        margin: 0;
        overflow: hidden;
        line-height: 24px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .queueActions {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 2px;

        .el-button {
          height: 24px;
          margin: 0;
          color: var(--el-text-color-secondary);
        }

        .queueSteer {
          padding: 0 5px;

          > span { gap: 3px; }
        }

        .queueIconButton {
          width: 24px;
          padding: 0;
        }
      }
    }
  }
}
</style>
