<template>
  <div class="composer">
    <attachmentList v-if="attachments?.length" class="referenceImages" :attachments="attachments" removable :disabled="busy" @remove="emit('remove', $event)" />
    <el-input v-model="prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" resize="none" :disabled="busy" placeholder="写下场景布局、人物走位和镜头运动，生成可以反复调整的白模预演" aria-label="预演描述" @paste.capture="emit('paste', $event)" />
    <div class="composerBar">
      <div class="composerTools">
        <workspacePicker ref="folderPicker" v-model="sceneDirectory" :disabled="busy" />
        <modelPopover v-if="!hideModelPicker" v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" class="modelPill" />
        <el-select v-model="aspectRatio" class="toolPill" aria-label="画面比例">
          <template #prefix><icon-aspect-ratio :size="15" aria-hidden="true" /></template>
          <el-option v-for="ratio in aspectRatios" :key="ratio" :label="ratio" :value="ratio" />
        </el-select>
        <el-select v-model="duration" class="toolPill" aria-label="预演时长">
          <template #prefix><icon-clock-hour-4 :size="15" aria-hidden="true" /></template>
          <el-option v-for="option in durationOptions" :key="option.value" :label="translate(option.label)" :value="option.value" />
        </el-select>
      </div>
      <button v-if="!sceneDirectory" class="generateButton" type="button" :disabled="busy" @click="folderPicker?.chooseDirectory()">
        <icon-folder :size="14" aria-hidden="true" />
        <span>选择文件夹</span>
      </button>
      <button v-else class="generateButton" type="button" :disabled="!canGenerate" :aria-busy="generating" @click="emit('generate')">
        <icon-player-play-filled :size="14" aria-hidden="true" />
        <span>生成预演</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { markMessages } from "@toonflow/i18n";

export const durationOptions = markMessages([
  { value: "auto", label: "自动时长" },
  { value: "5", label: "5 秒" },
  { value: "10", label: "10 秒" },
  { value: "15", label: "15 秒" },
]);
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import { translate } from "@toonflow/i18n/vue";
import attachmentList from "@/components/agent/attachmentList.vue";
import type { AgentAttachment } from "@/components/agent/types";
import modelPopover from "@/components/modelPopover.vue";
import workspacePicker from "../../workspacePicker.vue";

defineProps<{ attachments?: AgentAttachment[]; busy?: boolean; generating?: boolean; canGenerate?: boolean; hideModelPicker?: boolean }>();
const emit = defineEmits<{ paste: [event: ClipboardEvent]; remove: [index: number]; generate: [] }>();
const prompt = defineModel<string>({ default: "" });
const sceneDirectory = defineModel<string>("directory", { default: "" });
const selectedModel = defineModel<string>("selectedModel", { default: "" });
const reasoningEffort = defineModel<string>("reasoningEffort", { default: "" });
const aspectRatios = ["16:9", "9:16", "2.39:1", "1.85:1", "4:3"];
const aspectRatio = defineModel<string>("aspectRatio", { default: "16:9" });
const duration = defineModel<string>("duration", { default: "auto" });
const folderPicker = ref<InstanceType<typeof workspacePicker>>();
defineExpose({ selecting: computed(() => !!folderPicker.value?.selecting) });
</script>

<style scoped lang="scss">
.composer {
  max-width: 800px;
  margin-inline: auto;
  padding: 16px 18px 12px;
  border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 78%, transparent);
  box-shadow: 0 30px 60px -30px rgb(0 0 0 / 45%), inset 0 1px 0 color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
  backdrop-filter: blur(16px);
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
    box-shadow: 0 30px 60px -30px rgb(0 0 0 / 45%), 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }

  @media (prefers-reduced-motion: reduce) { transition: none; }

  .referenceImages { margin-bottom: 10px; }

  :deep(.el-textarea__inner) {
    padding: 2px 2px 6px;
    box-shadow: none;
    background: transparent;
    font-size: 15px;
    line-height: 1.85;
  }

  .composerBar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;

    .composerTools {
      display: flex;
      align-items: center;
      flex: 1 1 280px;
      flex-wrap: wrap;
      min-width: 0;
      gap: 6px;

      :deep(.workspaceButton) {
        max-width: 200px;
        height: 32px;
        margin: 0;
        padding: 0 12px;
        border-radius: 999px;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-regular);

        &:hover { background: var(--el-fill-color); }
      }

      .modelPill {
        min-width: 0;
        max-width: 230px;

        :deep(.modelButton) {
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          background: var(--el-fill-color-light);
        }
      }

      .toolPill {
        width: 124px;

        :deep(.el-select__wrapper) {
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          background: var(--el-fill-color-light);
          box-shadow: none;

          &:hover { background: var(--el-fill-color); }
        }
      }
    }

    .generateButton {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 38px;
      margin-inline-start: auto;
      padding: 0 18px;
      border: 0;
      border-radius: 999px;
      background: var(--el-text-color-primary);
      color: var(--el-bg-color);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;

      &:hover:not(:disabled) { transform: translateY(-1px); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
      &:disabled { cursor: not-allowed; opacity: 0.32; }

      @media (prefers-reduced-motion: reduce) { transition: none; }
    }
  }
}
@container (max-width: 640px) { .composer { padding: 14px 14px 10px; } }
</style>
