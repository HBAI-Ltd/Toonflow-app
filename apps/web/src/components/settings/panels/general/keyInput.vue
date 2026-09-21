<template>
  <div class="keyInput">
    <el-input
      v-if="mode === 'input'"
      v-model="draft"
      size="small"
      :disabled="disabled"
      :aria-label="label"
      placeholder="留空即不绑定"
      @keydown.stop
      @blur="commitInput"
      @keyup.enter="commitInput" />
    <template v-else>
      <button
        class="recorder"
        :class="{ recording }"
        type="button"
        :disabled="disabled"
        :aria-label="label"
        :aria-pressed="recording"
        :title="recording ? '按键录制，Esc 取消' : '点击修改快捷键'"
        @click="draft = code; recording = true"
        @keydown.stop="capture"
        @keyup.stop="finishModifiers"
        @blur="cancelRecording">
        <span v-if="recording" class="placeholder">请按快捷键…</span>
        <span v-else-if="!draft" class="placeholder">未绑定</span>
        <span v-else class="bindings">
          <span v-for="(binding, index) in getShortcutBindings(draft)" :key="binding" class="binding">
            <span v-if="index" class="separator">/</span>
            <template v-for="(part, partIndex) in binding.split('+')" :key="part">
              <span v-if="partIndex" class="separator">+</span>
              <kbd>{{ shortcutLabel(part) }}</kbd>
            </template>
          </span>
        </span>
      </button>
      <el-button
        v-if="draft"
        class="clearButton"
        text
        size="small"
        :icon="IconX"
        :disabled="disabled"
        :aria-label="`清除${label}`"
        title="取消绑定"
        @click="draft = ''; emit('change', '')" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { IconX } from "@tabler/icons-vue";
import { getShortcutBindings, isModifierShortcut, shortcutFromEvent, shortcutLabel } from "@/lib/canvasShortcuts";

const { code, mode, label, hold = false, disabled = false } = defineProps<{
  code: string; mode: "listen" | "input"; label: string; hold?: boolean; disabled?: boolean;
}>();
const emit = defineEmits<{ change: [value: string] }>();
const draft = ref(code);
const recording = ref(false);
watch(() => [code, mode], () => { draft.value = code; });
watch(() => mode, () => { recording.value = false; });

function capture(event: KeyboardEvent) {
  if (!recording.value) return;
  event.preventDefault();
  if (event.isComposing || event.repeat) return;
  if (event.key === "Escape") {
    cancelRecording();
    return;
  }
  const binding = shortcutFromEvent(event);
  if (!hold && isModifierShortcut(binding)) return;
  draft.value = binding;
  if (!isModifierShortcut(binding)) {
    emit("change", binding);
    recording.value = false;
  }
}

function finishModifiers(event: KeyboardEvent) {
  if (!recording.value || !hold || !["Control", "Alt", "Shift", "Meta"].includes(event.key) || !isModifierShortcut(draft.value)) return;
  emit("change", draft.value);
  recording.value = false;
}

function cancelRecording() {
  if (recording.value) draft.value = code;
  recording.value = false;
}

function commitInput() {
  if (mode === "input") emit("change", draft.value);
}
</script>

<style lang="scss" scoped>
.keyInput {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  gap: 2px;

  .recorder {
    min-width: 64px;
    max-width: 100%;
    padding: 3px;
    border: 0;
    border-radius: var(--el-border-radius-base);
    background: transparent;
    color: var(--el-text-color-primary);
    font: inherit;
    cursor: pointer;

    &:hover { background: var(--el-fill-color-light); }
    &:focus-visible, &.recording { outline: 2px solid var(--el-color-primary-light-5); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .placeholder { color: var(--el-text-color-placeholder); font-size: 12px; }
    .bindings {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;

      .binding {
        display: inline-flex;
        align-items: center;
        gap: 4px;

        .separator { color: var(--el-text-color-secondary); font-size: 12px; }
        kbd {
          min-width: 22px;
          padding: 1px 5px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 5px;
          background: var(--el-fill-color-blank);
          font: inherit;
          font-size: 12px;
          line-height: 22px;
          white-space: nowrap;
        }
      }
    }
  }

  .clearButton {
    flex-shrink: 0;
    width: 20px;
    height: 24px;
    margin: 0;
    padding: 0;
    opacity: 0;
  }
  &:hover .clearButton, &:focus-within .clearButton { opacity: 1; }
}
</style>
