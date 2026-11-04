<template>
  <div class="account">
    <div class="identityRow">
      <span class="accountAvatar" aria-hidden="true">{{ Array.from(userName.trim())[0]?.toUpperCase() }}</span>
      <p class="userName">{{ userName }}</p>
    </div>
    <section v-if="role === 'user'" class="billingSection" aria-labelledby="accountBalanceTitle" :aria-busy="balanceLoading">
      <header class="sectionHeader">
        <h3 id="accountBalanceTitle">{{ translate("余额") }}</h3>
        <el-button :loading="balanceLoading" :disabled="busy || balanceLoading" @click="loadBalance">{{ translate("刷新") }}</el-button>
      </header>
      <el-alert v-if="balanceError" :title="balanceError" type="error" :closable="false" showIcon />
      <el-skeleton v-if="balanceLoading && !balance" :rows="4" animated />
      <template v-if="balance">
        <div class="walletList">
          <section v-for="wallet in balance.wallets" :key="wallet.currency" class="walletRow" :aria-label="wallet.currency">
            <h4>{{ wallet.currency }}</h4>
            <dl>
              <div><dt>{{ translate("余额") }}</dt><dd>{{ wallet.balance }}</dd></div>
              <div><dt>{{ translate("已预占") }}</dt><dd>{{ wallet.reserved }}</dd></div>
              <div><dt>{{ translate("可用余额") }}</dt><dd>{{ wallet.available }}</dd></div>
            </dl>
          </section>
        </div>
        <section class="transactions" aria-labelledby="accountTransactionsTitle">
          <h3 id="accountTransactionsTitle">{{ translate("最近账目") }}</h3>
          <p v-if="!balance.transactions.length" class="emptyText">{{ translate("暂无账目") }}</p>
          <div v-else class="tableScroll">
            <table>
              <thead><tr><th scope="col">{{ translate("时间") }}</th><th scope="col">{{ translate("类型") }}</th><th scope="col">{{ translate("金额") }}</th><th scope="col">{{ translate("状态") }}</th><th scope="col">{{ translate("说明") }}</th></tr></thead>
              <tbody>
                <tr v-for="transaction in balance.transactions" :key="transaction.id">
                  <td class="timeCell">{{ formatTime(transaction.createdAt) }}</td>
                  <td>{{ transaction.kind === 'credit' ? translate("增加余额") : translate("模型调用") }}</td>
                  <td class="amountCell">{{ formatAmount(transaction) }}</td>
                  <td>{{ transaction.status === 'reserved' ? translate("已预占") : transaction.status === 'released' ? translate("已释放") : translate("已结算") }}</td>
                  <td class="descriptionCell">{{ transaction.label || transaction.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </section>
    <div class="accountActions">
      <el-button class="logoutButton" :loading="busy" :disabled="busy" @click="logout">{{ translate("退出登录") }}</el-button>
      <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
    </div>
  </div>
</template>

<script setup lang="ts">
import { locale, translate } from "@toonflow/i18n/vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElAlert, ElButton, ElSkeleton } from "element-plus";
import type { BillingSnapshot, BillingTransaction } from "@toonflow/multi-tenant-billing/config";
import type { UserRequest } from "./types";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/skeleton/style/css";

const props = defineProps<{ request: UserRequest; userName: string; role?: "admin" | "user" }>();
const emit = defineEmits<{ loggedOut: [] }>();
const busy = ref(false);
const requestError = ref("");
const balance = ref<BillingSnapshot | null>(null);
const balanceLoading = ref(false);
const balanceError = ref("");
const timeFormat = computed(() => new Intl.DateTimeFormat(locale.value, {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}));
const controller = new AbortController();
let balanceRequest: AbortController | undefined;
let disposed = false;

function formatTime(value: number) {
  const date = new Date(value);
  return value > 0 && Number.isFinite(date.getTime()) ? timeFormat.value.format(date) : translate("未记录");
}

function formatAmount(transaction: BillingTransaction) {
  if (transaction.status === "reserved") return translate("待结算");
  const prefix = transaction.kind === "credit" ? "+"
    : transaction.status === "settled" && !/^0(?:\.0+)?$/.test(transaction.amount) ? "-" : "";
  return `${prefix}${transaction.amount} ${transaction.currency}`;
}

async function loadBalance() {
  if (props.role !== "user" || !props.userName || busy.value || disposed) return;
  balanceRequest?.abort();
  const request = new AbortController();
  const userName = props.userName;
  balanceRequest = request;
  balanceLoading.value = true;
  balanceError.value = "";
  try {
    const result = await props.request<BillingSnapshot>({ method: "GET", url: "/api/multiTenant/user/balance", signal: request.signal });
    if (!disposed && !request.signal.aborted && balanceRequest === request && props.role === "user" && props.userName === userName) balance.value = result;
  } catch (cause) {
    if (!disposed && !request.signal.aborted && balanceRequest === request) balanceError.value = cause instanceof Error ? cause.message : translate("读取余额失败，请重试");
  } finally {
    if (balanceRequest === request) { balanceRequest = undefined; balanceLoading.value = false; }
  }
}

watch(() => [props.userName, props.role], () => {
  balanceRequest?.abort();
  balanceRequest = undefined;
  balanceLoading.value = false;
  balance.value = null;
  balanceError.value = "";
  void loadBalance();
}, { immediate: true });

async function logout() {
  if (busy.value) return;
  balanceRequest?.abort();
  busy.value = true;
  requestError.value = "";
  try {
    await props.request({ method: "POST", url: "/api/multiTenant/user/logout", signal: controller.signal });
    emit("loggedOut");
  } catch (cause) {
    if (!controller.signal.aborted) requestError.value = cause instanceof Error ? cause.message : translate("退出登录失败，请重试");
  } finally { busy.value = false; }
}

onBeforeUnmount(() => {
  disposed = true;
  controller.abort();
  balanceRequest?.abort();
});
</script>

<style lang="scss" scoped>
.account {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;

  .identityRow {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    padding: 4px 0;

    .accountAvatar {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-size: 18px;
      font-weight: 600;
      line-height: 1;
    }

    .userName { min-width: 0; margin: 0; color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; }
  }

  .accountActions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--el-border-color-light);

    .logoutButton { min-height: 40px; margin-left: 0; }
    .requestError {
      align-items: flex-start;

      :deep(.el-alert__title) { line-height: 1.5; overflow-wrap: anywhere; }
    }
  }

  .billingSection {
    display: grid;
    gap: 20px;
    min-width: 0;
    padding-top: 24px;
    border-top: 1px solid var(--el-border-color-light);

    h3 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; line-height: 1.6; }

    .sectionHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      .el-button { min-height: 40px; margin: 0; }
    }

    .walletList {
      .walletRow {
        padding: 16px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:first-child { padding-top: 0; }
        h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; line-height: 1.6; }
        dl {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 0;

          dt { color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
          dd { margin: 6px 0 0; font-size: 14px; line-height: 1.6; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        }
      }
    }

    .transactions {
      min-width: 0;

      .emptyText { margin: 12px 0 0; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
      .tableScroll {
        max-width: 100%;
        margin-top: 12px;
        overflow-x: auto;

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          line-height: 1.6;

          th, td { padding: 12px; border-bottom: 1px solid var(--el-border-color-lighter); text-align: start; }
          th { color: var(--el-text-color-regular); font-weight: 500; white-space: nowrap; }
          td { color: var(--el-text-color-primary); }
          .timeCell, .amountCell { white-space: nowrap; font-variant-numeric: tabular-nums; }
          .descriptionCell { min-width: 120px; max-width: 240px; overflow-wrap: anywhere; }
        }
      }
    }

    @media (max-width: 480px) {
      .walletList .walletRow dl { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    }
  }
}
</style>
