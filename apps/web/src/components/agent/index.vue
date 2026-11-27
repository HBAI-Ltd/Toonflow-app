<template>
  <section v-show="visible" class="agent">
    <agentMenu
      :key="conversationKey"
      :name="name"
      :history="history"
      :sessionFile="sessionFile"
      :parentFile="selectedConversation?.parentFile"
      :subAgents="selectedConversation?.subAgents"
      :loading="loading || historyLoading"
      @open-sub-agent="selectConversation"
      @back="backToParent"
      @new-chat="newConversation"
      @history="loadHistory(!initialized)"
      @select="selectConversation"
      @rename="renameConversation"
      @remove="removeConversation"
      @close="visible = false">
      <template #actions>
        <el-button v-if="!multiTenantEnabled && !selectedConversation?.parentFile" text circle :disabled="!initialized || loading"
          :aria-label="automationLabel" :title="automationLabel" @click="conversationRefs.get(conversationKey)?.openAutomations(false)">
          <el-badge isDot :hidden="!unreadRuns.size" type="primary"><icon-calendar-clock :size="16" aria-hidden="true" /></el-badge>
        </el-button>
        <slot name="menuActions" />
      </template>
    </agentMenu>
    <conversation
      v-for="item in conversations"
      v-show="item.key === conversationKey"
      :key="item.key"
      :ref="instance => setConversationRef(item, instance)"
      :active="visible && item.key === conversationKey"
      :initialSession="item.session"
      :initialModel="item.initialModel"
      :sessionFile="item.file"
      :automations="automations"
      :cancellingAutomation="cancellingAutomation"
      :disabled="loading || !initialized"
      :branchingId="branchingId"
      @session="setSessionFile(item, $event)"
      @branch="newConversation({ file: item.file, message: $event })"
      @automations="automationEntry = { ...$event, key: item.key }"
      @automationsChanged="reloadAutomations"
      @cancelAutomation="cancelFromBar"
      @event="receiveAgentEvent"
      @sent="updateConversationName(item, $event)" />
    <automationDialog v-if="automationEntry && automationSource && projectDirectory" :entry="automationEntry" :directory="projectDirectory" :tasks="automations"
      :sourceFile="automationSource.file" :unreadRuns="unreadRuns" :load="loadAutomations" :update="updateAutomation" :ensureSession="ensureAutomationSession" @read="markAutomationRead"
      @close="closeAutomations" @saved="automationEntry.saved = true" @result="openAutomationResult" />
  </section>
</template>

<script lang="ts">
// ACT: 浏览器禁用本地存储时，仅在当前标签页内保留已读状态，切换项目仍可恢复。
const fallbackReads = new Map<string, string>();
</script>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from "vue";
import axios from "axios";
import { translate } from "@toonflow/i18n/vue";
import { ElButton, ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { IconCalendarClock } from "@tabler/icons-vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { multiTenantEnabled, settings } from "@/stores/settings";
import { mobileConnection } from "@/lib/mobile";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import http from "@/lib/http";
import { stopAgent } from "@/lib/agentControl";
import type { AgentAutomationEntry, AgentConversation, AgentHistory, AgentMessage } from "./types";
import type { AgentAutomation, AgentAutomationCommand, AgentEvent, AgentSubAgent } from "@toonflow/server/agent/types";
import agentMenu from "./menu.vue";
import conversation from "./conversation.vue";
import automationDialog from "./automationDialog.vue";

const visible = defineModel<boolean>({ default: false });
type OpenConversation = { key: number; name: string; file?: string; parentFile?: string; runId?: string; retiredRunIds: Set<string>; subAgents: AgentSubAgent[]; session: AgentConversation | null; initialModel?: string };
// ACT: 会话实例保留到工作区关闭，让切换后的回复继续接收流式内容。
const conversations = ref<OpenConversation[]>([]);
const conversationKey = ref(0);
const selectedConversation = computed(() => conversations.value.find(item => item.key === conversationKey.value));
// ACT: 新对话是现有自动命名逻辑使用的保留值；仅翻译显示，不改变存储或比较值。
const name = computed(() => {
  const value = selectedConversation.value?.name;
  return value && value !== "新对话" ? value : translate("新对话");
});
const sessionFile = computed(() => selectedConversation.value?.file);
const workspaceStore = useWorkspaceStore();
let projectDirectory = workspaceStore.project?.directory;
const history = ref<AgentHistory[]>([]);
const loading = ref(false);
const branchingId = ref<string>();
const historyLoading = ref(false);
const initialized = ref(false);
let requestId = 0;
let nextConversationKey = 0;
const conversationRefs = new Map<number, InstanceType<typeof conversation>>();
const pendingEvents = new Map<number, AgentEvent[]>();
const automations = ref<AgentAutomation[]>([]);
const cancellingAutomation = ref(false);
const automationNotices = new Set<ReturnType<typeof ElNotification>>();
const automationEntry = ref<(AgentAutomationEntry & { key: number; saved?: boolean })>();
const automationSource = computed(() => conversations.value.find(item => item.key === automationEntry.value?.key));
const readScope = computed(() => {
  const directory = workspaceStore.project?.directory;
  if (!directory || multiTenantEnabled.value) return;
  const account = settings.value.toonflowAccount as { info?: { phone?: string; userName?: string } } | null | undefined;
  const host = mobileConnection.value.mode === "remote" ? mobileConnection.value.url ?? "remote" : "local";
  return "toonflow.automationReadRuns." + JSON.stringify([host, directory, account?.info?.phone || account?.info?.userName || null]);
});
const unreadRuns = ref(new Map<string, string>());
function readMarker(key: string) {
  try { return fallbackReads.get(key) ?? localStorage.getItem(key); }
  catch { return fallbackReads.get(key); }
}
function saveMarker(key: string, value: string) {
  try { localStorage.setItem(key, value); fallbackReads.delete(key); }
  catch { fallbackReads.set(key, value); }
}
function latestResult(task: AgentAutomation) {
  return task.runs.find(run => run.finishedAt && run.status !== "cancelled");
}
function refreshUnreadRuns() {
  const unread = new Map<string, string>();
  const scope = readScope.value;
  const marker = scope && readMarker(scope);
  if (scope && marker != null) {
    const baseline = new Set(marker.split(","));
    for (const task of automations.value) {
      const run = latestResult(task);
      if (run && !baseline.has(run.id) && readMarker(scope + "." + task.id) !== run.id) unread.set(task.id, run.id);
    }
  }
  unreadRuns.value = unread;
}
watch([readScope, automations], refreshUnreadRuns, { flush: "sync" });
const automationLabel = computed(() => [translate("自动化任务"), unreadRuns.value.size && translate("有新的运行结果")].filter(Boolean).join(" · "));
function markAutomationRead(runId: string) {
  const scope = readScope.value;
  if (!scope || !visible.value || document.visibilityState !== "visible") return;
  for (const [taskId, unreadId] of unreadRuns.value) {
    if (runId !== unreadId) continue;
    saveMarker(scope + "." + taskId, runId);
    unreadRuns.value.delete(taskId);
    return;
  }
}
function syncReadMarker(event: StorageEvent) {
  const scope = readScope.value;
  if (scope && (event.key === null || event.key === scope || event.key.startsWith(scope + "."))) {
    if (event.key === null) fallbackReads.clear();
    else fallbackReads.delete(event.key);
    refreshUnreadRuns();
  }
}
const syncedRuns = new Map<number, string>();
const syncingRuns = new Set<number>();
let automationVersion = 0;
let automationRead: Promise<void> | undefined;

function applyAutomationList(tasks: AgentAutomation[]) {
  const previous = new Map(automations.value.map(task => [task.id, task]));
  const scope = readScope.value;
  // 首次进入时记住已有结果 ID，服务端时钟回拨也不会隐藏后来的结果。
  if (scope && readMarker(scope) == null) {
    const baseline = tasks.map(task => latestResult(task)?.id).filter(Boolean);
    saveMarker(scope, baseline.join(","));
  }
  automations.value = tasks;
  if (!previous.size || !visible.value || document.visibilityState !== "visible" || automationEntry.value || selectedConversation.value?.parentFile) return;
  const directory = projectDirectory;
  for (const task of tasks) {
    const before = previous.get(task.id);
    const run = task.runs[0];
    if (!before || !run?.finishedAt || run.status === "running" || run.status === "cancelled" || task.cancelledAt || !unreadRuns.value.has(task.id)
      || (task.sessionFile && task.sessionFile !== sessionFile.value)) continue;
    const priorRun = before.runs[0];
    if (priorRun?.id === run.id && priorRun.finishedAt) continue;
    if (!before.queued && priorRun?.status !== "running" && !(before.enabled && before.nextRunAt !== null && before.nextRunAt <= run.startedAt)) continue;
    const labels = { completed: translate("已完成"), failed: translate("失败"), interrupted: translate("已中断") };
    const resultFile = run.status === "completed" && run.sessionFile;
    const notice = ElNotification({
      title: task.name + " · " + labels[run.status], type: run.status === "completed" ? "success" : "warning",
      customClass: "automationNotice", duration: 9000,
      message: h(ElButton, { link: true, type: "primary", onClick: () => {
        notice.close();
        if (readScope.value !== scope || projectDirectory !== directory || !visible.value || automationEntry.value) return;
        if (resultFile) openAutomationResult(resultFile, run.id);
        else conversationRefs.get(conversationKey.value)?.openAutomations(false, undefined, undefined, task.id);
      } }, () => resultFile ? translate("查看结果") : translate("运行记录")),
      onClose: () => automationNotices.delete(notice),
    });
    automationNotices.add(notice);
  }
}

async function refreshTimerResults(directory: string, tasks: AgentAutomation[]) {
  const latest = new Map<string, { id: string; finishedAt: number }>();
  for (const task of tasks) for (const run of task.runs) {
    if (run.sessionFile && run.finishedAt && run.finishedAt > (latest.get(run.sessionFile)?.finishedAt ?? 0)) {
      latest.set(run.sessionFile, { id: run.id, finishedAt: run.finishedAt });
    }
  }
  for (const item of conversations.value) {
    const file = item.file;
    const run = file && latest.get(file);
    const view = conversationRefs.get(item.key);
    if (!file || !run || syncedRuns.get(item.key) === run.id || syncingRuns.has(item.key) || !view?.canRefreshAutomation()) continue;
    syncingRuns.add(item.key);
    try {
      const session = await readConversation(directory, file);
      if (directory === projectDirectory && conversationRefs.get(item.key) === view && view.refreshAutomation(session)) syncedRuns.set(item.key, run.id);
    } catch (cause) {
      // 已移除的历史对话无需继续拉取，其余错误留待下一次刷新。
      if (axios.isAxiosError(cause) && cause.response?.status === 404) syncedRuns.set(item.key, run.id);
    } finally { syncingRuns.delete(item.key); }
  }
}

function loadAutomations() {
  if (automationRead) return automationRead;
  const directory = workspaceStore.project?.directory;
  if (!directory || multiTenantEnabled.value) return Promise.resolve();
  const version = automationVersion;
  const pending = http<AgentAutomation[]>({ method: "GET", url: "/api/agent/automations/list", params: { directory } }).then(tasks => {
    if (version !== automationVersion || directory !== projectDirectory) return;
    applyAutomationList(tasks);
    return refreshTimerResults(directory, tasks);
  }).finally(() => { if (automationRead === pending) automationRead = undefined; });
  automationRead = pending;
  return pending;
}

function pollAutomations() {
  if (visible.value && document.visibilityState === "visible") {
    void loadAutomations().catch(() => { /* 下次轮询重试；打开管理页时直接显示读取错误。 */ });
  }
}

function reloadAutomations() {
  automationVersion++;
  automationRead = undefined;
  pollAutomations();
}

async function updateAutomation(directory: string, command: AgentAutomationCommand) {
  const scope = readScope.value;
  if (command.action === "cancel") {
    const task = automations.value.find(item => item.id === command.id);
    if (!task || directory !== projectDirectory) throw new Error(translate("任务已变更，请刷新后重试"));
    try {
      await ElMessageBox.confirm(translate("确定取消此任务？当前执行和后续计划都将停止。"), task.name, {
        type: "warning", confirmButtonText: translate("取消任务"), cancelButtonText: translate("返回"),
      });
    } catch { return; }
  }
  if (!scope || scope !== readScope.value || directory !== projectDirectory) throw new Error("项目已切换");
  const tasks = await http<AgentAutomation[]>({ method: "POST", url: "/api/agent/automations/update", data: { directory, command } });
  if (scope !== readScope.value || directory !== projectDirectory) return;
  automationVersion++;
  applyAutomationList(tasks);
  await refreshTimerResults(directory, tasks);
}

async function cancelFromBar(task: AgentAutomation) {
  if (!projectDirectory || cancellingAutomation.value) return;
  cancellingAutomation.value = true;
  try { await updateAutomation(projectDirectory, { action: "cancel", id: task.id, revision: task.revision }); }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : translate("请求失败"));
    if ((error as { status?: number })?.status === 409) reloadAutomations();
  } finally { cancellingAutomation.value = false; }
}

async function ensureAutomationSession() {
  const item = automationSource.value;
  const directory = projectDirectory;
  if (!item || !directory) throw new Error("请先打开项目");
  if (item.file) return item.file;
  if (conversationRefs.get(item.key)?.getRunId()) throw new Error("对话正在准备，请稍后发送");
  const session = await http<AgentConversation>({ method: "POST", url: "/api/agent/create", data: { directory } });
  if (directory !== projectDirectory || item !== automationSource.value) throw new Error("项目已切换");
  if (!item.file) setSessionFile(item, session.file);
  return item.file ?? session.file;
}

function closeAutomations() {
  const entry = automationEntry.value;
  automationEntry.value = undefined;
  if (entry && (entry.saved || !entry.prompt)) void conversationRefs.get(entry.key)?.clearCommandText(entry.token);
}

function openAutomationResult(file: string, runId: string) {
  closeAutomations();
  void selectConversation(file, runId);
}

function showConversation(session: AgentConversation | null, activate = true) {
  const existing = session && conversations.value.find(item => item.file === session.file);
  if (existing) {
    if (activate) conversationKey.value = existing.key;
    return existing;
  }
  const key = ++nextConversationKey;
  const item = { key, name: session?.name || "新对话", file: session?.file, parentFile: session?.parentFile, runId: session?.runId, retiredRunIds: new Set<string>(), subAgents: session?.subAgents ?? [], session };
  conversations.value.push(item);
  if (activate) conversationKey.value = key;
  return conversations.value[conversations.value.length - 1]!;
}

function setConversationRef(item: OpenConversation, instance: Element | ComponentPublicInstance | null) {
  if (!instance) { conversationRefs.delete(item.key); return; }
  const view = instance as InstanceType<typeof conversation>;
  conversationRefs.set(item.key, view);
  for (const event of pendingEvents.get(item.key) ?? []) view.receiveEvent(event);
  pendingEvents.delete(item.key);
}

function deliverEvent(item: OpenConversation, event: AgentEvent) {
  const view = conversationRefs.get(item.key);
  if (view) view.receiveEvent(event);
  else {
    const events = pendingEvents.get(item.key) ?? [];
    events.push(event);
    pendingEvents.set(item.key, events);
  }
}

function receiveAgentEvent(event: AgentEvent) {
  if (event.type === "subAgent") {
    const child = conversations.value.find(item => item.file === event.agent.file);
    if (event.agent.runId && child?.retiredRunIds.has(event.agent.runId)) return;
    const currentRunId = child && (conversationRefs.get(child.key)?.getRunId() ?? child.runId);
    if (currentRunId && event.agent.runId && currentRunId !== event.agent.runId) return;
    const parent = conversations.value.find(item => item.file === event.agent.parentFile);
    if (!parent) return;
    const current = parent.subAgents.find(agent => agent.file === event.agent.file);
    if (current) Object.assign(current, event.agent);
    else parent.subAgents.push(event.agent);
    if (event.agent.status === "running" && !current && !child) {
      showConversation({ ...event.agent, parentFile: parent.file, messages: [], running: true }, false);
    }
    return;
  }
  if (event.type === "subAgentEvent") {
    const child = conversations.value.find(item => item.file === event.file);
    if (!child) {
      receiveAgentEvent(event.event);
      return;
    }
    const currentRunId = conversationRefs.get(child.key)?.getRunId();
    if (currentRunId) setConversationRun(child, currentRunId);
    if (child.retiredRunIds.has(event.runId)) return;
    if (event.event.type === "session") {
      if (event.event.file !== event.file || event.event.runId !== event.runId) return;
      setConversationRun(child, event.runId);
    } else if (child.runId && child.runId !== event.runId) return;
    if (event.event.type === "error") {
      const agent = conversations.value.find(item => item.file === child.parentFile)?.subAgents.find(agent => agent.file === event.file);
      if (agent?.status === "running") Object.assign(agent, { status: "cancelled", result: event.event.message });
    }
    if (event.event.type === "done" || event.event.type === "error") {
      child.retiredRunIds.add(event.runId);
      child.runId = undefined;
    }
    deliverEvent(child, event.event);
    return;
  }
  if (event.type === "report") {
    const parent = conversations.value.find(item => item.file === event.parentFile);
    if (parent) deliverEvent(parent, event);
  }
  if (event.type === "agentMessage") {
    const recipient = conversations.value.find(item => item.file === event.toFile);
    if (recipient) deliverEvent(recipient, event);
  }
}

function backToParent() {
  const file = selectedConversation.value?.parentFile;
  if (file) void selectConversation(file);
}

function updateConversationName(item: OpenConversation, prompt: string) {
  if (item.name !== "新对话") return;
  item.name = prompt.slice(0, 80);
  const entry = history.value.find(entry => entry.file === item.file);
  if (entry) entry.name = item.name;
}

function setSessionFile(item: OpenConversation, file: string) {
  item.file = file;
  const runId = conversationRefs.get(item.key)?.getRunId();
  if (runId) setConversationRun(item, runId);
  if (item.parentFile) return;
  if (!history.value.some(entry => entry.file === file)) {
    history.value.unshift({ file, name: item.name, modified: new Date().toISOString(), messageCount: 0 });
  }
}

function setConversationRun(item: OpenConversation, runId: string) {
  // 已结束的 runId 保留到会话关闭，拒绝另一条转发流的迟到事件。
  if (item.retiredRunIds.has(runId)) return;
  if (item.runId && item.runId !== runId) item.retiredRunIds.add(item.runId);
  item.runId = runId;
}

async function newConversation(source?: { file?: string; message: AgentMessage }) {
  if (loading.value || historyLoading.value) return;
  const directory = workspaceStore.project?.directory;
  if (!directory) return ElMessage.warning("请先打开项目");
  if (source && (!source.file || !(source.message.entryId || source.message.replyTo))) return ElMessage.warning("消息尚未保存，请稍后创建分支");
  const initialModel = conversationRefs.get(conversationKey.value)?.getSelectedModel();
  const currentRequest = ++requestId;
  const errorMessage = source ? "创建对话分支失败" : "新建对话失败";
  branchingId.value = source?.message.id;
  loading.value = true;
  try {
    const { data } = await axios.post<{ code: number; data: AgentConversation; message?: string }>(source ? "/api/agent/branch" : "/api/agent/create", {
      directory,
      ...(source ? { sessionFile: source.file, ...(source.message.entryId ? { entryId: source.message.entryId } : { replyTo: source.message.replyTo }) } : {}),
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || errorMessage);
    if (currentRequest !== requestId) return;
    const session = data.data;
    history.value.unshift({ file: session.file, name: session.name, modified: new Date().toISOString(), messageCount: session.messages.length });
    showConversation(session).initialModel = initialModel;
    initialized.value = true;
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(axios.isAxiosError(error)
      ? error.response?.data?.message || errorMessage
      : error instanceof Error ? error.message : errorMessage);
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
      branchingId.value = undefined;
    }
  }
}

async function readConversation(directory: string, file: string) {
  const { data } = await axios.get<{ code: number; data: AgentConversation; message?: string }>("/api/agent/get", {
    params: { directory, sessionFile: file }, headers: { "x-toonflow-workspace": "1" },
  });
  if (data.code !== 200) throw new Error(data.message || "读取对话失败");
  return data.data;
}

async function loadHistory(openLatest = false) {
  const directory = workspaceStore.project?.directory;
  if (!directory || loading.value || historyLoading.value) return;
  const currentRequest = ++requestId;
  historyLoading.value = true;
  loading.value = openLatest;
  try {
    const { data } = await axios.get<{ code: number; data: AgentHistory[]; message?: string }>("/api/agent/list", {
      params: { directory }, headers: { "x-toonflow-workspace": "1" },
    });
    if (data.code !== 200) throw new Error(data.message || "读取历史对话失败");
    if (currentRequest !== requestId) return;
    history.value = data.data;
    // 首条回复结束前会话可能尚未落盘，仍允许从历史菜单切回。
    for (const item of conversations.value) if (item.file) setSessionFile(item, item.file);
    if (openLatest) {
      const session = !workspaceStore.pendingAgentMessage && data.data[0] ? await readConversation(directory, data.data[0].file) : null;
      if (currentRequest !== requestId) return;
      showConversation(session);
      initialized.value = true;
    }
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(error instanceof Error ? error.message : "读取历史对话失败");
  } finally {
    if (currentRequest === requestId) {
      historyLoading.value = false;
      loading.value = false;
    }
  }
}

async function selectConversation(file: string, resultRunId?: string) {
  const directory = workspaceStore.project?.directory;
  if (!directory || loading.value || historyLoading.value || (!resultRunId && file === sessionFile.value)) return;
  const existing = conversations.value.find(item => item.file === file);
  if (existing && !resultRunId) {
    conversationKey.value = existing.key;
    return;
  }
  const currentRequest = ++requestId;
  let selectedKey: number | undefined;
  loading.value = true;
  try {
    const session = await readConversation(directory, file);
    if (currentRequest !== requestId) return;
    if (existing) conversationRefs.get(existing.key)?.refreshAutomation(session);
    selectedKey = showConversation(session).key;
    initialized.value = true;
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(error instanceof Error ? error.message : "读取对话失败");
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
  if (selectedKey === undefined || !resultRunId) return;
  await nextTick();
  if (currentRequest !== requestId || selectedKey !== conversationKey.value || !visible.value) return;
  conversationRefs.get(selectedKey)?.revealAutomationResult(resultRunId);
  markAutomationRead(resultRunId);
}

async function renameConversation(file: string, value: string) {
  const directory = workspaceStore.project?.directory;
  const item = history.value.find(item => item.file === file);
  const nextName = value.trim();
  if (!directory || loading.value || historyLoading.value || (!item && file !== sessionFile.value)) return;
  if (!nextName || nextName.length > 80) return ElMessage.warning("请输入 1–80 个字符的对话名称");
  if (nextName === (file === sessionFile.value ? name.value : item?.name)) return;
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    const { data } = await axios.patch<{ code: number; data: { name: string }; message?: string }>("/api/agent/rename", {
      directory, sessionFile: file, name: nextName,
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || "重命名对话失败");
    if (currentRequest !== requestId) return;
    if (item) item.name = data.data.name;
    const opened = conversations.value.find(item => item.file === file);
    if (opened) opened.name = data.data.name;
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(axios.isAxiosError(error)
      ? error.response?.data?.message || "重命名对话失败"
      : error instanceof Error ? error.message : "重命名对话失败");
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function removeConversation(file: string) {
  const directory = workspaceStore.project?.directory;
  if (!directory || loading.value || historyLoading.value || history.value.length <= 1 || !history.value.some(item => item.file === file)) return;
  if (!/^[\w-]+\.jsonl$/.test(file)) return ElMessage.error("对话文件名无效");
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    await useWorkspaceFiles(directory).remove(`.agent/sessions/${file}`);
    if (currentRequest !== requestId) return;
    history.value = history.value.filter(item => item.file !== file);
    if (file === sessionFile.value) {
      showConversation(null);
      initialized.value = true;
    }
    conversations.value = conversations.value.filter(item => item.file !== file);
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(axios.isAxiosError(error)
      ? error.response?.data?.message || "移除历史对话失败"
      : error instanceof Error ? error.message : "移除历史对话失败");
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function stopProject(directory = projectDirectory) {
  if (!directory) return;
  const stops = [...conversationRefs.values()].map(view => view.beginProjectStop());
  void stopAgent(directory, stops.flatMap(stop => stop.runIds)).then(() => {
    for (const stop of stops) stop.finish(true);
  }).catch(error => {
    for (const stop of stops) stop.finish(false);
    ElMessage.error(error instanceof Error ? error.message : "停止生成失败，请重试");
  });
}

function pageHide() {
  stopProject();
}

watch(() => workspaceStore.project?.directory, directory => {
  if (projectDirectory && projectDirectory !== directory) stopProject(projectDirectory);
  projectDirectory = directory;
  requestId++;
  syncedRuns.clear();
  history.value = [];
  conversations.value = [];
  conversationRefs.clear();
  pendingEvents.clear();
  initialized.value = false;
  loading.value = false;
  branchingId.value = undefined;
  historyLoading.value = false;
  showConversation(null);
  if (visible.value && directory) void loadHistory(true);
}, { immediate: true, flush: "sync" });
watch(visible, active => {
  if (!active) closeAutomations();
  if (active && !initialized.value) void loadHistory(true);
});
watch([visible, readScope], ([active, scope], [, previousScope], onCleanup) => {
  if (scope !== previousScope) {
    automationVersion++;
    automationRead = undefined;
    automations.value = [];
    automationEntry.value = undefined;
  }
  if (!active || !scope) return;
  pollAutomations();
  const stopTimer = watch(automations, (tasks, _, cleanup) => {
    const now = Date.now();
    let delay = 15000;
    for (const task of tasks) {
      if (task.cancelledAt) continue;
      if (task.queued || task.runs[0]?.status === "running") delay = Math.min(delay, 1500);
      if (task.enabled && task.nextRunAt !== null) delay = Math.min(delay, Math.max(1500, task.nextRunAt - now + 100));
    }
    const timer = window.setInterval(pollAutomations, delay);
    cleanup(() => window.clearInterval(timer));
  }, { immediate: true });
  document.addEventListener("visibilitychange", pollAutomations);
  window.addEventListener("focus", pollAutomations);
  onCleanup(() => {
    for (const notice of automationNotices) notice.close();
    stopTimer();
    document.removeEventListener("visibilitychange", pollAutomations);
    window.removeEventListener("focus", pollAutomations);
  });
}, { immediate: true, flush: "sync" });
window.addEventListener("pagehide", pageHide);
window.addEventListener("storage", syncReadMarker);
onBeforeUnmount(() => {
  requestId++;
  stopProject();
  window.removeEventListener("pagehide", pageHide);
  window.removeEventListener("storage", syncReadMarker);
});

</script>

<style scoped lang="scss">
:global(.automationNotice) { max-width: calc(100vw - 32px); overflow-wrap: anywhere; }
.agent {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  padding-bottom: 8px;
  overflow: hidden;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
</style>
