<template>
  <div class="userManagementPanel">
    <el-space wrap>
      <el-button type="primary" @click="openUser('create')">创建用户</el-button>
      <el-button :loading="loading" @click="loadUsers">刷新</el-button>
    </el-space>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon />
    <el-table :data="users" maxHeight="480">
      <el-table-column prop="username" label="用户名" minWidth="150" showOverflowTooltip />
      <el-table-column label="状态" width="85"><template #default="{ row }">{{ row.enabled ? '已启用' : '已禁用' }}</template></el-table-column>
      <el-table-column label="余额" minWidth="130"><template #default="{ row }">{{ formatMoney(row.wallet.balance) }}</template></el-table-column>
      <el-table-column label="倍率" minWidth="120"><template #default="{ row }">{{ row.wallet.effectiveMultiplier }}×{{ row.wallet.multiplier === null ? '（默认）' : '' }}</template></el-table-column>
      <el-table-column label="存储空间" minWidth="170"><template #default="{ row }">{{ formatBytes(adminUsage.find(item => item.userId === row.id)?.storage.usedBytes ?? 0) }} / {{ formatBytes(row.storageLimitBytes) }}</template></el-table-column>
      <el-table-column label="操作" minWidth="290" fixed="right"><template #default="{ row }">
        <el-button link @click="openUser('update', row as ManagedUser)">编辑</el-button>
        <el-button link @click="openWallet(row as ManagedUser)">余额与倍率</el-button>
        <el-button link @click="showLedger(row as ManagedUser)">流水</el-button>
        <el-button link @click="openUser('reset', row as ManagedUser)">重置密码</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="userVisible" :title="userAction === 'create' ? '创建用户' : userAction === 'reset' ? '重置密码' : '编辑用户'" width="min(480px, 92vw)" appendToBody :closeOnClickModal="false" :closeOnPressEscape="!busy" :showClose="!busy" @closed="clearPasswords">
      <el-form labelPosition="top" @submit.prevent="saveUser">
        <el-form-item label="用户名"><el-input v-model="userName" :disabled="busy || userAction !== 'create'" autocomplete="off" /></el-form-item>
        <el-form-item v-if="userAction !== 'reset'" label="存储上限（MiB）"><el-input-number v-model="storageMiB" :min="1" :max="1048576" :precision="0" :disabled="busy" /></el-form-item>
        <el-form-item v-if="userAction === 'update'" label="启用账户"><el-switch v-model="userEnabled" :disabled="busy" /></el-form-item>
        <el-form-item v-if="userAction !== 'update'" label="临时密码"><el-input v-model="temporaryPassword" type="password" autocomplete="new-password" :minlength="15" :maxlength="128" showPassword :disabled="busy" /><el-text size="small">密码长度为 15 至 128 个字符</el-text></el-form-item>
        <el-form-item label="管理员当前密码"><el-input v-model="currentPassword" type="password" autocomplete="current-password" showPassword :disabled="busy" /></el-form-item>
        <el-alert v-if="dialogError" :title="dialogError" type="error" :closable="false" />
        <el-button type="primary" nativeType="submit" :loading="busy" :disabled="!currentPassword || !userName || (userAction !== 'update' && !temporaryPassword)">保存</el-button>
      </el-form>
    </el-dialog>
    <el-dialog v-model="walletVisible" :title="`余额与倍率：${walletUser?.username ?? ''}`" width="min(500px, 92vw)" appendToBody :closeOnClickModal="false" :closeOnPressEscape="!busy" :showClose="!busy" @closed="clearPasswords">
      <el-form labelPosition="top" novalidate @submit.prevent="saveWallet">
        <el-form-item label="当前余额"><strong>{{ formatMoney(walletUser?.wallet.balance) }}</strong></el-form-item>
        <el-form-item label="调整金额（元，正数增加、负数减少）"><el-input-number v-model="adjustment" :min="-1000000000" :max="1000000000" :precision="6" :disabled="busy" /></el-form-item>
        <el-form-item label="使用系统默认倍率"><el-switch v-model="useDefaultMultiplier" :disabled="busy" /></el-form-item>
        <el-form-item v-if="!useDefaultMultiplier" label="个人倍率"><el-input-number v-model="multiplier" :min="0" :max="1000" :precision="4" :step="0.1" :disabled="busy" /></el-form-item>
        <el-form-item label="调整备注"><el-input v-model="adjustmentNote" :maxlength="300" :disabled="busy" /></el-form-item>
        <el-form-item label="管理员当前密码"><el-input v-model="currentPassword" type="password" showPassword autocomplete="current-password" :disabled="busy" /></el-form-item>
        <el-alert v-if="dialogError" :title="dialogError" type="error" :closable="false" />
        <el-button type="primary" nativeType="submit" :loading="busy" :disabled="!currentPassword || !adjustmentNote.trim()">保存调整</el-button>
      </el-form>
    </el-dialog>
    <el-dialog v-model="ledgerVisible" :title="`余额流水：${ledgerUserName}`" width="min(900px, 94vw)" appendToBody destroyOnClose>
      <el-table :data="ledger" maxHeight="500">
        <el-table-column label="时间" minWidth="170"><template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template></el-table-column>
        <el-table-column label="变动金额" minWidth="130"><template #default="{ row }">{{ row.amount > 0 ? '+' : '' }}{{ formatMoney(row.amount) }}</template></el-table-column>
        <el-table-column label="变动后余额" minWidth="130"><template #default="{ row }">{{ formatMoney(row.balance) }}</template></el-table-column>
        <el-table-column prop="note" label="备注" minWidth="220" />
      </el-table>
      <el-text size="small" type="info">显示最近 200 笔流水。</el-text>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { accountRequest, type AccountUser } from "@/lib/account";
import { formatMoney, type Wallet, type LedgerEntry } from "@/lib/billing";

type ManagedUser = AccountUser & { wallet: Wallet };
const users = ref<ManagedUser[]>([]);
const adminUsage = ref<{ userId: string; storage: { usedBytes: number } }[]>([]);
const loading = ref(false);
const busy = ref(false);
const errorMessage = ref("");
const dialogError = ref("");
const userVisible = ref(false);
const walletVisible = ref(false);
const currentPassword = ref("");
const temporaryPassword = ref("");
const userAction = ref<"create" | "update" | "reset">("create");
const userId = ref("");
const userName = ref("");
const storageMiB = ref<number>(1024);
const userEnabled = ref(true);
const walletUser = ref<ManagedUser>();
const adjustment = ref(0);
const adjustmentNote = ref("");
const useDefaultMultiplier = ref(true);
const multiplier = ref(1);
const adjustmentId = ref("");
const ledgerVisible = ref(false);
const ledgerUserName = ref("");
const ledger = ref<LedgerEntry[]>([]);

function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MiB`; }
function clearPasswords() { currentPassword.value = ""; temporaryPassword.value = ""; dialogError.value = ""; }
async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";
  try {
    [users.value, adminUsage.value] = await Promise.all([accountRequest<ManagedUser[]>("admin/users/list"), accountRequest<typeof adminUsage.value>("admin/usage/list")]);
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "读取用户信息失败"; }
  finally { loading.value = false; }
}
function openUser(action: typeof userAction.value, user?: AccountUser) {
  clearPasswords();
  userAction.value = action;
  userId.value = user?.id ?? "";
  userName.value = user?.username ?? "";
  storageMiB.value = (user?.storageLimitBytes ?? 1024 ** 3) / 1024 / 1024;
  userEnabled.value = user?.enabled ?? true;
  userVisible.value = true;
}
async function saveUser() {
  if (busy.value) return;
  busy.value = true;
  dialogError.value = "";
  try {
    if (userAction.value === "create") await accountRequest("admin/users/create", { username: userName.value.trim(), temporaryPassword: temporaryPassword.value, storageLimitBytes: storageMiB.value * 1024 * 1024, currentPassword: currentPassword.value });
    else if (userAction.value === "reset") await accountRequest("admin/users/resetPassword", { id: userId.value, temporaryPassword: temporaryPassword.value, currentPassword: currentPassword.value });
    else await accountRequest("admin/users/update", { id: userId.value, enabled: userEnabled.value, storageLimitBytes: storageMiB.value * 1024 * 1024, currentPassword: currentPassword.value }, "PUT");
    userVisible.value = false;
    clearPasswords();
    await loadUsers();
  } catch (error) { dialogError.value = error instanceof Error ? error.message : "保存用户失败"; }
  finally { busy.value = false; }
}
function openWallet(user: ManagedUser) {
  clearPasswords();
  walletUser.value = user;
  adjustment.value = 0;
  adjustmentNote.value = "";
  adjustmentId.value = crypto.randomUUID();
  useDefaultMultiplier.value = user.wallet.multiplier === null;
  multiplier.value = user.wallet.effectiveMultiplier;
  walletVisible.value = true;
}
async function saveWallet() {
  if (busy.value || !walletUser.value) return;
  busy.value = true;
  dialogError.value = "";
  try {
    await accountRequest("admin/billing/adjust", { userId: walletUser.value.id, operationId: adjustmentId.value,
      amount: adjustment.value, multiplier: useDefaultMultiplier.value ? null : multiplier.value,
      note: adjustmentNote.value.trim(), currentPassword: currentPassword.value });
    walletVisible.value = false;
    clearPasswords();
    await loadUsers();
  } catch (error) { dialogError.value = error instanceof Error ? error.message : "调整余额失败"; }
  finally { busy.value = false; }
}
async function showLedger(user: ManagedUser) {
  errorMessage.value = "";
  try {
    ledger.value = await accountRequest<LedgerEntry[]>(`admin/billing/ledger?userId=${encodeURIComponent(user.id)}`);
    ledgerUserName.value = user.username;
    ledgerVisible.value = true;
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "读取余额流水失败"; }
}
onMounted(loadUsers);
</script>

<style scoped lang="scss">
.userManagementPanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
