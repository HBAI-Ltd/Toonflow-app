<template>
  <div class="multiTenant">
    <el-skeleton v-if="loading" :rows="3" animated />
    <div v-else-if="status?.configured" class="configuredSettings">
      <div class="enabledRow">
        <div class="settingInfo">
          <label for="configuredMultiTenantEnabled">开启多租户</label>
          <el-tag :type="status.enabled ? 'primary' : 'info'" size="small" effect="light">{{ status.enabled ? translate("已开启") : translate("未开启") }}</el-tag>
        </div>
        <el-switch id="configuredMultiTenantEnabled" :modelValue="status.enabled" :loading="saving" :disabled="saving || credentialsVisible" aria-label="开启多租户" @change="changeEnabled" />
      </div>
      <div class="formActions">
        <el-button type="primary" :disabled="saving || credentialsVisible" @click="openAdmin">进入超管后台</el-button>
      </div>
    </div>
    <el-form v-else-if="status?.canSetup" class="setupForm" labelPosition="top" :disabled="saving" @submit.prevent="save">
      <fieldset class="credentialsGroup">
        <legend>超级管理员</legend>
        <el-form-item class="accountField" label="超级管理员账号" for="setupAdminUserName" :error="userNameError" required>
          <el-input id="setupAdminUserName" ref="userNameInput" v-model="userName" autocomplete="username" :maxlength="64" />
        </el-form-item>
        <el-form-item label="超级管理员密码" for="setupAdminPassword" :error="passwordError" required>
          <el-input id="setupAdminPassword" ref="passwordInput" v-model="password" type="password" showPassword autocomplete="new-password" :minlength="8" :maxlength="128" />
        </el-form-item>
        <el-form-item label="确认密码" for="setupAdminPasswordConfirm" :error="confirmationError" required>
          <el-input id="setupAdminPasswordConfirm" ref="confirmationInput" v-model="passwordConfirm" type="password" showPassword autocomplete="new-password" :minlength="8" :maxlength="128" />
        </el-form-item>
      </fieldset>
      <div class="enabledRow">
        <label for="setupMultiTenantEnabled">开启多租户</label>
        <el-switch id="setupMultiTenantEnabled" v-model="enabled" aria-label="开启多租户" />
      </div>
      <div class="formActions">
        <el-button type="primary" nativeType="submit" :loading="saving" :disabled="saving">保存</el-button>
      </div>
    </el-form>
    <el-alert v-else-if="status" title="请在服务端本机设置超级管理员账号和密码" type="error" :closable="false" showIcon />
    <el-alert v-if="requestError" :title="requestError" type="error" :closable="false" showIcon />
    <el-button v-if="!loading && !status" class="retryButton" @click="loadStatus">重新读取</el-button>
    <el-dialog v-model="credentialsVisible" class="credentialsDialog" title="验证超级管理员" width="min(420px, calc(100vw - 32px))" alignCenter appendToBody :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="clearCredentials">
      <el-form id="multiTenantCredentialsForm" class="credentialsForm" labelPosition="top" :disabled="saving" @submit.prevent="confirmEnabled">
        <el-form-item label="超级管理员账号" for="verifyAdminUserName" :error="userNameError" required>
          <el-input id="verifyAdminUserName" ref="userNameInput" v-model="userName" autocomplete="username" :maxlength="64" />
        </el-form-item>
        <el-form-item label="超级管理员密码" for="verifyAdminPassword" :error="passwordError" required>
          <el-input id="verifyAdminPassword" ref="passwordInput" v-model="password" type="password" showPassword autocomplete="current-password" :minlength="8" :maxlength="128" />
        </el-form-item>
        <el-alert v-if="credentialsError" :title="credentialsError" type="error" :closable="false" showIcon />
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="credentialsVisible = false">取消</el-button>
        <el-button type="primary" nativeType="submit" form="multiTenantCredentialsForm" :loading="saving" :disabled="saving">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { InputInstance } from "element-plus";
import http from "@/lib/http";
import { actualPlatform } from "@/lib/platform";
import { applyMultiTenantEnabled } from "@/stores/settings";

const router = useRouter();
const hostWindow = window as Window & { __electrobunSendToHost?: (message: { type: "openExternal"; url: string }) => void };
const status = ref<{ configured: boolean; enabled: boolean; canSetup: boolean } | null>(null);
const loading = ref(true);
const saving = ref(false);
const userName = ref("");
const password = ref("");
const passwordConfirm = ref("");
const enabled = ref(false);
const userNameError = ref("");
const passwordError = ref("");
const confirmationError = ref("");
const requestError = ref("");
const credentialsVisible = ref(false);
const credentialsError = ref("");
const pendingEnabled = ref<boolean | null>(null);
const userNameInput = ref<InputInstance>();
const passwordInput = ref<InputInstance>();
const confirmationInput = ref<InputInstance>();
const controller = new AbortController();
let readingStatus = false;

watch([userName, password, passwordConfirm], () => {
  userNameError.value = "";
  passwordError.value = "";
  confirmationError.value = "";
  requestError.value = "";
  credentialsError.value = "";
});

function openAdmin() {
  const url = new URL(router.resolve("/multiTenant").href, window.location.origin);
  if (actualPlatform.isDesktop && hostWindow.__electrobunSendToHost) {
    hostWindow.__electrobunSendToHost({ type: "openExternal", url: url.href });
    return;
  }
  window.open(url.href, "_blank", "noopener,noreferrer,popup,width=1100,height=800");
}

async function loadStatus() {
  if (readingStatus || saving.value || credentialsVisible.value) return;
  readingStatus = true;
  const previous = status.value;
  if (!previous) loading.value = true;
  requestError.value = "";
  try {
    const loaded = await http<NonNullable<typeof status.value>>({ method: "GET", url: "/api/multiTenant/status", signal: controller.signal });
    if (status.value !== previous || saving.value || credentialsVisible.value || controller.signal.aborted) return;
    status.value = loaded;
    enabled.value = status.value.enabled;
    applyMultiTenantEnabled(status.value.enabled);
  } catch (cause) {
    if (!controller.signal.aborted) requestError.value = cause instanceof Error ? cause.message : translate("读取多租户状态失败");
  } finally { readingStatus = false; loading.value = false; }
}

function validateCredentials() {
  const name = userName.value.trim();
  if (!name || name.length > 64) {
    userNameError.value = translate("账号长度应为 1 到 64 个字符");
    userNameInput.value?.focus();
    return false;
  }
  if (/[\s\u0000-\u001f\u007f]/.test(name)) {
    userNameError.value = translate("账号不能包含空白或控制字符");
    userNameInput.value?.focus();
    return false;
  }
  if (password.value.length < 8 || password.value.length > 128) {
    passwordError.value = translate("密码长度应为 8 到 128 个字符");
    passwordInput.value?.focus();
    return false;
  }
  return true;
}

async function save() {
  if (saving.value || !status.value?.canSetup || status.value.configured || !validateCredentials()) return;
  if (password.value !== passwordConfirm.value) {
    confirmationError.value = translate("两次输入的密码不一致");
    confirmationInput.value?.focus();
    return;
  }
  saving.value = true;
  requestError.value = "";
  try {
    const saved = await http<{ configured: boolean; enabled: boolean }>({
      method: "POST", url: "/api/multiTenant/setup", data: { userName: userName.value.trim(), password: password.value, enabled: enabled.value }, signal: controller.signal,
    });
    status.value = { ...saved, canSetup: false };
    applyMultiTenantEnabled(saved.enabled);
    password.value = "";
    passwordConfirm.value = "";
  } catch (cause) {
    if (!controller.signal.aborted) requestError.value = cause instanceof Error ? cause.message : translate("保存多租户设置失败");
  } finally { saving.value = false; }
}

function changeEnabled(value: boolean | string | number) {
  if (saving.value || credentialsVisible.value || !status.value?.configured || typeof value !== "boolean" || value === status.value.enabled) return;
  pendingEnabled.value = value;
  credentialsError.value = "";
  requestError.value = "";
  credentialsVisible.value = true;
}

async function confirmEnabled() {
  if (saving.value || !status.value?.configured || pendingEnabled.value === null || !validateCredentials()) return;
  const value = pendingEnabled.value;
  saving.value = true;
  credentialsError.value = "";
  try {
    const { token } = await http<{ token: string }>({
      method: "POST", url: "/api/multiTenant/login", data: { userName: userName.value.trim(), password: password.value }, signal: controller.signal,
    });
    const saved = await http<{ enabled: boolean }>({
      method: "PUT", url: "/api/multiTenant/enabled", data: { enabled: value },
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    });
    status.value = { ...status.value, enabled: saved.enabled };
    applyMultiTenantEnabled(saved.enabled);
    credentialsVisible.value = false;
    password.value = "";
  } catch (cause) {
    if (!controller.signal.aborted) credentialsError.value = cause instanceof Error ? cause.message : translate("保存多租户设置失败");
  } finally { saving.value = false; }
}

function clearCredentials() {
  userName.value = "";
  password.value = "";
  userNameError.value = "";
  passwordError.value = "";
  credentialsError.value = "";
  pendingEnabled.value = null;
}

onMounted(() => {
  window.addEventListener("focus", loadStatus);
  void loadStatus();
});
onBeforeUnmount(() => {
  window.removeEventListener("focus", loadStatus);
  controller.abort();
  clearCredentials();
  passwordConfirm.value = "";
});
</script>

<style lang="scss" scoped>
.multiTenant {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);

  .configuredSettings,
  .setupForm {
    width: 100%;
    min-width: 0;

    .enabledRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      min-height: 76px;
      padding: 20px 0;
      box-sizing: border-box;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .settingInfo {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        min-width: 0;
      }

      label {
        min-width: 0;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .el-switch { flex-shrink: 0; }
    }

    .formActions {
      display: flex;
      padding-top: 24px;

      .el-button {
        min-width: 140px;
        min-height: 44px;
        margin: 0;
        font-weight: 500;
      }
    }
  }

  .setupForm {
    --el-component-size: 44px;

    .credentialsGroup {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 20px;
      min-width: 0;
      padding: 0;
      margin: 0;
      border: 0;

      legend {
        padding: 0;
        margin-bottom: 20px;
        color: var(--el-text-color-primary);
        font-size: 15px;
        font-weight: 600;
        line-height: 1.6;
      }

      .accountField { grid-column: 1 / -1; }

      :deep(.el-form-item) {
        min-width: 0;
        margin-bottom: 24px;
      }

      :deep(.el-form-item__label) {
        height: auto;
        margin-bottom: 8px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
      }

      :deep(.el-form-item__error) {
        position: static;
        width: 100%;
        padding-top: 6px;
        line-height: 1.5;
      }
    }

    .enabledRow { border-top: 1px solid var(--el-border-color-lighter); }
  }

  .retryButton { margin-left: 0; }

  @media (max-width: 680px) {
    .setupForm .credentialsGroup { grid-template-columns: minmax(0, 1fr); }

    .configuredSettings,
    .setupForm {
      .enabledRow { gap: 16px; }
      .formActions .el-button { width: 100%; }
    }
  }
}

.credentialsDialog {
  --el-component-size: 44px;

  .credentialsForm {
    padding-top: 8px;

    :deep(.el-form-item) { margin-bottom: 24px; }
    :deep(.el-form-item__label) { height: auto; line-height: 1.6; }
    :deep(.el-form-item__error) { position: static; width: 100%; padding-top: 6px; line-height: 1.5; }
  }
}
</style>
