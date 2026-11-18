<template>
  <el-dialog
    v-model="visible"
    class="exploreProcessDialog"
    :title="title || '制作过程'"
    width="min(1440px, 96vw)"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="!busy"
    :closeOnPressEscape="!busy"
    :showClose="false"
    @opened="fitCanvas">
    <template #header="{ titleId }">
      <div class="processHeader">
        <el-button class="headerButton" text :icon="IconArrowLeft" :disabled="busy" aria-label="返回作品详情" title="返回作品详情" @click="visible = false" />
        <div class="processTitle">
          <h2 :id="titleId" :title="title || '制作过程'">{{ title || "制作过程" }}</h2>
          <span class="readOnlyLabel"><icon-lock :size="12" aria-hidden="true" />只读</span>
        </div>
        <div class="processHeaderActions"><slot name="footer" /></div>
        <el-button class="headerButton" text :icon="IconX" :disabled="busy" aria-label="关闭制作过程" title="关闭制作过程" @click="visible = false" />
      </div>
    </template>
    <div class="processPreview">
      <div class="processCanvas">
        <vue-flow
          v-if="canvas"
          :id="`${previewId}-${canvas.id}`"
          :key="canvas.id"
          :nodes="nodes"
          :edges="edges"
          :onlyRenderVisibleElements="true"
          :nodesDraggable="false"
          :nodesConnectable="false"
          :nodesFocusable="true"
          :edgesFocusable="false"
          :edgesUpdatable="false"
          :elementsSelectable="true"
          :elevateNodesOnSelect="true"
          :deleteKeyCode="null"
          :selectionKeyCode="null"
          :multiSelectionKeyCode="null"
          :panOnDrag="true"
          :zoomOnDoubleClick="false"
          :minZoom="0.03"
          :maxZoom="8"
          :fitViewOnInit="true"
          :defaultEdgeOptions="{ type: 'simplebezier', selectable: false, deletable: false, focusable: false }"
          @init="flow = $event">
          <template #node-processNode="{ data, selected }">
            <div class="processNodeView">
              <nodeSkeleton
                class="processNode"
                :label="data.label"
                :handles="data.handles"
                :icon="data.media?.type === 'video' ? IconVideo : data.media?.type === 'image' ? IconPhoto : data.media?.type === 'audio' ? IconMusic : IconFileText"
                :style="{ width: `${data.width}px` }"
                readOnly>
                <img v-if="data.media?.type === 'image'" class="nodeImage" :src="data.media.url" :alt="data.label" draggable="false" referrerpolicy="no-referrer" />
                <videoPlayer v-else-if="data.media?.type === 'video'" :src="data.media.url" :label="data.label" readOnly />
                <audio v-else-if="data.media?.type === 'audio'" class="nodeAudio nopan nowheel" :src="data.media.url" controls preload="none" />
                <div v-else class="nodeText nopan nowheel">
                  <markdownPreview :modelValue="data.text || ''" />
                </div>
              </nodeSkeleton>
              <el-card
                v-if="selected && ((data.media && data.text) || data.prompt)"
                class="nodeDetails nodrag nopan nowheel"
                shadow="never"
                :bodyStyle="{ padding: '14px 16px' }"
                @pointerdown.stop
                @mousedown.stop
                @click.stop
                @dblclick.stop
                @keydown.stop>
                <div v-if="data.media && data.text" class="nodeDetailSection">
                  <h3>正文</h3>
                  <markdownPreview :modelValue="data.text" />
                </div>
                <div v-if="data.prompt" class="nodeDetailSection">
                  <h3>提示词</h3>
                  <markdownPreview :modelValue="data.prompt" />
                </div>
              </el-card>
            </div>
          </template>
          <template #node-processGroup="nodeProps">
            <groupNode v-bind="nodeProps" readOnly />
          </template>
          <background :gap="16" patternColor="var(--el-border-color)" />
          <panel v-if="process.canvases.length > 1" class="canvasSelectPanel" position="top-left">
            <el-select v-model="canvasId" class="canvasSelect" aria-label="选择制作画布">
              <template #prefix><icon-layers-intersect :size="15" aria-hidden="true" /></template>
              <el-option v-for="item in process.canvases" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </panel>
          <panel class="viewportActions" position="bottom-left" role="group" aria-label="画布缩放">
            <el-button class="viewportButton" text :icon="IconFocusCentered" aria-label="适应画布" title="适应画布" @click="fitCanvas" />
            <span class="toolSeparator" />
            <el-button class="viewportButton" text :icon="IconMinus" aria-label="缩小画布" title="缩小画布" @click="flow?.zoomOut()" />
            <span class="zoomLabel">{{ zoomPercent }}%</span>
            <el-button class="viewportButton" text :icon="IconPlus" aria-label="放大画布" title="放大画布" @click="flow?.zoomIn()" />
          </panel>
        </vue-flow>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { VueFlow, Panel, type Node, type Edge, type VueFlowStore } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { IconArrowLeft, IconFileText, IconFocusCentered, IconLayersIntersect, IconLock, IconMinus, IconMusic, IconPhoto, IconPlus, IconVideo, IconX } from "@tabler/icons-vue";
import nodeSkeleton from "@toonflow/nodes-scaffold/nodeSkeleton";
import videoPlayer from "@toonflow/node-video/videoPlayer";
import markdownPreview from "@toonflow/node-text/markdownPreview";
import groupNode from "@/pages/workspace/panels/canvas/components/groupNode.vue";
import type { ExploreProcess } from "@toonflow/server/channel";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

const props = defineProps<{ process: ExploreProcess; busy?: boolean; title?: string }>();
const visible = defineModel<boolean>({ default: false });
const previewId = `exploreProcess-${crypto.randomUUID()}`;
const canvasId = ref("");
const flow = shallowRef<VueFlowStore>();
const canvas = computed(() => props.process.canvases.find(item => item.id === canvasId.value) ?? props.process.canvases[0]);
const zoomPercent = computed(() => Math.round((flow.value?.viewport.value.zoom ?? 1) * 100));

watch(() => props.process, () => {
  canvasId.value = props.process.canvases[0]?.id ?? "";
}, { immediate: true });

// ACT: 复用真实画布的外壳与展示组件，不挂载会执行任务或读写工作区的插件入口。
const nodes = computed<Node[]>(() => {
  const source = canvas.value?.nodes ?? [];
  const byId = new Map(source.map(node => [node.id, node]));
  const positions = new Map<string, { x: number; y: number; depth: number }>();
  // 离屏节点尚未挂载，VueFlow 不会计算父坐标；先累计绝对坐标，让分组与可见区渲染互不依赖。
  for (const node of source) {
    const ancestors: typeof source = [];
    let current: typeof node | undefined = node;
    while (current && !positions.has(current.id)) {
      ancestors.push(current);
      current = current.parentNode === undefined ? undefined : byId.get(current.parentNode);
    }
    let position = current ? positions.get(current.id)! : { x: 0, y: 0, depth: -1 };
    for (const ancestor of ancestors.reverse()) {
      position = { x: position.x + ancestor.position.x, y: position.y + ancestor.position.y, depth: position.depth + 1 };
      positions.set(ancestor.id, position);
    }
  }
  return source.map(node => {
    const width = node.width ?? (node.kind === "group" ? 640 : node.media ? 338 : 220);
    const position = positions.get(node.id)!;
    return {
      id: node.id,
      type: node.kind === "group" ? "processGroup" : "processNode",
      position: { x: position.x, y: position.y },
      zIndex: node.kind === "group" ? position.depth : source.length,
      width,
      // ACT: 先用快照尺寸参与可见区计算，挂载后由真实组件测量，避免首屏把所有零尺寸节点都渲染出来。
      dimensions: { width, height: node.height ?? (node.kind === "group" ? 440 : node.media ? 258 : 128) },
      ...(node.kind === "group" ? { height: node.height ?? 440, style: { width: `${width}px`, height: `${node.height ?? 440}px` } } : {}),
      draggable: false,
      selectable: node.kind !== "group",
      focusable: node.kind !== "group",
      ariaLabel: node.label,
      connectable: false,
      deletable: false,
      data: {
        label: node.label, text: node.text, prompt: node.prompt, media: node.media, width,
        handles: node.handles ?? [
          { id: "in", type: "target", dataType: "*" },
          { id: "out", type: "source", dataType: "*" },
        ],
      },
    };
  });
});
const edges = computed<Edge[]>(() => {
  const byId = new Map((canvas.value?.nodes ?? []).map(node => [node.id, node]));
  return (canvas.value?.edges ?? []).map(edge => ({
    id: edge.id, source: edge.source, target: edge.target,
    sourceHandle: edge.sourceHandle ?? byId.get(edge.source)?.handles?.find(handle => handle.type === "source")?.id ?? "out",
    targetHandle: edge.targetHandle ?? byId.get(edge.target)?.handles?.find(handle => handle.type === "target")?.id ?? "in",
    selectable: false, deletable: false,
  }));
});

function fitCanvas() {
  void flow.value?.fitView({ padding: 0.16, maxZoom: 1, minZoom: 0.03 });
}
</script>

<style lang="scss">
.exploreProcessDialog.el-dialog {
  display: flex;
  flex-direction: column;
  height: 90dvh;
  max-height: calc(100dvh - 20px);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(var(--ui-radius) * 2.5);

  .el-dialog__header {
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .processHeader {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 62px;
      padding: 10px 16px;

      .headerButton {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        margin: 0;
        padding: 0;
        color: var(--el-text-color-secondary);
        font-size: 18px;
      }

      .processTitle {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 10px;
        min-width: 0;

        h2 {
          overflow: hidden;
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .readOnlyLabel {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
          padding: 3px 6px;
          border-radius: 6px;
          background: var(--el-fill-color-light);
          color: var(--el-text-color-secondary);
          font-size: 11px;
          white-space: nowrap;
        }
      }

      .processHeaderActions { flex-shrink: 0; min-width: 0; max-width: 50%; }
    }
  }

  .el-dialog__body {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .processPreview {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .processCanvas {
      position: relative;
      flex: 1;
      min-height: 240px;
      background: var(--el-bg-color);

      .vue-flow__node { cursor: grab; }

      .canvasSelectPanel {
        margin: 16px;
        .canvasSelect {
          width: min(190px, 50vw);
          .el-select__wrapper {
            min-height: 36px;
            border-radius: 10px;
            background: var(--el-bg-color-overlay);
            box-shadow: 0 0 0 1px var(--el-border-color-lighter), 0 4px 14px rgb(0 0 0 / 4%);
          }
        }
      }

      .viewportActions {
        display: flex;
        align-items: center;
        gap: 2px;
        margin: 16px;
        padding: 3px 4px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 10px;
        background: var(--el-bg-color-overlay);
        box-shadow: 0 4px 14px rgb(0 0 0 / 4%);

        .viewportButton { width: 28px; height: 28px; margin: 0; padding: 0; color: var(--el-text-color-secondary); font-size: 16px; }
        .toolSeparator { width: 1px; height: 14px; margin: 0 4px; background: var(--el-border-color); }
        .zoomLabel { min-width: 42px; color: var(--el-text-color-secondary); font-size: 11px; text-align: center; font-variant-numeric: tabular-nums; }
      }

      .processNodeView {
        position: relative;

        .nodeDetails {
          position: absolute;
          top: calc(100% + 12px);
          left: 50%;
          z-index: 2;
          width: 660px;
          max-height: 360px;
          overflow: auto;
          transform: translateX(-50%);
          user-select: text;

          .nodeDetailSection {
            + .nodeDetailSection { margin-top: 16px; }
            h3 { margin: 0 0 8px; color: var(--el-text-color-secondary); font-size: 12px; font-weight: 500; }
          }
        }
        .processNode {
          .nodeImage {
            display: block;
            width: 100%;
            max-height: 240px;
            object-fit: contain;
            border-radius: var(--el-border-radius-base);
          }
          .nodeAudio { display: block; width: 100%; }
          .nodeText {
            min-height: 110px;
            max-height: 240px;
            overflow: auto;
            overflow-wrap: anywhere;
            user-select: text;
          }
        }
      }
    }
  }

  @media (max-width: 600px) {
    .el-dialog__header .processHeader {
      gap: 6px;
      padding: 10px;
      .processTitle { gap: 6px; h2 { font-size: 14px; } }
    }
    .processPreview .processCanvas {
      .canvasSelectPanel,
      .viewportActions { margin: 12px; }
    }
  }

  @media (pointer: coarse) {
    .el-dialog__header .processHeader .headerButton { width: 40px; height: 40px; }
    .processPreview .processCanvas .viewportActions .viewportButton { width: 40px; height: 40px; }
  }
}
</style>
