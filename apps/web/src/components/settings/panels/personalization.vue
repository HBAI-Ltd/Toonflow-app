<template>
  <div class="personalization">
    <section class="settingSection" aria-labelledby="instructionsTitle">
      <div class="settingInfo">
        <h3 id="instructionsTitle">{{ t("personalization.instructions") }}</h3>
        <p class="description">{{ t("personalization.instructionsDescription") }}</p>
      </div>
      <el-alert v-if="document.error" :title="getErrorDisplay(document.error)" type="error" :closable="false" showIcon />
      <el-input
        v-model="document.content"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 8 }"
        :maxlength="maxLength"
        :disabled="!document.loaded || document.loading"
        resize="none"
        :aria-label="t('personalization.instructions')" />
      <div class="editorFooter">
        <span class="editorStatus">
          {{ document.loading ? t("common.loading") : isDirty(document) ? t("common.unsavedChanges") : "" }}
          <span>{{ document.content.length }} / {{ maxLength }}</span>
        </span>
        <div class="editorActions">
          <el-button
            :icon="IconRefresh"
            :loading="document.loading"
            :disabled="document.saving"
            :aria-label="t('personalization.reloadInstructions')"
            @click="reloadDocument(document, 'agents')">
            {{ t(document.loaded ? "common.reload" : "common.retry") }}
          </el-button>
          <el-button
            type="primary"
            :icon="IconDeviceFloppy"
            :loading="document.saving"
            :disabled="!document.loaded || document.loading || document.conflict || !isDirty(document) || document.content.length > maxLength"
            :aria-label="t('personalization.saveInstructions')"
            @click="saveDocument(document, 'agents')">
            {{ t("common.save") }}
          </el-button>
        </div>
      </div>
    </section>
    <section class="settingSection">
      <div class="memoryOptions">
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>{{ t("personalization.enableMemory") }}</h4>
            <p class="description">{{ t("personalization.enableMemoryDescription") }}</p>
          </div>
          <el-switch
            :modelValue="memoryEnabled"
            :loading="savingMemorySetting"
            :aria-label="t('personalization.enableMemory')"
            @change="(value) => setMemoryEnabled(value === true)" />
        </div>
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>{{ t("personalization.deleteMemory") }}</h4>
          </div>
          <el-button
            :icon="IconTrash"
            :loading="memoryAction === 'delete'"
            :disabled="!!memoryAction || memoryDocument.loading || memoryDocument.saving"
            :aria-label="t('personalization.deleteMemory')"
            @click="deleteMemory">
            {{ t("common.delete") }}
          </el-button>
        </div>
        <div class="settingHeader">
          <div class="settingInfo">
            <h4>{{ t("personalization.viewMemory") }}</h4>
          </div>
          <el-button :icon="IconEye" :loading="memoryAction === 'view'" :disabled="!!memoryAction || memoryDocument.loading || memoryDocument.saving" :aria-label="t('personalization.viewMemory')" @click="viewMemory">
            {{ t("common.view") }}
          </el-button>
        </div>
      </div>
    </section>
    <el-dialog v-model="memoryVisible" :title="t('personalization.memoryTitle')" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody>
      <div class="memoryContent">
        <el-alert v-if="memoryDocument.error" :title="getErrorDisplay(memoryDocument.error)" type="error" :closable="false" showIcon />
        <el-input
          v-if="memoryEditing"
          v-model="memoryDocument.content"
          type="textarea"
          :autosize="{ minRows: 10, maxRows: 18 }"
          :maxlength="maxLength"
          :disabled="memoryDocument.loading"
          resize="none"
          :aria-label="t('personalization.localMemory')" />
        <messageMarkdown v-else-if="memoryDocument.content.trim()" :content="memoryDocument.content" />
        <el-empty v-else :description="t('personalization.noMemory')" :imageSize="80" />
      </div>
      <template #footer>
        <div class="memoryFooter">
          <span class="editorStatus">
            {{ isDirty(memoryDocument) ? `${t("common.unsavedChanges")} · ` : "" }}{{ memoryDocument.content.length }} / {{ maxLength }}
          </span>
          <div class="editorActions">
            <el-button
              :icon="IconRefresh"
              :loading="memoryDocument.loading"
              :disabled="memoryDocument.saving"
              :aria-label="t('personalization.reloadMemory')"
              @click="reloadDocument(memoryDocument, 'memory')">
              {{ t("common.reload") }}
            </el-button>
            <el-button
              v-if="memoryEditing"
              type="primary"
              :icon="IconDeviceFloppy"
              :loading="memoryDocument.saving"
              :disabled="memoryDocument.loading || memoryDocument.conflict || !isDirty(memoryDocument) || memoryDocument.content.length > maxLength"
              :aria-label="t('personalization.saveMemory')"
              @click="saveMemory">
              {{ t("common.save") }}
            </el-button>
            <el-button v-else type="primary" :icon="IconEdit" :disabled="memoryDocument.loading" :aria-label="t('personalization.editMemory')" @click="memoryEditing = true">
              {{ t("common.edit") }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
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
  error?: Error;
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
  error: undefined,
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
  content: "", revision: "", savedContent: "", loaded: false, loading: false, saving: false, conflict: false, error: undefined,
});

function isDirty(document: DocumentState) {
  return document.content !== document.savedContent;
}

function documentError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) return new Error(error.response.data.message);
  return error instanceof Error ? error : createDisplayError("操作失败，请重试", () => t("common.operationFailedRetry"));
}

function errorMessage(error: unknown) {
  return getErrorDisplay(documentError(error));
}

async function loadDocument(document: DocumentState, name: "agents" | "memory", discardChanges = false) {
  if (document.loading || document.saving || (!discardChanges && isDirty(document))) return;
  const content = document.content;
  document.loading = true;
  document.error = undefined;
  try {
    const { data } = await axios.get<DocumentResponse>("/api/settings/personalization/get", { params: { document: name }, headers });
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("读取失败，请重试", () => t("personalization.loadFailed"));
    if (document.content !== content) return;
    document.content = data.data.content;
    document.savedContent = data.data.content;
    document.revision = data.data.revision;
    document.loaded = true;
    document.conflict = false;
  } catch (error) {
    document.error = documentError(error);
  } finally {
    document.loading = false;
  }
}

async function reloadDocument(document: DocumentState, name: "agents" | "memory") {
  if (isDirty(document)) {
    try {
      await ElMessageBox.confirm(t("personalization.reloadDiscardPrompt"), t("common.reload"), {
        confirmButtonText: t("personalization.discardAndLoad"),
        cancelButtonText: t("personalization.continueEditing"),
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
    ElMessage.error(t("personalization.tooLong", { maxLength }));
    return;
  }
  document.saving = true;
  document.error = undefined;
  try {
    const { data } = await axios.put<DocumentResponse>(
      "/api/settings/personalization/save",
      { document: name, content, revision: document.revision },
      { headers }
    );
    if (data.code === 409) {
      document.conflict = true;
      throw createDisplayError("文件已被其他操作修改。当前草稿已保留，请先复制需要保留的内容，再重新加载最新版本。", () => t("personalization.conflict"));
    }
    if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("保存失败，请重试", () => t("common.saveFailedRetry"));
    document.savedContent = data.data.content;
    document.revision = data.data.revision;
    if (document.content === content) document.content = data.data.content;
    ElMessage.success(t("personalization.saved", { name: name === "agents" ? t("personalization.instructions") : t("personalization.localMemory") }));
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) document.conflict = true;
    document.error = document.conflict
      ? createDisplayError("文件已被其他操作修改。当前草稿已保留，请先复制需要保留的内容，再重新加载最新版本。", () => t("personalization.conflict"))
      : documentError(error);
    ElMessage.error(getErrorDisplay(document.error));
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
  if (data.code !== 200) throw new Error(data.message || t("personalization.loadMemoryFailed"));
  return data.data;
}

async function viewMemory() {
  if (memoryAction.value || memoryDocument.loading || memoryDocument.saving) return;
  memoryAction.value = "view";
  try {
    await loadDocument(memoryDocument, "memory");
    if (memoryDocument.loaded) memoryVisible.value = true;
    else ElMessage.error(memoryDocument.error ? getErrorDisplay(memoryDocument.error) : t("personalization.loadFailed"));
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
      ElMessage.info(t("personalization.noMemory"));
      return;
    }
    try {
      await ElMessageBox.confirm(t("personalization.deleteMemoryPrompt"), t("personalization.deleteMemory"), {
        confirmButtonText: t("common.delete"),
        cancelButtonText: t("common.cancel"),
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
    if (data.code === 409) throw new Error(t("personalization.memoryChanged"));
    if (data.code !== 200) throw new Error(data.message || t("personalization.deleteMemoryFailed"));
    Object.assign(memoryDocument, data.data, { savedContent: data.data.content, loaded: true, conflict: false, error: undefined });
    memoryEditing.value = false;
    ElMessage.success(t("personalization.memoryDeleted"));
  } catch (error) {
    ElMessage.error(
      axios.isAxiosError(error) && error.response?.status === 409 ? t("personalization.memoryChanged") : errorMessage(error)
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
