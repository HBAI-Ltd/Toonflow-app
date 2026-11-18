<template>
  <div class="agentModelPicker">
    <el-popover v-model:visible="visible" trigger="click" placement="top-start" :width="300" :offset="10" :showArrow="false" popperClass="agentModelPopover" :popperStyle="{ padding: '16px', maxWidth: 'calc(100vw - 24px)' }">
      <template #reference>
        <el-button class="modelButton" text :disabled="disabled" aria-label="模型与思考强度设置" :title="selected ? `${selected.label}${levels.length ? ` · 思考${reasoningLabel}` : ''}` : '选择模型'">
          <modelLabel class="modelName" :label="selected?.label ?? (loading ? '读取模型…' : '选择模型')" :providerId="selected?.providerId" :modelId="selected?.modelId" />
          <template v-if="levels.length"><span class="dot">·</span><span class="reasoningLabel">{{ reasoningLabel }}</span></template>
          <component :is="visible ? IconChevronUp : IconChevronDown" :size="14" aria-hidden="true" />
        </el-button>
      </template>
      <el-form class="modelOptions" labelPosition="top" @submit.prevent>
        <el-form-item label="模型">
          <el-select :modelValue="selected ? modelValue : ''" filterable :disabled="disabled" :teleported="false" :loading="loading" placeholder="选择模型" aria-label="选择模型" :noDataText="loading ? '读取模型…' : '请先在 Toonflow 设置中添加文本模型'" @update:modelValue="select">
            <el-option-group v-for="group in groups" :key="group.id" :label="group.label">
              <el-option v-for="model in group.models" :key="model.key" :label="model.label" :value="model.key">
                <modelLabel :label="model.label" :providerId="model.providerId" :modelId="model.modelId" />
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item v-if="levels.length" label="思考强度">
          <div class="reasoningGrid" role="radiogroup" aria-label="思考强度" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
            <label v-for="option in options" :key="option.value" class="reasoningOption" :class="{ checked: thinking === option.value }">
              <input type="radio" :name="radioName" :value="option.value" :checked="thinking === option.value" :disabled="disabled" @change="thinking = option.value" />
              <span>{{ option.label }}</span>
            </label>
          </div>
          <p class="reasoningHint">默认由模型决定；越高规划越久</p>
        </el-form-item>
      </el-form>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { ElButton, ElForm, ElFormItem, ElOption, ElOptionGroup, ElPopover, ElSelect } from "element-plus";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-vue";
import modelLabel from "@toonflow/node-shared/modelLabel";
import type { ThinkingLevel } from "../singleAgent";

/**
 * 与宿主画布 Agent 输入区的模型弹层同构：按钮显示模型名 · 思考强度，点开按供应商分组选模型、按格子选思考强度。
 * modelValue 是 JSON.stringify([providerId, modelId])，和编辑器原来的 modelKey 一致。
 */
type PickerModel = { providerId: string; providerLabel?: string; modelId: string; label: string; reasoningLevels?: readonly string[] };
const props = defineProps<{ models: readonly PickerModel[]; loading?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ open: [] }>();
const modelValue = defineModel<string>({ default: "" });
const thinking = defineModel<ThinkingLevel | "">("thinking", { default: "" });
const visible = ref(false);
const radioName = useId();
const labels: Record<ThinkingLevel, string> = { off: "关闭", minimal: "最小", low: "低", medium: "中", high: "高", xhigh: "极高", max: "最高" };
const keyed = computed(() => props.models.map(model => ({ ...model, key: JSON.stringify([model.providerId, model.modelId]) })));
const selected = computed(() => keyed.value.find(model => model.key === modelValue.value));
const groups = computed(() => {
  const map = new Map<string, { id: string; label: string; models: typeof keyed.value }>();
  for (const model of keyed.value) {
    const group = map.get(model.providerId);
    if (group) group.models.push(model);
    else map.set(model.providerId, { id: model.providerId, label: model.providerLabel || model.providerId, models: [model] });
  }
  return [...map.values()];
});
const levels = computed(() => (selected.value?.reasoningLevels ?? []).filter((level): level is ThinkingLevel => Object.hasOwn(labels, level)));
const options = computed(() => [{ label: "默认", value: "" as ThinkingLevel | "" }, ...levels.value.map(value => ({ label: labels[value], value }))]);
const columns = computed(() => Math.min(4, options.value.length > 4 ? Math.ceil(options.value.length / 2) : options.value.length));
const reasoningLabel = computed(() => options.value.find(option => option.value === thinking.value)?.label ?? "默认");

function select(value: string) {
  modelValue.value = value;
  thinking.value = "";
}
watch(levels, value => { if (thinking.value && !value.includes(thinking.value)) thinking.value = ""; });
watch(() => props.disabled, disabled => { if (disabled) visible.value = false; });
watch(visible, value => { if (value) emit("open"); });
/** 编辑器里“请先选择模型”时直接把弹层打开。 */
function open() { if (!props.disabled) visible.value = true; }
defineExpose({ open });
</script>

<style lang="scss">
.agentModelPicker {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;

  .modelButton.el-button {
    max-width: 100%;
    min-width: 0;
    height: 28px;
    margin: 0;
    padding: 0 6px;
    color: var(--el-text-color-regular);
    font-size: 12px;

    > span { display: flex; align-items: center; gap: 5px; min-width: 0; }
    svg { flex-shrink: 0; }
    .modelName { min-width: 0; }
    // 对话框比宿主侧栏窄：按钮里不放“官方”标签（下拉列表里照常显示），名字多留点地方。
    .officialTag { display: none; }
    .dot, .reasoningLabel { flex-shrink: 0; color: var(--el-text-color-secondary); }
  }
}

.agentModelPopover {
  .modelOptions {
    .el-form-item { margin-bottom: 14px; &:last-child { margin-bottom: 0; } }
    .el-form-item__label { margin-bottom: 6px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
    .el-select { width: 100%; }
  }
  .reasoningGrid { display: grid; gap: 6px; width: 100%; }
  .reasoningOption {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    color: var(--el-text-color-regular);
    font-size: 12px;
    cursor: pointer;
    input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
    &.checked { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
    &:has(input:focus-visible) { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
    &:has(input:disabled) { cursor: not-allowed; opacity: 0.6; }
  }
  .reasoningHint { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; }
}
</style>
