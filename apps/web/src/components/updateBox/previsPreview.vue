<template>
  <div class="previsPreview" role="img" :aria-label="translate(labels[kind])">
    <div v-if="kind === 'sceneComposer'" class="composerPanel" inert><sceneComposer hideModelPicker /></div>
    <div v-else-if="kind === 'viewfinder'" class="cameraPanel" inert>
      <div class="cameraStrip"><cameraViewfinder name="" color="#8d9399" :focalLength="35" rangeLabel="" storageKey="" hasShot /></div>
      <div class="timelineHeader"><timelineTransport totalLabel="0:10"><span dir="ltr">0:00.0</span></timelineTransport></div>
    </div>
    <div v-else class="assetPanel" inert>
      <div class="shelfHeader">
        <strong>添加素材</strong>
        <el-button size="small"><icon-upload :size="15" />导入 GLB</el-button>
      </div>
      <assetSearchControls :modelValue="translate('中式牌坊')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { markMessages, translate } from "@toonflow/i18n/vue";

defineProps<{ kind: "sceneComposer" | "viewfinder" | "assetSearch" }>();
const labels = markMessages({ sceneComposer: "预演描述", viewfinder: "取景窗", assetSearch: "搜索主素材" });
const sceneComposer = defineAsyncComponent(() => import("@/pages/home/pages/trumanMap/sceneComposer.vue"));
const assetSearchControls = defineAsyncComponent(() => import("@toonflow/node-truman-map/assetSearchControls"));
const cameraViewfinder = defineAsyncComponent(() => import("@toonflow/node-truman-map/cameraViewfinder"));
const timelineTransport = defineAsyncComponent(() => import("@toonflow/node-truman-map/timelineTransport"));
</script>

<style scoped lang="scss">
.previsPreview {
  --studioControlBackground: color-mix(in srgb, var(--el-fill-color) 45%, transparent);
  --studioGlassBackground: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  --studioBorderColor: var(--el-border-color-light);
  --studioShadow: none;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  .composerPanel {
    :deep(.composer) { box-shadow: none; }
  }
  .cameraPanel {
    width: 100%;
    max-width: 390px;
    .cameraStrip {
      // 只取触屏上常显的底部操作区，不挂载场景渲染器。
      position: relative;
      overflow: hidden;
      height: 58px;
      border-radius: var(--ui-radius);
      background: #000;
      :deep(.cameraViewfinder) { width: 100% !important; top: auto !important; bottom: 0; inset-inline: 0 !important; }
      :deep(.pictureActions) {
        opacity: 1;
        transform: none;
        > button { width: 32px; height: 32px; }
      }
    }
    .timelineHeader {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      margin-top: 6px;
      padding: 0 8px;
      border: 1px solid var(--studioBorderColor);
      border-radius: var(--ui-radius);
      background: var(--studioGlassBackground);
      color: var(--el-text-color-primary);
      font-size: 12px;
    }
  }
  .assetPanel {
    max-width: 460px;
    border: 1px solid var(--studioBorderColor);
    border-radius: var(--ui-radius);
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 1.5;
    .shelfHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px 8px;
      strong { font-size: 13px; font-weight: 600; }
      :deep(.el-button > span) { gap: 5px; }
    }
  }
}
</style>
