<template>
  <div class="transportGroup">
    <button type="button" :disabled="disabled" :aria-label="translate('回到开头')" :title="translate('回到开头（Home）')" @click="emit('rewind')"><icon-player-skip-back :size="16" /></button>
    <button type="button" class="playButton" :disabled="disabled" :aria-label="playLabel" :title="playLabel" @click="emit('togglePlayback')"><component :is="completed ? IconRotate : running ? IconPlayerPause : IconPlayerPlay" :size="17" /></button>
  </div>
  <output class="timeReadout" :aria-label="translate('当前位置及总时长')"><b><slot /></b><span class="total">/ {{ totalLabel }}</span></output>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconPlayerPause, IconPlayerPlay, IconPlayerSkipBack, IconRotate } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";

const props = defineProps<{ disabled?: boolean; running?: boolean; completed?: boolean; totalLabel: string }>();
const emit = defineEmits<{ rewind: []; togglePlayback: [] }>();
const playLabel = computed(() => props.completed ? translate("重播") : props.running ? translate("暂停") : translate("播放"));
</script>

<style scoped lang="scss">
.transportGroup {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--studioControlBackground);
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 30px;
    padding: 0 7px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background-color 140ms ease, transform 120ms ease;
    &:hover:not(:disabled) { background: var(--studioHoverBackground); }
    &:active:not(:disabled) { background: var(--studioPressedBackground); transform: scale(0.94); }
    &:disabled { cursor: default; opacity: 0.45; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
    &.playButton {
      width: 38px;
      color: var(--el-color-white, #fff);
      background: var(--el-color-primary);
      box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
      &:hover:not(:disabled) { background: color-mix(in srgb, var(--el-color-primary) 84%, #fff); }
      &:active:not(:disabled) { background: color-mix(in srgb, var(--el-color-primary) 86%, #000); }
    }
    @media (prefers-reduced-motion: reduce) { transition: none; }
  }
}
.timeReadout {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  b { font-weight: 600; }
  .total { margin-inline-start: 4px; color: var(--el-text-color-secondary); }
}
</style>
