<template>
  <div v-if="open" ref="root" class="agentPromptMenu" role="listbox" :aria-label="kind === 'skill' ? '技能' : '提及场景里的对象'" @pointerdown.prevent>
    <div class="menuHeader">{{ kind === "skill" ? "技能" : "提及" }}<span v-if="loading" class="menuHint">读取中…</span></div>
    <p v-if="!items.length" class="menuEmpty">{{ loading ? "读取中…" : kind === "skill" ? "没有匹配的技能" : "场景里没有匹配的对象" }}</p>
    <button
      v-for="(item, index) in items"
      :key="item.id"
      type="button"
      role="option"
      class="menuItem"
      :class="{ active: index === active }"
      :aria-selected="index === active"
      :title="item.hint || item.label"
      @mouseenter="active = index"
      @click="emit('select', item)">
      <component :is="icons[item.kind]" :size="14" aria-hidden="true" />
      <span class="itemLabel">{{ item.label }}</span>
      <span v-if="item.hint" class="itemHint">{{ item.hint }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { IconBook2, IconCamera, IconPackage, IconUser } from "@tabler/icons-vue";

/**
 * 与宿主输入框的 @ 提及菜单、/ 技能菜单同构：输入 @ 列出场景里的人、物、机位，输入 / 列出技能；
 * ↑↓ 选、Enter/Tab 确认、Esc 关闭。键盘由输入框转交（handleKeydown 返回 true 表示已处理）。
 */
export type PromptMenuItem = { id: string; label: string; hint?: string; kind: "person" | "object" | "camera" | "skill"; value: string };
const props = defineProps<{ open: boolean; kind: "mention" | "skill"; items: PromptMenuItem[]; loading?: boolean }>();
const emit = defineEmits<{ select: [item: PromptMenuItem]; dismiss: [] }>();
const icons = { person: IconUser, object: IconPackage, camera: IconCamera, skill: IconBook2 };
const active = ref(0);
const root = ref<HTMLElement>();

watch(() => [props.open, props.items] as const, () => { active.value = 0; });
watch(active, () => void nextTick(() => root.value?.querySelector(".menuItem.active")?.scrollIntoView({ block: "nearest" })));

function handleKeydown(event: KeyboardEvent) {
  if (!props.open || event.isComposing) return false;
  if (event.key === "Escape") { emit("dismiss"); return true; }
  if (!props.items.length) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    const step = event.key === "ArrowDown" ? 1 : -1;
    active.value = (active.value + step + props.items.length) % props.items.length;
    return true;
  }
  if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
    const item = props.items[active.value];
    if (item) emit("select", item);
    return true;
  }
  return false;
}
defineExpose({ handleKeydown });
</script>

<style scoped lang="scss">
.agentPromptMenu {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: calc(100% + 6px);
  left: 0;
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  overscroll-behavior: contain;

  .menuHeader { display: flex; justify-content: space-between; padding: 4px 8px 2px; color: var(--el-text-color-secondary); font-size: 11px; }
  .menuEmpty { margin: 0; padding: 6px 8px; color: var(--el-text-color-secondary); font-size: 12px; }
  .menuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 30px;
    padding: 4px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--el-text-color-primary);
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    > svg { flex-shrink: 0; color: var(--el-text-color-secondary); }
    .itemLabel { flex-shrink: 0; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .itemHint { flex: 1; min-width: 0; overflow: hidden; color: var(--el-text-color-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    &.active { background: var(--el-fill-color-light); > svg { color: var(--el-color-primary); } }
  }
}
</style>
