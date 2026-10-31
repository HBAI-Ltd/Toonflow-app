<template>
  <section v-if="visibleAdvertisements.length" class="promotionGroup" :class="{ bannerGroup: placement === 'banner', multipleBanners: placement === 'banner' && mode === 'carousel' && visibleAdvertisements.length > 1 }" :aria-label="placement === 'banner' ? '首页横幅' : '侧栏内容轮播'" @mouseenter="hovered = true" @mouseleave="hovered = false" @focusin="focused = true" @focusout="leaveFocus">
    <template v-if="placement === 'banner' && mode === 'stack'">
      <homeAdvertisement v-for="advertisement in visibleAdvertisements" :key="advertisements.indexOf(advertisement)" :advertisement="advertisement" placement="banner" @activate="emit('activate', $event)" @close="closedAdvertisements.add(advertisement)" />
    </template>
    <el-carousel
      v-else
      ref="carousel"
      :height="placement === 'banner' ? 'auto' : '104px'"
      :autoplay="visibleAdvertisements.length > 1 && !paused && !hovered && !focused && !reduceMotion"
      :interval="interval * 1000"
      :pauseOnHover="true"
      :arrow="visibleAdvertisements.length < 2 ? 'never' : focused ? 'always' : 'hover'"
      :indicatorPosition="placement === 'sidebar' && visibleAdvertisements.length > 1 ? '' : 'none'"
      trigger="click"
      @change="syncSlideVisibility">
      <el-carousel-item v-for="advertisement in visibleAdvertisements" :key="advertisements.indexOf(advertisement)">
        <homeAdvertisement :advertisement="advertisement" :placement="placement" @activate="emit('activate', $event)" @close="closedAdvertisements.add(advertisement)" @imageError="failedImages.add(advertisement.imageUrl)" />
      </el-carousel-item>
    </el-carousel>
    <button v-if="(placement === 'sidebar' || mode === 'carousel') && visibleAdvertisements.length > 1 && !reduceMotion" class="rotationToggle" type="button" :aria-label="paused ? '播放轮播' : '暂停轮播'" :title="paused ? '播放轮播' : '暂停轮播'" @click="paused = !paused">
      <icon-player-play v-if="paused" :size="12" aria-hidden="true" />
      <icon-player-pause v-else :size="12" aria-hidden="true" />
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { CarouselInstance } from "element-plus";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-vue";
import type { HomeAdvertisement } from "@toonflow/server/channel";
import homeAdvertisement from "./homeAdvertisement.vue";

const props = withDefaults(defineProps<{
  advertisements: HomeAdvertisement[];
  placement?: "banner" | "sidebar";
  mode?: "carousel" | "stack";
  interval?: number;
}>(), { placement: "sidebar", mode: "carousel", interval: 5 });
const emit = defineEmits<{ activate: [advertisement: HomeAdvertisement] }>();
const now = ref(Date.now());
const failedImages = ref(new Set<string>());
const closedAdvertisements = ref(new Set<HomeAdvertisement>());
const carousel = ref<CarouselInstance>();
const paused = ref(false);
const hovered = ref(false);
const focused = ref(false);
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduceMotion = ref(motionPreference.matches);
const visibleAdvertisements = computed(() => props.advertisements.filter(advertisement =>
  !closedAdvertisements.value.has(advertisement)
  && (!advertisement.endsAt || advertisement.endsAt > now.value)
  && (props.placement === "banner" || (advertisement.imageUrl && !failedImages.value.has(advertisement.imageUrl)))
));

watch(() => props.advertisements, (advertisements, _previous, onCleanup) => {
  failedImages.value.clear();
  closedAdvertisements.value.clear();
  now.value = Date.now();
  if (!advertisements.some(advertisement => advertisement.endsAt && advertisement.endsAt > now.value)) return;
  const timer = setInterval(() => {
    now.value = Date.now();
    if (!advertisements.some(advertisement => advertisement.endsAt && advertisement.endsAt > now.value)) clearInterval(timer);
  }, 1000);
  onCleanup(() => clearInterval(timer));
}, { immediate: true });
watch(() => `${props.mode}:${visibleAdvertisements.value.map(advertisement => props.advertisements.indexOf(advertisement)).join(",")}`, syncSlideVisibility);

async function syncSlideVisibility() {
  await nextTick();
  const root = carousel.value?.$el;
  if (!(root instanceof HTMLElement)) return;
  // 双图循环会生成副本，按实际活动项隔离焦点，避免键盘进入屏幕外的广告。
  for (const item of root.querySelectorAll<HTMLElement>(".el-carousel__item")) {
    item.inert = !item.classList.contains("is-active");
    item.setAttribute("aria-hidden", String(item.inert));
  }
}

function leaveFocus(event: FocusEvent) {
  focused.value = event.currentTarget instanceof Node && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
}

function updateMotionPreference() { reduceMotion.value = motionPreference.matches; }
onMounted(() => {
  motionPreference.addEventListener("change", updateMotionPreference);
  void syncSlideVisibility();
});
onUnmounted(() => motionPreference.removeEventListener("change", updateMotionPreference));
</script>

<style lang="scss" scoped>
.promotionGroup {
  position: relative;
  width: 100%;
  max-width: 188px;
  margin: 0 auto 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--ui-radius);
  background: var(--el-bg-color-overlay);

  :deep(.el-carousel) {
    .el-carousel__arrow {
      width: 24px;
      height: 24px;
      border: 1px solid var(--el-border-color-lighter);
      background: color-mix(in srgb, var(--el-bg-color-overlay) 90%, transparent);
      color: var(--el-text-color-regular);

      &:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
    }
    .el-carousel__arrow--left { left: 8px; }
    .el-carousel__arrow--right { right: 8px; }
    .el-carousel__indicator { padding: 8px 4px; }
    .el-carousel__button { width: 5px; height: 5px; border-radius: 50%; background: var(--el-text-color-placeholder); opacity: 1; }
    .el-carousel__indicator.is-active .el-carousel__button { background: var(--el-color-primary); }
    .homePromotion.sidebar {
      height: 100%;
      margin: 0;
      border: 0;
      border-radius: 0;

      .promotionImageLink { height: 100%; }
      .promotionImage { height: 100%; object-fit: contain; }
    }
  }
  .rotationToggle {
    position: absolute;
    right: 6px;
    bottom: 5px;
    z-index: 3;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--ui-radius-small);
    background: color-mix(in srgb, var(--el-bg-color-overlay) 90%, transparent);
    color: var(--el-text-color-regular);
    opacity: 0;
    cursor: pointer;

    &:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }
  &:hover .rotationToggle, &:focus-within .rotationToggle { opacity: 1; }

  &.bannerGroup {
    max-width: none;
    margin: 0;
    border: 0;
    border-radius: 0;

    :deep(.el-carousel) {
      .el-carousel__container { min-height: 44px; }
      .el-carousel__item { height: auto; }
      .el-carousel__arrow--right { right: 40px; }
    }
    .rotationToggle {
      top: 50%;
      right: auto;
      bottom: auto;
      left: 40px;
      transform: translateY(-50%);
    }
    &.multipleBanners :deep(.bannerContent) {
      max-width: min(1200px, calc(100% - 144px));
    }
    &.multipleBanners :deep(.imageBanner .bannerContent) {
      width: calc(100% - 144px);
    }
    @media (max-width: 600px) {
      &.multipleBanners :deep(.bannerContent) {
        width: calc(100% - 144px);
        max-width: none;
        margin-inline: 72px;
      }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :deep(.el-carousel__item), :deep(.el-carousel__container) { transition: none; }
  }
}
</style>
