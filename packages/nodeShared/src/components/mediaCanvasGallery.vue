<template>
  <component :is="inline ? 'div' : ElDialog" v-bind="surface" @close="emit('close')">
    <div class="canvasGallery nodrag nopan nowheel" @wheel.stop @mousedown.stop @pointerdown.stop @dblclick.stop>
      <el-input v-if="choices.length > pageSize" v-model="query" clearable :prefixIcon="IconSearch" :placeholder="translate('搜索画布素材')" :aria-label="translate('搜索画布素材')" @input="page = 1" />
      <div v-if="audition" class="audition" :class="{ audioOnly: audition.media?.mimeType.startsWith('audio/') }">
        <span>{{ audition.name }}</span>
        <el-button text size="small" :icon="IconX" :aria-label="translate('关闭')" @click="audition = undefined" />
        <mediaChoicePreview :key="audition.key" class="auditionPlayer" :media="audition.media" :name="audition.name" active playOnLoad />
      </div>
      <ul v-if="visible.length" class="choiceGrid">
        <li v-for="choice in visible" :key="choice.key">
          <button type="button" class="choiceCard" :aria-pressed="order.has(choice.key)" :title="choice.title" @click="emit('choose', choice)">
            <mediaChoicePreview class="tilePreview" :media="choice.media" :text="choice.text" :name="choice.name" />
            <span v-if="order.has(choice.key)" class="choiceOrder" aria-hidden="true">{{ order.get(choice.key) }}</span>
            <span class="choiceName">{{ choice.name }}</span>
          </button>
          <el-button v-if="choice.media && /^(audio|video)\//.test(choice.media.mimeType)" class="previewButton" circle size="small"
            :aria-label="translate('预览') + ' ' + choice.name" :title="translate('预览')" :icon="IconPlayerPlay" @click="audition = choice" />
        </li>
      </ul>
      <div v-else class="emptyGallery" role="status">{{ translate(query ? '没有匹配的素材' : '画布中没有可选素材') }}</div>
      <div v-if="pageCount > 1" class="galleryPages">
        <el-button text size="small" :icon="IconChevronLeft" :disabled="currentPage === 1" :aria-label="translate('上一页')" @click="page = currentPage - 1" />
        <span>{{ currentPage }} / {{ pageCount }}</span>
        <el-button text size="small" :icon="IconChevronRight" :disabled="currentPage === pageCount" :aria-label="translate('下一页')" @click="page = currentPage + 1" />
      </div>
    </div>
    <template v-if="!inline && multiple" #footer>
      <div class="pickerFooter">
        <span>{{ translate('已选素材') }} · {{ order.size }}</span>
        <el-button @click="emit('close')">{{ translate('取消') }}</el-button>
        <el-button type="primary" @click="emit('confirm')">{{ translate('使用素材') }}</el-button>
      </div>
    </template>
  </component>
</template>

<script lang="ts">
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";
export type CanvasChoice = { key: string; nodeId: string; name: string; title: string; connected: boolean; media?: NodeMediaValue; text?: string; format?: string };
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { ElButton, ElDialog, ElInput } from "element-plus";
import { IconChevronLeft, IconChevronRight, IconPlayerPlay, IconSearch, IconX } from "@tabler/icons-vue";
import mediaChoicePreview from "./mediaChoicePreview.vue";

const props = defineProps<{ choices: CanvasChoice[]; order: Map<string, number>; multiple?: boolean; inline?: boolean }>();
const emit = defineEmits<{ close: []; confirm: []; choose: [entry: CanvasChoice] }>();
const surface = computed(() => {
  if (props.inline) return {};
  const width = props.choices.length <= 1 ? 420 : props.choices.length === 2 ? 590 : 700;
  return { modelValue: true, title: translate("画布素材"), width: `min(${width}px, calc(100vw - 24px))`, class: "mediaCanvasDialog", alignCenter: true, appendToBody: true };
});
const query = ref("");
const audition = ref<CanvasChoice>();
const page = ref(1);
const pageSize = 8;
const matches = computed(() => {
  const search = query.value.trim().toLocaleLowerCase();
  return search ? props.choices.filter(choice => choice.title.toLocaleLowerCase().includes(search)) : props.choices;
});
const pageCount = computed(() => Math.ceil(matches.value.length / pageSize));
const currentPage = computed(() => Math.min(page.value, pageCount.value || 1));
const visible = computed(() => matches.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
</script>

<style scoped lang="scss">
.canvasGallery {
  display: grid; gap: 12px; min-width: 0;
  .audition {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px; font-size: 13px;
    .auditionPlayer { grid-column: 1 / -1; height: min(165px, 25dvh); border-radius: var(--el-border-radius-base); }
    &.audioOnly .auditionPlayer { height: 42px; }
  }
  .choiceGrid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(124px, 100%), 1fr)); gap: 10px; padding: 2px; margin: 0; list-style: none;
    li { position: relative; min-width: 0; .previewButton { position: absolute; top: 6px; inset-inline-start: 6px; } }
    .choiceCard {
      display: grid; position: relative; width: 100%; padding: 0; border: 1px solid var(--el-border-color-lighter); overflow: hidden;
      border-radius: var(--el-border-radius-base); text-align: start; cursor: pointer; font: inherit; color: var(--el-text-color-regular); background: var(--el-fill-color-blank);
      &:hover { border-color: var(--el-border-color-darker); }
      &[aria-pressed="true"], &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -1px; }
      .tilePreview { width: 100%; height: auto; max-height: 190px; aspect-ratio: 16 / 10; }
      .choiceName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 7px 9px; font-size: 12px; }
      .choiceOrder { position: absolute; top: 5px; inset-inline-end: 5px; display: grid; place-items: center; min-width: 18px; height: 18px; border-radius: 4px; background: var(--el-color-primary); color: white; font-weight: 600; font-size: 11px; }
    }
  }
  .emptyGallery { padding: 24px 12px; text-align: center; color: var(--el-text-color-secondary); }
  .galleryPages { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
}
.pickerFooter { display: flex; align-items: center; gap: 8px; span { margin-inline-end: auto; font-size: 12px; color: var(--el-text-color-secondary); } .el-button { margin: 0; } }
:global(.mediaCanvasDialog.el-dialog) { display: flex; flex-direction: column; max-height: calc(100dvh - 32px); }
:global(.mediaCanvasDialog .el-dialog__body) { min-height: 0; overflow: auto; }
</style>
