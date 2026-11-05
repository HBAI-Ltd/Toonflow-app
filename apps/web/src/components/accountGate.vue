<template>
  <main class="accountGate">
    <el-card class="loginCard">
      <h1>Toonflow</h1>
      <template v-if="!accountInitialized"><el-alert title="账户服务尚未初始化，请联系管理员" type="warning" :closable="false" /><el-button @click="reload">刷新</el-button></template>
      <el-form v-else labelPosition="top" @submit.prevent="submit">
        <h2>{{ accountUser?.mustChangePassword ? '首次登录，请修改密码' : '登录' }}</h2>
        <el-form-item v-if="!accountUser" label="用户名"><el-input v-model="username" autocomplete="username" :disabled="busy" /></el-form-item>
        <el-form-item :label="accountUser ? '当前密码' : '密码'"><el-input v-model="password" type="password" autocomplete="current-password" showPassword :disabled="busy" /></el-form-item>
        <template v-if="accountUser">
          <el-form-item label="新密码"><el-input v-model="newPassword" type="password" autocomplete="new-password" :minlength="15" :maxlength="128" showPassword :disabled="busy" /><el-text size="small">密码长度为 15 至 128 个字符</el-text></el-form-item>
          <el-form-item label="确认新密码"><el-input v-model="confirmPassword" type="password" autocomplete="new-password" :disabled="busy" /></el-form-item>
        </template>
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
        <el-button type="primary" nativeType="submit" :loading="busy" :disabled="!password || (!accountUser && !username) || (!!accountUser && !newPassword)">{{ accountUser ? '修改密码' : '登录' }}</el-button>
        <el-button v-if="accountUser" :disabled="busy" @click="logout">退出登录</el-button>
      </el-form>
    </el-card>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { accountInitialized, accountUser, loginAccount, changeAccountPassword, logoutAccount } from "@/lib/account";
const emit = defineEmits<{ ready: [] }>();
const username = ref("");
const password = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const busy = ref(false);
const errorMessage = ref("");
function reload() { window.location.reload(); }
async function logout() {
  try { await logoutAccount(); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : "退出登录失败"; }
}
async function submit() {
  if (busy.value) return;
  errorMessage.value = "";
  if (accountUser.value && newPassword.value !== confirmPassword.value) { errorMessage.value = "两次输入的密码不一致"; return; }
  busy.value = true;
  try {
    if (accountUser.value) await changeAccountPassword(password.value, newPassword.value);
    else await loginAccount(username.value, password.value);
    password.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    if (!accountUser.value?.mustChangePassword) emit("ready");
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "登录失败"; }
  finally { busy.value = false; }
}
</script>

<style scoped lang="scss">
.accountGate {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 20px;
  box-sizing: border-box;
  .loginCard { width: min(400px, 100%); h1 { margin-top: 0; } .el-alert { margin-bottom: 16px; } }
}
</style>
