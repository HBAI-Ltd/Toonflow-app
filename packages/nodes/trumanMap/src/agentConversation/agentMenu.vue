<template>
  <header class="agentMenu" @keydown.esc="closeHistory">
    <el-input
      v-if="editingName"
      ref="nameInput"
      v-model="nameDraft"
      class="conversationName"
      size="small"
      :maxlength="80"
      aria-label="对话名称"
      @keydown.stop
      @keydown.enter="saveName"
      @keydown.esc.prevent="editingName = false"
      @blur="saveName" />
    <span v-else class="conversationName">
      <span class="conversationTitle" :title="name" tabindex="0" @dblclick="editName" @keydown.enter.prevent="editName">{{ name }}</span>
    </span>
    <div class="menuActions">
      <el-button text circle :disabled="busy" aria-label="新建对话" title="新建对话" @click="emit('newChat')"><icon-message-plus :size="16" /></el-button>
      <el-popover v-model:visible="historyVisible" trigger="click" placement="bottom-end" :width="280" :showArrow="false">
        <template #reference>
          <el-button text circle :icon="IconHistory" :aria-expanded="historyVisible" aria-label="历史对话" title="历史对话" />
        </template>
        <div class="agentHistoryList" role="group" aria-label="历史对话">
          <p v-if="!history.length" class="historyTips" role="status">暂无历史对话，点击“新建对话”开始。</p>
          <div v-for="item in history" :key="item.id" class="historyItem" :class="{ selected: item.id === sessionId }">
            <button class="historySelect" type="button" :disabled="busy && item.id !== sessionId" :aria-current="item.id === sessionId ? 'true' : undefined" :title="item.name" @click="selectConversation(item.id)">
              <icon-message-circle :size="16" />
              <span class="historyName">{{ item.name }}</span>
              <icon-check v-if="item.id === sessionId" :size="15" />
            </button>
            <el-button class="historyAction" text circle :aria-label="`重命名对话 ${item.name}`" title="重命名对话" @click.stop="renameHistory(item)">
              <icon-pencil :size="14" />
            </el-button>
            <el-button v-if="history.length > 1" class="historyAction" text circle :disabled="busy" :aria-label="`移除历史对话 ${item.name}`" title="移除历史对话" @click.stop="emit('remove', item.id)">
              <icon-trash :size="14" />
            </el-button>
          </div>
        </div>
      </el-popover>
      <el-button text circle aria-label="关闭对话" title="关闭" @click="emit('close')"><icon-x :size="16" /></el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { ElButton, ElInput, ElMessageBox, ElPopover, type InputInstance } from "element-plus";
import { IconCheck, IconHistory, IconMessageCircle, IconMessagePlus, IconPencil, IconTrash, IconX } from "@tabler/icons-vue";

/**
 * 与宿主 Agent 的标题栏同构：对话名（双击改名）、新建对话、历史对话（切换 / 重命名 / 移除）、关闭。
 * busy 是有回复在生成或正在压缩：这时不能新建、切换和移除，改名不受影响。
 */
const props = defineProps<{ name: string; history: { id: string; name: string }[]; sessionId: string; busy?: boolean }>();
const emit = defineEmits<{ newChat: []; select: [id: string]; rename: [id: string, name: string]; remove: [id: string]; close: [] }>();
const historyVisible = ref(false);
const editingName = ref(false);
const nameDraft = ref("");
const nameInput = ref<InputInstance>();

watch(() => props.sessionId, () => {
  editingName.value = false;
  historyVisible.value = false;
});

// 历史弹层开着时，Esc 只关弹层，不把整个对话面板也收起来。
function closeHistory(event: KeyboardEvent) {
  if (!historyVisible.value) return;
  event.stopPropagation();
  event.preventDefault();
  historyVisible.value = false;
}

function selectConversation(id: string) {
  historyVisible.value = false;
  emit("select", id);
}

async function editName() {
  nameDraft.value = props.name;
  editingName.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}

function saveName(event: Event) {
  if (!editingName.value || (event instanceof KeyboardEvent && event.isComposing)) return;
  const value = nameDraft.value.trim();
  if (value && value !== props.name) emit("rename", props.sessionId, value);
  editingName.value = false;
}

async function renameHistory(item: { id: string; name: string }) {
  const result = await ElMessageBox.prompt("请输入对话名称", "重命名对话", {
    inputValue: item.name,
    confirmButtonText: "保存",
    cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() && value.trim().length <= 80 || "请输入 1–80 个字符的对话名称",
  }).catch(() => null);
  if (result && result.value.trim() !== item.name) emit("rename", item.id, result.value.trim());
}
</script>

<style lang="scss" scoped>
.agentMenu {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  min-width: 0;
  padding: 0 0 6px 4px;

  .conversationName {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 500;

    .conversationTitle {
      cursor: text;
      user-select: text;
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; border-radius: 4px; }
    }
  }

  .menuActions {
    display: flex;
    flex-shrink: 0;
    gap: 4px;

    :deep(.el-button) {
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
      color: var(--el-text-color-secondary);
      .el-icon { font-size: 16px; }
    }
  }
}

.agentHistoryList {
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
      &:disabled { cursor: default; opacity: 0.5; }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }

      .historyName {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    svg { flex-shrink: 0; }

    .historyAction {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      margin: 0;
      padding: 0;
      &:last-child { margin-right: 6px; }
    }
  }
}
</style>
