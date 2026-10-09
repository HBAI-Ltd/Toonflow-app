<template>
  <div v-click-outside:[editor]="closeMenu" class="commandMenu" @keydown.capture="handleKeydown">
    <el-card v-if="visible" class="commandPopup" shadow="always" :bodyStyle="{ padding: '6px' }">
      <div :id="listId" role="listbox" aria-label="对话命令">
        <button v-for="(command, index) in filteredCommands" :id="`${listId}-${index}`" :key="command.name" class="commandItem" :class="{ active: index === activeIndex }" type="button" role="option" :aria-selected="index === activeIndex" @mouseenter="activeIndex = index" @mousedown.prevent @click="selectCommand(command.name)">
          <span class="commandName">/{{ command.name }}</span>
          <span class="commandDescription">{{ command.description }}</span>
        </button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from "vue";
import { ClickOutside as vClickOutside } from "element-plus";

const props = defineProps<{ active: boolean; disabled: boolean; query?: string; editor?: HTMLElement }>();
const emit = defineEmits<{ select: [name: string]; dismiss: [] }>();
const listId = useId();
const commands = [
  { name: "clear", description: "清空当前对话" },
  { name: "compact", description: "压缩当前对话上下文" },
];
const activeIndex = ref(0);
const visible = computed(() => props.active && !props.disabled && props.query !== undefined);
const filteredCommands = computed(() => {
  const query = (props.query ?? "").toLowerCase();
  return commands.filter(command => `${command.name} ${command.description}`.toLowerCase().includes(query));
});

function closeMenu() { emit("dismiss"); }
function selectCommand(name: string) { emit("select", name); closeMenu(); }

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value || event.isComposing || event.keyCode === 229) return;
  if (event.key === "Tab" && (event.shiftKey || !filteredCommands.value.length)) return closeMenu();
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") return closeMenu();
  if (!filteredCommands.value.length) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    activeIndex.value = (activeIndex.value + (event.key === "ArrowDown" ? 1 : -1) + filteredCommands.value.length) % filteredCommands.value.length;
  } else selectCommand(filteredCommands.value[activeIndex.value]!.name);
}

watch(filteredCommands, () => { activeIndex.value = 0; });
watch([visible, activeIndex, filteredCommands], async () => {
  await nextTick();
  const editor = props.editor?.querySelector('[role="textbox"]');
  editor?.setAttribute("aria-haspopup", "listbox");
  editor?.setAttribute("aria-expanded", String(visible.value));
  editor?.setAttribute("aria-controls", listId);
  if (visible.value && filteredCommands.value.length) {
    const id = `${listId}-${activeIndex.value}`;
    editor?.setAttribute("aria-activedescendant", id);
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  } else editor?.removeAttribute("aria-activedescendant");
});

defineExpose({ handleKeydown });
</script>

<style lang="scss" scoped>
.commandMenu {
  flex-shrink: 0;

  .commandPopup {
    position: absolute;
    z-index: 20;
    right: 0;
    bottom: calc(100% + 8px);
    left: 0;

    .commandItem {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: var(--el-border-radius-base);
      background: transparent;
      color: var(--el-text-color-primary);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &.active, &:focus-visible { background: var(--el-fill-color-light); }
      .commandDescription { color: var(--el-text-color-secondary); font-size: 12px; }
    }
  }
}
</style>
