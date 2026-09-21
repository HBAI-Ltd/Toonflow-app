<template>
  <header class="agentMenu">
    <el-input
      v-if="editingName"
      ref="nameInput"
      v-model="nameDraft"
      class="conversationName"
      size="small"
      :maxlength="80"
      aria-label="对话名称"
      @keydown.enter="saveName"
      @keydown.esc.prevent="editingName = false"
      @blur="saveName" />
    <span v-else class="conversationName" :title="name" :tabindex="sessionFile ? 0 : -1" @dblclick="editName" @keydown.enter.prevent="editName">{{ name }}</span>
    <div class="menuActions">
      <el-button text circle aria-label="新建对话" title="新建对话" @click="emit('newChat')"><icon-message-plus :size="17" /></el-button>
      <el-popover v-model:visible="historyVisible" trigger="click" placement="bottom-end" :width="280" :showArrow="false" @show="emit('history')">
        <template #reference>
          <el-button text circle :loading="loading" :icon="IconHistory" aria-label="历史对话" title="历史对话" />
        </template>
        <div class="historyList" role="group" aria-label="历史对话">
          <p v-if="!history.length" class="historyTips" role="status">{{ loading ? "正在加载对话…" : "暂无历史对话，点击“新建对话”开始。" }}</p>
          <div
            v-for="item in history"
            :key="item.file"
            class="historyItem"
            :class="{ selected: item.file === sessionFile }">
            <button
              class="historySelect"
              type="button"
              :aria-current="item.file === sessionFile ? 'true' : undefined"
              :title="item.name"
              @click="selectConversation(item.file)">
              <icon-message-circle :size="16" />
              <span class="historyName">{{ item.name }}</span>
              <icon-check v-if="item.file === sessionFile" :size="15" />
            </button>
            <el-button class="historyAction" text circle :aria-label="`重命名对话 ${item.name}`" title="重命名对话" @click.stop="renameHistory(item)">
              <icon-pencil :size="14" />
            </el-button>
            <el-button v-if="history.length > 1" class="historyAction" text circle :aria-label="`移除历史对话 ${item.name}`" title="移除历史对话" @click.stop="emit('remove', item.file)">
              <icon-x :size="14" />
            </el-button>
          </div>
        </div>
      </el-popover>
      <el-button text circle :loading="configLoading" :icon="IconAdjustmentsHorizontal" aria-label="媒体生成控制" title="媒体生成控制" @click="openMediaConfig" />
      <el-button text circle aria-label="关闭对话" title="关闭" @click="emit('close')"><icon-x :size="17" /></el-button>
    </div>
  </header>
  <pluginConfigDialog v-if="mediaTool" v-model="configVisible" :plugin="mediaTool" :canManage="canManageTools" />
</template>

<script setup lang="ts">
import axios from "axios";
import { nextTick, ref, shallowRef } from "vue";
import { ElMessage, ElMessageBox, type InputInstance } from "element-plus";
import type { AgentHistory } from "./types";
import pluginConfigDialog from "@/components/settings/panels/pluginMarket/pluginConfigDialog.vue";
import type { Plugin } from "@/components/settings/panels/pluginMarket/types";
import {
  IconMessagePlus, IconHistory,
  IconX, IconPencil,
  IconMessageCircle, IconCheck, IconAdjustmentsHorizontal,
} from "@tabler/icons-vue";

const props = defineProps<{ name: string; history: AgentHistory[]; sessionFile?: string; loading: boolean }>();
const emit = defineEmits<{ newChat: []; history: []; select: [file: string]; rename: [file: string, name: string]; remove: [file: string]; close: [] }>();
const historyVisible = ref(false);
const editingName = ref(false);
const nameDraft = ref("");
const nameInput = ref<InputInstance>();
const configVisible = ref(false);
const configLoading = ref(false);
const canManageTools = ref(false);
const mediaTool = shallowRef<Plugin>();

async function openMediaConfig() {
  if (configLoading.value) return;
  configLoading.value = true;
  try {
    const { data } = await axios.get<{ code: number; data: { tools: (Plugin & { loadError?: string })[]; canManage: boolean }; message?: string }>("/api/tools/get", {
      headers: { "Cache-Control": "no-cache", "x-toonflow-workspace": "1" },
    });
    if (data.code !== 200) throw new Error(data.message || "读取工具配置失败");
    const tool = data.data.tools.find(tool => tool.name === "mediaGeneration");
    if (!tool) throw new Error("请先安装媒体生成工具");
    if (tool.loadError) throw new Error(tool.loadError);
    mediaTool.value = { ...tool, key: `tool:${tool.name}`, type: "tool" };
    canManageTools.value = data.data.canManage;
    configVisible.value = true;
  } catch (error) {
    ElMessage.error(axios.isAxiosError(error) ? error.response?.data?.message || "读取工具配置失败" : error instanceof Error ? error.message : "读取工具配置失败");
  } finally { configLoading.value = false; }
}

function selectConversation(file: string) {
  historyVisible.value = false;
  emit("select", file);
}

async function editName() {
  if (!props.sessionFile) return;
  nameDraft.value = props.name;
  editingName.value = true;
  await nextTick();
  nameInput.value?.select();
}

function saveName(event: Event) {
  if (!editingName.value || (event instanceof KeyboardEvent && event.isComposing)) return;
  const value = nameDraft.value.trim();
  if (value && props.sessionFile) emit("rename", props.sessionFile, value);
  editingName.value = false;
}

async function renameHistory(item: AgentHistory) {
  const result = await ElMessageBox.prompt("请输入对话名称", "重命名对话", {
    inputValue: item.name,
    confirmButtonText: "保存",
    cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() && value.trim().length <= 80 || "请输入 1–80 个字符的对话名称",
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

  .conversationName {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
  }

  .menuActions {
    display: flex;
    flex-shrink: 0;
    gap: 4px;

    .el-button {
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
      color: var(--el-text-color-secondary);
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
