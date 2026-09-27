<template>
  <el-dialog v-model="visible" :title="t('settings.title')" width="min(1080px, calc(100vw - 32px))" alignCenter appendToBody>
    <div class="settings">
      <aside class="sidebar" :aria-label="t('settings.categories')">
        <template v-for="item in settingsPanels" :key="item.id">
          <h3 v-if="item.groupLabel" class="settingsGroupLabel">{{ item.groupLabel }}</h3>
          <button class="settingsItem" type="button" :aria-label="item.id === 'about' && hasDesktopUpdate ? t('settings.updateAvailableLabel', { panel: item.label }) : item.label" :aria-pressed="activePanel.id === item.id" @click="activePanelId = item.id">
            <el-badge class="panelIcon" isDot :hidden="item.id !== 'about' || !hasDesktopUpdate">
              <component :is="item.icon" :size="18" aria-hidden="true" />
            </el-badge>
            <span>{{ item.label }}</span>
          </button>
        </template>
      </aside>
      <section class="content" :aria-label="activePanel.label" tabindex="0">
        <div v-if="settingsSaveFailed" class="saveError" role="alert">
          <el-alert :title="t('settings.saveFailedTitle')" type="error" :closable="false" showIcon />
          <p>{{ t("settings.saveFailedDescription") }}</p>
          <el-button size="small" :loading="settingsSaving" @click="retrySave">{{ t("common.retry") }}</el-button>
        </div>
        <h2 class="panelTitle">{{ activePanel.label }}</h2>
        <div class="panelContent">
          <transition name="el-fade-in" mode="out-in">
            <keep-alive include="personalization">
              <component
                :is="activePanel.component"
                v-bind="['pluginMarket', 'languageModel', 'mediaModel', 'personalization'].includes(activePanel.id) ? { visible } : {}" />
            </keep-alive>
          </transition>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { t } from "./i18n";
import { saveSettings, settingsSaveFailed, settingsSaving } from "@/stores/settings";
import { hasDesktopUpdate } from "@/stores/desktopUpdate";
import {
  IconPalette,
  IconSettings,
  IconPhotoVideo,
  IconBuildingStore,
  IconInfoCircle,
  IconCode,
  IconShieldLock,
  IconPlugConnected,
  IconUserCog,
  IconSubtitlesAi,
} from "@tabler/icons-vue";

const panelComponents = {
  ui: defineAsyncComponent(() => import("./panels/ui.vue")),
  general: defineAsyncComponent(() => import("./panels/general/index.vue")),
  languageModel: defineAsyncComponent(() => import("./panels/languageModel/index.vue")),
  mediaModel: defineAsyncComponent(() => import("./panels/mediaModel/index.vue")),
  pluginMarket: defineAsyncComponent(() => import("./panels/pluginMarket/index.vue")),
  mcp: defineAsyncComponent(() => import("./panels/mcp/index.vue")),
  personalization: defineAsyncComponent(() => import("./panels/personalization.vue")),
  privacy: defineAsyncComponent(() => import("./panels/privacy.vue")),
  developer: defineAsyncComponent(() => import("./panels/developer/index.vue")),
  about: defineAsyncComponent(() => import("./panels/about.vue")),
};
const settingsPanels = computed(() => [
  { id: "ui", label: t("settings.appearance"), icon: IconPalette, component: panelComponents.ui },
  { id: "general", label: t("settings.general"), icon: IconSettings, component: panelComponents.general },
  {
    id: "languageModel",
    label: t("settings.languageModels"),
    icon: IconSubtitlesAi,
    groupLabel: t("settings.modelsGroup"),
    component: panelComponents.languageModel,
  },
  { id: "mediaModel", label: t("settings.mediaModels"), icon: IconPhotoVideo, component: panelComponents.mediaModel },
  {
    id: "pluginMarket",
    label: t("settings.pluginMarket"),
    icon: IconBuildingStore,
    groupLabel: t("settings.marketGroup"),
    component: panelComponents.pluginMarket,
  },
  { id: "mcp", label: "MCP", icon: IconPlugConnected, groupLabel: t("settings.otherGroup"), component: panelComponents.mcp },
  { id: "personalization", label: t("settings.personalization"), icon: IconUserCog, component: panelComponents.personalization },
  { id: "privacy", label: t("settings.privacy"), icon: IconShieldLock, component: panelComponents.privacy },
  { id: "developer", label: t("settings.developer"), icon: IconCode, component: panelComponents.developer },
  { id: "about", label: t("settings.about"), icon: IconInfoCircle, component: panelComponents.about },
]);
const activePanelId = ref("ui");
const activePanel = computed(() => settingsPanels.value.find(item => item.id === activePanelId.value) ?? settingsPanels.value[0]!);
const visible = defineModel<boolean>({ default: false });
async function retrySave() {
  await saveSettings().catch(() => {});
}
</script>

<style lang="scss" scoped>
.settings {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  height: min(72vh, calc(100dvh - 140px));
  overflow: hidden;

  .sidebar {
    min-height: 0;
    overflow-y: auto;
    padding: 2px;

    .settingsGroupLabel {
      margin: 14px 12px 6px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      font-weight: 400;
      line-height: 1.5;
    }

    .settingsItem {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 4px;
      border: 0;
      border-radius: var(--el-border-radius-base);
      background: transparent;
      color: var(--el-text-color-regular);
      font: inherit;
      text-align: left;
      cursor: pointer;

      .panelIcon { display: inline-flex; }

      &:hover {
        background: var(--el-fill-color-light);
      }

      &[aria-pressed="true"] {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
      }
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0 20px;
    overflow: hidden;

    .saveError {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      :deep(.el-alert) {
        flex: 1;
      }

      p {
        flex: 2;
        margin: 0;
        color: var(--el-color-error);
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .panelTitle {
      flex-shrink: 0;
      margin: 0 0 20px;
      font-size: 18px;
    }

    .panelContent {
      flex: 1;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-left: 5px;
      padding-right: 5px;
      padding-bottom: 50px;

      > :deep(.el-fade-in-enter-active),
      > :deep(.el-fade-in-leave-active) {
        transition-duration: 100ms;
      }
    }
  }

  @media (max-width: 700px) {
    grid-template-columns: 44px minmax(0, 1fr);

    .sidebar {
      .settingsGroupLabel {
        margin: 12px 0 6px;
        text-align: center;
      }

      .settingsItem {
        justify-content: center;
        padding: 12px;
        span {
          display: none;
        }
      }
    }

    .content {
      padding: 0 8px 0 16px;
    }
  }
}
</style>
