<template>
  <div class="adminWeb" :class="{ authenticated, sidebarCollapsed }">
    <template v-if="loading || !authenticated">
      <header class="authHeader">
        <div class="brand">
          <img class="brandLogo" :src="logoUrl" alt="Toonflow" />
          <span class="brandName">Toonflow</span>
          <span class="brandContext">{{ translate("超管后台") }}</span>
        </div>
      </header>
      <main class="authMain">
        <div v-if="loading" class="loadingPanel" aria-busy="true">
          <el-skeleton :rows="4" animated />
        </div>
        <section v-else class="loginPanel" aria-labelledby="adminLoginTitle">
          <div class="panelHeading">
            <h1 id="adminLoginTitle">{{ translate("超管后台") }}</h1>
            <p>{{ translate("登录超级管理员账号，管理多租户服务。") }}</p>
          </div>
          <el-form class="loginForm" labelPosition="top" :hideRequiredAsterisk="true" :disabled="loggingIn" @submit.prevent="login">
            <el-form-item :label="translate('超级管理员账号')" for="adminLoginUserName" :error="userNameError" required>
              <el-input id="adminLoginUserName" ref="userNameInput" v-model="userName" autocomplete="username" :maxlength="64" />
            </el-form-item>
            <el-form-item :label="translate('超级管理员密码')" for="adminLoginPassword" :error="passwordError" required>
              <el-input id="adminLoginPassword" ref="passwordInput" v-model="password" type="password" showPassword autocomplete="current-password" :minlength="8" :maxlength="128" />
            </el-form-item>
            <el-alert v-if="requestError" class="formError" :title="requestError" type="error" :closable="false" showIcon />
            <el-button class="loginButton" type="primary" nativeType="submit" :loading="loggingIn" :disabled="loggingIn">{{ translate("登录") }}</el-button>
          </el-form>
        </section>
      </main>
    </template>
    <template v-else>
      <aside id="adminSidebar" class="sidebar" :aria-label="translate('超管后台')">
        <div class="sidebarHeader">
          <div class="sidebarBrand">
            <img class="sidebarLogo" :src="logoUrl" alt="Toonflow" />
            <span class="brandName">Toonflow</span>
          </div>
          <button class="sidebarToggle" type="button" :aria-label="sidebarCollapsed ? translate('展开侧栏') : translate('收起侧栏')" :title="sidebarCollapsed ? translate('展开侧栏') : translate('收起侧栏')" :aria-expanded="!sidebarCollapsed" aria-controls="adminSidebar" @click="sidebarCollapsed = !sidebarCollapsed">
            <icon-layout-sidebar-left-expand v-if="sidebarCollapsed" :size="18" aria-hidden="true" />
            <icon-layout-sidebar-left-collapse v-else :size="18" aria-hidden="true" />
          </button>
        </div>
        <nav class="sidebarNav" :aria-label="translate('后台导航')">
          <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantOverview' }" :to="{ name: 'multiTenantOverview' }" :title="translate('总览')" :aria-label="translate('总览')">
            <icon-layout-dashboard :size="20" aria-hidden="true" />
            <span class="sidebarText">{{ translate("总览") }}</span>
          </router-link>
          <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantUsers' }" :to="{ name: 'multiTenantUsers' }" :title="translate('用户管理')" :aria-label="translate('用户管理')">
            <icon-users-group :size="20" aria-hidden="true" />
            <span class="sidebarText">{{ translate("用户管理") }}</span>
          </router-link>
          <div class="navGroup">
            <p class="groupTitle">{{ translate("模型服务") }}</p>
            <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantProviders' }" :to="{ name: 'multiTenantProviders' }" :title="translate('供应商管理')" :aria-label="translate('供应商管理')">
              <icon-plug-connected :size="20" aria-hidden="true" />
              <span class="sidebarText">{{ translate("供应商管理") }}</span>
            </router-link>
            <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantModels' }" :to="{ name: 'multiTenantModels' }" :title="translate('模型路由')" :aria-label="translate('模型路由')">
              <icon-route :size="20" aria-hidden="true" />
              <span class="sidebarText">{{ translate("模型路由") }}</span>
            </router-link>
            <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantPrices' }" :to="{ name: 'multiTenantPrices' }" :title="translate('价格配置')" :aria-label="translate('价格配置')">
              <icon-coins :size="20" aria-hidden="true" />
              <span class="sidebarText">{{ translate("价格配置") }}</span>
            </router-link>
          </div>
          <div class="navGroup">
            <p class="groupTitle">{{ translate("平台设置") }}</p>
            <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantConfiguration' }" :to="{ name: 'multiTenantConfiguration' }" :title="translate('系统配置')" :aria-label="translate('系统配置')">
              <icon-settings :size="20" aria-hidden="true" />
              <span class="sidebarText">{{ translate("系统配置") }}</span>
            </router-link>
            <router-link class="sidebarItem" :class="{ active: route.name === 'multiTenantSourceMapping' }" :to="{ name: 'multiTenantSourceMapping' }" :title="translate('数据源映射')" :aria-label="translate('数据源映射')">
              <icon-adjustments :size="20" aria-hidden="true" />
              <span class="sidebarText">{{ translate("数据源映射") }}</span>
            </router-link>
          </div>
        </nav>
        <div class="sidebarFooter" :title="accountName || userName || translate('超级管理员')">
          <span class="accountIcon"><icon-user-shield :size="20" aria-hidden="true" /></span>
          <div class="accountInfo">
            <span v-if="accountName || userName" class="accountName">{{ accountName || userName }}</span>
            <span class="accountRole">{{ translate("超级管理员") }}</span>
          </div>
        </div>
      </aside>
      <div class="workspace">
        <header class="workspaceHeader">
          <div class="titleGroup">
            <span class="pageTitle">{{ pageTitle }}</span>
            <span class="statusBadge" :class="{ enabled }" role="status"><span class="statusDot" aria-hidden="true" />{{ enabled ? translate("已开启") : translate("未开启") }}</span>
          </div>
          <el-button class="creationButton" type="primary" :icon="IconExternalLink" :disabled="!enabled || saving" @click="emit('back')">{{ translate("打开创作 Web") }}</el-button>
        </header>
        <main class="pageContent">
          <div class="contentInner">
            <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
            <router-view v-slot="{ Component: currentComponent }">
              <component :is="currentComponent" v-bind="['multiTenantUsers', 'multiTenantSourceMapping', 'multiTenantProviders', 'multiTenantModels', 'multiTenantPrices'].includes(String(route.name)) ? { request, onSessionExpired: sessionExpired } : route.name === 'multiTenantConfiguration' ? { registrationEnabled, registrationSaving } : {}" :enabled="enabled" :saving="saving" :creationUrl="creationUrl" @changeEnabled="changeEnabled" @changeRegistration="changeRegistration" @openCreation="emit('back')" />
            </router-view>
          </div>
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { IconAdjustments, IconCoins, IconExternalLink, IconLayoutDashboard, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconPlugConnected, IconRoute, IconSettings, IconUsersGroup, IconUserShield } from "@tabler/icons-vue";
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElSkeleton, type InputInstance } from "element-plus";
import type { AdminRequest } from "./types";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/skeleton/style/css";

const props = defineProps<{
  logoUrl: string;
  accountName?: string;
  creationUrl: string;
  request: AdminRequest;
}>();
const emit = defineEmits<{ enabledChange: [enabled: boolean]; back: [] }>();
const route = useRoute();
const sidebarCollapsed = ref(false);
const pageTitle = computed(() => {
  if (route.name === "multiTenantUsers") return translate("用户管理");
  if (route.name === "multiTenantConfiguration") return translate("系统配置");
  if (route.name === "multiTenantSourceMapping") return translate("数据源映射");
  if (route.name === "multiTenantProviders") return translate("供应商管理");
  if (route.name === "multiTenantModels") return translate("模型路由");
  if (route.name === "multiTenantPrices") return translate("价格配置");
  return translate("总览");
});
const authenticated = ref(false);
const loading = ref(true);
const userName = ref("");
const password = ref("");
const enabled = ref(false);
const registrationEnabled = ref(true);
const loggingIn = ref(false);
const saving = ref(false);
const registrationSaving = ref(false);
const userNameError = ref("");
const passwordError = ref("");
const requestError = ref("");
const userNameInput = ref<InputInstance>();
const passwordInput = ref<InputInstance>();
const controller = new AbortController();

watch([userName, password], () => { userNameError.value = ""; passwordError.value = ""; requestError.value = ""; });

function sessionExpired() {
  authenticated.value = false;
  requestError.value = translate("账号登录已失效，请重新登录");
}

async function loadState() {
  try {
    const result = await props.request<{ enabled: boolean; registrationEnabled: boolean }>({ method: "GET", url: "/api/multiTenant/state", signal: controller.signal });
    authenticated.value = true;
    enabled.value = result.enabled;
    registrationEnabled.value = result.registrationEnabled;
    emit("enabledChange", result.enabled);
  } catch (cause) {
    if (!controller.signal.aborted) {
      const unauthorized = (cause as { status?: number } | null)?.status === 401;
      if (unauthorized) authenticated.value = false;
      if (!unauthorized || loggingIn.value) requestError.value = cause instanceof Error ? cause.message : translate("读取多租户状态失败");
    }
  } finally { loading.value = false; }
}

async function login() {
  if (loggingIn.value) return;
  const name = userName.value.trim();
  if (!name || name.length > 64) {
    userNameError.value = translate("账号长度应为 1 到 64 个字符");
    userNameInput.value?.focus();
    return;
  }
  if (/[\s\u0000-\u001f\u007f]/.test(name)) {
    userNameError.value = translate("账号不能包含空白或控制字符");
    userNameInput.value?.focus();
    return;
  }
  if (password.value.length < 8 || password.value.length > 128) {
    passwordError.value = translate("密码长度应为 8 到 128 个字符");
    passwordInput.value?.focus();
    return;
  }
  loggingIn.value = true;
  requestError.value = "";
  try {
    await props.request<{ enabled: boolean }>({
      method: "POST", url: "/api/multiTenant/login", data: { userName: name, password: password.value }, signal: controller.signal,
    });
    password.value = "";
    await loadState();
  } catch (cause) {
    if (!controller.signal.aborted) requestError.value = cause instanceof Error ? cause.message : translate("登录失败");
  } finally { loggingIn.value = false; }
}

async function changeEnabled(value: boolean | string | number) {
  if (saving.value || registrationSaving.value || !authenticated.value || typeof value !== "boolean") return;
  saving.value = true;
  requestError.value = "";
  try {
    const result = await props.request<{ enabled: boolean }>({
      method: "PUT", url: "/api/multiTenant/enabled", data: { enabled: value },
      signal: controller.signal,
    });
    enabled.value = result.enabled;
    emit("enabledChange", result.enabled);
  } catch (cause) {
    if (!controller.signal.aborted) {
      if ((cause as { status?: number } | null)?.status === 401) authenticated.value = false;
      requestError.value = cause instanceof Error ? cause.message : translate("保存多租户设置失败");
    }
  } finally { saving.value = false; }
}

async function changeRegistration(value: boolean | string | number) {
  if (saving.value || registrationSaving.value || !authenticated.value || typeof value !== "boolean") return;
  registrationSaving.value = true;
  requestError.value = "";
  try {
    const result = await props.request<{ registrationEnabled: boolean }>({
      method: "PUT", url: "/api/multiTenant/registration", data: { registrationEnabled: value }, signal: controller.signal,
    });
    registrationEnabled.value = result.registrationEnabled;
  } catch (cause) {
    if (!controller.signal.aborted) {
      if ((cause as { status?: number } | null)?.status === 401) authenticated.value = false;
      requestError.value = cause instanceof Error ? cause.message : translate("保存多租户设置失败");
    }
  } finally { registrationSaving.value = false; }
}

onMounted(loadState);
onBeforeUnmount(() => {
  controller.abort();
  authenticated.value = false;
  userName.value = "";
  password.value = "";
});
</script>

<style lang="scss" scoped>
.adminWeb {
  --sidebarWidth: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family);
  font-size: 14px;
  line-height: 1.6;
  box-sizing: border-box;

  &.authenticated {
    display: grid;
    grid-template-columns: var(--sidebarWidth) minmax(0, 1fr);
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    transition: grid-template-columns 180ms ease;

    @media (prefers-reduced-motion: reduce) { transition: none; }
  }

  h1, p { margin: 0; }
  .authHeader {
    display: flex;
    align-items: center;
    min-height: 64px;
    padding: 12px 32px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;

      .brandLogo { width: 30px; height: 30px; object-fit: contain; .dark & { filter: invert(1); } }
      .brandName { font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }
      .brandContext { margin-inline-start: 6px; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
    }
  }
  .authMain {
    display: grid;
    flex: 1;
    place-items: center;
    min-width: 0;
    padding: 48px 24px 72px;

    .loadingPanel, .loginPanel {
      width: min(100%, 440px);
      padding: 36px;
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--ui-radius-large, 16px);
      background: var(--el-bg-color);
      box-sizing: border-box;
    }
    .loginPanel {
      .panelHeading {
        margin-bottom: 32px;

        h1 { font-size: 24px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
        p { margin-top: 10px; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
      }
      .loginForm {
        :deep(.el-form-item) { margin-bottom: 24px; }
        :deep(.el-form-item__label) { height: auto; padding-bottom: 8px; color: var(--el-text-color-primary); line-height: 1.5; }
        :deep(.el-input__wrapper) { min-height: 44px; padding-inline: 12px; border-radius: var(--el-border-radius-base); }
        :deep(.el-input__inner) { height: 42px; }
        :deep(.el-form-item__error) { position: static; padding-top: 6px; line-height: 1.5; overflow-wrap: anywhere; }
        .formError { margin-bottom: 20px; }
        .loginButton { width: 100%; min-height: 44px; margin: 4px 0 0; font-weight: 500; }
      }
    }
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 20px 12px 16px;
    overflow: auto;
    border-inline-end: 1px solid var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-text-color-primary));

    .sidebarHeader {
      position: relative;
      display: flex;
      align-items: center;
      height: 32px;
      flex-shrink: 0;
      margin-bottom: 28px;
      padding-inline: 8px;

      .sidebarBrand {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        overflow: hidden;

        .sidebarLogo { width: 30px; height: 30px; flex-shrink: 0; object-fit: contain; .dark & { filter: invert(1); } }
        .brandName { overflow: hidden; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; white-space: nowrap; }
      }
      .sidebarToggle {
        position: absolute;
        inset-inline-end: 0;
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: var(--el-border-radius-base);
        background: transparent;
        color: var(--el-text-color-secondary);
        cursor: pointer;

        &:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
        &:dir(rtl) svg { transform: scaleX(-1); }
      }
    }
    .sidebarNav {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .navGroup {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 16px;

        .groupTitle { margin: 0 12px 2px; color: var(--el-text-color-secondary); font-size: 12px; font-weight: 500; }
      }

      .sidebarItem {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 44px;
        padding: 10px 12px;
        border-radius: var(--el-border-radius-base);
        color: var(--el-text-color-regular);
        font-weight: 500;
        text-decoration: none;

        > svg { flex-shrink: 0; }
        .sidebarText { min-width: 0; overflow-wrap: anywhere; }
        &:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
        &.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
      }
    }
    .sidebarFooter {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 12px;
      margin-top: auto;
      padding: 20px 8px 0;
      border-top: 1px solid var(--el-border-color-lighter);

      .accountIcon { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 40px; color: var(--el-text-color-regular); }
      .accountInfo {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .accountName { overflow: hidden; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
        .accountRole { color: var(--el-text-color-secondary); font-size: 12px; overflow-wrap: anywhere; }
      }
    }
  }
  .workspace {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .workspaceHeader {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px 24px;
      min-height: 72px;
      padding: 16px 32px;
      border-bottom: 1px solid var(--el-border-color-light);
      background: var(--el-bg-color);

      .titleGroup {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        min-width: 0;

        .pageTitle { font-size: 16px; font-weight: 600; overflow-wrap: anywhere; }
        .statusBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: var(--el-border-radius-round);
          background: var(--el-fill-color-light);
          color: var(--el-text-color-regular);
          font-size: 12px;

          .statusDot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-text-color-secondary); }
          &.enabled .statusDot { background: var(--el-color-success); }
        }
      }
      .creationButton { flex-shrink: 0; min-height: 36px; margin: 0; }
    }
    .pageContent {
      flex: 1;
      min-width: 0;
      min-height: 0;
      padding: 32px;
      overflow: auto;
      overscroll-behavior: contain;

      .contentInner {
        width: 100%;
        max-width: 1040px;
        min-width: 0;
        margin: 0 auto;

        .requestError { margin-bottom: 24px; }
      }
    }
  }

  &.sidebarCollapsed {
    --sidebarWidth: 72px;

    .sidebar {
      .sidebarHeader {
        justify-content: center;
        padding: 0;

        .sidebarBrand .brandName { display: none; }
        .sidebarToggle { inset-inline-end: 10px; opacity: 0; }
        @media (min-width: 761px) {
          &:hover, &:has(.sidebarToggle:focus-visible) {
            .sidebarLogo { opacity: 0; }
            .sidebarToggle { opacity: 1; }
          }
        }
      }
      .sidebarNav .sidebarItem {
        justify-content: center;
        padding-inline: 12px;

        .sidebarText { display: none; }
      }
      .sidebarNav .navGroup { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); .groupTitle { display: none; } }
      .sidebarFooter { justify-content: center; padding-inline: 0; .accountInfo { display: none; } }
    }
  }

  @media (max-width: 760px) {
    --sidebarWidth: 72px;

    .authHeader { padding-inline: 24px; .brand .brandContext { display: none; } }
    .authMain { padding: 32px 24px 48px; .loadingPanel, .loginPanel { padding: 28px 24px; } }
    .sidebar {
      .sidebarHeader {
        justify-content: center;
        padding: 0;

        .sidebarBrand .brandName { display: none; }
        .sidebarToggle { display: none; }
      }
      .sidebarNav .sidebarItem { justify-content: center; padding-inline: 12px; .sidebarText { display: none; } }
      .sidebarNav .navGroup { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); .groupTitle { display: none; } }
      .sidebarFooter { justify-content: center; padding-inline: 0; .accountInfo { display: none; } }
    }
    .workspace {
      .workspaceHeader { padding: 16px 20px; }
      .pageContent { padding: 24px 20px; }
    }
  }
  @media (max-width: 480px) {
    .workspace .workspaceHeader .creationButton { width: 100%; }
  }
}
</style>
