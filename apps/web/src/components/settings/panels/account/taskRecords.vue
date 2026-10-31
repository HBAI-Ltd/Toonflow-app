<template>
  <section class="taskRecords" aria-label="任务记录" :aria-busy="loading">
    <div class="recordsToolbar">
      <el-form class="searchForm" @submit.prevent="submitSearch">
        <el-input v-model="search" class="taskSearch" :prefixIcon="IconSearch" placeholder="搜索任务 ID" aria-label="搜索任务 ID" clearable @clear="clearSearch" />
        <el-button type="primary" nativeType="submit" :disabled="loading">查询</el-button>
        <el-button :disabled="loading || (!search && !activeSearch)" @click="clearSearch">清除</el-button>
      </el-form>
      <el-button :icon="IconChartBar" @click="consumptionVisible = true">消耗查询</el-button>
    </div>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon>
      <el-button size="small" @click="refresh">重试</el-button>
    </el-alert>
    <div v-loading="loading" class="recordsList">
      <el-table :data="records" rowKey="id" emptyText="">
        <el-table-column label="任务" minWidth="220">
          <template #default="{ row }">
            <div class="taskIdentity">
              <div class="modelHeading">
                <div class="modelAvatar" aria-hidden="true"><modelIcon :model="row.modelName" :size="24" /></div>
                <div class="modelLabels">
                  <strong>{{ row.modelName }}</strong>
                  <span v-if="row.keyName" class="keyName">凭证名称 {{ row.keyName }}</span>
                </div>
              </div>
              <span class="taskId">{{ row.taskId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消费 / 耗时" minWidth="110">
          <template #default="{ row }">
            <div class="recordMetrics">
              <span>{{ formatAmount(row.amount) }}</span>
              <span v-if="row.duration !== null" class="duration">{{ numberFormat.format(row.duration) }} 秒</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建 / 完成时间" minWidth="165">
          <template #default="{ row }">
            <div class="recordTimes">
              <time>{{ formatTime(row.createdAt) }}</time>
              <time v-if="row.completedAt !== null" class="completedTime">{{ formatTime(row.completedAt) }}</time>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="详情" width="65" align="right">
          <template #default="{ row }"><el-button link type="primary" :aria-label="`查看任务 ${row.taskId} 的详情`" @click="openDetails(row as TaskRecord)">查看</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-if="!errorMessage"
      class="recordsPagination"
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
    <el-dialog v-model="detailsVisible" title="任务详情" width="min(640px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div v-if="selectedRecord" class="taskDetails">
        <div class="detailHeading">
          <div class="modelAvatar" aria-hidden="true"><modelIcon :model="selectedRecord.modelName" :size="28" /></div>
          <h3>{{ selectedRecord.modelName }}</h3>
          <el-tag :type="statusType(selectedRecord.status)">{{ statusLabel(selectedRecord.status) }}</el-tag>
        </div>
        <dl class="detailFields">
          <div class="fullWidth"><dt>任务 ID</dt><dd>{{ selectedRecord.taskId }}</dd></div>
          <div v-if="selectedRecord.keyName"><dt>凭证名称</dt><dd>{{ selectedRecord.keyName }}</dd></div>
          <div><dt>消费金额</dt><dd>{{ formatAmount(selectedRecord.amount) }}</dd></div>
          <div><dt>耗时</dt><dd>{{ selectedRecord.duration === null ? "" : `${numberFormat.format(selectedRecord.duration)} 秒` }}</dd></div>
          <div><dt>创建时间</dt><dd>{{ formatTime(selectedRecord.createdAt) }}</dd></div>
          <div><dt>完成时间</dt><dd>{{ formatTime(selectedRecord.completedAt) }}</dd></div>
          <div v-if="selectedRecord.errorReason" class="fullWidth failureReason"><dt>失败原因</dt><dd>{{ selectedRecord.errorReason }}</dd></div>
        </dl>
        <el-button v-if="resultUrl" class="resultButton" tag="a" :href="resultUrl" target="_blank" rel="noopener noreferrer" type="primary" :icon="IconExternalLink">查看结果</el-button>
        <section v-else-if="resultText" class="resultData"><h4>结果数据</h4><pre>{{ resultText }}</pre></section>
      </div>
    </el-dialog>
    <el-dialog v-model="consumptionVisible" title="消耗查询" width="min(560px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <el-form :id="consumptionFormId" class="consumptionForm" labelPosition="top" :disabled="consumptionLoading" @submit.prevent="queryConsumption">
        <el-form-item label="时间范围" :error="rangeError">
          <el-date-picker
            v-model="dateRange"
            class="dateRange"
            type="datetimerange"
            format="YYYY-MM-DD HH:mm:ss"
            :startPlaceholder="translate('开始时间')"
            :endPlaceholder="translate('结束时间')"
            :rangeSeparator="translate('至')" />
        </el-form-item>
        <el-form-item label="凭证（选填）">
          <el-input v-model="accountCredential" type="password" showPassword autocomplete="off" placeholder="输入凭证，留空查询全部" />
        </el-form-item>
      </el-form>
      <el-alert v-if="consumptionError" :title="consumptionError" type="error" :closable="false" showIcon />
      <dl v-if="consumption" class="consumptionResult" aria-live="polite">
        <div><dt>消费金额</dt><dd>{{ formatAmount(consumption.total) }}</dd></div>
        <div><dt>请求次数</dt><dd>{{ numberFormat.format(consumption.count) }}</dd></div>
      </dl>
      <template #footer>
        <el-button @click="consumptionVisible = false">关闭</el-button>
        <el-button type="primary" nativeType="submit" :form="consumptionFormId" :loading="consumptionLoading" :disabled="!consumptionReady">查询</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from "vue";
import { t, translate } from "@toonflow/i18n/vue";
import { IconChartBar, IconExternalLink, IconSearch } from "@tabler/icons-vue";
import { modelIcon } from "@toonflow/model-icons";
import type { PointsConsumption, TaskRecord, TaskRecordsPage } from "@toonflow/server/channel";
import http from "@/lib/http";

const props = defineProps<{ visible: boolean; token: string }>();
const loading = defineModel<boolean>("loading", { default: false });
const search = ref("");
const activeSearch = ref("");
const page = ref(1);
const pageSize = ref(10);
const records = ref<TaskRecord[]>([]);
const total = ref(0);
const errorMessage = ref("");
const selectedRecord = ref<TaskRecord>();
const detailsVisible = ref(false);
const consumptionVisible = ref(false);
const consumptionLoading = ref(false);
const consumptionError = ref("");
const consumption = ref<PointsConsumption>();
const consumptionFormId = useId();
const dateRange = ref<[Date, Date] | null>(null);
const accountCredential = ref("");
const numberFormat = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 6 });
const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const rangeError = computed(() => dateRange.value && dateRange.value[0].getTime() > dateRange.value[1].getTime() ? translate("结束时间不能早于开始时间") : "");
const consumptionReady = computed(() => !!dateRange.value && dateRange.value.every(date => Number.isFinite(date.getTime())) && !rangeError.value && !consumptionLoading.value);
const resultUrl = computed(() => {
  const value = selectedRecord.value?.resultUrl;
  if (!value || !URL.canParse(value)) return "";
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
});
const resultText = computed(() => {
  const result = selectedRecord.value?.result ?? "";
  try {
    return JSON.stringify(JSON.parse(result), null, 2);
  } catch {
    return result;
  }
});
let recordsRequest: AbortController | undefined;
let consumptionRequest: AbortController | undefined;

function statusLabel(status: number) {
  return ({ [-1]: translate("失败"), 1: translate("进行中"), 2: translate("已完成") } as Record<number, string>)[status] ?? t`状态 ${status}`;
}

function statusType(status: number) {
  return status === 2 ? "success" : status === -1 ? "danger" : status === 1 ? "warning" : "info";
}

function formatAmount(value: number | null) {
  return value === null ? "" : `¥${numberFormat.format(value)}`;
}

function formatTime(value: number | null) {
  return value === null ? "" : timeFormat.format(value);
}

function requestError(error: unknown, fallback: string) {
  if (error instanceof Error && "status" in error && error.status === 401) return translate("账号登录已失效，请重新登录");
  return error instanceof Error ? error.message : fallback;
}

function openDetails(record: TaskRecord) {
  selectedRecord.value = record;
  detailsVisible.value = true;
}

function submitSearch() {
  activeSearch.value = search.value.trim();
  page.value = 1;
  void refresh();
}

function clearSearch() {
  search.value = "";
  submitSearch();
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

async function refresh() {
  recordsRequest?.abort();
  loading.value = false;
  errorMessage.value = "";
  records.value = [];
  detailsVisible.value = false;
  selectedRecord.value = undefined;
  const token = props.token;
  if (!props.visible || !token) return;
  const request = new AbortController();
  recordsRequest = request;
  loading.value = true;
  try {
    const result = await http<TaskRecordsPage>({
      method: "GET", url: "/api/channel/account/getTaskRecords", signal: request.signal,
      headers: { Authorization: `Bearer ${token}` },
      params: { page: page.value, limit: pageSize.value, ...(activeSearch.value ? { taskId: activeSearch.value } : {}) },
    });
    if (request.signal.aborted || props.token !== token) return;
    records.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (!request.signal.aborted) errorMessage.value = requestError(error, translate("获取任务记录失败"));
  } finally {
    if (recordsRequest === request) loading.value = false;
  }
}

async function queryConsumption() {
  const token = props.token;
  if (!props.visible || !token || !consumptionVisible.value || !consumptionReady.value || !dateRange.value) return;
  consumptionRequest?.abort();
  const request = new AbortController();
  consumptionRequest = request;
  consumptionLoading.value = true;
  consumption.value = undefined;
  consumptionError.value = "";
  try {
    const result = await http<PointsConsumption>({
      method: "POST", url: "/api/channel/account/getPointsConsumption", signal: request.signal,
      headers: { Authorization: `Bearer ${token}` },
      data: { key: accountCredential.value.trim(), startTime: dateRange.value[0].getTime(), finishTime: dateRange.value[1].getTime() },
    });
    if (!request.signal.aborted && props.token === token) consumption.value = result;
  } catch (error) {
    if (!request.signal.aborted) consumptionError.value = requestError(error, translate("查询消耗失败"));
  } finally {
    if (consumptionRequest === request) consumptionLoading.value = false;
  }
}

watch(consumptionVisible, visible => {
  consumptionRequest?.abort();
  consumptionLoading.value = false;
  consumption.value = undefined;
  consumptionError.value = "";
  accountCredential.value = "";
  const now = new Date();
  dateRange.value = visible ? [new Date(now.getTime() - 3600000), now] : null;
}, { flush: "sync" });

watch([accountCredential, dateRange], () => {
  consumption.value = undefined;
  consumptionError.value = "";
});

watch([() => props.visible, () => props.token], ([visible, token], previous) => {
  if (token !== previous?.[1]) {
    search.value = "";
    activeSearch.value = "";
    page.value = 1;
    total.value = 0;
  }
  if (!visible || token !== previous?.[1]) consumptionVisible.value = false;
  void refresh();
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => {
  recordsRequest?.abort();
  consumptionRequest?.abort();
  loading.value = false;
});

defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.taskRecords {
  display: grid;
  gap: 16px;
  min-width: 0;

  .recordsToolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;

    .searchForm {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 8px;
      min-width: 0;

      .taskSearch { min-width: 120px; max-width: 300px; }
      .el-button { margin: 0; }
    }
  }

  .recordsList {
    min-width: 0;
    min-height: 120px;

    .taskIdentity {
      display: grid;
      gap: 6px;
      min-width: 0;
      padding: 4px 0;

      .modelHeading {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;

        .modelAvatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--ui-radius);
          background: var(--el-fill-color-extra-light);
        }
        .modelLabels {
          display: grid;
          gap: 2px;
          min-width: 0;

          strong { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
          .keyName { color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
        }
      }
      .taskId { color: var(--el-text-color-secondary); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
    }
    .recordMetrics, .recordTimes {
      display: grid;
      gap: 4px;
      font-size: 12px;
      font-variant-numeric: tabular-nums;

      .duration, .completedTime { color: var(--el-text-color-secondary); }
    }
  }
  .recordsPagination { flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
}

.taskDetails {
  display: grid;
  gap: 20px;

  .detailHeading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .modelAvatar {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--ui-radius);
      background: var(--el-fill-color-extra-light);
    }
    h3 { flex: 1; min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--el-text-color-primary); font-size: 15px; line-height: 1.5; }
    .el-tag { flex-shrink: 0; }
  }
  .detailFields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin: 0;

    > div {
      display: grid;
      align-content: start;
      gap: 6px;

      dt { color: var(--el-text-color-secondary); font-size: 12px; }
      dd { margin: 0; color: var(--el-text-color-regular); white-space: pre-wrap; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
      &.fullWidth { grid-column: 1 / -1; }
      &.failureReason dd { color: var(--el-color-danger); }
    }
  }
  .resultButton { justify-self: start; }
  .resultData {
    min-width: 0;

    h4 { margin: 0 0 10px; color: var(--el-text-color-primary); font-size: 13px; }
    pre { max-height: 320px; margin: 0; padding: 12px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border-radius: var(--ui-radius); background: var(--el-fill-color-light); font-size: 12px; line-height: 1.6; }
  }
}

.consumptionForm {
  .dateRange { width: 100%; }
}

.consumptionResult {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0 0;
  padding: 16px;
  border-radius: var(--ui-radius);
  background: var(--el-fill-color-light);

  > div {
    display: grid;
    gap: 8px;

    dt { color: var(--el-text-color-secondary); font-size: 12px; }
    dd { margin: 0; color: var(--el-text-color-primary); font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  }
}
</style>
