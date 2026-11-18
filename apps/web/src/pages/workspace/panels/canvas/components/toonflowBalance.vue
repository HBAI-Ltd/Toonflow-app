<template>
  <el-card class="balanceCard toonflowBalance" shadow="never" :bodyStyle="{ padding: '0' }">
    <el-popover v-model:visible="balanceVisible" trigger="click" placement="bottom-end" :width="360" :popperStyle="{ maxWidth: 'calc(100vw - 32px)' }" :showArrow="false" @show="refreshPreview">
      <template #reference>
        <el-button class="balanceTrigger" text :aria-busy="loading" :aria-expanded="balanceVisible" :title="error || '账户余额'" aria-label="账号与余额">
          <span class="balanceRow"><span class="providerLabel">Toonflow</span><span class="balanceAmount">{{ balanceText }}</span></span>
          <span v-if="preview && preview.bonusBalance > 0" class="bonusRow"><span>可用赠送金</span><span>{{ formatMoney(preview.bonusBalance) }}</span></span>
        </el-button>
      </template>
      <div class="accountOverview" :aria-busy="loading">
        <div class="accountHeader">
          <div class="accountBalance">
            <el-text size="small" type="info">本金余额</el-text>
            <strong>{{ formatMoney(preview?.totalPoints) }}</strong>
          </div>
          <div class="accountActions">
            <el-button text circle :icon="IconRefresh" :loading="loading" aria-label="刷新" title="刷新" @click="refreshBalance" />
            <el-button size="small" :icon="IconCreditCard" @click="openRecharge">充值</el-button>
          </div>
        </div>
        <el-text v-if="error" class="accountError" size="small" type="danger" role="alert">{{ error }}</el-text>
        <div v-if="preview" class="accountDetails">
          <div><el-text size="small" type="info">可用赠送金</el-text><span>{{ formatMoney(preview.bonusBalance) }}</span></div>
          <div><el-text size="small" type="info">累计消费金额</el-text><span>{{ formatMoney(preview.totalConsumption) }}</span></div>
        </div>
      </div>
    </el-popover>
  </el-card>
  <component :is="rechargeDialog" v-model="rechargeVisible" :token="token" @balanceChanged="refreshPreview" @closed="refreshBalance" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import { IconCreditCard, IconRefresh } from "@tabler/icons-vue";
import { locale, translate } from "@toonflow/i18n/vue";
import type { PreviewData } from "@toonflow/server/channel";
import http from "@/lib/http";
import { providerBalances, refreshProviderBalance } from "@/lib/providerBilling";
import { settings } from "@/stores/settings";

const props = defineProps<{ token: string }>();
const rechargeDialog = defineAsyncComponent(() => import("@/components/settings/panels/account/rechargeDialog.vue"));
const balanceVisible = ref(false);
const rechargeVisible = ref(false);
const preview = ref<PreviewData>();
const loading = ref(false);
const error = ref("");
const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 6 }));
const moneyFormat = computed(() => new Intl.NumberFormat(locale.value, { style: "currency", currency: "CNY", minimumFractionDigits: 0, maximumFractionDigits: 6 }));
const sharedBalance = computed(() => {
  const configs = settings.value.mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
  const configKey = JSON.stringify([configs?.toonflow ?? {}, props.token]);
  return providerBalances.value.find(item => item.id === "toonflow" && item.configKey === configKey && !item.error);
});
const balanceText = computed(() => {
  const balance = sharedBalance.value?.balance;
  if (!balance) return formatMoney(preview.value?.totalPoints);
  const amount = Math.min(balance.balance, balance.keyBalance ?? Infinity);
  return ["元", "CNY", "人民币", "¥", "￥"].includes(balance.unit.trim()) ? formatMoney(amount) : `${numberFormat.value.format(amount)} ${balance.unit}`;
});
let controller: AbortController | undefined;

function formatMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? moneyFormat.value.format(value) : "—";
}

async function refreshPreview() {
  if (!props.token || document.hidden) return;
  controller?.abort();
  const request = new AbortController();
  const token = props.token;
  controller = request;
  loading.value = true;
  error.value = "";
  try {
    const result = await http<PreviewData>({
      method: "GET", url: "/api/channel/account/getPreviewData", signal: request.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!request.signal.aborted && props.token === token) preview.value = result;
  } catch (cause) {
    if (!request.signal.aborted) error.value = cause instanceof Error ? cause.message : translate("加载余额失败，请刷新重试");
  } finally {
    if (controller === request) loading.value = false;
  }
}

function refreshBalance() {
  void refreshPreview();
  void refreshProviderBalance("toonflow");
}

function openRecharge() {
  balanceVisible.value = false;
  rechargeVisible.value = true;
}

watch(() => props.token, () => {
  controller?.abort();
  balanceVisible.value = false;
  rechargeVisible.value = false;
  preview.value = undefined;
  error.value = "";
  loading.value = false;
  void refreshPreview();
}, { immediate: true, flush: "sync" });
watch(() => sharedBalance.value?.revision, () => void refreshPreview());
window.addEventListener("focus", refreshPreview);
document.addEventListener("visibilitychange", refreshPreview);
onBeforeUnmount(() => {
  controller?.abort();
  window.removeEventListener("focus", refreshPreview);
  document.removeEventListener("visibilitychange", refreshPreview);
});
</script>

<style lang="scss" scoped>
.toonflowBalance {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;

  .balanceTrigger {
    min-width: 164px;
    width: 100%;
    height: auto;
    padding: 5px 8px;
    font-size: 12px;
    line-height: 1.25;

    :deep(> span) {
      display: grid;
      gap: 2px;
      width: 100%;
      min-width: 0;
    }

    .balanceRow, .bonusRow {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      white-space: nowrap;
    }

    .balanceRow {
      .providerLabel { color: var(--el-text-color-secondary); font-size: 11px; }
      .balanceAmount { color: var(--el-text-color-primary); font-size: 12px; font-weight: 500; }
    }

    .bonusRow {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }
  }
}

.accountOverview {
  padding: 14px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-light);

  .accountHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .accountBalance {
      display: grid;
      gap: 4px;
      min-width: 0;
      strong { color: var(--el-text-color-primary); font-size: 24px; line-height: 1.3; overflow-wrap: anywhere; }
    }

    .accountActions {
      display: flex;
      align-items: center;
      gap: 6px;
      .el-button + .el-button { margin-left: 0; }
    }
  }

  .accountError { display: block; margin-top: 12px; overflow-wrap: anywhere; }

  .accountDetails {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;

    > div { display: grid; gap: 4px; min-width: 0; font-size: 12px; overflow-wrap: anywhere; }
  }
}
</style>
