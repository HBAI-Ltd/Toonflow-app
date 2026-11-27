<template>
  <el-button class="reminderTrigger" text :icon="IconBell" :aria-label="dialogTitle" aria-haspopup="dialog" @click="openSettings">费用提醒</el-button>
  <el-dialog v-model="visible" :title="dialogTitle" width="min(400px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose
    :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving">
    <el-form :id="formId" class="costSettings" labelPosition="top" :disabled="saving" novalidate @submit.prevent="save">
      <providerCostFields v-model:enabled="enabled" v-model:amount="amountText" :showError="showError" />
      <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" showIcon />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" nativeType="submit" :form="formId" :disabled="!changed || showError" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import axios from "axios";
import { ElAlert, ElButton, ElDialog, ElForm, ElMessage } from "element-plus";
import { IconBell } from "@tabler/icons-vue";
import { t, translate } from "@toonflow/i18n/vue";
import { getMediaCostReminder, saveMediaCostReminder } from "@/stores/settings";
import providerCostFields from "./providerCostFields.vue";

const props = defineProps<{ providerId: string; providerLabel: string }>();
const dialogTitle = computed(() => t`${props.providerLabel} 费用提醒`);
const saved = computed(() => getMediaCostReminder(props.providerId));
const formId = useId();
const visible = ref(false);
const enabled = ref(true);
const amountText = ref("");
const saving = ref(false);
const saveError = ref("");
const amount = computed(() => amountText.value.trim() === "" ? NaN : Number(amountText.value));
const validAmount = computed(() => Number.isFinite(amount.value) && amount.value >= 0);
const showError = computed(() => enabled.value && !validAmount.value);
const changed = computed(() => enabled.value !== saved.value.remindersEnabled || amount.value !== saved.value.reminderAmount);

function openSettings() {
  enabled.value = saved.value.remindersEnabled;
  amountText.value = String(saved.value.reminderAmount);
  saveError.value = "";
  visible.value = true;
}

async function save() {
  if (!visible.value || saving.value || !changed.value || showError.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    await saveMediaCostReminder(props.providerId, {
      remindersEnabled: enabled.value,
      reminderAmount: validAmount.value ? amount.value : saved.value.reminderAmount,
    });
    visible.value = false;
    ElMessage.success("设置已保存");
  } catch (error) {
    saveError.value = axios.isAxiosError(error) && error.response?.data?.message || (error instanceof Error ? error.message : translate("保存设置失败"));
  } finally {
    saving.value = false;
  }
}
</script>
