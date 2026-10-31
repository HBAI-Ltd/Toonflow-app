<template>
  <section class="walletBonus" aria-label="赠送金额" :aria-busy="loading">
    <div class="bonusSummary">
      <dl class="bonusMetrics">
        <div><dt>可用赠送金额</dt><dd>{{ formatMoney(summary?.availableAmount) }}</dd></div>
        <div><dt>即将到期</dt><dd>{{ formatMoney(summary?.expiringSoonAmount) }}</dd></div>
      </dl>
      <el-button size="small" :icon="IconReceipt" @click="detailsVisible = true">赠送明细</el-button>
    </div>
    <el-alert v-if="errorMessage && !detailsVisible" :title="errorMessage" type="error" :closable="false" showIcon>
      <el-button size="small" :disabled="loading" @click="refresh">重试</el-button>
    </el-alert>

    <el-dialog v-model="detailsVisible" title="赠送明细" width="min(1100px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div class="bonusDetails" :aria-busy="loading">
        <el-segmented v-model="status" class="statusSwitch" :options="statusOptions" :disabled="loading" aria-label="赠送金额状态" />
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon>
          <el-button size="small" :disabled="loading" @click="refresh">重试</el-button>
        </el-alert>
        <div v-loading="loading" class="bonusList">
          <el-table :data="batches" rowKey="id" emptyText="" maxHeight="min(460px, calc(100dvh - 280px))">
            <el-table-column label="来源 / 活动" minWidth="190">
              <template #default="{ row }">
                <div class="batchIdentity">
                  <strong>{{ row.activityName || sourceLabel(row.source) }}</strong>
                  <span v-if="row.activityName">{{ sourceLabel(row.source) }}</span>
                  <span v-if="row.orderNumber">{{ row.orderNumber }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="赠送金额" minWidth="110">
              <template #default="{ row }"><span class="batchAmount">{{ formatMoney(row.amount) }}</span></template>
            </el-table-column>
            <el-table-column label="剩余金额" minWidth="110">
              <template #default="{ row }"><span class="batchAmount">{{ formatMoney(row.available) }}</span></template>
            </el-table-column>
            <el-table-column label="已使用 / 已过期" minWidth="130">
              <template #default="{ row }"><div class="batchFields"><span>{{ formatMoney(row.used) }}</span><span>{{ formatMoney(row.expired) }}</span></div></template>
            </el-table-column>
            <el-table-column label="创建 / 到期时间" minWidth="175">
              <template #default="{ row }"><div class="batchFields"><time>{{ formatTime(row.createdAt) }}</time><time>{{ formatTime(row.expiresAt) }}</time></div></template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-if="!errorMessage"
          class="bonusPagination"
          :currentPage="page"
          :pageSize="pageSize"
          :pageSizes="[10, 20, 50]"
          :total="total"
          :disabled="loading"
          :pagerCount="5"
          layout="total, sizes, prev, pager, next"
          size="small"
          @update:currentPage="changePage"
          @update:pageSize="changePageSize" />
      </div>
      <template #footer>
        <el-button @click="detailsVisible = false">关闭</el-button>
        <el-button type="primary" :loading="loading" @click="refresh">刷新</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { IconReceipt } from "@tabler/icons-vue";
import type { WalletBonusBatch, WalletBonusBatchesPage, WalletBonusBatchesParams } from "@toonflow/server/channel";
import http from "@/lib/http";

const props = defineProps<{ visible: boolean; token: string; serverTime: number }>();
const loading = defineModel<boolean>("loading", { default: false });
const summary = ref<WalletBonusBatchesPage["summary"]>();
const batches = ref<WalletBonusBatch[]>([]);
const detailsVisible = ref(false);
const status = ref<WalletBonusBatchesParams["status"]>("available");
const statusOptions = [{ label: "可用", value: "available" }, { label: "已用完", value: "used" }, { label: "已过期", value: "expired" }];
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const errorMessage = ref("");
const moneyFormat = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 6 });
const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
let activeRequest: AbortController | undefined;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
let clockOffset = 0;

function scheduleExpiryRefresh() {
  clearTimeout(expiryTimer);
  const expiresAt = summary.value?.nextExpiresAt;
  if (!props.visible || !props.token || props.serverTime <= 0 || document.hidden || expiresAt == null) return;
  const now = Date.now() + clockOffset;
  if (expiresAt <= now) {
    void refresh();
    return;
  }
  expiryTimer = setTimeout(() => {
    if (document.hidden) return;
    if (expiresAt > Date.now() + clockOffset) {
      scheduleExpiryRefresh();
      return;
    }
    void refresh();
  }, Math.min(expiresAt - now, 2147483647));
}

function formatMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? moneyFormat.format(value) : "";
}

function formatTime(value: number | null) {
  return value === null ? "" : timeFormat.format(value);
}

function sourceLabel(source: string) {
  return ({ gift: translate("充值赠送"), admin: translate("管理员赠送") } as Record<string, string>)[source] ?? source;
}

async function refresh() {
  activeRequest?.abort();
  clearTimeout(expiryTimer);
  loading.value = false;
  errorMessage.value = "";
  const token = props.token;
  if (!props.visible || !token) return;
  const request = new AbortController();
  activeRequest = request;
  loading.value = true;
  summary.value = undefined;
  batches.value = [];
  try {
    const result = await http<WalletBonusBatchesPage>({
      method: "GET", url: "/api/channel/wallet/getBonusBatches",
      params: { status: status.value, page: page.value, limit: pageSize.value },
      signal: request.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (request.signal.aborted || props.token !== token) return;
    if (props.serverTime > 0 && result.summary.nextExpiresAt !== null && result.summary.nextExpiresAt <= Date.now() + clockOffset) {
      throw new Error("赠送余额信息已过期，请刷新后重试");
    }
    summary.value = result.summary;
    batches.value = result.list;
    total.value = result.total;
    scheduleExpiryRefresh();
  } catch (error) {
    if (request.signal.aborted) return;
    errorMessage.value = error instanceof Error && "status" in error && error.status === 401 ? "账号登录已失效，请重新登录"
      : error instanceof Error ? error.message : "获取赠送明细失败";
  } finally {
    if (activeRequest === request) loading.value = false;
  }
}

function changePage(value: number) {
  if (page.value === value) return;
  page.value = value;
  void refresh();
}

function changePageSize(value: number) {
  pageSize.value = value;
  page.value = 1;
  void refresh();
}

watch(() => props.serverTime, time => {
  if (time <= 0) return;
  clockOffset = time - Date.now();
  if (summary.value?.nextExpiresAt != null && summary.value.nextExpiresAt <= time) {
    void refresh();
    return;
  }
  scheduleExpiryRefresh();
}, { immediate: true });

watch(status, () => {
  page.value = 1;
  batches.value = [];
  total.value = 0;
  if (detailsVisible.value) void refresh();
});

watch(detailsVisible, visible => {
  if (visible) void refresh();
});

watch([() => props.visible, () => props.token], ([visible, token], previous) => {
  activeRequest?.abort();
  clearTimeout(expiryTimer);
  loading.value = false;
  detailsVisible.value = false;
  errorMessage.value = "";
  if (token !== previous?.[1]) {
    summary.value = undefined;
    batches.value = [];
    status.value = "available";
    page.value = 1;
    total.value = 0;
  }
  if (visible && token) void refresh();
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => {
  activeRequest?.abort();
  clearTimeout(expiryTimer);
  loading.value = false;
});

defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.walletBonus {
  display: grid;
  gap: 12px;
  min-width: 0;

  .bonusSummary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius-large);
    background: var(--el-fill-color-extra-light);

    .bonusMetrics {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 32px;
      min-width: 0;
      margin: 0;

      div { display: grid; gap: 6px; min-width: 0; }
      dt { color: var(--el-text-color-secondary); font-size: 12px; }
      dd { margin: 0; color: var(--el-text-color-primary); font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
    }
    .el-button { margin: 0; }
  }
}
.bonusDetails {
  display: grid;
  gap: 14px;
  min-width: 0;

  .statusSwitch { justify-self: start; max-width: 100%; --el-border-radius-base: var(--ui-radius); }
  .bonusList {
    min-width: 0;
    min-height: 100px;

    .batchIdentity, .batchFields { display: grid; gap: 4px; padding: 4px 0; font-size: 12px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
    .batchIdentity { strong { color: var(--el-text-color-primary); font-size: 13px; } span { color: var(--el-text-color-regular); } }
    .batchFields > :nth-child(2) { color: var(--el-text-color-regular); }
    .batchAmount { font-size: 12px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  }
  .bonusPagination { justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
}
</style>
