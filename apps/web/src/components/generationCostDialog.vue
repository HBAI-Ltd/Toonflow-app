<template>
  <el-dialog v-model="visible" :title="`${providerLabel} 费用提醒`" class="generationCostDialog" width="min(400px, calc(100vw - 32px))"
    alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!editingAmount" :showClose="!savingAmount"
    @opened="!editingAmount && cancelButton?.ref?.focus()">
    <div class="costBody">
      <div class="costSummary">
        <div class="costLabel">
          <icon-alert-triangle :size="17" aria-hidden="true" />
          <span v-if="mediaType === 'image'">本次图片生成预计费用</span>
          <span v-else-if="mediaType === 'audio'">本次音频生成预计费用</span>
          <span v-else>本次视频生成预计费用</span>
        </div>
        <strong class="costValue" dir="auto">{{ estimatedPrice }}</strong>
      </div>
      <p v-if="skipReminder" class="reminderNote">可在此供应商的配置中重新开启提醒。</p>
      <form v-else-if="editingAmount" class="reminderRow amountEditor" aria-label="修改提醒值" novalidate @submit.prevent="saveEdit" @keydown.esc.stop.prevent="closeEditor">
        <label :for="amountId">提醒值</label>
        <el-input :id="amountId" ref="amountInput" v-model="amountText" class="reminderInput" type="number" min="0" step="any" inputmode="decimal" size="small"
          :disabled="savingAmount" :aria-invalid="!validAmount" :aria-describedby="!validAmount || saveFailed ? errorId : undefined" @input="saveFailed = false" />
        <el-button link type="primary" nativeType="submit" :disabled="!validAmount" :loading="savingAmount">确定</el-button>
        <el-button link :disabled="savingAmount" @click="closeEditor">取消</el-button>
      </form>
      <div v-else class="reminderRow">
        <span>{{ `单次报价超过 ${currentAmount} 时提醒` }}</span>
        <el-button ref="editButton" link type="primary" aria-label="修改提醒值" @click="editAmount">编辑</el-button>
      </div>
      <p v-if="editingAmount && !validAmount" :id="errorId" class="amountError" role="alert">请输入大于或等于 0 的数值。</p>
      <p v-else-if="editingAmount && saveFailed" :id="errorId" class="amountError" role="alert">设置保存失败，请稍后重试</p>
    </div>
    <template #footer>
      <div class="costActions">
        <el-checkbox v-model="skipReminder" :disabled="editingAmount">不再提醒此供应商</el-checkbox>
        <div class="actionButtons">
          <el-button ref="cancelButton" :disabled="savingAmount" @click="visible = false">取消</el-button>
          <el-button type="primary" :disabled="editingAmount" @click="emit('confirm', skipReminder)">继续生成</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from "vue";
import { ElButton, ElCheckbox, ElDialog, ElInput, type ButtonInstance, type InputInstance } from "element-plus";
import { IconAlertTriangle } from "@tabler/icons-vue";
import type { NodeMediaPriceRequest } from "@toonflow/nodes-scaffold/nodeAi";

const props = defineProps<{
  providerId: string;
  providerLabel: string;
  mediaType: NodeMediaPriceRequest["mediaType"];
  estimatedPrice: string;
  reminderAmount: number;
  saveAmount: (amount: number) => Promise<void>;
}>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ confirm: [skipReminder: boolean] }>();
const cancelButton = ref<ButtonInstance>();
const editButton = ref<ButtonInstance>();
const amountInput = ref<InputInstance>();
const amountId = useId();
const errorId = useId();
const editingAmount = ref(false);
const currentAmount = ref(props.reminderAmount);
const amountText = ref("");
const savingAmount = ref(false);
const saveFailed = ref(false);
const skipReminder = ref(false);
const validAmount = computed(() => amountText.value.trim() !== "" && Number.isFinite(Number(amountText.value)) && Number(amountText.value) >= 0);

watch([visible, () => props.providerId], ([open]) => {
  if (open) {
    editingAmount.value = false;
    currentAmount.value = props.reminderAmount;
    skipReminder.value = false;
  }
}, { immediate: true });

async function editAmount() {
  amountText.value = String(currentAmount.value);
  saveFailed.value = false;
  editingAmount.value = true;
  await nextTick();
  amountInput.value?.select();
}

async function closeEditor() {
  if (savingAmount.value) return;
  editingAmount.value = false;
  await nextTick();
  editButton.value?.ref?.focus();
}

async function saveEdit() {
  if (!editingAmount.value || savingAmount.value || !validAmount.value) return;
  const amount = Number(amountText.value);
  if (amount !== currentAmount.value) {
    savingAmount.value = true;
    saveFailed.value = false;
    try {
      await props.saveAmount(amount);
      currentAmount.value = amount;
    } catch {
      saveFailed.value = true;
      return;
    } finally {
      savingAmount.value = false;
    }
  }
  await closeEditor();
}
</script>

<style lang="scss">
.generationCostDialog {
  .el-dialog__title { overflow-wrap: anywhere; }

  .costBody {
    .costSummary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 4px 8px;
      padding: 9px 12px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-color-warning-light-9);
      .costLabel {
        display: flex;
        align-items: center;
        gap: 7px;
        svg { flex: none; color: var(--el-color-warning); }
      }
      .costValue {
        margin-inline-start: auto;
        color: var(--el-text-color-primary);
        font-size: 22px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
        max-width: 100%;
        overflow-wrap: anywhere;
      }
    }

    .reminderRow, .reminderNote {
      margin: 6px 0 0;
      color: var(--el-text-color-regular);
      font-size: 13px;
      line-height: 1.6;
    }
    .reminderRow {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 8px;
      min-height: 24px;
      &.amountEditor { align-items: center; }
      .el-button.is-link { height: auto; margin: 0; padding: 0; font: inherit; }
      .reminderInput { width: 86px; }
    }
    .amountError { margin: 4px 0 0; color: var(--el-color-danger); font-size: 12px; }
  }

  .costActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    .actionButtons { margin-inline-start: auto; }
  }
}
</style>
