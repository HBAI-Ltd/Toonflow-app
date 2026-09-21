<template>
  <mini-map
    v-if="showMap"
    position="bottom-left"
    :style="{ bottom: '64px' }"
    :pannable="true"
    :zoomable="true"
    node-color="var(--el-fill-color-dark)"
    mask-color="var(--el-mask-color-extra-light)" />
  <panel position="bottom-left">
    <elCard shadow="never" :body-style="{ padding: '4px' }">
      <div class="canvasControls">
        <el-button class="toolButton" text :type="assetsVisible ? 'primary' : 'default'" :aria-pressed="assetsVisible" aria-label="素材库" title="素材库" @click="assetsVisible = !assetsVisible">
          <icon-folders :size="17" />
        </el-button>
        <!-- trigger 用 contextmenu 是为了让整理按钮只由 arrangeNodes 控制显隐，同时仍保留点击外部自动关闭 -->
        <el-popover trigger="contextmenu" placement="top-start" :width="180" v-model:visible="undoPopoverVisible">
          <template #reference>
            <el-button class="toolButton" text :disabled="!canArrange" aria-label="整理画布" title="整理画布" @click="arrangeNodes">
              <icon-sitemap :size="17" />
            </el-button>
          </template>
          <div class="zoomMenu">
            <el-button class="zoomAction" style="width: 100%" text @click="undoArrange">撤销整理</el-button>
          </div>
        </el-popover>
        <el-button
          class="toolButton"
          text
          :type="showMap ? 'primary' : 'default'"
          :aria-pressed="showMap"
          aria-label="显示或隐藏地图"
          title="显示或隐藏地图"
          @click="showMap = !showMap">
          <icon-map :size="17" />
        </el-button>
        <el-button
          class="toolButton"
          text
          :type="snapEnabled ? 'primary' : 'default'"
          :aria-pressed="snapEnabled"
          aria-label="网格吸附"
          title="网格吸附"
          @click="snapEnabled = !snapEnabled">
          <icon-magnet :size="17" />
        </el-button>
        <el-button
          class="toolButton"
          text
          :type="showEdges ? 'primary' : 'default'"
          :aria-pressed="showEdges"
          aria-label="显示或隐藏连线"
          :title="showEdges ? '隐藏连线' : '显示连线'"
          @click="showEdges = !showEdges">
          <icon-arrow-guide :size="17" />
        </el-button>
        <el-button class="toolButton" text aria-label="适应视图" title="适应视图" @click="fitView()">
          <icon-focus-centered :size="17" />
        </el-button>
        <el-popover trigger="click" placement="top-start" :width="216">
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
              :model-value="zoomPercent"
              :min="20"
              :max="800"
              :controls="false"
              aria-label="缩放百分比"
              @change="applyZoom">
              <template #suffix>%</template>
            </el-input-number>
            <el-button class="zoomAction" text @click="zoomIn()">放大</el-button>
            <el-button class="zoomAction" text @click="zoomOut()">缩小</el-button>
            <el-button class="zoomAction" text @click="fitView()">适合屏幕</el-button>
          </div>
        </el-popover>
        <el-popover v-model:visible="helpVisible" trigger="click" placement="top-end" :width="196">
          <template #reference>
            <el-button class="toolButton" text aria-label="帮助" title="帮助">
              <icon-help :size="17" />
            </el-button>
          </template>
          <div class="helpMenu">
            <el-button
              class="helpAction"
              tag="a"
              text
              :icon="IconBook"
              href="https://bcn73rj0zcx7.feishu.cn/docx/Ps90dTzumoFppLxAHqocimGenFf?from=from_copylink"
              target="_blank"
              rel="noopener noreferrer"
              @click="helpVisible = false">
              使用教程
            </el-button>
            <el-button
              class="helpAction"
              tag="a"
              text
              :icon="IconBug"
              href="https://docs.qq.com/smartsheet/form/EmvmQBrmlPmr%2Fss_vsqk2v%2FvhiGzE?tab=ss_vsqk2v"
              target="_blank"
              rel="noopener noreferrer"
              title="Toonflow 需求/BUG反馈表"
              @click="helpVisible = false">
              汇报 BUG
            </el-button>
            <el-button class="helpAction" text :icon="IconBrandWechat" @click="showContact('community')">加入交流群</el-button>
            <el-button class="helpAction" text :icon="IconBriefcase" @click="showContact('business')">商务合作</el-button>
          </div>
        </el-popover>
      </div>
    </elCard>
  </panel>
  <el-dialog v-model="contactVisible" :title="contactInfo.title" width="min(360px, calc(100vw - 32px))" alignCenter appendToBody>
    <div class="contactContent">
      <q-r-code :value="contactInfo.url" :size="192" type="svg" color="#000000" bgColor="#ffffff" borderless role="img" :aria-label="`${contactInfo.title}二维码`" />
      <p class="contactTip">{{ contactInfo.tip }}</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Panel, useVueFlow, type XYPosition } from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import { IconMap, IconMagnet, IconFocusCentered, IconHelp, IconBook, IconBug, IconBrandWechat, IconBriefcase } from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import { QRCode } from "tdesign-vue-next";
import { arrangeCanvas } from "../arrangeCanvas";

const props = defineProps<{
  canvasId: string;
  directory: string | undefined;
  batchHistory: (action: () => Promise<void>) => Promise<void>;
}>();
const snapEnabled = defineModel<boolean>("snapEnabled", { required: true });
const showEdges = defineModel<boolean>("showEdges", { required: true });
const assetsVisible = defineModel<boolean>("assetsVisible", { default: false });
const showMap = ref(false);
const helpVisible = ref(false);
const contactVisible = ref(false);
const contactType = ref<"community" | "business">("community");
const contacts = {
  community: {
    title: "加入交流群",
    url: "https://work.weixin.qq.com/u/vc36adcc89845edcbe?v=5.0.3.63936&bb=85b8d228e8",
    tip: "Toonflow 是为爱发电的开源项目。欢迎文明交流、友善反馈；回复可能需要一些时间，请避免责问或命令式沟通，感谢你的理解与尊重。",
  },
  business: {
    title: "商务合作",
    url: "https://work.weixin.qq.com/u/vc0f54596c5837d05a?v=5.0.8.70675",
    tip: "此联系方式仅用于商务合作接洽，不提供问题答疑。使用问题欢迎在交流群交流，需求与 BUG 可通过反馈表提交。感谢理解。",
  },
};
const contactInfo = computed(() => contacts[contactType.value]);
const flow = useVueFlow();
const { viewport, zoomTo, zoomIn, zoomOut, fitView, getNodes, updateNode } = flow;
const zoomPercent = computed(() => Math.round(viewport.value.zoom * 100));
const layoutSnapshot = ref<{ id: string; position: XYPosition }[]>();
const undoPopoverVisible = ref(false);
const arranging = ref(false);
let arrangeController: AbortController | undefined;
const canArrange = computed(() => {
  const nodes = getNodes.value.filter((node) => !node.parentNode);
  return !!props.canvasId && !!props.directory && !arranging.value && nodes.length > 0
    && nodes.every((node) => node.dimensions.width > 0 && node.dimensions.height > 0);
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

function showContact(type: "community" | "business") {
  contactType.value = type;
  helpVisible.value = false;
  contactVisible.value = true;
}

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
.canvasControls {
  display: flex;
  align-items: center;
  gap: 6px;

  .toolButton {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    margin-left: 0;
    padding: 0;
  }
}

.zoomMenu {
  display: flex;
  flex-direction: column;

  .zoomInput {
    width: 100%;
  }

  .zoomAction {
    justify-content: flex-start;
    margin-left: 0;
  }
}

.helpMenu {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .helpAction {
    justify-content: flex-start;
    margin-left: 0;
  }
}

.contactContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .contactTip {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.7;
  }
}
</style>
