<template>
  <aside class="fileTree" aria-label="工作区文件">
    <header class="treeHeader">
      <span class="treeTitle"><icon-folder :size="16" aria-hidden="true" />工作区文件</span>
      <span class="treeActions">
        <el-button text circle size="small" :disabled="!directory || creating" aria-label="新建 Markdown 文件" title="新建 Markdown 文件" @click="createMarkdownFile">
          <icon-file-plus :size="15" aria-hidden="true" />
        </el-button>
        <el-button text circle size="small" :disabled="!directory" aria-label="刷新文件树" title="刷新文件树" @click="refreshTree">
          <icon-refresh :size="15" aria-hidden="true" />
        </el-button>
      </span>
    </header>
    <el-alert v-if="loadError" class="loadError" :title="loadError" type="error" :closable="false" showIcon />
    <div class="treeContent">
      <el-tree v-if="directory" :key="treeVersion" lazy highlightCurrent :load="loadChildren" :props="treeProps" nodeKey="key" emptyText="暂无文件" @node-click="selectNode">
        <template #default="{ node, data }">
          <span class="fileItem" :title="data.name">
            <icon-layout-dashboard v-if="data.type === 'canvas'" :size="16" aria-hidden="true" />
            <icon-file-text v-else-if="data.type === 'node'" :size="16" aria-hidden="true" />
            <icon-folder-open v-else-if="data.type === 'directory' && node.expanded" :size="16" aria-hidden="true" />
            <icon-folder v-else-if="data.type === 'directory'" :size="16" aria-hidden="true" />
            <icon-file v-else :size="16" aria-hidden="true" />
            <span class="fileName">{{ data.name }}</span>
          </span>
        </template>
      </el-tree>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import axios from "axios";
import type { LoadFunction } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconFile, IconFilePlus, IconFileText, IconFolder, IconFolderOpen, IconLayoutDashboard, IconRefresh } from "@tabler/icons-vue";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { isCanvasFile } from "@/pages/workspace/canvasFile";

type CanvasNodeSelection = { canvasPath: string; nodeId: string; label: string };
type MarkdownFileSelection = { filePath: string; label: string };
export type TreeSelection = CanvasNodeSelection | MarkdownFileSelection;
type FileTreeItem = {
  key: string;
  name: string;
  path: string;
  type: "file" | "directory" | "canvas" | "node";
  isLeaf?: boolean;
  nodeId?: string;
};

const props = defineProps<{ directory?: string }>();
const emit = defineEmits<{ selectNode: [selection: TreeSelection] }>();
const markdownNamePattern = /\.(md|markdown)$/i;
const treeVersion = ref(0);
const loadError = ref("");
const treeProps = { label: "name", isLeaf: "isLeaf" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function canvasItems(canvas: Record<string, unknown>, path: string): FileTreeItem[] {
  if (!Array.isArray(canvas.nodes)) return [];
  return canvas.nodes.flatMap((node): FileTreeItem[] => {
    if (!isRecord(node) || typeof node.id !== "string" || !node.id || !isRecord(node.data)) return [];
    const handles = Array.isArray(node.data.handles) ? node.data.handles : [];
    const hasText = handles.length
      ? handles.some(handle => isRecord(handle) && handle.type === "source"
        && (Array.isArray(handle.dataType) ? handle.dataType : [handle.dataType]).includes("STRING"))
      : isRecord(node.data.outputs) && Object.values(node.data.outputs).some(output =>
        isRecord(output) && output.dataType === "STRING" && typeof output.value === "string");
    if (!hasText) return [];
    return [{
      key: JSON.stringify(["node", path, node.id]),
      name: typeof node.data.label === "string" && node.data.label.trim() ? node.data.label : node.id,
      path,
      type: "node",
      nodeId: node.id,
      isLeaf: true,
    }];
  }).sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
}

function fileExtension(item: FileTreeItem) {
  if (item.type === "canvas") return "json";
  const index = item.name.lastIndexOf(".");
  return index > 0 ? item.name.slice(index + 1).toLowerCase() : "";
}

function selectNode(item: FileTreeItem) {
  if (item.type === "node" && item.nodeId) emit("selectNode", { canvasPath: item.path, nodeId: item.nodeId, label: item.name });
  else if (item.type === "file" && markdownNamePattern.test(item.name)) emit("selectNode", { filePath: item.path, label: item.name });
}

function refreshTree() {
  treeVersion.value++;
  loadError.value = "";
}

const creating = ref(false);

async function createMarkdownFile() {
  const currentDirectory = props.directory;
  if (!currentDirectory || creating.value) return;
  let value: string;
  try {
    ({ value } = await ElMessageBox.prompt("在工作区根目录新建 Markdown 文件", "新建文件", {
      inputValue: "文档.md",
      inputPattern: /^[^\\/]+$/,
      inputErrorMessage: "名称不能包含斜杠",
      inputValidator: name => !!name?.trim() || "请输入文件名称",
      confirmButtonText: "创建",
      cancelButtonText: "取消",
    }));
  } catch {
    return;
  }
  const name = value.trim();
  const fileName = markdownNamePattern.test(name) ? name : `${name}.md`;
  creating.value = true;
  try {
    await useWorkspaceFiles(currentDirectory).write(fileName, "", true);
    if (currentDirectory === props.directory) refreshTree();
  } catch (error) {
    const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
    ElMessage.error(message || (error instanceof Error ? error.message : "创建文件失败"));
  } finally {
    creating.value = false;
  }
}

watch(() => props.directory, refreshTree, { flush: "sync" });
onBeforeUnmount(() => { treeVersion.value++; });

const loadChildren: LoadFunction = async (node, resolve, reject) => {
  const directory = props.directory;
  const version = treeVersion.value;
  const path = node.level === 0 ? "" : node.data.path;
  if (!directory) return reject();
  loadError.value = "";
  try {
    const files = useWorkspaceFiles(directory);
    if (node.level > 0 && node.data.type === "canvas") {
      const canvas = await files.readJson(path);
      if (!isRecord(canvas) || canvas.toonflowCanvas !== true || !Array.isArray(canvas.nodes)) throw new Error("不是有效的画布文件");
      if (version !== treeVersion.value || directory !== props.directory) return reject();
      return resolve(canvasItems(canvas, path));
    }
    const { entries } = await files.list(path);
    const items = await Promise.all(entries.map(async (entry): Promise<FileTreeItem | null> => {
      const item: FileTreeItem = { ...entry, key: JSON.stringify([entry.type, entry.path]), isLeaf: entry.type === "file" || undefined };
      if (entry.type !== "file" || !entry.name.toLowerCase().endsWith(".json")) return item;
      // ACT: 扫描仅读取文件头标记，完整结构在展开画布时校验。
      const canvas = await isCanvasFile(files, entry.path);
      if (canvas === undefined) return null;
      if (!canvas) return item;
      return { ...item, key: JSON.stringify(["canvas", entry.path]), type: "canvas", isLeaf: undefined };
    }));
    if (version !== treeVersion.value || directory !== props.directory) return reject();
    const existingItems = items.filter(item => item !== null);
    existingItems.sort((left, right) => Number(left.type !== "directory") - Number(right.type !== "directory")
      || fileExtension(left).localeCompare(fileExtension(right), "zh-CN")
      || left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
    resolve(existingItems);
  } catch (error) {
    if (version === treeVersion.value && directory === props.directory) {
      const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      loadError.value = `读取${path || "工作区"}失败：${message || (error instanceof Error ? error.message : "请重试")}。可重新展开目录或刷新重试。`;
    }
    reject();
  }
};
</script>

<style scoped lang="scss">
.fileTree {
  display: flex;
  flex-direction: column;
  align-self: start;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ui-radius-large, 12px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-text-color-regular);

  .treeHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 12px 12px 8px;
    font-size: 12px;

    .treeTitle {
      display: flex;
      align-items: center;
      gap: 7px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .treeActions {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .el-button {
      width: 24px;
      height: 24px;
      padding: 0;
    }
  }

  .loadError {
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  .treeContent {
    flex: 0 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 0 8px 10px;
    overscroll-behavior: contain;

    :deep(.el-tree) {
      background: transparent;
    }

    :deep(.el-tree-node__content) {
      height: 32px;
      margin: 2px 0;
      border-radius: var(--el-border-radius-base);
    }

    .fileItem {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
      padding-right: 6px;
      font-size: 13px;

      svg {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
      }

      .fileName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
