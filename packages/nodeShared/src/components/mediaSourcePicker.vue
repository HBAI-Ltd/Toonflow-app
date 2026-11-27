<template>
  <el-dialog :modelValue="true" :title="title" class="mediaSourceDialog" width="min(680px, calc(100vw - 32px))" alignCenter appendToBody
    :showClose="!disabled" :closeOnClickModal="!disabled" :closeOnPressEscape="!disabled" @close="emit('close')">
    <mediaToolInputs v-model="selection" inlineGallery largePreview :tool="{ accept, attachmentLabel: '选择要处理的素材' }" :disabled="disabled || reading" />
    <template #footer>
      <el-button :disabled="disabled" @click="emit('close')">取消</el-button>
      <el-button type="primary" :loading="reading || disabled" :disabled="!selection.length" @click="confirm">使用素材</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, shallowRef } from "vue";
import { useVueFlow } from "@vue-flow/core";
import { ElButton, ElDialog } from "element-plus";
import { getAssetOutputs } from "@toonflow/nodes-scaffold/connection";
import { useNodeFiles, type WorkspaceFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import { showNodeError } from "../showNodeError";
import type { MediaToolAttachment } from "../mediaTools";
import mediaToolInputs from "./mediaToolInputs.vue";

const props = defineProps<{ title: string; accept: string; disabled: boolean }>();
const emit = defineEmits<{ select: [file: File]; close: [] }>();
const { findNode } = useVueFlow();
const files = useNodeFiles();
const selection = shallowRef<MediaToolAttachment[]>([]);
const reading = ref(false);
let active = true;
onScopeDispose(() => { active = false; });

async function confirm() {
  const item = selection.value[0];
  if (!item || reading.value || props.disabled) return;
  if (item instanceof File) { emit("select", item); return; }
  reading.value = true;
  const currentOutput = () => {
    const node = findNode(item.nodeId);
    return node && getAssetOutputs(node.data).find(({ output }) => typeof output.value === "object" && output.value.url === item.path);
  };
  let lease: ReturnType<NonNullable<WorkspaceFiles["acquireUrl"]>> | undefined;
  try {
    const media = currentOutput()?.output.value;
    if (!media || typeof media !== "object") throw new Error("所选画布素材已变化，请重新选择");
    const workspace = files.getWorkspaceFiles();
    lease = workspace.acquireUrl?.(item.path, media.mimeType);
    let content: Blob | ArrayBuffer;
    if (lease) {
      const response = await fetch(await lease.url);
      if (!response.ok) throw new Error("无法读取画布素材");
      content = await response.blob();
    } else {
      content = await workspace.read(item.path);
    }
    if (!active) return;
    if (!currentOutput()) throw new Error("所选画布素材已变化，请重新选择");
    emit("select", new File([content], item.path.split(/[\\/]/).at(-1) || item.name, { type: media.mimeType }));
  } catch (error) {
    if (active) showNodeError(error, "导入素材失败");
  } finally {
    lease?.release();
    reading.value = false;
  }
}
</script>

<style scoped lang="scss">
:global(.mediaSourceDialog.el-dialog) {
  display: flex; flex-direction: column; max-height: calc(100dvh - 32px);
}
:global(.mediaSourceDialog .el-dialog__body) {
  min-height: 0; overflow-y: auto; overscroll-behavior: contain;
}
</style>
