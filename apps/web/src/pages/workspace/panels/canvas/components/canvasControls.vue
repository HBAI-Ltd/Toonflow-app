<template>
  <mini-map
    v-if="showMap"
    class="canvasMiniMap"
    position="bottom-left"
    :width="canvasLayout.side ? Math.min(200, Math.max(1, flow.dimensions.value.width - 84)) : undefined"
    :class="{ besideControls: canvasLayout.centerControls }"
    :pannable="true"
    :zoomable="true"
    nodeColor="var(--el-fill-color-dark)"
    maskColor="var(--el-mask-color-extra-light)"
    @click="({ position }) => setCenter(position.x, position.y, { zoom: viewport.zoom, duration: 250 })" />
  <panel class="canvasControlsPanel" :position="canvasLayout.centerControls ? 'bottom-center' : 'bottom-left'">
    <el-card class="canvasControlsCard" shadow="never" :bodyStyle="{ padding: '2px 4px' }">
      <div class="canvasControls">
        <template v-for="group in canvasLayout.controls" :key="group">
          <template v-if="group === 'view'">
            <!-- trigger 用 contextmenu 是为了让整理按钮只由 arrangeNodes 控制显隐，同时仍保留点击外部自动关闭 -->
            <el-tooltip :showArrow="false" content="整理画布" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]" :disabled="undoPopoverVisible">
              <span class="toolTrigger">
                <el-popover trigger="contextmenu" placement="top-start" width="max-content" popperClass="canvasToolPopover" v-model:visible="undoPopoverVisible">
                  <template #reference>
                    <el-button class="toolButton" text :disabled="!canArrange" aria-label="整理画布" @click="arrangeNodes">
                      <icon-sitemap :size="18" />
                    </el-button>
                  </template>
                  <div class="zoomMenu">
                    <el-button text @click="undoArrange">撤销整理</el-button>
                  </div>
                </el-popover>
              </span>
            </el-tooltip>
            <el-tooltip :showArrow="false" :content="showMap ? '隐藏地图' : '显示地图'" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
              <el-button
                class="toolButton"
                text
                :type="showMap ? 'primary' : 'default'"
                :aria-pressed="showMap"
                aria-label="显示或隐藏地图"
                @click="showMap = !showMap">
                <icon-map :size="18" />
              </el-button>
            </el-tooltip>
            <el-tooltip :showArrow="false" :content="snapEnabled ? '关闭网格吸附' : '开启网格吸附'" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
              <el-button
                class="toolButton"
                text
                :type="snapEnabled ? 'primary' : 'default'"
                :aria-pressed="snapEnabled"
                aria-label="网格吸附"
                @click="snapEnabled = !snapEnabled">
                <icon-magnet :size="18" />
              </el-button>
            </el-tooltip>
            <el-tooltip :showArrow="false" :content="showEdges ? '隐藏连线' : '显示连线'" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
              <el-button
                class="toolButton"
                text
                :type="showEdges ? 'primary' : 'default'"
                :aria-pressed="showEdges"
                aria-label="显示或隐藏连线"
                @click="showEdges = !showEdges">
                <icon-arrow-guide :size="18" />
              </el-button>
            </el-tooltip>
            <el-tooltip :showArrow="false" content="适应视图" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
              <el-button class="toolButton" text aria-label="适应视图" @click="fitView({ duration: 250 })">
                <icon-focus-centered :size="18" />
              </el-button>
            </el-tooltip>
          </template>
          <el-tooltip
            v-else-if="group === 'zoom'"
            :showArrow="false"
            content="缩放菜单（滚轮调整缩放）"
            placement="top"
            :hideAfter="0"
            :enterable="false"
            :triggerKeys="[]"
            :disabled="zoomMenuVisible">
            <span class="toolTrigger">
              <el-popover v-model:visible="zoomMenuVisible" trigger="click" placement="top-start" width="max-content" popperClass="canvasToolPopover">
                <template #reference>
                  <el-button
                    class="toolButton"
                    text
                    aria-label="缩放菜单"
                    @wheel.stop.prevent="$event.deltaY && applyZoom(Math.min(800, Math.max(20, zoomPercent - Math.sign($event.deltaY))))">
                    {{ zoomPercent }}%
                  </el-button>
                </template>
                <div class="zoomMenu">
                  <el-input-number
                    class="zoomInput"
                    :modelValue="zoomPercent"
                    :min="20"
                    :max="800"
                    :controls="false"
                    aria-label="缩放百分比"
                    @change="applyZoom">
                    <template #suffix>%</template>
                  </el-input-number>
                  <el-button text @click="zoomIn()">放大</el-button>
                  <el-button text @click="zoomOut()">缩小</el-button>
                  <el-button text @click="fitView({ duration: 250 })">适合屏幕</el-button>
                </div>
              </el-popover>
            </span>
          </el-tooltip>
          <canvasToolButtons
            v-else-if="active"
            v-model:selectedTool="selectedTool"
            v-model:assetsVisible="assetsVisible"
            :buttons="[group]"
            :ready="ready"
            hasCanvas
            placement="top"
            @search="emit('search')" />
        </template>
      </div>
    </el-card>
  </panel>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Panel, useVueFlow, type XYPosition } from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import { IconMap, IconMagnet, IconFocusCentered } from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import canvasToolButtons, { type CanvasPointerTool } from "@/pages/workspace/components/canvasToolButtons.vue";
import { generalSettings } from "@/stores/settings";
import { canvasLayouts } from "@/lib/canvasLayouts";
import { arrangeCanvas } from "../arrangeCanvas";

const props = defineProps<{
  active: boolean;
  ready: boolean;
  canvasId: string;
  directory: string | undefined;
  batchHistory: (action: () => Promise<void>) => Promise<void>;
}>();
const emit = defineEmits<{ search: [] }>();
const canvasLayout = computed(() => canvasLayouts[generalSettings.value.canvasLayoutMode]);
const selectedTool = defineModel<CanvasPointerTool>("selectedTool", { required: true });
const snapEnabled = defineModel<boolean>("snapEnabled", { required: true });
const showEdges = defineModel<boolean>("showEdges", { required: true });
const assetsVisible = defineModel<boolean>("assetsVisible", { default: false });
const showMap = ref(false);
const zoomMenuVisible = ref(false);
const flow = useVueFlow();
const { viewport, zoomTo, zoomIn, zoomOut, fitView, setCenter, getNodes, updateNode } = flow;
const zoomPercent = computed(() => Math.round(viewport.value.zoom * 100));
const layoutSnapshot = ref<{ id: string; position: XYPosition }[]>();
const undoPopoverVisible = ref(false);
const arranging = ref(false);
let arrangeController: AbortController | undefined;
const canArrange = computed(() => {
  const nodes = getNodes.value.filter((node) => !node.parentNode);
  return (
    !!props.canvasId &&
    !!props.directory &&
    !arranging.value &&
    nodes.length > 0 &&
    nodes.every((node) => node.dimensions.width > 0 && node.dimensions.height > 0)
  );
});
defineExpose({ arrangeNodes });

watch(
  () => [props.canvasId, props.directory],
  () => {
    arrangeController?.abort();
    layoutSnapshot.value = undefined;
    undoPopoverVisible.value = false;
  },
  { flush: "sync" }
);
onBeforeUnmount(() => arrangeController?.abort());

function applyZoom(value: number | undefined) {
  if (value !== undefined && Number.isFinite(value)) void zoomTo(value / 100);
}

async function arrangeNodes() {
  if (!canArrange.value) return;
  const controller = new AbortController();
  arrangeController = controller;
  arranging.value = true;
  try {
    await props.batchHistory(async () => {
      const { snapshot, arrangedNodeIds } = await arrangeCanvas(flow, controller.signal);
      controller.signal.throwIfAborted();
      if (!arrangedNodeIds.length) return;
      layoutSnapshot.value = snapshot;
      undoPopoverVisible.value = true;
    });
  } catch (error) {
    if (!controller.signal.aborted) ElMessage.error(error instanceof Error ? error.message : "整理画布失败");
  } finally {
    arrangeController = undefined;
    arranging.value = false;
  }
}

async function undoArrange() {
  const snapshot = layoutSnapshot.value;
  if (!snapshot) return;
  try {
    await props.batchHistory(async () => {
      const nodeIds = new Set(getNodes.value.map((node) => node.id));
      snapshot.forEach(({ id, position }) => {
        if (nodeIds.has(id)) updateNode(id, { position });
      });
      layoutSnapshot.value = undefined;
      undoPopoverVisible.value = false;
    });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "撤销整理失败");
  }
}
</script>

<style lang="scss" scoped>
.canvasMiniMap.vue-flow__minimap { bottom: 46px; }

// 触屏放大控制按钮，地图与窄屏避让距离按 42px 的卡片高度同步；须写在窄屏规则之前，避免覆盖窄屏位置。
@media (any-pointer: coarse) {
  .canvasMiniMap.vue-flow__minimap { bottom: 54px; }
}

[data-canvas-layout="default"] {
  @container canvasWorkspace (max-width: 1040px) {
    .canvasControlsPanel.vue-flow__panel { bottom: 46px; }
    .canvasMiniMap.vue-flow__minimap { bottom: 92px; }

    @media (any-pointer: coarse) {
      .canvasControlsPanel.vue-flow__panel { bottom: 54px; }
      .canvasMiniMap.vue-flow__minimap { bottom: 108px; }
    }
  }
}

.canvasControlsPanel.vue-flow__panel.center { margin-inline: 0; }

.sideToolbar {
  .canvasControlsPanel {
    max-width: calc(100% - 30px);
    .canvasControlsCard { overflow-x: auto; scrollbar-width: none; }
  }

  // 矮屏的小地图与左侧工具栏处于同一高度，向内错开一个按钮的宽度。
  @media (max-height: 640px) {
    .canvasMiniMap.vue-flow__minimap { left: 54px; }
  }
}

@container canvasWorkspace (min-width: 769px) {
  .canvasMiniMap.vue-flow__minimap.besideControls { bottom: 0; }
}

.canvasControlsCard { height: 34px; box-sizing: border-box; }

@media (any-pointer: coarse) {
  .canvasControlsCard { height: 42px; }
}

.canvasControls {
  display: flex;
  align-items: center;
  gap: 2px;

  .toolTrigger {
    display: inline-flex;
  }

  .toolButton {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    margin-left: 0;
    padding: 0;
    font-size: 12px;
    font-variant-numeric: tabular-nums;

    @media (any-pointer: coarse) {
      width: 36px;
      height: 36px;
    }
  }
}

.zoomMenu {
  display: flex;
  flex-direction: column;

  .zoomInput {
    width: 100%;
  }
}
</style>
