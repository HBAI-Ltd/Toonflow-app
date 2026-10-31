<template>
  <div v-click-outside:[editor]="closeMenu" class="skillMenu" @keydown.capture="handleKeydown">
    <el-button class="skillButton" text circle :disabled="disabled" :aria-expanded="visible" :aria-controls="listId" aria-label="选择技能" title="选择技能" @click="visible ? closeMenu() : buttonVisible = true"><icon-book :size="16" /></el-button>
    <el-card v-if="visible" class="skillPopup" shadow="always" :bodyStyle="{ padding: '6px' }">
      <el-scrollbar maxHeight="min(320px, 50dvh)">
        <div :id="listId" class="skillList" role="listbox" aria-label="技能指令" :aria-busy="loading">
          <div v-if="loading || loadError || !filteredSkills.length" class="skillStatus" role="status">{{ loading ? "正在加载技能…" : loadError || (skills.length ? "没有匹配的技能" : "暂无可用技能") }}</div>
          <button v-for="(skill, index) in filteredSkills" v-else :id="`${listId}-${index}`" :key="skill.name" class="skillItem" :class="{ active: index === activeIndex }" type="button" role="option" :aria-selected="index === activeIndex" @mouseenter="activeIndex = index" @mousedown.prevent @click="selectSkill(skill.name)">
            <icon-book class="skillIcon" :size="18" aria-hidden="true" />
            <span class="skillContent">
              <span class="skillHeader">
                <span class="skillName">{{ skill.displayName }}</span>
                <code class="skillIdentifier">/skill:{{ skill.name }}</code>
              </span>
              <span class="skillDescription" :title="skill.description">{{ skill.description }}</span>
            </span>
          </button>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from "vue";
import axios from "axios";
import { IconBook } from "@tabler/icons-vue";
import { ClickOutside as vClickOutside } from "element-plus";

const props = defineProps<{ directory?: string; active: boolean; disabled: boolean; query?: string; editor?: HTMLElement }>();
const emit = defineEmits<{ select: [name: string]; dismiss: [] }>();
const listId = useId();
const buttonVisible = ref(false);
const visible = computed(() => props.active && !props.disabled && (buttonVisible.value || props.query !== undefined));
const skills = ref<{ name: string; displayName: string; description: string }[]>([]);
const loading = ref(false);
const loadError = ref("");
const activeIndex = ref(0);
const filteredSkills = computed(() => {
  const query = (props.query ?? "").toLowerCase();
  return skills.value.filter(skill => `skill:${skill.name} ${skill.displayName} ${skill.description}`.toLowerCase().includes(query));
});

function closeMenu() {
  buttonVisible.value = false;
  emit("dismiss");
}

function selectSkill(name: string) {
  emit("select", name);
  closeMenu();
}

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value || event.isComposing || event.keyCode === 229) return;
  if (event.key === "Tab" && (event.shiftKey || loading.value || loadError.value || !filteredSkills.value.length)) return closeMenu();
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") return closeMenu();
  if (loading.value || loadError.value || !filteredSkills.value.length) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    activeIndex.value = (activeIndex.value + (event.key === "ArrowDown" ? 1 : -1) + filteredSkills.value.length) % filteredSkills.value.length;
  } else selectSkill(filteredSkills.value[activeIndex.value]!.name);
}

watch(filteredSkills, () => { activeIndex.value = 0; });
watch([visible, activeIndex, filteredSkills, loading, loadError], async () => {
  await nextTick();
  const editor = props.editor?.querySelector('[role="textbox"]');
  editor?.setAttribute("aria-haspopup", "listbox");
  editor?.setAttribute("aria-expanded", String(visible.value));
  editor?.setAttribute("aria-controls", listId);
  if (visible.value && !loading.value && !loadError.value && filteredSkills.value.length) {
    const id = `${listId}-${activeIndex.value}`;
    editor?.setAttribute("aria-activedescendant", id);
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  } else editor?.removeAttribute("aria-activedescendant");
});

watch(visible, async (open, _previous, onCleanup) => {
  if (!open) return closeMenu();
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  loading.value = true;
  loadError.value = "";
  try {
    const { data } = await axios.get("/api/agent/skills", {
      params: { directory: props.directory }, signal: controller.signal,
      headers: { "x-toonflow-workspace": "1" },
    });
    if (data.code !== 200) throw new Error(data.message || "加载技能失败");
    skills.value = data.data;
  } catch (error) {
    if (!axios.isCancel(error)) loadError.value = "加载技能失败，请重新打开重试";
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
    right: 0;
    bottom: calc(100% + 8px);
    left: 0;

    .skillList {
      display: grid;
      gap: 4px;

      .skillStatus {
        padding: 20px 12px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.6;
        text-align: center;
      }

      .skillItem {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: start;
        gap: 10px;
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: var(--el-border-radius-base);
        background: transparent;
        color: var(--el-text-color-primary);
        font: inherit;
        text-align: left;
        overflow-wrap: anywhere;
        cursor: pointer;

        &:hover {
          background: var(--el-fill-color-light);
        }

        &.active {
          background: var(--el-color-primary-light-9);

          .skillIcon { color: var(--el-color-primary); }
        }

        &:focus-visible {
          outline: 2px solid var(--el-color-primary);
          outline-offset: -2px;
        }

        .skillIcon {
          margin-top: 2px;
          color: var(--el-text-color-secondary);
        }

        .skillContent {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;

          .skillHeader {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 4px 12px;
            line-height: 1.5;

            .skillName {
              min-width: 0;
              font-size: 13px;
              font-weight: 600;
            }

            .skillIdentifier {
              min-width: 0;
              margin-left: auto;
              color: var(--el-text-color-secondary);
              font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
              font-size: 11px;
            }
          }

          .skillDescription {
            display: -webkit-box;
            overflow: hidden;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            line-height: 1.6;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }
        }
      }
    }
  }
}
</style>
