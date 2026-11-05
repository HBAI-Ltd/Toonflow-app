<template>
  <div class="accountPanel">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="用户名">{{ accountUser?.username }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ accountUser?.role === 'admin' ? '管理员' : '成员' }}</el-descriptions-item>
      <el-descriptions-item label="存储空间">{{ formatBytes(usage?.storage.usedBytes ?? 0) }} / {{ formatBytes(usage?.storage.limitBytes ?? 0) }}</el-descriptions-item>
    </el-descriptions>
    <el-space wrap>
      <el-button :loading="loading" @click="loadAccount">刷新</el-button>
      <el-button @click="passwordVisible = true">修改密码</el-button>
      <el-button type="danger" :loading="loggingOut" @click="logout">退出登录</el-button>
    </el-space>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
    <h3>{{ accountUser?.role === 'admin' ? '任务与用量' : '我的任务与用量' }}</h3>
    <el-select v-if="accountUser?.role === 'admin'" v-model="taskUserId" aria-label="查看用户用量">
      <el-option label="我的任务" value="" />
      <el-option v-for="user in users.filter(user => user.id !== accountUser?.id)" :key="user.id" :label="user.username" :value="user.id" />
    </el-select>
    <el-table :data="visibleTasks" maxHeight="300">
      <el-table-column prop="kind" label="类型" />
      <el-table-column prop="model" label="模型" />
      <el-table-column label="调用时间" minWidth="160"><template #default="{ row }">{{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' }}</template></el-table-column>
      <el-table-column label="供应商用量" minWidth="160"><template #default="{ row }">{{ usageText(row.usage) }}</template></el-table-column>
      <el-table-column label="状态"><template #default="{ row }">{{ taskStatus(row.status) }}</template></el-table-column>
      <el-table-column label="上游状态" minWidth="230"><template #default="{ row }">{{ upstreamStatus(row.upstreamJob) }}</template></el-table-column>
      <el-table-column label="操作"><template #default="{ row }"><el-button v-if="(!taskUserId || taskUserId === accountUser?.id) && ['queued', 'running'].includes(row.status)" link type="danger" :disabled="busy" @click="cancelTask(row.id)">取消任务</el-button></template></el-table-column>
    </el-table>
    <h3>临时生成结果</h3>
    <el-text type="info">临时结果将在 24 小时后清理，远程链接可能更早失效。请及时下载或保存到项目。</el-text>
    <el-table :data="mediaResults" maxHeight="300">
      <el-table-column prop="mediaType" label="类型" />
      <el-table-column prop="path" label="文件" minWidth="160" />
      <el-table-column label="操作" minWidth="220"><template #default="{ row }">
        <el-button link @click="previewMedia = row as MediaResult">预览</el-button>
        <el-button link :disabled="busy" @click="downloadMedia(row as MediaResult)">下载</el-button>
        <el-button link :disabled="busy || !!row.savedPath" @click="saveMedia(row as MediaResult)">{{ row.savedPath ? '已保存' : '保存到项目' }}</el-button>
      </template></el-table-column>
    </el-table>
    <template v-if="accountUser?.role === 'admin'">
      <div class="usersHeader"><h3>用户管理</h3><el-button type="primary" @click="openUser('create')">创建用户</el-button></div>
      <el-table :data="users" maxHeight="380">
        <el-table-column prop="username" label="用户名" minWidth="130" />
        <el-table-column label="状态"><template #default="{ row }">{{ row.enabled ? '已启用' : '已禁用' }}</template></el-table-column>
        <el-table-column label="存储空间" minWidth="170"><template #default="{ row }">{{ formatBytes(adminUsage.find(item => item.userId === row.id)?.storage.usedBytes ?? 0) }} / {{ formatBytes(row.storageLimitBytes) }}</template></el-table-column>
        <el-table-column label="操作" minWidth="190"><template #default="{ row }"><el-button link @click="openUser('update', row as AccountUser)">编辑</el-button><el-button link @click="openUser('reset', row as AccountUser)">重置密码</el-button></template></el-table-column>
      </el-table>
    </template>
    <el-dialog :modelValue="!!previewMedia" title="预览生成结果" width="min(800px, 92vw)" appendToBody destroyOnClose @update:modelValue="value => { if (!value) previewMedia = undefined; }">
      <template v-if="previewMedia">
        <el-image v-if="previewMedia.mimeType.startsWith('image/')" class="mediaImage" :src="previewUrl" fit="contain" alt="生成结果" />
        <videoPlayer v-else-if="previewMedia.mimeType.startsWith('video/')" class="mediaVideo" :src="previewUrl" @error="errorMessage = translate('预览失败，结果可能已过期')" />
        <audio v-else-if="previewMedia.mimeType.startsWith('audio/')" :src="previewUrl" controls preload="metadata" />
      </template>
    </el-dialog>
    <el-dialog v-model="passwordVisible" title="修改密码" width="min(440px, 92vw)" appendToBody :closeOnClickModal="false" @closed="clearPasswords">
      <el-form labelPosition="top" @submit.prevent="changePassword">
        <el-form-item label="当前密码"><el-input v-model="currentPassword" type="password" autocomplete="current-password" showPassword :disabled="busy" /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="newPassword" type="password" autocomplete="new-password" :minlength="15" :maxlength="128" showPassword :disabled="busy" /><el-text size="small">密码长度为 15 至 128 个字符</el-text></el-form-item>
        <el-form-item label="确认新密码"><el-input v-model="confirmPassword" type="password" autocomplete="new-password" :disabled="busy" /></el-form-item>
        <el-alert v-if="dialogError" :title="dialogError" type="error" :closable="false" />
        <el-button type="primary" nativeType="submit" :loading="busy" :disabled="!currentPassword || !newPassword">保存</el-button>
      </el-form>
    </el-dialog>
    <el-dialog v-model="userVisible" :title="userAction === 'create' ? '创建用户' : userAction === 'reset' ? '重置密码' : '编辑用户'" width="min(480px, 92vw)" appendToBody :closeOnClickModal="false" @closed="clearPasswords">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { accountUser, accountRequest, logoutAccount, changeAccountPassword, expireAccount, type AccountUser } from "@/lib/account";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import saveFile from "@/lib/saveFile";
import videoPlayer from "@/components/videoPlayer.vue";
type UpstreamJob = { provider: string; id?: string; status?: string; checkedAt?: number; reconciliation?: string };
type AccountUsage = { userId?: string; username?: string; storage: { usedBytes: number; limitBytes: number }; tasks: { id: string; kind: string; model?: string; status: string; createdAt?: number; usage?: Record<string, number> | null; upstreamJob?: UpstreamJob[] | null }[] };
type MediaResult = { id: string; directory: string; path: string; mimeType: string; mediaType: string; createdAt: number; savedPath?: string };
const mediaResults = ref<MediaResult[]>([]);
const previewMedia = ref<MediaResult>();
const previewUrl = computed(() => previewMedia.value ? useWorkspaceFiles(previewMedia.value.directory).readUrl(previewMedia.value.path) : "");
const usage = ref<AccountUsage>();
const users = ref<AccountUser[]>([]);
const adminUsage = ref<AccountUsage[]>([]);
const taskUserId = ref("");
const visibleTasks = computed(() => taskUserId.value && accountUser.value?.role === "admin"
  ? adminUsage.value.find(item => item.userId === taskUserId.value)?.tasks ?? [] : usage.value?.tasks ?? []);

function usageText(values?: Record<string, number> | null) {
  if (!values) return "—";
  const labels: Record<string, string> = { input: "输入", output: "输出", totalTokens: "总 token", cacheRead: "缓存读取", cacheWrite: "缓存写入", reasoning: "推理", image_count: "图片数", seconds: "秒" };
  return Object.entries(values).filter(([, value]) => Number.isFinite(value)).map(([key, value]) => `${translate(labels[key] ?? key)}: ${value}`).join(" · ") || "—";
}
const loading = ref(false);
const busy = ref(false);
const loggingOut = ref(false);
const errorMessage = ref("");
const dialogError = ref("");
const passwordVisible = ref(false);
const userVisible = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const temporaryPassword = ref("");
const userAction = ref<"create" | "update" | "reset">("create");
const userId = ref("");
const userName = ref("");
const storageMiB = ref<number>(1024);
const userEnabled = ref(true);
function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MiB`; }
function taskStatus(status: string) {
  const labels: Record<string, string> = { queued: "排队中", running: "运行中", completed: "已完成", succeeded: "已完成", failed: "失败", cancelled: "已取消", canceled: "已取消", interrupted: "上次中断" };
  return translate(labels[status] ?? status);
}
function upstreamStatus(jobs?: UpstreamJob[] | null) {
  if (!jobs?.length) return translate("未知");
  const statusLabels: Record<string, string> = {
    queued: "排队中", pending: "等待中", waiting: "等待中", submitted: "已提交", created: "已创建", not_started: "尚未开始",
    running: "运行中", processing: "处理中", inprogress: "处理中", starting: "启动中", rendering: "渲染中", moderating: "审核中",
    success: "已完成", succeeded: "已完成", completed: "已完成", finished: "已完成", failed: "失败", failure: "失败", error: "失败",
    rejected: "已拒绝", blocked: "已拦截", cancelled: "已取消", canceled: "已取消", unknown: "未知",
  };
  const reconciliationLabels: Record<string, string> = {
    checked: "已核对", noStatusCapability: "不支持状态查询", missingMediaType: "缺少类型", missingProtocol: "缺少类型",
    queryFailed: "查询失败", timeout: "查询超时", unknownStatus: "未知", accountDisabled: "账户已禁用", invalidTaskMetadata: "任务信息不完整",
  };
  return jobs.map(job => {
    const provider = /^[a-z][a-zA-Z0-9]{0,95}$/.test(job.provider) ? job.provider : translate("未知供应商");
    return `${provider} · ${translate(statusLabels[job.status ?? ""] ?? "未知")} · ${translate(reconciliationLabels[job.reconciliation ?? ""] ?? "未知")}`;
  }).join("；");
}
function clearPasswords() { currentPassword.value = ""; newPassword.value = ""; confirmPassword.value = ""; temporaryPassword.value = ""; dialogError.value = ""; }
async function loadAccount() {
  loading.value = true;
  errorMessage.value = "";
  try {
    usage.value = await accountRequest<AccountUsage>("account/usage");
    mediaResults.value = await accountRequest<MediaResult[]>("account/media/list");
    if (accountUser.value?.role === "admin") {
      [users.value, adminUsage.value] = await Promise.all([accountRequest<AccountUser[]>("admin/users/list"), accountRequest<AccountUsage[]>("admin/usage/list")]);
    }
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "读取账户信息失败"; }
  finally { loading.value = false; }
}
async function cancelTask(id: string) {
  busy.value = true;
  try { await accountRequest("account/tasks/cancel", { id }); await loadAccount(); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : "取消任务失败"; }
  finally { busy.value = false; }
}
async function downloadMedia(media: MediaResult) {
  busy.value = true;
  try {
    await saveFile(async () => new Blob([await useWorkspaceFiles(media.directory).read(media.path)], { type: media.mimeType }), media.path.split("/").at(-1) || "download");
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "下载失败，结果可能已过期"; }
  finally { busy.value = false; }
}
async function saveMedia(media: MediaResult) {
  busy.value = true;
  try {
    const result = await accountRequest<{ path: string }>("account/media/save", { id: media.id });
    media.savedPath = result.path;
    await loadAccount();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败，结果可能已过期"; }
  finally { busy.value = false; }
}
async function logout() {
  loggingOut.value = true;
  try { await logoutAccount(); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : "退出登录失败"; loggingOut.value = false; }
}
async function changePassword() {
  if (busy.value) return;
  dialogError.value = "";
  if (newPassword.value !== confirmPassword.value) { dialogError.value = "两次输入的密码不一致"; return; }
  busy.value = true;
  try { await changeAccountPassword(currentPassword.value, newPassword.value); clearPasswords(); expireAccount(); }
  catch (error) { dialogError.value = error instanceof Error ? error.message : "修改密码失败"; }
  finally { busy.value = false; }
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
    await loadAccount();
  } catch (error) { dialogError.value = error instanceof Error ? error.message : "保存用户失败"; }
  finally { busy.value = false; }
}
onMounted(loadAccount);
</script>

<style scoped lang="scss">
.accountPanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  h3 { margin: 0; }
  .usersHeader { display: flex; justify-content: space-between; align-items: center; }
  .el-alert { margin-bottom: 12px; }
  .mediaImage { display: block; width: 100%; max-height: 65vh; }
  .mediaVideo { height: min(56vw, 60vh); }
}
</style>
