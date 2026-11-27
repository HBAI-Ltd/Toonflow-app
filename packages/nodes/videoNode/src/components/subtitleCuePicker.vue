<template>
  <div class="cuePicker" role="group" :aria-label="label">
    <div class="cueHeader">
      <strong>{{ label }}</strong>
      <slot name="navigation" />
      <input v-if="eligible.length > pageSize" v-model="query" type="search" aria-label="搜索字幕" placeholder="搜索字幕" />
    </div>
    <div class="cueList">
      <button v-for="cue in pageCues" :key="cue.index" type="button" :aria-pressed="modelValue === cue.index" :title="cue.text"
        @click="emit('choose', cue.index)">
        <time>{{ timestamp(cue.start) }}</time><span>{{ cue.text }}</span>
      </button>
      <small v-if="!pageCues.length" role="status">没有匹配的字幕</small>
    </div>
    <div v-if="pages > 1" class="cuePages">
      <el-button size="small" :icon="IconChevronLeft" :disabled="page <= 1" aria-label="上一页" @click="page--" />
      <output>{{ page }} / {{ pages }}</output>
      <el-button size="small" :icon="IconChevronRight" :disabled="page >= pages" aria-label="下一页" @click="page++" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElButton } from "element-plus";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-vue";
import { timestamp } from "../videoSubtitleTiming";

const props = defineProps<{ label: string; cues: { start: number; text: string }[]; modelValue: number; after?: number }>();
const emit = defineEmits<{ choose: [index: number] }>();
const query = ref("");
const page = ref(1);
const pageSize = 5;
const eligible = computed(() => props.cues.map((cue, index) => ({ ...cue, index })).filter(cue => props.after === undefined || cue.start > props.after));
const matches = computed(() => {
  const term = query.value.trim().toLocaleLowerCase();
  return term ? eligible.value.filter(cue => cue.text.toLocaleLowerCase().includes(term) || timestamp(cue.start).includes(term)) : eligible.value;
});
const pages = computed(() => Math.ceil(matches.value.length / pageSize));
const pageCues = computed(() => matches.value.slice((page.value - 1) * pageSize, page.value * pageSize));
function pageOf(index: number) {
  return Math.ceil((matches.value.findIndex(row => row.index === index) + 1) / pageSize);
}
watch(matches, () => { page.value = pageOf(props.modelValue) || 1; }, { immediate: true });
watch(() => props.modelValue, index => {
  const target = pageOf(index);
  if (target && !query.value.trim()) page.value = target;
});
</script>

<style scoped lang="scss">
.cuePicker {
  min-width: 0; display: grid; gap: 6px;
  .cueHeader {
    display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 6px;
    strong { font-size: 13px; font-weight: 500; }
    input {
      min-width: 0; max-width: 100%; padding: 5px 9px; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base);
      font: inherit; background: var(--el-bg-color); color: var(--el-text-color-primary);
    }
  }
  .cueList {
    display: grid; gap: 2px;
    button {
      display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 10px; padding: 7px 10px;
      border: 1px solid transparent; border-radius: var(--el-border-radius-base); background: var(--el-fill-color-light);
      color: var(--el-text-color-primary); font: inherit; text-align: start; cursor: pointer;
      &:hover { background: var(--el-fill-color); }
      &[aria-pressed="true"] { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
      time { color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums; direction: ltr; }
      span { white-space: pre-line; overflow-wrap: anywhere; }
      &[aria-pressed="false"] span { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
    }
  }
  .cuePages {
    display: flex; justify-content: flex-end; align-items: center; gap: 8px;
    output { color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
    .el-button { margin: 0; }
  }
}
</style>
