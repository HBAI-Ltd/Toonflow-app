<template>
  <el-tour v-model="open" :targetAreaClickable="false" :contentStyle="{ maxWidth: 'calc(100vw - 32px)' }" @close="complete">
    <el-tour-step
      v-for="(step, index) in steps"
      :key="step.target"
      :target="() => root?.querySelector<HTMLElement>(step.target) ?? null"
      :title="step.title"
      :description="step.description"
      :prevButtonProps="{ children: t('previousStep') }"
      :nextButtonProps="{ children: index === steps.length - 1 ? t('startUsing') : t('nextStep') }" />
    <template #indicators="{ current, total }">{{ current + 1 }} / {{ total }}</template>
  </el-tour>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElTour, ElTourStep } from "element-plus";
import { t } from "./i18n";

defineProps<{ root?: HTMLElement }>();
const storageKey = "toonflow.director3dTour";
const open = ref(localStorage.getItem(storageKey) !== "true");
const steps = computed(() => [
  {
    target: ".chatFooter",
    title: t("tourGenerateTitle"),
    description: t("tourGenerateDescription"),
  },
  {
    target: ".planContent",
    title: t("tourPlansTitle"),
    description: t("tourPlansDescription"),
  },
  {
    target: ".viewport",
    title: t("tourFramingTitle"),
    description: t("tourFramingDescription"),
  },
  {
    target: ".stagePanel .referenceList",
    title: t("tourKeyframesTitle"),
    description: t("tourKeyframesDescription"),
  },
  {
    target: ".playbackBar",
    title: t("tourPlaybackTitle"),
    description: t("tourPlaybackDescription"),
  },
  {
    target: `[aria-label="${t("exportVideoNode")}"]`,
    title: t("tourExportTitle"),
    description: t("tourExportDescription"),
  },
]);

function complete() {
  localStorage.setItem(storageKey, "true");
}
</script>
