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
        <el-button class="modelButton" text :disabled="disabled" :aria-label="t('modelAndReasoningSettings')">
          <modelIcon v-if="selectedModelChoice" :model="selectedModelChoice.modelId" :size="14" />
          <span class="modelName">{{ selectedModelChoice?.label ?? t("selectModel") }}</span>
          ·
          <span class="reasoningLabel">{{ reasoningLabel }}</span>
          <icon-chevron-down :size="12" />
        </el-button>
      </template>
      <el-form class="modelOptions" labelPosition="top">
        <el-form-item :label="t('model')">
          <el-select v-model="selectedModel" filterable :disabled="disabled" :teleported="false" :placeholder="t('selectModel')" :aria-label="t('selectModel')" :noDataText="t('addModelFirst')">
            <template #prefix><modelIcon v-if="selectedModelChoice" :model="selectedModelChoice.modelId" :size="18" /></template>
            <el-option-group v-for="provider in modelGroups" :key="provider.id" :label="provider.label">
              <el-option v-for="model in provider.models" :key="model.id" :label="model.label" :value="JSON.stringify([provider.id, model.id])">
                <el-space :size="8">
                  <modelIcon :model="model.id" :size="16" />
                  <span>{{ model.label }}</span>
                </el-space>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('reasoningLevel')">
          <el-segmented v-model="reasoningEffort" :options="reasoningOptions" :disabled="disabled" block :aria-label="t('reasoningLevel')" />
        </el-form-item>
      </el-form>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconChevronDown } from "@tabler/icons-vue";
import { modelIcon } from "@toonflow/model-icons";
import { createTranslator } from "@toonflow/i18n";
import { customProviders, modelChoices } from "@/stores/settings";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
const selectedModel = defineModel<string>({ default: "" });
const reasoningEffort = defineModel<string>("reasoningEffort", { default: "" });
const props = withDefaults(defineProps<{ active?: boolean; disabled?: boolean }>(), { active: true, disabled: false });
const visible = ref(false);
const reasoningOptions = computed(() => [
  { label: t("reasoningDefault"), value: "" },
  { label: t("reasoningLow"), value: "low" },
  { label: t("reasoningMedium"), value: "medium" },
  { label: t("reasoningHigh"), value: "high" },
]);
const modelGroups = computed(() => customProviders.value.toSorted((left, right) => Number(right.id === "tfRouter") - Number(left.id === "tfRouter")));
const selectedModelChoice = computed(() => modelChoices.value.find(item => item.value === selectedModel.value));
const reasoningLabel = computed(() => reasoningOptions.value.find(item => item.value === reasoningEffort.value)?.label ?? t("reasoningDefault"));
watch(selectedModel, () => { reasoningEffort.value = ""; });
watch(modelChoices, items => {
  if (!selectedModel.value) selectedModel.value = items[0]?.value ?? "";
}, { immediate: true });
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
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
      .el-form-item__label {
        margin-bottom: 10px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      .el-segmented {
        width: 100%;

        @media (max-width: 360px) {
          .el-segmented__item {
            padding-inline: 6px;
          }
        }
      }
    }
  }
}
</style>
