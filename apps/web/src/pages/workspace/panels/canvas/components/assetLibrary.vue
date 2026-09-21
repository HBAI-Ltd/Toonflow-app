<template>
  <el-card v-if="visible" class="assetLibrary" shadow="never" :bodyStyle="{ padding: '8px' }" role="region" aria-label="素材库" @dblclick.stop>
    <div class="libraryToolbar">
      <el-input v-model="searchQuery" class="searchInput" :prefixIcon="IconSearch" placeholder="搜索素材" aria-label="搜索素材" clearable @keydown.esc.stop="searchQuery = ''" />
      <el-button class="toolbarButton" text :icon="IconFolderPlus" title="新建文件夹" aria-label="新建文件夹" :disabled="newFolderParent !== undefined" @click="startFolder" />
      <el-button class="toolbarButton" text :icon="IconX" title="关闭素材库" aria-label="关闭素材库" @click="visible = false" />
    </div>
    <el-scrollbar class="libraryScroll" maxHeight="min(440px, calc(100dvh - 198px))">
      <el-tree ref="assetTree" class="assetTree" :data="displayEntries" nodeKey="path" :props="{ label: 'name' }" :currentNodeKey="folder === '.' ? undefined : folder" :filterNodeMethod="filterEntry" defaultExpandAll highlightCurrent emptyText="" @nodeClick="selectFolder">
        <template #default="{ data }">
          <div class="assetEntry" :title="data.name" :draggable="data.type === 'file'" @dragstart.stop="startAssetDrag($event, data)" @dblclick.stop="openPreview(data)" @contextmenu="openItemMenu($event, data)">
            <icon-folder-filled v-if="data.type === 'directory'" class="folderIcon" :size="30" />
            <el-image v-else-if="mediaKind(data) === 'image'" class="assetThumbnail" :src="assetUrl(data.path)" fit="cover" loading="lazy" draggable="false" @click.stop="openPreview(data)">
              <template #error><icon-photo :size="22" /></template>
            </el-image>
            <span v-else class="fileIcon">
              <icon-music v-if="mediaKind(data) === 'audio'" :size="24" />
              <icon-video v-else-if="mediaKind(data) === 'video'" :size="24" />
              <icon-file v-else :size="24" />
            </span>
            <el-input v-if="data.draft" ref="folderInput" v-model="newFolderName" class="folderNameInput" size="small" aria-label="文件夹名称" :disabled="folderSaving" @click.stop @keydown.stop @keydown.enter.prevent="saveFolder" @keydown.esc.prevent="cancelFolder" @blur="saveFolder" />
            <span v-else class="assetName">{{ data.name }}</span>
            <el-button v-if="mediaKind(data)" class="moreButton" text :icon="IconEye" :aria-label="'预览 ' + data.name" title="预览（也可双击素材）" @click.stop="openPreview(data)" />
            <el-button v-if="!data.draft" class="moreButton" text :icon="IconDots" :aria-label="'更多 ' + data.name" title="更多" @click.stop="openItemMenu($event, data)" />
          </div>
        </template>
      </el-tree>
    </el-scrollbar>
    <div v-if="previewAsset?.kind === 'audio'" class="audioPreview">
      <div class="audioHeader">
        <span :title="previewAsset.name">{{ previewAsset.name }}</span>
        <el-button text :icon="IconX" aria-label="关闭音频预览" @click="previewAsset = undefined" />
      </div>
      <el-alert v-if="previewError" :title="previewError" type="error" :closable="false" showIcon />
      <audio v-else :key="previewAsset.url" :src="previewAsset.url" :aria-label="previewAsset.name" controls preload="metadata" @error="previewError = '音频无法播放，文件可能已损坏或当前浏览器不支持其编码。'" />
    </div>
  </el-card>

  <assetMenu v-if="visible" ref="assetMenuRef" :entries="entries" @changed="refreshAssets" />

  <el-image-viewer v-if="previewAsset?.kind === 'image'" :urlList="[previewAsset.url]" teleported @close="previewAsset = undefined" />

  <el-dialog :modelValue="previewAsset?.kind === 'video'" :title="previewAsset?.name" width="min(800px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose @update:modelValue="previewAsset = undefined">
    <div v-if="previewAsset?.kind === 'video'" class="assetPreview">
      <el-alert v-if="previewError" :title="previewError" type="error" :closable="false" showIcon />
      <video v-else :key="previewAsset.url" class="previewVideo" :src="previewAsset.url" :aria-label="previewAsset.name" controls playsinline preload="metadata" @error="previewError = '视频无法播放，文件可能已损坏或当前浏览器不支持其编码。'" />
    </div>
  </el-dialog>

  <el-dialog v-model="saveVisible" title="保存到素材库" width="460px" alignCenter appendToBody :closeOnClickModal="false" @opened="assetNameInput?.select()">
    <el-form class="saveForm" labelPosition="top" @submit.prevent="saveAsset">
      <el-form-item label="素材名称">
        <el-input ref="assetNameInput" v-model="assetName" aria-label="素材名称" placeholder="输入完整文件名" :disabled="saving" @keydown.enter.prevent="saveAsset" />
      </el-form-item>
      <el-form-item v-if="outputs.length > 1" label="节点输出">
        <el-select v-model="selectedOutput" aria-label="节点输出" :disabled="saving">
          <el-option v-for="(item, index) in outputs" :key="index" :label="item.label" :value="index" />
        </el-select>
      </el-form-item>
      <div class="saveLocation">
        <div class="locationHeader">
          <span>保存位置</span>
          <el-button text :icon="IconFolderPlus" :disabled="saving || saveFolderName !== undefined" @click="startSaveFolder">新建文件夹</el-button>
        </div>
        <div class="locationPath" :title="saveLocationLabel">{{ saveLocationLabel }}</div>
        <el-scrollbar class="saveFolderScroll" maxHeight="220px">
          <el-tree class="saveFolderTree" :data="folders" nodeKey="path" :props="{ label: 'name' }" :currentNodeKey="saveDirectory" :expandOnClickNode="false" defaultExpandAll highlightCurrent @nodeClick="(entry: AssetEntry) => { if (!saving && saveFolderName === undefined) saveDirectory = entry.path; }">
            <template #default="{ data }">
              <span class="saveFolderEntry"><icon-folder-filled :size="20" /><span>{{ data.name }}</span></span>
            </template>
          </el-tree>
        </el-scrollbar>
        <div v-if="saveFolderName !== undefined" class="createFolderRow">
          <el-input ref="saveFolderInput" v-model="saveFolderName" aria-label="新文件夹名称" :disabled="folderSaving" @keydown.enter.prevent="createFolder" @keydown.esc.stop="saveFolderName = undefined" />
          <el-button :loading="folderSaving" :disabled="!saveFolderName.trim()" @click="createFolder">创建</el-button>
          <el-button text :disabled="folderSaving" @click="saveFolderName = undefined">取消</el-button>
        </div>
      </div>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="saveVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!assetName.trim() || /[\\/]/.test(assetName) || saveFolderName !== undefined" @click="saveAsset">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import axios from "axios";
import { ElMessage, ElTree, type InputInstance, type TreeNodeData } from "element-plus";
import { IconDots, IconEye, IconFile, IconFolderFilled, IconFolderPlus, IconMusic, IconPhoto, IconSearch, IconVideo, IconX } from "@tabler/icons-vue";
import type { NodeOutput } from "@toonflow/nodes-scaffold/values";
import { startAssetDrag } from "../canvasDrop";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import assetMenu from "./assetMenu.vue";

type AssetEntry = { name: string; path: string; type: "file" | "directory"; children?: AssetEntry[]; draft?: boolean };
type AssetOutput = { label: string; output: NodeOutput };

const props = defineProps<{ directory?: string }>();
const visible = defineModel<boolean>({ default: false });
const saveVisible = ref(false);
const saving = ref(false);
const entries = ref<AssetEntry[]>([]);
const folder = ref(".");
const assetName = ref("");
const assetNameInput = ref<InputInstance>();
const saveDirectory = ref(".");
const saveFolderName = ref<string>();
const saveFolderInput = ref<InputInstance>();
const saveLocationLabel = computed(() => saveDirectory.value === "." ? "素材库" : `素材库 / ${saveDirectory.value.split("/").join(" / ")}`);
const searchQuery = ref("");
const assetTree = ref<InstanceType<typeof ElTree>>();
const folderInput = ref<InputInstance>();
const newFolderParent = ref<string>();
const newFolderName = ref("");
const folderSaving = ref(false);
const assetMenuRef = ref<InstanceType<typeof assetMenu>>();
const previewAsset = ref<{ name: string; url: string; kind: "image" | "audio" | "video" }>();
const previewError = ref("");
let loadRequest = 0;
onBeforeUnmount(() => { loadRequest++; });

function assetUrl(path: string) {
  return `/api/assets/read?path=${encodeURIComponent(path)}`;
}

function mediaKind(entry: AssetEntry) {
  if (entry.type !== "file" || entry.draft) return;
  if (/\.(avif|apng|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(entry.name)) return "image";
  if (/\.(mp3|wav|ogg|opus|flac|m4a|aac)$/i.test(entry.name)) return "audio";
  if (/\.(mp4|m4v|webm|mov|mkv|avi|ogv)$/i.test(entry.name)) return "video";
}

function openPreview(entry: AssetEntry) {
  const kind = mediaKind(entry);
  if (!kind) return;
  previewError.value = "";
  previewAsset.value = { name: entry.name, url: assetUrl(entry.path), kind };
}

function openItemMenu(event: MouseEvent, entry: AssetEntry) {
  if (entry.draft) return;
  event.preventDefault();
  event.stopPropagation();
  assetMenuRef.value?.openMenu(event, entry);
}

async function refreshAssets(path?: string, target?: string) {
  if (path && (folder.value === path || folder.value.startsWith(path + "/"))) {
    folder.value = target ? target + folder.value.slice(path.length) : ".";
  }
  try { await loadEntries(); } catch (error) { showError(error); }
}
const displayEntries = computed(() => {
  function withDraft(items: AssetEntry[], parent: string): AssetEntry[] {
    const children = items.map(item => item.children ? { ...item, children: withDraft(item.children, item.path) } : item);
    if (newFolderParent.value === parent) children.push({ name: "新建文件夹", path: `${parent}/:newFolder`, type: "directory", draft: true });
    return children;
  }
  return newFolderParent.value === undefined ? entries.value : withDraft(entries.value, ".");
});

function filterEntry(query: string, entry: TreeNodeData) {
  return !!entry.draft || entry.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

watch(searchQuery, query => assetTree.value?.filter(query));

async function startFolder() {
  searchQuery.value = "";
  newFolderParent.value = folder.value;
  newFolderName.value = "新建文件夹";
  await nextTick();
  assetTree.value?.getNode(folder.value)?.expand();
  await nextTick();
  folderInput.value?.select();
}

function cancelFolder() {
  newFolderParent.value = undefined;
}

async function saveFolder() {
  if (newFolderParent.value === undefined || folderSaving.value) return;
  const name = newFolderName.value.trim();
  if (!name) return cancelFolder();
  const parent = newFolderParent.value;
  folderSaving.value = true;
  try {
    await createAssetFolder(parent, name);
    cancelFolder();
    await loadEntries();
    folder.value = parent;
  } catch (error) {
    showError(error);
    await nextTick();
    folderInput.value?.focus();
  } finally {
    folderSaving.value = false;
  }
}

const outputs = ref<AssetOutput[]>([]);
const selectedOutput = ref(0);
let sourceDirectory: string | undefined;
const folders = computed(() => directoryEntries(entries.value));
const extension = computed(() => {
  const output = outputs.value[selectedOutput.value]?.output;
  if (!output) return "";
  if (typeof output.value !== "object") return output.dataType === "STRING" ? ".txt" : ".json";
  return output.value.url.match(/\.[^./\\]+$/)?.[0] ?? "";
});

function directoryEntries(items: AssetEntry[]): AssetEntry[] {
  return items.filter(item => item.type === "directory").map(item => ({ ...item, children: directoryEntries(item.children ?? []) }));
}

async function loadEntries() {
  const request = ++loadRequest;
  try {
    const { data } = await axios.get<{ data: { entries: AssetEntry[] } }>("/api/assets/list");
    if (request !== loadRequest) return;
    entries.value = data.data.entries;
    await nextTick();
    if (request === loadRequest) assetTree.value?.filter(searchQuery.value);
  } catch (error) {
    if (request === loadRequest) throw error;
  }
}

function showError(error: unknown) {
  ElMessage.error(axios.isAxiosError<{ message: string }>(error) ? error.response?.data.message || error.message : (error as Error).message);
}

watch(visible, opened => {
  if (opened) loadEntries().catch(showError);
  else {
    cancelFolder();
    previewAsset.value = undefined;
  }
});

function selectFolder(entry: AssetEntry) {
  if (entry.draft) return;
  const path = entry.type === "directory" ? entry.path : entry.path.split("/").slice(0, -1).join("/") || ".";
  folder.value = folder.value === path ? "." : path;
}

async function startSaveFolder() {
  saveFolderName.value = "新建文件夹";
  await nextTick();
  saveFolderInput.value?.select();
}

async function createFolder() {
  const name = saveFolderName.value?.trim();
  if (!name || folderSaving.value) return;
  folderSaving.value = true;
  try {
    const path = await createAssetFolder(saveDirectory.value, name);
    await loadEntries();
    saveDirectory.value = path;
    saveFolderName.value = undefined;
  } catch (error) {
    showError(error);
  } finally {
    folderSaving.value = false;
  }
}

async function createAssetFolder(parent: string, name: string) {
  if (/[\\/]/.test(name)) throw new Error("文件夹名称不能包含斜杠");
  const path = parent === "." ? name : `${parent}/${name}`;
  await axios.post("/api/assets/mkdir", { path });
  return path;
}

async function openSave(label: string, items: AssetOutput[]) {
  outputs.value = items;
  selectedOutput.value = 0;
  assetName.value = label.endsWith(extension.value) ? label : `${label}${extension.value}`;
  saveDirectory.value = folder.value;
  saveFolderName.value = undefined;
  sourceDirectory = props.directory;
  saveVisible.value = true;
  try {
    await loadEntries();
  } catch (error) {
    showError(error);
  }
}

async function saveAsset() {
  const output = outputs.value[selectedOutput.value]?.output;
  const name = assetName.value.trim();
  if (!output || !name || /[\\/]/.test(name) || saving.value || saveFolderName.value !== undefined) return;
  const path = saveDirectory.value === "." ? name : `${saveDirectory.value}/${name}`;
  saving.value = true;
  try {
    const content = typeof output.value === "object"
      ? await useWorkspaceFiles(() => sourceDirectory).read(output.value.url)
      : new Blob([String(output.value)]);
    await axios.put("/api/assets/save", content, { params: { path }, headers: { "Content-Type": "application/octet-stream" } });
    saveVisible.value = false;
    ElMessage.success("已保存到素材库");
    await loadEntries();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
}

defineExpose({ openSave });
</script>

<style lang="scss" scoped>
.assetLibrary {
  width: min(320px, calc(100vw - 30px));
  max-height: calc(100dvh - 140px);

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    max-height: inherit;
    box-sizing: border-box;
  }

  .libraryToolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 8px;
    height: 32px;
    margin-bottom: 8px;

    .toolbarButton {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
    }

    .searchInput {
      flex: 1;
      min-width: 0;
    }
  }

  .libraryScroll {
    min-height: 0;
    max-height: 440px;
  }

  .audioPreview {
    flex-shrink: 0;
    margin-top: 8px;

    .audioHeader {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--el-font-size-small);
      }
    }

    audio { display: block; width: 100%; }
  }

  .assetTree {
    :deep(.el-tree-node__content) {
      height: 44px;
      padding-right: 6px;
      border-radius: var(--el-border-radius-base);
    }

    .assetEntry {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 8px;
      min-width: 0;
      overflow: hidden;

      &[draggable="true"] {
        cursor: grab;
      }

      .folderIcon {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
      }

      .assetThumbnail,
      .fileIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: var(--el-border-radius-base);
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
      }

      .moreButton {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        margin: 0;
        padding: 0;
        color: var(--el-text-color-secondary);
      }

      .assetName {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--el-font-size-base);
      }

      .folderNameInput {
        flex: 1;
        min-width: 0;
      }
    }
  }
}

.assetPreview {
  .previewVideo {
    display: block;
    width: 100%;
    max-height: 65dvh;
    background: #000;
  }

}

.saveForm {
  .saveLocation {
    .locationHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--el-font-size-base);
      color: var(--el-text-color-regular);
    }

    .locationPath {
      margin: 4px 0 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
    }

    .saveFolderScroll {
      height: auto;
      max-height: 220px;
    }

    .saveFolderTree {
      :deep(.el-tree-node__content) {
        height: 34px;
        border-radius: var(--el-border-radius-base);
      }

      .saveFolderEntry {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;

        svg { flex-shrink: 0; color: var(--el-text-color-secondary); }
        span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      }
    }

    .createFolderRow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;

      .el-input { flex: 1; min-width: 0; }
      .el-button { margin: 0; }
    }
  }
}
</style>
