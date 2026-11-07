<template>
  <el-dialog
    :key="requestId"
    :modelValue="visible"
    title="退出 TTLflow"
    width="min(420px, 92vw)"
    alignCenter
    appendToBody
    :closeOnClickModal="false"
    :beforeClose="cancel"
    @opened="focusCancel">
    退出后，正在运行的任务将被中断。确定要退出吗？
    <template #footer>
      <el-button ref="cancelButton" @click="cancel">取消</el-button>
      <el-button type="primary" @click="finish(true)">退出</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElButton, ElDialog, type ButtonInstance } from "element-plus";

type QuitMessage = { type: "confirmQuit"; requestId: string; confirmed: boolean } | { type: "quitReady"; ready: boolean } | { type: "quitShown"; requestId: string };
const hostWindow = window as Window & { __electrobunSendToHost?: (message: QuitMessage) => void };
const visible = ref(false);
const requestId = ref("");
const cancelButton = ref<ButtonInstance>();
let pendingRequestId: string | undefined;

function finish(confirmed: boolean) {
  const pendingId = pendingRequestId;
  if (!pendingId) return;
  pendingRequestId = undefined;
  visible.value = false;
  hostWindow.__electrobunSendToHost?.({ type: "confirmQuit", requestId: pendingId, confirmed });
}

function cancel() { finish(false); }

function focusCancel() {
  if (visible.value) cancelButton.value?.ref?.focus();
}

function confirmQuit(event: Event) {
  const detail: unknown = (event as CustomEvent<unknown>).detail;
  if (!detail || typeof detail !== "object" || !("requestId" in detail) || typeof detail.requestId !== "string" || !detail.requestId.trim()) return;
  if ("cancelled" in detail) {
    if (detail.cancelled === true && detail.requestId === pendingRequestId) finish(false);
    return;
  }
  if (detail.requestId === requestId.value) return;
  if (pendingRequestId) {
    hostWindow.__electrobunSendToHost?.({ type: "confirmQuit", requestId: detail.requestId, confirmed: false });
    return;
  }
  requestId.value = detail.requestId;
  pendingRequestId = detail.requestId;
  visible.value = true;
  hostWindow.__electrobunSendToHost?.({ type: "quitShown", requestId: detail.requestId });
}

onMounted(() => {
  window.addEventListener("toonflow:confirm-quit", confirmQuit);
  hostWindow.__electrobunSendToHost?.({ type: "quitReady", ready: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("toonflow:confirm-quit", confirmQuit);
  cancel();
  hostWindow.__electrobunSendToHost?.({ type: "quitReady", ready: false });
});
</script>
