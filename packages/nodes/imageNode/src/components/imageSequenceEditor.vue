<template>
  <div class="sequenceEditor">
    <div class="sequencePreview">
      <div class="sequenceStage">
        <div class="outputFrame" :style="{ '--ratio': ratio }">
          <imageSlideFrame v-show="index === 0" :src="src" alt="成片画幅预览" @dimensions="size => firstSize = size" @ready="firstReady = $event" />
          <imageSlideFrame v-if="index > 0" :attachment="slides[index]" alt="成片画幅预览" @ready="slideReady = $event" />
        </div>
      </div>
      <div class="frameInfo">
        <div v-if="slideCount > 1" class="frameNavigation">
          <button type="button" :aria-label="translate(playing ? '暂停' : '播放')" :title="translate(playing ? '暂停' : '播放')" @click="togglePlayback">
            <component :is="playing ? IconPlayerPause : IconPlayerPlay" :size="15" />
          </button>
          <button type="button" :disabled="index === 0" :aria-label="translate('上一张')" @click="step(-1)"><icon-chevron-left :size="16" /></button>
          <span aria-live="polite">{{ index + 1 }} / {{ slideCount }}</span>
          <button type="button" :disabled="index === slideCount - 1" :aria-label="translate('下一张')" @click="step(1)"><icon-chevron-right :size="16" /></button>
        </div>
        <span>{{ ratioLabel }} · {{ t`${totalSeconds} 秒` }}</span>
      </div>
    </div>
    <imageSequenceOptions :tool="tool" :values="values" :sourceRatio="firstSize.width / firstSize.height" @updateValues="emit('updateValues', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconChevronLeft, IconChevronRight, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-vue";
import { t, translate } from "@toonflow/i18n/vue";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
import type { MediaTool, MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import imageSlideFrame from "./imageSlideFrame.vue";
import imageSequenceOptions from "./imageSequenceOptions.vue";
import { getSequenceFrame } from "../imageSequenceTools";

const props = defineProps<{ tool: MediaTool; source: NodeMediaValue; src: string; values: Record<string, string | number>; attachments?: MediaToolAttachment[] }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [value: boolean] }>();
const slideshow = computed(() => props.tool.id === "image-slideshow");
const slides = computed(() => [undefined, ...(slideshow.value ? props.attachments ?? [] : [])]);
const selected = defineModel<number>("previewIndex", { default: 0 });
const slideCount = computed(() => slides.value.length);
const index = computed(() => Math.min(selected.value, slideCount.value - 1));
const firstReady = ref(false), slideReady = ref(false), playing = ref(false);
const activeReady = computed(() => index.value === 0 ? firstReady.value : slideReady.value);
watch(activeReady, value => emit("ready", value), { immediate: true });
function step(direction: number) {
  playing.value = false;
  selected.value = index.value + direction;
}
function togglePlayback() {
  if (!playing.value && index.value === slideCount.value - 1) selected.value = 0;
  playing.value = !playing.value;
}
watch([playing, index, activeReady, slideCount, () => props.values.seconds], (_, __, onCleanup) => {
  if (slideCount.value < 2) playing.value = false;
  if (!playing.value || !activeReady.value || !Number(props.values.seconds)) return;
  const timer = setTimeout(() => {
    if (index.value < slideCount.value - 1) selected.value = index.value + 1;
    else playing.value = false;
  }, Number(props.values.seconds) * 1000);
  onCleanup(() => clearTimeout(timer));
});
const totalSeconds = computed(() => (Number(props.values.seconds) || 0) * slideCount.value);
const firstSize = ref({ width: 1, height: 1 });
watch(() => props.src, () => { selected.value = 0; playing.value = false; firstSize.value = { width: 1, height: 1 }; });
const frame = computed(() => getSequenceFrame(props.values.ratio, firstSize.value.width, firstSize.value.height));
const ratio = computed(() => frame.value.width / frame.value.height);
const ratioLabel = computed(() => `${frame.value.width} × ${frame.value.height} px`);
</script>

<style scoped lang="scss">
.sequenceEditor {
  display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 18px; align-items: center;
  @container (max-width: 520px) { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .sequencePreview { min-width: 0; }
  .sequenceStage {
    --frameHeight: clamp(124px, 32dvh, 260px);
    display: grid; place-items: center; height: var(--frameHeight);
    background: var(--el-fill-color-darker); border-radius: var(--el-border-radius-base);
    .outputFrame { display: grid; place-items: center; width: min(100%, calc(var(--frameHeight) * var(--ratio))); aspect-ratio: var(--ratio); overflow: hidden; background: #000; }
  }
  .frameInfo { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin: 6px 0 10px; font-size: 12px; color: var(--el-text-color-secondary); }
  .frameNavigation {
    display: inline-flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); font-variant-numeric: tabular-nums;
    button { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); background: var(--el-fill-color-light); color: inherit; cursor: pointer; }
    button:disabled { color: var(--el-text-color-disabled); cursor: default; }
    &:dir(rtl) svg { transform: scaleX(-1); }
  }
}
</style>
