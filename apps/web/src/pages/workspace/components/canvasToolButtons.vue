<template>
  <template v-for="button in buttons" :key="button">
    <el-tooltip v-if="button === 'add'" content="添加节点" :placement="placement" :showArrow="false" :hideAfter="0" :enterable="false" :triggerKeys="[]">
      <el-button class="toolButton addNodeButton" :class="{ sideAddButton: placement === 'right' }" :disabled="!ready" aria-label="添加节点" aria-haspopup="menu" @click="emit('add')">
        <icon-plus :size="18" aria-hidden="true" />
      </el-button>
    </el-tooltip>
    <el-tooltip v-else-if="button === 'pointer'" :content="toolHint" :placement="placement" :showArrow="false" :hideAfter="0" :enterable="false" :triggerKeys="[]">
      <el-button class="toolButton" text :type="selectedTool === 'move' ? 'default' : 'primary'" :aria-label="toolHint" @click="selectedTool = currentTool.next">
        <component :is="currentTool.icon" :size="18" aria-hidden="true" />
      </el-button>
    </el-tooltip>
    <el-tooltip v-else-if="button === 'search'" content="搜索节点" :placement="placement" :showArrow="false" :hideAfter="0" :enterable="false" :triggerKeys="[]">
      <el-button class="toolButton" text :disabled="!ready" aria-label="搜索节点" @click="emit('search')">
        <icon-search :size="18" aria-hidden="true" />
      </el-button>
    </el-tooltip>
    <el-tooltip v-else-if="button === 'assets' && hasCanvas && currentUser?.role !== 'user'" :content="assetsVisible ? '关闭素材库' : '打开素材库'" :placement="placement" :showArrow="false" :hideAfter="0" :enterable="false" :triggerKeys="[]">
      <el-button class="toolButton" text :type="assetsVisible ? 'primary' : 'default'" :aria-pressed="assetsVisible" aria-label="素材库" @click="assetsVisible = !assetsVisible">
        <icon-folders :size="18" aria-hidden="true" />
      </el-button>
    </el-tooltip>
    <el-tooltip v-else-if="button === 'help'" content="帮助" :placement="placement" :showArrow="false" :hideAfter="0" :enterable="false" :triggerKeys="[]" :disabled="helpVisible">
      <span class="toolTrigger">
        <el-popover v-model:visible="helpVisible" trigger="click" :placement="`${placement}-end`" width="max-content" popperClass="canvasToolPopover">
          <template #reference>
            <el-button class="toolButton" text aria-label="帮助"><icon-help :size="18" /></el-button>
          </template>
          <div class="helpMenu">
            <el-button tag="a" text :icon="IconBook" href="https://qcn7xdsqgc4z.feishu.cn/docx/RXFqdgR2Xo0dXZxGfd0cZCGgnwf" target="_blank" rel="noopener noreferrer" @click="helpVisible = false">
              使用教程
            </el-button>
            <el-button tag="a" text :icon="IconBug" href="https://docs.qq.com/smartsheet/form/EmvmQBrmlPmr%2Fss_vsqk2v%2FvhiGzE?tab=ss_vsqk2v" target="_blank" rel="noopener noreferrer" title="Toonflow 需求/BUG反馈表" @click="helpVisible = false">
              汇报 BUG
            </el-button>
            <el-button text :icon="IconBrandWechat" @click="showContact('community')">加入交流群</el-button>
            <el-button text :icon="IconBriefcase" @click="showContact('business')">商务合作</el-button>
          </div>
        </el-popover>
      </span>
    </el-tooltip>
  </template>
  <el-dialog v-if="hasHelp" v-model="contactVisible" :title="translate(contactInfo.title)" width="min(360px, calc(100vw - 32px))" alignCenter appendToBody>
    <div class="contactContent">
      <q-r-code :value="contactInfo.url" :size="192" type="svg" color="#000000" bgColor="#ffffff" borderless role="img" :aria-label="`${translate(contactInfo.title)}二维码`" />
      <p class="contactTip">{{ translate(contactInfo.tip) }}</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { markMessages, translate } from "@toonflow/i18n/vue";
import { computed, ref, watch } from "vue";
import { IconPointer, IconHandStop, IconMarquee2, IconPlus, IconSearch, IconFolders, IconHelp, IconBook, IconBug, IconBrandWechat, IconBriefcase } from "@tabler/icons-vue";
import { QRCode } from "tdesign-vue-next";
import { touchScreen } from "@/lib/platform";
import { currentUser } from "@/stores/multiTenant";

export type CanvasToolButton = "add" | "pointer" | "search" | "assets" | "help";
export type CanvasPointerTool = "move" | "hand" | "select";
const props = withDefaults(defineProps<{
  buttons: readonly CanvasToolButton[];
  placement?: "top" | "right" | "bottom";
  ready?: boolean;
  hasCanvas?: boolean;
}>(), { placement: "top" });
const emit = defineEmits<{ add: []; search: [] }>();
const selectedTool = defineModel<CanvasPointerTool>("selectedTool", { default: "move" });
const assetsVisible = defineModel<boolean>("assetsVisible", { default: false });
const canvasTools = markMessages({
  move: { label: "移动", icon: IconPointer, next: "hand" },
  hand: { label: "抓手工具", icon: IconHandStop, next: touchScreen ? "select" : "move" },
  select: { label: "框选与多选", icon: IconMarquee2, next: "move" },
} as const);
const currentTool = computed(() => canvasTools[selectedTool.value]);
const toolHint = computed(() => `${translate(currentTool.value.label)} → ${translate(canvasTools[currentTool.value.next].label)}`);

const hasHelp = computed(() => props.buttons.includes("help"));
const helpVisible = ref(false);
const contactVisible = ref(false);
const contactType = ref<"community" | "business">("community");
const contacts = markMessages({
  community: {
    title: "加入交流群",
    url: "https://work.weixin.qq.com/u/vc66e4c7f8432af0d8?v=5.0.13.84802&bb=c03c3ad130",
    tip: "Toonflow 是为爱发电的开源项目。欢迎文明交流、友善反馈；回复可能需要一些时间，请避免责问或命令式沟通，感谢你的理解与尊重。",
  },
  business: {
    title: "商务合作",
    url: "https://work.weixin.qq.com/u/vc66e4c7f8432af0d8?v=5.0.13.84802&bb=c03c3ad130",
    tip: "此联系方式仅用于商务合作接洽，不提供问题答疑。使用问题欢迎在交流群交流，需求与 BUG 可通过反馈表提交。感谢理解。",
  },
});
const contactInfo = computed(() => contacts[contactType.value]);
watch(hasHelp, visible => {
  if (visible) return;
  helpVisible.value = false;
  contactVisible.value = false;
});

function showContact(type: "community" | "business") {
  contactType.value = type;
  helpVisible.value = false;
  contactVisible.value = true;
}
</script>

<style scoped lang="scss">
.toolButton.el-button {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;

  &.addNodeButton {
    margin-right: 6px;
    color: var(--el-bg-color);
    background: var(--el-text-color-primary);
    border-color: transparent;

    &.sideAddButton { margin: 0 0 6px; }
    &:hover { opacity: 0.85; }
    &.is-disabled { opacity: 0.45; }
  }

  @media (any-pointer: coarse) {
    width: 36px;
    height: 36px;
  }
}

.toolTrigger { display: inline-flex; }

.helpMenu {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
