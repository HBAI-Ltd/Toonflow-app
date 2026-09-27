<template>
  <el-dialog v-model="visible" title="FFmpeg" width="min(680px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
    <el-alert class="installationHint" :title="t('ffmpeg.retryOperationHint')" type="info" :closable="false" showIcon />
    <ffmpeg v-if="visible" :downloadOnOpen="true" />
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "./i18n";
import { onBeforeUnmount, ref } from "vue";
import { ElMessageBox } from "element-plus";
import ffmpeg from "./panels/pluginMarket/ffmpeg.vue";

const visible = ref(false);
let pending = false;
const events = new EventSource("/api/ffmpeg/events");
events.onmessage = async event => {
  let data: { type?: string };
  try { data = JSON.parse(event.data); }
  catch { return; }
  if (data?.type !== "required" || pending || visible.value) return;
  pending = true;
  try {
    await ElMessageBox.confirm(t("ffmpeg.requiredPrompt"), t("ffmpeg.requiredTitle"), {
      confirmButtonText: t("ffmpeg.downloadAndInstall"), cancelButtonText: t("ffmpeg.notNow"), closeOnClickModal: false,
    });
    if (events.readyState !== EventSource.CLOSED) visible.value = true;
  } catch {
    // 用户取消后保留当前操作的失败结果，不自动重新生成媒体。
  } finally {
    pending = false;
  }
};
onBeforeUnmount(() => events.close());
</script>

<style scoped>
.installationHint { margin-bottom: 12px; }
</style>
