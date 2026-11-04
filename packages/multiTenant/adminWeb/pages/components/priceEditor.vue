<template>
  <div class="priceEditor">
    <template v-for="editor in editors" :key="editor.key">
      <fieldset class="priceSection" :disabled="disabled">
        <legend>{{ editor.label }}</legend>
        <div class="priceFields">
          <el-form-item :label="translate('计价方式')" :for="`${editorId}${editor.key}Mode`" required>
            <el-select :id="`${editorId}${editor.key}Mode`" :modelValue="editor.price.mode" :disabled="disabled" @update:modelValue="setMode(editor.key, $event)">
              <el-option v-for="mode in modes" :key="mode" :value="mode" :label="modeLabel(mode)" />
            </el-select>
          </el-form-item>
          <el-form-item :label="translate('币种')" :for="`${editorId}${editor.key}Currency`" required>
            <el-select :id="`${editorId}${editor.key}Currency`" :modelValue="editor.price.currency" :disabled="disabled" @update:modelValue="setCurrency(editor.key, $event)">
              <el-option value="CNY" label="CNY" />
              <el-option value="USD" label="USD" />
            </el-select>
          </el-form-item>
          <template v-if="editor.price.mode === 'perMillionTokens'">
            <el-form-item v-for="field in tokenFields" :key="field.key" :label="field.label" :for="`${editorId}${editor.key}${field.key}`" required>
              <el-input :id="`${editorId}${editor.key}${field.key}`" :modelValue="editor.price[field.key]" :disabled="disabled" inputmode="decimal" :maxlength="18" @update:modelValue="setAmount(editor.key, field.key, $event)" />
            </el-form-item>
          </template>
          <el-form-item v-else :label="translate('金额')" :for="`${editorId}${editor.key}Amount`" required>
            <el-input :id="`${editorId}${editor.key}Amount`" :modelValue="editor.price.amount" :disabled="disabled" inputmode="decimal" :maxlength="18" @update:modelValue="setAmount(editor.key, 'amount', $event)" />
          </el-form-item>
        </div>
      </fieldset>
      <el-form-item v-if="editor.key === 'sale'" class="costToggle" :label="translate('记录上游成本')" :for="`${editorId}CostEnabled`">
        <el-switch :id="`${editorId}CostEnabled`" :modelValue="costPrice !== null" :disabled="disabled" @update:modelValue="setCostEnabled" />
      </el-form-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import type { ModelPrice, ModelRoute } from "@toonflow/multi-tenant-models/config";
import { ElFormItem, ElInput, ElOption, ElSelect, ElSwitch } from "element-plus";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/switch/style/css";

const props = defineProps<{ type: ModelRoute["type"]; disabled?: boolean }>();
const salePrice = defineModel<ModelPrice>("salePrice", { required: true });
const costPrice = defineModel<ModelPrice | null>("costPrice", { required: true });
const editorId = useId();
const modes = computed<ModelPrice["mode"][]>(() => props.type === "text" ? ["perMillionTokens"]
  : props.type === "video" ? ["perRequest", "perSecond"] : ["perRequest"]);
const editors = computed(() => [
  { key: "sale" as const, label: translate("用户售价"), price: salePrice.value },
  ...(costPrice.value ? [{ key: "cost" as const, label: translate("上游成本"), price: costPrice.value }] : []),
]);
const tokenFields = computed(() => [
  { key: "input" as const, label: translate("输入价格（每百万 Token）") },
  { key: "output" as const, label: translate("输出价格（每百万 Token）") },
  { key: "cacheRead" as const, label: translate("缓存读取价格（每百万 Token）") },
  { key: "cacheWrite" as const, label: translate("缓存写入价格（每百万 Token）") },
]);

function modeLabel(mode: ModelPrice["mode"]) {
  return mode === "perMillionTokens" ? translate("每百万 Token") : mode === "perSecond" ? translate("每秒") : translate("每次请求");
}
function emptyPrice(mode = modes.value[0]!, currency: ModelPrice["currency"] = "CNY"): ModelPrice {
  return mode === "perMillionTokens" ? { mode, currency, input: "", output: "", cacheRead: "", cacheWrite: "" }
    : { mode, currency, amount: "" };
}
function currentPrice(key: "sale" | "cost") { return key === "sale" ? salePrice.value : costPrice.value; }
function updatePrice(key: "sale" | "cost", price: ModelPrice) {
  if (key === "sale") salePrice.value = price;
  else costPrice.value = price;
}
function setMode(key: "sale" | "cost", mode: ModelPrice["mode"]) {
  if (props.disabled || !modes.value.includes(mode)) return;
  const previous = currentPrice(key);
  if (previous?.mode === mode) return;
  updatePrice(key, emptyPrice(mode, previous?.currency));
}
function setCurrency(key: "sale" | "cost", currency: ModelPrice["currency"]) {
  const previous = currentPrice(key);
  if (!props.disabled && previous && (currency === "CNY" || currency === "USD")) updatePrice(key, { ...previous, currency });
}
function setAmount(key: "sale" | "cost", field: "input" | "output" | "cacheRead" | "cacheWrite" | "amount", value: string | number) {
  const previous = currentPrice(key);
  if (props.disabled || !previous || !(field in previous)) return;
  updatePrice(key, { ...previous, [field]: String(value) });
}
function setCostEnabled(value: boolean | string | number) {
  if (!props.disabled && typeof value === "boolean") costPrice.value = value ? emptyPrice() : null;
}
watch(() => props.type, () => {
  if (!modes.value.includes(salePrice.value.mode)) salePrice.value = emptyPrice(undefined, salePrice.value.currency);
  if (costPrice.value && !modes.value.includes(costPrice.value.mode)) costPrice.value = emptyPrice(undefined, costPrice.value.currency);
});
</script>

<style lang="scss" scoped>
.priceEditor {
  min-width: 0;

  .priceSection {
    min-width: 0;
    margin: 0 0 24px;
    padding: 20px 0 0;
    border: 0;
    border-top: 1px solid var(--el-border-color-lighter);

    legend { padding: 0 12px 0 0; color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; }
    .priceFields {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0 24px;

      .el-select { width: 100%; }
      :deep(.el-input__wrapper), :deep(.el-select__wrapper) { min-height: 44px; }
      :deep(.el-form-item__label) { height: auto; padding-bottom: 8px; line-height: 1.5; }
    }
  }
  .costToggle { margin-bottom: 24px; }
  @media (max-width: 600px) { .priceSection .priceFields { grid-template-columns: minmax(0, 1fr); } }
}
</style>
