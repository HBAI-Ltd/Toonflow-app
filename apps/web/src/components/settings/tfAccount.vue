<template>
  <div class="tfAccount" :aria-busy="loading">
    <div v-if="apiKey" class="accountHeader">
      <div class="accountBalance">
        <el-text size="small" type="info">账户余额</el-text>
        <el-skeleton v-if="loading && !balance" animated>
          <template #template><el-skeleton-item class="balancePlaceholder" variant="text" /></template>
        </el-skeleton>
        <strong v-else class="balanceNumber">{{ balance ? `${numberFormat.format(balance.balance)} ${balance.unit}` : "—" }}</strong>
      </div>
      <div class="accountActions">
        <el-button text circle :icon="IconRefresh" :loading="loading" :disabled="!apiKey" aria-label="刷新余额" title="刷新余额" @click="refresh" />
        <el-button v-if="!accountEnabled" size="small" :icon="IconCreditCard" :disabled="!apiKey" @click="openRecharge">充值</el-button>
      </div>
    </div>
    <div v-if="!apiKey" class="accountSetup">
      <el-text size="small" type="info">填写API Key开始使用官方供应商</el-text>
      <div class="setupForm">
        <el-input
          v-model="draftKey"
          class="setupInput"
          type="password"
          dir="ltr"
          showPassword
          placeholder="粘贴 API Key"
          :disabled="saving"
          @keyup.enter="submitKey" />
        <el-button type="primary" size="small" :loading="saving" :disabled="!draftKey.trim()" @click="submitKey">保存</el-button>
      </div>
      <el-text v-if="setupError" size="small" type="danger">{{ setupError }}</el-text>
      <el-button tag="a" href="https://api.toonflow.net/" target="_blank" rel="noopener noreferrer" text type="primary" :icon="IconExternalLink">
        前往 TF-Router 官网 获取 API Key
      </el-button>
    </div>
    <div v-else-if="errorMessage" class="accountError" role="alert">
      <el-text size="small" type="danger">{{ errorMessage }}</el-text>
      <el-button text size="small" :disabled="loading" @click="refresh">重试</el-button>
    </div>
    <div v-if="balance" class="accountDetails">
      <div v-if="balance.keyBalance !== undefined" class="accountMetric">
        <el-text size="small" type="info">密钥余额</el-text>
        <span>{{ balance.keyBalance === null ? "无限制" : `${numberFormat.format(balance.keyBalance)} ${balance.unit}` }}</span>
      </div>
      <div v-if="balance.totalConsumption !== undefined" class="accountMetric">
        <el-text size="small" type="info">累计消费</el-text>
        <span>{{ numberFormat.format(balance.totalConsumption) }} {{ balance.unit }}</span>
      </div>
      <div v-if="balance.totalRecharge !== undefined" class="accountMetric">
        <el-text size="small" type="info">累计充值</el-text>
        <span>{{ numberFormat.format(balance.totalRecharge) }} {{ balance.unit }}</span>
      </div>
    </div>
    <component :is="rechargeDialog" v-model="rechargeVisible" :apiKey="apiKey" />
  </div>
</template>

<script setup lang="ts">
import { locale } from "@toonflow/i18n/vue";
import { computed, defineAsyncComponent, onBeforeUnmount, ref, shallowRef, watch, type Component } from "vue";
import axios from "axios";
import { IconCreditCard, IconExternalLink, IconRefresh } from "@tabler/icons-vue";
import type { ProviderBalance } from "@toonflow/providers";
import { getProviderBalance, providerBalances } from "@/lib/providerBilling";
import { accountEnabled } from "@/lib/account";

const props = withDefaults(defineProps<{
  apiKey: string;
  visible?: boolean;
  saveApiKey: (key: string) => Promise<void>;
}>(), { visible: true });
const emit = defineEmits<{ rechargeVisibleChange: [visible: boolean] }>();
const rechargeDialog = shallowRef<Component>();
const rechargeVisible = ref(false);
const apiKey = computed(() =>
  props.apiKey
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim()
);
const balance = ref<ProviderBalance>();
const accountId = ref("");
const sharedBalance = computed(() => accountId.value ? providerBalances.value.find(entry => entry.accountId === accountId.value)?.balance : undefined);
watch(sharedBalance, value => { if (value) balance.value = value; });
const loading = ref(false);
const errorMessage = ref("");
const draftKey = ref("");
const saving = ref(false);
const setupError = ref("");
const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 6 }));
let controller: AbortController | undefined;
let rechargeKey = "";

function openRecharge() {
  if (!apiKey.value || !props.visible) return;
  rechargeKey = apiKey.value;
  rechargeDialog.value ??= defineAsyncComponent(() => import("./tfRechargeDialog.vue"));
  rechargeVisible.value = true;
}

async function submitKey() {
  const key = draftKey.value.trim();
  if (!key || saving.value) return;
  saving.value = true;
  setupError.value = "";
  try {
    await props.saveApiKey(key);
    draftKey.value = "";
  } catch (error) {
    setupError.value = error instanceof Error ? error.message : "保存失败，请重试";
  } finally {
    saving.value = false;
  }
}

async function refresh() {
  controller?.abort();
  loading.value = false;
  errorMessage.value = "";
  if (!apiKey.value || !props.visible) return;
  const request = new AbortController();
  controller = request;
  loading.value = true;
  try {
    const result = await getProviderBalance("tfRouter", { apiKey: apiKey.value, signal: request.signal });
    if (!request.signal.aborted) {
      accountId.value = result.accountId;
      balance.value = sharedBalance.value ?? result.balance ?? undefined;
    }
  } catch (error) {
    if (!request.signal.aborted) {
      errorMessage.value = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "余额查询失败，请重试";
    }
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
}

watch(
  [apiKey, () => props.visible],
  () => {
    rechargeVisible.value = false;
    accountId.value = "";
    balance.value = undefined;
    draftKey.value = "";
    setupError.value = "";
    void refresh();
  },
  { immediate: true }
);
watch(rechargeVisible, (isOpen, wasOpen) => {
  emit("rechargeVisibleChange", isOpen);
  if (wasOpen && !isOpen && rechargeKey === apiKey.value && props.visible) void refresh();
}, { flush: "sync" });
onBeforeUnmount(() => {
  controller?.abort();
  emit("rechargeVisibleChange", false);
});
</script>

<style lang="scss" scoped>
.tfAccount {
  margin-top: 16px;
  padding: 14px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);

  .accountHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .accountBalance {
      display: grid;
      justify-items: start;
      min-width: 0;
      gap: 4px;

      .balanceNumber {
        color: var(--el-text-color-primary);
        font-size: 24px;
        line-height: 1.3;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }

      .balancePlaceholder {
        width: 112px;
        height: 28px;
      }
    }

    .accountActions {
      display: flex;
      align-items: center;
      gap: 6px;

      .el-button + .el-button {
        margin-left: 0;
      }
    }
  }

  .accountError {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    overflow-wrap: anywhere;
  }

  .accountSetup {
    display: grid;
    gap: 8px;
    margin-top: 12px;

    .setupForm {
      display: flex;
      gap: 8px;

      .setupInput {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .accountDetails {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 12px 20px;
    margin-top: 16px;

    .accountMetric {
      display: grid;
      justify-items: start;
      min-width: 0;
      gap: 4px;
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
  }
}
</style>
