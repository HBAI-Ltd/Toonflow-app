<template>
  <el-button v-if="!hideTrigger" class="workspaceButton" text :icon="IconFolder" :loading="selecting" :disabled="loading || disabled" :title="selectedDirectory || t('chooseWorkspaceFolder')" :aria-label="t('chooseWorkspaceFolder')" @click="chooseDirectory">
    <span class="directoryName">{{ selectedDirectory ? selectedDirectory.split(/[\\/]/).filter(Boolean).at(-1) || selectedDirectory : t("workspaceFolder") }}</span>
    <icon-chevron-down :size="14" />
  </el-button>
  <el-dialog v-model="dialogVisible" :title="t('chooseServerWorkspaceFolder')" width="min(680px, 92vw)" appendToBody :closeOnClickModal="!editing" :closeOnPressEscape="!editing" :showClose="!editing" @close="finishSelection?.(null)">
    <div class="workspaceBrowser">
      <div class="directoryHeader">
        <el-button :icon="IconArrowLeft" circle :disabled="loading || editing || !listing?.path" :aria-label="t('parentFolder')" @click="loadDirectory(listing?.parent ?? '')" />
        <el-text class="directoryPath" truncated :title="listing?.absolutePath">{{ t("serverWorkspacePath", { path: listing?.path ? ` / ${listing.path}` : "" }) }}</el-text>
        <el-button :icon="IconFolderPlus" :disabled="loading || editing || !listing || !!browseError" @click="manageEntry('mkdir')">{{ t("newFolder") }}</el-button>
      </div>
      <el-alert v-if="browseError" :title="getErrorDisplay(browseError)" type="error" :closable="false" />
      <el-table v-loading="loading" :data="listing?.entries ?? []" height="300" :emptyText="t('thisFolderIsEmpty')">
        <el-table-column :label="t('name')" minWidth="160">
          <template #default="{ row }">
            <el-button v-if="row.type === 'directory'" class="entryName" link :icon="IconFolder" :title="row.name" :disabled="loading || editing" @click="loadDirectory([listing?.path, row.path].filter(Boolean).join('/'))">{{ row.name }}</el-button>
            <span v-else class="fileName" :title="row.name"><icon-file :size="16" /><span>{{ row.name }}</span></span>
          </template>
        </el-table-column>
        <el-table-column :label="t('actions')" width="130" align="right">
          <template #default="{ row }">
            <el-button link :disabled="loading || editing" :aria-label="t('renameEntry', { name: row.name })" @click="manageEntry('rename', row as WorkspaceEntry)">{{ t("rename") }}</el-button>
            <el-button link type="danger" :disabled="loading || editing" :aria-label="t('deleteEntry', { name: row.name })" @click="manageEntry('remove', row as WorkspaceEntry)">{{ t("delete") }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button :disabled="editing" @click="dialogVisible = false">{{ t("cancel") }}</el-button>
      <el-button type="primary" :disabled="loading || editing || !listing || !!browseError" @click="confirmDirectory">{{ t("chooseThisFolder") }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "@/pages/i18n";
import { createDisplayError, getErrorDisplay, getLocale } from "@toonflow/i18n";
import axios from "axios";
import { onBeforeUnmount, ref, shallowRef } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconFolder, IconFolderPlus, IconFile, IconChevronDown, IconArrowLeft } from "@tabler/icons-vue";
import useWorkspaceFiles from "@/lib/workspaceFiles";

type WorkspaceEntry = { name: string; path: string; type: "file" | "directory" };
type DirectoryListing = {
  path: string;
  absolutePath: string;
  parent: string | null;
  entries: WorkspaceEntry[];
};

const selectedDirectory = defineModel<string>({ default: "" });
const props = defineProps<{ disabled?: boolean; hideTrigger?: boolean }>();
const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const dialogVisible = ref(false);
const selecting = ref(false);
const loading = ref(false);
const editing = ref(false);
const listing = ref<DirectoryListing>();
const browseError = shallowRef<Error>();
let finishSelection: ((directory: string | null) => void) | undefined;
onBeforeUnmount(() => finishSelection?.(null));
defineExpose({ chooseDirectory });

async function chooseDirectory(): Promise<string | null> {
  if (selecting.value || loading.value || props.disabled) return null;
  selecting.value = true;
  try {
    if (isDesktop) {
      const { data } = await axios.post<{ data: { directory: string | null } }>("/api/desktop/selectDirectory", null, { headers: { "x-toonflow-desktop": "1" } });
      if (data.data.directory) selectedDirectory.value = data.data.directory;
      return data.data.directory;
    }
    const { data } = await axios.post<{ code: number; data: { native: boolean; directory: string | null } }>("/api/workspaces/selectDirectory", null, { headers: { "x-toonflow-workspace": "1" } });
    if (data.data.native) {
      if (data.data.directory) selectedDirectory.value = data.data.directory;
      return data.data.directory;
    } else {
      dialogVisible.value = true;
      void loadDirectory("");
      return await new Promise<string | null>(resolve => { finishSelection = resolve; });
    }
  } catch (error) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || t("couldNotOpenTheFolder") : t("couldNotOpenTheFolder"));
    return null;
  }
  finally { selecting.value = false; finishSelection = undefined; }
}

async function loadDirectory(path: string) {
  if (loading.value) return;
  loading.value = true;
  browseError.value = undefined;
  try {
    const { data } = await axios.get<{ code: number; data: Omit<DirectoryListing, "entries">; message: string }>("/api/workspaces/list", { params: { path } });
    if (data.code !== 200) throw new Error(data.message);
    listing.value = { ...data.data, entries: [] };
    const { entries } = await useWorkspaceFiles(data.data.absolutePath).list();
    listing.value = { ...data.data, entries: entries.sort((a, b) => Number(b.type === "directory") - Number(a.type === "directory") || a.name.localeCompare(b.name, getLocale() === "en" ? "en" : "zh-CN", { numeric: true })) };
  } catch (err) {
    browseError.value = axios.isAxiosError<{ message?: string }>(err) && err.response?.data?.message
      ? new Error(err.response.data.message)
      : createDisplayError("读取目录失败，请重试", () => t("couldNotReadTheFolder"));
  } finally { loading.value = false; }
}

async function manageEntry(action: "mkdir" | "rename" | "remove", entry?: WorkspaceEntry) {
  const directory = listing.value;
  if (!directory || loading.value || editing.value || browseError.value || (action !== "mkdir" && !entry)) return;
  const files = useWorkspaceFiles(directory.absolutePath);
  editing.value = true;
  try {
    if (action === "remove" && entry) {
      await ElMessageBox.confirm(entry.type === "directory"
        ? t("deleteFolderConfirm", { name: entry.name })
        : t("deleteFileConfirm", { name: entry.name }), t("confirmDeletion"), {
        type: "warning", confirmButtonText: t("delete"), cancelButtonText: t("cancel"),
      });
      await files.remove(entry.path, entry.type === "directory");
    } else {
      const { value } = await ElMessageBox.prompt(t("enterAName"), action === "mkdir" ? t("newFolder") : t("rename"), {
        inputValue: entry?.name ?? "新建文件夹",
        inputValidator: value => {
          const name = value?.trim();
          return !!name && name !== "." && name !== ".." && !/[\\/:*?"<>|\u0000-\u001f]/.test(name) || t("invalidEntryName");
        },
        confirmButtonText: action === "mkdir" ? t("create") : t("save"), cancelButtonText: t("cancel"),
      });
      const name = value.trim();
      if (action === "mkdir") await files.mkdir(name);
      else if (entry && name !== entry.name) await files.rename(entry.path, name);
      else return;
    }
    if (entry?.type === "directory") {
      const path = `${directory.absolutePath.replaceAll("\\", "/").replace(/\/$/, "")}/${entry.path}`;
      const selected = selectedDirectory.value.replaceAll("\\", "/").replace(/\/$/, "");
      if (selected === path || selected.startsWith(`${path}/`)) selectedDirectory.value = "";
    }
    await loadDirectory(directory.path);
  } catch (error) {
    if (error !== "cancel" && error !== "close") ElMessage.error(axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message || t("operationFailedPleaseTryAgain") : error instanceof Error ? getErrorDisplay(error) : t("operationFailedPleaseTryAgain"));
  } finally { editing.value = false; }
}

function confirmDirectory() {
  if (loading.value || editing.value || !listing.value || browseError.value) return;
  selectedDirectory.value = listing.value.absolutePath;
  finishSelection?.(listing.value.absolutePath);
  dialogVisible.value = false;
}
</script>

<style lang="scss" scoped>
.workspaceButton {
  max-width: min(340px, 100%);

  :deep(> span) { min-width: 0; gap: 6px; }
  .directoryName { overflow: hidden; text-overflow: ellipsis; }
  svg { flex-shrink: 0; }
}

.workspaceBrowser {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .directoryHeader {
    display: flex;
    align-items: center;
    gap: 12px;

    .directoryPath { flex: 1; min-width: 0; }
    .el-button { flex-shrink: 0; }
  }

  .entryName {
    max-width: 100%;
    :deep(> span) { overflow: hidden; text-overflow: ellipsis; }
  }

  .fileName {
    display: flex;
    align-items: center;
    gap: 6px;
    svg { flex-shrink: 0; }
    span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}
</style>
