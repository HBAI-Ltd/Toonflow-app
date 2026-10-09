<template>
  <section ref="panelElement" class="documentPanel" aria-label="文档工作区">
    <dockview-vue class="documentLayout" :theme="theme" :disableAutoResizing="true" :disableFloatingGroups="true" @ready="onLayoutReady" />
    <openWithDialog ref="openWithRef" />
    <quickOpen v-if="directory" ref="quickOpenRef" :directory="directory" @open="selection => openSelection(selection).catch(reportError)" />
    <workspaceSearch v-if="directory" ref="searchRef" :directory="directory" :active="active" :replaceFile="replaceSearchFile" @open="openSearchResult" />
  </section>
</template>

<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, ref, shallowReactive, shallowRef, watch } from "vue";
import { DockviewVue, type DockviewApi, type DockviewReadyEvent } from "dockview-vue";
import { ElMessage } from "element-plus";
import type { ExtResource } from "@toonflow/ext-scaffold/runtime";
import { useWorkspaceStore } from "@/stores/workspace";
import { settings, settingsStorage } from "@/stores/settings";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { waitForControlValue } from "@/lib/mcpControl";
import { isCanvasFile } from "@/pages/workspace/canvasFile";
import type { DocumentNode } from "../canvas/canvasFiles";
import fileTree, { type FileAction, type FileTreeItem, type TreeSelection } from "./components/fileTree.vue";
import openWithDialog from "./components/openWithDialog.vue";
import quickOpen from "./components/quickOpen.vue";
import workspaceSearch from "./components/workspaceSearch.vue";
import editorHost from "./editorHost.vue";
import { createDocumentSession, documentError, type DocumentSession, type EditorParams, type EditorView, type TabAction } from "./documentSession";
import { theme } from "./theme";
import { locale, t } from "@toonflow/i18n/vue";
import { extensionCandidates, extensionRevision, listExtensions, resolveExtension } from "./extensions";
import "dockview-vue/dist/styles/dockview.css";

defineOptions({ components: { fileTree, editorHost } });
const props = defineProps<{
  readNodes: (directory: string, options?: { canvasPath?: string; signal?: AbortSignal; onError?: (path: string, error: unknown) => void }) => Promise<DocumentNode[]>;
  readNode: (directory: string, canvasPath: string, nodeId: string) => Promise<{ label: string; outputs: { id: string; label: string; text: string }[] }>;
  saveNode: (directory: string, canvasPath: string, nodeId: string, handleId: string, text: string, expectedText?: string) => Promise<void>;
  mountNode: (directory: string, canvasPath: string, nodeId: string, target: HTMLElement) => Promise<() => void>;
  resolveNodeFile: (directory: string, path: string) => Promise<{ canvasPath: string; nodeId: string; label: string } | undefined>;
  observeNode: (directory: string, canvasPath: string, nodeId: string, onState: (state: { dirty: boolean; error: string; deleted: boolean }) => void) => Promise<{ release(): void; flushSave(): Promise<void> }>;
  flushNodes: () => Promise<void>;
  fileAction: (directory: string, action: "copy" | "rename" | "move" | "delete", path: string, target?: string, nodeId?: string) => Promise<void>;
}>();
const workspace = useWorkspaceStore();
const directory = workspace.project?.directory;
const editorApi = shallowRef<DockviewApi>();
const activeSelection = shallowRef<TreeSelection>();
const sessions = new Map<string, DocumentSession>();
const views = new Map<string, EditorView>();
const sessionWatchers = new Map<DocumentSession, () => void>();
const uniqueSessions = () => [...new Set(sessions.values())];
const refreshQueue = new Set<DocumentSession>();
const refreshing = new Set<DocumentSession>();
let visibleSessions = new Set<DocumentSession>();
const lifetime = new AbortController();
const disposables: { dispose(): void }[] = [];
const openWithRef = ref<InstanceType<typeof openWithDialog>>();
const quickOpenRef = ref<InstanceType<typeof quickOpen>>();
const searchRef = ref<InstanceType<typeof workspaceSearch>>();
const panelElement = ref<HTMLElement>();
let changingFiles = false;
let openRevision = 0;
let opening = Promise.resolve();
let fileRevision = 0;
const active = ref(true);
let refreshFileTree = () => {};
let restoring = false;
let rebuilding = false;
let treeWidth = 260;
let layoutTimer: ReturnType<typeof setTimeout> | undefined;
const layoutKey = `toonflow:documentLayout:${directory}`;
type SavedTab = { id?: string; preview?: boolean; selection: TreeSelection; extensionId: string };
type SavedLayout = { layout: ReturnType<DockviewApi["toJSON"]>; tabs: SavedTab[]; treeWidth: number };
const closedTabs: SavedTab[] = [];
const extensionVersions = new Map<string, string | undefined>();
let savedLayout: SavedLayout | undefined;
try { savedLayout = JSON.parse(settingsStorage.getItem(layoutKey) ?? "null") ?? undefined; } catch { /* 旧布局损坏时从空工作区开始。 */ }
if (savedLayout?.treeWidth && Number.isFinite(savedLayout.treeWidth)) treeWidth = Math.max(180, Math.min(600, savedLayout.treeWidth));

function editorParams(id: string, session: DocumentSession): EditorParams {
  return { session, view: views.get(id)!, close: () => closeEditor(id).catch(reportError), action: action => { void tabAction(id, action).catch(reportError); } };
}

function updateTabDescriptions() {
  for (const [id, session] of sessions) {
    const resource = session.context.resource;
    const duplicate = uniqueSessions().some(other => other !== session && other.context.resource.label === resource.label);
    views.get(id)!.description = duplicate ? (resource.kind === "canvasNode" ? resource.path : resource.path.split("/").slice(0, -1).join("/") || t`工作区`) : "";
  }
}

watch(locale, updateTabDescriptions);

function keepOpen(id: string) {
  const view = views.get(id);
  if (view) view.preview = false;
  saveLayout();
}

function addView(id: string, session: DocumentSession, preview = false, position?: { referencePanel: string; direction: "right" | "below" }) {
  if (sessions.has(id) || editorApi.value?.getPanel(id)) throw new Error("标签已打开，请重新选择");
  sessions.set(id, session);
  views.set(id, shallowReactive({ preview, description: "" }));
  try {
    editorApi.value!.addPanel({ id, title: session.context.resource.label, component: "extView", tabComponent: "editorTab", params: editorParams(id, session), position });
    updateTabDescriptions();
  } catch (error) { if (sessions.get(id) === session) { sessions.delete(id); views.delete(id); } throw error; }
}

function saveLayout() {
  clearTimeout(layoutTimer);
  if (restoring || changingFiles || !editorApi.value) return;
  const layout = editorApi.value.toJSON();
  // 仅保存布局与文件身份，不序列化运行中的组件、闭包或未保存正文。
  const panels = Object.fromEntries(Object.entries(layout.panels).map(([id, panel]) => [id, { ...panel, params: undefined }]));
  try {
    settingsStorage.setItem(layoutKey, JSON.stringify({ layout: { ...layout, panels }, treeWidth,
      tabs: [...sessions].map(([id, session]) => ({ id, preview: views.get(id)?.preview, selection: selectionOf(session.context.resource), extensionId: session.extension.id })) }));
  } catch { /* 存储满或被禁用时仍允许正常编辑。 */ }
}

function scheduleLayoutSave() {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(saveLayout, 250);
}

async function restoreLayout() {
  const saved = savedLayout;
  savedLayout = undefined;
  if (!saved || !Array.isArray(saved.tabs)) return;
  restoring = true;
  try {
    for (const tab of saved.tabs) {
      try { await openSelection(tab.selection, lifetime.signal, false, tab.extensionId, tab.preview, tab.id); }
      catch { /* 已删除的文件或扩展不阻止其余标签恢复。 */ }
    }
    const api = editorApi.value!;
    if (saved.layout && Object.keys(saved.layout.panels).length === sessions.size && Object.keys(saved.layout.panels).every(id => sessions.has(id))) {
      const panels = Object.fromEntries(Object.entries(saved.layout.panels).map(([id, panel]) => [id, { ...panel, contentComponent: "extView", tabComponent: "editorTab", params: editorParams(id, sessions.get(id)!) }]));
      rebuilding = true;
      try { api.fromJSON({ ...saved.layout, panels }); }
      finally { rebuilding = false; }
    }
  } catch (error) { reportError(error); }
  finally { restoring = false; saveLayout(); }
}

async function chooseExtension(resource: ExtResource, force: boolean) {
  const options = await extensionCandidates(resource);
  if (!options.length) throw new Error(`尚未启用支持此文件的扩展，请到插件市场安装或启用：${resource.label}`);
  const key = resource.kind === "canvasNode" ? "canvasNode" : resource.path.split(".").at(-1)!.toLowerCase();
  const associations = settings.value.documentExtensions as Record<string, string> | undefined;
  const defaultId = options.find(option => option.id === associations?.[key])?.id;
  if (!force && (defaultId || options.length === 1)) return resolveExtension(resource, defaultId ?? options[0]!.id);
  const choice = await openWithRef.value?.choose(resource.label, options, defaultId);
  if (!choice) return;
  if (choice.makeDefault) settings.value.documentExtensions = { ...associations, [key]: choice.id };
  return resolveExtension(resource, choice.id);
}

function selectionOf(resource: ExtResource): TreeSelection {
  return resource.kind === "file" ? { filePath: resource.path, label: resource.label }
    : { canvasPath: resource.path, nodeId: resource.nodeId, label: resource.label };
}

function onLayoutReady({ api }: DockviewReadyEvent) {
  if (!directory) return;
  const tree = api.addPanel({ id: "files", component: "fileTree", initialWidth: treeWidth, minimumWidth: 180,
    params: { directory, selection: activeSelection, executeFileAction, readNodes: props.readNodes,
      open: (selection: TreeSelection, preview = false) => { void openSelection(selection, lifetime.signal, false, undefined, preview).catch(reportError); },
      quickOpen: () => quickOpenRef.value?.open(), search: () => searchRef.value?.open() },
  });
  tree.group.header.hidden = true;
  let treeRevision = 0;
  refreshFileTree = () => tree.api.updateParameters({ revision: ++treeRevision });
  tree.group.locked = "no-drop-target";
  const center = api.addGroup({ direction: "right", referenceGroup: tree.group });
  center.header.hidden = true;
  center.locked = "no-drop-target";
  api.addPanel({ id: "editors", component: "editorHost", position: { referenceGroup: center }, params: { ready: onEditorReady } });
  tree.group.api.setSize({ width: treeWidth });
  disposables.push(tree.group.api.onDidDimensionsChange(() => { treeWidth = tree.group.api.width; scheduleLayoutSave(); }));
  const observer = new ResizeObserver(([entry]) => {
    if (!entry || entry.contentRect.width <= 0) return;
    const width = tree.group.api.width || 260;
    api.layout(entry.contentRect.width, entry.contentRect.height);
    tree.group.api.setSize({ width });
  });
  observer.observe(panelElement.value!.querySelector(".documentLayout")!);
  disposables.push({ dispose: () => observer.disconnect() });
}

function onEditorReady({ api }: DockviewReadyEvent) {
  editorApi.value = api;
  disposables.push(api.onDidActivePanelChange(panel => {
    const session = panel && sessions.get(panel.id);
    activeSelection.value = session ? selectionOf(session.context.resource) : undefined;
    refreshDocuments();
  }));
  disposables.push(api.onDidRemovePanel(panel => {
    if (rebuilding) return;
    const session = sessions.get(panel.id);
    sessions.delete(panel.id);
    views.delete(panel.id);
    extensionVersions.delete(panel.id);
    if (session && !uniqueSessions().includes(session)) {
      session.cancelSave();
      sessionWatchers.get(session)?.();
      sessionWatchers.delete(session);
    }
    updateTabDescriptions();
  }));
  disposables.push(api.onDidLayoutChange(() => {
    scheduleLayoutSave();
    refreshDocuments();
  }));
  void restoreLayout();
}

function reportError(error: unknown) { ElMessage.error(documentError(error)); }

function relativePath(path: string) {
  const parts = path.replaceAll("\\", "/").split("/").filter(part => part && part !== ".");
  if (!parts.length || /^[\\/]/.test(path) || /^[a-z][a-z\d+.-]*:/i.test(path) || path.includes("\0") || parts.includes("..")) {
    throw new Error("请选择工作区内的文件或目录");
  }
  return parts.join("/");
}

function pathIdentity(path: string) {
  const normalized = relativePath(path);
  return /^(?:[a-z]:[\\/]|\\\\|\/\/)/i.test(directory ?? "") ? normalized.toLowerCase() : normalized;
}

function openSelection(selection: TreeSelection, signal = lifetime.signal, forceChoice = false, extensionId?: string, preview = false, restoredId?: string) {
  const request = ++openRevision;
  // 打开方式选择、关闭旧扩展和登记视图共用顺序队列，避免异步保存时同一资源重复登记。
  const result = opening.then(() => openSelectionNow(selection, signal, forceChoice, extensionId, preview, restoredId, request));
  opening = result.then(() => {}, () => {});
  return result;
}

async function openSelectionNow(selection: TreeSelection, signal: AbortSignal, forceChoice: boolean, extensionId: string | undefined, preview: boolean, restoredId: string | undefined, request: number) {
  const revision = fileRevision;
  signal.throwIfAborted();
  if (changingFiles) throw new Error("文件操作尚未完成，请稍后再打开");
  if (!directory || workspace.project?.directory !== directory) throw new Error("工作目录已切换");
  const api = await waitForControlValue(() => editorApi.value, signal);
  const resource: ExtResource = "filePath" in selection
    ? { kind: "file", directory, path: relativePath(selection.filePath), label: selection.label }
    : { kind: "canvasNode", directory, path: relativePath(selection.canvasPath), nodeId: selection.nodeId, label: selection.label };
  if (resource.kind === "file" && /\.json$/i.test(resource.path) && await isCanvasFile(useWorkspaceFiles(directory), resource.path)) {
    throw new Error("画布文件请展开后打开节点，不能作为普通文本编辑");
  }
  signal.throwIfAborted();
  if (changingFiles || revision !== fileRevision || workspace.project?.directory !== directory) throw new Error("文件或工作目录已变更，请重新打开");
  const resourceId = JSON.stringify([resource.kind, directory, pathIdentity(resource.path), resource.kind === "canvasNode" ? resource.nodeId : ""]);
  const matching = [...sessions].filter(([, session]) => {
    const current = session.context.resource;
    return current.kind === resource.kind && pathIdentity(current.path) === pathIdentity(resource.path)
      && (current.kind !== "canvasNode" || resource.kind === "canvasNode" && current.nodeId === resource.nodeId);
  });
  const match = matching.find(([id]) => api.getPanel(id)?.group === api.activeGroup) ?? matching[0];
  const existing = match && api.getPanel(match[0]);
  if (existing && !forceChoice) {
    if (preview && request !== openRevision) return;
    if (restoredId && !sessions.has(restoredId) && resource.kind === "file") {
      addView(restoredId, match![1], preview);
      extensionVersions.set(restoredId, extensionVersions.get(match![0]));
      return match![1];
    }
    existing.api.setActive();
    if (!preview) keepOpen(existing.id);
    const session = match![1];
    await session.ready;
    signal.throwIfAborted();
    return session;
  }
  let extension = extensionId ? await resolveExtension(resource, extensionId) : await chooseExtension(resource, forceChoice);
  signal.throwIfAborted();
  if (!extension) return;
  if (preview && request !== openRevision) return;
  const olderSession = [...sessions.values()].find(session => session.extension.id === extension!.id && session.extensionChanged && session.component);
  // 同一扩展的旧标签仍打开时共用旧组件，避免新版样式提前替换旧编辑器的样式。
  if (olderSession) extension = { ...olderSession.extension, load: async () => ({ default: olderSession.component! }) };
  if (changingFiles || revision !== fileRevision) throw new Error("文件已变更，请重新打开");
  // 等待选择期间可能已从其他入口打开同一文件。
  const concurrent = [...sessions].find(([, session]) => session.context.resource.kind === resource.kind
    && pathIdentity(session.context.resource.path) === pathIdentity(resource.path)
    && (resource.kind === "file" || session.context.resource.kind === "canvasNode" && session.context.resource.nodeId === resource.nodeId));
  if (concurrent) {
    if (concurrent[1].extension.id === extension.id) {
      api.getPanel(concurrent[0])!.api.setActive();
      if (!preview) keepOpen(concurrent[0]);
      return concurrent[1];
    }
    for (const [viewId, current] of [...sessions]) if (current === concurrent[1]) await closeEditor(viewId);
  }
  signal.throwIfAborted();
  if (changingFiles || revision !== fileRevision || workspace.project?.directory !== directory) throw new Error("文件或工作目录已变更，请重新打开");
  if (preview && !restoring && !restoredId) {
    for (const panel of [...(api.activeGroup?.panels ?? [])]) {
      if (!views.get(panel.id)?.preview) continue;
      const current = sessions.get(panel.id)!;
      if (current.context.dirty || current.context.error) { keepOpen(panel.id); continue; }
      await closeEditor(panel.id, false);
    }
  }
  if (preview && request !== openRevision) return;
  const id = restoredId ?? resourceId;
  const nodeResource = resource.kind === "canvasNode" ? resource : undefined;
  const session = createDocumentSession(resource, extension, nodeResource
    ? target => props.mountNode(nodeResource.directory, nodeResource.path, nodeResource.nodeId, target) : undefined,
    nodeResource ? onState => props.observeNode(nodeResource.directory, nodeResource.path, nodeResource.nodeId, onState) : undefined,
    () => {
      editorApi.value?.getPanel(id)?.api.close();
      // 节点删除先落盘，再重读 JSON 文件树，避免立即刷新读到删除前的节点。
      if (!changingFiles && !lifetime.signal.aborted) void props.flushNodes().then(refreshFileTree).catch(reportError);
    }, async path => {
      await openSelection({ filePath: path, label: path.split("/").at(-1)! });
      refreshFileTree();
    });
  session.context.active = active.value;
  session.extensionChanged = !!olderSession;
  extensionVersions.set(id, olderSession ? "pending-update" : extensionRevision(extension.id));
  try {
    addView(id, session, preview);
    sessionWatchers.set(session, watch(() => session.context.dirty, dirty => {
      if (dirty) for (const [viewId, current] of sessions) if (current === session) keepOpen(viewId);
    }, { flush: "sync" }));
  } catch (error) {
    session.cancelSave();
    if (sessions.get(id) === session) sessions.delete(id);
    throw error;
  }
  await session.ready;
  signal.throwIfAborted();
  return session;
}

async function closeEditor(id: string, remember = true) {
  const session = sessions.get(id);
  if (!session) return;
  if (session.closing) throw new Error("文档正在关闭，请稍后再试");
  session.closing = true;
  const release = session.lock();
  try {
    await session.context.flushSave();
    if (remember) closedTabs.push({ selection: selectionOf(session.context.resource), extensionId: session.extension.id });
    if (closedTabs.length > 20) closedTabs.shift();
    editorApi.value?.getPanel(id)?.api.close();
  } finally { session.closing = false; release(); }
}

async function tabAction(id: string, action: TabAction) {
  const api = editorApi.value;
  if (!api) return;
  if (action === "reopen") {
    const tab = closedTabs.at(-1);
    if (tab) { await openSelection(tab.selection, lifetime.signal, false, tab.extensionId); closedTabs.pop(); }
    return;
  }
  const panel = api.getPanel(id);
  if (!panel) return;
  if (action === "keepOpen") { keepOpen(id); return; }
  if (action === "splitRight" || action === "splitDown") {
    const session = sessions.get(id)!;
    keepOpen(id);
    if (session.context.resource.kind === "canvasNode") {
      // ACT: 画布节点保留唯一运行实例，分屏只移动，不能复制 Teleport 的挂载目标。
      if (panel.group.panels.length < 2) { ElMessage.info("画布节点只有一个视图，请先打开另一标签再移动到分屏"); return; }
      panel.api.moveTo({ group: panel.group, position: action === "splitRight" ? "right" : "bottom" });
    } else {
      const viewId = `${id}:${crypto.randomUUID()}`;
      addView(viewId, session, false, { referencePanel: id, direction: action === "splitRight" ? "right" : "below" });
      extensionVersions.set(viewId, extensionVersions.get(id));
    }
    return;
  }
  const ids = action === "closeAll" ? api.panels.map(panel => panel.id)
    : action === "closeOthers" ? api.panels.filter(panel => panel.id !== id).map(panel => panel.id)
      : action === "closeRight" ? panel.group.panels.slice(panel.group.panels.indexOf(panel) + 1).map(panel => panel.id) : [id];
  for (const viewId of ids) { try { await closeEditor(viewId); } catch (error) { reportError(error); } }
}

async function flushSave() {
  const pending = uniqueSessions().map(session => ({ session, release: session.lock() }));
  try { await Promise.all(pending.map(({ session }) => session.context.flushSave())); }
  finally { pending.forEach(({ release }) => release()); }
}
function cancelSave() { for (const session of uniqueSessions()) session.cancelSave(); }
function currentSession() { return sessions.get(editorApi.value?.activePanel?.id ?? ""); }

function snapshot(session: DocumentSession | undefined, includeText: boolean) {
  return {
    selection: session ? selectionOf(session.context.resource) : null,
    handleId: session?.handleId || (session?.extension.text ? "text" : null),
    dirty: session?.context.dirty ?? false,
    saveError: session?.context.error || null,
    ...(includeText ? { text: session?.context.text ?? "", readOnly: !session?.extension.text && !session?.handleId } : {}),
  };
}

async function readSession(session: DocumentSession) {
  await session.ready;
  const resource = session.context.resource;
  if (resource.kind !== "canvasNode") return;
  const node = await props.readNode(resource.directory, resource.path, resource.nodeId);
  const output = node.outputs.find(output => output.id === session.handleId) ?? node.outputs[0];
  session.handleId = output?.id ?? "";
  session.context.text = output?.text ?? "";
}

function getDocument(includeText = true) {
  const session = currentSession();
  if (!includeText || !session) return snapshot(session, includeText);
  return readSession(session).then(() => {
    if (currentSession() !== session) throw new Error("文档已切换，请重新读取");
    return snapshot(session, true);
  });
}

async function openDocument(args: Record<string, unknown>, signal: AbortSignal) {
  let selection: TreeSelection;
  if (typeof args.path === "string") selection = { filePath: args.path, label: args.path.split(/[\\/]/).at(-1)! };
  else if (typeof args.canvasPath === "string" && typeof args.nodeId === "string") selection = { canvasPath: args.canvasPath, nodeId: args.nodeId, label: args.nodeId };
  else throw new Error("请指定文件 path，或画布 canvasPath 和 nodeId");
  const session = await openSelection(selection, signal);
  if (!session) throw new Error("已取消选择打开方式");
  if (typeof args.handleId === "string" && session.context.resource.kind === "canvasNode") {
    const resource = session.context.resource;
    const node = await props.readNode(resource.directory, resource.path, resource.nodeId);
    if (!node.outputs.some(output => output.id === args.handleId)) throw new Error("文本输出不存在");
    session.handleId = args.handleId;
  }
  signal.throwIfAborted();
  if (currentSession() !== session) throw new Error("文档已切换，请重新读取");
}

async function writeDocument(args: Record<string, unknown>, signal: AbortSignal) {
  signal.throwIfAborted();
  const session = currentSession();
  if (!session || session.closing || session.context.loading) throw new Error("请先打开需要编辑的文档");
  if (typeof args.text !== "string" || typeof args.expectedText !== "string") throw new Error("需要 text 和读取时的 expectedText");
  await readSession(session);
  signal.throwIfAborted();
  if (currentSession() !== session) throw new Error("文档已切换，请重新读取");
  if (session.closing || session.context.loading) throw new Error("文档正在关闭或加载，请稍后再试");
  if (session.context.text !== args.expectedText) throw new Error("文档内容已变化，请重新读取后编辑");
  const resource = session.context.resource;
  if (resource.kind === "canvasNode") {
    if (!session.handleId) throw new Error("当前节点没有可编辑的文本输出");
    await props.saveNode(resource.directory, resource.path, resource.nodeId, session.handleId, args.text, args.expectedText);
    await readSession(session);
  } else {
    if (!session.extension.text) throw new Error("当前文件扩展不支持文本编辑");
    session.context.updateText(args.text);
    await session.context.flushSave();
  }
  signal.throwIfAborted();
}

async function openSearchResult(location: { path: string; line: number; column: number; query: string }) {
  try {
    const session = await openSelection({ filePath: location.path, label: location.path.split("/").at(-1)! });
    const id = editorApi.value?.activePanel?.id;
    if (session && id && sessions.get(id) === session) views.get(id)!.location = { ...location, revision: Date.now() };
  } catch (error) { reportError(error); }
}

async function replaceSearchFile(path: string, expectedText: string, nextText: string) {
  if (!directory || workspace.project?.directory !== directory || changingFiles) throw new Error("工作区或文件正在变更，请重新搜索");
  path = relativePath(path);
  changingFiles = true;
  fileRevision++;
  try {
    const files = useWorkspaceFiles(directory);
    if (/\.json$/i.test(path) && await isCanvasFile(files, path)) throw new Error("画布 JSON 不支持全文替换，请编辑节点内容");
    const node = await props.resolveNodeFile(directory, path);
    if (node) {
      const document = await props.readNode(directory, node.canvasPath, node.nodeId);
      const output = document.outputs.find(output => output.text === expectedText);
      if (!output) throw new Error("节点内容已变化，请重新搜索");
      await props.saveNode(directory, node.canvasPath, node.nodeId, output.id, nextText, expectedText);
      await props.flushNodes();
      return;
    }
    const session = uniqueSessions().find(session => session.context.resource.kind === "file" && pathIdentity(session.context.resource.path) === pathIdentity(path));
    if (session) {
      await session.ready;
      if (!session.extension.text || session.context.loading || session.context.text !== expectedText) throw new Error("打开的文档内容已变化或不可编辑，请重新搜索");
      session.context.updateText(nextText);
      const release = session.lock();
      try { await session.context.flushSave(); } finally { release(); }
    } else {
      const snapshot = await files.readTextSnapshot(path);
      if (snapshot.text !== expectedText) throw new Error("磁盘内容已变化，请重新搜索");
      await files.writeTextSnapshot(path, nextText, snapshot);
    }
  } finally { changingFiles = false; }
}

async function refreshExtensions() {
  try {
    const enabled = new Set((await listExtensions()).filter(extension => extension.enabled).map(extension => extension.id));
    for (const [id, session] of [...sessions]) {
      if (!enabled.has(session.extension.id)) {
        session.extensionDisabled = true;
        try { await closeEditor(id); }
        catch (error) { session.context.error = `扩展已停用；为保留未保存内容，此标签仍保持打开。${documentError(error)}`; reportError(error); }
      } else {
        session.extensionDisabled = false;
        if (extensionVersions.get(id) !== extensionRevision(session.extension.id)) session.extensionChanged = true;
      }
    }
  } catch (error) { reportError(error); }
}

async function executeFileAction(action: FileAction, item: FileTreeItem, target?: string) {
  if (!directory || workspace.project?.directory !== directory) throw new Error("工作目录已切换");
  if (action === "openWith") {
    await openSelection({ filePath: item.path, label: item.name }, lifetime.signal, true);
    return;
  }
  const files = useWorkspaceFiles(directory);
  if (action === "reveal") return files.reveal(item.path);
  if (action === "create") return files.write(item.path, "", true);
  if (action === "mkdir") return files.mkdir(item.path);
  if (changingFiles) throw new Error("文件操作尚未完成，请稍后再试");
  if (!item.path || (item.type === "node" && (action !== "delete" || !item.nodeId))) throw new Error("不能修改这个文件树条目");
  const sourcePath = relativePath(item.path);
  if (target !== undefined) target = relativePath(target);
  if (item.type === "canvas" && ["rename", "move"].includes(action) && !target?.toLowerCase().endsWith(".json")) throw new Error("画布文件须保留 .json 后缀");
  changingFiles = true;
  fileRevision++;
  const pending = [...sessions.entries()].map(([id, session]) => ({ id, session, release: session.lock() }));
  const previousLayout = editorApi.value?.toJSON();
  const renamed: { id: string; nextId: string; preview: boolean; selection: TreeSelection; extensionId: string; wasActive: boolean }[] = [];
  try {
    await Promise.all(pending.map(({ session }) => session.context.flushSave()));
    await props.fileAction(directory, action, sourcePath, target, item.type === "node" ? item.nodeId : undefined);
    if (action !== "copy") {
      const sourceIdentity = pathIdentity(sourcePath);
      for (const { id, session } of pending) {
        if (item.type === "node" && (session.context.resource.kind !== "canvasNode" || session.context.resource.nodeId !== item.nodeId)) continue;
        const path = pathIdentity(session.context.resource.path);
        if (path === sourceIdentity || path.startsWith(`${sourceIdentity}/`)) {
          if (action === "rename" || action === "move") {
            const resource = session.context.resource;
            const renamedPath = `${target}${resource.path.slice(sourcePath.length)}`;
            renamed.push({
              id, nextId: `document:${crypto.randomUUID()}`, preview: views.get(id)?.preview ?? false,
              selection: selectionOf({ ...resource, path: renamedPath, label: resource.kind === "file" ? renamedPath.split("/").at(-1)! : resource.label }),
              extensionId: session.extension.id, wasActive: editorApi.value?.activePanel?.id === id,
            });
          }
          editorApi.value?.getPanel(id)?.api.close();
        }
      }
    }
  } finally {
    changingFiles = false;
    pending.forEach(({ release }) => release());
  }
  for (const entry of renamed.sort((left, right) => Number(left.wasActive) - Number(right.wasActive))) {
    const resource: ExtResource = "filePath" in entry.selection
      ? { kind: "file", directory, path: entry.selection.filePath, label: entry.selection.label }
      : { kind: "canvasNode", directory, path: entry.selection.canvasPath, label: entry.selection.label, nodeId: entry.selection.nodeId };
    const supported = (await extensionCandidates(resource)).some(extension => extension.id === entry.extensionId);
    await openSelection(entry.selection, lifetime.signal, false, supported ? entry.extensionId : undefined, entry.preview, entry.nextId).catch(reportError);
  }
  const remappedIds = new Map(renamed.map(entry => [entry.id, entry.nextId]));
  const expectedIds = previousLayout && Object.keys(previousLayout.panels).map(id => remappedIds.get(id) ?? id);
  // 重开期间用户可能继续关闭或打开标签，此时以当前布局为准，不恢复过时的布局快照。
  if (renamed.length && previousLayout && expectedIds?.length === sessions.size && expectedIds.every(id => sessions.has(id))) {
    const layout: SavedLayout["layout"] = JSON.parse(JSON.stringify({ ...previousLayout, panels: {} }, (_key, value) => typeof value === "string" ? remappedIds.get(value) ?? value : value));
    layout.panels = Object.fromEntries(Object.entries(previousLayout.panels).map(([oldId, panel]) => {
      const id = remappedIds.get(oldId) ?? oldId;
      const session = sessions.get(id)!;
      return [id, { ...panel, id, title: session.context.resource.label, params: editorParams(id, session) }];
    }));
    rebuilding = true;
    try { editorApi.value!.fromJSON(layout); } finally { rebuilding = false; }
  }
  saveLayout();
}
async function performFileAction(currentDirectory: string, action: "copy" | "rename" | "move" | "delete", path: string, target?: string, entryType: "canvas" | "directory" = "canvas") {
  if (currentDirectory !== directory) throw new Error("工作目录已切换");
  await executeFileAction(action, { key: path, path, name: path.split(/[\\/]/).at(-1)!, type: entryType }, target);
  refreshFileTree();
}
window.addEventListener("toonflow:ext-updated", refreshExtensions);
function beforeUnload(event: BeforeUnloadEvent) {
  saveLayout();
  if (![...sessions.values()].some(session => session.context.dirty)) return;
  event.preventDefault();
  event.returnValue = "";
}
function drainRefreshQueue() {
  if (!active.value || lifetime.signal.aborted) { refreshQueue.clear(); return; }
  // ACT: 只检查可见分组中的文档，最多同时读两个文件；隐藏标签切回来时再读取。
  for (const session of refreshQueue) {
    if (refreshing.size >= 2) break;
    refreshQueue.delete(session);
    if (!visibleSessions.has(session)) continue;
    refreshing.add(session);
    void session.refreshDisk().catch(error => { session.context.error = documentError(error); }).finally(() => {
      refreshing.delete(session);
      drainRefreshQueue();
    });
  }
}
function refreshDocuments(force = false) {
  if (!active.value || lifetime.signal.aborted) return;
  const visible = new Set((editorApi.value?.panels ?? []).filter(panel => panel.api.isVisible)
    .map(panel => sessions.get(panel.id)).filter((session): session is DocumentSession => !!session));
  for (const session of visible) {
    if ((force || !visibleSessions.has(session)) && !refreshing.has(session)) refreshQueue.add(session);
  }
  visibleSessions = visible;
  drainRefreshQueue();
}
function onWindowFocus() { refreshDocuments(true); }
function onDocumentKeydown(event: KeyboardEvent) {
  if (!active.value || event.altKey || !(event.ctrlKey || event.metaKey)) return;
  const target = event.target instanceof Element ? event.target : undefined;
  if (target && target !== document.body && !target.closest(".documentPanel")) return;
  const api = editorApi.value;
  if (!api) return;
  if (!event.shiftKey && event.key.toLowerCase() === "p") {
    event.preventDefault(); quickOpenRef.value?.open();
  } else if (event.shiftKey && event.key.toLowerCase() === "f") {
    event.preventDefault(); searchRef.value?.open();
  } else if (event.shiftKey && event.key.toLowerCase() === "t") {
    event.preventDefault(); void tabAction("", "reopen").catch(reportError);
  } else if (event.key.toLowerCase() === "w" && api.activePanel) {
    event.preventDefault(); void tabAction(api.activePanel.id, "close").catch(reportError);
  } else if (event.key === "Tab" || event.key === "PageDown" || event.key === "PageUp") {
    event.preventDefault();
    const panels = api.panels;
    const index = panels.findIndex(panel => panel.id === api.activePanel?.id);
    const backwards = event.shiftKey || event.key === "PageUp";
    panels[(index + (backwards ? -1 : 1) + panels.length) % panels.length]?.api.setActive();
  }
}
window.addEventListener("beforeunload", beforeUnload);
window.addEventListener("focus", onWindowFocus);
window.addEventListener("keydown", onDocumentKeydown, true);
onActivated(() => { active.value = true; for (const session of uniqueSessions()) session.context.active = true; refreshDocuments(true); refreshFileTree(); });
onDeactivated(() => { active.value = false; refreshQueue.clear(); visibleSessions.clear(); for (const session of uniqueSessions()) session.context.active = false; });
onBeforeUnmount(() => {
  window.removeEventListener("toonflow:ext-updated", refreshExtensions);
  window.removeEventListener("beforeunload", beforeUnload);
  window.removeEventListener("focus", onWindowFocus);
  window.removeEventListener("keydown", onDocumentKeydown, true);
  clearTimeout(layoutTimer);
  saveLayout();
  lifetime.abort(new Error("文档工作区已关闭"));
  cancelSave();
  sessionWatchers.forEach(stop => stop());
  disposables.forEach(disposable => disposable.dispose());
});
defineExpose({ flushSave, cancelSave, getDocument, openDocument, writeDocument, performFileAction });
</script>

<style lang="scss">
.documentPanel {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding-top: 60px;
  padding-right: var(--agentWidth, 0px);
  overflow: hidden;
  background: var(--el-bg-color);
  .documentLayout { width: 100%; height: 100%; border-top: 1px solid var(--el-border-color); }
  .dockviewToonflow {
    --dv-background-color: var(--el-bg-color);
    --dv-group-view-background-color: var(--el-bg-color);
    --dv-tabs-and-actions-container-background-color: var(--el-fill-color-light);
    --dv-activegroup-visiblepanel-tab-background-color: var(--el-bg-color);
    --dv-activegroup-hiddenpanel-tab-background-color: var(--el-fill-color-light);
    --dv-inactivegroup-visiblepanel-tab-background-color: var(--el-bg-color);
    --dv-inactivegroup-hiddenpanel-tab-background-color: var(--el-fill-color-light);
    --dv-activegroup-visiblepanel-tab-color: var(--el-text-color-primary);
    --dv-activegroup-hiddenpanel-tab-color: var(--el-text-color-secondary);
    --dv-inactivegroup-visiblepanel-tab-color: var(--el-text-color-regular);
    --dv-inactivegroup-hiddenpanel-tab-color: var(--el-text-color-secondary);
    --dv-tab-divider-color: var(--el-border-color);
    --dv-separator-border: var(--el-border-color);
    --dv-tabs-and-actions-container-height: 35px;
    --dv-drag-over-background-color: var(--el-color-primary-light-8);
    --dv-drag-over-border-color: var(--el-color-primary);
    .dv-tab { padding: 0; }
    .dv-tab.dv-active-tab { border-top: 2px solid var(--el-color-primary); }
  }
}
</style>
