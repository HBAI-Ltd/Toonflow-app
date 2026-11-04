<template>
  <div class="multiTenantPage">
    <adminWeb :request="requestAdmin" :logoUrl="logoUrl" :creationUrl="creationUrl.href" :accountName="currentUser?.userName" @enabledChange="applyMultiTenantEnabled" @back="openCreation" />
    <desktopQuit v-if="actualPlatform.isDesktop" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import adminWeb from "@toonflow/multi-tenant-admin-web";
import type { UserIdentity } from "@toonflow/multi-tenant-user-web/types";
import logoUrl from "@toonflow/assets/logo.svg";
import desktopQuit from "@/components/desktopQuit.vue";
import http from "@/lib/http";
import { actualPlatform } from "@/lib/platform";
import { applyMultiTenantEnabled, settings } from "@/stores/settings";
import { currentUser } from "@/stores/multiTenant";
import { registerAppearance } from "@/lib/appearance";
import { registerLanguage } from "@/lib/i18n";

const hostWindow = window as Window & { __electrobunSendToHost?: (message: { type: "openExternal"; url: string }) => void };
const creationUrl = new URL(window.location.origin);
creationUrl.port = "10888";
creationUrl.hash = "/home";

onBeforeUnmount(registerAppearance());
onBeforeUnmount(registerLanguage());

async function requestAdmin<T>(config: Parameters<typeof http>[0]): Promise<T> {
  const result = await http<T>(config);
  if (config.url === "/api/multiTenant/state") {
    const state = result as { user: UserIdentity | null; ui: Record<string, unknown> };
    currentUser.value = state.user;
    settings.value.ui = state.ui;
  }
  return result;
}

function openCreation() {
  if (actualPlatform.isDesktop && hostWindow.__electrobunSendToHost) {
    hostWindow.__electrobunSendToHost({ type: "openExternal", url: creationUrl.href });
    return;
  }
  window.open(creationUrl.href, "_blank", "noopener,noreferrer,popup,width=1280,height=960");
}
</script>

<style lang="scss" scoped>
.multiTenantPage {
  min-height: 100svh;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family);
}
</style>
