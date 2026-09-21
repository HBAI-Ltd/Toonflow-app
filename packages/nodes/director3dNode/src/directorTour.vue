<template>
  <el-tour v-model="open" :targetAreaClickable="false" :contentStyle="{ maxWidth: 'calc(100vw - 32px)' }" @close="complete">
    <el-tour-step
      v-for="(step, index) in steps"
      :key="step.target"
      :target="() => root?.querySelector<HTMLElement>(step.target) ?? null"
      :title="step.title"
      :description="step.description"
      :prevButtonProps="{ children: '上一步' }"
      :nextButtonProps="{ children: index === steps.length - 1 ? '开始使用' : '下一步' }" />
    <template #indicators="{ current, total }">{{ current + 1 }} / {{ total }}</template>
  </el-tour>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElTour, ElTourStep } from "element-plus";

defineProps<{ root?: HTMLElement }>();
const storageKey = "toonflow.director3dTour";
const open = ref(localStorage.getItem(storageKey) !== "true");
const steps = [
  {
    target: ".chatFooter",
    title: "生成场景与方案",
    description: "描述场景模型、人物动作和镜头要求，再点击“生成方案”。画布上如果有链接的文本、图片和视频，可以通过 @ 引用。",
  },
  {
    target: ".planContent",
    title: "查看与切换方案",
    description: "生成的方案会出现在这里。点击方案从头预览对应动画，并查看生成时的输入提示词；也可以继续输入要求生成新方案。多个方案共用基础场景和模型。",
  },
  {
    target: ".viewport",
    title: "第一人称取景",
    description: "点击三维画面后，用鼠标调整朝向。WASD 移动，空格上升，Shift 下降，滚轮调焦；左键或 Esc 退出取景。",
  },
  {
    target: ".stagePanel .referenceList",
    title: "记录关键帧",
    description: "取景时按右键，或点击“添加关键帧”记录当前镜头。这里的关键帧可以拖动排序、点击回看或删除。再次生成方案时，AI 会参考这些取景及其顺序设计运镜。点击导出按钮可以导出关键帧图片。",
  },
  {
    target: ".playbackBar",
    title: "播放与画面设置",
    description: "用播放按钮和进度条检查动画；在这里调整画面比例、网格、天空与光照，让预演画面更符合你的想法。",
  },
  {
    target: '[aria-label="导出视频节点"]',
    title: "导出到画布",
    description: "选中方案后，点击这里导出视频节点。关键帧缩略图上的导出按钮可以生成图片节点。视频导出期间请保持窗口可见，完成后回到画布查看结果。",
  },
];

function complete() {
  localStorage.setItem(storageKey, "true");
}
</script>
