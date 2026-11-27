<template>
  <div class="homeAccount" :class="{ collapsed }">
    <el-dropdown class="accountDropdown" trigger="click" placement="top-start" popperClass="homeAccountMenu" @command="handleCommand" @visibleChange="(opened: boolean) => { if (opened) refreshBalance(); }">
      <button class="accountTrigger" type="button" :aria-label="loggedIn ? '账号与余额' : '更多'" :title="loggedIn ? accountName : '更多'" aria-haspopup="menu">
        <span v-if="loggedIn" class="accountInfo">
          <span class="accountName">{{ accountName }}</span>
          <span v-if="showBalance" class="accountBalance" :title="balanceError || balanceText"><span>余额</span><span>{{ balanceText || '—' }}</span></span>
        </span>
        <icon-dots v-else class="moreIcon" :size="18" aria-hidden="true" />
        <span v-if="!loggedIn" class="moreLabel">更多</span>
        <icon-chevron-up v-if="loggedIn" class="accountChevron" :size="14" aria-hidden="true" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item class="accountMenuItem" :icon="IconSettings" command="settings">设置</el-dropdown-item>
          <el-dropdown-item v-if="!publicWeb" class="accountMenuItem" :class="{ connected: deviceHubEnabled || mobileConnection.online === true }" command="deviceLink" :icon="deviceHubEnabled || mobileConnection.mode === 'remote' ? IconDeviceDesktop : IconQrcode">
            <span>{{ mobileConnectionLabel }}</span>
          </el-dropdown-item>
          <el-dropdown-item class="accountMenuItem" :icon="IconBrandGithub" command="github">Github</el-dropdown-item>
          <el-dropdown-item v-if="loggedIn" class="accountMenuItem" :icon="IconLogout" command="logout" :disabled="loggingOut">退出登录</el-dropdown-item>
          <el-dropdown-item v-else class="accountMenuItem" :icon="IconLogin" command="account">登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-badge v-if="updateDownloading || hasDesktopUpdate" class="updateBadge" isDot :hidden="updateDownloading">
      <el-button v-if="updateDownloading" class="updateButton" type="primary" plain size="small" loading title="正在下载" aria-label="正在下载" @click="emit('openUpdate')">
        <span class="updateLabel">{{ updatePercentage === undefined ? "正在下载" : `${updatePercentage}%` }}</span>
      </el-button>
      <el-button v-else class="updateButton" type="primary" plain size="small" :icon="IconDownload" title="发现新版本" aria-label="发现新版本" @click="emit('openUpdate')"><span class="updateLabel">新版</span></el-button>
    </el-badge>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconBrandGithub, IconDeviceDesktop, IconDownload, IconLogin, IconLogout, IconQrcode, IconSettings } from "@tabler/icons-vue";
import { locale, translate } from "@toonflow/i18n/vue";
import type { Login, PreviewData } from "@toonflow/server/channel";
import http from "@/lib/http";
import { multiTenantEnabled, saveSettings, settings, toonflowAccountToken } from "@/stores/settings";
import { currentUser, publicWeb } from "@/stores/multiTenant";
import { desktopUpdateAction, desktopUpdateSnapshot, hasDesktopUpdate } from "@/stores/desktopUpdate";
import { deviceHubEnabled, mobileConnection, mobileConnectionLabel } from "@/lib/mobile";

defineProps<{ collapsed: boolean }>();
const emit = defineEmits<{ openSettings: []; openAccount: []; openUpdate: []; openDeviceLink: [] }>();
const loggedIn = computed(() => publicWeb.value ? !!currentUser.value : !!toonflowAccountToken.value);
const accountName = computed(() => (publicWeb.value ? currentUser.value?.userName : (settings.value.toonflowAccount as Partial<Login> | null)?.info?.userName) || translate("未登录"));
const showBalance = computed(() => loggedIn.value && (publicWeb.value ? currentUser.value?.role === "user" : !multiTenantEnabled.value));
const updateDownloading = computed(() => desktopUpdateAction.value === "download"
  || (!!desktopUpdateSnapshot.value?.updating && !desktopUpdateSnapshot.value.updateReady));
const updatePercentage = computed(() => {
  const progress = desktopUpdateSnapshot.value?.updateProgress;
  return progress?.total ? Math.min(100, Math.floor(progress.received / progress.total * 100)) : undefined;
});
const balanceText = ref("");
const balanceError = ref("");
const loggingOut = ref(false);
const moneyFormat = computed(() => new Intl.NumberFormat(locale.value, { style: "currency", currency: "CNY", minimumFractionDigits: 0, maximumFractionDigits: 2 }));
let controller: AbortController | undefined;

async function refreshBalance() {
  controller?.abort();
  if (!showBalance.value || document.hidden) return;
  const request = new AbortController();
  controller = request;
  balanceError.value = "";
  try {
    if (publicWeb.value) {
      const result = await http<{ wallets: { currency: "CNY" | "USD"; balance: string }[] }>({ method: "GET", url: "/api/multiTenant/user/balance", signal: request.signal });
      if (!request.signal.aborted) balanceText.value = result.wallets.map(wallet => `${wallet.balance} ${wallet.currency}`).join(" / ");
    } else {
      const token = toonflowAccountToken.value;
      const result = await http<PreviewData>({ method: "GET", url: "/api/channel/account/getPreviewData", signal: request.signal, headers: { Authorization: `Bearer ${token}` } });
      if (!request.signal.aborted && toonflowAccountToken.value === token) balanceText.value = moneyFormat.value.format(result.totalPoints);
    }
  } catch (error) {
    if (!request.signal.aborted) balanceError.value = error instanceof Error ? error.message : translate("加载余额失败，请刷新重试");
  }
}

async function handleCommand(command: string) {
  if (command === "settings") emit("openSettings");
  if (command === "account") emit("openAccount");
  if (command === "deviceLink") emit("openDeviceLink");
  if (command === "github") window.open("https://github.com/HBAI-Ltd/Toonflow-app", "_blank", "noopener,noreferrer");
  if (command !== "logout" || loggingOut.value) return;
  loggingOut.value = true;
  try {
    if (publicWeb.value) {
      await http({ method: "POST", url: "/api/multiTenant/user/logout" });
      window.location.reload();
    } else {
      const token = toonflowAccountToken.value;
      const saved = await saveSettings(() => toonflowAccountToken.value === token ? { toonflowAccount: null } : undefined);
      if (saved) ElMessage.success("已退出登录");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : translate("退出登录失败"));
  } finally {
    loggingOut.value = false;
  }
}

watch([publicWeb, currentUser, toonflowAccountToken, multiTenantEnabled, locale], () => {
  controller?.abort();
  balanceText.value = "";
  balanceError.value = "";
  void refreshBalance();
}, { immediate: true, flush: "sync" });
window.addEventListener("focus", refreshBalance);
document.addEventListener("visibilitychange", refreshBalance);
onBeforeUnmount(() => {
  controller?.abort();
  window.removeEventListener("focus", refreshBalance);
  document.removeEventListener("visibilitychange", refreshBalance);
});
</script>

<style lang="scss" scoped>
.homeAccount {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .accountDropdown { flex: 1; min-width: 0; }

  .accountTrigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding: 8px;
    border: 0;
    border-radius: var(--ui-radius);
    background: transparent;
    color: var(--el-text-color-primary);
    font: inherit;
    font-size: 13px;
    text-align: start;
    cursor: pointer;

    .accountInfo {
      display: grid;
      flex: 1;
      min-width: 0;
      gap: 4px;

      .accountName { min-width: 0; overflow: hidden; font-size: 14px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
      .accountBalance { display: flex; align-items: baseline; gap: 6px; min-width: 0; color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums; span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
    }
    .accountChevron, .moreIcon { flex-shrink: 0; color: var(--el-text-color-secondary); }
    .moreLabel { color: var(--el-text-color-regular); font-size: 14px; }
    &:hover { background: var(--el-fill-color-light); }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
  }

  .updateBadge {
    flex-shrink: 0;

    .updateButton { min-height: 32px; margin: 0; padding-inline: 8px; }
  }

  &.collapsed {
    flex-direction: column;

    .accountDropdown { width: 100%; }
    .accountTrigger {
      justify-content: center;
      min-height: 42px;
      padding: 0;
      .accountInfo, .moreLabel { display: none; }
    }
    .updateLabel { display: none; }
    .updateBadge .updateButton { width: 42px; min-height: 36px; padding: 0; :deep(.el-icon + span) { margin-left: 0; } }
  }

  @media (max-width: 900px) {
    flex-direction: column;

    .accountDropdown { width: 100%; }
    .accountTrigger {
      justify-content: center;
      min-height: 42px;
      padding: 0;
      .accountInfo, .moreLabel { display: none; }
    }
    .updateLabel { display: none; }
    .updateBadge .updateButton { width: 42px; min-height: 36px; padding: 0; :deep(.el-icon + span) { margin-left: 0; } }
  }
}
</style>

<style lang="scss">
.homeAccountMenu {
  min-width: 216px;
  max-width: calc(100vw - 24px);

  .el-dropdown-menu { padding: 6px; }

  .accountMenuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 8px 12px;
    border-radius: var(--ui-radius);
    font-size: 14px;

    > .el-icon { margin-right: 0; }
    &.connected { color: var(--el-color-success); }
  }
}
</style>
