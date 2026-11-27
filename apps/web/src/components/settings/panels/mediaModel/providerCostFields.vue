<template>
  <el-form-item label="启用" :inert="readOnly">
    <el-switch v-model="enabled" aria-label="生成费用提醒" />
  </el-form-item>
  <el-form-item label="提醒值" :inert="readOnly" :error="showError ? translate('请输入大于或等于 0 的数值。') : ''">
    <el-input v-model="amount" type="number" min="0" step="any" inputmode="decimal"
      :disabled="!enabled" :aria-invalid="!!showError" :aria-describedby="hintId" />
  </el-form-item>
  <el-text :id="hintId" size="small" type="info">单次报价超过提醒值时，生成前弹窗确认。</el-text>
</template>

<script setup lang="ts">
import { useId } from "vue";
import { translate } from "@toonflow/i18n/vue";

defineProps<{ showError?: boolean; readOnly?: boolean }>();
const enabled = defineModel<boolean>("enabled", { required: true });
const amount = defineModel<string>("amount", { required: true });
const hintId = useId();
</script>
