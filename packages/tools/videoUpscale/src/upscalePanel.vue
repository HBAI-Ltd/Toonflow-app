<template>
  <el-dialog v-model="visible" title="视频升清" width="520px" appendToBody @closed="stopPolling">
    <div class="upscalePanel nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
      <p>源视频：{{ activeTask ? task?.path : path }}</p>
      <label class="resolutionField">
        <span>目标分辨率：</span>
        <el-select v-model="resolution" :disabled="activeTask || busy" aria-label="目标分辨率">
          <el-option label="720p" value="720p" />
          <el-option label="1080p" value="1080p" />
          <el-option label="4K" value="4k" />
        </el-select>
      </label>
      <p>升清规格：Standard</p>
      <p v-if="details">时长：{{ details.duration.toFixed(2) }} 秒；分辨率：{{ details.width }} × {{ details.height }}</p>
      <p v-if="details">预计升清费用：${{ details.estimatedCostUsd.toFixed(4) }} USD</p>
      <p v-if="task?.costUsd !== undefined">{{ activeTask ? '实际费用' : '上次任务实际费用' }}：${{ task.costUsd.toFixed(4) }} USD</p>
      <p v-else-if="task">{{ activeTask ? '实际费用' : '上次任务实际费用' }}：待核对</p>
      <p v-if="task" role="status">{{ activeTask ? '任务状态' : '上次任务状态' }}：{{ stateLabels[task.state] }}{{ task.applied ? '，已生成视频节点' : '' }}</p>
      <p v-if="activeTask && task?.path !== path" class="warning">当前视频已变化或缺失，将把原任务的升清结果保存为新节点。</p>
      <p v-if="message" class="warning" role="alert">{{ message }}</p>
      <p class="hint">费用为估算值，存储和流量另计，实际费用以 reAPI 账单为准；原视频将保留。</p>
      <div class="panelActions">
        <el-button @click="visible = false">关闭</el-button>
        <el-button v-if="task && !task.applied && task.state !== 'failed'" :loading="busy" @click="refresh">继续查询</el-button>
        <el-button v-if="!activeTask && !quote" :loading="busy" @click="loadQuote">重新报价</el-button>
        <el-button v-if="task?.state === 'succeeded' && !task.applied && task.result" type="primary" :disabled="busy" @click="apply">保存结果</el-button>
        <el-button v-else-if="!activeTask || canResume" type="primary" :loading="busy" :disabled="!canStart" @click="start">{{ canResume ? '继续提交' : '开始升清' }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElButton, ElDialog, ElOption, ElSelect } from "element-plus";
import axios from "axios";

type UpscaleResolution = "720p" | "1080p" | "4k";
type Quote = { path: string; resolution: UpscaleResolution; sourceHash: string; duration: number; width: number; height: number; frameRate: number; hasAudio: boolean; estimatedCostUsd: number };
type Result = { path: string; mimeType: "video/mp4"; width: number; height: number; duration: number };
type State = "uploading" | "submitting" | "processing" | "succeeded" | "failed";
type Scope = { nodeId: string; directory: string; canvasPath: string; path: string; resolution?: UpscaleResolution };
type BoundQuote = Quote & Scope;
type Task = Omit<BoundQuote, "resolution"> & { resolution?: UpscaleResolution; taskId: string; state: State; costUsd?: number; result?: Result; message?: string; applied?: boolean };
type Status = { taskId: string; path: string; resolution?: UpscaleResolution; state: State; estimatedCostUsd: number; costUsd?: number; result?: Result; message?: string };

const props = defineProps<{
  directory: string;
  canvasPath: string;
  nodeId: string;
  path: string;
  savedTask?: Task;
  saveTask: (task: Task, requireSource?: boolean) => Promise<void>;
  applyResult: (task: Task, result: Result) => Promise<void>;
}>();
const visible = ref(false);
const busy = ref(false);
const resolution = ref<UpscaleResolution>("720p");
const quote = ref<BoundQuote>();
const message = ref("");
const taskNotFound = ref(false);
const task = computed(() => props.savedTask);
const activeTask = computed(() => !!task.value && !task.value.applied && task.value.state !== "failed");
const details = computed(() => activeTask.value ? task.value : quote.value);
const canResume = computed(() => taskNotFound.value || task.value?.state === "uploading");
const canStart = computed(() => canResume.value
  ? !!task.value && sameScope(task.value)
  : !!quote.value && sameScope(quote.value, true) && !activeTask.value);
const stateLabels: Record<State, string> = { uploading: "上传中", submitting: "提交中", processing: "处理中", succeeded: "已完成", failed: "已失败" };
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let scopeVersion = 0;
let quoteRequest = 0;
watch([visible, () => props.directory, () => props.canvasPath, () => props.nodeId, () => props.path, resolution], () => {
  scopeVersion++;
  if (!visible.value) stopPolling();
}, { flush: "sync" });
watch(resolution, () => {
  quote.value = undefined;
  if (visible.value && !activeTask.value) void loadQuote();
}, { flush: "sync" });

function sameScope(scope: Scope, requireSource = false) {
  return !disposed && scope.directory === props.directory && scope.canvasPath === props.canvasPath && scope.nodeId === props.nodeId
    && (scope.resolution ?? "720p") === resolution.value && (!requireSource || scope.path === props.path);
}

async function call<T>(directory: string, args: Record<string, unknown>): Promise<T> {
  const { data } = await axios.post<{ code: number; data: T; message: string }>("/api/tools/call", {
    name: "videoUpscale", tool: "videoUpscale", directory, args,
  }, { headers: { "x-toonflow-workspace": "1" } });
  if (data.code !== 200) throw new Error(data.message || "视频升清操作失败");
  return data.data;
}

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error instanceof Error ? error.message : "操作失败");
}

function stopPolling() {
  if (timer) clearTimeout(timer);
  timer = undefined;
}

function close() {
  visible.value = false;
  stopPolling();
}

async function loadQuote() {
  const scope = { directory: props.directory, canvasPath: props.canvasPath, nodeId: props.nodeId, path: props.path, resolution: resolution.value };
  const version = scopeVersion;
  if (!scope.path) return;
  const request = ++quoteRequest;
  busy.value = true;
  message.value = "";
  quote.value = undefined;
  try {
    const value = await call<Quote>(scope.directory, { action: "quote", path: scope.path, resolution: scope.resolution });
    if (request !== quoteRequest || version !== scopeVersion || !sameScope(scope, true)) throw new Error("面板、画布、视频或分辨率已变化，请重新报价");
    if (!value || value.path !== scope.path || (value.resolution ?? "720p") !== scope.resolution || !value.sourceHash || !Number.isFinite(value.duration) || value.duration <= 0
      || !Number.isFinite(value.width) || value.width <= 0 || !Number.isFinite(value.height) || value.height <= 0
      || !Number.isFinite(value.estimatedCostUsd) || value.estimatedCostUsd < 0) throw new Error("升清报价无效");
    quote.value = { ...value, ...scope };
  } catch (error) {
    if (request === quoteRequest) message.value = errorMessage(error);
  } finally {
    if (request === quoteRequest) busy.value = false;
  }
}

async function open() {
  visible.value = true;
  if (busy.value) return;
  stopPolling();
  taskNotFound.value = false;
  if (activeTask.value) {
    resolution.value = task.value?.resolution ?? "720p";
    await refresh();
  } else await loadQuote();
}

async function start() {
  if (busy.value || !canStart.value) return;
  const current = canResume.value ? task.value : undefined;
  const source = current ?? quote.value;
  if (!source) return;
  const version = scopeVersion;
  busy.value = true;
  message.value = "";
  taskNotFound.value = false;
  let submitted = false;
  try {
    const next: Task = current ? { ...current, resolution: current.resolution ?? "720p" } : { ...source, taskId: crypto.randomUUID(), state: "submitting" };
    // ACT: 先保存原始报价和任务身份，再允许发起可能产生费用的请求。
    await props.saveTask(next, !current);
    if (version !== scopeVersion || !visible.value || !sameScope(next, !current)) throw new Error("面板、画布、视频或分辨率已变化");
    submitted = true;
    const value = await call<Status>(next.directory, { action: "start", taskId: next.taskId, path: next.path, resolution: next.resolution ?? "720p", sourceHash: next.sourceHash, estimatedCostUsd: next.estimatedCostUsd });
    await acceptStatus(next, value);
  } catch (error) {
    message.value = submitted ? `${errorMessage(error)}。提交结果可能未知，请先继续查询并在服务商处核对，避免重复付费。`
      : `${errorMessage(error)}。任务未提交。`;
  } finally {
    busy.value = false;
  }
  schedule();
}

async function acceptStatus(current: Task, value: Status) {
  if (!value || value.taskId !== current.taskId || value.path !== current.path || (value.resolution ?? "720p") !== (current.resolution ?? "720p") || value.estimatedCostUsd !== current.estimatedCostUsd
    || !Object.hasOwn(stateLabels, value.state)) throw new Error("升清任务状态与已保存任务不一致");
  const next: Task = { ...current, resolution: current.resolution ?? "720p", state: value.state, costUsd: value.costUsd, result: value.result, message: value.message };
  await props.saveTask(next);
  if (value.state === "failed") message.value = value.message || "升清失败，可以重新报价后手动重试。";
  if (value.state === "uploading") message.value = value.message || "源视频尚未上传完成，可以继续提交同一任务。";
  if (value.state === "submitting") message.value = value.message || "提交结果尚未确认，请在 reAPI 控制台核对，系统不会自动重复提交。";
  if (value.state === "succeeded") {
    if (!value.result) throw new Error("任务已完成，但未返回视频文件");
    await props.applyResult(next, value.result);
  }
}

async function refresh() {
  const current = task.value ? { ...task.value } : undefined;
  if (!current || busy.value) return;
  if (!sameScope(current)) { message.value = "画布或节点已变化，请在原画布查询任务。"; return; }
  stopPolling();
  busy.value = true;
  message.value = "";
  taskNotFound.value = false;
  try {
    const value = await call<Status>(current.directory, { action: "status", taskId: current.taskId });
    await acceptStatus(current, value);
  } catch (error) {
    const code = (error as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code;
    if (code === "TASK_NOT_FOUND" && current.state === "submitting") {
      taskNotFound.value = true;
      message.value = "本地服务未找到此任务，可继续提交同一任务；如曾在服务商看到请求，请先核对。";
    } else message.value = `${errorMessage(error)}。请继续查询或在服务商处核对，未确认前不要重复提交。`;
  } finally {
    busy.value = false;
  }
  schedule();
}

async function apply() {
  const current = task.value;
  if (!current?.result || busy.value) return;
  busy.value = true;
  message.value = "";
  try { await props.applyResult(current, current.result); }
  catch (error) { message.value = errorMessage(error); }
  finally { busy.value = false; }
}

function schedule() {
  stopPolling();
  if (visible.value && !disposed && !message.value && activeTask.value && task.value?.state !== "succeeded") {
    timer = setTimeout(() => { void refresh(); }, 5000);
  }
}

onBeforeUnmount(() => { disposed = true; scopeVersion++; stopPolling(); });
defineExpose({ open, close, busy });
</script>

<style scoped lang="scss">
.upscalePanel {
  p { margin: 10px 0; overflow-wrap: anywhere; }
  .resolutionField { display: flex; align-items: center; gap: 8px; }
  .warning { color: var(--el-color-warning); }
  .hint { color: var(--el-text-color-secondary); font-size: 12px; }
  .panelActions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
}
</style>
