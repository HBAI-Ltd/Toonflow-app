<template>
  <div class="ui">
    <p class="intro">{{ t("appearance.introduction") }}</p>

    <section class="settingSection" aria-labelledby="languageTitle">
      <h3 id="languageTitle">{{ t("appearance.interfaceLanguage") }}</h3>
      <el-select v-model="uiLocale" :aria-label="t('appearance.interfaceLanguage')">
        <el-option label="简体中文" value="zh" />
        <el-option label="English" value="en" />
      </el-select>
    </section>

    <section class="settingSection" aria-labelledby="themeTitle">
      <h3 id="themeTitle">
        <icon-sun-moon :size="18" />
        {{ t("appearance.theme") }}
      </h3>
      <el-radio-group
        class="themeOptions"
        :modelValue="uiSettings.theme"
        :aria-label="t('appearance.theme')"
        @click="captureThemeClickPoint"
        @change="(value) => changeTheme(String(value))">
        <el-radio v-for="item in themes" :key="item.value" :value="item.value" border>
          <span class="themeLabel">
            <component :is="item.icon" :size="22" />
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </el-radio>
      </el-radio-group>
    </section>

    <section class="settingSection" aria-labelledby="colorTitle">
      <div class="settingHeader">
        <h3 id="colorTitle">
          <icon-palette :size="18" />
          {{ t("appearance.accentColor") }}
        </h3>
        <span class="settingValue">{{ uiSettings.primaryColor.toUpperCase() }}</span>
      </div>
      <p class="description">{{ t("appearance.accentColorDescription") }}</p>
      <div class="colorOptions">
        <el-button
          v-for="color in colors"
          :key="color.value"
          class="colorSwatch"
          circle
          :style="{ '--swatchColor': color.value }"
          :aria-label="color.label"
          :aria-pressed="uiSettings.primaryColor.toLowerCase() === color.value"
          :title="color.label"
          @click="updateUiSettings({ primaryColor: color.value })">
          <icon-check v-if="uiSettings.primaryColor.toLowerCase() === color.value" :size="18" />
        </el-button>
        <el-color-picker
          :modelValue="uiSettings.primaryColor"
          colorFormat="hex"
          :aria-label="t('appearance.customAccentColor')"
          @change="changeColor" />
        <span class="description">{{ t("appearance.custom") }}</span>
      </div>
    </section>

    <section class="settingSection" aria-labelledby="fontTitle">
      <div class="settingHeader">
        <h3 id="fontTitle">
          <icon-text-size :size="18" />
          {{ t("appearance.fontSize") }}
        </h3>
        <span class="settingValue">{{ fontScale }}%</span>
      </div>
      <p class="description">{{ t("appearance.fontSizeDescription") }}</p>
      <el-slider
        v-model="fontScale"
        class="settingSlider"
        :min="85"
        :max="125"
        :step="5"
        :marks="fontMarks"
        :aria-label="t('appearance.fontSize')"
        @change="(value) => typeof value === 'number' && updateUiSettings({ fontScale: value })" />
    </section>

    <section class="settingSection" aria-labelledby="radiusTitle">
      <div class="settingHeader">
        <h3 id="radiusTitle">
          <icon-border-radius :size="18" />
          {{ t("appearance.cornerRadius") }}
        </h3>
        <span class="settingValue">{{ radius }} px</span>
      </div>
      <el-slider
        v-model="radius"
        class="settingSlider"
        :min="0"
        :max="16"
        :step="2"
        :marks="radiusMarks"
        :aria-label="t('appearance.cornerRadius')"
        @change="(value) => typeof value === 'number' && updateUiSettings({ radius: value })" />
    </section>

    <el-card class="appearancePreview" shadow="never">
      <div class="previewIcon"><icon-sparkles :size="20" /></div>
      <div class="previewText">
        <strong>{{ t("appearance.previewHeadline") }}</strong>
        <p>{{ t("appearance.previewDescription") }}</p>
      </div>
      <el-tag type="primary" effect="light">{{ t("common.preview") }}</el-tag>
    </el-card>

    <div class="settingsFooter">
      <el-button :icon="IconRestore" @click="updateUiSettings({ ...defaultUiSettings, startupAnimation: uiSettings.startupAnimation })">{{ t("appearance.restoreDefaults") }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "../i18n";
import { computed, nextTick, ref, watchEffect } from "vue";
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconSunMoon,
  IconPalette,
  IconSparkles,
  IconCheck,
  IconRestore,
} from "@tabler/icons-vue";
import { defaultUiSettings, uiLocale, uiSettings, updateUiSettings } from "@/stores/settings";

const fontScale = ref(uiSettings.value.fontScale);
const radius = ref(uiSettings.value.radius);
watchEffect(() => {
  fontScale.value = uiSettings.value.fontScale;
  radius.value = uiSettings.value.radius;
});

const themes = computed(() => [
  { value: "light", label: t("appearance.themeLight"), description: t("appearance.themeLightDescription"), icon: IconSun },
  { value: "dark", label: t("appearance.themeDark"), description: t("appearance.themeDarkDescription"), icon: IconMoon },
  { value: "system", label: t("appearance.themeSystem"), description: t("appearance.themeSystemDescription"), icon: IconDeviceDesktop },
]);
const colors = computed(() => [
  { value: "#409eff", label: t("appearance.colorSkyBlue") },
  { value: "#6366f1", label: t("appearance.colorIris") },
  { value: "#a855f7", label: t("appearance.colorLavender") },
  { value: "#e34b83", label: t("appearance.colorRose") },
  { value: "#e89524", label: t("appearance.colorAmber") },
  { value: "#18a17c", label: t("appearance.colorTeal") },
]);
const fontMarks = computed(() => ({ 85: t("appearance.sizeSmall"), 100: t("common.default"), 125: t("appearance.sizeLarge") }));
const radiusMarks = computed(() => ({ 0: t("appearance.radiusSquare"), 8: t("common.default"), 16: t("appearance.radiusRounded") }));
function changeColor(value: string | null) {
  if (value) updateUiSettings({ primaryColor: value });
}

// ACT: 圆心固定用视口中心，实际点击坐标由 captureThemeClickPoint 在 change 前写入。
let themeClickPoint = { x: innerWidth / 2, y: innerHeight / 2 };
function captureThemeClickPoint(event: MouseEvent) {
  themeClickPoint = { x: event.clientX, y: event.clientY };
}
function changeTheme(value: string) {
  const { x, y } = themeClickPoint;
  const root = document.documentElement;
  root.style.setProperty("--themeX", `${x}px`);
  root.style.setProperty("--themeY", `${y}px`);
  root.style.setProperty("--themeR", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
  if (!document.startViewTransition) {
    updateUiSettings({ theme: value });
    return;
  }
  document.startViewTransition(async () => {
    updateUiSettings({ theme: value });
    await nextTick();
  });
}
</script>

<style lang="scss" scoped>
.ui {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 4px 8px;

  .intro,
  .description {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  .settingSection {
    min-width: 0;

    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .settingHeader {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;

      h3 {
        margin-bottom: 6px;
      }
      .settingValue {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
      }
    }

    .themeOptions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      width: 100%;

      :deep(.el-radio) {
        height: auto;
        margin: 0;
        padding: 14px 10px;
        align-items: flex-start;
        background: var(--el-fill-color-extra-light);

        &.is-checked {
          background: var(--el-color-primary-light-9);
        }
        .el-radio__input {
          margin-top: 4px;
        }
        .el-radio__label {
          min-width: 0;
          padding-left: 8px;
        }
      }

      .themeLabel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        white-space: normal;

        strong {
          font-size: 13px;
          font-weight: 500;
        }
        small {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }
    }

    .colorOptions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 14px;

      .colorSwatch {
        width: 30px;
        height: 30px;
        margin: 0;
        border: 0;
        color: #fff;
        background: var(--swatchColor);

        &[aria-pressed="true"] {
          outline: 2px solid var(--swatchColor);
          outline-offset: 3px;
        }
        &:focus-visible {
          outline: 2px solid var(--el-text-color-primary);
          outline-offset: 3px;
        }
      }
    }

    .settingSlider {
      width: calc(100% - 48px);
      margin: 10px 24px 20px;

      :deep(.el-slider__stop) {
        background-color: var(--el-text-color-secondary);
        box-shadow: 0 0 0 1px var(--el-bg-color-overlay);
      }
    }
  }

  .appearancePreview {
    background: var(--el-fill-color-extra-light);

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
    }
    .previewIcon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
    .previewText {
      flex: 1;
      min-width: 0;
      strong {
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      p {
        margin: 6px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.6;
      }
    }
  }

  .settingsFooter {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 700px) {
    .settingSection .themeOptions {
      grid-template-columns: 1fr;
      .themeLabel {
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
      }
    }
    .appearancePreview {
      :deep(.el-card__body) {
        flex-wrap: wrap;
        padding: 12px;
      }
    }
  }
}
</style>
