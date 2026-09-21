<template>
  <div class="general">
    <section class="settingSection" aria-labelledby="startupTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="startupTitle">启动动画</h3>
          <p class="description">启动时播放动画。关闭可加快启动速度，可能出现闪屏，下次启动生效。</p>
        </div>
        <el-switch
          :modelValue="uiSettings.startupAnimation"
          aria-label="启动动画"
          @change="(value) => updateUiSettings({ startupAnimation: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasCompositingTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasCompositingTitle">画布合成优化</h3>
          <p class="description">优化大量节点时的平移和缩放，可能增加显存占用并导致模糊，立即生效。</p>
        </div>
        <el-switch
          :modelValue="generalSettings.canvasCompositingEnabled"
          aria-label="画布合成优化"
          @change="(value) => updateGeneralSettings({ canvasCompositingEnabled: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasEdgeAnimationTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasEdgeAnimationTitle">节点连线动画</h3>
          <p class="description">选中或拖动节点时，与它直接相连的线条显示流动动画。关闭仍保留高亮，立即生效。</p>
        </div>
        <el-switch
          :modelValue="generalSettings.canvasEdgeAnimationEnabled"
          aria-label="节点连线动画"
          @change="(value) => updateGeneralSettings({ canvasEdgeAnimationEnabled: value === true })" />
      </div>
    </section>
    <section class="settingSection" aria-labelledby="canvasEdgeColorTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="canvasEdgeColorTitle">节点连线高亮颜色</h3>
          <p class="description">设置选中或拖动节点时，与它直接相连的线条的高亮颜色，立即生效。</p>
        </div>
        <div class="edgeColorControls">
          <el-select
            :modelValue="generalSettings.canvasEdgeColorMode"
            aria-label="节点连线颜色模式"
            @change="(value) => updateGeneralSettings({ canvasEdgeColorMode: value })">
            <el-option label="关闭" value="none" />
            <el-option label="跟随主题色" value="theme" />
            <el-option label="自选颜色" value="custom" />
          </el-select>
          <el-color-picker
            v-if="generalSettings.canvasEdgeColorMode === 'custom'"
            :modelValue="generalSettings.canvasEdgeColor"
            colorFormat="hex"
            aria-label="节点连线自选颜色"
            @change="(value) => updateGeneralSettings({ canvasEdgeColor: value || defaultUiSettings.primaryColor })" />
        </div>
      </div>
    </section>
    <canvasShortcuts />
  </div>
</template>

<script setup lang="ts">
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
