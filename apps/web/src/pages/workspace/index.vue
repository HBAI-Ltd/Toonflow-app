<template>
  <main class="workspacePage" :style="{ '--agentWidth': `${agentVisible ? agentWidth : 0}px` }">
    <canvasPanel :key="workspaceStore.project?.directory" ref="canvasPanelRef" class="canvasPanel" :class="{ backgroundPanel: activePanel !== 'canvas' }" :inert="activePanel !== 'canvas'" :aria-hidden="activePanel !== 'canvas'" :active="activePanel === 'canvas'" :settingsVisible="settingsVisible" />
    <keep-alive :max="1">
      <documentPanel
        v-if="activePanel === 'document'"
        :key="workspaceStore.project?.directory"
        ref="documentPanelRef"
        :readNode="readDocumentNode"
        :saveNode="saveDocumentNode" />
    </keep-alive>
    <workspaceMenu class="workspaceMenu" @openSettings="settingsVisible = true" />
    <el-segmented :modelValue="activePanel" class="panelSwitcher" :options="panelOptions" size="small" aria-label="切换面板" @change="switchPanel">
      <template #default="{ item }">
        <span class="panelOption">
          <component :is="item.icon" :size="14" aria-hidden="true" />
          {{ item.label }}
        </span>
      </template>
    </el-segmented>
    <el-button
      class="agentButton"
      :class="{ active: agentVisible }"
      :aria-expanded="agentVisible"
      aria-controls="agentPanel"
      @click="agentVisible = !agentVisible">
      <span class="agentLogo" :style="{ maskImage: `url(${logoUrl})` }" aria-hidden="true" />
      <span>Toonflow Agent</span>
    </el-button>
    <agent v-model="agentVisible" @resize="agentWidth = $event" />
    <settings v-model="settingsVisible" />
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, onScopeDispose, provide, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import axios from "axios";
import { IconLayoutDashboard, IconFileText } from "@tabler/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import logoUrl from "@toonflow/assets/logo.svg";
import agent from "@/components/agent/index.vue";
import settings from "@/components/settings/index.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { registerWorkspaceControl, waitForControlValue } from "@/lib/mcpControl";
import anonymousData from "@/lib/anonymousData";
import canvasPanel from "./panels/canvas/canvasHost.vue";
import workspaceMenu from "./components/workspaceMenu.vue";

const documentPanel = defineAsyncComponent(() => import("./panels/document/index.vue"));

const activePanel = ref<"canvas" | "document">("canvas");
onMounted(() => anonymousData.track("workspace.canvas"));
const workspaceStore = useWorkspaceStore();
const panelOptions = [
  { label: "画布", value: "canvas", icon: IconLayoutDashboard },
  { label: "文档", value: "document", icon: IconFileText },
];
const agentVisible = ref(true);
const agentWidth = ref(420);
const settingsVisible = ref(false);
const canvasPanelRef = ref<InstanceType<typeof canvasPanel>>();
const documentPanelRef = ref<InstanceType<typeof documentPanel>>();
provide("canvas", () => canvasPanelRef.value?.getCanvasContext());
provide("activateCanvasPanel", () => switchPanel("canvas"));

const controlLifetime = new AbortController();
onScopeDispose(() => controlLifetime.abort(new Error("工作区已关闭")));
registerWorkspaceControl({
  getState: () => ({
    directory: workspaceStore.project?.directory ?? null,
    canvasId: canvasPanelRef.value?.canvasId || null,
    panel: activePanel.value,
    tools: canvasPanelRef.value?.canvasReady ? canvasPanelRef.value.getCanvasContext()?.tools ?? [] : [],
    document: documentPanelRef.value?.getDocument(false),
  }),
  flushSave,
  async call(request, signal) {
    const directory = workspaceStore.project?.directory;
    if (!directory) throw new Error("请先打开工作区");
    const callSignal = AbortSignal.any([signal, controlLifetime.signal]);
    const checkDirectory = () => {
      callSignal.throwIfAborted();
      if (directory !== workspaceStore.project?.directory) throw new Error("工作区已切换，本次调用已停止");
    };
    checkDirectory();
    if (request.name === "switchPanel") {
      if (request.args.panel !== "canvas" && request.args.panel !== "document") throw new Error("未知面板");
      if (!(await switchPanel(request.args.panel))) throw new Error("面板切换失败，请检查文档是否保存成功");
      checkDirectory();
      return { panel: activePanel.value };
    }
    if (["getDocument", "openDocument", "writeDocument"].includes(request.name)) {
      if (!(await switchPanel("document"))) throw new Error("文档面板无法打开");
      const panel = await waitForControlValue(() => documentPanelRef.value, callSignal);
      checkDirectory();
      if (request.name === "openDocument") await panel.openDocument(request.args, callSignal);
      if (request.name === "writeDocument") await panel.writeDocument(request.args, callSignal);
      checkDirectory();
      return panel.getDocument();
    }
    if (!(await switchPanel("canvas"))) throw new Error("画布面板无法打开");
    const context = await waitForControlValue(
      () => (canvasPanelRef.value?.canvasReady ? canvasPanelRef.value.getCanvasContext() : undefined),
      callSignal
    );
    checkDirectory();
    return context.call({ name: request.name, args: request.args }, callSignal);
  },
});

async function flushSave() {
  await documentPanelRef.value?.flushSave();
  await canvasPanelRef.value?.flushSave();
}

onBeforeRouteLeave(async () => {
  if (canvasPanelRef.value?.saveBusy) {
    ElMessage.warning("画布操作尚未完成，请稍后退出");
    return false;
  }
  try {
    await flushSave();
    return true;
  } catch (error) {
    const message = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error ? error.message : "项目保存失败";
    const leave = await ElMessageBox.confirm(
      `无法保存项目：${message}。文件或目录可能已被移动或删除。仍然退出将丢弃尚未保存的修改。`,
      "项目未保存",
      { type: "warning", confirmButtonText: "仍然退出", cancelButtonText: "留在项目", closeOnClickModal: false },
    ).then(() => true, () => false);
    if (leave) {
      documentPanelRef.value?.cancelSave();
      canvasPanelRef.value?.cancelSave();
    }
    return leave;
  }
});

async function switchPanel(value: string | number | boolean) {
  if (value !== "canvas" && value !== "document") return false;
  try {
    if (activePanel.value === "document") await documentPanelRef.value?.flushSave();
    const changed = activePanel.value !== value;
    activePanel.value = value;
    await nextTick();
    if (changed) anonymousData.track(value === "canvas" ? "workspace.canvas" : "workspace.document");
    return true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "文本保存失败");
    return false;
  }
}

function readDocumentNode(directory: string, canvasPath: string, nodeId: string) {
  if (!canvasPanelRef.value) throw new Error("画布尚未就绪");
  return canvasPanelRef.value.readDocumentNode(directory, canvasPath, nodeId);
}

function saveDocumentNode(directory: string, canvasPath: string, nodeId: string, handleId: string, text: string) {
  if (!canvasPanelRef.value) throw new Error("画布尚未就绪");
  return canvasPanelRef.value.saveDocumentNode(directory, canvasPath, nodeId, handleId, text);
}
</script>

<style scoped lang="scss">
.workspacePage {
  position: relative;
  width: 100%;
  height: 100dvh;
  background-color: var(--el-bg-color);

  .canvasPanel {
    position: absolute;
    inset: 0;

    &.backgroundPanel {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  }

  .workspaceMenu {
    position: absolute;
    top: 15px;
    left: 15px;
    z-index: 5;
  }

  .panelSwitcher {
    --el-border-radius-base: 999px;
    --el-segmented-bg-color: var(--el-bg-color-overlay);
    --el-segmented-item-selected-color: var(--el-color-primary);
    --el-segmented-item-selected-bg-color: var(--el-color-primary-light-9);
    position: absolute;
    top: 15px;
    left: 50%;
    z-index: 5;
    min-height: 32px;
    padding: 3px;
    border: 1px solid var(--el-border-color-light);
    box-shadow: var(--el-box-shadow-lighter);
    font-size: 12px;
    transform: translateX(-50%);

    .panelOption {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 0 3px;
      line-height: 24px;
    }
  }

  .agentButton {
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 5;
    height: 40px;
    padding: 0 14px;
    border-radius: var(--ui-radius-large, var(--el-border-radius-base));
    font-weight: 600;
    box-shadow: var(--el-box-shadow-lighter);
    --el-button-bg-color: var(--el-bg-color-overlay);
    --el-button-text-color: var(--el-text-color-primary);
    --el-button-border-color: var(--el-border-color-light);
    --el-button-hover-bg-color: var(--el-color-primary-light-9);
    --el-button-hover-text-color: var(--el-color-primary);
    --el-button-hover-border-color: var(--el-color-primary-light-5);

    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 3px;
    }

    .agentLogo {
      width: 24px;
      height: 24px;
      margin-right: 8px;
      flex-shrink: 0;
      background: currentColor;
      mask-size: contain;
      mask-position: center;
      mask-repeat: no-repeat;
    }
  }
}
</style>
