<template>
  <article class="usersPage">
    <header class="pageHeading">
      <h1>{{ translate("用户管理") }}</h1>
    </header>
    <div class="usersToolbar">
      <el-form class="searchForm" labelPosition="top" :disabled="mutationBusy" @submit.prevent="submitSearch">
        <el-form-item class="searchField" :label="translate('账号')" for="adminUsersSearch">
          <el-input id="adminUsersSearch" v-model="search" :prefixIcon="IconSearch" :maxlength="64" autocomplete="off" clearable @clear="submitSearch" />
        </el-form-item>
        <el-form-item class="statusField" :label="translate('状态')" for="adminUsersStatus">
          <el-select id="adminUsersStatus" v-model="status" @change="submitSearch">
            <el-option value="all" :label="translate('全部')" />
            <el-option value="enabled" :label="translate('已启用')" />
            <el-option value="disabled" :label="translate('已禁用')" />
          </el-select>
        </el-form-item>
        <div class="searchActions">
          <el-button nativeType="submit" :disabled="listLoading">{{ translate("查询") }}</el-button>
          <el-button :icon="IconRefresh" :loading="listLoading" :disabled="mutationBusy" @click="refresh">{{ translate("刷新") }}</el-button>
        </div>
      </el-form>
      <el-button class="createButton" type="primary" :icon="IconPlus" :disabled="mutationBusy || listLoading" @click="openCreate">{{ translate("新增账号") }}</el-button>
    </div>
    <el-alert v-if="listError" :title="listError" type="error" :closable="false" showIcon />
    <div v-loading="listLoading" class="usersList" :aria-busy="listLoading">
      <el-table :data="users" rowKey="id" :emptyText="listError ? translate('读取用户列表失败') : translate('暂无用户')">
        <el-table-column :label="translate('账号')" minWidth="170">
          <template #default="{ row }"><strong class="accountName">{{ row.userName }}</strong></template>
        </el-table-column>
        <el-table-column :label="translate('状态')" width="100">
          <template #default="{ row }"><el-tag :type="row.disabled ? 'info' : 'success'" size="small">{{ row.disabled ? translate("已禁用") : translate("已启用") }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="translate('创建时间')" minWidth="170">
          <template #default="{ row }"><span class="timeText">{{ formatTime(row.createdAt) }}</span></template>
        </el-table-column>
        <el-table-column :label="translate('最近登录')" minWidth="170">
          <template #default="{ row }"><span class="timeText">{{ formatTime(row.lastLoginAt) }}</span></template>
        </el-table-column>
        <el-table-column :label="translate('操作')" width="230" align="right">
          <template #default="{ row }">
            <div class="rowActions">
              <el-button link type="primary" :disabled="mutationBusy || listLoading" @click="openBalance(row as UserItem)">{{ translate("余额") }}</el-button>
              <el-button link type="primary" :disabled="mutationBusy || listLoading" @click="openPassword(row as UserItem)">{{ translate("重置密码") }}</el-button>
              <el-button link :type="row.disabled ? 'primary' : 'danger'" :loading="stateTargetId === row.id" :disabled="mutationBusy || listLoading" @click="changeState(row as UserItem)">{{ row.disabled ? translate("启用") : translate("禁用") }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-if="!listError" class="usersPagination" :currentPage="page" :pageSize="pageSize" :pageSizes="[10, 20, 50]" :total="total" :disabled="listLoading || mutationBusy" :pagerCount="5" layout="total, sizes, prev, pager, next" @update:currentPage="changePage" @update:pageSize="changePageSize" />

    <el-dialog v-model="formVisible" :title="formTarget ? translate('重置密码') : translate('新增账号')" width="min(480px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="!formSaving" :closeOnPressEscape="!formSaving" :showClose="!formSaving" @closed="!formVisible && clearForm()">
      <div class="formContent">
        <div v-if="formTarget" class="targetIdentity">
          <span>{{ translate("账号") }}</span>
          <strong>{{ formTarget.userName }}</strong>
          <p class="resetDescription">{{ translate("重置密码后，该账号需要重新登录。") }}</p>
        </div>
        <el-form id="adminUserForm" class="userForm" labelPosition="top" :disabled="formSaving" @submit.prevent="saveForm">
          <el-form-item v-if="!formTarget" :label="translate('账号')" for="adminNewUserName" :error="userNameError" required>
            <el-input id="adminNewUserName" ref="userNameInput" v-model="formUserName" autocomplete="off" :maxlength="64" />
          </el-form-item>
          <el-form-item :label="translate('密码')" for="adminNewUserPassword" :error="passwordError" required>
            <el-input id="adminNewUserPassword" ref="passwordInput" v-model="formPassword" type="password" showPassword autocomplete="new-password" :minlength="8" :maxlength="128" />
          </el-form-item>
          <el-form-item :label="translate('确认密码')" for="adminNewUserPasswordConfirm" :error="confirmationError" required>
            <el-input id="adminNewUserPasswordConfirm" ref="confirmationInput" v-model="passwordConfirm" type="password" showPassword autocomplete="new-password" :minlength="8" :maxlength="128" />
          </el-form-item>
        </el-form>
        <el-alert v-if="formError" :title="formError" type="error" :closable="false" showIcon />
      </div>
      <template #footer>
        <el-button :disabled="formSaving" @click="formVisible = false">{{ translate("取消") }}</el-button>
        <el-button type="primary" nativeType="submit" form="adminUserForm" :loading="formSaving" :disabled="formSaving">{{ formTarget ? translate("保存") : translate("创建") }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="balanceVisible" :title="translate('账户余额')" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="!balanceSaving" :closeOnPressEscape="!balanceSaving" :showClose="!balanceSaving" @closed="!balanceVisible && clearBalance()">
      <div class="balanceContent">
        <header class="balanceHeading">
          <strong>{{ balanceTarget?.userName }}</strong>
          <el-button :icon="IconRefresh" :loading="balanceLoading" :disabled="balanceLoading || balanceSaving" @click="loadBalance">{{ translate("刷新") }}</el-button>
        </header>
        <el-alert v-if="balanceError" :title="balanceError" type="error" :closable="false" showIcon />
        <div v-loading="balanceLoading" class="walletOverview" :aria-busy="balanceLoading">
          <dl v-if="balanceSnapshot" class="walletList">
            <div v-for="wallet in balanceSnapshot.wallets" :key="wallet.currency" class="walletRow">
              <dt>{{ wallet.currency }}</dt>
              <dd><span>{{ translate("余额") }}</span><strong>{{ wallet.balance }}</strong></dd>
              <dd><span>{{ translate("已预占") }}</span><strong>{{ wallet.reserved }}</strong></dd>
              <dd><span>{{ translate("可用余额") }}</span><strong>{{ wallet.available }}</strong></dd>
            </div>
          </dl>
        </div>
        <section class="creditSection" aria-labelledby="adminCreditTitle">
          <h3 id="adminCreditTitle">{{ translate("增加余额") }}</h3>
          <el-form id="adminUserCreditForm" class="creditForm" labelPosition="top" :disabled="balanceLoading || balanceSaving || !!pendingCredit" @submit.prevent="saveCredit">
            <el-form-item class="currencyField" :label="translate('币种')" for="adminCreditCurrency">
              <el-select id="adminCreditCurrency" v-model="creditCurrency"><el-option value="CNY" label="CNY" /><el-option value="USD" label="USD" /></el-select>
            </el-form-item>
            <el-form-item class="amountField" :label="translate('金额')" for="adminCreditAmount" :error="creditAmountError" required>
              <el-input id="adminCreditAmount" ref="creditAmountInput" v-model="creditAmount" inputmode="decimal" autocomplete="off" :maxlength="20" />
            </el-form-item>
            <el-form-item class="noteField" :label="translate('备注')" for="adminCreditNote">
              <el-input id="adminCreditNote" v-model="creditNote" :maxlength="256" autocomplete="off" />
            </el-form-item>
          </el-form>
          <el-alert v-if="creditError" :title="creditError" type="error" :closable="false" showIcon />
        </section>
        <section v-if="balanceSnapshot" class="transactionsSection" aria-labelledby="adminTransactionsTitle">
          <h3 id="adminTransactionsTitle">{{ translate("最近 20 笔账目") }}</h3>
          <el-table :data="balanceSnapshot.transactions" rowKey="id" :emptyText="translate('暂无账目')">
            <el-table-column :label="translate('时间')" minWidth="160"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column>
            <el-table-column :label="translate('类型')" width="100"><template #default="{ row }">{{ row.kind === 'credit' ? translate("增加余额") : translate("模型扣费") }}</template></el-table-column>
            <el-table-column :label="translate('金额')" minWidth="150"><template #default="{ row }"><span class="moneyText">{{ `${row.kind === 'credit' ? '+' : row.status === 'settled' && !/^0(?:\.0+)?$/.test(row.amount) ? '-' : ''}${row.amount} ${row.currency}` }}</span></template></el-table-column>
            <el-table-column :label="translate('状态')" width="100"><template #default="{ row }">{{ transactionStatus(row.status) }}</template></el-table-column>
            <el-table-column :label="translate('说明')" minWidth="180"><template #default="{ row }">{{ row.note || row.label }}</template></el-table-column>
            <el-table-column :label="translate('操作')" width="120" align="right">
              <template #default="{ row }">
                <el-button v-if="row.kind === 'model' && row.status === 'reserved'" class="releaseButton" link type="warning" :loading="releaseTargetId === row.id" :disabled="mutationBusy" @click="releaseReservation(row as BillingTransaction)">{{ translate("释放预占") }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-alert v-if="releaseError" :title="releaseError" type="error" :closable="false" showIcon />
        </section>
      </div>
      <template #footer>
        <el-button :disabled="balanceSaving" @click="balanceVisible = false">{{ translate("关闭") }}</el-button>
        <el-button type="primary" nativeType="submit" form="adminUserCreditForm" :loading="creditSaving" :disabled="balanceLoading || balanceSaving || !balanceSnapshot">{{ pendingCredit ? translate("重试增加余额") : translate("增加余额") }}</el-button>
      </template>
    </el-dialog>
  </article>
</template>

<script setup lang="ts">
import { locale, t, translate } from "@toonflow/i18n/vue";
import { computed, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { IconPlus, IconRefresh, IconSearch } from "@tabler/icons-vue";
import { ElAlert, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElPagination, ElSelect, ElTable, ElTableColumn, ElTag, vLoading, type InputInstance } from "element-plus";
import type { AdminRequest } from "../types";
import { billingCreditSchema, type BillingCredit, type BillingCurrency, type BillingSnapshot, type BillingTransaction } from "@toonflow/multi-tenant-billing/config";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/pagination/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/table-column/style/css";
import "element-plus/es/components/tag/style/css";

type UserItem = { id: string; userName: string; disabled: boolean; createdAt: number; lastLoginAt: number };
type UsersPage = { items: UserItem[]; total: number; page: number; pageSize: number };
type UserStatus = "all" | "enabled" | "disabled";
const props = defineProps<{ enabled: boolean; saving: boolean; creationUrl: string; request: AdminRequest }>();
const emit = defineEmits<{ changeEnabled: [enabled: boolean]; openCreation: []; sessionExpired: [] }>();
const users = ref<UserItem[]>([]);
const search = ref("");
const status = ref<UserStatus>("all");
const activeSearch = ref("");
const activeStatus = ref<UserStatus>("all");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const listLoading = ref(false);
const listError = ref("");
const formVisible = ref(false);
const formTarget = shallowRef<Pick<UserItem, "id" | "userName"> | null>(null);
const formUserName = ref("");
const formPassword = ref("");
const passwordConfirm = ref("");
const formSaving = ref(false);
const userNameError = ref("");
const passwordError = ref("");
const confirmationError = ref("");
const formError = ref("");
const stateTargetId = ref<string | null>(null);
const balanceVisible = ref(false);
const balanceTarget = shallowRef<Pick<UserItem, "id" | "userName"> | null>(null);
const balanceSnapshot = shallowRef<BillingSnapshot | null>(null);
const balanceLoading = ref(false);
const balanceError = ref("");
const creditSaving = ref(false);
const creditCurrency = ref<BillingCurrency>("CNY");
const creditAmount = ref("");
const creditNote = ref("");
const creditRequestId = ref("");
const creditAmountError = ref("");
const creditError = ref("");
const pendingCredit = shallowRef<BillingCredit | null>(null);
const creditAmountInput = ref<InputInstance>();
const releaseTargetId = ref<string | null>(null);
const releaseError = ref("");
const balanceSaving = computed(() => creditSaving.value || releaseTargetId.value !== null);
const mutationBusy = computed(() => props.saving || formSaving.value || stateTargetId.value !== null || balanceSaving.value || balanceLoading.value);
const userNameInput = ref<InputInstance>();
const passwordInput = ref<InputInstance>();
const confirmationInput = ref<InputInstance>();
const timeFormat = computed(() => new Intl.DateTimeFormat(locale.value, {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}));
let listRequest: AbortController | undefined;
let mutationRequest: AbortController | undefined;
let balanceRequest: AbortController | undefined;
let creditRequest: AbortController | undefined;
let releaseRequest: AbortController | undefined;
let closeReleasePrompt: (() => void) | undefined;
const releaseReasons = new Map<string, string>();
let confirmingState = false;
let disposed = false;

watch([formUserName, formPassword, passwordConfirm], () => {
  userNameError.value = "";
  passwordError.value = "";
  confirmationError.value = "";
  formError.value = "";
});

watch([creditCurrency, creditAmount, creditNote], () => {
  if (!pendingCredit.value) { creditAmountError.value = ""; creditError.value = ""; }
});

function formatTime(value: number) {
  const date = new Date(value);
  return value > 0 && Number.isFinite(date.getTime()) ? timeFormat.value.format(date) : translate("未记录");
}

function errorMessage(cause: unknown, fallback: string) {
  if ((cause as { status?: number } | null)?.status === 401) emit("sessionExpired");
  return cause instanceof Error ? cause.message : fallback;
}

function transactionStatus(value: BillingTransaction["status"]) {
  if (value === "reserved") return translate("待结算");
  return value === "settled" ? translate("已结算") : translate("已释放");
}

function clearBalance() {
  balanceRequest?.abort();
  balanceRequest = undefined;
  balanceTarget.value = null;
  balanceSnapshot.value = null;
  balanceLoading.value = false;
  balanceError.value = "";
  creditCurrency.value = "CNY";
  creditAmount.value = "";
  creditNote.value = "";
  creditRequestId.value = "";
  creditAmountError.value = "";
  creditError.value = "";
  pendingCredit.value = null;
  releaseError.value = "";
  releaseReasons.clear();
}

function openBalance(user: UserItem) {
  if (mutationBusy.value || listLoading.value || formVisible.value) return;
  clearBalance();
  balanceTarget.value = { id: user.id, userName: user.userName };
  creditRequestId.value = crypto.randomUUID();
  balanceVisible.value = true;
  void loadBalance();
}

async function loadBalance() {
  if (!balanceVisible.value || !balanceTarget.value || balanceSaving.value) return;
  const targetId = balanceTarget.value.id;
  balanceRequest?.abort();
  const request = new AbortController();
  balanceRequest = request;
  balanceLoading.value = true;
  balanceError.value = "";
  try {
    const result = await props.request<BillingSnapshot>({
      method: "GET", url: "/api/multiTenant/billing/user", params: { userId: targetId }, signal: request.signal,
    });
    if (!disposed && !request.signal.aborted && balanceRequest === request && balanceTarget.value?.id === targetId) balanceSnapshot.value = result;
  } catch (cause) {
    if (!disposed && !request.signal.aborted && balanceRequest === request) balanceError.value = errorMessage(cause, translate("读取余额失败，请重试"));
  } finally { if (balanceRequest === request) balanceLoading.value = false; }
}

async function saveCredit() {
  if (!balanceVisible.value || !balanceTarget.value || !balanceSnapshot.value || mutationBusy.value) return;
  const parsed = billingCreditSchema.safeParse(pendingCredit.value ?? {
    userId: balanceTarget.value.id, currency: creditCurrency.value, amount: creditAmount.value.trim(),
    requestId: creditRequestId.value, note: creditNote.value.trim() || undefined,
  });
  if (!parsed.success) {
    creditAmountError.value = translate("金额须大于 0，最多 6 位小数且不超过 1000000000");
    creditAmountInput.value?.focus();
    return;
  }
  // ACT: 未确认的提交固定原始内容与请求 ID，重试不能重复增加余额。
  pendingCredit.value = parsed.data;
  const request = new AbortController();
  creditRequest = request;
  creditSaving.value = true;
  creditError.value = "";
  try {
    const result = await props.request<BillingSnapshot>({
      method: "POST", url: "/api/multiTenant/billing/credit", data: parsed.data, signal: request.signal,
    });
    if (disposed || request.signal.aborted) return;
    balanceSnapshot.value = result;
    pendingCredit.value = null;
    creditAmount.value = "";
    creditNote.value = "";
    creditRequestId.value = crypto.randomUUID();
    ElMessage.success(translate("余额已增加"));
  } catch (cause) {
    if (!disposed && !request.signal.aborted) creditError.value = errorMessage(cause, translate("增加余额失败，请重试"));
  } finally { if (creditRequest === request) { creditRequest = undefined; creditSaving.value = false; } }
}

async function releaseReservation(transaction: BillingTransaction) {
  if (!balanceVisible.value || !balanceTarget.value || mutationBusy.value || transaction.kind !== "model" || transaction.status !== "reserved") return;
  const userId = balanceTarget.value.id;
  const requestId = transaction.id;
  const request = new AbortController();
  releaseRequest = request;
  releaseTargetId.value = requestId;
  releaseError.value = "";
  try {
    const { value } = await ElMessageBox.prompt(({ close }) => {
      closeReleasePrompt = close;
      return h("span", translate("释放后本次请求不再扣费，仍在进行的上游调用费用由平台承担。"));
    }, translate("释放预占"), {
      type: "warning", confirmButtonText: translate("释放预占"), cancelButtonText: translate("取消"), closeOnClickModal: false,
      inputValue: releaseReasons.get(requestId) ?? "", inputPlaceholder: translate("释放原因"),
      inputValidator: value => !!value?.trim() && value.trim().length <= 256 || translate("请输入 1 到 256 个字符的释放原因"),
    });
    closeReleasePrompt = undefined;
    if (disposed || request.signal.aborted) return;
    const reason = value.trim();
    releaseReasons.set(requestId, reason);
    const result = await props.request<{ released: boolean; snapshot: BillingSnapshot }>({
      method: "POST", url: "/api/multiTenant/billing/release", data: { userId, requestId, reason }, signal: request.signal,
    });
    if (disposed || request.signal.aborted || balanceTarget.value?.id !== userId) return;
    balanceSnapshot.value = result.snapshot;
    releaseReasons.delete(requestId);
    ElMessage.success(result.released ? translate("预占已释放") : translate("该预占已结束，请查看最新账目"));
  } catch (cause) {
    if (!disposed && !request.signal.aborted && cause !== "cancel" && cause !== "close") releaseError.value = errorMessage(cause, translate("释放预占失败，请重试"));
  } finally {
    closeReleasePrompt = undefined;
    if (releaseRequest === request) { releaseRequest = undefined; releaseTargetId.value = null; }
  }
}

async function loadUsers(): Promise<void> {
  listRequest?.abort();
  const request = new AbortController();
  listRequest = request;
  listLoading.value = true;
  listError.value = "";
  users.value = [];
  try {
    const result = await props.request<UsersPage>({
      method: "GET", url: "/api/multiTenant/users/list", signal: request.signal,
      params: { search: activeSearch.value, status: activeStatus.value, page: page.value, pageSize: pageSize.value },
    });
    if (disposed || request.signal.aborted || listRequest !== request) return;
    total.value = result.total;
    const lastPage = Math.max(1, Math.ceil(result.total / result.pageSize));
    if (result.page > lastPage) {
      page.value = lastPage;
      await loadUsers();
      return;
    }
    users.value = result.items;
    page.value = result.page;
    pageSize.value = result.pageSize;
  } catch (cause) {
    if (!disposed && !request.signal.aborted && listRequest === request) listError.value = errorMessage(cause, translate("读取用户列表失败"));
  } finally { if (listRequest === request) listLoading.value = false; }
}

function submitSearch() {
  if (mutationBusy.value) return;
  activeSearch.value = search.value.trim();
  activeStatus.value = status.value;
  page.value = 1;
  void loadUsers();
}

function refresh() {
  if (!mutationBusy.value) void loadUsers();
}

function changePage(value: number) {
  if (mutationBusy.value || value === page.value) return;
  page.value = value;
  void loadUsers();
}

function changePageSize(value: number) {
  if (mutationBusy.value || value === pageSize.value) return;
  pageSize.value = value;
  page.value = 1;
  void loadUsers();
}

function clearForm() {
  formTarget.value = null;
  formUserName.value = "";
  formPassword.value = "";
  passwordConfirm.value = "";
  userNameError.value = "";
  passwordError.value = "";
  confirmationError.value = "";
  formError.value = "";
}

function openCreate() {
  if (mutationBusy.value || listLoading.value || balanceVisible.value) return;
  clearForm();
  formVisible.value = true;
}

function openPassword(user: UserItem) {
  if (mutationBusy.value || listLoading.value || balanceVisible.value) return;
  clearForm();
  formTarget.value = { id: user.id, userName: user.userName };
  formVisible.value = true;
}

async function saveForm() {
  if (!formVisible.value || mutationBusy.value) return;
  const target = formTarget.value ? { ...formTarget.value } : null;
  const name = formUserName.value.trim().normalize("NFKC");
  if (!target && (!name || name.length > 64 || name.toLowerCase().length > 64)) {
    userNameError.value = translate("账号长度应为 1 到 64 个字符");
    userNameInput.value?.focus();
    return;
  }
  if (!target && /[\s\u0000-\u001f\u007f]/.test(name)) {
    userNameError.value = translate("账号不能包含空白或控制字符");
    userNameInput.value?.focus();
    return;
  }
  if (formPassword.value.length < 8 || formPassword.value.length > 128) {
    passwordError.value = translate("密码长度应为 8 到 128 个字符");
    passwordInput.value?.focus();
    return;
  }
  if (formPassword.value !== passwordConfirm.value) {
    confirmationError.value = translate("两次输入的密码不一致");
    confirmationInput.value?.focus();
    return;
  }
  const request = new AbortController();
  mutationRequest = request;
  formSaving.value = true;
  formError.value = "";
  try {
    await props.request({
      method: target ? "PUT" : "POST", url: target ? "/api/multiTenant/users/password" : "/api/multiTenant/users/create",
      data: target ? { id: target.id, password: formPassword.value } : { userName: name, password: formPassword.value }, signal: request.signal,
    });
    if (disposed || request.signal.aborted) return;
    ElMessage.success(target ? translate("密码已重置") : translate("账号已创建"));
    formVisible.value = false;
    formPassword.value = "";
    passwordConfirm.value = "";
    if (!target) {
      search.value = "";
      activeSearch.value = "";
      status.value = "all";
      activeStatus.value = "all";
      page.value = 1;
    }
    await loadUsers();
  } catch (cause) {
    if (!disposed && !request.signal.aborted) formError.value = errorMessage(cause, translate("账号操作失败，请重试"));
  } finally {
    if (mutationRequest === request) { mutationRequest = undefined; formSaving.value = false; }
  }
}

async function changeState(user: UserItem) {
  if (mutationBusy.value || listLoading.value || balanceVisible.value) return;
  const target = { id: user.id, userName: user.userName, disabled: !user.disabled };
  const request = new AbortController();
  mutationRequest = request;
  stateTargetId.value = target.id;
  confirmingState = true;
  listError.value = "";
  try {
    await ElMessageBox.confirm(target.disabled ? t`确定禁用账号“${target.userName}”？` : t`确定启用账号“${target.userName}”？`, target.disabled ? translate("禁用") : translate("启用"), {
      type: "warning", confirmButtonText: translate("确认"), cancelButtonText: translate("取消"), closeOnClickModal: false,
    });
    confirmingState = false;
    if (disposed || request.signal.aborted) return;
    await props.request({ method: "PUT", url: "/api/multiTenant/users/state", data: { id: target.id, disabled: target.disabled }, signal: request.signal });
    if (disposed || request.signal.aborted) return;
    ElMessage.success(target.disabled ? translate("账号已禁用") : translate("账号已启用"));
    await loadUsers();
  } catch (cause) {
    if (!disposed && !request.signal.aborted && cause !== "cancel" && cause !== "close") listError.value = errorMessage(cause, translate("账号操作失败，请重试"));
  } finally {
    confirmingState = false;
    if (mutationRequest === request) { mutationRequest = undefined; stateTargetId.value = null; }
  }
}

onMounted(() => { void loadUsers(); });
onBeforeUnmount(() => {
  disposed = true;
  listRequest?.abort();
  mutationRequest?.abort();
  balanceRequest?.abort();
  creditRequest?.abort();
  releaseRequest?.abort();
  closeReleasePrompt?.();
  if (confirmingState) ElMessageBox.close();
  formPassword.value = "";
  passwordConfirm.value = "";
});
</script>

<style lang="scss" scoped>
.usersPage {
  display: grid;
  gap: 20px;
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);

  .pageHeading {
    h1 { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.4; letter-spacing: -0.02em; }
  }
  .usersToolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;

    .searchForm {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 12px;
      max-width: 100%;

      :deep(.el-form-item) { margin: 0; }
      .searchField { width: 220px; max-width: 100%; }
      .statusField { width: 140px; max-width: 100%; .el-select { width: 100%; } }
      .searchActions { display: flex; gap: 8px; .el-button { min-height: 44px; margin: 0; } }
      :deep(.el-input__wrapper), :deep(.el-select__wrapper) { min-height: 44px; }
    }
    .createButton { min-height: 44px; margin: 0; }
  }
  .usersList {
    min-width: 0;
    min-height: 160px;

    .accountName { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
    .timeText { font-size: 13px; font-variant-numeric: tabular-nums; }
    .rowActions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; .el-button { min-width: 44px; min-height: 44px; margin: 0; padding-inline: 4px; } }
  }
  .usersPagination {
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px;

    :deep(.btn-prev), :deep(.btn-next), :deep(.el-pager li) { min-width: 44px; height: 44px; }
    :deep(.el-pagination__sizes) { margin: 0; }
  }
  @media (max-width: 600px) {
    .pageHeading { h1 { font-size: 24px; } }
    .usersToolbar {
      .searchForm { width: 100%; .searchField, .statusField { width: 100%; } }
      .createButton { width: 100%; }
    }
    .usersPagination {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));

      :deep(.el-pagination__total) { grid-column: 1 / 4; grid-row: 1; margin: 0; }
      :deep(.el-pagination__sizes) { grid-column: 4 / -1; grid-row: 1; width: 100%; }
      :deep(.el-pagination__sizes .el-select) { width: 100%; }
      :deep(.btn-prev) { grid-column: 1 / 3; grid-row: 2; justify-self: start; }
      :deep(.el-pager) { grid-column: 3 / 5; grid-row: 2; justify-self: center; }
      :deep(.btn-next) { grid-column: 5 / -1; grid-row: 2; justify-self: end; }
      :deep(.el-pager li:not(.is-active)) { display: none; }
    }
  }
}
.formContent {
  display: grid;
  gap: 20px;
  max-height: calc(100dvh - 220px);
  overflow-y: auto;

  .targetIdentity {
    display: grid;
    gap: 6px;

    span { color: var(--el-text-color-regular); font-size: 13px; }
    strong { font-size: 14px; overflow-wrap: anywhere; }
    .resetDescription { margin: 2px 0 0; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
  }
  .userForm {
    :deep(.el-form-item) { margin-bottom: 20px; }
    :deep(.el-input__wrapper) { min-height: 44px; }
    :deep(.el-form-item__error) { position: static; padding-top: 6px; line-height: 1.5; overflow-wrap: anywhere; }
  }
}
.balanceContent {
  display: grid;
  gap: 24px;
  max-height: calc(100dvh - 220px);
  overflow-y: auto;
  min-width: 0;

  .balanceHeading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    strong { min-width: 0; font-size: 15px; overflow-wrap: anywhere; }
    .el-button { min-height: 40px; margin: 0; }
  }
  .walletOverview {
    min-height: 100px;

    .walletList {
      margin: 0;

      .walletRow {
        display: grid;
        grid-template-columns: 54px repeat(3, minmax(0, 1fr));
        align-items: start;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        dt { font-size: 14px; font-weight: 600; line-height: 1.6; }
        dd {
          display: grid;
          gap: 6px;
          min-width: 0;
          margin: 0;

          span { color: var(--el-text-color-regular); font-size: 13px; }
          strong { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        }
      }
    }
  }
  .creditSection {
    h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; }
    .creditForm {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr);
      gap: 0 16px;

      .noteField { grid-column: 1 / -1; }
      .el-select { width: 100%; }
      :deep(.el-form-item) { margin-bottom: 20px; }
      :deep(.el-input__wrapper), :deep(.el-select__wrapper) { min-height: 44px; }
      :deep(.el-form-item__error) { position: static; padding-top: 6px; line-height: 1.5; overflow-wrap: anywhere; }
    }
  }
  .transactionsSection {
    min-width: 0;

    h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; }
    .moneyText { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .releaseButton { min-height: 44px; margin: 0; }
    .el-alert { margin-top: 16px; }
  }
  @media (max-width: 600px) {
    .walletOverview .walletList .walletRow {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      dt { grid-column: 1 / -1; }
    }
    .creditSection .creditForm { grid-template-columns: minmax(0, 1fr); }
  }
}
</style>
