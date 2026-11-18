<template>
  <el-dialog v-model="visible" class="toonflowRechargeDialog" title="充值" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose @closed="emit('closed')">
    <el-alert v-if="!token" title="请先在账号与余额中登录 Toonflow 账号" type="info" :closable="false" showIcon />
    <template v-else>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon />
      <component :is="walletPanel" :visible="visible" :token="token" :balance="balance" @balanceChanged="refreshBalance" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import type { PreviewData } from "@toonflow/server/channel";
import http from "@/lib/http";
import { refreshProviderBalance } from "@/lib/providerBilling";

const props = defineProps<{ token: string }>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ balanceChanged: []; closed: [] }>();
const walletPanel = defineAsyncComponent(() => import("./wallet.vue"));
const balance = ref<number>();
const errorMessage = ref("");
let controller: AbortController | undefined;

async function refreshPreview() {
  controller?.abort();
  errorMessage.value = "";
  const token = props.token;
  if (!visible.value || !token) return;
  const request = new AbortController();
  controller = request;
  try {
    const result = await http<PreviewData>({
      method: "GET", url: "/api/channel/account/getPreviewData", signal: request.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!request.signal.aborted && visible.value && props.token === token) balance.value = result.totalPoints;
  } catch (error) {
    if (!request.signal.aborted && visible.value && props.token === token) {
      errorMessage.value = error instanceof Error ? error.message : translate("加载余额失败，请刷新重试");
    }
  }
}

async function refreshBalance() {
  const token = props.token;
  if (!visible.value || !token) return;
  await refreshPreview();
  if (!visible.value || props.token !== token) return;
  await refreshProviderBalance("toonflow");
  if (visible.value && props.token === token) emit("balanceChanged");
}

watch([visible, () => props.token], ([isVisible, token], previous) => {
  controller?.abort();
  balance.value = undefined;
  errorMessage.value = "";
  if (previous?.[1] !== undefined && token !== previous[1]) {
    visible.value = false;
    return;
  }
  if (isVisible && token) void refreshPreview();
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => controller?.abort());
</script>

<style lang="scss">
.toonflowRechargeDialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  overflow: hidden;

  .el-dialog__header { flex-shrink: 0; }

  .el-dialog__body {
    display: grid;
    flex: 1;
    gap: 16px;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
}
</style>
