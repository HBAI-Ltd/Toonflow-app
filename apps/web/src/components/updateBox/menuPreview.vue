<template>
  <div class="menuPreview" role="img" :aria-label="translate(slideshow.label)">
    <div class="menuPath" aria-hidden="true">
      <span>图片</span><icon-chevron-right :size="12" /><span>更多</span>
      <icon-chevron-right :size="12" /><span>{{ translate(slideshow.group) }}</span>
    </div>
    <div class="toolWorkspace" inert>
      <ul class="toolChoices"><cascadeMenuItems :items="menuItems" /></ul>
      <div class="toolSettings">
        <p>{{ translate(slideshow.label) }}</p>
        <imageSequenceOptions :tool="slideshow" :values="values" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import "element-plus/es/components/input-number/style/css";
import { translate } from "@toonflow/i18n/vue";
import { imageSequenceTools } from "@toonflow/node-image/imageSequenceTools";
import imageSequenceOptions from "@toonflow/node-image/imageSequenceOptions";
import cascadeMenuItems from "@toonflow/node-shared/cascadeMenuItems";

const slideshow = imageSequenceTools.find(tool => tool.id === "image-slideshow")!;
const still = imageSequenceTools.find(tool => tool.id === "image-to-video")!;
const menuItems = computed(() => [
  { id: still.id, type: still.id, icon: still.icon, label: translate(still.label) },
  { id: slideshow.id, type: slideshow.id, icon: slideshow.icon, label: translate(slideshow.label) },
]);
const values = Object.fromEntries((slideshow.fields ?? []).map(field => [field.key, field.value]));
</script>

<style scoped lang="scss">
.menuPreview {
  container-type: inline-size;
  max-width: 540px;

  .menuPath {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin-bottom: 8px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    svg { flex: none; }
  }

  .toolWorkspace {
    display: grid;
    grid-template-columns: minmax(0, .8fr) minmax(0, 1.7fr);
    align-items: start;
    gap: 10px;

    .toolChoices, .toolSettings {
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--el-border-radius-base);
      background: var(--el-bg-color-overlay);
    }
    .toolChoices {
      margin: 0;
      padding: 4px 0;
      list-style: none;
      :deep([data-menu-id="image-slideshow"]) {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      :deep(.menuButton) { max-width: none; text-align: start; }
    }
    .toolSettings {
      padding: 10px 12px;
      p { margin: 0 0 8px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
      :deep(.sequenceOptions) { display: grid; gap: 8px; color: var(--el-text-color-regular); }
    }
  }

  &:dir(rtl) .menuPath svg { transform: scaleX(-1); }
  @container (max-width: 450px) {
    .toolWorkspace { grid-template-columns: 1fr; }
  }
}
</style>
