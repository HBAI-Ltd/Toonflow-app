<template>
  <footer class="variationFooter">
    <el-select v-model="settings.model" class="modelSelect" filterable :loading="modelsLoading" :disabled="busy" placeholder="选择图片模型" :aria-label="`${label}模型`" noDataText="请先在设置中添加图片模型" placement="top-start" @visible-change="visible => visible && refreshModels()">
      <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
        <el-option v-for="model in provider.models" :key="model.modelId" :label="model.label" :value="JSON.stringify([model.providerId, model.modelId])" />
      </el-option-group>
    </el-select>
    <el-popover trigger="click" placement="top" :width="220" :disabled="busy || !selectedModel" :showArrow="false">
      <template #reference><el-button class="sizeButton" text :disabled="busy || !selectedModel" :aria-label="`${label}输出设置`">{{ settings.ratio || '比例' }} · {{ settings.size || '分辨率' }}</el-button></template>
      <div class="variationSettings nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @wheel.stop @keydown.stop>
        <label>分辨率<el-select v-model="settings.size" :disabled="busy" :aria-label="`${label}分辨率`"><el-option v-for="size in sizeOptions" :key="size" :label="size" :value="size" /></el-select></label>
        <label>比例<el-select v-model="settings.ratio" :disabled="busy" :aria-label="`${label}比例`" @change="ratioFromSource = false"><el-option v-for="ratio in ratioOptions" :key="ratio" :label="ratio" :value="ratio" /></el-select></label>
      </div>
    </el-popover>
    <el-button type="primary" :icon="IconSparkles" :loading="generating" :disabled="busy || modelsLoading || !source || !selectedModel || !prompt.trim()" @click="generate">{{ buttonLabel ?? '生成图片' }}</el-button>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { ElButton, ElOption, ElOptionGroup, ElPopover, ElSelect } from "element-plus";
import { IconSparkles } from "@tabler/icons-vue";
import { useNodeAi, useNodeToolsContext, type NodeMediaModel, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import { groupNodeModels } from "@toonflow/node-shared/groupNodeModels";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import { useImageVariationNode } from "../useImageVariationNode";

const props = defineProps<{
  settings: { model: string; size: string; ratio: string };
  source?: NodeMediaValue;
  aspectRatio: number;
  prompt: string;
  label: string;
  buttonLabel?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ generated: [] }>();
const generating = defineModel<boolean>("generating", { default: false });
const { id, node } = useNode();
const { findNode, getEdges } = useVueFlow();
const ai = useNodeAi();
const getNodeTools = useNodeToolsContext();
const createVariation = useImageVariationNode();
const models = ref<NodeMediaModel[]>([]);
const modelsLoading = ref(false);
const busy = computed(() => props.disabled || generating.value);
const modelGroups = computed(() => groupNodeModels(models.value));
const selectedModel = computed(() => models.value.find(item => JSON.stringify([item.providerId, item.modelId]) === props.settings.model));
const sizeOptions = computed(() => selectedModel.value?.imageSizes?.length ? selectedModel.value.imageSizes : ["2K"]);
const ratioOptions = computed(() => selectedModel.value?.imageRatios?.length ? selectedModel.value.imageRatios : ["16:9"]);
let generationController: AbortController | undefined;
let disposed = false;
let inheritModelConfig = true;
let ratioFromSource = !props.settings.ratio;

function nearestRatio() {
  const numeric = ratioOptions.value.map(value => ({ value, number: value.split(":").map(Number).reduce((width, height) => width / height) })).filter(item => Number.isFinite(item.number) && item.number > 0);
  return props.aspectRatio && numeric.length ? numeric.sort((left, right) => Math.abs(Math.log(left.number / props.aspectRatio)) - Math.abs(Math.log(right.number / props.aspectRatio)))[0]!.value : ratioOptions.value[0]!;
}

watch(selectedModel, choice => {
  if (!choice) return;
  if (!sizeOptions.value.includes(props.settings.size)) props.settings.size = sizeOptions.value.toSorted((left, right) => (Number.parseFloat(left) || Infinity) - (Number.parseFloat(right) || Infinity))[0]!;
  if (!ratioOptions.value.includes(props.settings.ratio)) props.settings.ratio = nearestRatio();
  if (ratioFromSource && props.aspectRatio) { props.settings.ratio = nearestRatio(); ratioFromSource = false; }
}, { flush: "sync" });
watch(() => props.aspectRatio, value => {
  if (value && ratioFromSource && selectedModel.value) { props.settings.ratio = nearestRatio(); ratioFromSource = false; }
});
watch(() => [props.source?.url, props.source?.mimeType], () => generationController?.abort(), { flush: "sync" });
onMounted(refreshModels);
onScopeDispose(() => { disposed = true; generationController?.abort(); });

async function refreshModels() {
  if (modelsLoading.value || busy.value) return;
  modelsLoading.value = true;
  try {
    const result = await ai.getMediaModels();
    if (disposed) return;
    if (inheritModelConfig) {
      for (const key of ["model", "size", "ratio"] as const) {
        const value = node.data[key];
        if (typeof value === "string" && value.trim()) props.settings[key] = value;
      }
      ratioFromSource = !props.settings.ratio;
      inheritModelConfig = false;
    }
    models.value = result.filter(item => item.type === "image");
    if (!props.settings.model) {
      const choice = models.value[0];
      props.settings.model = choice ? JSON.stringify([choice.providerId, choice.modelId]) : "";
    }
  } catch (error) { if (!disposed) showNodeError(error, "模型读取失败"); }
  finally { modelsLoading.value = false; }
}

async function generate() {
  if (disposed || busy.value || modelsLoading.value || !selectedModel.value || !props.source || !props.prompt.trim()) return;
  const controller = generationController = new AbortController();
  generating.value = true;
  try {
    const { nodeId, edgeId } = await createVariation({ ...props.settings, label: props.label, prompt: props.prompt }, controller.signal);
    const createdNode = findNode(nodeId);
    await getNodeTools().call({ nodeId, name: "node:getConfig", args: {} }, controller.signal);
    if (!createdNode || findNode(nodeId) !== createdNode || !getEdges.value.some(edge => edge.id === edgeId && edge.source === id && edge.sourceHandle === "image" && edge.target === nodeId && edge.targetHandle === "in")) {
      throw new Error("新节点或原图连接已变化，请在新节点中检查后生成");
    }
    await getNodeTools().call({ nodeId, name: "node:generateImage", args: {} }, controller.signal);
    emit("generated");
  } catch (error) { if (!controller.signal.aborted && !disposed) showNodeError(error, `${props.label}失败`); }
  finally { generating.value = false; generationController = undefined; }
}
</script>

<style scoped lang="scss">
.variationFooter {
  display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter);
  .modelSelect { flex: 1; min-width: 0; }
  .sizeButton { max-width: 180px; overflow: hidden; }
  > .el-button { margin-left: 0; flex-shrink: 0; }
}
.variationSettings {
  display: grid; gap: 12px;
  label { display: grid; gap: 6px; font-size: 12px; }
}
</style>
