<template>
  <div v-if="task" class="automationBar">
    <button class="taskDetails" type="button" aria-haspopup="dialog" :aria-label="label" :title="label" @click="emit('open')">
      <component :is="running ? IconPlayerPlay : IconClock" class="scheduleIcon" :size="15" aria-hidden="true" />
      <span class="taskName" dir="auto">{{ task.name }}</span>
      <span v-if="eligible.length > 1" class="taskCount" dir="ltr">+{{ eligible.length - 1 }}</span>
      <span class="taskTime" :class="{ running }">{{ status }}</span>
      <icon-chevron-right class="openIcon" :size="13" aria-hidden="true" />
    </button>
    <button class="cancelTask" type="button" :disabled="cancelling" :aria-label="translate('取消任务') + ' · ' + task.name"
      :title="translate('取消任务')" @click="emit('cancel', task)"><icon-x :size="15" aria-hidden="true" /></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconChevronRight, IconClock, IconPlayerPlay, IconX } from "@tabler/icons-vue";
import { locale, t, translate } from "@toonflow/i18n/vue";
import type { AgentAutomation } from "@toonflow/server/agent/types";

const props = defineProps<{ tasks: AgentAutomation[]; sessionFile?: string; cancelling: boolean }>();
const emit = defineEmits<{ open: []; cancel: [task: AgentAutomation] }>();
const eligible = computed(() => props.tasks.filter(item => !item.cancelledAt && (!item.sessionFile || item.sessionFile === props.sessionFile)
  && (item.queued || item.runs[0]?.status === "running" || (item.enabled && item.nextRunAt !== null))));
const task = computed(() => eligible.value.find(item => item.runs[0]?.status === "running")
  ?? eligible.value.find(item => item.queued)
  ?? eligible.value.reduce<AgentAutomation | undefined>((first, item) => !first || item.nextRunAt! < first.nextRunAt! ? item : first, undefined));
const running = computed(() => task.value?.runs[0]?.status === "running");
const dueAt = computed(() => running.value || task.value?.queued ? undefined : task.value?.nextRunAt);
const now = ref(Date.now());
const relativeTime = computed(() => new Intl.RelativeTimeFormat(locale.value, { style: "short" }));
const status = computed(() => {
  if (running.value) return translate("运行中");
  const seconds = Math.ceil(((dueAt.value ?? 0) - now.value) / 1000);
  if (seconds <= 0) return translate("等待执行");
  if (seconds < 60) return relativeTime.value.format(seconds, "second");
  if (seconds < 3600) return relativeTime.value.format(Math.ceil(seconds / 60), "minute");
  if (seconds < 86400) return relativeTime.value.format(Math.round(seconds / 3600), "hour");
  return relativeTime.value.format(Math.round(seconds / 86400), "day");
});
const label = computed(() => [
  translate("自动化任务"), task.value?.name, status.value,
  dueAt.value && translate("下次运行") + " " + new Date(dueAt.value).toLocaleString(locale.value),
  eligible.value.length > 1 && t`另有 ${eligible.value.length - 1} 项任务`,
].filter(Boolean).join(" · "));

watch(dueAt, (at, _, onCleanup) => {
  if (!at) return;
  let timer: number | undefined;
  const tick = () => {
    now.value = Date.now();
    const remaining = at - now.value;
    if (remaining <= 0) return;
    const step = remaining > 60000 ? 60000 : 1000;
    timer = window.setTimeout(tick, remaining % step || step);
  };
  tick();
  onCleanup(() => window.clearTimeout(timer));
}, { immediate: true });
</script>

<style scoped lang="scss">
.automationBar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-width: 0;
  min-height: 32px;
  margin: 0 22px 3px;
  padding: 0 3px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 12px;
  text-align: start;
  button {
    display: flex; align-items: center; justify-content: center; min-height: 28px;
    border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer;
    &:hover { background: var(--el-fill-color-light); }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }
  .taskDetails {
    flex: 1; min-width: 0; padding: 3px 5px; gap: 6px;
    .scheduleIcon { flex-shrink: 0; color: var(--el-color-primary); }
    .taskName { min-width: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .taskCount { flex-shrink: 0; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
    .taskTime { flex-shrink: 0; margin-inline-start: auto; font-variant-numeric: tabular-nums; }
    .taskTime.running { color: var(--el-color-primary); }
    .openIcon { flex-shrink: 0; color: var(--el-text-color-secondary); }
  }
  .cancelTask {
    flex: 0 0 28px; color: var(--el-text-color-secondary);
    &:hover { color: var(--el-color-danger); }
    &:disabled { opacity: .5; cursor: wait; }
  }
  &:dir(rtl) .openIcon { transform: scaleX(-1); }
}
</style>
