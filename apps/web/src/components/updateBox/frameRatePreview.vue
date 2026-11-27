<template>
  <div class="frameRatePreview" role="img" :aria-label="[label, factors].join(' ')">
    <div class="previewControls" inert>
      <videoScaleOptions :label="label" :options="interpolationFactors" :modelValue="interpolationFactors[0]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import "element-plus/es/components/radio-button/style/css";
import "element-plus/es/components/radio-group/style/css";
import { computed } from "vue";
import { translate } from "@toonflow/i18n/vue";
import videoScaleOptions, { interpolationFactors } from "@toonflow/node-video/videoScaleOptions";

const label = computed(() => translate("每秒画面数"));
const factors = interpolationFactors.map(factor => `${factor}×`).join(" / ");
</script>

<style scoped lang="scss">
.frameRatePreview {
  max-width: 320px;
  margin-block: 8px 12px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ui-radius);
  background: var(--el-fill-color-extra-light);
}
</style>
