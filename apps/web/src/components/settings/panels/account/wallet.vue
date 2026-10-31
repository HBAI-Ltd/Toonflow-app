<template>
  <section class="walletPanel" aria-label="钱包" :aria-busy="loading">
    <section class="balanceCard" aria-label="钱包余额">
      <div class="balanceHeader">
        <span>我的余额</span>
        <el-button size="small" :icon="IconReceipt" @click="ordersVisible = true">充值记录</el-button>
      </div>
      <strong class="balanceAmount">{{ formatMoney(balance) }}</strong>
      <el-form class="exchangeForm" :disabled="mutationBusy" @submit.prevent="exchangeCode">
        <el-input v-model="code" type="password" showPassword autocomplete="off" placeholder="请输入兑换码" aria-label="兑换码" />
        <el-button nativeType="submit" type="primary" plain :loading="exchanging" :disabled="!code.trim() || mutationBusy">兑换</el-button>
      </el-form>
      <el-alert v-if="exchangeError" class="exchangeError" :title="exchangeError" type="error" :closable="false" showIcon />
    </section>

    <walletBonus ref="bonusPanel" v-model:loading="bonusLoading" :visible="visible" :token="token" :serverTime="rechargeNow" />

    <section class="rechargeSection" aria-labelledby="rechargeTitle">
      <h3 id="rechargeTitle">选择充值套餐</h3>
      <el-alert v-if="plansError" :title="plansError" type="error" :closable="false" showIcon>
        <el-button size="small" @click="loadPlans">重试</el-button>
      </el-alert>
      <div v-loading="plansLoading" class="plansGrid" role="group" aria-label="充值套餐">
        <button
          v-for="plan in rechargeStale ? [] : plans"
          :key="plan.id"
          class="planCard"
          type="button"
          :class="{ selected: selectedPlanId === plan.id }"
          :aria-pressed="selectedPlanId === plan.id"
          :disabled="mutationBusy"
          @click="selectedPlanId = plan.id">
          <strong>{{ formatMoney(plan.amount) }}</strong>
          <span>充值到账 {{ formatMoney(plan.points) }}</span>
          <span v-if="plan.bonusAmount > 0" class="planBonus">赠送 {{ formatMoney(plan.bonusAmount) }}</span>
          <span v-if="plan.bonusAmount > 0">合计到账 {{ formatMoney(plan.totalAmount) }}</span>
          <span v-if="plan.description" class="planDescription">{{ plan.description }}</span>
        </button>
        <button
          class="planCard"
          type="button"
          :class="{ selected: selectedPlanId === -1 }"
          :aria-pressed="selectedPlanId === -1"
          :disabled="mutationBusy"
          @click="selectedPlanId = -1">
          <strong>自定义金额</strong>
        </button>
      </div>
      <el-form v-if="selectedPlanId === -1" class="customAmountForm" labelPosition="top" :disabled="mutationBusy" @submit.prevent>
        <el-form-item label="充值金额（元）">
          <el-input-number v-model="customMoney" :min="1" :precision="2" :step="1" :controls="false" placeholder="请输入充值金额" />
        </el-form-item>
      </el-form>
      <section v-if="activeRechargeActivity" class="bonusRules" aria-labelledby="bonusRulesTitle">
        <header class="bonusRulesHeader">
          <h4 id="bonusRulesTitle"><icon-gift :size="17" aria-hidden="true" />赠送细则</h4>
          <span class="bonusActivityName">{{ activeRechargeActivity.name }}</span>
        </header>
        <dl class="bonusRuleFacts">
          <div>
            <dt>赠送方式</dt>
            <dd v-if="activeRechargeActivity.rateMode === 'fixed'">赠送比例 <strong>{{ formatRate(activeRechargeActivity.rate) }}</strong></dd>
            <dd v-else>按本次支付金额匹配档位，整笔金额使用对应比例</dd>
          </div>
          <div v-if="bonusRulesExpiry"><dt>赠送金有效期</dt><dd>{{ bonusRulesExpiry }}</dd></div>
          <div v-if="activeRechargeActivity.startsAt !== null"><dt>活动开始</dt><dd><time>{{ formatTime(activeRechargeActivity.startsAt) }}</time></dd></div>
          <div v-if="activeRechargeActivity.endsAt !== null"><dt>活动截止</dt><dd><time>{{ formatTime(activeRechargeActivity.endsAt) }}</time></dd></div>
        </dl>
        <div v-if="activeRechargeActivity.rateMode === 'tiered'" class="bonusTierList" tabindex="0" role="region" aria-label="阶梯赠送比例">
          <table class="bonusTierTable">
            <thead><tr><th scope="col">本次支付金额</th><th scope="col">赠送比例</th><th scope="col"><span class="srOnly">当前档位</span></th></tr></thead>
            <tbody>
              <tr v-for="(tier, index) in activeRechargeActivity.tiers" :key="tier.upTo" :class="{ currentTier: currentBonusTier === index }" :aria-current="currentBonusTier === index ? 'true' : undefined">
                <td>
                  <template v-if="activeRechargeActivity.tiers.length === 1">全部支付金额</template>
                  <template v-else-if="index === 0">不超过 {{ formatMoney(tier.upTo) }}</template>
                  <template v-else-if="index === activeRechargeActivity.tiers.length - 1">超过 {{ formatMoney(activeRechargeActivity.tiers[index - 1]?.upTo) }}</template>
                  <template v-else>超过 {{ formatMoney(activeRechargeActivity.tiers[index - 1]?.upTo) }}，不超过 {{ formatMoney(tier.upTo) }}</template>
                </td>
                <td>{{ formatRate(tier.rate) }}</td>
                <td><span v-if="currentBonusTier === index" class="currentTierLabel">当前档位</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div v-if="rechargeReady" class="rechargeSummary" aria-live="polite">
        <dl>
          <div><dt>充值到账</dt><dd>{{ formatMoney(rechargePoints) }}</dd></div>
          <div v-if="rechargeBonus.bonusAmount > 0" class="bonusMetric"><dt>本次赠送</dt><dd>+{{ formatMoney(rechargeBonus.bonusAmount) }}</dd></div>
          <div v-if="rechargeBonus.bonusAmount > 0" class="totalMetric"><dt>合计到账</dt><dd>{{ formatMoney(rechargeTotal) }}</dd></div>
        </dl>
      </div>
      <div v-for="activity in rechargeActivities" :key="activity.id" class="rechargeActivity">
        <strong>{{ activity.title }}</strong>
        <p v-if="activity.rechargeConfig.summary">{{ activity.rechargeConfig.summary }}</p>
      </div>
      <div v-if="presentation?.agreement" class="agreementActions">
        <el-checkbox v-model="agreementAccepted" :disabled="mutationBusy || plansLoading">我已阅读并同意</el-checkbox>
        <el-button link type="primary" @click="agreementVisible = true">《{{ presentation.agreement.title }}》</el-button>
      </div>
      <el-alert v-else-if="!plansLoading && !plansError" title="充值协议暂不可用，请刷新后重试" type="warning" :closable="false" showIcon />
      <div class="paymentActions">
        <el-segmented v-model="payType" :options="paymentOptions" :disabled="mutationBusy" aria-label="支付方式" />
        <el-button type="primary" :loading="paying" :disabled="!rechargeReady || !agreementAccepted || mutationBusy" @click="createPayment">
          {{ rechargeReady ? `支付 ${formatMoney(rechargeAmount)}` : '生成支付订单' }}
        </el-button>
      </div>
      <el-alert v-if="paymentError" :title="paymentError" type="error" :closable="false" showIcon />
    </section>

    <el-dialog v-model="agreementVisible" :title="presentation?.agreement?.title" width="min(720px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div v-if="presentation?.agreement" class="agreementDialog">
        <p class="agreementMeta">版本 {{ presentation.agreement.version }} · 更新于 {{ formatTime(presentation.agreement.updatedAt) }}</p>
        <div class="agreementContent" v-html="agreementContent"></div>
      </div>
      <template #footer><el-button @click="agreementVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="ordersVisible" title="充值记录" width="min(1000px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div class="ordersSection" :aria-busy="ordersLoading">
        <el-alert v-if="ordersError" :title="ordersError" type="error" :closable="false" showIcon>
          <el-button size="small" @click="loadOrders()">重试</el-button>
        </el-alert>
        <div v-loading="ordersLoading" class="ordersList">
          <el-table :data="orders" rowKey="id" emptyText="" maxHeight="min(460px, calc(100dvh - 260px))">
            <el-table-column label="订单" minWidth="220">
              <template #default="{ row }"><div class="orderIdentity"><strong>{{ row.name }}</strong><span>{{ row.orderNumber }}</span><span v-if="row.remark">{{ row.remark }}</span></div></template>
            </el-table-column>
            <el-table-column label="类型 / 支付方式" minWidth="125">
              <template #default="{ row }"><div class="orderFields"><span>{{ orderTypeLabel(row.type) }}</span><span>{{ paymentLabel(row.paymentMethod) }}</span></div></template>
            </el-table-column>
            <el-table-column label="支付 / 到账金额" minWidth="125">
              <template #default="{ row }"><div class="orderFields"><span>{{ formatMoney(row.amount) }}</span><span>{{ formatMoney(row.points) }}</span></div></template>
            </el-table-column>
            <el-table-column label="赠送金额 / 有效期" minWidth="175">
              <template #default="{ row }"><div v-if="row.bonusAmount !== undefined" class="orderFields"><span>{{ formatMoney(row.bonusAmount) }}</span><span v-if="row.bonusAmount > 0">{{ row.bonusActivityName }}<br />{{ bonusExpiry(row) }}</span></div></template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="创建 / 支付时间" minWidth="170">
              <template #default="{ row }"><div class="orderFields"><time>{{ formatTime(row.createdAt) }}</time><time v-if="row.paidAt !== null">{{ formatTime(row.paidAt) }}</time></div></template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-if="!ordersError"
          class="ordersPagination"
          :currentPage="page"
          :pageSize="pageSize"
          :pageSizes="[10, 20, 50]"
          :total="total"
          :disabled="ordersLoading || checking"
          :pagerCount="5"
          layout="total, sizes, prev, pager, next"
          size="small"
          @update:currentPage="changePage"
          @update:pageSize="changePageSize" />
      </div>
      <template #footer>
        <el-button @click="ordersVisible = false">关闭</el-button>
        <el-button type="primary" :loading="ordersLoading" @click="loadOrders()">刷新</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paymentVisible" title="充值支付" width="min(420px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
      <div v-if="payment" class="paymentDialog">
        <p class="paymentAmount">{{ formatMoney(payment.amount) }}</p>
        <div v-if="payment.bonusAmount > 0" class="paymentBonus">
          <div class="paymentBonusAmount"><icon-gift :size="17" aria-hidden="true" /><span>本次赠送</span><strong>+{{ formatMoney(payment.bonusAmount) }}</strong></div>
          <dl>
            <div v-if="payment.bonusActivityName"><dt>赠送活动</dt><dd>{{ payment.bonusActivityName }}</dd></div>
            <div v-if="bonusExpiry(payment)"><dt>赠送金有效期</dt><dd>{{ bonusExpiry(payment) }}</dd></div>
          </dl>
        </div>
        <template v-if="payment.kind === 'image'">
          <img class="paymentQr" :src="payment.payUrl" alt="微信支付二维码" referrerpolicy="no-referrer" @error="qrImageError = true" />
          <p v-if="!qrImageError" class="paymentHint">请使用微信扫描二维码支付</p>
          <el-alert v-else title="二维码图片加载失败，请打开付款页面查看" type="error" :closable="false" showIcon />
        </template>
        <el-button tag="a" :href="payment.payUrl" target="_blank" rel="noopener noreferrer" type="primary" plain>
          {{ payment.kind === 'image' ? '打开付款页面' : '前往支付宝付款' }}
        </el-button>
        <p class="paymentOrder">订单号：{{ payment.orderNumber }}</p>
        <el-alert v-if="paymentNotice" :title="paymentNotice" :type="paymentConfirmed ? 'success' : 'info'" :closable="false" showIcon />
        <el-alert v-if="checkError" :title="checkError" type="error" :closable="false" showIcon />
      </div>
      <template #footer>
        <el-button @click="paymentVisible = false">关闭</el-button>
        <el-button type="primary" :loading="checking" :disabled="!payment || paymentConfirmed" @click="checkPayment()">已完成支付，刷新</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { t, translate } from "@toonflow/i18n/vue";
import { IconGift, IconReceipt } from "@tabler/icons-vue";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import type { WalletActivity, WalletBonus, WalletOrder, WalletOrdersPage, WalletPayment, WalletPaymentParams, WalletPaymentStatus, WalletPlan, WalletPresentation } from "@toonflow/server/channel";
import http from "@/lib/http";
import walletBonus from "./walletBonus.vue";

const props = defineProps<{ visible: boolean; token: string; balance?: number }>();
const emit = defineEmits<{ balanceChanged: [] }>();
const loading = defineModel<boolean>("loading", { default: false });
const bonusPanel = ref<InstanceType<typeof walletBonus>>();
const bonusLoading = ref(false);
const plans = ref<WalletPlan[]>([]);
const presentation = ref<WalletPresentation>();
const rechargeActivity = ref<WalletActivity>();
const rechargeNow = ref(0);
const rechargeStale = ref(true);
const activeRechargeActivity = computed(() => {
  const activity = rechargeActivity.value;
  return !rechargeStale.value && activity?.eligible
    && (activity.startsAt === null || activity.startsAt <= rechargeNow.value)
    && (activity.endsAt === null || activity.endsAt > rechargeNow.value)
    && (activity.expireMode !== "fixed" || (activity.expiresAt !== null && activity.expiresAt > rechargeNow.value)) ? activity : undefined;
});
const agreementAccepted = ref(false);
const agreementVisible = ref(false);
const markdown = new Marked({ renderer: { html: () => "" } });
const agreementContent = computed(() => DOMPurify.sanitize(markdown.parse(presentation.value?.agreement?.content ?? "", { async: false }), {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "del", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "a", "hr"],
  ALLOWED_ATTR: ["href", "title"],
}));
const selectedPlanId = ref<number>();
const selectedPlan = computed(() => plans.value.find(plan => plan.id === selectedPlanId.value));
const customMoney = ref<number | undefined>(1);
const rechargeAmount = computed(() => selectedPlanId.value === -1
  ? customMoney.value === undefined ? undefined : multiplyMoney(customMoney.value, activeRechargeActivity.value ? 1 : rechargeActivity.value?.firstRechargeDiscount ?? 1)
  : selectedPlan.value?.amount);
const rechargePoints = computed(() => selectedPlanId.value === -1
  ? activeRechargeActivity.value ? rechargeAmount.value : customMoney.value
  : selectedPlan.value?.points);
const rechargeBonus = computed<WalletBonus>(() => {
  const activity = activeRechargeActivity.value;
  const amount = rechargeAmount.value ?? 0;
  const rate = activity?.eligible ? activity.rateMode === "fixed" ? activity.rate
    : (activity.tiers.find(tier => amount <= tier.upTo) ?? activity.tiers.at(-1))?.rate ?? 0 : 0;
  const bonusAmount = selectedPlanId.value === -1 ? multiplyMoney(amount, rate) : selectedPlan.value?.bonusAmount ?? 0;
  return {
    bonusAmount,
    bonusActivityName: bonusAmount > 0 && activity?.eligible ? activity.name : null,
    bonusExpireMode: bonusAmount > 0 && activity?.eligible ? activity.expireMode : null,
    bonusValidDays: bonusAmount > 0 && activity?.eligible && activity.expireMode === "days" ? activity.validDays : null,
    bonusExpiresAt: bonusAmount > 0 && activity?.eligible && activity.expireMode === "fixed" ? activity.expiresAt : null,
  };
});
const rechargeTotal = computed(() => selectedPlanId.value === -1
  ? ((Math.round((rechargePoints.value ?? 0) * 100) + Math.round(rechargeBonus.value.bonusAmount * 100)) / 100)
  : selectedPlan.value?.totalAmount);
const rechargeActivities = computed(() => rechargeStale.value ? [] : presentation.value?.activities.filter(activity => {
  const config = activity.rechargeConfig;
  const now = rechargeNow.value;
  return config.ruleType === "none" && (config.startsAt === null || config.startsAt <= now) && (config.endsAt === null || config.endsAt > now)
    && (config.scope === "all" || (selectedPlanId.value === -1 ? config.scope === "custom" : config.scope === "packages" && config.packageIds.includes(selectedPlanId.value!)));
}) ?? []);
const payType = ref<WalletPaymentParams["payType"]>("wechat");
const paymentOptions = [{ label: "微信支付", value: "wechat" }, { label: "支付宝", value: "alipay" }];
const code = ref("");
const orders = ref<WalletOrder[]>([]);
const ordersVisible = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const plansLoading = ref(false);
const ordersLoading = ref(false);
const paying = ref(false);
const exchanging = ref(false);
const checking = ref(false);
const mutationBusy = computed(() => paying.value || exchanging.value || checking.value);
const plansError = ref("");
const rechargeReady = computed(() => !rechargeStale.value && !!presentation.value?.agreement && !!rechargeActivity.value && !plansLoading.value && !plansError.value
  && typeof rechargeAmount.value === "number" && Number.isFinite(rechargeAmount.value) && rechargeAmount.value > 0
  && (selectedPlanId.value === -1 ? typeof customMoney.value === "number" && customMoney.value >= 1
    && Number(customMoney.value.toFixed(2)) === customMoney.value : !!selectedPlan.value));
const currentBonusTier = computed(() => {
  const activity = activeRechargeActivity.value;
  const amount = rechargeAmount.value;
  if (!rechargeReady.value || activity?.rateMode !== "tiered" || amount === undefined) return -1;
  const index = activity.tiers.findIndex(tier => amount <= tier.upTo);
  return index === -1 ? activity.tiers.length - 1 : index;
});
const bonusRulesExpiry = computed(() => {
  const activity = activeRechargeActivity.value;
  return activity ? bonusExpiry({ bonusExpireMode: activity.expireMode, bonusValidDays: activity.validDays, bonusExpiresAt: activity.expiresAt }) : "";
});
const ordersError = ref("");
const paymentError = ref("");
const exchangeError = ref("");
const payment = ref<WalletPayment>();
const paymentVisible = ref(false);
const paymentNotice = ref("");
const paymentConfirmed = ref(false);
const checkError = ref("");
const qrImageError = ref(false);
const moneyFormat = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 6 });
const rateFormat = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 4 });
const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
let plansRequest: AbortController | undefined;
let ordersRequest: AbortController | undefined;
let paymentRequest: AbortController | undefined;
let exchangeRequest: AbortController | undefined;
let checkRequest: AbortController | undefined;
let paymentTimer: ReturnType<typeof setTimeout> | undefined;
let rechargeTimer: ReturnType<typeof setTimeout> | undefined;
let rechargeClockOffset = 0;
let nextRechargeRefreshAt: number | undefined;
let rechargeRefreshPending = false;

function refreshRecharge() {
  if (!props.visible || !props.token || document.hidden) return;
  rechargeNow.value = Date.now() + rechargeClockOffset;
  rechargeStale.value = true;
  rechargeRefreshPending = true;
  if (!mutationBusy.value) void loadPlans();
}

function scheduleRechargeRefresh() {
  clearTimeout(rechargeTimer);
  if (!props.visible || !props.token || document.hidden || nextRechargeRefreshAt === undefined) return;
  const delay = nextRechargeRefreshAt - (Date.now() + rechargeClockOffset);
  rechargeTimer = setTimeout(() => {
    rechargeNow.value = Date.now() + rechargeClockOffset;
    if (nextRechargeRefreshAt !== undefined && rechargeNow.value < nextRechargeRefreshAt) {
      scheduleRechargeRefresh();
      return;
    }
    refreshRecharge();
  }, Math.max(0, Math.min(delay, 2147483647)));
}

function handleVisibilityChange() {
  clearTimeout(rechargeTimer);
  clearTimeout(paymentTimer);
  if (document.hidden || !props.visible || !props.token) return;
  refreshRecharge();
  void bonusPanel.value?.refresh();
  if (paymentVisible.value && payment.value && !paymentConfirmed.value) void checkPayment(true);
}

function multiplyMoney(amount: number, rate: number) {
  const cents = Math.round(amount * 100) * rate;
  return Math.round(cents + Number.EPSILON * Math.abs(cents)) / 100;
}

function bonusExpiry(bonus: Partial<WalletBonus>) {
  if (bonus.bonusExpireMode === "days" && bonus.bonusValidDays != null) return t`到账后 ${bonus.bonusValidDays} 天有效`;
  if (bonus.bonusExpireMode === "fixed" && bonus.bonusExpiresAt != null) return t`有效期至 ${formatTime(bonus.bonusExpiresAt)}`;
  return "";
}

function paymentSnapshot() {
  return JSON.stringify([selectedPlanId.value, customMoney.value, payType.value, selectedPlan.value, presentation.value?.pricing,
    rechargeAmount.value, rechargePoints.value, rechargeBonus.value, rechargeActivities.value]);
}

function formatMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? moneyFormat.format(value) : "";
}

function formatRate(value: number) {
  return rateFormat.format(value);
}

function formatTime(value: number) {
  return timeFormat.format(value);
}

function requestError(error: unknown, fallback: string) {
  return error instanceof Error && "status" in error && error.status === 401 ? translate("账号登录已失效，请重新登录")
    : error instanceof Error ? error.message : fallback;
}

function statusLabel(status: number) {
  return ({ [-1]: translate("订单创建失败"), 0: translate("订单生成"), 1: translate("支付中"), 2: translate("成功"), 3: translate("支付失败"), 4: translate("已撤销"), 5: translate("已退款"), 6: translate("订单关闭") } as Record<number, string>)[status] ?? t`状态 ${status}`;
}

function statusType(status: number) {
  return status === 2 ? "success" : status === 1 ? "warning" : status === -1 ? "danger" : "info";
}

function orderTypeLabel(type: number) {
  return ({ 1: translate("充值"), 2: translate("消费充值"), 3: translate("兑换码兑换") } as Record<number, string>)[type] ?? t`类型 ${type}`;
}

function paymentLabel(method: string) {
  return ({ WX_NATIVE: translate("微信支付"), ALI_PC: translate("支付宝") } as Record<string, string>)[method] ?? method;
}

async function loadPlans() {
  plansRequest?.abort();
  clearTimeout(rechargeTimer);
  nextRechargeRefreshAt = undefined;
  rechargeRefreshPending = false;
  rechargeStale.value = true;
  plansLoading.value = false;
  plansError.value = "";
  const token = props.token;
  if (!props.visible || !token) return false;
  const request = new AbortController();
  plansRequest = request;
  plansLoading.value = true;
  try {
    const options = { method: "GET" as const, signal: request.signal, headers: { Authorization: `Bearer ${token}` } };
    const [result, details, activity] = await Promise.all([
      http<WalletPlan[]>({ ...options, url: "/api/channel/wallet/getPlans" }),
      http<WalletPresentation>({ ...options, url: "/api/channel/wallet/getPresentation" }),
      http<WalletActivity>({ ...options, url: "/api/channel/wallet/getActivity" }),
    ]);
    if (request.signal.aborted || props.token !== token) return false;
    rechargeNow.value = Math.max(details.serverTime, activity.serverTime);
    rechargeClockOffset = rechargeNow.value - Date.now();
    if (activity.eligible && ((activity.startsAt !== null && activity.startsAt > rechargeNow.value)
      || (activity.endsAt !== null && activity.endsAt <= rechargeNow.value)
      || (activity.expireMode === "fixed" && activity.expiresAt !== null && activity.expiresAt <= rechargeNow.value))) {
      throw new Error("充值活动信息已变化，请刷新后重试");
    }
    if (JSON.stringify(presentation.value?.agreement) !== JSON.stringify(details.agreement)) {
      agreementAccepted.value = false;
      agreementVisible.value = false;
    }
    presentation.value = details;
    rechargeActivity.value = activity;
    plans.value = result;
    rechargeStale.value = false;
    const refreshTimes = [activity.refreshAt, ...details.activities.flatMap(item => [item.rechargeConfig.startsAt, item.rechargeConfig.endsAt])];
    if (activity.eligible) refreshTimes.push(activity.startsAt, activity.endsAt, activity.expireMode === "fixed" ? activity.expiresAt : null);
    nextRechargeRefreshAt = refreshTimes.filter((time): time is number => typeof time === "number" && time > rechargeNow.value).sort((a, b) => a - b)[0];
    scheduleRechargeRefresh();
    if (selectedPlanId.value !== -1 && !result.some(plan => plan.id === selectedPlanId.value)) selectedPlanId.value = result[0]?.id ?? -1;
    return true;
  } catch (error) {
    if (!request.signal.aborted) {
      plansError.value = requestError(error, translate("获取充值信息失败"));
      agreementAccepted.value = false;
    }
    return false;
  } finally {
    if (plansRequest === request) plansLoading.value = false;
  }
}

async function loadOrders(force = false) {
  ordersRequest?.abort();
  ordersLoading.value = false;
  ordersError.value = "";
  const token = props.token;
  if (!props.visible || (!ordersVisible.value && !force) || !token) return;
  const request = new AbortController();
  ordersRequest = request;
  ordersLoading.value = true;
  try {
    const result = await http<WalletOrdersPage>({
      method: "GET", url: "/api/channel/wallet/getOrders", params: { page: page.value, limit: pageSize.value },
      signal: request.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (request.signal.aborted || props.token !== token) return;
    orders.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (!request.signal.aborted) ordersError.value = requestError(error, translate("获取充值记录失败"));
  } finally {
    if (ordersRequest === request) ordersLoading.value = false;
  }
}

async function refresh() {
  await Promise.all([loadPlans(), loadOrders(), bonusPanel.value?.refresh()]);
}

function changePage(value: number) {
  if (page.value === value) return;
  page.value = value;
  void loadOrders();
}

function changePageSize(value: number) {
  pageSize.value = value;
  page.value = 1;
  void loadOrders();
}

async function exchangeCode() {
  const token = props.token;
  if (!props.visible || !token || !code.value.trim() || mutationBusy.value) return;
  const request = new AbortController();
  exchangeRequest = request;
  exchanging.value = true;
  exchangeError.value = "";
  try {
    await http<null>({
      method: "POST", url: "/api/channel/wallet/exchange", data: { code: code.value.trim() },
      signal: request.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (request.signal.aborted || props.token !== token) return;
    code.value = "";
    ElMessage.success("兑换成功");
    emit("balanceChanged");
    page.value = 1;
    await Promise.all([loadOrders(true), loadPlans(), bonusPanel.value?.refresh()]);
  } catch (error) {
    if (!request.signal.aborted) exchangeError.value = requestError(error, translate("兑换失败"));
  } finally {
    if (exchangeRequest === request) exchanging.value = false;
  }
}

async function createPayment() {
  const token = props.token;
  const amount = rechargeAmount.value;
  const comboId = selectedPlanId.value;
  if (!props.visible || !token || !rechargeReady.value || !agreementAccepted.value || typeof amount !== "number" || comboId === undefined || mutationBusy.value) return;
  const snapshot = paymentSnapshot();
  const agreement = JSON.stringify(presentation.value?.agreement);
  const bonus = { ...rechargeBonus.value };
  const request = new AbortController();
  paymentRequest = request;
  paying.value = true;
  paymentError.value = "";
  try {
    if (!await loadPlans() || request.signal.aborted || props.token !== token) return;
    if (agreement !== JSON.stringify(presentation.value?.agreement) || !agreementAccepted.value) {
      paymentError.value = "充值协议已更新，请阅读后重新勾选";
      return;
    }
    if (!rechargeReady.value || snapshot !== paymentSnapshot()) {
      paymentError.value = "充值信息已更新，请确认金额和赠送规则后重新支付";
      return;
    }
    const data: WalletPaymentParams = {
      comboId, payType: payType.value, expectedAmount: amount, expectedBonusAmount: bonus.bonusAmount, expectedBonus: bonus,
      ...(comboId === -1 ? { customMoney: customMoney.value } : {}),
    };
    const result = await http<WalletPayment>({
      method: "POST", url: "/api/channel/wallet/pay", data,
      signal: request.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (request.signal.aborted || props.token !== token) return;
    if (result.amount !== amount || (Object.keys(bonus) as (keyof WalletBonus)[]).some(key => result[key] !== bonus[key])) {
      paymentError.value = "支付订单的金额或赠送规则已变化，请刷新充值信息后重新确认";
      await loadPlans();
      return;
    }
    payment.value = result;
    paymentVisible.value = true;
    page.value = 1;
    void loadOrders();
  } catch (error) {
    if (!request.signal.aborted) paymentError.value = requestError(error, translate("创建支付订单失败"));
  } finally {
    if (paymentRequest === request) paying.value = false;
  }
}

function schedulePaymentCheck() {
  clearTimeout(paymentTimer);
  if (!props.visible || !props.token || !paymentVisible.value || !payment.value || paymentConfirmed.value || document.hidden) return;
  paymentTimer = setTimeout(() => { void checkPayment(true); }, 3000);
}

async function checkPayment(automatic = false) {
  const token = props.token;
  const currentPayment = payment.value;
  if (!props.visible || !token || !paymentVisible.value || !currentPayment || paymentConfirmed.value || checking.value) return;
  clearTimeout(paymentTimer);
  const request = new AbortController();
  checkRequest = request;
  checking.value = true;
  checkError.value = "";
  if (!automatic) paymentNotice.value = "";
  let pending = false;
  try {
    const result = await http<WalletPaymentStatus>({
      method: "GET", url: "/api/channel/wallet/getPaymentStatus", params: { orderNumber: currentPayment.orderNumber },
      signal: request.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (request.signal.aborted || props.token !== token || payment.value !== currentPayment) return;
    pending = result.status === 0 || result.status === 1;
    if (result.status !== 2) {
      if (!automatic || !pending) paymentNotice.value = pending ? t`当前订单${statusLabel(result.status)}，正在等待支付结果` : statusLabel(result.status);
      return;
    }
    paymentConfirmed.value = true;
    paymentNotice.value = translate("支付成功");
    agreementAccepted.value = false;
    page.value = 1;
    emit("balanceChanged");
    await Promise.all([loadOrders(true), bonusPanel.value?.refresh(), loadPlans()]);
  } catch (error) {
    if (!request.signal.aborted) checkError.value = requestError(error, translate("查询支付结果失败"));
  } finally {
    if (checkRequest === request) {
      checkRequest = undefined;
      checking.value = false;
      if (pending && !request.signal.aborted && payment.value === currentPayment) schedulePaymentCheck();
    }
  }
}

watch([plansLoading, ordersLoading, bonusLoading, paying, exchanging, checking], values => {
  loading.value = values.some(Boolean);
}, { flush: "sync" });

watch(mutationBusy, busy => {
  if (!busy && rechargeRefreshPending) refreshRecharge();
});

watch(paymentVisible, visible => {
  if (visible) {
    schedulePaymentCheck();
    return;
  }
  clearTimeout(paymentTimer);
  checkRequest?.abort();
  checkRequest = undefined;
  checking.value = false;
  payment.value = undefined;
  paymentNotice.value = "";
  paymentConfirmed.value = false;
  checkError.value = "";
  qrImageError.value = false;
}, { flush: "sync" });

watch(ordersVisible, visible => {
  if (visible) {
    void loadOrders();
    return;
  }
  ordersRequest?.abort();
  ordersLoading.value = false;
}, { flush: "sync" });

function cancelRequests() {
  clearTimeout(rechargeTimer);
  clearTimeout(paymentTimer);
  nextRechargeRefreshAt = undefined;
  rechargeRefreshPending = false;
  rechargeStale.value = true;
  for (const request of [plansRequest, ordersRequest, paymentRequest, exchangeRequest, checkRequest]) request?.abort();
  checkRequest = undefined;
  plansLoading.value = false;
  ordersLoading.value = false;
  paying.value = false;
  exchanging.value = false;
  checking.value = false;
}

watch([() => props.visible, () => props.token], ([visible, token], previous) => {
  cancelRequests();
  ordersVisible.value = false;
  paymentVisible.value = false;
  agreementVisible.value = false;
  agreementAccepted.value = false;
  code.value = "";
  paymentError.value = "";
  exchangeError.value = "";
  if (token !== previous?.[1]) {
    plans.value = [];
    presentation.value = undefined;
    rechargeActivity.value = undefined;
    orders.value = [];
    selectedPlanId.value = undefined;
    customMoney.value = 1;
    payType.value = "wechat";
    page.value = 1;
    total.value = 0;
  }
  if (visible && token) void refresh();
}, { immediate: true, flush: "sync" });

onMounted(() => document.addEventListener("visibilitychange", handleVisibilityChange));

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  cancelRequests();
  loading.value = false;
});

defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.walletPanel {
  display: grid;
  gap: 20px;
  min-width: 0;

  .balanceCard {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius-large);
    background: var(--el-fill-color-extra-light);

    .balanceHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-basis: 100%;
      gap: 12px;

      span { color: var(--el-text-color-secondary); font-size: 12px; }
    }
    .balanceAmount { flex: 1; min-width: 0; color: var(--el-text-color-primary); font-size: 26px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
    .exchangeForm { display: flex; flex-wrap: wrap; gap: 8px; width: min(100%, 320px); .el-input { flex: 1; min-width: 130px; } .el-button { margin: 0; } }
    .exchangeError { flex-basis: 100%; }
  }

  .rechargeSection {
    display: grid;
    gap: 14px;
    min-width: 0;

    h3 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; }

    .plansGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
      gap: 10px;
      min-height: 80px;

      .planCard {
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 18px 14px;
        border: 1px solid var(--el-border-color-light);
        border-radius: var(--ui-radius);
        background: var(--el-fill-color-extra-light);
        color: var(--el-text-color-regular);
        font: inherit;
        text-align: start;
        cursor: pointer;

        strong { color: var(--el-text-color-primary); font-size: 20px; font-variant-numeric: tabular-nums; }
        span { font-size: 12px; }
        .planBonus { justify-self: start; padding: 3px 7px; border-radius: 4px; background: var(--el-color-primary-light-9); color: var(--el-text-color-primary); font-weight: 600; }
        .planDescription { color: var(--el-text-color-secondary); line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
        &.selected { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
        &:disabled { cursor: default; opacity: 0.6; }
      }
    }
    .customAmountForm {
      :deep(.el-form-item) { margin-bottom: 0; }
      .el-input-number { width: min(100%, 280px); }
    }
    .bonusRules {
      min-width: 0;
      padding: 16px;
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--ui-radius);
      color: var(--el-text-color-regular);
      font-size: 13px;
      line-height: 1.6;

      .bonusRulesHeader {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px 16px;
        margin-bottom: 14px;

        h4 { display: flex; align-items: center; gap: 7px; margin: 0; color: var(--el-text-color-primary); font-size: 14px; svg { color: var(--el-color-primary); flex-shrink: 0; } }
        .bonusActivityName { color: var(--el-text-color-regular); overflow-wrap: anywhere; }
      }
      .bonusRuleFacts {
        display: grid;
        gap: 8px;
        margin: 0;

        div { display: grid; grid-template-columns: minmax(80px, 100px) minmax(0, 1fr); align-items: baseline; gap: 8px 16px; }
        dt { color: var(--el-text-color-regular); }
        dd { margin: 0; color: var(--el-text-color-primary); overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
      }
      .bonusTierList {
        max-height: 280px;
        margin-top: 16px;
        overflow: auto;
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }

        .bonusTierTable {
          width: 100%;
          border-collapse: collapse;
          font-variant-numeric: tabular-nums;
          text-align: start;

          th, td { padding: 9px 12px; border-bottom: 1px solid var(--el-border-color-lighter); text-align: start; }
          th { position: sticky; top: 0; z-index: 1; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 12px; font-weight: 500; }
          th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3) { white-space: nowrap; }
          td:nth-child(3) { width: 64px; text-align: end; }
          .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
          .currentTier { background: var(--el-color-primary-light-9); color: var(--el-text-color-primary); td:nth-child(2) { font-weight: 600; } }
          .currentTierLabel { color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; }
        }
      }
    }
    .rechargeSummary {
      padding-block: 16px;
      border-block: 1px solid var(--el-border-color-lighter);
      dl {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 16px 32px;
        margin: 0;
        div { display: grid; gap: 6px; min-width: 0; }
        dt { color: var(--el-text-color-regular); font-size: 12px; }
        dd { margin: 0; color: var(--el-text-color-primary); font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        .totalMetric { margin-inline-start: auto; dd { font-size: 20px; } }
      }
    }
    .rechargeActivity {
      font-size: 13px;
      line-height: 1.6;
      overflow-wrap: anywhere;
      strong { color: var(--el-text-color-primary); }
      p { margin: 4px 0 0; color: var(--el-text-color-regular); white-space: pre-wrap; }
    }
    .agreementActions { display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; .el-checkbox { margin: 0; } .el-button { height: auto; white-space: normal; text-align: start; line-height: 1.6; } }
    .paymentActions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; .el-segmented { --el-border-radius-base: var(--ui-radius); } .el-button { margin: 0; } }
  }
}
.agreementDialog {
  max-height: min(560px, calc(100dvh - 240px));
  overflow-y: auto;
  overflow-wrap: anywhere;

  .agreementMeta { margin: 0 0 16px; color: var(--el-text-color-regular); font-size: 12px; }
  .agreementContent {
    color: var(--el-text-color-primary);
    line-height: 1.75;
    font-size: 14px;
    :deep(> :first-child) { margin-top: 0; }
    :deep(h1), :deep(h2), :deep(h3), :deep(h4) { margin-block: 24px 12px; font-size: 16px; }
    :deep(p) { margin-block: 12px; }
    :deep(pre) { white-space: pre-wrap; }
    :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; th, td { padding: 6px 10px; border: 1px solid var(--el-border-color-light); } }
    :deep(a) { color: var(--el-color-primary); text-decoration: underline; text-underline-offset: 3px; }
  }
}
.ordersSection {
  display: grid;
  gap: 14px;
  min-width: 0;

  .ordersList {
    min-width: 0;
    min-height: 100px;

    .orderIdentity, .orderFields { display: grid; gap: 4px; padding: 4px 0; font-size: 12px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
    .orderIdentity { strong { color: var(--el-text-color-primary); font-size: 13px; } span { color: var(--el-text-color-secondary); } }
    .orderFields > :nth-child(2) { color: var(--el-text-color-secondary); }
  }
  .ordersPagination { justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
}
.paymentDialog {
  display: grid;
  justify-items: center;
  gap: 16px;

  .paymentAmount { margin: 0; color: var(--el-text-color-primary); font-size: 26px; font-weight: 600; }
  .paymentBonus {
    box-sizing: border-box;
    width: 100%;
    padding: 14px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--ui-radius);
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;

    .paymentBonusAmount { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: var(--el-text-color-primary); font-size: 13px; svg { flex-shrink: 0; color: var(--el-color-primary); } strong { margin-inline-start: auto; font-size: 17px; font-variant-numeric: tabular-nums; } }
    dl { display: grid; gap: 6px; margin: 12px 0 0; div { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 10px; } dd { margin: 0; color: var(--el-text-color-primary); } }
  }
  .paymentQr { display: block; width: 220px; height: 220px; max-width: 100%; object-fit: contain; background: white; }
  .paymentHint, .paymentOrder { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
}
</style>
