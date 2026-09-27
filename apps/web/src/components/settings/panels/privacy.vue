<template>
  <div class="privacy">
    <section class="settingSection" aria-labelledby="collectionTitle">
      <div class="settingHeader">
        <h3 id="collectionTitle">{{ t("privacy.analyticsTitle") }}</h3>
        <el-switch
          :modelValue="privacySettings.dataCollectionEnabled"
          :aria-label="t('privacy.analyticsTitle')"
          @change="(value) => settings.privacy = { ...privacySettings, dataCollectionEnabled: value === true }" />
      </div>
      <p class="description">{{ t("privacy.analyticsDescription") }}</p>
    </section>

    <section class="settingSection" aria-labelledby="metricsTitle">
      <h3 id="metricsTitle">{{ t("privacy.collectedDataTitle") }}</h3>
      <dl class="metricList">
        <div v-for="metric in metrics" :key="metric.label" class="metricItem">
          <dt>{{ metric.label }}</dt>
          <dd>{{ metric.description }}</dd>
        </div>
      </dl>
      <p class="description">{{ t("privacy.exclusions") }}</p>
    </section>

    <section class="settingSection" aria-labelledby="anonymousIdTitle">
      <h3 id="anonymousIdTitle">{{ t("privacy.anonymousId") }}</h3>
      <code class="anonymousId">{{ privacySettings.anonymousId || t("privacy.generatedWhenEnabled") }}</code>
    </section>
  </div>
</template>

<script setup lang="ts">
import { t } from "../i18n";
import { computed } from "vue";
import { privacySettings, settings } from "@/stores/settings";

const metrics = computed(() => [
  { label: t("privacy.metricVisits"), description: t("privacy.metricVisitsDescription") },
  { label: t("privacy.metricActivity"), description: t("privacy.metricActivityDescription") },
  { label: t("privacy.metricEnvironment"), description: t("privacy.metricEnvironmentDescription") },
  { label: t("privacy.metricFeatures"), description: t("privacy.metricFeaturesDescription") },
  { label: t("privacy.metricScale"), description: t("privacy.metricScaleDescription") },
  { label: t("privacy.metricAgent"), description: t("privacy.metricAgentDescription") },
]);
</script>

<style lang="scss" scoped>
.privacy {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 4px 8px;

  .settingSection {
    min-width: 0;

    h3 {
      margin: 0 0 12px;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .settingHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      h3 { margin: 0; }
    }

    .description {
      margin: 8px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 13px;
      line-height: 1.6;
    }

    .metricList {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0;

      .metricItem {
        display: grid;
        grid-template-columns: 88px minmax(0, 1fr);
        gap: 12px;
        font-size: 13px;
        line-height: 1.6;

        dt { color: var(--el-text-color-regular); }
        dd { margin: 0; color: var(--el-text-color-secondary); }
      }
    }

    .anonymousId {
      display: block;
      padding: 10px 12px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-fill-color-light);
      color: var(--el-text-color-regular);
      overflow-wrap: anywhere;
      user-select: text;
      font-family: monospace;
      font-size: 12px;
    }
  }
}
</style>
