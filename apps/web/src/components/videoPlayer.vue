<template>
  <div class="videoPlayer" role="region" tabindex="0" :aria-label="playerLabel" :aria-busy="preparing" @keydown.self="handleKeydown" @focusin="player && (player.controls.show = true)">
    <div ref="container" class="playerSurface" />
    <div v-if="preparing || previewError" class="previewStatus" role="status">{{ preparing ? '正在生成兼容预览…' : previewError }}</div>
  </div>
</template>

<script setup lang="ts">
import Artplayer from "artplayer";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { locale, msg, translate } from "@toonflow/i18n/vue";
import { useMediaPreview } from "@toonflow/node-shared/mediaPreview";

const props = withDefaults(defineProps<{
  src: string;
  label?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  active?: boolean;
  loop?: boolean;
}>(), { label: "", poster: "", autoplay: false, muted: false, active: true, loop: false });
const emit = defineEmits<{ error: [error: unknown] }>();
const { src: playbackSrc, preparing, error: previewError, handleError, handleLoaded } = useMediaPreview(() => props.src, "video");
watch(previewError, error => { if (error) emit("error", new Error(error)); });
const container = ref<HTMLDivElement>();
const playerLabel = computed(() => props.label || translate("视频播放器"));
const playerMessages = {
  "Video Info": msg`视频信息`, "Close": msg`关闭`, "Video Load Failed": msg`视频加载失败`,
  "Volume": msg`音量`, "Play": msg`播放`, "Pause": msg`暂停`, "Rate": msg`播放速度`, "Mute": msg`静音`,
  "Video Flip": msg`视频翻转`, "Horizontal": msg`水平`, "Vertical": msg`垂直`, "Reconnect": msg`重新连接`,
  "Show Setting": msg`显示设置`, "Hide Setting": msg`隐藏设置`, "Screenshot": msg`截图`,
  "Play Speed": msg`播放速度`, "Aspect Ratio": msg`宽高比`, "Default": msg`默认`, "Normal": msg`正常`,
  "Open": msg`打开`, "Switch Video": msg`切换视频`, "Switch Subtitle": msg`切换字幕`,
  "Fullscreen": msg`全屏`, "Exit Fullscreen": msg`退出全屏`, "Web Fullscreen": msg`网页全屏`,
  "Exit Web Fullscreen": msg`退出网页全屏`, "Mini Player": msg`迷你播放器`, "PIP Mode": msg`画中画`,
  "Exit PIP Mode": msg`退出画中画`, "PIP Not Supported": msg`不支持画中画`,
  "Fullscreen Not Supported": msg`不支持全屏`, "Subtitle Offset": msg`字幕偏移`,
  "Last Seen": msg`上次播放至`, "Jump Play": msg`跳转播放`, "AirPlay": msg`隔空播放`, "AirPlay Not Available": msg`隔空播放不可用`,
};
let player: Artplayer | undefined;
let playback: { time: number; rate: number; volume: number; muted: boolean; paused: boolean } | undefined;

function pause() {
  player?.pause();
}

function handleKeydown(event: KeyboardEvent) {
  if (!player || !props.active || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  switch (event.code) {
    case "Space": void player.toggle(); break;
    case "ArrowLeft": player.backward = 5; break;
    case "ArrowRight": player.forward = 5; break;
    case "ArrowUp": player.volume += 0.1; break;
    case "ArrowDown": player.volume -= 0.1; break;
    default: return;
  }
  event.preventDefault();
  player.controls.show = true;
}

function destroyPlayer() {
  const current = player;
  player = undefined;
  if (!current) return;
  current.pause();
  // Artplayer 5.4 默认在 destroy 中移除 src 并 load，释放媒体后清空容器。
  current.destroy();
}

watch([container, playbackSrc, locale], ([element, src, language], previous, onCleanup) => {
  const savedPlayback = previous?.[1] === src ? playback : undefined;
  let restored = !savedPlayback;
  onCleanup(() => {
    playback = player && restored ? { time: player.currentTime, rate: player.playbackRate, volume: player.volume, muted: player.muted, paused: player.video.paused } : savedPlayback;
    destroyPlayer();
  });
  if (!element || !src) return;
  try {
    const current = player = new Artplayer({
      container: element,
      url: src,
      poster: props.poster,
      autoplay: (savedPlayback ? !savedPlayback.paused : props.autoplay) && props.active,
      muted: savedPlayback?.muted ?? props.muted,
      loop: props.loop,
      playsInline: true,
      lang: language.toLowerCase(),
      i18n: { [language.toLowerCase()]: Object.fromEntries(Object.entries(playerMessages).map(([key, message]) => [key, translate(message)])) },
      theme: "var(--el-color-primary)",
      setting: true,
      playbackRate: true,
      fullscreen: true,
      hotkey: false,
      moreVideoAttr: { preload: "auto" },
    });
    current.video.setAttribute("aria-label", playerLabel.value);
    // ACT: Artplayer 的菜单文本只在初始化时生成；切换语言重建播放器并保留播放状态。
    if (savedPlayback) {
      current.playbackRate = savedPlayback.rate;
      current.volume = savedPlayback.volume;
      current.once("video:loadedmetadata", () => {
        if (player !== current) return;
        current.currentTime = savedPlayback.time;
        restored = savedPlayback.paused || !current.video.paused;
      });
      current.once("video:play", () => { restored = true; });
    }
    const pauseInactive = () => {
      if (player === current && !props.active) { current.video.autoplay = false; current.pause(); }
    };
    current.on("ready", pauseInactive);
    current.on("video:play", pauseInactive);
    current.on("video:loadeddata", event => { if (player === current && !handleLoaded(event)) current.pause(); });
    current.on("video:error", () => { if (player === current) handleError(); });
  } catch (error) {
    destroyPlayer();
    emit("error", error);
  }
}, { immediate: true, flush: "post" });

watch(() => props.active, active => {
  if (!active && player) { player.video.autoplay = false; pause(); }
}, { flush: "sync" });
watch(() => props.muted, muted => { if (player) player.muted = muted; });
watch(() => props.poster, poster => { if (player) player.poster = poster; });
watch(() => props.loop, loop => { if (player) player.option.loop = loop; });
watch(playerLabel, label => { player?.video.setAttribute("aria-label", label); });
onBeforeUnmount(destroyPlayer);
defineExpose({ pause });
</script>

<style scoped lang="scss">
.videoPlayer {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  min-width: 0;
  min-height: 0;
  .playerSurface { width: 100%; height: 100%; }
  .previewStatus {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background: var(--el-fill-color-darker);
    color: var(--el-text-color-secondary);
    overflow: auto;
    text-align: center;
  }
}
</style>
