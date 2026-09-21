<template>
  <section class="directorPanel" aria-label="动画">
    <header class="chatHeader">
      <icon-sparkles :size="16" aria-hidden="true" />
      <span>方案 <small>{{ plans.length }}</small></span>
    </header>
    <div class="planContent">
      <div v-if="plans.length || tasks.length" class="itemList" aria-label="动画列表">
        <button v-for="plan in plans" :key="plan.id" type="button" class="planItem" :class="{ selected: plan.id === selectedPlanId }" :aria-pressed="plan.id === selectedPlanId" @click="emit('selectPlan', plan.id)">
          <icon-movie :size="18" aria-hidden="true" />
          <div class="itemContent">
            <strong>{{ plan.name }}</strong>
            <span>{{ plan.duration }} 秒 · {{ plan.tracks.length }} 条模型动画</span>
            <template v-if="plan.id === selectedPlanId">
              <span>输入提示词</span>
              <p class="planInstruction">{{ plan.instruction || '此旧方案未保存输入提示词' }}</p>
            </template>
          </div>
          <icon-check v-if="plan.id === selectedPlanId" :size="16" aria-hidden="true" />
        </button>
        <div v-for="task in tasks" :key="task.id" class="planItem taskItem" :aria-busy="!task.error">
          <icon-alert-circle v-if="task.error" :size="18" aria-hidden="true" /><icon-loader-2 v-else class="loadingIcon" :size="18" aria-hidden="true" />
          <div class="itemContent"><strong>{{ task.instruction }}</strong><span v-if="task.error" class="generationError" role="alert">{{ task.error }}</span><span v-else role="status">后台生成中…</span></div>
          <el-button v-if="task.error" text :icon="IconArrowBackUp" aria-label="重新编辑指令" @click="emit('editInstruction', task.instruction)" />
        </div>
      </div>
      <template v-else>
        <p>描述模型动作和运镜要求</p>
      </template>
    </div>
    <p class="instructionHint">{{ referenceCount ? `使用 ${referenceCount} 个关键帧生成运镜` : result ? `参考：${result.name}` : '模型动画与运镜同步生成' }}</p>
    <footer class="chatFooter">
      <div class="inputContent"><slot name="input" /></div>
      <div class="inputActions">
        <el-select v-model="model" class="modelSelect" size="small" :loading="modelsLoading" filterable placeholder="选择模型" aria-label="生成模型" @visibleChange="$event && emit('loadModels')">
          <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
            <el-option v-for="item in provider.models" :key="item.modelId" :label="item.label" :value="JSON.stringify([item.providerId, item.modelId])" />
          </el-option-group>
        </el-select>
        <el-button class="sendButton" type="primary" round :disabled="initializing || !prompt.trim() || !model" aria-label="生成动画" @click="sendInstruction">
          <icon-sparkles :size="14" /><span>生成方案</span>
        </el-button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElOption, ElOptionGroup, ElSelect } from "element-plus";
import { IconLoader2, IconSparkles, IconMovie, IconCheck, IconAlertCircle, IconArrowBackUp } from "@tabler/icons-vue";
import { groupNodeModels, type NodeAiModel } from "@toonflow/nodes-scaffold/runtime";

import type { DirectorPlan, DirectorPlanItem, DirectorGeneration } from "./sceneAnimation";

const props = defineProps<{ result?: DirectorPlan; referenceCount: number; initializing: boolean; plans: DirectorPlanItem[]; selectedPlanId: string; tasks: DirectorGeneration[]; models: NodeAiModel[]; modelsLoading: boolean }>();
const emit = defineEmits<{ editInstruction: [value: string]; selectPlan: [id: string]; send: []; loadModels: [] }>();
const prompt = defineModel<string>("prompt", { default: "" });
const model = defineModel<string>("model", { default: "" });
const modelGroups = computed(() => groupNodeModels(props.models));
function sendInstruction() {
  if (props.initializing || !prompt.value.trim() || !model.value) return;
  emit("send");
}

</script>

<style scoped lang="scss">
.directorPanel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  color: var(--el-text-color-primary);

  .chatHeader {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 14px;
    font-size: 14px;
    font-weight: 500;
    small { color: var(--el-text-color-secondary); font-weight: 400; }
  }

  .planContent {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;

    .itemList {
      display: flex; flex-direction: column; gap: 8px;
      .planItem {
        display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px;
        border: 0; border-radius: calc(var(--el-border-radius-base) * 2);
        background: transparent; color: var(--el-text-color-regular); text-align: left; font: inherit;
        &:is(button) { cursor: pointer; }
        &:is(button):hover { background: var(--el-fill-color); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
        &.selected { background: var(--el-fill-color); color: var(--el-text-color-primary); }
        > svg { flex-shrink: 0; }
        .itemContent { flex: 1; min-width: 0;
          strong { display: block; font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
          span { display: block; margin-top: 3px; color: var(--el-text-color-secondary); font-size: 11px; }
          .planInstruction { margin: 4px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; user-select: text; }
          .generationError { color: var(--el-color-danger); overflow-wrap: anywhere; }
        }
      }
    }
    h3 { margin: 8px 0; color: var(--el-text-color-primary); font-size: 16px; font-weight: 500; overflow-wrap: anywhere; }
    p { margin: 16px 0; }
    .loadingIcon { animation: directorLoading 1.2s linear infinite; }
  }

  .instructionHint { flex-shrink: 0; margin: 12px; font-size: 11px; line-height: 1.5; color: var(--el-text-color-secondary); overflow-wrap: anywhere; }

  .chatFooter {
    flex-shrink: 0;
    margin: 0 8px 4px;
    padding: 4px;
    border: 1px solid var(--el-border-color-light);
    border-radius: calc(var(--ui-radius, 4px) * 2.75);
    background: var(--el-bg-color);

    &:focus-within { border-color: var(--el-color-primary-light-5); }

    .inputContent {
      padding: 8px;
      min-width: 0;
      :deep(.referenceList) { margin-bottom: 8px; }
    }

    .inputActions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 4px;

      .modelSelect {
        flex: 1;
        min-width: 0;
        max-width: calc(100% - 112px);

        :deep(.el-select__wrapper) {
          background: transparent;
          box-shadow: none;
          border-radius: var(--el-border-radius-base);

          &:hover:not(.is-disabled) { background: var(--el-fill-color-light); }
          &.is-focused { box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset; }
        }

        :deep(.el-select__selected-item) { color: var(--el-text-color-regular); }
      }

      .sendButton {
        flex-shrink: 0;
        padding: 0 12px;
        height: 32px;
        margin: 0;
      }
    }
  }
}

@keyframes directorLoading { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .directorPanel .planContent .loadingIcon { animation: none; }
}
</style>
