<template>
  <panel class="canvasMenuPanel" position="top-left">
    <el-card class="canvasMenu" shadow="never" :bodyStyle="{ padding: '5px 10px' }">
      <div class="menuContent">
        <el-input v-model="projectNameDraft" class="workspaceNameInput" :style="{ '--workspaceName': JSON.stringify(projectNameDraft || ' ') }" size="small" :title="directory" :disabled="!workspaceStore.project" aria-label="项目名称"
          @keydown.stop @keydown.enter="saveProjectName" @keydown.esc.prevent="projectNameDraft = workspaceName" @blur="saveProjectName" />
        <el-divider direction="vertical" />
        <el-popover v-model:visible="canvasListVisible" trigger="click" placement="bottom-start" :width="320" :showArrow="false" :disabled="!directory">
          <template #reference>
            <el-button class="canvasTrigger" text :loading="busy" :disabled="busy || !directory" aria-label="切换画布" :aria-expanded="canvasListVisible">
              <span>{{ activeCanvasName }}</span><icon-chevron-down :size="14" />
            </el-button>
          </template>
          <div ref="canvasPicker" class="canvasPicker" @keydown.esc="canvasListVisible = false">
            <div class="pickerToolbar">
              <el-input v-model="searchQuery" :prefixIcon="IconSearch" placeholder="搜索画布" aria-label="搜索画布" clearable @keydown.esc.stop="searchQuery = ''" />
              <el-button class="iconButton" text :icon="IconFolderPlus" :disabled="pickerBusy || editingId !== null || folderDraft !== null" title="新建文件夹" aria-label="新建画布文件夹" @click="startFolder" />
              <el-button class="iconButton" text :icon="IconPlus" :disabled="pickerBusy || editingId !== null || folderDraft !== null" title="新增画布" aria-label="新增画布" @click="handleAddCanvas" />
            </div>
            <el-scrollbar v-loading="loadingTree" maxHeight="min(440px, calc(100dvh - 198px))">
              <el-tree ref="canvasTree" class="canvasTree" :data="treeEntries" nodeKey="path" :props="{ label: 'name' }" :currentNodeKey="activeCanvasId" :filterNodeMethod="filterEntry" defaultExpandAll highlightCurrent emptyText="" @nodeClick="selectEntry">
                <template #default="{ data }">
                  <div class="canvasEntry" :title="data.path" @contextmenu="openItemMenu($event, data)">
                    <icon-folder-filled v-if="data.type === 'directory'" class="folderIcon" :size="30" />
                    <icon-artboard v-else class="canvasIcon" :size="26" />
                    <el-input v-if="data.draft" ref="folderInput" v-model="folderDraft" class="nameEditor" size="small" aria-label="文件夹名称" :disabled="busy" :maxlength="120" @click.stop @keydown.stop @keydown.enter.prevent="saveFolder" @keydown.esc.prevent="cancelFolder" @blur="saveFolder" />
                    <el-input v-else-if="editingId === data.path" ref="nameInput" v-model="canvasName" class="nameEditor" size="small" :disabled="busy" :maxlength="120" :aria-label="newCanvasId === data.path ? '新画布名称' : '画布名称'" @click.stop @keydown.stop @keydown.enter="saveCanvas" @keydown.esc.prevent="finishEdit" @blur="saveCanvas" />
                    <span v-else class="entryName">{{ data.name }}</span>
                    <icon-check v-if="activeCanvasId === data.path" class="selectedIcon" :size="16" aria-hidden="true" />
                    <el-button v-if="!data.draft && editingId !== data.path" class="moreButton" text :icon="IconDots" :disabled="pickerBusy || editingId !== null || folderDraft !== null" :aria-label="'更多 ' + data.name" title="更多" @click.stop="openItemMenu($event, data)" />
                  </div>
                </template>
              </el-tree>
            </el-scrollbar>
            <el-text v-if="renameError" type="danger" role="alert">{{ renameError }}</el-text>
          </div>
        </el-popover>
      </div>
    </el-card>
    <div class="menuExtension"><slot /></div>
  </panel>
  <el-dropdown ref="itemMenu" trigger="contextmenu" virtualTriggering :virtualRef="menuAnchor" placement="bottom-start" :showArrow="false" :hideOnClick="false" :appendTo="canvasPicker" popperClass="canvasActionMenu" @command="handleItemCommand" @visibleChange="(opened: boolean) => { if (!opened) moveVisible = false; }">
    <template #dropdown>
      <el-dropdown-menu v-if="menuEntry">
        <el-dropdown-item command="move" :disabled="pickerBusy">
          <el-popover v-model:visible="moveVisible" trigger="hover" placement="right-start" :width="220" :offset="0" :showArrow="false" :showAfter="0" :hideAfter="150" :appendTo="canvasPicker">
            <template #reference><span class="moveTrigger"><span class="moveLabel">移动到</span><icon-chevron-right :size="14" /></span></template>
            <div class="moveDestinations" role="menu" aria-label="移动到目录" @click.stop @keydown.stop>
              <el-button text :icon="IconFolderPlus" :disabled="pickerBusy" role="menuitem" @click="createMoveFolder">新建文件夹</el-button>
              <el-scrollbar maxHeight="260px">
                <el-button v-for="folder in moveFolders" :key="folder.path" text :icon="IconFolder" :disabled="pickerBusy || destinationDisabled(folder.path)" role="menuitem" :title="folder.label" @click="moveEntry(folder.path)">{{ folder.label }}</el-button>
              </el-scrollbar>
            </div>
          </el-popover>
        </el-dropdown-item>
        <el-dropdown-item command="rename" :disabled="pickerBusy">重命名</el-dropdown-item>
        <el-dropdown-item class="deleteAction" command="delete" :disabled="pickerBusy || (menuEntry.type === 'directory' && !menuEntry.empty)" :title="menuEntry.type === 'directory' && !menuEntry.empty ? '请先移出或删除文件夹内的内容' : undefined">删除</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import axios from "axios";
import { translate } from "@toonflow/i18n/vue";
import { computed, inject, nextTick, ref, shallowRef, watch, type ShallowRef } from "vue";
import { Panel, useVueFlow, type FlowExportObject } from "@vue-flow/core";
import { ElMessage, ElMessageBox, type DropdownInstance, type FilterNodeMethodFunction, type InputInstance, type TreeInstance } from "element-plus";
import { IconArtboard, IconCheck, IconChevronDown, IconChevronRight, IconDots, IconFolder, IconFolderFilled, IconFolderPlus, IconPlus, IconSearch } from "@tabler/icons-vue";
import { useWorkspaceStore } from "@/stores/workspace";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { getCanvasAssetDirectories, isCanvasFile } from "@/pages/workspace/canvasFile";

const props = defineProps<{
  directory?: string;
  initialCanvasId?: string;
  activateCanvas?: (id: string, signal?: AbortSignal) => Promise<void>;
  flushSave: (action?: () => Promise<void>) => Promise<void>;
}>();
const workspaceStore = useWorkspaceStore();
const workspaceName = computed(() => workspaceStore.project?.name || "未命名工作区");
const projectNameDraft = ref("");
watch([() => workspaceStore.project?.directory, workspaceName], () => {
  projectNameDraft.value = workspaceName.value;
}, { immediate: true });

function saveProjectName(event: Event) {
  if (event instanceof KeyboardEvent && event.isComposing) return;
  const project = workspaceStore.project;
  if (project) workspaceStore.renameProject(project.directory, projectNameDraft.value);
  projectNameDraft.value = workspaceName.value;
}

type Canvas = { id: string; name: string; flow?: Pick<FlowExportObject, "nodes" | "edges" | "viewport"> };
const canvases = inject<ShallowRef<Canvas[]>>("canvasList", shallowRef<Canvas[]>([]));
const getRetainedNodes = inject<(id: string) => { id: string; data?: unknown }[]>("canvasAssetNodes", () => []);
const performFileAction = inject<(directory: string, action: "copy" | "rename" | "move" | "delete", path: string, target?: string, entryType?: "canvas" | "directory") => Promise<void>>("performWorkspaceFileAction");
const boundCanvas = shallowRef<Canvas>();
const activeCanvasId = defineModel<string>("canvasId", { default: "" });
watch(canvases, () => {
  if (boundCanvas.value) activeCanvasId.value = canvases.value.includes(boundCanvas.value) ? boundCanvas.value.id : "";
}, { flush: "sync" });
const canvasListVisible = ref(false);
const activeCanvasName = computed(() => canvases.value.find(canvas => canvas.id === activeCanvasId.value)?.name || translate("选择画布"));
const busy = ref(false);
const loadError = ref("");
const editingId = ref<string | null>(null);
const newCanvasId = ref<string | null>(null);
const nameInput = ref<InputInstance>();
const canvasName = ref("");
const renameError = ref("");
const { toObject, setNodes, setEdges, setViewport } = useVueFlow();
type CanvasEntry = { path: string; name: string; type: "file" | "directory"; children?: CanvasEntry[]; empty?: boolean; draft?: boolean };
const folders = shallowRef<CanvasEntry[]>([]);
const canvasTree = ref<TreeInstance>();
const canvasPicker = ref<HTMLElement>();
const searchQuery = ref("");
const loadingTree = ref(false);
const pickerBusy = computed(() => busy.value || loadingTree.value);
const folderDraft = ref<string | null>(null);
const folderInput = ref<InputInstance>();
const draftFolderPath = crypto.randomUUID();
const itemMenu = ref<DropdownInstance>();
const menuAnchor = shallowRef({ getBoundingClientRect: () => new DOMRect() });
const menuEntry = shallowRef<CanvasEntry>();
const moveVisible = ref(false);
let treeRequest = 0;
const treeEntries = computed(() => {
  const entries: CanvasEntry[] = [];
  const visibleCanvases = canvases.value.filter(canvas => !canvas.id.split("/").slice(0, -1).some(name => ["assets", ".agent"].includes(name.toLowerCase())));
  const directories = new Map<string, CanvasEntry & { children: CanvasEntry[] }>();
  for (const folder of folders.value) directories.set(folder.path, { ...folder, children: [] });
  for (const canvas of visibleCanvases) {
    const parts = canvas.id.split("/").slice(0, -1);
    parts.forEach((name, index) => {
      const path = parts.slice(0, index + 1).join("/");
      if (!directories.has(path)) directories.set(path, { path, name, type: "directory", children: [], empty: false });
    });
  }
  for (const entry of [...directories.values(), ...visibleCanvases.map(canvas => ({ path: canvas.id, name: canvas.name, type: "file" as const }))]
    .sort((left, right) => Number(left.type !== "directory") - Number(right.type !== "directory") || left.name.localeCompare(right.name, "zh-CN", { numeric: true }))) {
    (directories.get(parentPath(entry.path))?.children ?? entries).push(entry);
  }
  if (folderDraft.value !== null) entries.unshift({ path: draftFolderPath, name: folderDraft.value, type: "directory", draft: true });
  return entries;
});
const moveFolders = computed(() => [{ path: "", label: translate("画布根目录") }, ...folders.value.map(folder => ({ path: folder.path, label: folder.path }))]);

function parentPath(path: string) { return path.slice(0, path.lastIndexOf("/") + 1).replace(/\/$/, ""); }
const filterEntry: FilterNodeMethodFunction = (query: string, entry) => !!entry.draft || String(entry.path).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
watch([searchQuery, treeEntries], async () => { await nextTick(); canvasTree.value?.filter(searchQuery.value); });
watch(canvasListVisible, opened => {
  if (opened) refreshTree().catch(error => { renameError.value = errorMessage(error, "读取画布失败"); });
  else { treeRequest++; loadingTree.value = false; itemMenu.value?.handleClose(); cancelFolder(); }
});

async function refreshTree() {
  const directory = props.directory;
  if (!directory) return;
  const request = ++treeRequest;
  loadingTree.value = true;
  try {
    const loaded = await listCanvasEntries(directory);
    if (request !== treeRequest || directory !== props.directory) return;
    // 共享画布列表由文件操作更新；目录扫描不能覆盖列表并卸载正在移动或生成的画布。
    folders.value = loaded.folders;
  } catch (error) {
    if (request !== treeRequest || directory !== props.directory) return;
    throw error;
  } finally { if (request === treeRequest) loadingTree.value = false; }
}

function selectEntry(entry: CanvasEntry) {
  if (entry.type === "file" && !pickerBusy.value && editingId.value === null && folderDraft.value === null) void handleSwitchCanvas(entry.path);
}

watch(() => props.directory, async (directory, _previous, onCleanup) => {
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  busy.value = true;
  loadError.value = "";
  treeRequest++;
  folders.value = [];
  folderDraft.value = null;
  searchQuery.value = "";
  boundCanvas.value = undefined;
  activeCanvasId.value = "";
  try {
    if (props.initialCanvasId === undefined) canvases.value = [];
    newCanvasId.value = null;
    editingId.value = null;
    renameError.value = "";
    if (!directory) return;
    if (props.initialCanvasId === "") return;
    if (props.initialCanvasId) {
      await applyCanvas(props.initialCanvasId, directory);
      return;
    }
    let entries = await listCanvases(directory);
    let loaded = entries.canvases;
    if (cancelled) return;
    if (!loaded.length) {
      try {
        loaded = [await createCanvasFile(directory, "画布1")];
      } catch (err) {
        if (!axios.isAxiosError<{ data?: { code?: string } }>(err) || err.response?.status !== 409 || err.response.data.data?.code !== "EEXIST") throw err;
        // 同时打开工作区时，读取另一请求刚创建的默认画布，不覆盖同名文件。
        entries = await listCanvases(directory);
        const refreshed = entries.canvases;
        // 画布1.json 若被其他 JSON 占用，则使用下一个空闲名称，保留原文件。
        loaded = refreshed.length ? refreshed : [await createCanvasFile(directory)];
      }
    }
    if (cancelled) return;
    folders.value = entries.folders;
    canvases.value = loaded;
    if (canvases.value[0]) await applyCanvas(canvases.value[0].id, directory);
  } catch (err) {
    if (!cancelled) {
      loadError.value = errorMessage(err, "读取画布失败");
      if (!props.initialCanvasId) ElMessage.error(loadError.value);
    }
  } finally {
    if (!cancelled) busy.value = false;
  }
}, { immediate: true });

function errorMessage(err: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(err) ? err.response?.data.message || fallback : err instanceof Error ? err.message : fallback;
}

function getCanvases() {
  return canvases.value.map(({ id, name }) => ({ id, name }));
}

function getCanvasDirectory(signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!props.directory) throw new Error("请先选择工作目录");
  if (busy.value || editingId.value !== null) throw new Error("画布正在加载或编辑，请稍后重试");
  return props.directory;
}

function checkCanvasDirectory(directory: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (props.directory !== directory) throw new Error("工作目录已切换，本次画布操作已停止");
}

async function applyCanvas(canvasId: string, directory: string, signal?: AbortSignal) {
  checkCanvasDirectory(directory, signal);
  const nextCanvas = canvases.value.find(canvas => canvas.id === canvasId);
  const currentCanvas = canvases.value.find(canvas => canvas.id === activeCanvasId.value);
  if (!nextCanvas) throw new Error("画布不存在，请重新获取画布列表");
  if (nextCanvas === currentCanvas) return;
  if (currentCanvas && props.activateCanvas) {
    await props.activateCanvas(canvasId, signal);
    checkCanvasDirectory(directory, signal);
    return;
  }
  if (!nextCanvas.flow) {
    const data = await useWorkspaceFiles(directory).readJson<Partial<NonNullable<Canvas["flow"]>> & { toonflowCanvas?: boolean } | null>(nextCanvas.id);
    checkCanvasDirectory(directory, signal);
    if (data?.toonflowCanvas !== true || !Array.isArray(data.nodes) || !Array.isArray(data.edges) || !data.viewport
      || ![data.viewport.x, data.viewport.y, data.viewport.zoom].every(Number.isFinite) || data.viewport.zoom <= 0) throw new Error("画布文件格式无效");
    // 旧画布可能保存了临时导出进度，重新打开时任务已不存在。
    for (const node of data.nodes) if (node.type === "remote-videoNode" && node.data) delete node.data.exportProgress;
    nextCanvas.flow = { nodes: data.nodes, edges: data.edges, viewport: data.viewport };
  }
  await props.flushSave();
  checkCanvasDirectory(directory, signal);
  if (currentCanvas) currentCanvas.flow = toObject();
  // 应用画布数据时暂时清空文件名，避免初始化触发自动保存。
  activeCanvasId.value = "";
  setNodes(nextCanvas.flow.nodes);
  // 命中宽度由画布统一配置，不使用旧文件中的覆盖值。
  setEdges(nextCanvas.flow.edges.map(({ interactionWidth, ...edge }) => edge));
  await setViewport(nextCanvas.flow.viewport);
  await nextTick();
  checkCanvasDirectory(directory);
  boundCanvas.value = nextCanvas;
  activeCanvasId.value = nextCanvas.id;
  signal?.throwIfAborted();
}

async function switchCanvas(canvasId: string, signal?: AbortSignal) {
  const directory = getCanvasDirectory(signal);
  canvasListVisible.value = false;
  busy.value = true;
  try {
    if (props.activateCanvas) await props.activateCanvas(canvasId, signal);
    else await applyCanvas(canvasId, directory, signal);
    checkCanvasDirectory(directory, signal);
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

async function handleSwitchCanvas(canvasId: string) {
  const directory = props.directory;
  try {
    await switchCanvas(canvasId);
  } catch (err) {
    if (props.directory === directory) ElMessage.error(errorMessage(err, "切换画布失败"));
  }
}

async function removeCanvas(canvas: Canvas) {
  if (busy.value || editingId.value !== null || !props.directory) return;
  const directory = props.directory;
  const id = canvas.id;
  busy.value = true;
  canvasListVisible.value = false;
  try {
    const confirmed = await ElMessageBox.confirm(`确定删除“${canvas.name}”？对应的 ${id} 文件及独占的节点素材也会被删除，其他画布共用的素材会保留。此操作不可撤销。`, "删除画布", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消", closeOnClickModal: false,
    }).then(() => true, () => false);
    if (!confirmed) return;
    checkCanvasDirectory(directory);
    const nextCanvas = canvases.value.find(item => item.id !== id);
    if (nextCanvas && activeCanvasId.value === id) await applyCanvas(nextCanvas.id, directory);
    const files = useWorkspaceFiles(directory);
    const readNodes = async (canvasId: string) => {
      const data = await files.readJson<{ toonflowCanvas?: boolean; nodes?: { id: string; data?: unknown }[] }>(canvasId);
      if (data?.toonflowCanvas !== true || !Array.isArray(data.nodes) || data.nodes.some(node => !node || typeof node.id !== "string")) {
        throw new Error(`无法确认 ${canvasId} 的素材引用`);
      }
      return [...data.nodes, ...getRetainedNodes(canvasId)];
    };
    let removedNodes: { id: string; data?: unknown }[] = [];
    await props.flushSave(async () => {
      checkCanvasDirectory(directory);
      if (canvas.id !== id || !canvases.value.includes(canvas)) throw new Error("画布已变更，请重新选择");
      removedNodes = await readNodes(id);
      if (!performFileAction) {
        await files.remove(id);
        checkCanvasDirectory(directory);
        canvases.value = canvases.value.filter(item => item !== canvas);
        await nextTick();
      }
    });
    // coordinator 自己进入保存临界区，必须在上一次 flush 完成后调用，避免重入保存队列。
    if (performFileAction) await performFileAction(directory, "delete", id);
    await props.flushSave(async () => {
      checkCanvasDirectory(directory);
      const retainedNodes = (await Promise.all((await listCanvases(directory)).canvases.map(canvas => readNodes(canvas.id)))).flat();
      const assetDirectories = getCanvasAssetDirectories(removedNodes, retainedNodes);
      checkCanvasDirectory(directory);
      const results = await Promise.allSettled(assetDirectories.map(path => files.remove(path, true).catch(error => {
        if (!axios.isAxiosError<{ data?: { code?: string } }>(error) || error.response?.data.data?.code !== "ENOENT") throw error;
      })));
      const failed = results.flatMap((result, index) => result.status === "rejected" ? [assetDirectories[index]] : []);
      if (failed.length) throw new Error(`画布已删除，但 ${failed.length} 个素材目录清理失败：${failed.join("、")}`);
    });
    if (props.directory === directory) ElMessage.success("画布已删除");
  } catch (err) {
    if (props.directory === directory) ElMessage.error(errorMessage(err, "删除画布失败"));
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

async function createCanvasFile(directory: string, name?: string, signal?: AbortSignal) {
  if (name !== undefined) name = normalizeCanvasName(name);
  const files = useWorkspaceFiles(directory);
  const flow = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
  for (let number = 1; ; number++) {
    checkCanvasDirectory(directory, signal);
    const canvasName = name ?? `画布${number}`;
    const id = `${canvasName}.json`;
    try {
      await files.writeJson(id, { toonflowCanvas: true, ...flow }, true);
      return { id, name: canvasName, flow };
    } catch (err) {
      if (name !== undefined || !axios.isAxiosError<{ data?: { code?: string } }>(err) || err.response?.status !== 409 || err.response.data.data?.code !== "EEXIST") throw err;
    }
  }
}

async function listCanvasEntries(directory: string) {
  const files = useWorkspaceFiles(directory);
  const { entries } = await files.list();
  const folders: CanvasEntry[] = [];
  // 文件接口只返回普通文件和目录，不跟随符号链接；素材和 Agent 目录不参与画布扫描。
  for (let index = 0; index < entries.length; index++) {
    checkCanvasDirectory(directory);
    const entry = entries[index]!;
    if (entry.type !== "directory" || ["assets", ".agent"].includes(entry.name.toLowerCase())) continue;
    const children = await files.list(entry.path);
    folders.push({ ...entry, empty: children.empty });
    entries.push(...children.entries);
  }
  return { entries, folders: folders.sort((left, right) => left.path.localeCompare(right.path, "zh-CN", { numeric: true })) };
}

async function listCanvases(directory: string): Promise<{ canvases: Canvas[]; folders: CanvasEntry[] }> {
  const files = useWorkspaceFiles(directory);
  const { entries, folders } = await listCanvasEntries(directory);
  const loaded = await Promise.all(entries.filter(entry => entry.type === "file" && /\.json$/i.test(entry.name)).map(async entry => {
    if (!(await isCanvasFile(files, entry.path))) return null;
    return { id: entry.path, name: entry.name.slice(0, -5) };
  }));
  return {
    canvases: loaded.filter(canvas => canvas !== null).sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true })),
    folders,
  };
}

async function addCanvas(name?: string, signal?: AbortSignal): Promise<string> {
  const directory = getCanvasDirectory(signal);
  busy.value = true;
  try {
    const canvas = await createCanvasFile(directory, name, signal);
    checkCanvasDirectory(directory);
    canvases.value = [...canvases.value, canvas];
    signal?.throwIfAborted();
    await applyCanvas(canvas.id, directory, signal);
    canvasListVisible.value = false;
    return canvas.id;
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

async function handleAddCanvas() {
  if (pickerBusy.value || editingId.value !== null || folderDraft.value !== null || !props.directory) return;
  const directory = props.directory;
  busy.value = true;
  try {
    const canvas = await createCanvasFile(directory);
    checkCanvasDirectory(directory);
    canvases.value = [...canvases.value, canvas];
    searchQuery.value = "";
    newCanvasId.value = canvas.id;
    busy.value = false;
    await editCanvas(canvas);
  } catch (err) {
    if (props.directory === directory) ElMessage.error(errorMessage(err, "新增画布失败"));
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

async function editCanvas(canvas: { id: string; name: string }) {
  if (busy.value || editingId.value !== null) return;
  editingId.value = canvas.id;
  canvasName.value = canvas.name;
  renameError.value = "";
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}

async function startFolder() {
  if (pickerBusy.value || editingId.value !== null || folderDraft.value !== null) return;
  searchQuery.value = "";
  renameError.value = "";
  folderDraft.value = "新建文件夹";
  await nextTick();
  folderInput.value?.focus();
  folderInput.value?.select();
}

function cancelFolder() { if (!busy.value) folderDraft.value = null; }

function normalizeFolderName(name: string) {
  name = normalizeCanvasName(name, "文件夹");
  if (name.toLowerCase() === "assets") throw new Error("assets 是节点素材目录，请使用其他文件夹名称");
  if (name.toLowerCase() === ".agent") throw new Error(".agent 是 Agent 数据目录，请使用其他文件夹名称");
  return name;
}

async function saveFolder(event?: Event) {
  if (event instanceof KeyboardEvent && event.isComposing) return;
  if (folderDraft.value === null || busy.value || !props.directory) return;
  if (!folderDraft.value.trim()) { cancelFolder(); return; }
  const directory = props.directory;
  busy.value = true;
  renameError.value = "";
  try {
    const name = normalizeFolderName(folderDraft.value);
    await useWorkspaceFiles(directory).mkdir(name);
    checkCanvasDirectory(directory);
    folderDraft.value = null;
    await refreshTree();
  } catch (error) {
    if (directory === props.directory) renameError.value = errorMessage(error, "创建文件夹失败");
  } finally { if (directory === props.directory) busy.value = false; }
}

function openItemMenu(event: MouseEvent, entry: CanvasEntry) {
  event.preventDefault();
  if (pickerBusy.value || editingId.value !== null || folderDraft.value !== null || entry.draft) return;
  itemMenu.value?.handleClose();
  menuEntry.value = entry;
  moveVisible.value = false;
  const target = event.currentTarget as HTMLElement;
  const rect = event.type === "contextmenu" ? new DOMRect(event.clientX, event.clientY, 0, 0) : target.getBoundingClientRect();
  menuAnchor.value = { getBoundingClientRect: () => rect };
  void nextTick(() => itemMenu.value?.handleOpen());
}

function destinationDisabled(path: string) {
  const entry = menuEntry.value;
  return !entry || path === parentPath(entry.path) || (entry.type === "directory" && (path === entry.path || path.startsWith(`${entry.path}/`)));
}

async function relocateEntry(entry: CanvasEntry, target: string, directory: string) {
  checkCanvasDirectory(directory);
  if (!performFileAction) throw new Error("工作区文件管理尚未就绪");
  await performFileAction(directory, "move", entry.path, target, entry.type === "directory" ? "directory" : "canvas");
  checkCanvasDirectory(directory);
  await refreshTree();
}

async function moveEntry(path: string, createFolder = false) {
  const entry = menuEntry.value;
  const directory = props.directory;
  if (!entry || !directory || pickerBusy.value || destinationDisabled(path)) return;
  itemMenu.value?.handleClose();
  busy.value = true;
  renameError.value = "";
  try {
    if (createFolder) {
      await useWorkspaceFiles(directory).mkdir(path);
      checkCanvasDirectory(directory);
    }
    await relocateEntry(entry, `${path ? `${path}/` : ""}${entry.path.split("/").at(-1)}`, directory);
  } catch (error) {
    if (directory === props.directory) renameError.value = errorMessage(error, "移动失败");
  } finally { if (directory === props.directory) busy.value = false; }
}

async function createMoveFolder() {
  const directory = props.directory;
  itemMenu.value?.handleClose();
  try {
    const { value } = await ElMessageBox.prompt("新文件夹将创建在画布根目录", "新建文件夹", {
      inputValue: "新建文件夹", confirmButtonText: "创建并移动", cancelButtonText: "取消",
      inputValidator: name => { try { normalizeFolderName(name); return true; } catch (error) { return (error as Error).message; } },
    });
    if (directory !== props.directory) return;
    await moveEntry(normalizeFolderName(value), true);
  } catch (error) { if (error !== "cancel" && error !== "close") ElMessage.error(errorMessage(error, "创建文件夹失败")); }
}

async function handleItemCommand(command: string) {
  const entry = menuEntry.value;
  const directory = props.directory;
  if (!entry || !directory || pickerBusy.value) return;
  if (command === "move") { moveVisible.value = true; return; }
  itemMenu.value?.handleClose();
  if (entry.type === "file") {
    const canvas = canvases.value.find(canvas => canvas.id === entry.path);
    if (canvas) {
      if (command === "rename") await editCanvas(canvas);
      else if (command === "delete") await removeCanvas(canvas);
    }
    return;
  }
  busy.value = true;
  renameError.value = "";
  try {
    if (command === "rename") {
      const { value } = await ElMessageBox.prompt("文件夹名称", "重命名", {
        inputValue: entry.name, confirmButtonText: "保存", cancelButtonText: "取消",
        inputValidator: name => { try { normalizeFolderName(name); return true; } catch (error) { return (error as Error).message; } },
      });
      const name = normalizeFolderName(value);
      if (name !== entry.name) await relocateEntry(entry, `${parentPath(entry.path) ? `${parentPath(entry.path)}/` : ""}${name}`, directory);
    } else if (command === "delete") {
      await ElMessageBox.confirm(`确定删除文件夹“${entry.name}”？`, "删除文件夹", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" });
      checkCanvasDirectory(directory);
      // 只删除真实空目录；隐藏文件和普通文档也应阻止删除，不能依据过滤后的画布树递归删除。
      await useWorkspaceFiles(directory).remove(entry.path);
      checkCanvasDirectory(directory);
      await refreshTree();
    }
  } catch (error) {
    if (directory === props.directory && error !== "cancel" && error !== "close") renameError.value = errorMessage(error, "文件夹操作失败");
  } finally { if (directory === props.directory) busy.value = false; }
}

async function finishEdit() {
  if (busy.value) return;
  editingId.value = null;
  renameError.value = "";
  const createdId = newCanvasId.value;
  newCanvasId.value = null;
  if (createdId) await handleSwitchCanvas(createdId);
}

function normalizeCanvasName(name: string, label = "画布") {
  name = name.trim();
  if (!name || name.length > 120 || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name)
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new Error(label === "文件夹" ? "文件夹名称不是有效文件名" : "画布名称不是有效文件名");
  }
  return name;
}

async function renameCanvasFile(id: string, name: string, directory: string, signal?: AbortSignal) {
  checkCanvasDirectory(directory, signal);
  const canvas = canvases.value.find(item => item.id === id);
  if (!canvas) throw new Error("画布不存在，请重新获取画布列表");
  name = normalizeCanvasName(name);
  if (name === canvas.name) return;
  const target = `${id.slice(0, id.lastIndexOf("/") + 1)}${name}.json`;
  if (performFileAction) {
    await performFileAction(directory, "rename", id, target);
    checkCanvasDirectory(directory, signal);
    return;
  }
  await props.flushSave(async () => {
    checkCanvasDirectory(directory, signal);
    await useWorkspaceFiles(directory).rename(id, target);
    checkCanvasDirectory(directory);
    // 文件已改名时先更新保存路径，再响应取消，避免自动保存重新创建旧文件。
    if (activeCanvasId.value === id) activeCanvasId.value = target;
    if (newCanvasId.value === id) newCanvasId.value = target;
    if (editingId.value === id) editingId.value = target;
    Object.assign(canvas, { id: target, name });
    canvases.value = [...canvases.value];
    signal?.throwIfAborted();
  });
  checkCanvasDirectory(directory, signal);
}

function syncCanvasPath(previous: string, target: string) {
  if (activeCanvasId.value === previous) activeCanvasId.value = target;
  if (newCanvasId.value === previous) newCanvasId.value = target;
  if (editingId.value === previous) editingId.value = target;
}

async function renameCanvas(canvasId: string, name: string, signal?: AbortSignal) {
  const directory = getCanvasDirectory(signal);
  busy.value = true;
  try {
    await renameCanvasFile(canvasId, name, directory, signal);
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

async function saveCanvas(event?: Event) {
  if (event instanceof KeyboardEvent && event.isComposing) return;
  const id = editingId.value;
  if (busy.value || !props.directory || id === null) return;
  const directory = props.directory;
  const canvas = canvases.value.find(item => item.id === id);
  if (!canvasName.value.trim() || canvasName.value.trim() === canvas?.name) {
    await finishEdit();
    return;
  }
  busy.value = true;
  renameError.value = "";
  try {
    await renameCanvasFile(id, canvasName.value, directory);
    busy.value = false;
    await finishEdit();
  } catch (err) {
    if (props.directory === directory) {
      renameError.value = errorMessage(err, "重命名画布失败");
      canvasListVisible.value = true;
    }
  } finally {
    if (props.directory === directory) busy.value = false;
  }
}

function syncDocumentNode(canvasId: string, nodeId: string, handleId: string, text: string, inline: boolean) {
  const node = canvases.value.find(canvas => canvas.id === canvasId)?.flow?.nodes.find(node => node.id === nodeId);
  if (!node) return;
  const data = node.data ??= {};
  const output = data.outputs?.[handleId];
  if (output?.dataType === "STRING") output.value = text;
  else if (inline) (data.outputs ??= {})[handleId] = { dataType: "STRING", value: text };
}

defineExpose({ getCanvases, addCanvas, switchCanvas, renameCanvas, syncCanvasPath, syncDocumentNode, loadError });
</script>

<style lang="scss" scoped>
.canvasMenuPanel.vue-flow__panel {
  left: 0;
}

.canvasPicker {
  .iconButton { width: 28px; height: 28px; padding: 0; margin: 0; }

  .pickerToolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    .el-input { flex: 1; min-width: 0; }
    .iconButton { flex-shrink: 0; }
  }

  .canvasTree {
    background: transparent;
    :deep(.el-tree-node__content) { height: 44px; border-radius: var(--el-border-radius-base); }
    :deep(.el-tree-node__expand-icon) { padding: 6px; }

    .canvasEntry {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
      height: 100%;
      padding-right: 4px;

      .folderIcon { flex-shrink: 0; color: var(--el-text-color-secondary); }
      .canvasIcon { flex-shrink: 0; width: 30px; color: var(--el-color-primary); }
      .entryName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
      .nameEditor { flex: 1; min-width: 0; }
      .selectedIcon { flex-shrink: 0; color: var(--el-color-primary); }
      .moreButton { width: 24px; height: 24px; padding: 0; margin: 0; flex-shrink: 0; opacity: 0; }

      &:hover, &:focus-within { .moreButton { opacity: 1; } }
      @media (hover: none) { .moreButton { opacity: 1; } }
    }
  }
}

.moveTrigger {
  display: flex;
  align-items: center;
  width: 100%;
  .moveLabel { flex: 1; min-width: 132px; }
}

:global(.canvasActionMenu .deleteAction) { color: var(--el-color-danger); }

.moveDestinations {
  .el-button {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    margin: 0;
    padding: 8px;
    font-weight: normal;
    :deep(> span) {
      display: block;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.menuExtension {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
}

.canvasMenu {
  margin-left: 100px;

  .menuContent {
    display: flex;
    align-items: center;
    gap: 10px;

    .workspaceNameInput {
      width: auto;
      min-width: 2em;

      &::after {
        content: var(--workspaceName);
        padding: 0 7px;
        white-space: pre;
        visibility: hidden;
      }

      :deep(.el-input__wrapper) {
        position: absolute;
        inset: 0;
        box-shadow: none;
      }

      :deep(.el-input__inner) {
        font-family: inherit;
        font-weight: inherit;
        letter-spacing: inherit;
      }
    }

    .canvasTrigger {
      padding: 0 4px;
      :deep(> span) { display: flex; align-items: center; gap: 6px; }
      span { max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
    }
  }
}
</style>
