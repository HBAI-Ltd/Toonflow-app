<template>
  <!-- ACT: TrumanMap 是画布节点插件：这里只给它搭一个看不见的单节点画布和宿主能力，编辑器自己全屏弹出；退出后整块卸载。 -->
  <div class="sceneProject" inert aria-hidden="true">
    <vue-flow v-if="nodes" :id="flowId" :nodes="nodes" :nodeTypes="nodeTypes" :nodesDraggable="false" :nodesConnectable="false" :elementsSelectable="false" :deleteKeyCode="null" />
  </div>
  <!-- 素材库面板不显示，只借用它的“保存到素材库”对话框选导出位置和名称。 -->
  <assetLibrary v-if="canSaveAssets" ref="assetLibraryRef" />
</template>

<script setup lang="ts">
import axios from "axios";
import { markRaw, onBeforeUnmount, onMounted, provide, shallowRef, watch } from "vue";
import { ElMessage } from "element-plus";
import { VueFlow, useVueFlow, type Node, type NodeTypesObject } from "@vue-flow/core";
import type { NodePersistenceContext, NodeProjectContext } from "@toonflow/nodes-scaffold/nodeDocument";
import { useNodeToolsContext } from "@toonflow/nodes-scaffold/nodeTools";
import { uploadNodeFile } from "@toonflow/nodes-scaffold/workspaceFiles";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { currentUser } from "@/stores/multiTenant";
import { useWorkspaceStore } from "@/stores/workspace";
import { loadNodeComponent } from "@/pages/workspace/panels/canvas/loadNodeComponent";
import assetLibrary from "@/pages/workspace/panels/canvas/components/assetLibrary.vue";

type ProjectFile = { toonflowCanvas: true; nodes: Node[]; edges: unknown[]; viewport: { x: number; y: number; zoom: number } };
export type SceneRequest = { prompt: string; images: File[]; model: string; reasoningEffort: string; format: string };

// request：首页“生成预演”新建的场景，打开后设好画幅，把描述作为第一条消息发给内置 Agent。
const props = defineProps<{ directory: string; request?: SceneRequest }>();
const emit = defineEmits<{ close: [] }>();
// 项目文件沿用画布格式，场景数据由插件写在同一目录的 assets/节点ID/ 下；同一文件夹也能作为普通项目打开。
const projectPath = "白模预演.json";
const nodeName = "trumanMap";
const nodeType = `remote-${nodeName}`;
const flowId = `trumanMap-${crypto.randomUUID()}`;
const flow = useVueFlow(flowId);
const getNodeTools = useNodeToolsContext(flow);
const workspaceStore = useWorkspaceStore();
// 子账号没有全局素材库权限，插件据此只保留下载。
const canSaveAssets = currentUser.value?.role !== "user";
const assetLibraryRef = shallowRef<InstanceType<typeof assetLibrary>>();
const nodes = shallowRef<Node[]>();
const nodeTypes = shallowRef<NodeTypesObject>({});
// 打开时取得规范目录后固定，保存排队执行，避免并发覆盖。
let files: ReturnType<typeof useWorkspaceFiles> | undefined;
let directory = "";
let project: ProjectFile | undefined;
const nodeId = shallowRef("");
const lifetime = new AbortController();
onBeforeUnmount(() => lifetime.abort());
let saving = Promise.resolve();

function showError(error: unknown) {
  ElMessage.error(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "操作失败，请重试");
}

function saveProject() {
  const task = saving.then(() => {
    if (!files || !project) throw new Error("请先选择工作目录");
    const data = flow.findNode(nodeId.value)?.data;
    return files.writeJson(projectPath, { ...project, nodes: project.nodes.map(item => item.id === nodeId.value && data ? { ...item, data } : item) });
  });
  saving = task.catch(() => {});
  return task;
}

provide("workspaceFiles", () => {
  if (!files) throw new Error("请先选择工作目录");
  return files;
});
provide("workspaceDirectory", () => {
  if (!directory) throw new Error("请先选择工作目录");
  return directory;
});
provide("nodePersistence", (): NodePersistenceContext | undefined => directory ? {
  directory,
  canvasPath: projectPath,
  async save(signal?: AbortSignal) {
    signal?.throwIfAborted();
    await saveProject();
    signal?.throwIfAborted();
  },
} : undefined);
provide("nodeProject", {
  close(error?: unknown) {
    if (error) showError(error);
    emit("close");
  },
  chooseAssetFolder: canSaveAssets ? async (name: string) => assetLibraryRef.value?.chooseFolder(name) : undefined,
  saveAssets: canSaveAssets ? saveAssets : undefined,
} satisfies NodeProjectContext);

// 素材库建目录不递归：先建不重名的导出文件夹，再逐级建子文件夹；文件只新建不覆盖。
async function saveAssets(folder: string, entries: { path: string; file: Blob }[], signal?: AbortSignal) {
  let target = folder;
  for (let number = 2; ; number++) {
    try {
      await axios.post("/api/assets/mkdir", { path: target }, { signal });
      break;
    } catch (error) {
      if (!axios.isAxiosError<{ data?: { code?: string } }>(error) || error.response?.data?.data?.code !== "EEXIST" || number > 99) throw error;
      target = `${folder} (${number})`;
    }
  }
  const folders = new Set<string>();
  for (const entry of entries) {
    const parts = entry.path.split("/");
    for (let index = 1; index < parts.length; index++) {
      const path = `${target}/${parts.slice(0, index).join("/")}`;
      if (folders.has(path)) continue;
      await axios.post("/api/assets/mkdir", { path }, { signal });
      folders.add(path);
    }
    await axios.put("/api/assets/save", entry.file, { params: { path: `${target}/${entry.path}` }, headers: { "Content-Type": "application/octet-stream" }, signal });
  }
  return target;
}

// 插件只在首次写场景时把场景路径记进节点数据：随即保存项目文件，避免中途退出后重开找不到场景。
watch(() => flow.findNode(nodeId.value)?.data, (data, previous) => {
  if (data && previous) saveProject().catch(showError);
}, { deep: true });

onMounted(async () => {
  try {
    const { data } = await axios.get<{ data: { name: string; url: string; enabled?: boolean }[] }>("/api/nodes/get", { headers: { "Cache-Control": "no-cache", "x-toonflow-workspace": "1" } });
    const plugin = data.data.find(item => item.name === nodeName && item.enabled !== false && item.url === `/api/nodes/files?name=${nodeName}`);
    if (!plugin) throw new Error("远程节点未加载，请确认插件已安装并启用");
    // 不支持独立项目的旧版插件挂上去不会打开编辑器，只会一直等：先查声明；页面里缓存的可能是更新前的脚本，重新拉一次最新安装的再判断。
    const supportsProject = (value: unknown) => (value as { nodeProject?: unknown }).nodeProject === true;
    let component = await loadNodeComponent(nodeName, plugin.url);
    if (!supportsProject(component)) component = await loadNodeComponent(nodeName, plugin.url, true);
    if (!supportsProject(component)) throw new Error("TrumanMap 插件版本过旧，不支持白模预演，请更新插件后重试");
    const listing = await useWorkspaceFiles(props.directory).list();
    const target = useWorkspaceFiles(listing.directory);
    // 文件夹里已有白模预演场景就打开它，没有就新建（只新建，不覆盖同名文件）。
    let saved: ProjectFile | undefined;
    if (listing.entries.some(entry => entry.path === projectPath && entry.type === "file")) saved = await target.readJson<ProjectFile>(projectPath);
    else {
      saved = { toonflowCanvas: true, nodes: [{ id: crypto.randomUUID(), type: nodeType, position: { x: 0, y: 0 }, data: { label: nodeName } }], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
      await target.writeJson(projectPath, saved, true);
    }
    const node = saved?.toonflowCanvas === true && Array.isArray(saved.nodes) ? saved.nodes.find(item => item?.type === nodeType && typeof item.id === "string") : undefined;
    if (!node) throw new Error("该文件夹里的“白模预演.json”不是白模预演场景，请换一个文件夹");
    workspaceStore.addScene(listing.directory);
    files = target;
    directory = listing.directory;
    project = saved;
    nodeId.value = node.id;
    nodeTypes.value = { [nodeType]: markRaw(component) };
    nodes.value = [node];
  } catch (error) {
    showError(error);
    emit("close");
    return;
  }
  if (props.request) sendRequest(props.request, files).catch(error => { if (!lifetime.signal.aborted) showError(error); });
});

// 通过插件注册的节点函数操作编辑器（自动打开编辑器、等视口就绪），和画布总 Agent 调用的是同一入口。
async function sendRequest(request: SceneRequest, target: ReturnType<typeof useWorkspaceFiles>) {
  const tools = getNodeTools();
  const call = (name: string, args: Record<string, unknown>) => tools.call({ nodeId: nodeId.value, name: `node:${name}`, args }, lifetime.signal);
  // ACT: 节点函数在节点组件 setup 时注册，挂载时机由 Vue Flow 决定，这里轮询最多 10 秒。
  for (let tries = 0; !tools.list([nodeId.value], ["node:editorAgentChat"]).next().value; tries++) {
    lifetime.signal.throwIfAborted();
    if (tries >= 200) throw new Error("TrumanMap 插件版本过旧，不支持自动发送描述，请更新插件后重试");
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  await call("editorCameras", { action: "format", format: request.format });
  const images: string[] = [];
  for (const file of request.images) {
    lifetime.signal.throwIfAborted();
    images.push(await uploadNodeFile(target, nodeId.value, file));
  }
  await call("editorAgentChat", { message: request.prompt, ...(images.length ? { images } : {}), ...(request.model ? { model: request.model } : {}), ...(request.reasoningEffort ? { thinking: request.reasoningEffort } : {}) });
}
</script>

<style lang="scss" scoped>
.sceneProject {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 240px;
  visibility: hidden;
  pointer-events: none;
}
</style>
