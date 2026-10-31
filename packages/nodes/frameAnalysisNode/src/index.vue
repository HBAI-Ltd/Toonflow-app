<template>
  <nodeSkeleton
    v-bind="nodeProps"
    v-model:bottomVisible="node.selected"
    :topVisible="node.selected"
    topWidth="max-content"
    :bottomWidth="660"
    :style="{ width: `${nodeWidth}px` }">
    <template #top>
      <el-card class="mediaToolbar" shadow="never" :bodyStyle="{ padding: '6px', display: 'flex', alignItems: 'center' }">
        <el-button :icon="IconTransfer" text :disabled="busy || connected" @click="fileInput?.click()">替换视频</el-button>
        <el-button :icon="IconMaximize" text :disabled="!player?.ready" @click="player?.enterFullscreen()">全屏</el-button>
        <el-button :icon="IconFileText" text :disabled="!lastResultMatches" @click="openReport">查看结果</el-button>
      </el-card>
    </template>
    <div class="analysisContent">
      <div class="videoArea nodrag nopan nowheel" @pointerdown.stop @dblclick.stop>
        <videoPlayer v-if="previewUrl" ref="player" :src="previewUrl" label="拉片视频" @loadedmetadata="readMetadata" />
        <el-button v-else class="uploadButton" text :loading="uploading" :disabled="busy || connected" @click="fileInput?.click()">
          <icon-upload :size="40" stroke="1.5" aria-hidden="true" />
          <span>{{ connected ? '等待上游视频' : '选择视频' }}</span>
        </el-button>
        <input ref="fileInput" class="fileInput" type="file" accept="video/*,.mkv,.mov,.avi,.m4v,.ts" aria-label="选择视频" :disabled="busy || connected" @change="uploadVideo" />
      </div>
      <div v-if="metadata.width" class="sourceInfo">
        <span>{{ formatDuration(metadata.duration) }}</span>
        <span>{{ metadata.width }} × {{ metadata.height }}</span>
      </div>
      <p v-if="previewFailed" class="statusText">当前格式无法预览，仍可尝试本地处理</p>
      <div v-if="processing" class="progressArea" role="status" aria-live="polite">
        <el-progress :percentage="progress" :strokeWidth="4" :showText="false" />
        <p class="statusText">{{ cancelling ? '正在取消…' : progressLabel }} · {{ progress }}%</p>
      </div>
      <div v-else-if="lastResultMatches" class="resultSummary">
        <span>{{ lastResult!.scenes.length }} 个镜头<span v-if="lastResult!.audio"> · 原音轨</span></span>
      </div>
      <p v-if="errorMessage" class="errorMessage nodrag nopan nowheel" role="alert">{{ errorMessage }}</p>
      <p v-else-if="lastResultMatches && lastResult?.ai?.overviewError" class="warningMessage">逐镜头分析已保存，整段归纳未完成：{{ lastResult.ai.overviewError }}</p>
      <p v-else-if="lastResultMatches && lastResult?.warning" class="warningMessage">{{ lastResult.warning }}</p>
    </div>
    <template #bottom>
      <el-card class="promptCard nodrag nopan nowheel" shadow="never" :bodyStyle="{ padding: '14px 16px 12px' }" @pointerdown.stop @dblclick.stop>
        <div class="promptHeader">
          <div class="dimensionOptions">
            <el-checkbox v-model="settings.frames" :disabled="busy" title="每个镜头提取一张关键帧"><icon-photo :size="15" />分镜</el-checkbox>
            <el-checkbox v-model="settings.clips" :disabled="busy" title="按镜头边界切割视频片段"><icon-movie :size="15" />动态</el-checkbox>
            <el-checkbox v-model="settings.audio" :disabled="busy" title="保留完整原声，包含人声、音乐和环境声"><icon-wave-sine :size="15" />原音轨</el-checkbox>
          </div>
          <el-popover placement="top-end" :width="300" trigger="click">
            <template #reference><el-button :icon="IconAdjustmentsHorizontal" text size="small">检测设置</el-button></template>
            <div class="settingsFields nodrag nopan nowheel" @pointerdown.stop @dblclick.stop>
              <label class="settingRow"><span>检测算法</span><el-select v-model="settings.method" :disabled="busy" aria-label="检测算法"><el-option value="adaptive" label="自适应变化" /><el-option value="content" label="固定变化阈值" /></el-select></label>
              <label class="settingRow"><span>切镜阈值</span><el-input-number v-model="settings.threshold" :min="0.1" :max="255" :step="settings.method === 'adaptive' ? 0.1 : 1" controlsPosition="right" :disabled="busy" aria-label="切镜阈值" /></label>
              <label class="settingRow"><span>最短镜头（秒）</span><el-input-number v-model="settings.minSceneSeconds" :min="0" :max="60" :step="0.1" controlsPosition="right" :disabled="busy" aria-label="最短镜头秒数" /></label>
              <p class="settingHint">阈值越低，检测越敏感。分镜提取关键帧，动态导出视频片段。</p>
            </div>
          </el-popover>
        </div>
        <template v-if="settings.aiEnabled">
          <promptInput v-model="focusModel" v-model:text="settings.focus" :references="[]" placeholder="填写分析重点，例如：镜头如何推动叙事、节奏如何变化…" />
          <div class="promptHint"><span>逐镜头观察，再归纳叙事、节奏与剪辑 · 模型需支持图片理解</span><span :class="{ overLimit: settings.focus.length > 2000 }">{{ settings.focus.length }}/2000</span></div>
        </template>
        <p v-else class="localHint">本地检测分镜、提取关键帧与原音轨，结果直接生成到画布。</p>
        <div class="promptFooter">
          <el-select v-if="settings.aiEnabled" :modelValue="selectedModel ? settings.aiModel : ''" class="modelSelect" :loading="modelsLoading" :disabled="busy" filterable placeholder="选择语言模型" aria-label="拉片语言模型" noDataText="请先在设置中添加模型" placement="top-start" @update:modelValue="settings.aiModel = $event" @visible-change="visible => visible && loadModels()">
            <template v-if="!selectedModel" #prefix><icon-sparkles :size="17" /></template>
            <template #label="{ label }"><modelLabel :label="label" :providerId="selectedModel?.providerId" :modelId="selectedModel?.modelId" /></template>
            <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
              <el-option v-for="item in provider.models" :key="item.modelId" :value="JSON.stringify([item.providerId, item.modelId])" :label="item.label">
                <modelLabel :label="item.label" :providerId="item.providerId" :modelId="item.modelId" />
              </el-option>
            </el-option-group>
          </el-select>
          <span v-else class="localLabel"><icon-scissors :size="17" />本地分析</span>
          <div class="promptActions">
            <el-switch v-model="settings.aiEnabled" :disabled="busy" activeText="AI 辅助" aria-label="AI 辅助拉片" />
            <el-button v-if="processing" :icon="IconPlayerStop" :disabled="cancelling" @click="cancel">{{ cancelling ? '正在取消' : '取消' }}</el-button>
            <template v-else>
              <el-button v-if="settings.aiEnabled && lastResultMatches" :icon="IconSparkles" text :disabled="busy || !selectedModel || settings.focus.length > 2000" @click="runAi">{{ retryOverview ? '重试归纳' : lastResult?.ai ? '重新分析' : '补充分析' }}</el-button>
              <el-button class="sendButton" :icon="IconArrowUp" :disabled="busy || !source || !hasDimensions || (settings.aiEnabled && (!selectedModel || settings.focus.length > 2000))" @click="run">{{ lastResultMatches ? '重新拉片' : '开始拉片' }}</el-button>
            </template>
          </div>
        </div>
        <p v-if="settings.aiEnabled && modelError" class="errorMessage" role="alert">{{ modelError }}</p>
      </el-card>
    </template>
  </nodeSkeleton>
  <analysisReport v-if="lastResultMatches && lastResult" v-model="reportVisible" :result="lastResult" />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onScopeDispose, reactive, ref, shallowRef, watch } from "vue";
import { IconMovie, IconPhoto, IconUpload, IconWaveSine, IconScissors, IconAdjustmentsHorizontal, IconSparkles, IconTransfer, IconMaximize, IconFileText, IconArrowUp, IconPlayerStop } from "@tabler/icons-vue";
import { ElMessage, ElSelect, ElOption, ElOptionGroup, ElButton, ElCard, ElCheckbox, ElPopover, ElInputNumber, ElSwitch, ElProgress } from "element-plus";
import {
  getTargetValues, isNodeOutput, nodeSkeleton, useNode, useNodeInputs, uploadNodeFile,
  type NodeHandle, type NodeMediaValue, type WorkspaceFiles, type NodeAiModel, type BrowserFfmpegFactory,
} from "@toonflow/nodes-scaffold/runtime";
import { analyzeVideo, type AnalysisResult } from "./videoAnalysis";
import { useResultNodes } from "./resultNodes";
import { analyzeSceneDescriptions } from "./aiAnalysis";
import analysisReport from "./analysisReport.vue";
import videoPlayer from "@toonflow/node-video/videoPlayer";
import promptInput from "@toonflow/node-shared/promptInput";
import { groupNodeModels } from "@toonflow/node-shared/groupNodeModels";
import modelLabel from "@toonflow/node-shared/modelLabel";

defineOptions({
  inheritAttrs: false,
  icon: IconMovie,
  handles: [
    { id: "in", type: "target", dataType: "VIDEO", label: "视频素材" },
  ] satisfies NodeHandle[],
});

type AnalysisSettings = {
  method: "adaptive" | "content";
  threshold: number;
  minSceneSeconds: number;
  frames: boolean;
  clips: boolean;
  audio: boolean;
  aiEnabled: boolean;
  aiModel: string;
  focus: string;
};
type PromptModel = NonNullable<InstanceType<typeof promptInput>["$props"]["modelValue"]>;
type AnalysisState = AnalysisSettings & { source?: NodeMediaValue; lastResult?: AnalysisResult; resultSource?: string };

const { id, node, nodeProps, outputs, ai, nodeEvent, files, ffmpeg: loadFfmpeg, updateNodeInternals } = useNode({ label: "逐帧拉片" });
// ACT: 拉片结果由独立素材节点承载，本节点仅保留视频输入；迁移旧版遗留输出。
outputs.value = {};
node.data.outputs = outputs.value;
const nodeData = node.data as typeof node.data & { frameAnalysis?: AnalysisState };
const saved = nodeData.frameAnalysis;
const settings = reactive<AnalysisSettings>({
  method: saved?.method === "content" ? "content" : "adaptive",
  threshold: typeof saved?.threshold === "number" && saved.threshold > 0 && saved.threshold <= 255 ? saved.threshold : saved?.method === "content" ? 27 : 3,
  minSceneSeconds: typeof saved?.minSceneSeconds === "number" && saved.minSceneSeconds >= 0 && saved.minSceneSeconds <= 60 ? saved.minSceneSeconds : 0.6,
  frames: typeof saved?.frames === "boolean" ? saved.frames : true,
  clips: typeof saved?.clips === "boolean" ? saved.clips : true,
  audio: typeof saved?.audio === "boolean" ? saved.audio : true,
  aiEnabled: typeof saved?.aiEnabled === "boolean" ? saved.aiEnabled : false,
  aiModel: typeof saved?.aiModel === "string" ? saved.aiModel : "",
  focus: typeof saved?.focus === "string" ? saved.focus : "",
});
const focusModel = ref<PromptModel>([[{ type: "Write", text: settings.focus }]]);
const uploadedSource = shallowRef<NodeMediaValue | undefined>(isNodeOutput({ dataType: "VIDEO", value: saved?.source }) ? saved?.source : undefined);
const lastResult = shallowRef<AnalysisResult | undefined>(saved?.lastResult && Array.isArray(saved.lastResult.scenes) ? saved.lastResult : undefined);
const resultSource = ref(typeof saved?.resultSource === "string" ? saved.resultSource : "");
const inputs = useNodeInputs();
const incoming = computed(() => inputs.getTargetValues(id, "in"));
const connected = computed(() => incoming.value.length > 0);
const source = computed<NodeMediaValue | undefined>(() => {
  if (!connected.value) return uploadedSource.value;
  const value = incoming.value[0];
  return value?.dataType === "VIDEO" && value.value && typeof value.value === "object" && "url" in value.value ? value.value as NodeMediaValue : undefined;
});
const player = ref<InstanceType<typeof videoPlayer>>();
let preview: HTMLVideoElement | undefined;
const fileInput = ref<HTMLInputElement>();
const previewFailed = ref(false);
const metadata = reactive({ duration: 0, width: 0, height: 0 });
const processing = ref(false);
const uploading = ref(false);
const cancelling = ref(false);
const progress = ref(0);
const progressLabel = ref("");
const errorMessage = ref("");
const previewUrl = files.useFileUrl(source, error => { previewFailed.value = true; errorMessage.value = readError(error, "视频读取失败"); });
const busy = computed(() => processing.value || uploading.value || !!player.value?.capturing);
const hasDimensions = computed(() => settings.frames || settings.clips || settings.audio);
const lastResultMatches = computed(() => !!lastResult.value && resultSource.value === source.value?.url);
const nodeWidth = computed(() => metadata.width && metadata.height ? Math.max(180, 240 * metadata.width / metadata.height) + 18 : 240);
const reportVisible = ref(false);
const models = ref<NodeAiModel[]>([]);
const modelsLoading = ref(false);
const modelError = ref("");
const selectedModel = computed(() => models.value.find(item => JSON.stringify([item.providerId, item.modelId]) === settings.aiModel));
const modelGroups = computed(() => groupNodeModels(models.value));
const retryOverview = computed(() => !!lastResult.value?.ai?.overviewError
  && lastResult.value.ai.providerId === selectedModel.value?.providerId
  && lastResult.value.ai.modelId === selectedModel.value?.modelId
  && (lastResult.value.ai.focus ?? "") === settings.focus.trim());
const resultNodes = useResultNodes();
resultNodes.removeOutputEdges();
const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
let controller: AbortController | undefined;
let job: Promise<void> | undefined;
let uploadJob: Promise<void> | undefined;
let disposed = false;

function persist() {
  nodeData.frameAnalysis = { ...settings, source: uploadedSource.value, lastResult: lastResult.value, resultSource: resultSource.value };
}
watch([settings, uploadedSource, lastResult, resultSource], persist, { deep: true, flush: "sync", immediate: true });
watch(() => settings.method, method => { settings.threshold = method === "adaptive" ? 3 : 27; });
watch(() => settings.aiEnabled, enabled => {
  if (!enabled) return;
  if (!settings.frames && !settings.clips) settings.frames = true;
  void loadModels();
}, { immediate: true });
watch([() => source.value?.url, () => getCanvas?.()?.id, readDirectory], () => {
  cancel();
  preview?.pause();
  preview = undefined;
  reportVisible.value = false;
  metadata.duration = metadata.width = metadata.height = 0;
  previewFailed.value = false;
  errorMessage.value = "";
}, { flush: "sync" });
onScopeDispose(() => { disposed = true; cancel(); preview?.pause(); });

nodeEvent.on("canConnect", (connection, context) => {
  const edges = context.edges.filter(edge => edge.source !== connection.source || edge.sourceHandle !== connection.sourceHandle
    || edge.target !== connection.target || edge.targetHandle !== connection.targetHandle);
  return getTargetValues(id, "in", context.nodes, [...edges, connection]).length <= 1;
});
nodeEvent.on("save", async reason => {
  if (reason === "reload" && busy.value) throw new Error("拉片处理中，请完成或取消后再刷新节点");
  if (uploading.value) throw new Error("视频上传中，请稍后切换画布或删除节点");
  if (player.value?.capturing) throw new Error("截图保存中，请稍后切换画布或删除节点");
  await cancelAndWait();
});
// ACT: 结果文件由多个生成节点及撤销历史引用，删除本节点仅停止任务，保留已提交素材。
nodeEvent.on("delete", cancelAndWait);
nodeEvent.on("copy", () => ({ frameAnalysis: { ...settings, source: uploadedSource.value, lastResult: lastResult.value, resultSource: resultSource.value } }));

function readDirectory() {
  try { return getDirectory?.(); } catch { return undefined; }
}

function readError(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || (error instanceof Error ? error.message : fallback);
}

async function loadModels() {
  if (modelsLoading.value || disposed) return;
  modelsLoading.value = true;
  modelError.value = "";
  try {
    const available = await ai.getModels();
    if (!disposed) {
      models.value = available;
      const first = modelGroups.value[0]?.models[0];
      if (!settings.aiModel && first) settings.aiModel = JSON.stringify([first.providerId, first.modelId]);
    }
  } catch (error) {
    if (!disposed) modelError.value = readError(error, "模型列表加载失败");
  } finally {
    modelsLoading.value = false;
  }
}

function readMetadata(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;
  preview = video;
  metadata.duration = Number.isFinite(video.duration) ? video.duration : 0;
  metadata.width = video.videoWidth;
  metadata.height = video.videoHeight;
  previewFailed.value = false;
}

function formatDuration(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function openReport() {
  reportVisible.value = true;
}

function uploadVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || busy.value || connected.value) return;
  if (!file.size) return void ElMessage.error("视频文件不能为空");
  if (!file.type.startsWith("video/") && !/\.(mp4|m4v|mov|mkv|webm|avi|ts)$/i.test(file.name)) return void ElMessage.error("请选择视频文件");
  uploadJob = importVideo(file);
}

async function importVideo(file: File) {
  uploading.value = true;
  errorMessage.value = "";
  const directory = readDirectory();
  const canvasId = getCanvas?.()?.id;
  let workspace: WorkspaceFiles | undefined;
  let path: string | undefined;
  let committed = false;
  try {
    workspace = files.getWorkspaceFiles();
    path = await uploadNodeFile(workspace, id, file);
    if (disposed || directory !== readDirectory() || canvasId !== getCanvas?.()?.id || connected.value) return;
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const types: Record<string, string> = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", mkv: "video/x-matroska", webm: "video/webm", avi: "video/x-msvideo", ts: "video/mp2t" };
    uploadedSource.value = { url: path, mimeType: file.type || types[extension ?? ""] || "video/mp4" };
    committed = true;
  } catch (error) {
    if (!disposed) errorMessage.value = readError(error, "视频导入失败");
  } finally {
    if (!committed && workspace && path) {
      try { await workspace.remove(path); } catch (error) { ElMessage.error(readError(error, "未完成的视频导入清理失败")); }
    }
    uploading.value = false;
    uploadJob = undefined;
  }
}

function cancel() {
  if (!controller) return;
  cancelling.value = true;
  controller.abort();
}

async function cancelAndWait() {
  cancel();
  await job;
  await uploadJob;
}

function run() {
  if (busy.value || disposed || !source.value || !hasDimensions.value) return;
  job = processVideo();
}

function runAi() {
  if (busy.value || disposed || !source.value || !lastResultMatches.value || !selectedModel.value) return;
  job = processAi();
}

async function enhanceResult(result: AnalysisResult, workspace: WorkspaceFiles, ffmpeg: BrowserFfmpegFactory, signal: AbortSignal, model: NodeAiModel, focus: string) {
  const { directory: workspaceDirectory } = await workspace.list();
  signal.throwIfAborted();
  const annotated = await analyzeSceneDescriptions({
    ai, model, ffmpeg, workspace, workspaceDirectory, source: source.value!.url, result, focus, signal,
    onProgress: (value, label) => {
      if (signal.aborted) return;
      progress.value = Math.max(0, Math.min(99, Math.round(value)));
      progressLabel.value = label;
    },
  });
  let applied = false;
  try {
    signal.throwIfAborted();
    await batchHistory(async () => {
      signal.throwIfAborted();
      resultNodes.annotate(annotated, result.manifest);
      lastResult.value = annotated;
      persist();
      applied = true;
    });
  } finally {
    if (!applied) await workspace.remove(annotated.manifest);
  }
}

async function processAi() {
  const result = lastResult.value!;
  const model = selectedModel.value!;
  const focus = settings.focus;
  const current = controller = new AbortController();
  processing.value = true;
  cancelling.value = false;
  progress.value = 0;
  progressLabel.value = "准备 AI 辅助分析";
  errorMessage.value = "";
  try {
    const workspace = files.getWorkspaceFiles();
    const ffmpeg = await loadFfmpeg(current.signal);
    await enhanceResult(result, workspace, ffmpeg, current.signal, model, focus);
    progress.value = 100;
    if (lastResult.value?.ai?.overviewError) ElMessage.warning("逐镜头分析已保存，整段归纳未完成，可重试归纳");
    else ElMessage.success("AI 拉片报告已生成");
  } catch (error) {
    if (!current.signal.aborted) errorMessage.value = `本地结果已保留；${readError(error, "AI 分析失败")}`;
  } finally {
    processing.value = false;
    cancelling.value = false;
    controller = undefined;
    await nextTick();
    updateNodeInternals();
  }
}

async function processVideo() {
  const video = source.value!;
  const options = { ...settings };
  const model = selectedModel.value;
  if (options.aiEnabled && (!model || (!options.frames && !options.clips))) {
    errorMessage.value = !model ? "请选择支持图片理解的模型" : "AI 辅助拉片需要开启分镜或动态";
    return;
  }
  if (options.aiEnabled && options.focus.trim().length > 2000) {
    errorMessage.value = "分析重点最多填写 2000 字";
    return;
  }
  if (!Number.isFinite(options.threshold) || options.threshold <= 0 || options.threshold > 255
    || !Number.isFinite(options.minSceneSeconds) || options.minSceneSeconds < 0 || options.minSceneSeconds > 60) {
    errorMessage.value = "请填写有效的切镜阈值和最短镜头时长";
    return;
  }
  const current = controller = new AbortController();
  processing.value = true;
  cancelling.value = false;
  progress.value = 0;
  progressLabel.value = "准备本地分析";
  errorMessage.value = "";
  preview?.pause();
  const directory = `assets/${id}/analysis${crypto.randomUUID().replaceAll("-", "")}`;
  let workspace: WorkspaceFiles | undefined;
  let directoryCreated = false;
  let committed = false;
  let createdIds: string[] = [];
  const previousResult = lastResult.value;
  const previousSource = resultSource.value;
  try {
    resultNodes.verify(options);
    workspace = files.getWorkspaceFiles();
    const ffmpeg = await loadFfmpeg(current.signal);
    current.signal.throwIfAborted();
    for (const parent of ["assets", `assets/${id}`]) {
      await workspace.mkdir(parent).catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    }
    current.signal.throwIfAborted();
    await workspace.mkdir(directory);
    directoryCreated = true;
    const result = await analyzeVideo({
      ffmpeg, workspace, source: video.url, directory, ...options, signal: current.signal,
      onProgress: (value, label) => {
        if (current.signal.aborted) return;
        progress.value = Math.max(0, Math.min(99, Math.round(value)));
        progressLabel.value = label;
      },
    });
    current.signal.throwIfAborted();
    await batchHistory(async () => {
      current.signal.throwIfAborted();
      try {
        createdIds = resultNodes.create(result);
        lastResult.value = result;
        resultSource.value = video.url;
        persist();
        committed = true;
      } catch (error) {
        resultNodes.remove(createdIds);
        lastResult.value = previousResult;
        resultSource.value = previousSource;
        persist();
        throw error;
      }
    });
    metadata.duration = result.duration;
    metadata.width = result.width;
    metadata.height = result.height;
    if (options.aiEnabled && model) {
      progress.value = 0;
      progressLabel.value = "本地分镜已保存，开始 AI 分析";
      await enhanceResult(result, workspace, ffmpeg, current.signal, model, options.focus);
    }
    progress.value = 100;
    if (lastResult.value?.ai?.overviewError) ElMessage.warning("本地拉片及逐镜头分析已完成，整段归纳未完成");
    else ElMessage.success(`拉片完成，已识别 ${result.scenes.length} 个镜头`);
  } catch (error) {
    if (!current.signal.aborted) errorMessage.value = `${committed ? "本地结果已保留；" : ""}${readError(error, "逐帧拉片失败")}`;
  } finally {
    if (!committed && workspace && directoryCreated) {
      try { await workspace.remove(directory, true); }
      catch (error) {
        if ((error as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code !== "ENOENT") {
          const cleanupError = readError(error, "临时文件清理失败");
          errorMessage.value = `${errorMessage.value ? `${errorMessage.value}；` : ""}${cleanupError}`;
        }
      }
    }
    processing.value = false;
    cancelling.value = false;
    controller = undefined;
    await nextTick();
    updateNodeInternals();
  }
}
</script>

<style scoped lang="scss">
.analysisContent {
  .nodeSkeleton.resized & {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    .videoArea {
      display: grid;
      flex: 1;
      min-height: 80px;
      grid-template: minmax(0, 1fr) / minmax(0, 1fr);
      --nodeMediaHeight: 100%;

      .uploadButton { height: 100%; }
    }

    > :not(.videoArea) { flex-shrink: 0; }
  }

  .videoArea {
    min-height: 144px;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    .uploadButton {
      width: 100%; height: 144px; padding: 0; color: var(--el-text-color-secondary);
      :deep(> span) { display: flex; flex-direction: column; gap: 10px; }
    }
    .fileInput { display: none; }
  }
  .sourceInfo, .resultSummary { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--el-text-color-secondary); font-size: 11px; }
  .sourceInfo { padding: 8px 2px 2px; }
  .resultSummary { flex-wrap: wrap; padding: 4px 0 0; }
  .progressArea { padding: 10px 2px 0; }
  .statusText { margin: 6px 0 2px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.5; }
  .warningMessage { margin: 6px 0 2px; color: var(--el-color-warning); font-size: 12px; line-height: 1.6; }
}
.promptCard {
  .promptHeader {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px;
    .dimensionOptions {
      display: flex; align-items: center; gap: 20px;
      .el-checkbox { margin-right: 0; }
      :deep(.el-checkbox__label) { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; }
    }
  }
  .promptHint { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--el-text-color-placeholder); font-size: 11px; line-height: 1.6; margin: 6px 0 10px; }
  .overLimit { color: var(--el-color-danger); }
  .localHint { margin: 12px 0 18px; color: var(--el-text-color-secondary); font-size: 12px; }
  .promptFooter {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    .modelSelect { width: 190px; min-width: 0; flex-shrink: 0;
      :deep(.el-select__wrapper) { gap: 6px; padding: 0; box-shadow: none; background: transparent; }
    }
    .localLabel { display: inline-flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
    .promptActions {
      display: flex; align-items: center; gap: 12px;
      .el-button { margin: 0; }
      .sendButton {
        height: 32px; padding: 0 12px;
        --el-button-bg-color: var(--el-text-color-primary);
        --el-button-border-color: transparent;
        --el-button-text-color: var(--el-bg-color);
        --el-button-hover-bg-color: var(--el-text-color-regular);
        --el-button-hover-border-color: transparent;
        --el-button-hover-text-color: var(--el-bg-color);
      }
    }
  }
}
.settingsFields {
  display: grid; gap: 12px; padding: 4px;
  .settingRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px;
    .el-select, .el-input-number { width: 154px; }
  }
  .settingHint { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
}
.errorMessage { margin: 8px 0 2px; color: var(--el-color-danger); overflow-wrap: anywhere; font-size: 12px; line-height: 1.6; }
</style>
