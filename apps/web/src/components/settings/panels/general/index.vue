<template>
  <div class="general">
    <section class="settingSection" aria-labelledby="startupTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="startupTitle">{{ t("general.startupAnimation") }}</h3>
          <p class="description">{{ t("general.startupAnimationDescription") }}</p>
        </div>
        <el-switch
          :modelValue="uiSettings.startupAnimation"
          :aria-label="t('general.startupAnimation')"
          @change="(value) => updateUiSettings({ startupAnimation: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasCompositingTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasCompositingTitle">{{ t("general.canvasCompositing") }}</h3>
          <p class="description">{{ t("general.canvasCompositingDescription") }}</p>
        </div>
        <el-switch
          :modelValue="generalSettings.canvasCompositingEnabled"
          :aria-label="t('general.canvasCompositing')"
          @change="(value) => updateGeneralSettings({ canvasCompositingEnabled: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasEdgeAnimationTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasEdgeAnimationTitle">{{ t("general.edgeAnimation") }}</h3>
          <p class="description">{{ t("general.edgeAnimationDescription") }}</p>
        </div>
        <el-switch
          :modelValue="generalSettings.canvasEdgeAnimationEnabled"
          :aria-label="t('general.edgeAnimation')"
          @change="(value) => updateGeneralSettings({ canvasEdgeAnimationEnabled: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasEdgeColorTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasEdgeColorTitle">{{ t("general.edgeHighlightColor") }}</h3>
          <p class="description">{{ t("general.edgeHighlightDescription") }}</p>
        </div>
        <div class="edgeColorControls">
          <el-select
            :modelValue="generalSettings.canvasEdgeColorMode"
            :aria-label="t('general.edgeColorMode')"
            @change="(value) => updateGeneralSettings({ canvasEdgeColorMode: value })">
            <el-option :label="t('common.off')" value="none" />
            <el-option :label="t('general.useThemeColor')" value="theme" />
            <el-option :label="t('general.customColor')" value="custom" />
          </el-select>
          <el-color-picker
            v-if="generalSettings.canvasEdgeColorMode === 'custom'"
            :modelValue="generalSettings.canvasEdgeColor"
            colorFormat="hex"
            :aria-label="t('general.customEdgeColor')"
            @change="(value) => updateGeneralSettings({ canvasEdgeColor: value || defaultUiSettings.primaryColor })" />
        </div>
      </div>
    </section>
    <canvasShortcuts />
  </div>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { defaultUiSettings, generalSettings, uiSettings, updateGeneralSettings, updateUiSettings } from "@/stores/settings";
import canvasShortcuts from "./canvasShortcuts.vue";
</script>

<style lang="scss" scoped>
.general {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px 8px;

  .settingSection {
    .settingHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;

      > .el-switch { flex-shrink: 0; }

      .edgeColorControls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;

        .el-select { width: 140px; }
      }

      .settingInfo {
        min-width: 0;

        h3 {
          margin: 0;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .description {
          margin: 6px 0 0;
          color: var(--el-text-color-secondary);
          font-size: 12px;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
