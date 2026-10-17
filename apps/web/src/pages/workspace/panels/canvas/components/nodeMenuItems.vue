<template>
  <li class="nodeMenuItems" role="none">
    <div ref="menuList" class="menuEntries" role="menu" @keydown.stop="handleKeydown" @click.stop>
      <template v-for="item in items" :key="item.id">
        <button
          v-if="item.type"
          type="button"
          class="menuButton"
          role="menuitem"
          :title="item.alias ? item.label : nodeDisplayName(item.type, item.label)"
          @mouseenter="focusItem($event, item)"
          @click="emit('select', item.type)">
          <component :is="nodeByType.get(item.type)?.icon ?? IconBox" class="menuIcon" :size="14" />
          <span class="menuLabel">{{ item.alias ? item.label : nodeDisplayName(item.type, item.label) }}</span>
        </button>
        <el-popover
          v-else
          :visible="openGroupId === item.id"
          trigger="hover"
          role="menu"
          placement="right-start"
          :fallbackPlacements="['left-start', 'right-end', 'left-end']"
          :width="220"
          :offset="0"
          :showArrow="false"
          :showAfter="0"
          :hideAfter="150"
          :persistent="false"
          :triggerKeys="[]"
          :appendTo="menuHost ?? appendTo"
          :popperStyle="{ padding: '5px 0', maxWidth: 'calc(100vw - 16px)' }"
          @update:visible="visible => updateVisible(item.id, visible)">
          <template #reference>
            <button
              type="button"
              class="menuButton"
              :class="{ expanded: openGroupId === item.id }"
              role="menuitem"
              aria-haspopup="menu"
              :aria-expanded="openGroupId === item.id"
              :title="item.alias ? item.label : nodeDisplayName(item.type, item.label)"
              @mouseenter="focusItem($event, item)"
              @click="openGroup(item.id)">
              <component :is="openGroupId === item.id ? IconFolderOpen : IconFolder" class="menuIcon" :size="14" aria-hidden="true" />
              <span class="menuLabel">{{ item.alias ? item.label : nodeDisplayName(item.type, item.label) }}</span>
              <icon-chevron-right class="nextIcon" :size="14" />
            </button>
          </template>
          <ul class="childMenu" role="none">
            <nodeMenuItems
              v-if="openGroupId === item.id"
              :ref="instance => setChildMenu(item.id, instance)"
              :items="item.children ?? []"
              :nodes="nodes"
              @select="emit('select', $event)"
              @close="closeGroup(item.id)" />
          </ul>
        </el-popover>
      </template>
      <template v-if="uploadDisabled !== undefined">
        <el-divider />
        <button type="button" class="menuButton" role="menuitem" :disabled="uploadDisabled" @mouseenter="focusItem($event)" @click="emit('upload')">
          <icon-upload class="menuIcon" :size="14" />
          <span class="menuLabel">上传</span>
        </button>
      </template>
    </div>
  </li>
</template>

<script setup lang="ts">
import { nodeDisplayName } from "@/lib/i18n";
import { computed, nextTick, onMounted, ref, shallowRef, type Component, type ComponentPublicInstance } from "vue";
import { IconBox, IconChevronRight, IconFolder, IconFolderOpen, IconUpload } from "@tabler/icons-vue";
import type { NodeMenuItem } from "@toonflow/server/nodeMenu";

const props = withDefaults(defineProps<{
  items: NodeMenuItem[];
  nodes: { type: string; label: string; icon: Component }[];
  appendTo?: HTMLElement;
  uploadDisabled?: boolean;
}>(), { uploadDisabled: undefined });
const emit = defineEmits<{ select: [type: string]; upload: []; close: [] }>();
const menuList = ref<HTMLElement>();
const menuHost = shallowRef<HTMLElement>();
const openGroupId = ref<string>();
const childMenus = new Map<string, { focusFirst: (keyboard?: boolean) => void; hasKeyboardFocus: () => boolean }>();
let keyboardNavigation = false;
const nodeByType = computed(() => new Map(props.nodes.map(node => [node.type, node])));

onMounted(() => {
  // ACT: 挂到直接父浮层，避开列表滚动裁剪，也让三级菜单保持父层的悬浮状态。
  menuHost.value = menuList.value?.closest<HTMLElement>(".el-popper") ?? props.appendTo;
});

function menuButtons() {
  return Array.from(menuList.value?.querySelectorAll<HTMLButtonElement>(":scope > button:not(:disabled)") ?? []);
}

function focusButton(button?: HTMLButtonElement) {
  button?.focus({ preventScroll: true });
  button?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function focusFirst(keyboard = false) {
  keyboardNavigation = keyboard;
  focusButton(menuButtons()[0]);
}

function setChildMenu(id: string, instance: Element | ComponentPublicInstance | null) {
  if (instance) childMenus.set(id, instance as unknown as { focusFirst: (keyboard?: boolean) => void; hasKeyboardFocus: () => boolean });
  else childMenus.delete(id);
}

function updateVisible(id: string, visible: boolean) {
  if (visible) openGroupId.value = id;
  else if (openGroupId.value === id && !childMenus.get(id)?.hasKeyboardFocus()) openGroupId.value = undefined;
}

function hasKeyboardFocus(): boolean {
  if (menuList.value?.contains(document.activeElement)) return keyboardNavigation;
  return [...childMenus.values()].some(child => child.hasKeyboardFocus());
}

async function focusItem(event: MouseEvent, item?: NodeMenuItem) {
  const button = event.currentTarget as HTMLButtonElement;
  keyboardNavigation = false;
  openGroupId.value = item && !item.type ? item.id : undefined;
  await nextTick();
  focusButton(button);
}

async function openGroup(id: string, keyboard = false) {
  openGroupId.value = id;
  await nextTick();
  childMenus.get(id)?.focusFirst(keyboard);
}

async function closeGroup(id: string) {
  keyboardNavigation = true;
  openGroupId.value = undefined;
  // ACT: 等子浮层释放焦点后再返回父项，避免 Element Plus 恢复旧焦点。
  await nextTick();
  focusButton(menuButtons()[props.items.findIndex(item => item.id === id)]);
}

function handleKeydown(event: KeyboardEvent) {
  keyboardNavigation = true;
  const buttons = menuButtons();
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  const item = props.items[index];
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    openGroupId.value = undefined;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowDown" ? (index + 1) % buttons.length : (index + buttons.length - 1) % buttons.length;
    focusButton(buttons[nextIndex]);
    return;
  }
  if (event.key === "ArrowRight" && item && !item.type) {
    event.preventDefault();
    void openGroup(item.id, true);
    return;
  }
  if (event.key === "ArrowLeft" || event.key === "Escape") {
    event.preventDefault();
    if (openGroupId.value) closeGroup(openGroupId.value);
    else emit("close");
    return;
  }
  if (event.key === "Tab") emit("close");
}

defineExpose({ focusFirst, hasKeyboardFocus });
</script>

<style lang="scss" scoped>
.nodeMenuItems {
  list-style: none;
  min-width: 180px;

  .menuEntries {
    max-height: min(480px, calc(100dvh - 100px));
    overflow-y: auto;
    overscroll-behavior: contain;

    .menuButton {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-width: 180px;
      max-width: 300px;
      margin: 0;
      border: 0;
      border-radius: 0;
      padding: 5px 16px;
      background: transparent;
      color: var(--el-text-color-regular);
      font: inherit;
      font-size: var(--el-font-size-base);
      line-height: 22px;
      text-align: left;
      cursor: pointer;

      &:hover,
      &:focus-visible,
      &.expanded {
        outline: none;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &:disabled {
        background: transparent;
        color: var(--el-text-color-disabled);
        cursor: not-allowed;
      }

      .menuIcon,
      .nextIcon {
        flex-shrink: 0;
      }

      .menuLabel {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.childMenu {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
