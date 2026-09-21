<template>
  <el-dialog v-model="visible" title="FFmpeg" width="min(680px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
    <el-alert class="installationHint" title="安装完成后，请重新发起刚才的操作。" type="info" :closable="false" showIcon />
    <ffmpeg v-if="visible" :downloadOnOpen="true" />
  </el-dialog>
</template>

<script setup lang="ts">
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
    await ElMessageBox.confirm("当前操作需要 FFmpeg，但尚未检测到可用版本。是否下载并安装？", "需要 FFmpeg", {
      confirmButtonText: "下载并安装", cancelButtonText: "暂不下载", closeOnClickModal: false,
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
