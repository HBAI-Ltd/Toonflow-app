<template>
  <div class="modelPopover">
    <el-popover
      v-model:visible="visible"
      trigger="click"
      placement="top-start"
      :width="340"
      :offset="10"
      :showArrow="false"
      popperClass="agentModelPopover"
      :popperStyle="{ padding: '20px', maxWidth: 'calc(100vw - 24px)' }">
      <template #reference>
        <el-button class="modelButton" text :disabled="disabled" aria-label="模型与思考强度设置">
          <modelIcon v-if="selectedModelChoice" :model="selectedModelChoice.modelId" :size="14" />
          <modelLabel class="modelName" :label="selectedModelChoice?.label ?? '选择模型'" :providerId="selectedModelChoice?.providerId" />
          <template v-if="reasoningLevels.length">
            ·
            <span class="reasoningLabel">{{ reasoningLabel }}</span>
          </template>
          <component :is="visible ? IconChevronUp : IconChevronDown" :size="14" aria-hidden="true" />
        </el-button>
      </template>
      <el-form class="modelOptions" labelPosition="top">
        <el-form-item label="模型">
          <el-select :modelValue="selectedModelChoice ? selectedModel : ''" filterable :disabled="disabled" :teleported="false" placeholder="选择模型" aria-label="选择模型" noDataText="请先在设置中添加模型" @update:modelValue="selectedModel = $event" @change="reasoningEffort = ''">
            <template #prefix><modelIcon v-if="selectedModelChoice" :model="selectedModelChoice.modelId" :size="18" /></template>
            <template #label="{ label }"><modelLabel :label="label" :providerId="selectedModelChoice?.providerId" /></template>
            <el-option-group v-for="provider in customProviders" :key="provider.id" :label="provider.label">
              <el-option v-for="model in provider.models" :key="model.id" :label="model.label" :value="JSON.stringify([provider.id, model.id])">
                <div class="modelOption">
                  <modelIcon :model="model.id" :size="16" />
                  <modelLabel class="modelOptionLabel" :label="model.label" :providerId="provider.id" />
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item v-if="reasoningLevels.length" label="思考强度">
          <div class="reasoningSettings">
            <div class="reasoningGrid" role="radiogroup" aria-label="思考强度" :aria-describedby="`${reasoningId}Hint`" :style="{ gridTemplateColumns: `repeat(${reasoningColumns}, minmax(0, 1fr))` }">
              <label v-for="option in reasoningOptions" :key="option.value" class="reasoningOption">
                <input v-model="reasoningEffort" type="radio" :name="reasoningId" :value="option.value" :disabled="disabled" />
                <span class="reasoningOptionLabel">{{ option.label }}</span>
              </label>
            </div>
            <div :id="`${reasoningId}Hint`" class="reasoningHint">默认由模型决定</div>
          </div>
        </el-form-item>
      </el-form>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-vue";
import { modelIcon } from "@toonflow/model-icons";
import modelLabel from "@toonflow/node-shared/modelLabel";
import type { ThinkingLevel } from "@toonflow/server/modelReasoning";
import { customProviders, modelChoices } from "@/stores/settings";

const selectedModel = defineModel<string>({ default: "" });
const reasoningEffort = defineModel<string>("reasoningEffort", { default: "" });
const props = withDefaults(defineProps<{ active?: boolean; disabled?: boolean }>(), { active: true, disabled: false });
const visible = ref(false);
const reasoningId = useId();
const reasoningLabels: Record<ThinkingLevel, string> = { off: "关闭", minimal: "最小", low: "低", medium: "中", high: "高", xhigh: "极高", max: "最高" };
const selectedModelChoice = computed(() => modelChoices.value.find(item => item.value === selectedModel.value));
const reasoningLevels = computed(() => selectedModelChoice.value?.reasoningLevels ?? []);
const reasoningOptions = computed(() => [{ label: "默认", value: "" }, ...reasoningLevels.value.map(value => ({ label: reasoningLabels[value], value }))]);
const reasoningColumns = computed(() => Math.min(4, reasoningOptions.value.length > 4 ? Math.ceil(reasoningOptions.value.length / 2) : reasoningOptions.value.length));
const reasoningLabel = computed(() => reasoningOptions.value.find(item => item.value === reasoningEffort.value)?.label ?? "默认");
watch(modelChoices, items => {
  if (!selectedModel.value) selectedModel.value = items[0]?.value ?? "";
}, { immediate: true });
watch([() => selectedModelChoice.value?.reasoningLevels, reasoningEffort], ([levels, effort]) => {
  if (levels && effort && !levels.includes(effort as ThinkingLevel)) reasoningEffort.value = "";
}, { immediate: true, flush: "post" });
watch(() => !props.active || props.disabled, close => { if (close) visible.value = false; });
</script>

<style lang="scss">
.modelPopover {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;

  .modelButton {
    max-width: 100%;
    min-width: 0;
    height: 28px;
    padding: 0 8px;
    color: var(--el-text-color-regular);

    > span {
      display: flex;
      gap: 6px;
      min-width: 0;
    }
    svg {
      flex-shrink: 0;
    }

    .reasoningLabel {
      flex-shrink: 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .modelName {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
  }
}

.agentModelPopover {
  .modelOptions {
    .el-form-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
      .el-form-item__label {
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      .el-select {
        width: 100%;

        .modelOption {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;

          .modelOptionLabel {
            flex: 1;
          }
        }
      }
      .reasoningSettings {
        width: 100%;

        .reasoningGrid {
          display: grid;
          gap: 6px;

          .reasoningOption {
            position: relative;
            min-width: 0;

            input {
              position: absolute;
              width: 1px;
              height: 1px;
              overflow: hidden;
              clip-path: inset(50%);

              &:checked + .reasoningOptionLabel {
                border-color: var(--el-color-primary-light-5);
                background: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
                font-weight: 600;
              }
              &:focus-visible + .reasoningOptionLabel {
                outline: 2px solid var(--el-color-primary);
                outline-offset: 2px;
              }
              &:disabled + .reasoningOptionLabel {
                opacity: .5;
                cursor: not-allowed;
              }
            }
            .reasoningOptionLabel {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 32px;
              padding: 4px 8px;
              border: 1px solid var(--el-border-color-lighter);
              border-radius: var(--el-border-radius-base);
              background: var(--el-fill-color-light);
              color: var(--el-text-color-regular);
              font-size: 12px;
              line-height: 20px;
              cursor: pointer;
              transition: background-color .15s, border-color .15s, color .15s;
            }
            &:hover input:not(:disabled) + .reasoningOptionLabel {
              border-color: var(--el-color-primary-light-5);
              color: var(--el-color-primary);
            }
          }
        }
        .reasoningHint {
          margin-top: 8px;
          color: var(--el-text-color-secondary);
          font-size: 12px;
          line-height: 18px;
        }
      }
    }
  }
}
</style>
