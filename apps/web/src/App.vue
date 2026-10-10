<template>
  <el-config-provider :locale="elementLocale">
    <config-provider :globalConfig="tdesignLocale">
      <router-view v-slot="{ Component: currentComponent }">
        <transition name="el-fade-in">
          <component :is="currentComponent" />
        </transition>
      </router-view>
      <ffmpegRequired />
      <updateBox
        v-if="updateBoxBuild && !installFailure"
        v-model="updateBoxVisible"
        :version="updateBoxBuild.version"
        :buildCode="updateBoxBuild.hash"
        @opened="rememberUpdateBox"
        @close="rememberUpdateBox" />
      <el-dialog v-if="installFailure" v-model="installFailureVisible" title="更新未成功" width="min(520px, 92vw)" alignCenter appendToBody :closeOnClickModal="false">
        <div v-if="installFailure" class="installFailureContent">
          <p class="failureMessage">{{ installFailure.message }}</p>
          <dl class="failureVersions">
            <div>
              <dt>当前运行版本</dt>
              <dd><strong>{{ installFailure.currentVersion ? `v${installFailure.currentVersion}` : "未知版本" }}</strong><code>{{ installFailure.currentHash || "构建标识未知" }}</code></dd>
            </div>
            <div>
              <dt>本次更新目标</dt>
              <dd><strong>{{ installFailure.targetVersion ? `v${installFailure.targetVersion}` : "未知版本" }}</strong><code>{{ installFailure.targetHash || "构建标识未知" }}</code></dd>
            </div>
          </dl>
          <p class="failureHint">请前往 GitHub 最新发布页，选择适合当前系统的完整安装包，关闭客户端后重新安装。</p>
        </div>
        <template #footer>
          <el-button @click="installFailureVisible = false">稍后</el-button>
          <el-button tag="a" type="primary" :href="installFailure.downloadUrl" target="_blank" rel="noopener noreferrer">前往下载页</el-button>
        </template>
      </el-dialog>
    </config-provider>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch, watchEffect } from "vue";
import { ElMessage, useZIndex } from "element-plus";
import { elementLocales } from "@toonflow/i18n/elementPlus";
import { ConfigProvider, type GlobalConfigProvider } from "tdesign-vue-next";
import tdesignZhCn from "tdesign-vue-next/es/locale/zh_CN";
import tdesignZhTw from "tdesign-vue-next/es/locale/zh_TW";
import tdesignEn from "tdesign-vue-next/es/locale/en_US";
import tdesignJa from "tdesign-vue-next/es/locale/ja_JP";
import tdesignRu from "tdesign-vue-next/es/locale/ru_RU";
import tdesignKo from "tdesign-vue-next/es/locale/ko_KR";
import tdesignAr from "tdesign-vue-next/es/locale/ar_KW";
import { locale } from "@toonflow/i18n/vue";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { chatLocale } from "@/lib/i18n";
import { isMobile, isDesktop } from "@/lib/platform";
import { saveSettings, settings, uiSettings } from "@/stores/settings";
import { desktopUpdateSnapshot, stopDesktopUpdateObservation } from "@/stores/desktopUpdate";
import { useMcpControl } from "@/lib/mcpControl";
import ffmpegRequired from "@/components/settings/ffmpegRequired.vue";
import updateBox from "@/components/updateBox.vue";
import "element-plus/theme-chalk/dark/css-vars.css";

useMcpControl();

// ACT: TDesign 缺少的语言使用英语基底，聊天控件由应用字典补齐。
const tdesignLocales = {
  "zh-CN": tdesignZhCn, "zh-TW": tdesignZhTw, en: tdesignEn, ja: tdesignJa, ru: tdesignRu, vi: tdesignEn, th: tdesignEn, ko: tdesignKo, hi: tdesignEn,
  id: tdesignEn, ms: tdesignEn, fil: tdesignEn, bn: tdesignEn, ur: tdesignEn, ta: tdesignEn, te: tdesignEn, mr: tdesignEn, pa: tdesignEn, ar: tdesignAr, fa: tdesignEn, tr: tdesignEn,
};
const elementLocale = computed(() => elementLocales[locale.value]);
// ACT: TDesign 自带语言包声明为 readonly，而 ConfigProvider 的只读使用接口声明为可写。
const tdesignLocale = computed(() => ({ ...tdesignLocales[locale.value], chat: chatLocale.value }) as unknown as GlobalConfigProvider);

const updateBoxVisible = ref(false);
const updateBoxBuild = shallowRef<{ version: string; hash: string }>();
const shownUpdateBuilds = new Set<string>();
const installFailureVisible = ref(false);
const installFailure = shallowRef<updateSnapshot["installFailure"]>();
const shownInstallAttempts = new Set<string>();

watch(desktopUpdateSnapshot, snapshot => {
  if (!isDesktop || !snapshot) return;
  if (snapshot.installFailure) {
    installFailure.value = snapshot.installFailure;
    updateBoxVisible.value = false;
    const attemptId = snapshot.installFailure.attemptId;
    if (shownInstallAttempts.has(attemptId)) return;
    shownInstallAttempts.add(attemptId);
    // ACT: 同一 WebView 刷新后仍不重复提醒；退出客户端后新会话可再次提醒。
    try {
      const key = `desktopUpdateFailure:${attemptId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* 存储不可用时仍按当前页面去重。 */ }
    installFailureVisible.value = true;
    return;
  }
  if (!snapshot.version || !snapshot.hash || snapshot.channel === "dev") return;
  if (installFailure.value) {
    if (snapshot.error || snapshot.updating || snapshot.version !== installFailure.value.targetVersion || snapshot.hash !== installFailure.value.targetHash) return;
    installFailure.value = undefined;
    installFailureVisible.value = false;
  }
  const buildKey = `${snapshot.version}:${snapshot.hash}`;
  const seenBuilds = settings.value.updateBoxSeenBuilds;
  if (shownUpdateBuilds.has(buildKey) || Array.isArray(seenBuilds) && seenBuilds.includes(buildKey)) return;
  shownUpdateBuilds.add(buildKey);
  updateBoxBuild.value = { version: snapshot.version, hash: snapshot.hash };
  updateBoxVisible.value = true;
}, { immediate: true });

function rememberUpdateBox() {
  if (!updateBoxBuild.value) return;
  const buildKey = `${updateBoxBuild.value.version}:${updateBoxBuild.value.hash}`;
  // ACT: 桌面端启动端口会变化，复用应用设置；展示完成或提前关闭时记录，保存队列内去重。
  void saveSettings(current => {
    const seenBuilds = Array.isArray(current.updateBoxSeenBuilds) ? current.updateBoxSeenBuilds.filter(value => typeof value === "string") : [];
    return seenBuilds.includes(buildKey) ? undefined : { updateBoxSeenBuilds: [...seenBuilds, buildKey] };
  }).catch(() => { ElMessage.warning("更新说明的展示记录保存失败，下次启动时可能再次显示。"); });
}

function preventPageZoom(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) event.preventDefault();
}
function preventPageZoomShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && ["+", "=", "-", "0"].includes(event.key)) event.preventDefault();
}
// 仅取消浏览器默认缩放，继续传递事件供 Vue Flow 缩放画布。
window.addEventListener("wheel", preventPageZoom, { capture: true, passive: false });
// 画布在捕获阶段先处理自己的快捷键，再在冒泡阶段取消浏览器缩放。
window.addEventListener("keydown", preventPageZoomShortcut);
onBeforeUnmount(() => {
  stopDesktopUpdateObservation();
  window.removeEventListener("wheel", preventPageZoom, true);
  window.removeEventListener("keydown", preventPageZoomShortcut);
});

const { currentZIndex } = useZIndex();
watchEffect(() => document.documentElement.style.setProperty("--markdown-tooltip-z-index", String(currentZIndex.value + 1)));

watchEffect(() => {
  if (!isMobile) return;
  // ACT: 使用 WebView 视口缩放，保持画布触摸坐标和弹出层在同一坐标系。
  document.querySelector('meta[name="viewport"]')?.setAttribute("content", `width=device-width, initial-scale=${uiSettings.value.mobileScale / 100}`);
});

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const systemDark = ref(systemTheme.matches);
function updateSystemTheme(event: MediaQueryListEvent) {
  systemDark.value = event.matches;
}
systemTheme.addEventListener("change", updateSystemTheme);
onBeforeUnmount(() => systemTheme.removeEventListener("change", updateSystemTheme));

watchEffect(() => {
  const { theme, primaryColor, fontScale, radius } = uiSettings.value;
  const dark = theme === "system" ? systemDark.value : theme === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.setAttribute("theme-mode", dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
  root.style.fontSize = `${(16 * fontScale) / 100}px`;
  root.style.setProperty("--ui-radius", `${radius}px`);
  root.style.setProperty("--el-color-primary", primaryColor);
  for (let level = 1; level <= 9; level++) {
    root.style.setProperty(
      `--el-color-primary-light-${level}`,
      `color-mix(in srgb, ${primaryColor} ${100 - level * 10}%, ${dark ? "#141414" : "#fff"})`
    );
  }
  root.style.setProperty("--el-color-primary-dark-2", `color-mix(in srgb, ${primaryColor} 80%, ${dark ? "#fff" : "#000"})`);
});
</script>

<style lang="scss">
html {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.installFailureContent {
  .failureMessage {
    margin: 0;
    max-height: 160px;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: var(--el-color-danger);
    line-height: 1.7;
  }

  .failureVersions {
    margin: 20px 0;
    padding: 14px;
    display: grid;
    gap: 16px;
    border-radius: var(--ui-radius);
    background: var(--el-fill-color-light);

    > div {
      dt { margin-bottom: 6px; color: var(--el-text-color-secondary); }
      dd {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
        code { font-size: 12px; overflow-wrap: anywhere; }
      }
    }
  }

  .failureHint { margin: 0; line-height: 1.7; }
}

// ACT: RTL 只改变界面阅读方向，画布坐标、代码和技术值保留从左到右。
.vue-flow,
pre,
code,
input[type="url"],
input[type="email"],
input[type="password"],
input[type="number"],
input[inputmode="numeric"],
input[inputmode="decimal"],
.projectPath,
.locationPath {
  direction: ltr;
  unicode-bidi: isolate;
}

// 主题切换圆形扩散动效，坐标由触发点写入 --themeX/--themeY/--themeR。
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  animation: themeReveal 0.4s ease-in forwards;
}

@keyframes themeReveal {
  from {
    clip-path: circle(0 at var(--themeX) var(--themeY));
  }
  to {
    clip-path: circle(var(--themeR) at var(--themeX) var(--themeY));
  }
}

.vue-flow {
  --vf-node-bg: var(--el-bg-color-overlay);
  --vf-node-text: var(--el-text-color-primary);
  --vf-node-color: var(--el-border-color-darker);
  --vf-connection-path: var(--el-text-color-secondary);
  --vf-handle: var(--el-text-color-secondary);

  .vue-flow__minimap {
    background-color: var(--el-bg-color);
  }
}
</style>
