<template>
  <el-dialog v-model="visible" title="FFmpeg" width="min(680px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
    <el-alert class="installationHint" title="安装完成后，请重新发起刚才的操作。" type="info" :closable="false" showIcon />
    <ffmpeg v-if="visible" :downloadOnOpen="true" />
  </el-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { actualPlatform } from "@/lib/platform";
import { useFfmpegRequired } from "@/lib/ffmpegEvents";
import ffmpeg from "./panels/pluginMarket/ffmpeg.vue";

const visible = ref(false);
let pending = false;
let mounted = true;
useFfmpegRequired(async () => {
  if (pending || visible.value) return;
  if (actualPlatform.isLocalMobile) {
    ElMessage.warning("未检测到可用的 FFmpeg，无法继续这项音视频处理。当前移动端版本暂不支持在应用内安装 FFmpeg。");
    return;
  }
  pending = true;
  try {
    await ElMessageBox.confirm("这项音视频处理需要 FFmpeg，但尚未检测到可用版本。现在下载并安装吗？", "需要 FFmpeg", {
      confirmButtonText: "下载并安装", cancelButtonText: "暂不下载", closeOnClickModal: false,
    });
    if (mounted) visible.value = true;
  } catch {
    // 用户取消后保留当前操作的失败结果，不自动重新生成媒体。
  } finally {
    pending = false;
  }
});
onBeforeUnmount(() => { mounted = false; });
</script>

<style scoped>
.installationHint { margin-bottom: 12px; }
</style>
