<template>
  <el-dialog v-model="visible" title="镜头分析报告" width="min(1040px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose>
    <div class="analysisReport nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
      <div class="reportToolbar">
        <div class="reportFacts">
          <span class="shotCount"><icon-movie :size="16" />{{ result.scenes.length }} 个镜头</span>
          <span><icon-clock :size="15" />{{ formatSceneTime(result.duration) }}</span>
          <span>{{ result.width }} × {{ result.height }}</span>
          <span v-if="result.audio"><icon-wave-sine :size="15" />原音轨</span>
        </div>
        <el-button v-if="manifestUrl" class="downloadButton" tag="a" :href="manifestUrl" download="sceneManifest.json" :icon="IconDownload" text size="small">下载清单</el-button>
      </div>
      <el-alert v-if="manifestError" :title="manifestError" type="error" :closable="false" showIcon />
      <el-alert v-if="result.ai?.overviewError" :title="`全片总结失败：${result.ai.overviewError}`" type="warning" :closable="false" showIcon />
      <el-tabs v-model="activeTab" class="reportTabs" :class="{ singleView: !result.overview }">
        <el-tab-pane label="镜头明细" name="scenes">
          <div class="sceneLayout">
            <el-scrollbar class="sceneNavigation" height="var(--sceneListHeight, min(56vh, 540px))">
              <nav class="sceneList" aria-label="镜头列表">
                <button
                  v-for="scene in result.scenes"
                  :key="scene.index"
                  class="sceneItem"
                  :class="{ selected: selectedScene?.index === scene.index }"
                  type="button"
                  :aria-pressed="selectedScene?.index === scene.index"
                  :aria-label="`查看镜头 S${String(scene.index).padStart(2, '0')}`"
                  @click="selectedIndex = scene.index">
                  <span class="sceneItemHeading"><span class="sceneNumber">S{{ String(scene.index).padStart(2, '0') }}</span><span class="sceneDuration">{{ (scene.end - scene.start).toFixed(2) }} 秒</span></span>
                  <span class="sceneRange">{{ formatSceneTime(scene.start) }} – {{ formatSceneTime(scene.end) }}</span>
                  <span v-if="scene.annotation" class="sceneCaption">{{ scene.annotation.description }}</span>
                </button>
              </nav>
            </el-scrollbar>
            <el-scrollbar ref="detailScroll" class="sceneDetailScroll" height="var(--sceneDetailHeight, min(56vh, 540px))">
              <div v-if="selectedScene" class="sceneDetail" :class="{ hasAnnotation: !!selectedScene.annotation }">
                <div class="sceneHeading">
                  <div class="sceneTitle">
                    <h3>镜头 S{{ String(selectedScene.index).padStart(2, '0') }}</h3>
                    <span>{{ formatSceneTime(selectedScene.start) }} – {{ formatSceneTime(selectedScene.end) }}</span>
                  </div>
                  <el-radio-group v-if="selectedScene.image && selectedScene.video" v-model="previewKind" size="small" aria-label="镜头预览类型">
                    <el-radio-button value="image">关键帧</el-radio-button>
                    <el-radio-button value="video">视频片段</el-radio-button>
                  </el-radio-group>
                </div>
                <div v-if="previewFile" class="previewStage">
                  <p v-if="previewError" class="previewMessage" role="alert">{{ previewError }}</p>
                  <img v-else-if="previewUrl && previewFile.mimeType === 'image/jpeg'" :key="previewUrl" :src="previewUrl" :alt="`镜头 S${String(selectedScene.index).padStart(2, '0')} 关键帧`" @error="previewError = '关键帧无法预览，文件可能已被移动或删除'" />
                  <video v-else-if="previewUrl" ref="previewVideo" :key="previewUrl" :src="previewUrl" controls playsinline preload="metadata" :aria-label="`镜头 S${String(selectedScene.index).padStart(2, '0')} 视频片段`" @error="previewError = '视频片段无法预览，文件可能已被移动或删除'" />
                  <p v-else class="previewMessage" role="status">正在读取画面…</p>
                </div>
                <div v-if="selectedScene.annotation" class="sceneAnnotation">
                  <div class="annotationFacts">
                    <span>{{ selectedScene.annotation.shotSize }}</span>
                    <span>{{ selectedScene.annotation.cameraAngle }}</span>
                  </div>
                  <p class="sceneDescription">{{ selectedScene.annotation.description }}</p>
                  <div class="movementDetail"><span class="detailLabel">镜头运动</span><p>{{ selectedScene.annotation.movement }}</p></div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="result.overview" label="整段分析" name="overview">
          <el-scrollbar height="min(56vh, 540px)">
            <div class="overviewBody">
              <section class="overviewLead">
                <h3><icon-sparkles :size="17" />整体概述</h3>
                <p>{{ result.overview.summary }}</p>
              </section>
              <section class="overviewSection"><h3>叙事结构</h3><p>{{ result.overview.narrative }}</p></section>
              <section class="overviewSection"><h3>节奏分析</h3><p>{{ result.overview.rhythm }}</p></section>
              <section class="overviewSection"><h3>剪辑方式</h3><p>{{ result.overview.editing }}</p></section>
              <section v-if="result.overview.focusResponse" class="overviewSection">
                <h3>分析重点</h3>
                <div><p v-if="result.ai?.focus" class="focusQuestion">{{ result.ai.focus }}</p><p>{{ result.overview.focusResponse }}</p></div>
              </section>
            </div>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElAlert, ElButton, ElDialog, ElRadioButton, ElRadioGroup, ElScrollbar, ElTabPane, ElTabs } from "element-plus";
import { IconClock, IconDownload, IconMovie, IconSparkles, IconWaveSine } from "@tabler/icons-vue";
import { useNodeFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/values";
import type { AnalysisResult } from "./videoAnalysis";
import { formatSceneTime } from "./resultNodes";

const props = defineProps<{ result: AnalysisResult }>();
const visible = defineModel<boolean>({ required: true });
const files = useNodeFiles();
const activeTab = ref("scenes");
const selectedIndex = ref(0);
const previewKind = ref("image");
const previewVideo = ref<HTMLVideoElement>();
const detailScroll = ref<InstanceType<typeof ElScrollbar>>();
const selectedScene = computed(() => props.result.scenes.find(scene => scene.index === selectedIndex.value) ?? props.result.scenes[0]);
const previewFile = computed<NodeMediaValue | undefined>(() => {
  const scene = selectedScene.value;
  if (!visible.value || activeTab.value !== "scenes" || !scene) return;
  if (scene.video && (previewKind.value === "video" || !scene.image)) return { url: scene.video, mimeType: "video/mp4" };
  if (scene.image) return { url: scene.image, mimeType: "image/jpeg" };
});
const previewError = ref("");
const manifestError = ref("");
watch(previewFile, () => {
  previewVideo.value?.pause();
  previewError.value = "";
}, { flush: "sync" });
onBeforeUnmount(() => previewVideo.value?.pause());
// ACT: 仅加载当前选中的画面，切换镜头或关闭报告时由宿主释放文件 URL。
const previewUrl = files.useFileUrl(previewFile, () => { previewError.value = "画面读取失败，文件可能已被移动或删除"; });
const manifestUrl = files.useFileUrl(
  computed(() => visible.value ? { url: props.result.manifest, mimeType: "application/json" } : undefined),
  () => { manifestError.value = "镜头清单读取失败，文件可能已被移动或删除"; },
);
watch(selectedScene, scene => {
  if (scene && !(previewKind.value === "image" ? scene.image : scene.video)) previewKind.value = scene.image ? "image" : "video";
  detailScroll.value?.setScrollTop(0);
});
watch(visible, open => {
  if (!open) return;
  selectedIndex.value = props.result.scenes[0]?.index ?? 0;
  previewKind.value = "image";
  activeTab.value = props.result.overview ? "overview" : "scenes";
  manifestError.value = "";
});
watch(() => props.result.overview, overview => {
  if (!overview && activeTab.value === "overview") activeTab.value = "scenes";
});
</script>

<style scoped lang="scss">
.analysisReport {
  color: var(--el-text-color-regular);

  .reportToolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin: 0 0 12px;

    .reportFacts {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 18px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      font-variant-numeric: tabular-nums;

      span { display: inline-flex; align-items: center; gap: 6px; }
      .shotCount { color: var(--el-text-color-primary); font-weight: 500; }
    }

    .downloadButton { margin: 0; text-decoration: none; }
  }

  > .el-alert { margin-bottom: 12px; }

  .reportTabs {
    :deep(.el-tabs__header) { margin-bottom: 16px; }
    :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--el-border-color-lighter); }
    &.singleView :deep(.el-tabs__header) { display: none; }
  }

  .sceneLayout {
    display: grid;
    grid-template-columns: 214px minmax(0, 1fr);
    gap: 20px;

    .sceneNavigation {
      border-right: 1px solid var(--el-border-color-lighter);

      .sceneList {
        display: grid;
        align-content: start;
        gap: 6px;
        padding-right: 12px;

        .sceneItem {
          min-width: 0;
          padding: 12px 10px;
          border: 1px solid transparent;
          border-radius: var(--el-border-radius-base);
          background: transparent;
          color: var(--el-text-color-primary);
          font: inherit;
          text-align: left;
          cursor: pointer;

          &:hover { background: var(--el-fill-color-light); }
          &.selected { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
          &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }

          .sceneItemHeading {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            .sceneNumber { font-size: 13px; font-weight: 600; }
            .sceneDuration { font-size: 12px; color: var(--el-text-color-secondary); }
          }
          .sceneRange { display: block; margin-top: 6px; font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
          .sceneCaption { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 8px; font-size: 12px; color: var(--el-text-color-regular); }
        }
      }
    }

    .sceneDetailScroll { min-width: 0; }

    .sceneDetail {
      padding: 0 12px 4px 0;

      .sceneHeading {
        display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 2px 0 16px;
        .sceneTitle {
          h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
          > span { color: var(--el-text-color-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
        }
      }

      .previewStage {
        display: flex;
        align-items: center;
        justify-content: center;
        height: min(460px, calc(56vh - 72px));
        min-height: 160px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--ui-radius-large, 12px);
        background: var(--el-fill-color-light);

        img, video { display: block; width: 100%; height: 100%; object-fit: contain; }
        .previewMessage { margin: 0; padding: 24px; text-align: center; color: var(--el-text-color-secondary); font-size: 13px; }
      }

      &.hasAnnotation .previewStage { height: clamp(180px, 34vh, 340px); }

      .sceneAnnotation {
        margin-top: 20px;
        overflow-wrap: anywhere;

        .annotationFacts {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
          span { padding: 4px 8px; border-radius: var(--el-border-radius-small); background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; }
        }
        p { margin: 0; font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
        .movementDetail {
          display: grid; grid-template-columns: 64px minmax(0, 1fr); align-items: baseline; gap: 12px;
          margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter);
          .detailLabel { font-size: 12px; color: var(--el-text-color-secondary); }
        }
      }
    }
  }

  .overviewBody {
    padding: 2px 16px 8px 0;
    overflow-wrap: anywhere;

    h3 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
    p { margin: 0; font-size: 14px; line-height: 1.9; white-space: pre-wrap; }
    .overviewLead {
      padding: 0 0 24px;
      h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    }
    .overviewSection {
      display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 20px;
      padding: 22px 0; border-top: 1px solid var(--el-border-color-lighter);
      h3 { padding-top: 4px; }
      .focusQuestion { margin-bottom: 12px; padding-left: 12px; border-left: 2px solid var(--el-border-color); color: var(--el-text-color-secondary); }
    }
  }

  @media (max-width: 640px) {
    .sceneLayout {
      grid-template-columns: 144px minmax(0, 1fr);
      gap: 12px;
      .sceneNavigation .sceneList {
        padding-right: 8px;
        .sceneItem { padding: 10px 8px; .sceneRange { white-space: normal; line-height: 1.6; } }
      }
      .sceneDetail { padding-right: 8px; .sceneHeading { margin-top: 0; } }
    }
    .overviewBody .overviewSection { grid-template-columns: 1fr; gap: 10px; }
  }

  @media (max-width: 520px) {
    --sceneListHeight: 112px;
    --sceneDetailHeight: min(44vh, 380px);

    .sceneLayout {
      grid-template-columns: minmax(0, 1fr);
      .sceneNavigation {
        border-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        .sceneList { grid-template-columns: repeat(auto-fit, minmax(136px, 1fr)); padding: 0 8px 10px 0; }
      }
      .sceneDetail .previewStage { height: min(300px, calc(44vh - 72px)); }
    }
  }
}
</style>
