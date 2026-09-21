<template>
  <el-button v-if="!hideTrigger" class="workspaceButton" text :icon="IconFolder" :loading="selecting" :disabled="loading || disabled" :title="selectedDirectory || '选择工作目录'" aria-label="选择工作目录" @click="chooseDirectory">
    <span class="directoryName">{{ selectedDirectory ? selectedDirectory.split(/[\\/]/).filter(Boolean).at(-1) || selectedDirectory : '工作目录' }}</span>
    <icon-chevron-down :size="14" />
  </el-button>
  <el-dialog v-model="dialogVisible" title="选择服务器工作目录" width="min(560px, 92vw)" appendToBody @close="finishSelection?.(null)">
    <div class="workspaceBrowser">
      <div class="directoryHeader">
        <el-button :icon="IconArrowLeft" circle :disabled="loading || !listing?.path" aria-label="上一级目录" @click="loadDirectory(listing?.parent ?? '')" />
        <el-text truncated :title="listing?.absolutePath">服务器工作区{{ listing?.path ? ` / ${listing.path}` : '' }}</el-text>
      </div>
      <el-alert v-if="browseError" :title="browseError" type="error" :closable="false" />
      <el-table v-loading="loading" :data="listing?.directories ?? []" height="300" emptyText="当前目录没有子文件夹">
        <el-table-column label="文件夹">
          <template #default="{ row }">
            <el-button link :icon="IconFolder" :disabled="loading" @click="loadDirectory(row.path)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="loading || !listing || !!browseError" @click="confirmDirectory">选择此目录</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import { IconFolder, IconChevronDown, IconArrowLeft } from "@tabler/icons-vue";

type DirectoryListing = {
  path: string;
  absolutePath: string;
  parent: string | null;
  directories: { name: string; path: string }[];
};

const selectedDirectory = defineModel<string>({ default: "" });
const props = defineProps<{ disabled?: boolean; hideTrigger?: boolean }>();
const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const dialogVisible = ref(false);
const selecting = ref(false);
const loading = ref(false);
const listing = ref<DirectoryListing>();
const browseError = ref("");
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
    ElMessage.error(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "无法打开文件夹选择器，请重试" : "无法打开文件夹选择器，请重试");
    return null;
  }
  finally { selecting.value = false; finishSelection = undefined; }
}

async function loadDirectory(path: string) {
  if (loading.value) return;
  loading.value = true;
  browseError.value = "";
  try {
    const { data } = await axios.get<{ code: number; data: DirectoryListing; message: string }>("/api/workspaces/list", { params: { path } });
    if (data.code !== 200) throw new Error(data.message);
    listing.value = data.data;
  } catch (err) {
    browseError.value = axios.isAxiosError<{ message?: string }>(err) ? err.response?.data.message || "读取目录失败，请重试" : "读取目录失败，请重试";
  } finally { loading.value = false; }
}

function confirmDirectory() {
  if (loading.value || !listing.value || browseError.value) return;
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
  }
}
</style>
