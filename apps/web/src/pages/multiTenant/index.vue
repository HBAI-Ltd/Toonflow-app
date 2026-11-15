<template>
  <div class="multiTenantPage">
    <adminWeb :request="requestAdmin" :logoUrl="logoUrl" :creationUrl="creationUrl.href" :accountName="currentUser?.userName" @enabledChange="applyMultiTenantEnabled" @back="openCreation" />
    <desktopQuit v-if="actualPlatform.isDesktop" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import adminWeb from "@toonflow/multi-tenant-admin-web";
import { defaultCreationPort } from "@toonflow/multi-tenant-admin-web/constants";
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

// ACT: 后台与创作入口分离部署，默认按当前页面的主机名加创作端口拼接；settings.json 配置了 multiTenantCreationUrl 后以其为准。
function defaultCreationUrl() {
  const url = new URL(window.location.origin);
  url.port = defaultCreationPort;
  url.hash = "/home";
  return url;
}

function configuredCreationUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch { return null; }
}

const creationUrl = ref(defaultCreationUrl());

onBeforeUnmount(registerAppearance());
onBeforeUnmount(registerLanguage());

async function requestAdmin<T>(config: Parameters<typeof http>[0]): Promise<T> {
  const result = await http<T>(config);
  if (config.url === "/api/multiTenant/state") {
    const state = result as { user: UserIdentity | null; ui: Record<string, unknown>; creationUrl?: unknown };
    currentUser.value = state.user;
    settings.value.ui = state.ui;
    const configured = configuredCreationUrl(state.creationUrl);
    if (configured) creationUrl.value = configured;
  }
  return result;
}

function openCreation() {
  const target = creationUrl.value.href;
  if (actualPlatform.isDesktop && hostWindow.__electrobunSendToHost) {
    hostWindow.__electrobunSendToHost({ type: "openExternal", url: target });
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer,popup,width=1280,height=960");
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
