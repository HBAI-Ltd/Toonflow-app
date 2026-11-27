<template>
  <li class="cascadeMenuItems" role="none">
    <div ref="menuList" class="menuEntries" role="menu" @keydown.stop="handleKeydown" @mousemove="rememberPointer" @mouseleave="leaveMenu" @pointerdown.stop="clearHover" @mousedown.stop @wheel.stop @dblclick.stop @click.stop>
      <template v-for="item in items" :key="item.id">
        <el-divider v-if="item.divided" />
        <button
          v-if="item.type"
          type="button"
          class="menuButton"
          role="menuitem"
          :title="item.label"
          :aria-disabled="item.disabled || undefined"
          :data-menu-id="item.id"
          @mouseenter="focusItem($event, item)"
          @click="!item.disabled && emit('select', item.type)">
          <component v-if="item.icon || icons?.has(item.type)" :is="item.icon ?? icons?.get(item.type)" class="menuIcon" :size="14" aria-hidden="true" />
          <span class="menuLabel">{{ item.label }}</span>
          <small v-if="item.note" class="menuNote">{{ item.note }}</small>
        </button>
        <el-popover
          v-else
          :visible="openGroupId === item.id"
          trigger="hover"
          role="menu"
          :placement="opensLeft ? 'left-start' : 'right-start'"
          :fallbackPlacements="opensLeft ? ['right-start', 'left-end', 'right-end'] : ['left-start', 'right-end', 'left-end']"
          width="var(--cascade-column-width, 220px)"
          :offset="8"
          popperClass="cascadeChildMenu"
          :showArrow="false"
          :showAfter="0"
          :hideAfter="150"
          :persistent="false"
          :triggerKeys="[]"
          :appendTo="menuHost ?? appendTo"
          :popperStyle="{ padding: '5px 0', minWidth: 0, maxWidth: 'calc(100vw - 16px)' }"
          @update:visible="visible => updateVisible(item.id, visible)">
          <template #reference>
            <button
              type="button"
              class="menuButton"
              :class="{ expanded: openGroupId === item.id }"
              role="menuitem"
              aria-haspopup="menu"
              :aria-expanded="openGroupId === item.id"
              :title="item.label"
              :data-menu-id="item.id"
              @mouseenter="focusItem($event, item)"
              @click="openGroup(item.id)">
              <component :is="item.icon ?? (openGroupId === item.id ? IconFolderOpen : IconFolder)" class="menuIcon" :size="14" aria-hidden="true" />
              <span class="menuLabel">{{ item.label }}</span>
              <icon-chevron-right class="nextIcon" :class="{ pointsLeft: opensLeft }" :size="14" aria-hidden="true" />
            </button>
          </template>
          <ul class="childMenu" role="none">
            <cascadeMenuItems
              v-if="openGroupId === item.id"
              :ref="instance => setChildMenu(item.id, instance)"
              :items="item.children ?? []"
              :icons="icons"
              @select="emit('select', $event)"
              @close="closeGroup(item.id)" />
          </ul>
        </el-popover>
      </template>
    </div>
  </li>
</template>

<script lang="ts">
import type { Component } from "vue";

export interface CascadeMenuItem {
  id: string;
  label: string;
  note?: string;
  type?: string;
  icon?: Component;
  children?: CascadeMenuItem[];
  disabled?: boolean;
  divided?: boolean;
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, type ComponentPublicInstance } from "vue";
import { IconChevronRight, IconFolder, IconFolderOpen } from "@tabler/icons-vue";
import { ElDivider, ElPopover } from "element-plus";

const props = defineProps<{
  items: CascadeMenuItem[];
  icons?: ReadonlyMap<string, Component>;
  appendTo?: HTMLElement;
}>();
const emit = defineEmits<{ select: [type: string]; close: [] }>();
const menuList = ref<HTMLElement>();
const menuHost = shallowRef<HTMLElement>();
const opensLeft = ref(false);
const openGroupId = ref<string>();
type ChildMenu = { focusFirst: (keyboard?: boolean) => void; hasKeyboardFocus: () => boolean; getBounds: () => DOMRect | undefined };
const childMenus = new Map<string, ChildMenu>();
let keyboardNavigation = false;
let placementObserver: MutationObserver | undefined;
let pointer: { x: number; y: number } | undefined;
let hoverTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  // ACT: 挂到直接父浮层，避开列表滚动裁剪，也让三级菜单保持父层的悬浮状态。
  menuHost.value = menuList.value?.closest<HTMLElement>(".el-popper") ?? props.appendTo;
  const host = menuHost.value;
  if (!host?.classList.contains("cascadeChildMenu")) return;
  const syncPlacement = () => { opensLeft.value = host.dataset.popperPlacement?.startsWith("left") ?? false; };
  syncPlacement();
  // 父菜单碰到窗口边缘翻向左侧时，下一层也沿该方向展开。
  placementObserver = new MutationObserver(syncPlacement);
  placementObserver.observe(host, { attributes: true, attributeFilter: ["data-popper-placement"] });
});
onBeforeUnmount(() => { clearHover(); placementObserver?.disconnect(); });

function menuButtons() {
  return Array.from(menuList.value?.querySelectorAll<HTMLButtonElement>(":scope > button") ?? []);
}

function focusButton(button?: HTMLButtonElement) {
  button?.focus({ preventScroll: true });
  const list = menuList.value;
  if (!button || !list) return;
  const itemRect = button.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  // 只滚动菜单列表，避免浮层聚焦时把整个画布页面卷动。
  if (itemRect.top < listRect.top) list.scrollTop += itemRect.top - listRect.top;
  else if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom;
}

function focusFirst(keyboard = false) {
  keyboardNavigation = keyboard;
  focusButton(menuButtons()[0]);
}

function setChildMenu(id: string, instance: Element | ComponentPublicInstance | null) {
  if (instance) childMenus.set(id, instance as unknown as ChildMenu);
  else childMenus.delete(id);
}

function updateVisible(id: string, visible: boolean) {
  // 相邻行的 Popover 也会请求展开；切换分支由鼠标路径、键盘或点选统一决定。
  if (!visible && openGroupId.value === id && !menuHost.value?.matches(":hover") && !childMenus.get(id)?.hasKeyboardFocus()) {
    openGroupId.value = undefined;
  }
}

function hasKeyboardFocus(): boolean {
  if (menuList.value?.contains(document.activeElement)) return keyboardNavigation;
  return [...childMenus.values()].some(child => child.hasKeyboardFocus());
}

function preferMenuSide(item: CascadeMenuItem) {
  const host = menuHost.value;
  if (!item.children?.length || !host || host.classList.contains("cascadeChildMenu")) return;
  const rect = host.getBoundingClientRect();
  const rightSpace = document.documentElement.clientWidth - rect.right;
  // 优先给还可展开的菜单预留两列，宽度不足时选空间较大的一侧。
  const columnWidth = host.style.getPropertyValue("--cascade-column-width") ? rect.width : 220;
  const needed = (columnWidth + 8) * (item.children.some(child => child.children?.length) ? 2 : 1) + 8;
  opensLeft.value = rightSpace < needed && rect.left > rightSpace;
}

function rememberPointer(event: MouseEvent) {
  pointer = { x: event.clientX, y: event.clientY };
}

function clearHover() {
  clearTimeout(hoverTimer);
  hoverTimer = undefined;
}

function leaveMenu() {
  clearHover();
  pointer = undefined;
}

async function activateItem(button: HTMLButtonElement, item: CascadeMenuItem) {
  preferMenuSide(item);
  openGroupId.value = item.type ? undefined : item.id;
  await nextTick();
  focusButton(button);
}

function focusItem(event: MouseEvent, item: CascadeMenuItem) {
  clearHover();
  keyboardNavigation = false;
  const button = event.currentTarget as HTMLButtonElement;
  const child = openGroupId.value && openGroupId.value !== item.id ? childMenus.get(openGroupId.value)?.getBounds() : undefined;
  if (pointer && child && child.width) {
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    const towardsChild = event.clientX < child.left ? dx : event.clientX > child.right ? -dx : 0;
    // 斜穿相邻行时短暂保留原分支；进入子列会取消计时，留在该行才切换。
    if (towardsChild > Math.abs(dy) / 3 && !(event.clientY < child.top && dy < 0 || event.clientY > child.bottom && dy > 0)) {
      hoverTimer = setTimeout(() => { if (button.matches(":hover")) void activateItem(button, item); }, 240);
      return;
    }
  }
  void activateItem(button, item);
}

async function openGroup(id: string, keyboard = false) {
  clearHover();
  const item = props.items.find(entry => entry.id === id);
  if (item) preferMenuSide(item);
  openGroupId.value = id;
  await nextTick();
  childMenus.get(id)?.focusFirst(keyboard);
}

async function closeGroup(id: string) {
  keyboardNavigation = true;
  openGroupId.value = undefined;
  // ACT: 等子浮层释放焦点后再返回父项，避免 Element Plus 恢复旧焦点。
  await nextTick();
  focusButton(menuButtons().find(button => button.dataset.menuId === id));
}

function handleKeydown(event: KeyboardEvent) {
  clearHover();
  keyboardNavigation = true;
  const buttons = menuButtons();
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  const item = props.items.find(entry => entry.id === buttons[index]?.dataset.menuId);
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

defineExpose({ focusFirst, hasKeyboardFocus, getBounds: () => menuList.value?.getBoundingClientRect() });
</script>

<style lang="scss" scoped>
.cascadeMenuItems {
  list-style: none;
  min-width: min(180px, 100%);

  .menuEntries {
    max-height: min(480px, calc(100dvh - 100px));
    overflow-y: auto;
    overscroll-behavior: contain;

    .menuButton {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-width: 0;
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
      @media (max-width: 660px) {
        padding-inline: 8px;
        gap: 4px;
      }

      &:hover,
      &:focus-visible,
      &.expanded {
        outline: none;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &[aria-disabled="true"] {
        background: transparent;
        color: var(--el-text-color-disabled);
        cursor: not-allowed;
        &:focus-visible { outline: 1px solid var(--el-border-color); outline-offset: -1px; }
      }

      .menuIcon,
      .nextIcon {
        flex-shrink: 0;
      }
      .pointsLeft { transform: rotate(180deg); }

      .menuLabel {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .menuNote { flex-shrink: 0; font-size: 11px; color: var(--el-text-color-secondary); }
    }
  }
}

.childMenu {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
  border-radius: max(0px, calc(var(--el-popover-border-radius) - 1px));
}

:global(.cascadeChildMenu::before) {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
}

:global(.cascadeChildMenu[data-popper-placement^="right"]::before) {
  right: 100%;
}

:global(.cascadeChildMenu[data-popper-placement^="left"]::before) {
  left: 100%;
}
</style>
