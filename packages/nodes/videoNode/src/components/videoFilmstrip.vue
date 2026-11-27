<template>
  <div class="filmstrip" aria-hidden="true">
    <div v-for="index in frameCount" :key="index" class="frameCell">
      <img v-if="frames[index - 1]" :src="frames[index - 1]" alt="" draggable="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ src: string; duration: number }>();
const frameCount = 10;
const frames = ref<string[]>([]);

watch([() => props.src, () => props.duration], ([src, duration], _, onCleanup) => {
  frames.value = [];
  if (!src || !Number.isFinite(duration) || duration <= 0) return;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return;
  const video = document.createElement("video");
  let timer: number;
  function release() {
    clearTimeout(timer);
    video.onloadeddata = video.onseeked = video.onerror = null;
    if (video.hasAttribute("src")) {
      video.removeAttribute("src");
      video.load();
    }
  }
  // ACT: 固定采样十帧，不随原片时长增加内存或解码任务。
  function seekFrame() {
    clearTimeout(timer);
    timer = window.setTimeout(release, 15000);
    const time = Math.min(duration * (frames.value.length + 0.5) / frameCount, Math.max(0, duration - 0.001));
    if (video.readyState >= 2 && Math.abs(video.currentTime - time) < 0.000001) captureFrame();
    else video.currentTime = time;
  }
  function captureFrame() {
    try {
      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      context!.drawImage(video, (canvas.width - video.videoWidth * scale) / 2, (canvas.height - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale);
      frames.value.push(canvas.toDataURL("image/jpeg", 0.75));
      if (frames.value.length === frameCount) release();
      else seekFrame();
    } catch { release(); }
  }
  onCleanup(release);
  video.onloadeddata = seekFrame;
  video.onseeked = captureFrame;
  video.onerror = release;
  video.muted = true;
  video.preload = "auto";
  video.src = src;
  timer = window.setTimeout(release, 15000);
  video.load();
}, { immediate: true });
</script>

<style scoped lang="scss">
.filmstrip {
  display: flex; height: 100%; overflow: hidden; border-radius: 5px; background: var(--el-fill-color-darker);
  .frameCell {
    flex: 1; min-width: 0; border-right: 1px solid rgba(255, 255, 255, 0.12);
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
  }
}
</style>
