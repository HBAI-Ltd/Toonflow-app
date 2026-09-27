import { createApp, h, nextTick } from "vue";
import { ElButton, ElResult } from "element-plus";
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { bindLocale } from "@toonflow/i18n";
import App from "./App.vue";
import "@/assets/main.scss";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/result/style/css";

import router from "@/router";
import { registerDesktopProtocol } from "@/lib/desktopProtocol";
import { t } from "@/lib/i18n";
import { registerDesktopDownloads } from "@/lib/saveFile";
import { registerAnonymousData } from "@/lib/anonymousData";
import { loadSettings, settingsStorage, uiLocale } from "@/stores/settings";
import { checkDesktopUpdate } from "@/stores/desktopUpdate";

const app = createApp(App);
const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const requiresWebView2Update = isDesktop && /Windows/i.test(navigator.userAgent)
  && [Map.groupBy, URL.canParse, Promise.withResolvers].some(method => typeof method !== "function");
let isMounted = false;

async function notifyDesktopReady(failed = false) {
  if (!isDesktop) return;
  const response = await fetch("/api/desktop/ready", {
    method: "POST",
    headers: { "x-toonflow-desktop": "1", "Content-Type": "application/json" },
    body: JSON.stringify({ failed }),
  });
  if (!response.ok) throw new Error((await response.json()).message || t("startup.desktopReadyFailed", { status: response.status }));
}

// ACT: 已安装客户端的自动更新不经过 NSIS；启动时阻止缺少所需 API 的旧 WebView2 进入业务页面。
(requiresWebView2Update
  ? Promise.reject(new Error(t("startup.webView2Outdated")))
  : loadSettings()).then(async () => {
  app.use(createPinia().use(createPersistedState({ storage: settingsStorage })));
  app.onUnmount(bindLocale(uiLocale));
  app.use(router);
  await router.isReady();
  app.onUnmount(registerAnonymousData());
  app.mount("#app");
  isMounted = true;
  if (!isDesktop) return;
  app.onUnmount(registerDesktopProtocol());
  app.onUnmount(registerDesktopDownloads());
  await nextTick();
  // ACT: 隐藏的 WebView 不依赖 requestAnimationFrame；等待首页挂载和页面资源就绪。
  if (document.readyState !== "complete") {
    await new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
  }
  await notifyDesktopReady();
  // ACT: 桌面启动后只静默检查一次；失败留待用户手动重试，不阻塞启动或自动下载。
  void checkDesktopUpdate(true).catch(() => {});
}).catch(async (error) => {
  const messages = {
    initializationLog: t("startup.initializationLog"),
    title: requiresWebView2Update ? t("startup.webView2Title") : t("startup.failedTitle"),
    subTitle: error instanceof Error ? error.message : t("startup.loadFailed"),
    action: requiresWebView2Update ? t("startup.updateWebView2") : t("startup.retry"),
    errorPageLog: t("startup.errorPageLog"),
  };
  console.error(messages.initializationLog, error);
  if (isMounted) app.unmount();
  createApp({
    render: () => h(ElResult, {
      icon: "error",
      title: messages.title,
      subTitle: messages.subTitle,
    }, {
      extra: () => h(ElButton, {
        type: "primary",
        onClick: () => requiresWebView2Update
          ? window.open("https://developer.microsoft.com/microsoft-edge/webview2/#download", "_blank")
          : window.location.reload(),
      }, () => messages.action),
    }),
  }).mount("#app");
  await nextTick();
  // ACT: 错误页也要结束启动动画，但不能消费尚未注册监听的安装请求。
  await notifyDesktopReady(true).catch((error) => console.error(messages.errorPageLog, error));
});
