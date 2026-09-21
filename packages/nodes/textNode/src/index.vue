<template>
  <nodeSkeleton
    v-bind="nodeProps"
    v-model:bottomVisible="node.selected"
    :topVisible="node.selected"
    topWidth="max-content"
    :downloadUrl="downloadUrl"
    :downloadName="`${nodeProps.label || '文本'}.txt`"
    :bottomWidth="660"
    @fullscreen="fullscreen = true; editing = true">
    <div class="textContent" :class="{ empty: !outputs.text.value.trim() }">
      <div v-if="outputs.text.value.trim()" class="textPreview nopan nowheel" aria-label="文本内容">{{ outputs.text.value }}</div>
      <el-button class="editButton nodrag nopan" :icon="IconEdit" :disabled="generating || !textReady" text @dblclick.stop @click.stop="editing = true">编辑</el-button>
    </div>
    <template #bottom>
      <el-card class="promptCard" shadow="never" :bodyStyle="{ padding: '14px 16px 12px' }">
        <div class="promptHeader" v-if="refList.length">
          <referenceItem
            v-model="refList"
            @preview="setReferencePreview"
            @remove="removeReference" />
        </div>
        <promptInput v-model="promptModel" v-model:text="prompt" :references="referenceMentions" />
        <div class="promptFooter">
          <el-select v-model="model" class="modelSelect" filterable :loading="modelsLoading" :disabled="generating" placeholder="选择模型" aria-label="生成模型" noDataText="请先在设置中添加模型" placement="top-start" @visible-change="visible => visible && loadModels()">
            <template #prefix><icon-sparkles :size="17" /></template>
            <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
              <el-option v-for="item in provider.models" :key="item.modelId" :label="item.label" :value="JSON.stringify([item.providerId, item.modelId])" />
            </el-option-group>
          </el-select>
          <div class="promptActions">
            <el-button class="sendButton" :icon="IconArrowUp" :loading="generating" :disabled="!prompt.trim() || !selectedModel || generating || !textReady" title="生成" aria-label="生成" @click="generateText" />
          </div>
        </div>
      </el-card>
    </template>
  </nodeSkeleton>
  <el-dialog v-model="editing" title="编辑文本" width="min(860px, calc(100vw - 32px))" :fullscreen="fullscreen" alignCenter appendToBody @closed="fullscreen = false">
    <el-input class="textEditor" :class="{ fullscreen }" v-model="outputs.text.value" type="textarea" :rows="1" :disabled="generating" resize="none" aria-label="编辑文本内容" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElButton, ElCard, ElInput, ElSelect, ElDialog, ElOption, ElOptionGroup, ElMessage } from "element-plus";
import { IconEdit, IconFileText, IconSparkles, IconArrowUp } from "@tabler/icons-vue";
import { groupNodeModels, nodeSkeleton, nodeTools, useNode, useNodeReferences, z, type NodeAiModel, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";
import referenceItem from "@toonflow/nodes-scaffold/referenceItem";
import promptInput from "@toonflow/nodes-scaffold/promptInput";

type PromptModel = NonNullable<InstanceType<typeof promptInput>["$props"]["modelValue"]>;

defineOptions({
  inheritAttrs: false,
  icon: IconFileText,
  handles: [
    { id: "in", type: "target", dataType: ["VIDEO", "IMAGE", "STRING"], label: "视频、图片、文本输入" },
    { id: "text", type: "source", dataType: "STRING", label: "文本输出" },
  ] satisfies NodeHandle[],
});
const { node, nodeProps, outputs, ai, files, nodeEvent } = useNode({
  label: "文本",
  outputs: { text: { dataType: "STRING", value: "" } },
});
const { refList, referenceMentions, setReferencePreview, removeReference } = useNodeReferences();
const editing = ref(false);
const fullscreen = ref(false);
const downloadUrl = ref("");
watch([() => outputs.value.text.value, () => node.selected], ([text, selected], _previous, onCleanup) => {
  downloadUrl.value = "";
  if (!selected || !text.trim()) return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  downloadUrl.value = url;
  onCleanup(() => URL.revokeObjectURL(url));
}, { immediate: true });
const data = computed(() => node.data as typeof node.data & { prompt?: string; promptModel?: PromptModel; model?: string; textPath?: string; textSnapshot?: string });
const prompt = computed({ get: () => data.value.prompt ?? "", set: (value: string) => { data.value.prompt = value; } });
const model = computed({ get: () => data.value.model ?? "", set: (value: string) => { data.value.model = value; } });
const models = ref<NodeAiModel[]>([]);
const modelsLoading = ref(false);
const generating = ref(false);
const selectedModel = computed(() => models.value.find(item => JSON.stringify([item.providerId, item.modelId]) === model.value));
const modelGroups = computed(() => groupNodeModels(models.value));
const textReady = ref(false);
const textPath = `assets/${node.id}/content.md`;
let textFiles: ReturnType<typeof files.getWorkspaceFiles>;
let textLoading: Promise<void> | undefined;
let textSaving = Promise.resolve();
function saveText(value: string) {
  textSaving = textSaving.catch(() => {}).then(() => textFiles.write(textPath, value));
  return textSaving;
}
nodeEvent.on("save", async (reason) => {
  await textLoading;
  if (!textReady.value) throw new Error("文本尚未加载，无法保存");
  if (reason === "reload" && generating.value) throw new Error("文本正在生成，请完成后再刷新节点");
  // 普通编辑已由 watcher 入队；生成中补存当前片段，不因画布保存重复写未改动的文本。
  if (generating.value) saveText(outputs.value.text.value);
  let pending: Promise<void>;
  do {
    pending = textSaving;
    try { await pending; }
    catch { await saveText(outputs.value.text.value); }
  } while (pending !== textSaving);
  if (reason === "reload" && generating.value) throw new Error("文本正在生成，请完成后再刷新节点");
});
onMounted(() => { textLoading = loadText(); });
async function loadText() {
  try {
    if (!node.id || /[\\/]/.test(node.id) || node.id === "." || node.id === "..") throw new Error("节点 ID 不能作为文件夹名称");
    if (data.value.textPath !== undefined && data.value.textPath !== textPath) throw new Error("文本文件路径无效");
    textFiles = files.getWorkspaceFiles();
    const value = data.value.textSnapshot !== undefined ? data.value.textSnapshot : data.value.textPath ? await textFiles.readText(textPath) : outputs.value.text.value;
    if (typeof value !== "string") throw new Error("文本内容无效");
    if (!data.value.textPath) {
      for (const directory of ["assets", `assets/${node.id}`]) {
        await textFiles.mkdir(directory).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
          if (error.response?.data?.data?.code !== "EEXIST") throw error;
        });
      }
      await textFiles.write(textPath, value);
    }
    outputs.value.text.value = value;
    data.value.textPath = textPath;
    delete data.value.textSnapshot;
    // ACT: 成功落盘后才排除内联正文；迁移失败时画布仍保留原内容。
    Object.defineProperty(outputs.value, "toJSON", { value: () => ({}) });
    textReady.value = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "文本加载失败");
  }
}

watch(() => outputs.value.text.value, async (value) => {
  if (!textReady.value || generating.value) return;
  try { await saveText(value); }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : "文本保存失败"); }
}, { flush: "sync" });
nodeEvent.on("copy", () => {
  if (!textReady.value) throw new Error("文本尚未加载");
  return { textPath: undefined, textSnapshot: outputs.value.text.value };
});

onMounted(loadModels);

async function loadModels() {
  if (modelsLoading.value) return;
  modelsLoading.value = true;
  try {
    models.value = await ai.getModels();
    if (!model.value) {
      const first = models.value[0];
      model.value = first ? JSON.stringify([first.providerId, first.modelId]) : "";
    }
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") ElMessage.error(error.message);
  } finally {
    modelsLoading.value = false;
  }
}

async function generateText() {
  const choice = selectedModel.value;
  if (!textReady.value || generating.value || !choice || !prompt.value.trim()) return;
  generating.value = true;
  let text = "";
  try {
    if (refList.value.some(item => item.value === undefined)) throw new Error("引用节点暂无内容，请先补充引用内容");
    const references = refList.value
      .filter(item => item.value !== undefined && (item.dataType === "STRING" || item.dataType === "IMAGE" || item.dataType === "VIDEO"))
      .map(item => item.dataType === "STRING" ? { dataType: item.dataType, value: item.value } : { dataType: item.dataType, value: { ...item.value } });
    const input = { providerId: choice.providerId, modelId: choice.modelId, prompt: prompt.value.trim(), references };
    const directory = references.some(item => item.dataType !== "STRING") ? (await textFiles.list()).directory : undefined;
    const result = await ai.generate({
      ...input,
      directory,
      onEvent(event) {
        if (event.type === "text") outputs.value.text.value = text += event.delta;
      },
    });
    outputs.value.text.value = result.text;
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") ElMessage.error(error.message);
  } finally {
    // 卸载会取消请求并停止 watcher，生成收尾必须自行保存已收到的正文。
    try { await saveText(outputs.value.text.value); }
    catch (error) { ElMessage.error(error instanceof Error ? error.message : "文本保存失败"); }
    generating.value = false;
  }
}
const promptModel = computed({ get: () => data.value.promptModel ?? [], set: (value: PromptModel) => { data.value.promptModel = value; } });

nodeTools.register({
  name: "setText",
  description: "修改此节点的文本输出",
  parameters: z.strictObject({ text: z.string() }),
  async execute({ text }) {
    if (!textReady.value) throw new Error("文本尚未加载");
    if (generating.value) throw new Error("文本生成中，请稍后修改");
    if (outputs.value.text.value === text) await saveText(text);
    else { outputs.value.text.value = text; await textSaving; }
    return { text };
  },
});
</script>

<style lang="scss" scoped>
.textEditor {
  &.fullscreen :deep(.el-textarea__inner) {
    height: calc(100dvh - 112px);
  }

  :deep(.el-textarea__inner) {
    height: min(560px, calc(100dvh - 144px));
    padding: 16px 20px;
    overflow-y: auto;
    overscroll-behavior: contain;
    font-size: 14px;
    line-height: 1.8;
  }
}

.textContent {
  min-height: 110px;

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;

    .editButton {
      margin: 0;
    }
  }

  .textPreview {
    min-height: 110px;
    max-height: 240px;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    user-select: none;
  }

  .editButton {
    display: flex;
    margin-left: auto;
  }
}

.promptCard {
  .promptHeader {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .promptFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .modelSelect {
      width: 190px;
      min-width: 0;

      &:deep(.el-select__wrapper) {
        gap: 6px;
        padding: 0;
        box-shadow: none;
        background: transparent;
      }
    }

    .promptActions {
      display: flex;
      align-items: center;
      gap: 12px;

      .toolButton {
        width: 28px;
        height: 28px;
        padding: 0;
      }

      .generationCount {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }

      .sendButton {
        width: 32px;
        height: 32px;
        margin: 0;
        padding: 0;
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
</style>
