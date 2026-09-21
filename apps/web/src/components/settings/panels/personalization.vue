<template>
  <div class="personalization">
    <section class="settingSection" aria-labelledby="instructionsTitle">
      <div class="settingInfo">
        <h3 id="instructionsTitle">Toonflow 说明</h3>
        <p class="description">为所有聊天提供额外说明和上下文。支持 Markdown，保存后下一次发送消息时生效。</p>
      </div>
      <el-alert v-if="document.error" :title="document.error" type="error" :closable="false" showIcon />
      <el-input
        v-model="document.content"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 8 }"
        :maxlength="maxLength"
        :disabled="!document.loaded || document.loading"
        resize="none"
        aria-label="Toonflow 说明内容" />
      <div class="editorFooter">
        <span class="editorStatus">
          {{ document.loading ? "正在读取…" : isDirty(document) ? "有未保存的修改" : "" }}
          <span>{{ document.content.length }} / {{ maxLength }}</span>
        </span>
        <div class="editorActions">
          <el-button
            :icon="IconRefresh"
            :loading="document.loading"
            :disabled="document.saving"
            aria-label="重新加载 Toonflow 说明"
            @click="reloadDocument(document, 'agents')">
            {{ document.loaded ? "重新加载" : "重试" }}
          </el-button>
          <el-button
            type="primary"
            :icon="IconDeviceFloppy"
            :loading="document.saving"
            :disabled="!document.loaded || document.loading || document.conflict || !isDirty(document) || document.content.length > maxLength"
            aria-label="保存 Toonflow 说明"
            @click="saveDocument(document, 'agents')">
            保存
          </el-button>
        </div>
      </div>
    </section>
    <section class="settingSection">
      <div class="memoryOptions">
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>启用本地记忆</h4>
            <p class="description">记住你的偏好，在后续聊天中使用。关闭后仍保留已保存的内容。</p>
          </div>
          <el-switch
            :modelValue="memoryEnabled"
            :loading="savingMemorySetting"
            aria-label="启用本地记忆"
            @change="(value) => setMemoryEnabled(value === true)" />
        </div>
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>删除本地记忆</h4>
          </div>
          <el-button
            :icon="IconTrash"
            :loading="memoryAction === 'delete'"
            :disabled="!!memoryAction || memoryDocument.loading || memoryDocument.saving"
            aria-label="删除本地记忆"
            @click="deleteMemory">
            删除
          </el-button>
        </div>
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>查看本地记忆</h4>
          </div>
          <el-button :icon="IconEye" :loading="memoryAction === 'view'" :disabled="!!memoryAction || memoryDocument.loading || memoryDocument.saving" aria-label="查看本地记忆" @click="viewMemory">
            查看
          </el-button>
        </div>
      </div>
    </section>
    <el-dialog v-model="memoryVisible" title="Toonflow 记忆" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody>
      <div class="memoryContent">
        <el-alert v-if="memoryDocument.error" :title="memoryDocument.error" type="error" :closable="false" showIcon />
        <el-input
          v-if="memoryEditing"
          v-model="memoryDocument.content"
          type="textarea"
          :autosize="{ minRows: 10, maxRows: 18 }"
          :maxlength="maxLength"
          :disabled="memoryDocument.loading"
          resize="none"
          aria-label="本地记忆内容" />
        <messageMarkdown v-else-if="memoryDocument.content.trim()" :content="memoryDocument.content" />
        <el-empty v-else description="暂无本地记忆" :imageSize="80" />
      </div>
      <template #footer>
        <div class="memoryFooter">
          <span class="editorStatus">
            {{ isDirty(memoryDocument) ? "有未保存的修改 · " : "" }}{{ memoryDocument.content.length }} / {{ maxLength }}
          </span>
          <div class="editorActions">
            <el-button
              :icon="IconRefresh"
              :loading="memoryDocument.loading"
              :disabled="memoryDocument.saving"
              aria-label="重新加载本地记忆"
              @click="reloadDocument(memoryDocument, 'memory')">
              重新加载
            </el-button>
            <el-button
              v-if="memoryEditing"
              type="primary"
              :icon="IconDeviceFloppy"
              :loading="memoryDocument.saving"
              :disabled="memoryDocument.loading || memoryDocument.conflict || !isDirty(memoryDocument) || memoryDocument.content.length > maxLength"
              aria-label="保存本地记忆"
              @click="saveMemory">
              保存
            </el-button>
            <el-button v-else type="primary" :icon="IconEdit" :disabled="memoryDocument.loading" aria-label="编辑本地记忆" @click="memoryEditing = true">
              编辑
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, reactive, ref, watch } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconDeviceFloppy, IconEdit, IconEye, IconRefresh, IconTrash } from "@tabler/icons-vue";
import { saveSettings, settings } from "@/stores/settings";
import messageMarkdown from "@/components/messageMarkdown.vue";

type DocumentContent = { content: string; revision: string };
type DocumentState = DocumentContent & {
  savedContent: string;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  conflict: boolean;
  error: string;
};
type DocumentResponse = { code: number; data: DocumentContent; message?: string };

const props = defineProps<{ visible: boolean }>();
const maxLength = 20000;
const headers = { "x-toonflow-workspace": "1" };
const document = reactive<DocumentState>({
  content: "",
  revision: "",
  savedContent: "",
  loaded: false,
  loading: false,
  saving: false,
  conflict: false,
  error: "",
});
const memoryEnabled = computed(() => {
  const value = settings.value.personalization;
  return !value || typeof value !== "object" || Array.isArray(value) || (value as Record<string, unknown>).memoryEnabled !== false;
});
const savingMemorySetting = ref(false);
const memoryAction = ref<"view" | "delete" | "">("");
const memoryVisible = ref(false);
const memoryEditing = ref(false);
const memoryDocument = reactive<DocumentState>({
  content: "", revision: "", savedContent: "", loaded: false, loading: false, saving: false, conflict: false, error: "",
});

function isDirty(document: DocumentState) {
  return document.content !== document.savedContent;
}

function errorMessage(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
    ? error.message
    : "操作失败，请重试";
}

async function loadDocument(document: DocumentState, name: "agents" | "memory", discardChanges = false) {
  if (document.loading || document.saving || (!discardChanges && isDirty(document))) return;
  const content = document.content;
  document.loading = true;
  document.error = "";
  try {
    const { data } = await axios.get<DocumentResponse>("/api/settings/personalization/get", { params: { document: name }, headers });
    if (data.code !== 200) throw new Error(data.message || "读取失败，请重试");
    if (document.content !== content) return;
    document.content = data.data.content;
    document.savedContent = data.data.content;
    document.revision = data.data.revision;
    document.loaded = true;
    document.conflict = false;
  } catch (error) {
    document.error = errorMessage(error);
  } finally {
    document.loading = false;
  }
}

async function reloadDocument(document: DocumentState, name: "agents" | "memory") {
  if (isDirty(document)) {
    try {
      await ElMessageBox.confirm("重新加载将放弃当前文档未保存的修改，读取最新内容。", "重新加载", {
        confirmButtonText: "放弃修改并加载",
        cancelButtonText: "继续编辑",
        type: "warning",
      });
    } catch {
      return;
    }
  }
  await loadDocument(document, name, true);
}

async function saveDocument(document: DocumentState, name: "agents" | "memory") {
  if (!document.loaded || document.loading || document.saving || document.conflict || !isDirty(document)) return;
  const content = document.content;
  if (content.length > maxLength) {
    ElMessage.error(`内容不能超过 ${maxLength} 个字符`);
    return;
  }
  document.saving = true;
  document.error = "";
  try {
    const { data } = await axios.put<DocumentResponse>(
      "/api/settings/personalization/save",
      { document: name, content, revision: document.revision },
      { headers }
    );
    if (data.code === 409) {
      document.conflict = true;
      throw new Error("文件已被其他操作修改。当前草稿已保留，请先复制需要保留的内容，再重新加载最新版本。");
    }
    if (data.code !== 200) throw new Error(data.message || "保存失败，请重试");
    document.savedContent = data.data.content;
    document.revision = data.data.revision;
    if (document.content === content) document.content = data.data.content;
    ElMessage.success(`${name === "agents" ? "Toonflow 说明" : "本地记忆"}已保存`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) document.conflict = true;
    document.error = document.conflict ? "文件已被其他操作修改。当前草稿已保留，请先复制需要保留的内容，再重新加载最新版本。" : errorMessage(error);
    ElMessage.error(document.error);
  } finally {
    document.saving = false;
  }
}

async function setMemoryEnabled(memoryEnabled: boolean) {
  if (savingMemorySetting.value) return;
  savingMemorySetting.value = true;
  try {
    await saveSettings((current) => {
      const value = current.personalization;
      return { personalization: { ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}), memoryEnabled } };
    });
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    savingMemorySetting.value = false;
  }
}

async function readMemory() {
  const { data } = await axios.get<DocumentResponse>("/api/settings/personalization/get", { params: { document: "memory" }, headers });
  if (data.code !== 200) throw new Error(data.message || "读取本地记忆失败，请重试");
  return data.data;
}

async function viewMemory() {
  if (memoryAction.value || memoryDocument.loading || memoryDocument.saving) return;
  memoryAction.value = "view";
  try {
    await loadDocument(memoryDocument, "memory");
    if (memoryDocument.loaded) memoryVisible.value = true;
    else ElMessage.error(memoryDocument.error);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    memoryAction.value = "";
  }
}

async function saveMemory() {
  if (await saveDocument(memoryDocument, "memory")) memoryEditing.value = isDirty(memoryDocument);
}

async function deleteMemory() {
  if (memoryAction.value || memoryDocument.loading || memoryDocument.saving) return;
  memoryAction.value = "delete";
  try {
    const memory = await readMemory();
    if (!memory.content && !isDirty(memoryDocument)) {
      ElMessage.info("暂无本地记忆");
      return;
    }
    try {
      await ElMessageBox.confirm("将删除所有工作区共用的本地记忆及未保存的记忆修改，此操作无法撤销。Toonflow 说明会保留。", "删除本地记忆", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      });
    } catch {
      return;
    }
    const { data } = await axios.put<DocumentResponse>(
      "/api/settings/personalization/save",
      { document: "memory", content: "", revision: memory.revision },
      { headers }
    );
    if (data.code === 409) throw new Error("本地记忆已更新，未删除任何内容。请重新查看后重试。");
    if (data.code !== 200) throw new Error(data.message || "删除本地记忆失败，请重试");
    Object.assign(memoryDocument, data.data, { savedContent: data.data.content, loaded: true, conflict: false, error: "" });
    memoryEditing.value = false;
    ElMessage.success("本地记忆已删除");
  } catch (error) {
    ElMessage.error(
      axios.isAxiosError(error) && error.response?.status === 409 ? "本地记忆已更新，未删除任何内容。请重新查看后重试。" : errorMessage(error)
    );
  } finally {
    memoryAction.value = "";
  }
}

function refreshDocument() {
  if (!props.visible) return;
  void loadDocument(document, "agents");
}

watch(() => props.visible, refreshDocument, { immediate: true });
onActivated(refreshDocument);
</script>

<style lang="scss" scoped>
.personalization {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px 8px;

  .settingSection {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 12px;

    h3,
    h4 {
      margin: 0;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .settingInfo {
      min-width: 0;

      .description {
        margin: 6px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.6;
      }
    }

    .memoryOptions {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .settingHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;

        > .el-button,
        > .el-switch {
          flex-shrink: 0;
        }
      }
    }

    .editorFooter {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .editorStatus {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }

      .editorActions {
        display: flex;
        gap: 8px;
        margin-left: auto;

        .el-button {
          margin-left: 0;
        }
      }
    }
  }
}

.memoryContent {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow: auto;
}

.memoryFooter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .editorStatus {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .editorActions {
    display: flex;
    gap: 8px;
    margin-left: auto;

    .el-button { margin-left: 0; }
  }
}
</style>
