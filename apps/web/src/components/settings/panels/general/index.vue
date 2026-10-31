<template>
  <div class="general">
    <ui />
    <section class="settingSection" aria-labelledby="extensionAssociationsTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="extensionAssociationsTitle">默认打开方式</h3>
          <p class="description">按文件类型选择默认扩展。</p>
        </div>
        <el-button size="small" aria-label="设置默认打开方式" @click="associationsVisible = true">设置</el-button>
      </div>
    </section>
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
    <section class="settingSection" aria-labelledby="agentNotificationsTitle">
      <div class="settingHeader">
        <div class="settingInfo">
          <h3 id="agentNotificationsTitle">Agent 通知</h3>
          <p class="description">
            窗口未激活时，Agent 完成回答或等待确认会发送通知。
            <template v-if="!actualPlatform.isDesktop && generalSettings.agentNotificationsEnabled">
              <template v-if="notificationPermission === 'default'">
                浏览器需授权，<el-button class="permissionAction" link type="primary" :loading="requestingPermission" @click="authorizeNotifications">点击授权</el-button>。
              </template>
              <template v-else-if="notificationPermission === 'granted'">浏览器已授权。</template>
              <template v-else-if="notificationPermission === 'denied'">请在浏览器的网站设置中允许通知。</template>
              <template v-else-if="notificationPermission === 'insecure'">浏览器通知需要 HTTPS 或 localhost。</template>
              <template v-else>当前浏览器不支持系统通知。</template>
            </template>
          </p>
        </div>
        <el-switch
          :modelValue="generalSettings.agentNotificationsEnabled"
          aria-label="Agent 通知"
          @change="(value) => updateGeneralSettings({ agentNotificationsEnabled: value === true })" />
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
            <el-option label="不使用高亮颜色" value="none" />
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
    <nodeMenuSettings />
    <canvasShortcuts />
    <extensionAssociationsDialog v-model="associationsVisible" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { defaultUiSettings, generalSettings, uiSettings, updateGeneralSettings, updateUiSettings } from "@/stores/settings";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notification";
import { actualPlatform } from "@/lib/platform";
import ui from "./ui.vue";
import canvasShortcuts from "./canvasShortcuts.vue";
import nodeMenuSettings from "./nodeMenuSettings.vue";
import extensionAssociationsDialog from "./extensionAssociationsDialog.vue";

const associationsVisible = ref(false);
const notificationPermission = ref(getNotificationPermission());
const requestingPermission = ref(false);

function refreshNotificationPermission() {
  notificationPermission.value = getNotificationPermission();
}

async function authorizeNotifications() {
  if (requestingPermission.value) return;
  requestingPermission.value = true;
  try { notificationPermission.value = await requestNotificationPermission(); }
  catch { ElMessage.error("请求通知授权失败，请检查浏览器的网站设置"); }
  finally { requestingPermission.value = false; }
}

onMounted(() => window.addEventListener("focus", refreshNotificationPermission));
onBeforeUnmount(() => window.removeEventListener("focus", refreshNotificationPermission));
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

          .permissionAction {
            padding: 0;
            font-size: inherit;
            vertical-align: baseline;
          }
        }
      }
    }
  }
}
</style>
