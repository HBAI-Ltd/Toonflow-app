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
        <el-tooltip :showArrow="false" :content="assetsVisible ? t('closeAssetLibrary') : t('openAssetLibrary')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
          <el-button
            class="toolButton"
            text
            :type="assetsVisible ? 'primary' : 'default'"
            :aria-pressed="assetsVisible"
            :aria-label="t('assetLibrary')"
            @click="assetsVisible = !assetsVisible">
            <icon-folders :size="17" />
          </el-button>
        </el-tooltip>
        <!-- trigger 用 contextmenu 是为了让整理按钮只由 arrangeNodes 控制显隐，同时仍保留点击外部自动关闭 -->
        <el-tooltip :showArrow="false" :content="t('arrangeCanvas')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]" :disabled="undoPopoverVisible">
          <span class="toolTrigger">
            <el-popover trigger="contextmenu" placement="top-start" :width="180" v-model:visible="undoPopoverVisible">
              <template #reference>
                <el-button class="toolButton" text :disabled="!canArrange" :aria-label="t('arrangeCanvas')" @click="arrangeNodes">
                  <icon-sitemap :size="17" />
                </el-button>
              </template>
              <div class="zoomMenu">
                <el-button class="zoomAction" style="width: 100%" text @click="undoArrange">{{ t("undoArrangement") }}</el-button>
              </div>
            </el-popover>
          </span>
        </el-tooltip>
        <el-tooltip :showArrow="false" :content="showMap ? t('hideMinimap') : t('showMinimap')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
          <el-button
            class="toolButton"
            text
            :type="showMap ? 'primary' : 'default'"
            :aria-pressed="showMap"
            :aria-label="t('showOrHideMinimap')"
            @click="showMap = !showMap">
            <icon-map :size="17" />
          </el-button>
        </el-tooltip>
        <el-tooltip :showArrow="false" :content="snapEnabled ? t('disableSnapToGrid') : t('enableSnapToGrid')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
          <el-button
            class="toolButton"
            text
            :type="snapEnabled ? 'primary' : 'default'"
            :aria-pressed="snapEnabled"
            :aria-label="t('snapToGrid')"
            @click="snapEnabled = !snapEnabled">
            <icon-magnet :size="17" />
          </el-button>
        </el-tooltip>
        <el-tooltip :showArrow="false" :content="showEdges ? t('hideConnections') : t('showConnections')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
          <el-button
            class="toolButton"
            text
            :type="showEdges ? 'primary' : 'default'"
            :aria-pressed="showEdges"
            :aria-label="t('showOrHideConnections')"
            @click="showEdges = !showEdges">
            <icon-arrow-guide :size="17" />
          </el-button>
        </el-tooltip>
        <el-tooltip :showArrow="false" :content="t('fitView')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]">
          <el-button class="toolButton" text :aria-label="t('fitView')" @click="fitView()">
            <icon-focus-centered :size="17" />
          </el-button>
        </el-tooltip>
        <el-tooltip :showArrow="false"
          :content="t('zoomMenuUseTheScroll')"
          placement="top"
          :hideAfter="0"
          :enterable="false"
          :triggerKeys="[]"
          :disabled="zoomMenuVisible">
          <span class="toolTrigger">
            <el-popover v-model:visible="zoomMenuVisible" trigger="click" placement="top-start" :width="216">
              <template #reference>
                <el-button
                  class="toolButton"
                  text
                  :aria-label="t('zoomMenu')"
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
                  :aria-label="t('zoomPercentage')"
                  @change="applyZoom">
                  <template #suffix>%</template>
                </el-input-number>
                <el-button class="zoomAction" text @click="zoomIn()">{{ t("zoomIn") }}</el-button>
                <el-button class="zoomAction" text @click="zoomOut()">{{ t("zoomOut") }}</el-button>
                <el-button class="zoomAction" text @click="fitView()">{{ t("fitScreen") }}</el-button>
              </div>
            </el-popover>
          </span>
        </el-tooltip>
        <el-tooltip :showArrow="false" :content="t('help')" placement="top" :hideAfter="0" :enterable="false" :triggerKeys="[]" :disabled="helpVisible">
          <span class="toolTrigger">
            <el-popover v-model:visible="helpVisible" trigger="click" placement="top-end" :width="196">
              <template #reference>
                <el-button class="toolButton" text :aria-label="t('help')">
                  <icon-help :size="17" />
                </el-button>
              </template>
              <div class="helpMenu">
                <el-button
                  class="helpAction"
                  tag="a"
                  text
                  :icon="IconBook"
                  href="https://qcn7xdsqgc4z.feishu.cn/docx/RXFqdgR2Xo0dXZxGfd0cZCGgnwf"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="helpVisible = false">
                  {{ t("tutorial") }}
                </el-button>
                <el-button
                  class="helpAction"
                  tag="a"
                  text
                  :icon="IconBug"
                  href="https://docs.qq.com/smartsheet/form/EmvmQBrmlPmr%2Fss_vsqk2v%2FvhiGzE?tab=ss_vsqk2v"
                  target="_blank"
                  rel="noopener noreferrer"
                  :title="t('toonflowFeatureRequestAndBug')"
                  @click="helpVisible = false">
                  {{ t("reportBug") }}
                </el-button>
                <el-button class="helpAction" text :icon="IconBrandWechat" @click="showContact('community')">{{ t("joinTheCommunity") }}</el-button>
                <el-button class="helpAction" text :icon="IconBriefcase" @click="showContact('business')">{{ t("businessInquiries") }}</el-button>
              </div>
            </el-popover>
          </span>
        </el-tooltip>
      </div>
    </elCard>
  </panel>
  <el-dialog v-model="contactVisible" :title="contactInfo.title" width="min(360px, calc(100vw - 32px))" alignCenter appendToBody>
    <div class="contactContent">
      <q-r-code
        :value="contactInfo.url"
        :size="192"
        type="svg"
        color="#000000"
        bgColor="#ffffff"
        borderless
        role="img"
        :aria-label="t('qrCode', { name: contactInfo.title })" />
      <p class="contactTip">{{ contactInfo.tip }}</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "@/pages/i18n";
import { getErrorDisplay } from "@toonflow/i18n";
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
const zoomMenuVisible = ref(false);
const helpVisible = ref(false);
const contactVisible = ref(false);
const contactType = ref<"community" | "business">("community");
const contacts = computed(() => ({
  community: {
    title: t("joinTheCommunity"),
    url: "https://work.weixin.qq.com/u/vc36adcc89845edcbe?v=5.0.3.63936&bb=85b8d228e8",
    tip: t("toonflowIsACommunitySupported"),
  },
  business: {
    title: t("businessInquiries"),
    url: "https://work.weixin.qq.com/u/vc0f54596c5837d05a?v=5.0.8.70675",
    tip: t("thisContactIsForBusiness"),
  },
}));
const contactInfo = computed(() => contacts.value[contactType.value]);
const flow = useVueFlow();
const { viewport, zoomTo, zoomIn, zoomOut, fitView, getNodes, updateNode } = flow;
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
    if (!controller.signal.aborted) ElMessage.error(error instanceof Error ? getErrorDisplay(error) : t("couldNotArrangeCanvas"));
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
    ElMessage.error(error instanceof Error ? getErrorDisplay(error) : t("couldNotUndoArrangement"));
  }
}
</script>

<style lang="scss" scoped>
.canvasControls {
  display: flex;
  align-items: center;
  gap: 6px;

  .toolTrigger {
    display: inline-flex;
  }

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
