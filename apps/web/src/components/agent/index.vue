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
      <template #actions><slot name="menuActions" /></template>
    </agentMenu>
    <conversation
      v-for="item in conversations"
      v-show="item.key === conversationKey"
      :key="item.key"
      :ref="instance => setConversationRef(item, instance)"
      :active="visible && item.key === conversationKey"
      :initialSession="item.session"
      :sessionFile="item.file"
      :disabled="loading || !initialized"
      @session="setSessionFile(item, $event)"
      @event="receiveAgentEvent"
      @sent="updateConversationName(item, $event)" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { createTranslator } from "@toonflow/i18n";
import { useWorkspaceStore } from "@/stores/workspace";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import type { AgentConversation, AgentHistory } from "./types";
import type { AgentEvent, AgentSubAgent } from "@toonflow/server/agent/types";
import agentMenu from "./menu.vue";
import conversation from "./conversation.vue";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
const visible = defineModel<boolean>({ default: false });
type OpenConversation = {
  key: number; name: string; nameAutomatic: boolean; nameDefault: boolean;
  file?: string; parentFile?: string; subAgents: AgentSubAgent[]; session: AgentConversation | null;
};
// ACT: 会话实例保留到工作区关闭，让切换后的回复继续接收流式内容。
const conversations = ref<OpenConversation[]>([]);
const conversationKey = ref(0);
const selectedConversation = computed(() => conversations.value.find(item => item.key === conversationKey.value));
const name = computed(() => selectedConversation.value?.nameDefault ? t("newConversation") : selectedConversation.value?.name || t("newConversation"));
const sessionFile = computed(() => selectedConversation.value?.file);
const workspaceStore = useWorkspaceStore();
const history = ref<AgentHistory[]>([]);
const loading = ref(false);
const historyLoading = ref(false);
const initialized = ref(false);
let requestId = 0;
let nextConversationKey = 0;
const conversationRefs = new Map<number, InstanceType<typeof conversation>>();
const pendingEvents = new Map<number, AgentEvent[]>();

function showConversation(session: AgentConversation | null, activate = true) {
  const existing = session && conversations.value.find(item => item.file === session.file);
  if (existing) {
    if (activate) conversationKey.value = existing.key;
    return existing;
  }
  const key = ++nextConversationKey;
  const item = {
    key,
    name: session?.name || "",
    nameAutomatic: session?.nameAutomatic ?? false,
    nameDefault: session?.nameDefault ?? !session,
    file: session?.file,
    parentFile: session?.parentFile,
    subAgents: session?.subAgents ?? [],
    session,
  };
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
    const parent = conversations.value.find(item => item.file === event.agent.parentFile);
    if (!parent) return;
    const current = parent.subAgents.find(agent => agent.file === event.agent.file);
    if (current) Object.assign(current, event.agent);
    else parent.subAgents.push(event.agent);
    if (event.agent.status === "running" && !conversations.value.some(item => item.file === event.agent.file)) {
      showConversation({ ...event.agent, nameAutomatic: false, nameDefault: false, parentFile: parent.file, messages: [], running: true }, false);
    }
    return;
  }
  if (event.type === "subAgentEvent") {
    const child = conversations.value.find(item => item.file === event.file);
    if (event.event.type === "error") {
      const agent = conversations.value.find(item => item.file === child?.parentFile)?.subAgents.find(agent => agent.file === event.file);
      if (agent?.status === "running") Object.assign(agent, { status: "cancelled", result: event.event.message });
    }
    if (child) deliverEvent(child, event.event);
    return;
  }
  if (event.type === "report") {
    const parent = conversations.value.find(item => item.file === event.parentFile);
    if (parent) deliverEvent(parent, event);
  }
}

function backToParent() {
  const file = selectedConversation.value?.parentFile;
  if (file) void selectConversation(file);
}

function updateConversationName(item: OpenConversation, prompt: string) {
  if (!item.nameDefault) return;
  item.name = prompt.slice(0, 80);
  item.nameAutomatic = true;
  item.nameDefault = false;
  const entry = history.value.find(entry => entry.file === item.file);
  if (entry) Object.assign(entry, { name: item.name, nameAutomatic: true, nameDefault: false });
}

function setSessionFile(item: OpenConversation, file: string) {
  item.file = file;
  if (item.parentFile) return;
  if (!history.value.some(entry => entry.file === file)) {
    history.value.unshift({
      file, name: item.name, nameAutomatic: item.nameAutomatic, nameDefault: item.nameDefault,
      modified: new Date().toISOString(), messageCount: 0,
    });
  }
}

async function newConversation() {
  if (loading.value || historyLoading.value) return;
  const directory = workspaceStore.project?.directory;
  if (!directory) return ElMessage.warning(t("openProjectFirst"));
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    const { data } = await axios.post<{ code: number; data: AgentConversation; message?: string }>("/api/agent/create", {
      directory,
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || t("createConversationFailed"));
    if (currentRequest !== requestId) return;
    const session = data.data;
    history.value.unshift({
      file: session.file, name: session.name, nameAutomatic: session.nameAutomatic, nameDefault: session.nameDefault,
      modified: new Date().toISOString(), messageCount: 0,
    });
    showConversation(session);
    initialized.value = true;
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(axios.isAxiosError(error)
      ? error.response?.data?.message || t("createConversationFailed")
      : error instanceof Error ? error.message : t("createConversationFailed"));
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function readConversation(directory: string, file: string) {
  const { data } = await axios.get<{ code: number; data: AgentConversation; message?: string }>("/api/agent/get", {
    params: { directory, sessionFile: file }, headers: { "x-toonflow-workspace": "1" },
  });
  if (data.code !== 200) throw new Error(data.message || t("loadConversationFailed"));
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
    if (data.code !== 200) throw new Error(data.message || t("loadHistoryFailed"));
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
    if (currentRequest === requestId) ElMessage.error(error instanceof Error ? error.message : t("loadHistoryFailed"));
  } finally {
    if (currentRequest === requestId) {
      historyLoading.value = false;
      loading.value = false;
    }
  }
}

async function selectConversation(file: string) {
  const directory = workspaceStore.project?.directory;
  if (!directory || loading.value || historyLoading.value || file === sessionFile.value) return;
  const existing = conversations.value.find(item => item.file === file);
  if (existing) {
    conversationKey.value = existing.key;
    return;
  }
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    const session = await readConversation(directory, file);
    if (currentRequest !== requestId) return;
    showConversation(session);
    initialized.value = true;
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(error instanceof Error ? error.message : t("loadConversationFailed"));
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function renameConversation(file: string, value: string) {
  const directory = workspaceStore.project?.directory;
  const item = history.value.find(item => item.file === file);
  const nextName = value.trim();
  if (!directory || loading.value || historyLoading.value || (!item && file !== sessionFile.value)) return;
  if (!nextName || nextName.length > 80) return ElMessage.warning(t("conversationNameLength"));
  const opened = conversations.value.find(item => item.file === file);
  const current = opened ?? item;
  if (nextName === current?.name && !current.nameDefault) return;
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    const { data } = await axios.patch<{ code: number; data: { name: string; nameAutomatic: boolean; nameDefault: boolean }; message?: string }>("/api/agent/rename", {
      directory, sessionFile: file, name: nextName,
    }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || t("renameConversationFailed"));
    if (currentRequest !== requestId) return;
    if (item) Object.assign(item, data.data);
    if (opened) Object.assign(opened, data.data);
  } catch (error) {
    if (currentRequest === requestId) ElMessage.error(axios.isAxiosError(error)
      ? error.response?.data?.message || t("renameConversationFailed")
      : error instanceof Error ? error.message : t("renameConversationFailed"));
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function removeConversation(file: string) {
  const directory = workspaceStore.project?.directory;
  if (!directory || loading.value || historyLoading.value || history.value.length <= 1 || !history.value.some(item => item.file === file)) return;
  if (!/^[\w-]+\.jsonl$/.test(file)) return ElMessage.error(t("invalidConversationFileName"));
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
      ? error.response?.data?.message || t("removeConversationFailed")
      : error instanceof Error ? error.message : t("removeConversationFailed"));
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

watch(() => workspaceStore.project?.directory, directory => {
  requestId++;
  history.value = [];
  conversations.value = [];
  conversationRefs.clear();
  pendingEvents.clear();
  initialized.value = false;
  loading.value = false;
  historyLoading.value = false;
  showConversation(null);
  if (visible.value && directory) void loadHistory(true);
}, { immediate: true });
watch(visible, active => {
  if (active && !initialized.value) void loadHistory(true);
});
onBeforeUnmount(() => { requestId++; });

</script>

<style scoped lang="scss">
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
