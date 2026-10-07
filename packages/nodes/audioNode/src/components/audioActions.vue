<template>
  <teleport v-if="mode === 'speed' && target" :to="target">
    <el-card class="speedPanel" shadow="never" :bodyStyle="{ padding: '8px' }">
      <div class="speedControls nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
        <el-button class="exitButton" :icon="IconX" text :disabled="cancelling" :title="processing ? '取消处理' : '关闭变速'" :aria-label="processing ? '取消变速处理' : '关闭变速'" @click="close">变速</el-button>
        <span class="speedLimit">0.1×</span>
        <el-slider v-model="speed" class="speedSlider" :min="0.1" :max="4" :step="0.1" :disabled="processing" :formatTooltip="value => `${value.toFixed(2)}×`" aria-label="音频变速滑块" />
        <span class="speedLimit">4×</span>
        <el-input-number :key="String(processing)" v-model="speed" class="speedInput" :min="0.1" :max="4" :step="0.1" :precision="2" :disabled="processing" controlsPosition="right" aria-label="音频变速倍数" />
        <el-button class="generateButton" :icon="IconArrowUp" type="primary" :loading="processing" :disabled="disabled || !validSpeed" title="生成变速音频" aria-label="生成变速音频" @click="run" />
      </div>
      <div v-if="processing" class="processingStatus" role="status">{{ cancelling ? '正在取消并清理…' : '正在生成变速音频…' }}</div>
    </el-card>
  </teleport>
  <el-dialog class="clipDialog" :modelValue="mode === 'clip'" width="900px" alignCenter appendToBody destroyOnClose :showClose="false" :closeOnClickModal="!processing" :closeOnPressEscape="!processing" :style="{ maxWidth: 'calc(100vw - 24px)', maxHeight: '84vh', display: 'flex', flexDirection: 'column' }" @update:modelValue="value => !value && close()">
    <template #header>
      <div class="clipHeader">
        <el-button :icon="IconX" text :disabled="cancelling" :aria-label="processing ? '取消截取处理' : '关闭音频截取'" :title="processing ? '取消处理' : '关闭'" @click="close" />
        <span>截取与拼接</span>
      </div>
    </template>
    <audioClipEditor v-if="mode === 'clip'" ref="clipEditor" v-model="segments" :src="src" :disabled="processing" />
    <template #footer>
      <div class="clipFooter">
        <span v-if="processing" class="processingStatus" role="status">{{ cancelling ? '正在取消并清理…' : '正在导出音频…' }}</span>
        <el-button :disabled="cancelling" @click="close">{{ processing ? '取消处理' : '取消' }}</el-button>
        <el-button type="primary" :loading="processing" :disabled="disabled || !clipEditor?.valid" @click="run">导出音频</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { ElButton, ElCard, ElDialog, ElInputNumber, ElMessage, ElSlider } from "element-plus";
import { IconArrowUp, IconX } from "@tabler/icons-vue";
import { useNodeFfmpeg, useNodeFiles, type NodeMediaValue, type WorkspaceFiles } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import { processAudio, type AudioSegment, type AudioProcessingOptions } from "../audioProcessing";
import audioClipEditor from "./audioClipEditor.vue";

const props = defineProps<{ file?: NodeMediaValue; src: string; disabled?: boolean; target?: HTMLElement }>();
const emit = defineEmits<{ pause: [] }>();
const { node } = useNode();
const { addNodes, findNode, getNodes, nodeTypes } = useVueFlow();
const files = useNodeFiles();
const loadFfmpeg = useNodeFfmpeg();
const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
const mode = ref<"speed" | "clip">();
const speed = ref(1);
const segments = ref<AudioSegment[]>([]);
const processing = ref(false);
const cancelling = ref(false);
const clipEditor = ref<InstanceType<typeof audioClipEditor>>();
const validSpeed = computed(() => Number.isFinite(speed.value) && speed.value >= 0.1 && speed.value <= 4);
let controller: AbortController | undefined;
let job: Promise<void> | undefined;

function cancel() {
  if (!controller) return;
  cancelling.value = true;
  controller.abort();
}

function close() {
  if (processing.value) return cancel();
  clipEditor.value?.pause();
  mode.value = undefined;
}

function reset() {
  cancel();
  clipEditor.value?.pause();
  mode.value = undefined;
}

watch(() => props.file?.url, reset, { flush: "sync" });
watch(() => props.disabled, disabled => { if (disabled) reset(); }, { flush: "sync" });
watch(() => getCanvas?.()?.id, reset, { flush: "sync" });
onBeforeUnmount(cancel);

function open(value: "speed" | "clip") {
  if (processing.value || props.disabled || !props.file || !props.src) return;
  emit("pause");
  segments.value = [];
  mode.value = value;
}

async function cancelAndWait() {
  reset();
  await job;
}

defineExpose({ open, mode, processing, cancelAndWait });

function run() {
  if (processing.value || props.disabled || !props.file || !mode.value || (mode.value === "speed" ? !validSpeed.value : !clipEditor.value?.valid)) return;
  job = process();
}

async function process() {
  if (!nodeTypes?.value?.["remote-audioNode"]) return void ElMessage.error("请先启用音频节点插件");
  const source = props.file!.url;
  const id = crypto.randomUUID();
  const outputPath = `assets/${id}/audio.m4a`;
  const options: AudioProcessingOptions = mode.value === "speed"
    ? { action: "speed", outputPath, speed: speed.value }
    : { action: "clip", outputPath, segments: segments.value.map(segment => ({ ...segment })) };
  const label = options.action === "speed" ? `${options.speed.toFixed(2)}×` : "拼接";
  const current = controller = new AbortController();
  processing.value = true;
  cancelling.value = false;
  emit("pause");
  clipEditor.value?.pause();
  let workspace: WorkspaceFiles | undefined;
  let created = false;
  let committed = false;
  try {
    workspace = files.getWorkspaceFiles();
    const ffmpeg = await loadFfmpeg(current.signal);
    current.signal.throwIfAborted();
    await workspace.mkdir("assets").catch(error => { if (error?.response?.data?.data?.code !== "EEXIST") throw error; });
    current.signal.throwIfAborted();
    await workspace.mkdir(`assets/${id}`);
    created = true;
    await processAudio(ffmpeg, source, options, current.signal);
    current.signal.throwIfAborted();
    const x = node.computedPosition.x + node.dimensions.width + 80;
    const height = node.dimensions.height || 200;
    let y = node.computedPosition.y;
    for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
      const position = other.computedPosition;
      if (position.x < x + 360 && position.x + other.dimensions.width > x && position.y < y + height && position.y + other.dimensions.height > y) y = position.y + other.dimensions.height + 40;
    }
    await batchHistory(async () => {
      current.signal.throwIfAborted();
      if (findNode(node.id) !== node || !nodeTypes?.value?.["remote-audioNode"]) throw new Error("画布节点已变化，请重新处理");
      addNodes([{ id, type: "remote-audioNode", position: { x, y }, data: { label: `${node.data.label || "音频"} · ${label}`, outputs: { audio: { dataType: "AUDIO", value: { url: outputPath, mimeType: "audio/mp4" } } } } }]);
      committed = true;
    });
    mode.value = undefined;
    ElMessage.success("已在右侧生成新的音频节点");
  } catch (error) {
    if (!current.signal.aborted) showNodeError(error, "音频处理失败");
  } finally {
    if (!committed && created && workspace) await workspace.remove(`assets/${id}`, true).catch(error => {
      if (error?.response?.data?.data?.code !== "ENOENT") showNodeError(error, "临时音频清理失败");
    });
    if (current.signal.aborted) mode.value = undefined;
    processing.value = cancelling.value = false;
    controller = undefined;
  }
}
</script>

<style scoped lang="scss">
.speedPanel {
  .speedControls {
    display: flex;
    align-items: center;
    gap: 10px;
    .exitButton { margin: 0; padding: 0 4px; }
    .speedLimit { font-size: 11px; color: var(--el-text-color-secondary); }
    .speedSlider { flex: 1; min-width: 70px; }
    .speedInput { width: 96px; }
    .generateButton { width: 32px; height: 32px; padding: 0; margin: 0; }
  }
  .processingStatus { margin: 6px 4px 0; }
}
.clipHeader { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; .el-button { width: 30px; padding: 0; } }
.clipFooter { display: flex; align-items: center; justify-content: flex-end; gap: 8px; .processingStatus { margin-right: auto; } .el-button { margin: 0; } }
.processingStatus { font-size: 12px; color: var(--el-text-color-secondary); }
:global(.clipDialog .el-dialog__body) { min-height: 0; overflow-y: auto; }
:global(.clipDialog .el-dialog__header), :global(.clipDialog .el-dialog__footer) { flex-shrink: 0; }
</style>
