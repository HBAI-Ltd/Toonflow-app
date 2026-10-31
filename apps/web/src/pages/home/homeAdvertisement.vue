<template>
  <section v-if="visible" class="homePromotion" :class="[placement, { imageBanner }]" :style="appearanceStyle" :aria-label="advertisement.title">
    <template v-if="placement === 'banner'">
      <div class="bannerContent">
        <span v-if="countdown" class="countdown" :aria-label="`距离结束 ${countdown.days} 天 ${countdown.hours} 小时 ${countdown.minutes} 分`">
          <span>{{ countdown.days }}</span><i>:</i><span>{{ countdown.hours }}</span><i>:</i><span>{{ countdown.minutes }}</span><i>:</i><span>{{ countdown.seconds }}</span>
        </span>
        <img v-if="imageBanner" class="bannerImage" :src="advertisement.imageUrl" :alt="advertisement.title" decoding="async" referrerpolicy="no-referrer" @error="imageFailed = true" />
        <img v-if="!imageBanner && advertisement.imageUrl && !imageFailed" class="promotionImage" :src="advertisement.imageUrl" alt="" decoding="async" referrerpolicy="no-referrer" @error="imageFailed = true" />
        <span v-if="!imageBanner" class="promotionCopy">
          <strong>{{ advertisement.title }}</strong>
          <span v-if="advertisement.content" class="promotionContent" @click="activateContentLink" v-html="contentHtml" />
        </span>
        <el-button
          v-if="advertisement.buttonText"
          class="promotionAction"
          :tag="advertisement.actionType === 'web' ? 'a' : 'button'"
          type="primary"
          size="small"
          nativeType="button"
          :href="advertisement.actionType === 'web' ? advertisement.actionTarget : undefined"
          :target="advertisement.actionType === 'web' ? '_blank' : undefined"
          :rel="advertisement.actionType === 'web' ? 'noopener noreferrer' : undefined"
          @click="activate">
          <span class="actionText">{{ advertisement.buttonText }}</span><icon-arrow-up-right :size="14" aria-hidden="true" />
        </el-button>
      </div>
      <button class="closeButton" type="button" aria-label="关闭横幅" title="关闭横幅" @click="emit('close')">
        <icon-x :size="16" aria-hidden="true" />
      </button>
    </template>
    <component
      :is="advertisement.actionType === 'web' ? 'a' : 'button'"
      v-else
      class="promotionImageLink"
      v-bind="actionAttributes"
      :aria-label="advertisement.title"
      @click="activate">
      <img class="promotionImage" :src="advertisement.imageUrl" :alt="advertisement.title" decoding="async" referrerpolicy="no-referrer" @error="imageFailed = true; emit('imageError')" />
    </component>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { HomeAdvertisement } from "@toonflow/server/channel";
import { IconArrowUpRight, IconX } from "@tabler/icons-vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps<{ advertisement: HomeAdvertisement; placement: "banner" | "sidebar" }>();
const emit = defineEmits<{ activate: [advertisement: HomeAdvertisement]; close: []; imageError: [] }>();
const now = ref(Date.now());
const imageFailed = ref(false);
const imageBanner = computed(() => props.placement === "banner" && props.advertisement.appearance?.mode === "image" && !!props.advertisement.imageUrl && !imageFailed.value);
const contentHtml = computed(() => {
  const dom = DOMPurify.sanitize(marked.parseInline(props.advertisement.content, { async: false, gfm: true, breaks: true }), {
    ALLOWED_TAGS: ["a", "strong", "em", "del", "code", "br"],
    ALLOWED_ATTR: ["href", "title"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|\/(?!\/)|settings:)/i,
    RETURN_DOM: true,
  }) as HTMLElement;
  for (const link of dom.querySelectorAll<HTMLAnchorElement>("a")) {
    const action = contentLinkAction(link.getAttribute("href") ?? "");
    if (!action) {
      link.replaceWith(...link.childNodes);
    } else if (action.actionType === "web") {
      link.href = action.actionTarget;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.actionType = action.actionType;
      button.dataset.actionTarget = action.actionTarget;
      if (link.title) button.title = link.title;
      button.append(...link.childNodes);
      link.replaceWith(button);
    }
  }
  return dom.innerHTML;
});
const appearanceStyle = computed(() => {
  const appearance = props.placement === "banner" ? props.advertisement.appearance : undefined;
  return {
    "--promotionBackground": appearance?.backgroundColor || undefined,
    "--promotionGradient": appearance?.backgroundEndColor
      ? `linear-gradient(105deg, ${appearance.backgroundColor || "var(--el-bg-color-overlay)"}, ${appearance.backgroundEndColor})`
      : undefined,
    "--promotionText": appearance?.textColor || undefined,
    "--promotionButton": appearance?.buttonColor || undefined,
    "--promotionButtonText": appearance?.buttonTextColor || undefined,
  };
});
const visible = computed(() => props.placement === "banner" || (!!props.advertisement.imageUrl && !imageFailed.value));
const actionAttributes = computed(() => props.advertisement.actionType === "web"
  ? { href: props.advertisement.actionTarget, target: "_blank", rel: "noopener noreferrer" }
  : { type: "button" as const });
const countdown = computed(() => {
  if (!props.advertisement.endsAt) return null;
  const remaining = Math.max(0, Math.ceil((props.advertisement.endsAt - now.value) / 1000));
  return {
    days: String(Math.floor(remaining / 86400)).padStart(2, "0"),
    hours: String(Math.floor(remaining / 3600) % 24).padStart(2, "0"),
    minutes: String(Math.floor(remaining / 60) % 60).padStart(2, "0"),
    seconds: String(remaining % 60).padStart(2, "0"),
  };
});

watch(() => props.advertisement.imageUrl, () => { imageFailed.value = false; });
watch(() => props.advertisement.endsAt, (endsAt, _previous, onCleanup) => {
  now.value = Date.now();
  if (!endsAt || endsAt <= now.value) return;
  const timer = setInterval(() => {
    now.value = Date.now();
    if (now.value >= endsAt) clearInterval(timer);
  }, 1000);
  onCleanup(() => clearInterval(timer));
}, { immediate: true });

function activate(event: MouseEvent) {
  if (props.advertisement.actionType === "web") return;
  event.preventDefault();
  emit("activate", props.advertisement);
}

function contentLinkAction(href: string): Pick<HomeAdvertisement, "actionType" | "actionTarget"> | null {
  if (/[\\\u0000-\u0020\u007f]/.test(href)) return null;
  if (/^https?:\/\//i.test(href) && URL.canParse(href)) {
    const url = new URL(href);
    return url.username || url.password ? null : { actionType: "web", actionTarget: url.href };
  }
  if (/^\/(?!\/)/.test(href)) return { actionType: "path", actionTarget: href };
  const settingsPanel = /^settings:([a-z][a-zA-Z\d]*)$/.exec(href)?.[1];
  return settingsPanel ? { actionType: "settings", actionTarget: settingsPanel } : null;
}

function activateContentLink(event: MouseEvent) {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-action-type]") : null;
  if (!button || !(event.currentTarget instanceof Element) || !event.currentTarget.contains(button)) return;
  const { actionType, actionTarget } = button.dataset;
  if ((actionType === "path" || actionType === "settings") && actionTarget) {
    emit("activate", { ...props.advertisement, actionType, actionTarget });
  }
}
</script>

<style lang="scss" scoped>
.homePromotion {
  position: relative;
  min-width: 0;
  color: var(--promotionText, var(--el-text-color-primary));

  &.banner {
    min-height: 44px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--promotionBackground, var(--el-bg-color-overlay));
    background-image: var(--promotionGradient, none);

    &.imageBanner .bannerContent { width: calc(100% - 88px); padding-block: 1px; }

    .bannerContent {
      display: flex;
      align-items: center;
      justify-content: center;
      width: max-content;
      max-width: min(1200px, calc(100% - 88px));
      min-height: 43px;
      margin: 0 auto;
      padding-block: 8px;
      gap: 14px;

      .bannerImage { display: block; flex: 1 1 0; min-width: 0; width: 0; height: 40px; object-fit: contain; object-position: left center; }
      .promotionImage { display: block; flex-shrink: 0; width: 40px; height: 24px; object-fit: cover; border-radius: var(--ui-radius-small); }
      .promotionCopy {
        display: block;
        min-width: 0;
        line-height: 20px;
        white-space: normal;
        overflow-wrap: anywhere;

        > strong { margin-inline-end: 10px; font-size: 13px; font-weight: 500; }
        .promotionContent {
          font-size: 12px;
          color: var(--promotionText, var(--el-text-color-secondary));

          :deep(a), :deep(button) {
            padding: 0;
            border: 0;
            border-radius: var(--ui-radius-small);
            background: none;
            color: inherit;
            font: inherit;
            max-width: 100%;
            text-align: inherit;
            text-decoration: underline;
            text-underline-offset: 3px;
            cursor: pointer;

            &:hover { text-decoration-thickness: 2px; }
            &:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
          }
          :deep(strong) { font-weight: 600; }
          :deep(code) { padding: 0 3px; border-radius: var(--ui-radius-small); background: color-mix(in srgb, currentColor 8%, transparent); }
        }
      }
      .countdown {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;

        > span {
          display: grid;
          place-items: center;
          min-width: 26px;
          height: 26px;
          padding: 0 4px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--ui-radius-small);
          background: color-mix(in srgb, var(--promotionText, var(--el-text-color-primary)) 6%, transparent);
          color: inherit;
        }
        i { font-style: normal; opacity: 0.5; }
      }
      .promotionAction {
        --el-button-bg-color: var(--promotionButton, var(--el-color-primary));
        --el-button-border-color: var(--promotionButton, var(--el-color-primary));
        --el-button-text-color: var(--promotionButtonText, var(--el-color-white));
        --el-button-hover-bg-color: var(--promotionButton, var(--el-color-primary-light-3));
        --el-button-hover-border-color: var(--promotionButton, var(--el-color-primary-light-3));
        --el-button-hover-text-color: var(--promotionButtonText, var(--el-color-white));
        --el-button-active-bg-color: var(--promotionButton, var(--el-color-primary-dark-2));
        --el-button-active-border-color: var(--promotionButton, var(--el-color-primary-dark-2));
        --el-button-active-text-color: var(--promotionButtonText, var(--el-color-white));
        flex-shrink: 0;
        max-width: min(180px, 40vw);
        text-decoration: none;
        overflow: hidden;

        :deep(> span) { min-width: 0; gap: 4px; }
        .actionText { overflow: hidden; text-overflow: ellipsis; }
        svg { flex-shrink: 0; }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      }
    }
    .closeButton {
      position: absolute;
      top: 50%;
      inset-inline-end: 8px;
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      padding: 0;
      transform: translateY(-50%);
      border: 0;
      border-radius: var(--ui-radius-small);
      background: transparent;
      color: var(--promotionText, var(--el-text-color-secondary));
      cursor: pointer;

      &:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
    }
  }

  &.sidebar {
    margin-bottom: 12px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--ui-radius);
    background: var(--el-bg-color-overlay);

    .promotionImageLink {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;

      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -3px; }
      .promotionImage { display: block; width: 100%; height: auto; }
    }
  }

  @media (max-width: 600px) {
    &.banner .bannerContent {
      justify-content: flex-start;
      width: calc(100% - 56px);
      max-width: none;
      margin-inline: 12px 44px;
      gap: 8px;

      .bannerImage { object-fit: cover; }
      .promotionImage, .countdown { display: none; }
    }
    &.banner:not(.imageBanner) .bannerContent {
      flex-wrap: wrap;

      .promotionCopy { flex: 1 1 100%; }
    }
    &.banner.imageBanner .bannerContent { width: calc(100% - 56px); }
  }
}
</style>
