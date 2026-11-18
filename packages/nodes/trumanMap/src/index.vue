<template>
  <nodeSkeleton v-bind="nodeProps" class="trumanMapNode" :topVisible="false" :fullscreenVisible="false">
    <button type="button" class="sceneCover nodrag nopan" :disabled="saving || closing" aria-label="打开 TrumanMap 场景编辑器" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop @click.stop="openEditor">
      <icon-cube-3d-sphere :size="46" stroke="1.2" />
      <span>{{ sceneLoading ? "正在载入场景" : "打开场景编辑器" }}</span>
    </button>
    <p v-if="errorMessage && !editing" class="nodeError" role="alert">{{ errorMessage }}</p>
  </nodeSkeleton>
  <el-dialog v-if="editing || closing" :modelValue="editing" class="trumanMapDialog" fullscreen appendToBody :destroyOnClose="true" :showClose="false" :closeOnClickModal="false" :closeOnPressEscape="false" :beforeClose="closeEditor" @closed="closing = false">
    <sceneStudio ref="editor" v-model="document" :loadModel="loadModel" :prepareAsset="prepareAsset" :importModel="importModel" :saving="saving" :statusMessage="statusMessage" :error="errorMessage" :aiModels="aiModels" :modelsLoading="modelsLoading" :generateAi="generateAi" :saveAi="saveAi" :generateText="generateText" :listSkills="listSkills" :conversationStore="conversationStore" :canSnapshotRuntime="canSnapshotRuntime" :exportCanvas="project ? undefined : exportCanvas" :exportAssets="project?.saveAssets" :chooseAssetFolder="project?.chooseAssetFolder" :upstreamText="upstreamText" @loadModels="loadModels" @save="saveScene" @close="project ? closeProject() : closeEditor()" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from "vue";
import { ElDialog } from "element-plus";
import { useVueFlow } from "@vue-flow/core";
import { IconCube3dSphere } from "@tabler/icons-vue";
import { nodeSkeleton, useNode, uploadNodeFile, type NodeHandle, type WorkspaceFiles, type NodeAiModel, z } from "@toonflow/nodes-scaffold/runtime";
import { useNodePersistence, useNodeProject, type NodePersistenceContext } from "@toonflow/nodes-scaffold/nodeDocument";
import sceneStudio from "./sceneStudio.vue";
import { builtinAssets, downloadAsset, validateModel } from "./assetLibrary";
import { resolveAssetModel } from "./assetModelResolver";
import { createSceneDocument, type SceneDocument, type SceneAsset, type SceneAnchor } from "./sceneDocument";
import { sceneToolNames, snapshotSceneAnchor } from "./aiScene";
import { parseSceneDocument } from "./sceneValidation";
import { createHolodeckDraft, createHolodeckPrompt, holodeckSchemas } from "./holodeckAgent";
import { isStageOnlyRequest, needsAdvancedStage } from "./stageRouting";
import { readHostToolNames, runHolodeckAgent, type ThinkingLevel } from "./singleAgent";
import { hostAgentContext, hostReplyStyle, listHostSkills, skillInstruction } from "./agentHost";
import { createSceneObserver } from "./sceneObservation";
import { renderModel } from "./modelGeometry";
import { rehearsePerformance } from "./performanceRehearsal";
import type { CanvasExportBundle } from "./exportBundle";
import { editorEvents, summarizeScene, type EditorEventArgs, type EditorEventName, type StudioEventFile, type StudioEventInput, type StudioEventName } from "./editorEvents";

defineOptions({
  inheritAttrs: false,
  icon: IconCube3dSphere,
  // ACT: 上游剧本接入：连上文本节点（剧本、分场、对白），Agent每轮都带上这份剧本，分镜对白框可一键带入。
  handles: [{ id: "in", type: "target", dataType: "STRING", label: "剧本、说明文字" }] satisfies NodeHandle[],
  // 声明支持被宿主当独立项目打开（useNodeProject）：宿主据此拒绝旧版本，而不是挂上去干等。
  nodeProject: true,
});
const { id, node, nodeProps, files, nodeEvent, nodeTools, ai } = useNode({ label: "白模预演TrumanMap" });
const getPersistence = useNodePersistence();
// 白模预演把本节点当独立项目全屏打开：没有画布，导出存进全局素材库，关闭即退出项目。
const project = useNodeProject();
// ACT: 导出包交付到画布（导出面板“导出到画布”、总Agent的editorExport）：本节点右侧找一块空地，左边一列放整场的（场景微缩图、分镜总览、
// 分镜脚本文本、预演小样视频），右边每镜一行：分镜图、四视图（图片节点 outputs.image）、白模视频（视频节点 outputs.video），可直接连到图生图、图生视频、视频参考节点。
const flow = useVueFlow();
const imageNode = "remote-imageNode", videoNode = "remote-videoNode", textNode = "remote-textNode";
const exportCanvas = {
  check(needs: { image: boolean; video: boolean }) {
    if (needs.image && !flow.nodeTypes?.value?.[imageNode]) throw new Error("请先启用图片节点插件，再把图片导出到画布（也可以点“下载”打包）");
    if (needs.video && !flow.nodeTypes?.value?.[videoNode]) throw new Error("请先启用视频节点插件，再把视频导出到画布（也可以点“下载”打包）");
  },
  async deliver(bundle: CanvasExportBundle, signal: AbortSignal, onNode?: () => void) {
    exportCanvas.check({ image: !!(bundle.overview || bundle.sheet || bundle.shots.some(shot => shot.frame || shot.views)), video: !!(bundle.previs || bundle.shots.some(shot => shot.clip)) });
    const targetFiles = files.getWorkspaceFiles();
    const gap = 24, image = { width: 240 * 16 / 9 + 18, height: 320 }, video = { width: 480, height: 340 }, text = { width: 360, height: 420 };
    const script = bundle.script && flow.nodeTypes?.value?.[textNode] ? bundle.script : undefined;
    type SideItem = { kind: "image" | "video"; file: File; label: string; size: typeof image } | { kind: "text"; size: typeof image };
    const side: SideItem[] = [
      ...(bundle.overview ? [{ kind: "image" as const, ...bundle.overview, size: image }] : []),
      ...(bundle.sheet ? [{ kind: "image" as const, ...bundle.sheet, size: image }] : []),
      ...(script ? [{ kind: "text" as const, size: text }] : []),
      ...(bundle.previs ? [{ kind: "video" as const, ...bundle.previs, size: video }] : []),
    ];
    const columns = (["frame", "views", "clip"] as const).filter(key => bundle.shots.some(shot => shot[key]));
    const columnWidth = (key: (typeof columns)[number]) => key === "clip" ? video.width : image.width;
    const rowHeight = columns.includes("clip") ? video.height : image.height;
    const sideWidth = side.length ? Math.max(...side.map(item => item.size.width)) + gap * 2 : 0;
    const origin = findCanvasSpot(sideWidth + columns.reduce((sum, key) => sum + columnWidth(key) + gap, 0), Math.max(side.reduce((sum, item) => sum + item.size.height + gap, 0), bundle.shots.length * (rowHeight + gap)), gap);
    let created = 0;
    const add = async (kind: "image" | "video", file: File, label: string, x: number, y: number) => {
      signal.throwIfAborted();
      const nodeId = crypto.randomUUID();
      const path = await uploadNodeFile(targetFiles, nodeId, file);
      signal.throwIfAborted();
      const value = { url: path, mimeType: file.type };
      flow.addNodes({ id: nodeId, type: kind === "image" ? imageNode : videoNode, position: { x, y }, data: { label, outputs: kind === "image" ? { image: { dataType: "IMAGE", value } } : { video: { dataType: "VIDEO", value } } } });
      created++;
      onNode?.();
    };
    let y = origin.y;
    for (const item of side) {
      if (item.kind === "text") { flow.addNodes({ id: crypto.randomUUID(), type: textNode, position: { x: origin.x, y }, data: { label: (script?.split(/\r?\n/)[0] ?? "").replace(/^#\s*/, "").slice(0, 60) || "分镜脚本", outputs: { text: { dataType: "STRING", value: script } } } }); created++; onNode?.(); }
      else await add(item.kind, item.file, item.label, origin.x, y);
      y += item.size.height + gap;
    }
    for (const [row, shot] of bundle.shots.entries()) {
      let x = origin.x + sideWidth;
      for (const key of columns) {
        const item = shot[key];
        if (item) await add(key === "clip" ? "video" : "image", item.file, item.label, x, origin.y + row * (rowHeight + gap));
        x += columnWidth(key) + gap;
      }
    }
    return created;
  },
};
/** 本节点右侧找一块放得下 width×height 的地方：整块往下挪，避开右侧已有的节点。 */
function findCanvasSpot(width: number, height: number, gap: number) {
  const self = flow.findNode(id);
  if (!self) throw new Error("找不到当前节点，请重新打开场景后再导出");
  const x = self.computedPosition.x + (self.dimensions.width || 320) + 80;
  let y = self.computedPosition.y;
  for (const other of [...flow.getNodes.value].sort((a, b) => a.computedPosition.y - b.computedPosition.y)) {
    const position = other.computedPosition;
    if (other.id !== id && position.x < x + width && position.x + (other.dimensions.width || 320) > x && position.y < y + height && position.y + (other.dimensions.height || 300) > y) y = position.y + (other.dimensions.height || 300) + gap;
  }
  return { x, y };
}
const editing = ref(false);
const closing = ref(false);
const saving = ref(false);
const statusMessage = ref("");
const errorMessage = ref("");
const editor = ref<InstanceType<typeof sceneStudio>>();
const aiModels = shallowRef<NodeAiModel[]>([]);
const modelsLoading = ref(false);
const currentDocument = shallowRef<SceneDocument>(createSceneDocument());
let workspace: WorkspaceFiles | undefined;
let persistence: NodePersistenceContext | undefined;
let disposed = false;
let agentRunning = false;
let publicBusy = false;
let saveAfterClose = false;
let sceneSave: Promise<boolean> | undefined;
let publicDraft: { draft: ReturnType<typeof makeWorldDraft>; context: WorldContext; base: SceneDocument; signature: string; catalogWarning?: string } | undefined;
function clearPublicDraft() { publicDraft?.draft.dispose(); publicDraft = undefined; }
const controller = new AbortController();
const data = computed(() => node.data as typeof node.data & {
  /** 场景文件 assets/节点ID/scene.json：画布 JSON 只存这个路径。 */
  trumanMapPath?: string;
  /** 复制粘贴带来的整份场景：新节点挂上画布就写进自己的目录，然后移除。 */
  trumanMapSnapshot?: SceneDocument;
  trumanMapRecovery?: { path: string; createdAt: number };
});
const document = computed({
  get: () => currentDocument.value,
  set: (value: SceneDocument) => {
    currentDocument.value = value;
    sceneLoaded = true;
    scheduleSceneWrite();
    statusMessage.value = "";
  },
});

function reportError(error: unknown) { if (!disposed) errorMessage.value = error instanceof Error ? error.message : "操作失败，请重试"; }

// ACT: 场景存在节点自己的素材目录里（同宿主导演台的 model.json），画布 JSON 只记路径：宿主每次自动保存（平移画布、挪一下物体）
// 都整份序列化画布，场景（尤其内联 AI 模型顶点）放在节点数据里会让一张画布到几十 MB、每次保存卡一秒多。
// 场景载入一次后以内存为准；编辑提交后防抖写盘，宿主保存、删除、复制节点前等写盘完成；复制时整份场景作为快照交给新节点。
const sceneLoading = ref(false);
let sceneLoaded = false;
let sceneLoad: Promise<SceneDocument> | undefined;
/** 已写进本节点场景文件的那一份（同一对象即无需再写）。 */
let storedScene: SceneDocument | undefined;
let sceneWriteTimer: ReturnType<typeof setTimeout> | undefined;
let sceneWrites: Promise<void> = Promise.resolve();
// 多次写盘共用开始时的工作区，切换项目后不会写进另一个目录。
let sceneFiles: WorkspaceFiles | undefined;
function getSceneFiles() { return sceneFiles ??= files.getWorkspaceFiles(); }
function sceneFilePath() {
  if (!id || /[\\/]/.test(id) || id === "." || id === "..") throw new Error("节点 ID 不能作为文件夹名称");
  return `assets/${id}/scene.json`;
}
function isMissingFile(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { data?: { code?: string } } } }).response;
  return response?.status === 404 || response?.data?.data?.code === "ENOENT";
}
// 宿主对同一路径及其上下级的并发读写回 409 EBUSY（打开画布时多个节点同时建 assets 目录、写各自的场景文件）：稍等再试。
async function retryBusy<T>(operation: () => Promise<T>) {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      const response = (error as { response?: { status?: number; data?: { data?: { code?: string } } } }).response;
      if (attempt >= 40 || response?.status !== 409 || response.data?.data?.code !== "EBUSY") throw error;
      await new Promise(resolve => setTimeout(resolve, Math.min(300, 30 * (attempt + 1)) + Math.random() * 50));
    }
  }
}
let sceneDirectoryReady = false;
/** 写盘排队：后一次接在前一次后面，失败不影响后面的排队。 */
function queueSceneWrite(task: () => Promise<void>) {
  const next = sceneWrites.then(task);
  sceneWrites = next.catch(() => {});
  return next;
}
/** 写本节点场景文件；写成后画布里只留路径。 */
async function writeSceneText(text: string) {
  const targetFiles = getSceneFiles();
  const path = sceneFilePath();
  const prepareDirectory = async () => {
    for (const directory of ["assets", `assets/${id}`]) {
      await retryBusy(() => targetFiles.mkdir(directory)).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
        if (error.response?.data?.data?.code !== "EEXIST") throw error;
      });
    }
    sceneDirectoryReady = true;
  };
  if (!sceneDirectoryReady) await prepareDirectory();
  try { await retryBusy(() => targetFiles.write(path, text)); }
  catch (error) {
    // 目录被删过（例如删除节点后撤销）：重建后再写一次。
    if (!isMissingFile(error)) throw error;
    await prepareDirectory();
    await retryBusy(() => targetFiles.write(path, text));
  }
  if (data.value.trumanMapPath !== path) data.value.trumanMapPath = path;
  if (data.value.trumanMapSnapshot) delete data.value.trumanMapSnapshot;
}
function flushSceneWrite() {
  clearTimeout(sceneWriteTimer);
  sceneWriteTimer = undefined;
  if (!sceneLoaded || currentDocument.value === storedScene) return sceneWrites;
  return queueSceneWrite(async () => {
    const scene = currentDocument.value;
    if (scene === storedScene) return;
    await writeSceneText(JSON.stringify(scene));
    storedScene = scene;
  });
}
function scheduleSceneWrite() {
  clearTimeout(sceneWriteTimer);
  sceneWriteTimer = setTimeout(() => {
    flushSceneWrite().catch(error => reportError(new Error(`场景保存失败：${error instanceof Error ? error.message : "无法写入场景文件"}`)));
  }, 500);
}

function loadScene(): Promise<SceneDocument> {
  if (sceneLoaded) return Promise.resolve(currentDocument.value);
  sceneLoad ??= (async () => {
    sceneLoading.value = true;
    try {
      const snapshot = data.value.trumanMapSnapshot;
      const path = data.value.trumanMapPath;
      let scene = createSceneDocument();
      if (snapshot) scene = parseSceneDocument(toRaw(snapshot));
      else if (path !== undefined) {
        if (path !== sceneFilePath()) throw new Error("场景文件路径无效");
        let text: string;
        try { text = await retryBusy(() => getSceneFiles().readText(path)); }
        catch (error) {
          if (isMissingFile(error)) throw new Error(`找不到场景文件 ${path}，请检查工作目录里的素材是否被删除或移动`);
          throw error;
        }
        scene = parseSceneDocument(JSON.parse(text));
      }
      if (!disposed && !sceneLoaded) {
        currentDocument.value = scene;
        storedScene = snapshot || path === undefined ? undefined : scene;
        sceneLoaded = true;
      }
      return currentDocument.value;
    } finally {
      sceneLoad = undefined;
      if (!disposed) sceneLoading.value = false;
    }
  })();
  return sceneLoad;
}
// 粘贴来的节点带着整份场景快照：挂上画布就写进自己的目录，画布里不留大数据。
if (data.value.trumanMapSnapshot) loadScene().then(() => flushSceneWrite()).catch(reportError);

async function openEditor() {
  if (editing.value) return;
  errorMessage.value = "";
  try {
    workspace = files.getWorkspaceFiles();
    persistence = getPersistence?.();
    if (!persistence) throw new Error("当前宿主未提供画布保存能力，请更新 Toonflow 后重试");
    await loadScene();
    if (!disposed) editing.value = true;
  } catch (error) { reportError(error); }
}

async function loadModel(asset: SceneAsset) {
  if (asset.path) {
    if (!workspace) throw new Error("请先打开场景编辑器");
    return loadSceneModel(asset, workspace, controller.signal);
  }
  const model = resolveAssetModel(asset);
  if (model) return (await renderModel(model, controller.signal)).arrayBuffer();
  return downloadAsset(asset, controller.signal);
}

async function loadModels() {
  if (modelsLoading.value) return;
  modelsLoading.value = true;
  try { const models = await ai.getModels(controller.signal); if (!disposed) aiModels.value = models; }
  catch (error) { reportError(error); }
  finally { if (!disposed) modelsLoading.value = false; }
}

type AiCreationInput = Parameters<NonNullable<InstanceType<typeof sceneStudio>["$props"]["generateAi"]>>[0];

// ACT: Agent 对话按节点存在素材目录里（随项目走、随节点删除）；压缩上下文用所选模型做一次不带工具的文本生成。
const conversationPath = `assets/${id}/agentSessions.json`;
const conversationStore = {
  async load(signal: AbortSignal) {
    try { return await files.getWorkspaceFiles().readJson(conversationPath); }
    catch (error) {
      signal.throwIfAborted();
      const response = (error as { response?: { status?: number; data?: { data?: { code?: string } } } }).response;
      if (response?.status === 404 || response?.data?.data?.code === "ENOENT") return null;
      throw error;
    }
  },
  async save(value: unknown) {
    const targetFiles = files.getWorkspaceFiles();
    if (!conversationDirectoryReady) {
      for (const directory of ["assets", `assets/${id}`]) {
        await targetFiles.mkdir(directory).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
          if (error.response?.data?.data?.code !== "EEXIST") throw error;
        });
      }
      conversationDirectoryReady = true;
    }
    await targetFiles.writeJson(conversationPath, value);
  },
};
let conversationDirectoryReady = false;
/** 输入框 / 菜单：当前项目可用的技能（和宿主画布 Agent 的技能菜单同一份）。 */
async function listSkills(signal: AbortSignal) {
  const { directory } = await files.getWorkspaceFiles().list();
  return listHostSkills(directory, signal);
}
async function generateText(input: { modelKey: string; systemPrompt: string; prompt: string; signal: AbortSignal }) {
  const selectedModel = aiModels.value.find(model => JSON.stringify([model.providerId, model.modelId]) === input.modelKey);
  if (!selectedModel) throw new Error("请先选择已配置的 Toonflow 文本模型");
  const signal = AbortSignal.any([input.signal, controller.signal, AbortSignal.timeout(120000)]);
  const result = await ai.generate({ providerId: selectedModel.providerId, modelId: selectedModel.modelId, systemPrompt: input.systemPrompt, prompt: input.prompt, signal });
  signal.throwIfAborted();
  return result.text;
}

type WorldContext = { files: WorkspaceFiles; persistence: NodePersistenceContext; directory: string };
/** 已接受的场景（内存里那份，已校验；文档按快照替换，读取方不要原地改）。先 await loadScene()。 */
function currentScene() {
  if (!sceneLoaded) throw new Error("场景还没载入完，请稍后重试");
  return currentDocument.value;
}
function canSnapshotRuntime() { return !agentRunning && (!publicDraft || !sceneLoaded || publicDraft.signature !== sceneSignature(currentScene())); }
function sceneSignature(scene: SceneDocument) { const { view, ...content } = scene; return JSON.stringify(content); }
async function getWorldContext(signal: AbortSignal): Promise<WorldContext> {
  signal.throwIfAborted();
  const targetFiles = files.getWorkspaceFiles();
  const targetPersistence = getPersistence?.();
  if (!targetPersistence) throw new Error("当前画布未提供保存能力");
  const { directory } = await targetFiles.list();
  signal.throwIfAborted();
  controller.signal.throwIfAborted();
  return { files: targetFiles, persistence: targetPersistence, directory };
}
async function loadSceneModel(asset: SceneAsset, targetFiles: WorkspaceFiles, signal: AbortSignal) {
  signal.throwIfAborted();
  const model = !asset.path ? resolveAssetModel(asset) : undefined;
  const content = asset.path ? await targetFiles.read(asset.path)
    : model ? await (await renderModel(model, signal)).arrayBuffer() : await downloadAsset(asset, signal);
  signal.throwIfAborted();
  validateModel(content);
  if (asset.sha256 && await sha256(content) !== asset.sha256) throw new Error("模型文件与已登记的 SHA256 不一致");
  if (asset.kiln && await sha256(content) !== asset.kiln.glbSha256) throw new Error("Kiln GLB与已登记的交付哈希不一致");
  return content;
}
async function sha256(content: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", content)), value => value.toString(16).padStart(2, "0")).join("");
}
async function validateWorldAsset(asset: SceneAsset, targetFiles: WorkspaceFiles, signal: AbortSignal) {
  if (!asset.path) throw new Error("生成资产缺少真实GLB路径");
  const content = await targetFiles.read(asset.path);
  signal.throwIfAborted();
  validateModel(content);
  if (asset.bytes !== undefined && asset.bytes !== content.byteLength) throw new Error("Kiln交付的GLB大小与实际文件不一致");
  if (asset.kiln) {
    if (await sha256(content) !== asset.kiln.glbSha256) throw new Error("Kiln GLB与已审阅的模型内容不一致");
    const source = await targetFiles.read(asset.kiln.sourcePath);
    signal.throwIfAborted();
    if (!source.byteLength || source.byteLength > 1024 * 1024) throw new Error("Kiln源码为空或超过1 MB");
    const hash = await sha256(source);
    if (hash !== asset.kiln.revisionId) throw new Error("Kiln源码与交付修订不一致");
    const receiptBytes = await targetFiles.read(asset.kiln.deliveryPath);
    signal.throwIfAborted();
    if (receiptBytes.byteLength > 16384) throw new Error("Kiln交付记录超过大小限制");
    const receipt = JSON.parse(new TextDecoder().decode(receiptBytes));
    if (receipt?.path !== asset.path || receipt?.bytes !== content.byteLength || receipt?.kiln?.programId !== asset.kiln.programId
      || receipt?.kiln?.revisionId !== asset.kiln.revisionId || receipt?.kiln?.sourcePath !== asset.kiln.sourcePath || receipt?.kiln?.glbSha256 !== asset.kiln.glbSha256) {
      throw new Error("Kiln交付记录与模型、源码修订不匹配");
    }
  }
}
function makeWorldDraft(scene: SceneDocument, assets: SceneAsset[], context: WorldContext, mode: "scene" | "model", selectedId?: string, publishObservation = false, anchor?: SceneAnchor, feedback?: AiCreationInput, toolset: "stage" | "full" = "full", capsule = false) {
  const observedFiles = new Map<string, string>();
  const observerSignal = feedback?.signal ? AbortSignal.any([feedback.signal, controller.signal]) : controller.signal;
  let observedDocument = scene;
  let recoveryDocument = scene;
  // ACT: 一轮里同一个模型文件只读一次、只算一次哈希（预演一轮要跑几次，GLB多的场景原来每次都重读重算）；
  // 返回同一个缓冲区，预演据此复用解析好的模型。文件中途被改由交付前的 validateObservedAssets 拦下。
  const loadedModels = new Map<string, Promise<ArrayBuffer>>();
  function loadEvidenceModel(asset: SceneAsset, signal: AbortSignal = observerSignal) {
    const key = asset.path ? "path:" + asset.path : asset.url ? "url:" + asset.url : "";
    if (!key) return loadSceneModel(asset, context.files, signal);
    let pending = loadedModels.get(key);
    if (!pending) {
      pending = (async () => {
        const content = await loadSceneModel(asset, context.files, signal);
        if (asset.path) {
          const hash = await sha256(content);
          if (observedFiles.has(asset.path) && observedFiles.get(asset.path) !== hash) throw new Error("读取期间模型文件已变化，请重新规划和观察");
          observedFiles.set(asset.path, hash);
        }
        return content;
      })();
      loadedModels.set(key, pending);
      pending.catch(() => loadedModels.delete(key));
    }
    return pending;
  }
  const observer = createSceneObserver(asset => loadEvidenceModel(asset), observerSignal);
  async function validateLoadedFiles(value: SceneDocument, signal: AbortSignal) {
    const paths = new Set(value.objects.flatMap(object => object.asset.path ? [object.asset.path] : []));
    for (const [path, hash] of observedFiles) {
      signal.throwIfAborted();
      if (paths.has(path) && await sha256(await context.files.read(path)) !== hash) throw new Error("读取后的模型文件已变化，必须重新规划与观察提案");
    }
    signal.throwIfAborted();
  }
  let draft: ReturnType<typeof createHolodeckDraft>;
  try { draft = createHolodeckDraft({
    // 导演工具用视口里已载入的真实模型（含导入的GLB）量占地、找座面、查视线。
    stageGeometry: () => editor.value?.stageProbe?.(),
    document: scene, assets, mode, toolset, capsule, performanceOnly: feedback?.performanceOnly, lifeGroupId: feedback?.lifeGroupId, performanceClipId: feedback?.performanceClipId, selectedId, anchor: snapshotSceneAnchor(anchor, scene),
    onPreviewDocument: value => { recoveryDocument = value; feedback?.onPreviewDocument(value); },
    // 预演前后不再各重读重算一遍全部模型文件（一轮要预演好几次）；交付前统一核对一次（validateObservedAssets）。
    rehearse: (value, parameters, signal) => rehearsePerformance(value, loadEvidenceModel, { ...parameters, signal: signal ? AbortSignal.any([signal, observerSignal]) : observerSignal, terrainObstacles: feedback?.terrainObstacles }),
    validateAsset: (asset, signal) => validateWorldAsset(asset, context.files, signal ? AbortSignal.any([signal, controller.signal]) : controller.signal),
    inspect: async (value, signal) => {
      const operationSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
      await validateLoadedFiles(value, operationSignal);
      return observer.inspect(value, operationSignal);
    },
    observe: async (value, signal) => {
      const operationSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
      observedDocument = value;
      await validateLoadedFiles(value, operationSignal);
      const observation = await observer.observe(value, operationSignal);
      if (!publishObservation) return observation;
      const frames: { path: string; mimeType: string }[] = [];
      for (const part of observation.content) if (part.type === "image") {
        const content = Uint8Array.from(atob(part.data), char => char.charCodeAt(0));
        const path = await uploadNodeFile(context.files, id, new File([content], "world.jpg", { type: part.mimeType }));
        operationSignal.throwIfAborted();
        frames.push({ path, mimeType: part.mimeType });
      }
      return { ...observation, details: { viewport: observation.details, frames } };
    },
  }); } catch (error) { observer.dispose(); throw error; }
  return Object.assign(draft, {
    dispose: () => observer.dispose(),
    validateObservedAssets: (signal: AbortSignal, value = observedDocument) => validateLoadedFiles(value, signal),
    async validatePreparedDocument(value: SceneDocument, signal: AbortSignal) {
      await validateLoadedFiles(value, signal);
      if (JSON.stringify(value) !== JSON.stringify(observedDocument)) await observer.observe(value, signal);
      await validateLoadedFiles(value, signal);
      observedDocument = value;
    },
    async saveRecovery(signal: AbortSignal) {
      const path = await saveWorldRevision(recoveryDocument, context, signal);
      signal.throwIfAborted();
      if (!disposed) data.value.trumanMapRecovery = { path, createdAt: Date.now() };
      return path;
    },
  });
}
async function prepareDocument(scene: SceneDocument, targetFiles: WorkspaceFiles, signal: AbortSignal) {
  const prepared = new Map<string, SceneAsset>();
  for (const object of scene.objects) {
    const asset = object.asset;
    if (prepared.has(asset.id)) { object.asset = prepared.get(asset.id)!; continue; }
    if (asset.kiln) await validateWorldAsset(asset, targetFiles, signal);
    const model = !asset.path ? resolveAssetModel(asset) : undefined;
    if (model) {
      const file = await renderModel(model, signal);
      signal.throwIfAborted();
      const path = await uploadNodeFile(targetFiles, id, file);
      object.asset = { ...asset, path, normalize: false, bytes: file.size };
    } else if (asset.url) {
      const existing = currentScene().objects.find(item => item.asset.id === asset.id && item.asset.path)?.asset;
      if (existing) object.asset = { ...existing };
      else {
        const content = await downloadAsset(asset, signal);
        signal.throwIfAborted();
        const path = await uploadNodeFile(targetFiles, id, new File([content], "model.glb", { type: "model/gltf-binary" }));
        const { url: _url, ...stored } = asset;
        object.asset = { ...stored, path };
      }
    }
    prepared.set(asset.id, object.asset);
    signal.throwIfAborted();
    controller.signal.throwIfAborted();
  }
  return parseSceneDocument(scene);
}
async function saveWorldRevision(scene: SceneDocument, context: WorldContext, signal: AbortSignal) {
  signal.throwIfAborted();
  const path = await uploadNodeFile(context.files, id, new File([JSON.stringify(scene)], "world.json", { type: "application/json" }));
  signal.throwIfAborted();
  return path;
}
async function generateAi(input: AiCreationInput) {
  if (agentRunning || publicBusy) throw new Error("当前世界已有Agent任务，请等待或停止后重试");
  const selectedModel = aiModels.value.find(model => JSON.stringify([model.providerId, model.modelId]) === input.modelKey);
  if (!selectedModel) throw new Error("请先选择已配置的 Toonflow 文本模型");
  const images: NonNullable<AiCreationInput["images"]> = [];
  function imageLabels(attachments?: AiCreationInput["images"]) {
    return attachments?.length ? `\n附图：${attachments.map(image => { images.push(image); return `图片 ${images.length}（${JSON.stringify(image.name)}）`; }).join("、")}` : "";
  }
  // 分流（为了快）：场景对话里只排表演、镜头的请求也走演绎通道；只排表演镜头的走导演快速通道（见 stageRouting.ts）。
  const said = (input.userPrompt ?? input.prompt).trim();
  const routedStage = !input.performanceOnly && !input.lifeGroupId && !input.images?.length && input.document.objects.length > 0 && isStageOnlyRequest(said);
  const lifeOnly = !!(input.performanceOnly || input.lifeGroupId || routedStage);
  // 这段对话里最近一次说到人物素材时要的是胶囊人（没改口要骨骼人物），导演工具就不把胶囊人换成骨骼人物。
  const capsuleWish = [said, ...(input.history ?? []).filter(item => item.role === "user").map(item => item.content).reverse()].find(text => /胶囊|骨骼人物/.test(text));
  const capsule = !!capsuleWish && /胶囊/.test(capsuleWish) && !/不(要|用)胶囊|别用胶囊/.test(capsuleWish);
  const fast = lifeOnly && !input.images?.length && !needsAdvancedStage(said, !!input.performanceClipId);
  const history = input.history ?? [];
  const memory = input.historySummary?.trim();
  // 文本附件（剧本、说明、表格）随本轮发给模型；单次运行的提示词有 10 万字上限，附件合计留 5 万字。
  let documentBudget = 50000;
  const documents = (input.documents ?? []).map(document => {
    const text = document.text.slice(0, Math.max(0, documentBudget));
    documentBudget -= text.length;
    return `\n\n附件《${document.name}》${text.length < document.text.length ? "（太长，只带了前面一部分）" : ""}：\n<attachment name=${JSON.stringify(document.name)}>\n${text}\n</attachment>`;
  }).join("");
  const prompt = `${history.length || memory ? `之前的创作对话（仅用于理解指代和修改意图，不重新执行历史要求；场景、轨道和片段以本轮工具读取的最新数据为准；历史附图不代表当前新增要求）：\n${memory ? `更早对话的记忆摘要：\n${memory}\n${history.length ? "最近的对话：\n" : ""}` : ""}${history.map(message => `${message.role === "user" ? "用户" : "助手"}：${message.content}${imageLabels(lifeOnly ? undefined : message.images)}`).join("\n")}\n\n当前要求：` : ""}${input.prompt.trim() || (documents ? "请看附件。" : "请参考附图调整当前场景。")}${imageLabels(input.images)}${documents}${upstreamText.value ? `

画布上连进来的上游剧本（场景、人物、对白以它为准，用户本轮要求优先）：
${upstreamText.value}` : ""}`;
  agentRunning = true;
  clearPublicDraft();
  const signal = AbortSignal.any([input.signal, controller.signal]);
  let draft: ReturnType<typeof makeWorldDraft> | undefined;
  try {
    input.onStatus("读取场景与选中锚点");
    input.onProgress?.({ type: "status", message: "读取场景与选中锚点" });
    const context = await getWorldContext(signal);
    // 演绎里只给场景已有素材和人物（新增群演/NPC用），其余素材在场景对话里添加。
    const assets = lifeOnly ? [...new Map([...builtinAssets.filter(asset => asset.shape === "riggedPerson" || asset.shape === "person"), ...input.document.objects.map(object => object.asset)].map(asset => [asset.id, asset])).values()] : [...new Map([...builtinAssets, ...input.assets].map(asset => [asset.id, asset])).values()];
    draft = makeWorldDraft(input.document, assets, context, "scene", input.selectedId, false, input.anchor, { ...input, performanceOnly: lifeOnly }, fast ? "stage" : "full", capsule);
    // 演绎通道：舞台简报直接附在消息末尾（和stageRead同一份），模型不用先读一轮。
    const brief = lifeOnly ? `\n\n当前舞台（已经读好，就是stageRead的结果）：\n${JSON.stringify(draft.stageBrief())}` : "";
    // 快速通道的活都由导演工具算，不需要长时间思考：用户没手动选思考强度时用“低”（模型支持才用），一次往返快很多；手动选了就照用户的。
    const reasoningLevels = (selectedModel as { reasoningLevels?: ThinkingLevel[] }).reasoningLevels;
    const thinkingLevel = input.thinkingLevel ?? (fast ? (["low", "minimal", "off"] as const).find(level => reasoningLevels?.includes(level)) : undefined);
    // 和宿主画布 Agent 对齐：接上宿主启用的工具插件（快速通道只接提问器，保持往返轻），带上 AGENTS.md、全局记忆和回复风格，/skill: 点名的技能正文。
    const [hostToolNames, hostContext] = await Promise.all([
      readHostToolNames(signal).catch(() => [] as string[]),
      hostAgentContext(context.directory, path => context.files.readText(path), signal),
    ]);
    const hostTools = fast ? hostToolNames.filter(name => name === "askUser") : hostToolNames;
    const skillNote = input.skill ? await skillInstruction(input.skill, hostTools.includes("skillOperator"), signal) : "";
    const systemPrompt = [createHolodeckPrompt("scene", input.lifeGroupId, lifeOnly, { fast, briefAttached: lifeOnly }), fast ? "" : hostReplyStyle, hostContext].filter(Boolean).join("\n\n");
    const result = await runHolodeckAgent({
      directory: context.directory, providerId: selectedModel.providerId, modelId: selectedModel.modelId, thinkingLevel, reasoningLevels,
      prompt: (skillNote ? `${skillNote}\n\n` : "") + prompt + brief, request: said, images,
      systemPrompt, tools: draft.agentTools, hostTools, takeSteering: input.takeSteering, lifeGroupId: input.lifeGroupId, performanceOnly: lifeOnly, signal, onStatus: input.onStatus, onProgress: input.onProgress,
    });
    try {
      signal.throwIfAborted();
      if (!draft.changed) {
        return { document: input.document, summary: [result.text.trim() || "本轮未修改场景或演绎。", result.incomplete].filter(Boolean).join("\n"), changed: false };
      }
      input.onStatus(lifeOnly ? "保存演绎动线" : "校验交付并保存场景修订");
      input.onProgress?.({ type: "status", message: lifeOnly ? "保存演绎动线" : "校验交付并保存场景修订" });
      await draft.finalize(signal);
      const proposal = lifeOnly ? draft.getResult() : await prepareDocument(draft.getResult(), context.files, signal);
      if (!lifeOnly) await draft.validatePreparedDocument(proposal, signal);
      // 生成期间用户可以继续编辑：提案按开工时的底稿交回，编辑器做三方合并（sceneMerge.ts），这里不再因场景变了就作废。
      await saveWorldRevision(input.document, context, signal);
      await draft.validateObservedAssets(signal, proposal);
      const summary = result.text.trim().slice(0, lifeOnly ? 1500 : 3000);
      const rehearsal = lifeOnly ? draft.getRehearsalSummary() : undefined;
      return { document: proposal, summary: [summary, rehearsal, draft.autoCoverageNote, result.incomplete].filter(Boolean).join("\n") || (lifeOnly ? "已安排个体动线与关键事件，可直接在场景中调整。" : "已完成场景修订及真实视口核验"), changed: true };
    } finally { await result.closing; }
  } catch (error) {
    if (!lifeOnly && !signal.aborted && draft?.changed) {
      let recoveryPath = "";
      let recoveryError = "";
      try { recoveryPath = await draft.saveRecovery(signal); }
      catch (failure) { recoveryError = failure instanceof Error ? failure.message : "无法保存草稿备份"; }
      signal.throwIfAborted();
      const message = error instanceof Error ? error.message : "生成未能完成";
      throw new Error(`${message}\n${recoveryPath ? `未采用的生成草稿已保留：${recoveryPath}` : `生成草稿备份失败：${recoveryError}`}`, { cause: error });
    }
    throw error;
  } finally { draft?.dispose(); agentRunning = false; }
}

async function getPublicDraft(signal: AbortSignal, anchor?: SceneAnchor) {
  if (publicDraft) {
    if (publicDraft.signature !== sceneSignature(currentScene())) { clearPublicDraft(); throw new Error("接受态已变化，请重新调用worldBegin创建本轮草稿"); }
    return publicDraft;
  }
  const context = await getWorldContext(signal);
  editor.value?.flushView();
  await nextTick();
  signal.throwIfAborted();
  const base = currentScene();
  const assets = [...builtinAssets, ...base.objects.map(object => object.asset)];
  publicDraft = { draft: makeWorldDraft(base, assets, context, "scene", undefined, true, anchor), context, base, signature: sceneSignature(base) };
  return publicDraft;
}
async function runPublic<T>(operation: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal) {
  if (saving.value || agentRunning || publicBusy) throw new Error("场景正在保存或执行另一项Agent操作");
  publicBusy = true;
  const operationSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  try {
    await loadScene();
    operationSignal.throwIfAborted();
    return await operation(operationSignal);
  }
  catch (error) { if (operationSignal.aborted) clearPublicDraft(); throw error; }
  finally { publicBusy = false; }
}
nodeTools.register({
  name: "worldBegin", description: "从当前已接受场景创建Holodeck私有草稿，返回完整协议、世界工具参数及Kiln服务端工具入口。不会修改场景；重新调用会放弃上个未采用草稿。必须先worldRead读取状态。",
  parameters: z.strictObject({ anchor: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("point"), position: z.strictObject({ x: z.number().finite().min(-10000).max(10000), y: z.number().finite().min(-10000).max(10000), z: z.number().finite().min(-10000).max(10000) }) }),
    z.strictObject({ kind: z.literal("object"), objectId: z.string().min(1).max(160), position: z.strictObject({ x: z.number().finite().min(-10000).max(10000), y: z.number().finite().min(-10000).max(10000), z: z.number().finite().min(-10000).max(10000) }) }),
  ]).optional() }),
  execute(args, { signal }) {
    return runPublic(async signal => {
      clearPublicDraft();
      const anchor = snapshotSceneAnchor(args.anchor, currentScene());
      const current = await getPublicDraft(signal, anchor);
      return { baseRevision: current.draft.baseRevision, directory: current.context.directory, catalogWarning: current.catalogWarning, protocol: createHolodeckPrompt("scene"),
        serverTools: { plugin: "trumanMap", names: ["kilnPrepare", "kilnTool", "kilnExport"] },
        worldTools: current.draft.tools.map(({ name, description, parameters }) => ({ name, description, parameters })),
        next: "通过nodeTools调用worldRead；局部操作通过worldTool按worldTools中的精确schema执行。最终worldPropose→worldObserve→读取返回观察图片→worldCheck→worldApply。只排表演和镜头时stageRead→stageAct/stageShots→worldApply即可。界面上的操作（截图、播放、导出分镜/预演视频/镜头表、撤销、交给内置Agent）用editor*函数。不要直接写画布JSON。" };
    }, signal);
  },
});
// batch只给自带Agent用（外部宿主自己就能在一条回复里并行调用多个工具）。
for (const [name, schema] of Object.entries(holodeckSchemas)) if (name !== "batch") nodeTools.register({
  name, description: `Holodeck ${name}：对当前节点私有草稿执行世界协议。先worldBegin读取操作规则，worldObserve/worldSubmit返回真实图片的工作区路径，须用工作区读取工具实际查看。操作不会自动应用到接受态。`,
  parameters: schema,
  execute(args, { signal }) {
    return runPublic(async signal => {
      const current = await getPublicDraft(signal);
      const tool = current.draft.tools.find(tool => tool.name === name)!;
      const result = await tool.execute(args as Record<string, unknown>, signal);
      if (name === "worldSubmit") {
        // 外部宿主收不了内联图片：和worldObserve一样只回工作区图片路径；本修订已观察过时没有新截图。
        const submitted = result as { details: { viewport?: { frames?: { path: string; mimeType: string }[] } } };
        return { ...submitted.details, frames: submitted.details.viewport?.frames ?? [], next: "使用工作区read工具实际读取frames图片后再worldApply。图片证明真实加载，不自动代表视觉质量批准。" };
      }
      if (name !== "worldObserve") return result;
      const observation = result as { details: { viewport: { frames: { path: string; mimeType: string }[] } } };
      return { observation: observation.details, frames: observation.details.viewport.frames, next: "使用工作区read工具实际读取frames图片后，再worldCheck。图片证明真实加载，不自动代表视觉质量批准。" };
    }, signal);
  },
});
nodeTools.register({
  name: "worldApply", description: "采用Holodeck草稿：本修订还没走完的worldPropose→worldObserve→worldCheck按当前草稿自动补齐（stageAct排了表演却没有镜头时自动分镜，和内置Agent一致），所以stageAct/stageShots后可直接worldApply。校验接受态未变化，保留上一版快照，保存当前画布。保存失败保留内存模型并报告未确认保存，主动取消才恢复旧场景；不删除素材。",
  parameters: z.strictObject({ baseRevision: z.string().min(1).max(160) }),
  execute(args, { signal }) {
    return runPublic(async signal => {
      const current = await getPublicDraft(signal);
      if (args.baseRevision !== current.draft.baseRevision) throw new Error("世界提案baseRevision已失效");
      await current.draft.finalize(signal);
      const proposal = await prepareDocument(current.draft.getResult(), current.context.files, signal);
      await current.draft.validatePreparedDocument(proposal, signal);
      if (current.signature !== sceneSignature(currentScene())) throw new Error("接受态已变化，提案未采用");
      const previousRevision = await saveWorldRevision(current.base, current.context, signal);
      await current.draft.validateObservedAssets(signal);
      if (current.signature !== sceneSignature(currentScene())) throw new Error("保存修订期间接受态已变化，提案未采用");
      const latest = currentScene();
      if (JSON.stringify(proposal.view) === JSON.stringify(current.base.view)) proposal.view = latest.view;
      signal.throwIfAborted();
      saving.value = true;
      try {
        document.value = proposal;
        await nextTick();
        // ACT: 开始提交后等待真实保存完成，不用取消竞态提前宣称没有落盘；随后取消则补偿恢复旧版。
        await current.context.persistence.save();
        signal.throwIfAborted();
        clearPublicDraft();
        statusMessage.value = "Holodeck场景已采用并保存";
        return { applied: true, previousRevision, objects: proposal.objects.length };
      } catch (error) {
        if (sceneSignature(currentScene()) !== sceneSignature(proposal)) {
          clearPublicDraft();
          throw new Error(`提交未确认，场景已被其他操作修改；未覆盖该修改。上一版快照：${previousRevision}`);
        }
        if (!signal.aborted) {
          let recovery = "";
          try { recovery = `生成草稿快照：${await current.draft.saveRecovery(signal)}`; }
          catch (failure) { recovery = `生成草稿快照保存失败：${failure instanceof Error ? failure.message : "无法写入"}`; }
          if (sceneSignature(currentScene()) !== sceneSignature(proposal)) {
            clearPublicDraft();
            throw new Error(`保存期间场景已被其他操作修改，未覆盖该修改。${recovery}。上一版快照：${previousRevision}`);
          }
          if (!signal.aborted) {
            clearPublicDraft();
            statusMessage.value = "模型已保留，场景保存未确认，请重试保存";
            throw new Error(`${error instanceof Error ? error.message : "场景保存未确认"}；生成模型已保留在当前场景，请使用画布保存重试。${recovery}。上一版快照：${previousRevision}`, { cause: error });
          }
        }
        clearPublicDraft();
        document.value = latest;
        await nextTick();
        try { await current.context.persistence.save(); }
        catch { throw new Error(`场景已在内存恢复，磁盘保存状态无法确认。上一版快照：${previousRevision}；请重新打开画布核对后再操作。`); }
        throw new Error(`${error instanceof Error ? error.message : "采用失败"}；已恢复并保存采用前的场景。上一版快照：${previousRevision}`);
      } finally { saving.value = false; }
    }, signal);
  },
});

nodeTools.register({
  name: "worldTool", description: "执行worldBegin返回的局部世界工具，name/args须按worldTools中原始参数契约填写。支持查询资产、读取和修改地形地貌/局部水体、批量散布独立物件、创建画笔墙路、修改物体、独立时间和混合天气；所有变更仍只作用于私有草稿，不能绕过propose/observe/check/apply。",
  parameters: z.strictObject({ name: z.enum(sceneToolNames), args: z.record(z.string(), z.json()) }),
  execute(args, { signal }) {
    return runPublic(async signal => {
      const current = await getPublicDraft(signal);
      return current.draft.tools.find(tool => tool.name === args.name)!.execute(args.args, signal);
    }, signal);
  },
});
// ACT: 编辑器界面的全部操作也挂到 nodeTools（清单见 editorEvents.ts），画布上的外部总Agent能像用户一样操控编辑器：
// 编辑器没开就先打开；读好工作区文件（导入的GLB、对话附图）交给编辑器，编辑器交回的截图、镜头表存进工作区换成路径。
// 宿主每次调用最多等120秒：超过100秒的操作（导出视频、内置Agent回复）先返回jobId，后台照常做完，用 editorWait 取结果。
type HostJob = { id: string; event: EditorEventName; startedAt: number; done: boolean; promise: Promise<void>; result?: unknown; error?: unknown };
const hostJobs = new Map<string, HostJob>();
const hostWaitMs = 100000;
const imageTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function ensureEditor() {
  for (let tries = 0; closing.value && tries < 100; tries++) await wait(100);
  if (!editing.value) {
    await openEditor();
    if (!editing.value) throw new Error(errorMessage.value || "无法打开场景编辑器");
  }
  for (let tries = 0; !editor.value; tries++) {
    if (tries > 400 || !editing.value) throw new Error("场景编辑器没能打开");
    await wait(50);
  }
  await editor.value.hostReady();
  if (!editor.value || !editing.value) throw new Error("场景编辑器已关闭");
  return editor.value;
}
async function readWorkspaceFile(path: string, type?: string) {
  const clean = path.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!clean || /^[a-z]:|^\//i.test(clean) || clean.split("/").some(part => !part || part === "." || part === "..")) throw new Error(`工作区路径不合法：${path}`);
  const mime = type ?? imageTypes[clean.split(".").pop()?.toLowerCase() ?? ""];
  if (!mime) throw new Error(`不支持的图片格式：${path}（只收 png/jpg/webp/gif）`);
  const content = await files.getWorkspaceFiles().read(clean).catch((error: { response?: { status?: number; data?: { data?: { code?: string } } } }) => {
    if (error.response?.status === 404 || error.response?.data?.data?.code === "ENOENT") throw new Error(`工作区里没有“${clean}”，路径相对于工作区根目录`);
    throw error;
  });
  controller.signal.throwIfAborted();
  return new File([content], clean.split("/").pop()!, { type: mime });
}
async function storeHostFiles(result: unknown) {
  const value = result as { files?: StudioEventFile[] } | undefined;
  if (!value?.files?.length) return result;
  const targetFiles = files.getWorkspaceFiles();
  const stored: { label: string; path: string; mimeType: string; bytes: number }[] = [];
  for (const item of value.files) {
    stored.push({ label: item.label, path: await uploadNodeFile(targetFiles, id, item.file), mimeType: item.file.type, bytes: item.file.size });
    controller.signal.throwIfAborted();
  }
  return { ...value, files: stored, next: "用工作区读文件工具实际查看files里的文件" };
}
function hostJobList() {
  return [...hostJobs.values()].filter(job => !job.done && job.event !== "editorState").map(job => ({ jobId: job.id, event: job.event, seconds: Math.round((Date.now() - job.startedAt) / 1000) }));
}
function startHostJob(event: EditorEventName, run: () => Promise<unknown>) {
  const job: HostJob = { id: crypto.randomUUID().slice(0, 8), event, startedAt: Date.now(), done: false, promise: Promise.resolve() };
  job.promise = run().then(value => { job.result = value; }, error => { job.error = error; }).finally(() => { job.done = true; });
  hostJobs.set(job.id, job);
  for (const [key, old] of hostJobs) if (hostJobs.size > 20 && old.done) hostJobs.delete(key);
  return job;
}
async function awaitHostJob(job: HostJob, signal?: AbortSignal, ms = hostWaitMs) {
  if (!job.done) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop: (() => void) | undefined;
    // 调用方的取消或超时只停止等待，不打断后台任务（停内置Agent用editorAgentStop，关编辑器会停下全部）。
    await Promise.race([job.promise, new Promise<void>(resolve => { stop = () => resolve(); timer = setTimeout(stop, ms); signal?.addEventListener("abort", stop, { once: true }); })]);
    clearTimeout(timer);
    if (stop) signal?.removeEventListener("abort", stop);
  }
  if (!job.done) return { running: true, jobId: job.id, event: job.event, seconds: Math.round((Date.now() - job.startedAt) / 1000), ...editor.value?.hostStatus(), next: `还在进行：用editorWait({jobId:"${job.id}"})接着等，editorState看进度` };
  hostJobs.delete(job.id);
  if (job.error !== undefined) throw job.error;
  return job.result ?? { done: true };
}
async function runEditorEvent(name: EditorEventName, args: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
  if (name === "editorWait") {
    const { jobId, seconds } = args as EditorEventArgs<"editorWait">;
    const job = jobId ? hostJobs.get(jobId) : [...hostJobs.values()].find(item => item.event !== "editorState");
    if (!job) throw new Error(jobId ? `没有后台任务${jobId}（可能已经取回过结果）` : "没有进行中的后台任务");
    return awaitHostJob(job, signal, (seconds ?? 100) * 1000);
  }
  if (name === "editorState" && !editing.value) {
    await loadScene();
    return { open: false, ...summarizeScene(currentScene(), args as EditorEventArgs<"editorState">), jobs: hostJobList(), hint: "编辑器没打开：其余editor*函数会自动打开它（也可先editorOpen）" };
  }
  if (name === "editorSave") {
    if (editing.value) {
      if (!await saveScene()) throw new Error(errorMessage.value || "场景保存失败");
      return { saved: true };
    }
    const target = getPersistence?.();
    if (!target) throw new Error("当前画布未提供保存能力");
    await target.save(controller.signal);
    return { saved: true };
  }
  if (name === "editorExport") {
    // 画布缺图片/视频节点插件时先报，别等整段渲染完才发现建不了节点。
    const { items, to } = args as EditorEventArgs<"editorExport">;
    if (to !== "files") exportCanvas.check({ image: items.some(item => item === "overview" || item === "frames" || item === "views"), video: items.some(item => item === "clips" || item === "previs") });
  }
  if (name === "editorClose") {
    if (!editing.value) return { closed: true, note: "编辑器本来就没打开" };
    editor.value?.hostClose();
    if (editing.value) closeEditor();
    await nextTick();
    while (sceneSave) { await sceneSave; await nextTick(); }
    return { closed: true, saved: !errorMessage.value, ...(errorMessage.value ? { error: errorMessage.value } : {}) };
  }
  return awaitHostJob(startHostJob(name, async () => {
    const studio = await ensureEditor();
    if (name === "editorOpen") return { open: true, ...await studio.runHostEvent("editorState", { objects: false }) };
    const input = { ...args } as StudioEventInput<StudioEventName>;
    if (name === "editorImportModel") input.file = await readWorkspaceFile(String(args.path), "model/gltf-binary");
    if (name === "editorAgentChat" && Array.isArray(args.images)) input.files = await Promise.all(args.images.map(path => readWorkspaceFile(String(path))));
    // 文本附件按扩展名交给编辑器的附件入口（和对话框里拖进来的一样处理）。
    if (name === "editorAgentChat" && Array.isArray(args.documents)) input.files = [...input.files ?? [], ...await Promise.all(args.documents.map(path => readWorkspaceFile(String(path), "text/plain")))];
    const result = await studio.runHostEvent(name as StudioEventName, input);
    return storeHostFiles(name === "editorState" ? { open: true, ...result, jobs: hostJobList() } : result);
  }), signal);
}
for (const [name, definition] of Object.entries(editorEvents) as [EditorEventName, (typeof editorEvents)[EditorEventName]][]) nodeTools.register({
  name, description: `【场景编辑器】${definition.description}`, parameters: definition.parameters as z.ZodObject,
  execute: (args, { signal }) => runEditorEvent(name, args as Record<string, unknown>, signal),
});

async function prepareAsset(asset: SceneAsset, signal: AbortSignal): Promise<SceneAsset> {
  if (asset.kind === "primitive" || asset.path) return { ...asset };
  const existing = document.value.objects.find(object => object.asset.id === asset.id && object.asset.path)?.asset;
  if (existing) return { ...existing };
  const targetFiles = workspace;
  if (!targetFiles) throw new Error("请先选择工作目录");
  const model = resolveAssetModel(asset);
  const file = model ? await renderModel(model, signal) : new File([await downloadAsset(asset, signal)], "model.glb", { type: "model/gltf-binary" });
  signal.throwIfAborted();
  controller.signal.throwIfAborted();
  const path = await uploadNodeFile(targetFiles, id, file);
  signal.throwIfAborted();
  controller.signal.throwIfAborted();
  const { url, ...stored } = asset;
  return { ...stored, path, ...(model ? { normalize: false, bytes: file.size } : {}) };
}

async function importModel(file: File, signal: AbortSignal): Promise<SceneAsset> {
  const targetFiles = workspace;
  if (!targetFiles) throw new Error("请先选择工作目录");
  if (!/\.glb$/i.test(file.name) || file.size > 50 * 1024 * 1024) throw new Error("请选择不超过 50 MB 的自包含 GLB 模型");
  const content = await file.arrayBuffer();
  validateModel(content);
  signal.throwIfAborted();
  controller.signal.throwIfAborted();
  const path = await uploadNodeFile(targetFiles, id, new File([content], "model.glb", { type: "model/gltf-binary" }));
  signal.throwIfAborted();
  controller.signal.throwIfAborted();
  return { id: crypto.randomUUID(), name: file.name.replace(/\.glb$/i, "").slice(0, 160) || "模型", category: "本地", kind: "model", path, bytes: content.byteLength };
}

async function saveAi() {
  if (sceneSave) await sceneSave;
  controller.signal.throwIfAborted();
  return saveScene();
}
function saveScene(): Promise<boolean> {
  if (saving.value) return sceneSave ?? Promise.resolve(false);
  saveAfterClose = false;
  saving.value = true;
  errorMessage.value = "";
  sceneSave = (async () => {
    try {
      editor.value?.flushView();
      parseSceneDocument(document.value);
      if (!persistence) throw new Error("当前画布已关闭，请重新打开场景");
      await flushSceneWrite();
      await persistence.save(controller.signal);
      if (!disposed) statusMessage.value = "已保存";
      return true;
    } catch (error) { reportError(error); return false; }
  })().finally(() => { sceneSave = undefined; if (!disposed) saving.value = false; });
  return sceneSave;
}

function closeEditor() {
  if (!editing.value || disposed) return;
  try { editor.value?.flushView(); }
  catch (error) { reportError(error); }
  closing.value = true;
  editing.value = false;
  saveAfterClose = true;
  if (!saving.value) void saveScene();
}

// ACT: 独立项目没有画布可回：关闭后等场景保存落盘才退出；保存失败就重新打开编辑器显示原因（关闭时编辑器已停掉自身操作，不能留用），
// 内存里的场景还在，可以重试保存或再关一次。
async function closeProject() {
  if (!editing.value || disposed) return;
  try { editor.value?.flushView(); }
  catch (error) { reportError(error); }
  closing.value = true;
  editing.value = false;
  if (sceneSave) await sceneSave;
  if (await saveScene()) { project!.close(); return; }
  const message = errorMessage.value;
  for (let tries = 0; closing.value && tries < 100; tries++) await wait(100);
  if (disposed) return;
  await openEditor();
  if (!errorMessage.value) errorMessage.value = message;
}
// 独立项目一挂上就进编辑器；打不开就把原因交给宿主提示并退出。
onMounted(async () => {
  if (!project) return;
  await openEditor();
  if (!editing.value && !disposed) project.close(new Error(errorMessage.value || "无法打开场景编辑器"));
});

watch(saving, value => { if (!value && saveAfterClose && !disposed) void saveScene(); });

// 宿主保存画布、删除节点前都会等这里：把还在防抖里的场景写进文件，写失败就让宿主的保存也报错。
nodeEvent.on("save", async () => {
  if (!saving.value) editor.value?.flushView();
  await flushSceneWrite();
});
// 复制节点：整份场景作为快照随节点走（跨画布、跨项目粘贴也能用），新节点载入时写进它自己的目录。
nodeEvent.on("copy", async () => {
  if (!saving.value) editor.value?.flushView();
  const scene = await loadScene();
  return { trumanMapPath: undefined, trumanMapSnapshot: scene };
});
const upstreamText = ref("");
nodeEvent.on("input:in", (values: { dataType: string | string[]; value: unknown }[]) => {
  upstreamText.value = values.filter(item => item.dataType === "STRING" && typeof item.value === "string" && item.value.trim()).map(item => (item.value as string).trim()).join("\n\n").slice(0, 8000);
});
nodeEvent.on("delete", () => { if (saving.value || agentRunning || publicBusy) throw new Error("场景正在保存或执行Agent任务，请稍后删除节点"); });
onBeforeUnmount(() => {
  disposed = true;
  clearPublicDraft();
  controller.abort();
  if (sceneWriteTimer) flushSceneWrite().catch(error => console.error("TrumanMap 场景写盘失败：", error));
});
</script>

<style scoped lang="scss">
.trumanMapNode {
  width: 320px;
  .sceneCover { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; width: 100%; min-height: 180px; padding: 0; overflow: hidden; border: 0; border-radius: var(--el-border-radius-base); color: var(--el-text-color-secondary); background: var(--el-fill-color-light); cursor: pointer;
    span { font: inherit; font-size: 12px; padding-bottom: 12px; }
    &:hover { background: var(--el-fill-color); color: var(--el-color-primary); }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }
  .nodeError { margin: 8px 0 0; color: var(--el-color-danger); font-size: 12px; }
}
</style>

<style lang="scss">
.trumanMapDialog.el-dialog { display: flex; flex-direction: column; padding: 0; margin: 0; background: var(--el-bg-color);
  > .el-dialog__header { display: none; }
  > .el-dialog__body { flex: 1; height: 100%; min-height: 0; overflow: hidden; padding: 0; }
}
</style>
