<template>
  <header class="agentMenu">
    <el-button v-if="parentFile" class="backButton" text circle :icon="IconArrowLeft" :aria-label="t('backToParentAgent')" :title="t('backToParentAgent')" @click="emit('back')" />
    <el-input
      v-if="editingName && !parentFile"
      ref="nameInput"
      v-model="nameDraft"
      class="conversationName"
      size="small"
      :maxlength="80"
      :aria-label="t('conversationName')"
      @keydown.enter="saveName"
      @keydown.esc.prevent="editingName = false"
      @blur="saveName" />
    <span v-else class="conversationName">
      <span class="conversationTitle" :class="{ readOnly: parentFile }" :title="name" :tabindex="sessionFile && !parentFile ? 0 : -1" @dblclick="editName" @keydown.enter.prevent="editName">{{ name }}</span>
    </span>
    <div class="menuActions">
      <el-popover v-if="subAgents?.length" v-model:visible="subAgentsVisible" trigger="click" placement="bottom-end" :width="340" :showArrow="false" :popperStyle="{ maxWidth: 'calc(100vw - 24px)' }">
        <template #reference>
          <el-button class="subAgentTrigger" text circle :aria-label="t('subAgentsCount', { count: subAgents.length })" :aria-expanded="subAgentsVisible" :title="t('subAgents')">
            <icon-users-group :size="17" />
            <span class="subAgentCount" aria-hidden="true">{{ subAgents.length }}</span>
          </el-button>
        </template>
        <div class="subAgentMenu">
          <div class="subAgentHeader">{{ t("subAgents") }} <span>{{ subAgents.length }}</span></div>
          <ul class="subAgentList" :aria-label="t('subAgentList')">
            <li v-for="item in subAgents" :key="item.file" class="subAgentItem">
              <button
                class="subAgentSelect"
                :class="{ selected: item.file === sessionFile }"
                type="button"
                :aria-current="item.file === sessionFile ? 'true' : undefined"
                @click="selectSubAgent(item.file)">
                <span class="statusDot" :data-status="item.status" role="img" :aria-label="subAgentStatusLabel(item.status)" :title="subAgentStatusLabel(item.status)" />
                <span class="subAgentInfo">
                  <span class="subAgentName" :title="item.name">{{ item.name }}</span>
                  <span v-if="item.result || item.task" class="subAgentSummary">{{ item.result || item.task }}</span>
                </span>
                <icon-check v-if="item.file === sessionFile" class="selectedIcon" :size="15" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>
      </el-popover>
      <el-button v-if="!parentFile" text circle :aria-label="t('newConversation')" :title="t('newConversation')" @click="emit('newChat')"><icon-message-plus :size="17" /></el-button>
      <el-popover v-if="!parentFile" v-model:visible="historyVisible" trigger="click" placement="bottom-end" :width="280" :showArrow="false" @show="emit('history')">
        <template #reference>
          <el-button text circle :loading="loading" :icon="IconHistory" :aria-label="t('history')" :title="t('history')" />
        </template>
        <div class="historyList" role="group" :aria-label="t('history')">
          <p v-if="!history.length" class="historyTips" role="status">{{ loading ? t("loadingConversations") : t("emptyHistory") }}</p>
          <div
            v-for="item in history"
            :key="item.file"
            class="historyItem"
            :class="{ selected: item.file === sessionFile }">
            <button
              class="historySelect"
              type="button"
              :aria-current="item.file === sessionFile ? 'true' : undefined"
              :title="historyName(item)"
              @click="selectConversation(item.file)">
              <icon-message-circle :size="16" />
              <span class="historyName">{{ historyName(item) }}</span>
              <icon-check v-if="item.file === sessionFile" :size="15" />
            </button>
            <el-button class="historyAction" text circle :aria-label="t('renameConversationWithName', { name: historyName(item) })" :title="t('renameConversation')" @click.stop="renameHistory(item)">
              <icon-pencil :size="14" />
            </el-button>
            <el-button v-if="history.length > 1" class="historyAction" text circle :aria-label="t('removeConversationWithName', { name: historyName(item) })" :title="t('removeFromHistory')" @click.stop="emit('remove', item.file)">
              <icon-x :size="14" />
            </el-button>
          </div>
        </div>
      </el-popover>
      <el-button text circle :loading="configLoading" :icon="IconAdjustmentsHorizontal" :aria-label="t('mediaGenerationControls')" :title="t('mediaGenerationControls')" @click="openMediaConfig" />
      <slot name="actions" />
      <el-button text circle :aria-label="t('closeConversation')" :title="t('close')" @click="emit('close')"><icon-x :size="17" /></el-button>
    </div>
  </header>
  <pluginConfigDialog v-if="mediaTool" v-model="configVisible" :plugin="mediaTool" :canManage="canManageTools" />
</template>

<script setup lang="ts">
import axios from "axios";
import { nextTick, ref, shallowRef, watch } from "vue";
import { ElMessage, ElMessageBox, type InputInstance } from "element-plus";
import { createDisplayError, createTranslator, getErrorDisplay } from "@toonflow/i18n";
import type { AgentHistory } from "./types";
import type { AgentSubAgent } from "@toonflow/server/agent/types";
import pluginConfigDialog from "@/components/settings/panels/pluginMarket/pluginConfigDialog.vue";
import type { Plugin } from "@/components/settings/panels/pluginMarket/types";
import {
  IconMessagePlus, IconHistory,
  IconX, IconPencil,
  IconMessageCircle, IconCheck, IconAdjustmentsHorizontal,
  IconArrowLeft, IconUsersGroup,
} from "@tabler/icons-vue";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
const props = defineProps<{
  name: string;
  history: AgentHistory[];
  sessionFile?: string;
  loading: boolean;
  subAgents?: AgentSubAgent[];
  parentFile?: string;
}>();
const emit = defineEmits<{ newChat: []; history: []; select: [file: string]; rename: [file: string, name: string]; remove: [file: string]; close: []; openSubAgent: [file: string]; back: [] }>();
const historyVisible = ref(false);
const subAgentsVisible = ref(false);
const editingName = ref(false);
const nameDraft = ref("");
const nameInput = ref<InputInstance>();
const configVisible = ref(false);
const configLoading = ref(false);
const canManageTools = ref(false);
const mediaTool = shallowRef<Plugin>();
const subAgentStatusKeys: Record<string, string> = {
  pending: "statusPending", running: "statusRunning", completed: "statusCompleted", error: "statusError",
  limited: "statusLimited", cancelled: "statusCancelled", inputRequired: "statusInputRequired", unknown: "statusUnknown",
};
const subAgentStatusLabel = (status: string) => t(subAgentStatusKeys[status] ?? "statusUnknown");
const historyName = (item: AgentHistory) => item.nameDefault ? t("newConversation") : item.name;

watch(() => [props.sessionFile, props.parentFile], () => {
  editingName.value = false;
  historyVisible.value = false;
  subAgentsVisible.value = false;
});

async function openMediaConfig() {
  if (configLoading.value) return;
  configLoading.value = true;
  try {
    const { data } = await axios.get<{ code: number; data: { tools: (Plugin & { loadError?: string })[]; canManage: boolean }; message?: string }>("/api/tools/get", {
      headers: { "Cache-Control": "no-cache", "x-toonflow-workspace": "1" },
    });
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("读取工具配置失败", () => t("loadToolConfigFailed"));
    const tool = data.data.tools.find(tool => tool.name === "mediaGeneration");
    if (!tool) throw createDisplayError("请先安装媒体生成工具", () => t("installMediaToolFirst"));
    if (tool.loadError) throw new Error(tool.loadError);
    mediaTool.value = { ...tool, key: `tool:${tool.name}`, type: "tool" };
    canManageTools.value = data.data.canManage;
    configVisible.value = true;
  } catch (error) {
    const failure = axios.isAxiosError(error) && error.response?.data?.message
      ? new Error(error.response.data.message)
      : error instanceof Error ? error
      : createDisplayError("读取工具配置失败", () => t("loadToolConfigFailed"));
    ElMessage.error(getErrorDisplay(failure));
  } finally { configLoading.value = false; }
}

function selectConversation(file: string) {
  historyVisible.value = false;
  emit("select", file);
}

function selectSubAgent(file: string) {
  subAgentsVisible.value = false;
  emit("openSubAgent", file);
}

async function editName() {
  if (!props.sessionFile || props.parentFile) return;
  nameDraft.value = props.name;
  editingName.value = true;
  await nextTick();
  nameInput.value?.select();
}

function saveName(event: Event) {
  if (!editingName.value || (event instanceof KeyboardEvent && event.isComposing)) return;
  const value = nameDraft.value.trim();
  if (value && props.sessionFile && !props.parentFile) emit("rename", props.sessionFile, value);
  editingName.value = false;
}

async function renameHistory(item: AgentHistory) {
  const result = await ElMessageBox.prompt(t("enterConversationName"), t("renameConversation"), {
    inputValue: historyName(item),
    confirmButtonText: t("save"),
    cancelButtonText: t("cancel"),
    inputValidator: value => !!value?.trim() && value.trim().length <= 80 || t("conversationNameLength"),
  }).catch(() => null);
  if (result) emit("rename", item.file, result.value.trim());
}
</script>

<style lang="scss" scoped>
.agentMenu {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  min-width: 0;
  padding: 12px 12px 0;

  .backButton {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    color: var(--el-text-color-secondary);
  }

  .conversationName {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;

    .conversationTitle {
      cursor: text;
      user-select: text;
      &.readOnly { cursor: default; }
    }
  }

  .menuActions {
    display: flex;
    flex-shrink: 0;
    gap: 4px;

    .subAgentTrigger {
      position: relative;
      margin-right: 5px;

      .subAgentCount {
        box-sizing: border-box;
        position: absolute;
        top: -3px;
        right: -5px;
        min-width: 14px;
        height: 14px;
        padding: 0 3px;
        border: 1px solid var(--el-bg-color);
        border-radius: 7px;
        background: var(--el-color-primary);
        color: var(--el-color-white);
        font-size: 10px;
        line-height: 12px;
        font-variant-numeric: tabular-nums;
      }
    }

    :deep(.el-button) {
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
      color: var(--el-text-color-secondary);
    }
  }
}

.subAgentMenu {
  .subAgentHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px 10px;
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 500;

    span { color: var(--el-text-color-secondary); font-weight: 400; }
  }

  .subAgentList {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 360px;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;

    .subAgentItem {
      min-width: 0;

      .subAgentSelect {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        padding: 10px 8px;
        border: 0;
        border-radius: var(--el-border-radius-base);
        background: transparent;
        color: var(--el-text-color-primary);
        font: inherit;
        text-align: left;
        cursor: pointer;

        &:hover, &.selected { background: var(--el-fill-color-light); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }

        .statusDot {
          flex-shrink: 0;
          width: 7px;
          height: 7px;
          margin-top: 6px;
          border-radius: 50%;
          background: var(--el-text-color-placeholder);

          &[data-status="running"] { background: var(--el-color-primary); }
          &[data-status="completed"] { background: var(--el-color-success); }
          &[data-status="error"] { background: var(--el-color-danger); }
          &[data-status="limited"], &[data-status="inputRequired"], &[data-status="unknown"] { background: var(--el-color-warning); }
        }

        .subAgentInfo {
          display: flex;
          flex: 1;
          min-width: 0;
          flex-direction: column;
          gap: 4px;

          .subAgentName {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
            line-height: 20px;
          }

          .subAgentSummary {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            overflow-wrap: anywhere;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            line-height: 18px;
          }
        }

        .selectedIcon { flex-shrink: 0; margin-top: 2px; color: var(--el-color-primary); }
      }
    }
  }
}

.historyList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;

  .historyTips {
    margin: 12px 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.7;
    text-align: center;
  }

  .historyItem {
    display: flex;
    align-items: center;
    width: 100%;
    border-radius: var(--el-border-radius-base);
    color: var(--el-text-color-regular);

    &:hover, &.selected {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }

    .historySelect {
      display: flex;
      flex: 1;
      min-width: 0;
      align-items: center;
      gap: 8px;
      padding: 9px 8px;
      border: 0;
      border-radius: inherit;
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: left;
      cursor: pointer;

      .historyName {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    svg {
      flex-shrink: 0;
    }

    .historyAction {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      margin: 0;
      padding: 0;

      &:last-child {
        margin-right: 6px;
      }
    }
  }
}
</style>
