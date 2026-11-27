<template>
  <div v-click-outside:[editor]="closeMenu" class="skillMenu" @keydown.capture="handleKeydown">
    <el-button class="skillButton" text circle :disabled="disabled" :aria-expanded="visible" :aria-controls="listId" :aria-label="menuLabel" :title="menuLabel" @click="visible ? closeMenu() : buttonVisible = true"><icon-book :size="16" /></el-button>
    <el-card v-if="visible" class="skillPopup" shadow="always" :bodyStyle="{ padding: '4px' }">
      <el-scrollbar maxHeight="min(320px, 50dvh)">
        <div :id="listId" class="skillList" role="listbox" :aria-label="menuLabel">
          <template v-for="group in groups" :key="group.label">
            <div v-if="group.items.length || group.status" class="menuGroup" role="group" :aria-label="group.label">
              <div class="groupHeading" aria-hidden="true">{{ group.label }}</div>
              <button v-for="(item, index) in group.items" :id="`${listId}-${group.start + index}`" :key="item.token" class="menuItem" :class="{ active: group.start + index === activeIndex }" type="button" role="option" tabindex="-1" :aria-selected="group.start + index === activeIndex" :title="`${item.token} · ${item.description || item.name}`" @mouseenter="activeIndex = group.start + index" @mousedown.prevent @click="selectItem(item.token)">
                <component :is="item.icon" class="itemIcon" :size="15" aria-hidden="true" />
                <span class="itemIdentity"><span class="itemName">{{ item.name }}</span><span v-if="item.command" class="itemToken">{{ item.token }}</span></span>
                <span class="itemMeta">{{ item.command ? item.description : item.token }}</span>
                <span v-if="!item.command && item.description" class="skillDescription">{{ item.description }}</span>
              </button>
              <div v-if="group.status" class="menuStatus" role="status">{{ group.status }}</div>
            </div>
          </template>
          <div v-if="!items.length && !loading && !loadError && query" class="menuStatus" role="status">{{ commandsEnabled ? "没有匹配的命令或技能" : "没有匹配的技能" }}</div>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from "vue";
import axios from "axios";
import { IconArrowsMinimize, IconBook, IconCalendarClock, IconClock, IconListDetails, IconTarget } from "@tabler/icons-vue";
import { ClickOutside as vClickOutside } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { multiTenantEnabled } from "@/stores/settings";

const props = defineProps<{ directory?: string; active: boolean; disabled: boolean; commandsEnabled: boolean; commandsOnly?: boolean; running: boolean; query?: string; editor?: HTMLElement }>();
const emit = defineEmits<{ select: [token: string]; dismiss: [] }>();
const listId = useId();
const buttonVisible = ref(false);
const visible = computed(() => props.active && !props.disabled && (buttonVisible.value || props.query !== undefined));
const skills = ref<{ name: string; displayName: string; description: string }[]>([]);
const loading = ref(false);
const loadError = ref("");
const activeIndex = ref(0);
const menuLabel = computed(() => props.commandsEnabled ? translate("命令与技能") : translate("选择技能"));
const groups = computed(() => {
  const query = props.query?.toLowerCase() ?? "";
  const matches = (item: { token: string; name: string; description: string }) => `${item.token} ${item.name} ${item.description}`.toLowerCase().includes(query);
  const prefixRank = (token: string) => token === `/${query}` ? 0 : token.startsWith(`/${query}`) ? 1 : 2;
  const commands = props.commandsEnabled ? [
    ...(props.running ? [] : [
      { token: "/plan", name: translate("计划模式"), description: translate("先制定计划，再执行"), icon: IconListDetails, command: true },
      { token: "/goal", name: translate("目标模式"), description: translate("设定持续推进的目标"), icon: IconTarget, command: true },
      { token: "/compact", name: translate("压缩上下文"), description: translate("总结已有对话，释放上下文空间"), icon: IconArrowsMinimize, command: true },
    ]),
    ...(multiTenantEnabled.value ? [] : [
      { token: "/automations", name: translate("自动化任务"), description: translate("管理项目的定时任务"), icon: IconCalendarClock, command: true },
      { token: "/timer", name: translate("定时器"), description: translate("定时在当前对话继续"), icon: IconClock, command: true },
    ]),
  ].filter(matches).sort((a, b) => prefixRank(a.token) - prefixRank(b.token)) : [];
  const result = [{ label: translate("命令"), start: 0, items: commands, status: "" }];
  if (!props.running && !props.commandsOnly) {
    const skillItems = skills.value.map(skill => ({ token: `/skill:${skill.name}`, name: skill.displayName, description: skill.description, icon: IconBook, command: false })).filter(matches);
    result.push({ label: translate("技能"), start: commands.length, items: skillItems, status: loading.value ? translate("正在加载技能…") : loadError.value || (!query && !skillItems.length ? translate("暂无可用技能") : "") });
  }
  return result;
});
const items = computed(() => groups.value.flatMap(group => group.items));

function closeMenu() {
  buttonVisible.value = false;
  emit("dismiss");
}

function selectItem(token: string) {
  emit("select", token);
  closeMenu();
}

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value || event.isComposing || event.keyCode === 229) return;
  if (event.key === "Tab" && (event.shiftKey || !items.value.length)) return closeMenu();
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key)) return;
  if (event.key === "Enter" && !items.value.length && !loading.value) return closeMenu();
  if (event.key === "Enter" && event.currentTarget === props.editor && props.query === "goal" && items.value[activeIndex.value]?.token === "/goal") return closeMenu();
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") return closeMenu();
  if (!items.value.length) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    activeIndex.value = (activeIndex.value + (event.key === "ArrowDown" ? 1 : -1) + items.value.length) % items.value.length;
  } else selectItem(items.value[activeIndex.value]!.token);
}

watch([visible, () => props.query, () => props.commandsEnabled, () => props.running], () => { activeIndex.value = 0; });
watch([visible, activeIndex, items], async () => {
  if (props.commandsOnly) return;
  await nextTick();
  const editor = props.editor?.querySelector('[role="textbox"]');
  if (!visible.value) {
    if (editor?.getAttribute("aria-controls") === listId) {
      editor.setAttribute("aria-expanded", "false");
      editor.removeAttribute("aria-activedescendant");
    }
    return;
  }
  editor?.setAttribute("aria-haspopup", "listbox");
  editor?.setAttribute("aria-expanded", "true");
  editor?.setAttribute("aria-controls", listId);
  if (items.value.length) {
    const id = `${listId}-${activeIndex.value}`;
    editor?.setAttribute("aria-activedescendant", id);
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  } else editor?.removeAttribute("aria-activedescendant");
});

watch([visible, () => props.directory, () => props.running, () => props.commandsOnly], async ([open], _previous, onCleanup) => {
  if (!open) return closeMenu();
  if (props.running || props.commandsOnly) {
    loading.value = false;
    loadError.value = "";
    return;
  }
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  loading.value = true;
  skills.value = [];
  loadError.value = "";
  try {
    const { data } = await axios.get("/api/agent/skills", {
      params: { directory: props.directory }, signal: controller.signal,
      headers: { "x-toonflow-workspace": "1" },
    });
    if (controller.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "加载技能失败");
    skills.value = data.data;
  } catch (error) {
    if (!controller.signal.aborted && !axios.isCancel(error)) loadError.value = translate("加载技能失败，请重新打开重试");
  } finally {
    if (!controller.signal.aborted) loading.value = false;
  }
});

defineExpose({ handleKeydown });
</script>

<style lang="scss" scoped>
.skillMenu {
  flex-shrink: 0;

  .skillButton {
    width: 24px;
    height: 24px;
    padding: 0;
  }

  .skillPopup {
    position: absolute;
    z-index: 20;
    inset-inline: -1px;
    bottom: calc(100% + 5px);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius-large, 12px);
    background: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-light);

    .skillList {
      .menuStatus {
        padding: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.6;
      }

      .menuGroup {
        & + .menuGroup { margin-top: 4px; }
        .groupHeading {
          padding: 5px 8px;
          color: var(--el-text-color-secondary);
          font-size: 11px;
          line-height: 16px;
        }
        .menuItem {
          display: grid;
          grid-template-columns: 15px minmax(0, 1fr) fit-content(46%);
          align-items: center;
          gap: 2px 6px;
          width: 100%;
          min-height: 32px;
          padding: 4px 8px;
          border: none;
          border-radius: var(--el-border-radius-base);
          background: transparent;
          color: var(--el-text-color-primary);
          font: inherit;
          font-size: 13px;
          text-align: start;
          cursor: pointer;

          &.active { background: var(--el-fill-color-light); }
          &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
          .itemIcon { color: var(--el-text-color-regular); }
          .itemIdentity {
            display: inline-flex;
            align-items: baseline;
            gap: 6px;
            min-width: 0;
            .itemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .itemToken { flex: none; color: var(--el-text-color-secondary); font-size: 11px; }
          }
          .itemMeta {
            overflow: hidden;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .skillDescription {
            grid-column: 2 / -1;
            overflow: hidden;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            line-height: 1.5;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style>
