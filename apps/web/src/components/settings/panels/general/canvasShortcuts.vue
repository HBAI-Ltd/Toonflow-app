<template>
  <section class="canvasShortcuts" aria-labelledby="canvasShortcutsTitle">
    <div class="shortcutHeader">
      <h3 id="canvasShortcutsTitle">画布快捷键</h3>
      <div class="shortcutActions">
        <el-dropdown trigger="click" @command="changeBindMode">
          <el-button text size="small" aria-label="快捷键绑定方式">
            {{ bindMode === 'listen' ? '按键录制' : '手动填写' }}
            <icon-chevron-down :size="14" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="listen" :icon="IconKeyboard">按键录制</el-dropdown-item>
              <el-dropdown-item command="input" :icon="IconEdit">手动填写</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button text size="small" :icon="IconRestore" @click="resetShortcuts">恢复默认</el-button>
      </div>
    </div>
    <p class="description">
      {{ bindMode === "listen" ? "点击键帽录制，Esc 退出；右侧 × 取消绑定。" : "使用按键代号，如 Ctrl+KeyG / Alt+KeyG；回车或移开焦点保存，留空取消绑定。" }}
    </p>
    <el-form class="shortcutList">
      <el-form-item v-for="field in canvasShortcutFields" :key="`${field.id}:${resetKey}`" class="shortcutItem" :error="issues[field.id]">
        <div class="shortcutRow">
          <div class="shortcutInfo">
            <span class="shortcutName">{{ field.label }}</span>
            <span v-if="field.hold" class="shortcutHint">{{ field.gesture === 'drag' ? '按住并拖动节点' : field.gesture === 'wheel' ? '按住并滚动' : '按住并拖动画布' }}</span>
          </div>
          <keyInput
            class="shortcutInput"
            :code="generalSettings.canvasShortcuts[field.id]"
            :mode="bindMode"
            :label="`${field.label}快捷键`"
            :hold="field.hold"
            @change="setShortcut(field.id, $event)" />
        </div>
      </el-form-item>
      <div class="gestureRow"><span>触摸板缩放</span><span class="gestureValue"><icon-hand-two-fingers :size="16" />双指捏合</span></div>
      <div class="gestureRow"><span>触摸板平移</span><span class="gestureValue"><icon-hand-two-fingers :size="16" />双指滑动</span></div>
      <div class="gestureRow"><span>鼠标平移</span><span class="gestureValue"><icon-mouse :size="16" />滚轮 / 中键拖动</span></div>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconRestore, IconChevronDown, IconKeyboard, IconEdit, IconHandTwoFingers, IconMouse } from "@tabler/icons-vue";
import { generalSettings, updateGeneralSettings } from "@/stores/settings";
import { canvasShortcutFields, defaultCanvasShortcuts, getShortcutBindings, isShortcutAllowed, normalizeShortcut, type CanvasShortcutAction } from "@/lib/canvasShortcuts";
import keyInput from "./keyInput.vue";

const bindMode = ref<"listen" | "input">("listen");
const resetKey = ref(0);
const issues = ref<Partial<Record<CanvasShortcutAction, string>>>({});

function changeBindMode(mode: "listen" | "input") {
  bindMode.value = mode;
  issues.value = {};
}

function setShortcut(action: CanvasShortcutAction, value: string) {
  const binding = normalizeShortcut(value);
  const field = canvasShortcutFields.find(field => field.id === action)!;
  if (binding === undefined || !isShortcutAllowed(field, binding)) {
    issues.value[action] = binding === undefined ? "请输入有效按键，例如 Ctrl+KeyG / Alt+KeyG。"
      : field.gesture === "drag" ? "拖拽操作只绑定修饰键，例如 Alt 或 Ctrl+Alt。" : "此操作需要普通按键，例如 KeyP 或 Ctrl+KeyZ。";
    return;
  }
  const bindings = getShortcutBindings(binding);
  const conflict = canvasShortcutFields.find(other => other.id !== action && other.gesture === field.gesture
    && getShortcutBindings(generalSettings.value.canvasShortcuts[other.id]).some(value => bindings.includes(value)));
  if (conflict) {
    issues.value[action] = `与「${conflict.label}」重复，请换一个快捷键。`;
    return;
  }
  delete issues.value[action];
  updateGeneralSettings({ canvasShortcuts: { ...generalSettings.value.canvasShortcuts, [action]: binding } });
}

function resetShortcuts() {
  issues.value = {};
  resetKey.value++;
  updateGeneralSettings({ canvasShortcuts: { ...defaultCanvasShortcuts } });
}
</script>

<style lang="scss" scoped>
.canvasShortcuts {
  container-type: inline-size;

  .shortcutHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .shortcutActions {
      display: flex;
      align-items: center;
      gap: 4px;

      .el-button { margin-left: 0; }
      svg { margin-left: 4px; }
    }
  }

  .description {
    margin: 8px 0 12px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
  .shortcutList {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 4px 28px;

    .shortcutItem {
      min-width: 0;
      margin: 0;
      padding: 5px 0;

      :deep(.el-form-item__content) { min-width: 0; }
      :deep(.el-form-item__error) {
        position: static;
        padding-top: 4px;
        line-height: 1.5;
      }

      .shortcutRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 32px;

        .shortcutInfo {
          flex-shrink: 0;
          line-height: 1.5;

          .shortcutName { font-size: 13px; }
          .shortcutHint {
            display: block;
            color: var(--el-text-color-secondary);
            font-size: 11px;
          }
        }

        .shortcutInput { flex: 1; min-width: 0; }
      }
    }

    .gestureRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 42px;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      .gestureValue { display: inline-flex; align-items: center; gap: 6px; }
    }
  }

  @container (max-width: 560px) {
    .shortcutList { grid-template-columns: minmax(0, 1fr); }
  }
}
</style>
