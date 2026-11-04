import { createApp, h, nextTick, ref, type App } from "vue";
import { ElButton, ElResult } from "element-plus";
import { isRtlLocale } from "@toonflow/i18n";
import "@/assets/main.scss";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/result/style/css";
import "element-plus/theme-chalk/dark/css-vars.css";

import { initializeMultiTenant } from "@/bootstrap/multiTenant";
import { createCreationApp } from "@/bootstrap/creation";
import { actualPlatform } from "@/lib/platform";
import { getMissingBrowserFeatures } from "@/lib/browserCapabilities";
import { publicWeb } from "@/stores/multiTenant";
import { detectLocale, locale, setLocale, translate } from "@toonflow/i18n/vue";

setLocale(detectLocale(navigator.languages));
document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.lang = locale.value;
document.documentElement.dir = isRtlLocale(locale.value) ? "rtl" : "ltr";
let app: App<Element> | undefined;
const requiresWebView2Update = actualPlatform.isDesktop && actualPlatform.isWindows
  && [Map.groupBy, URL.canParse, Promise.withResolvers].some(method => typeof method !== "function");
const requiresMobileWebViewUpdate = actualPlatform.isMobile && getMissingBrowserFeatures().length > 0;
let isMounted = false;

async function notifyDesktopReady(failed = false) {
  if (!actualPlatform.isDesktop || publicWeb.value) return;
  const response = await fetch("/api/desktop/ready", {
    method: "POST",
    headers: { "x-toonflow-desktop": "1", "Content-Type": "application/json", "Accept-Language": locale.value },
    body: JSON.stringify({ failed }),
  });
  if (!response.ok) throw new Error((await response.json()).message || `通知桌面就绪失败（${response.status}）`);
}

// ACT: 已安装客户端的自动更新不经过 NSIS；启动时阻止缺少所需 API 的旧 WebView2 进入业务页面。
async function initialize() {
  if (requiresWebView2Update) throw new Error("当前 Microsoft Edge WebView2 Runtime 版本过旧。请以管理员身份运行微软最新版安装器；若仍提示已安装，请修复 WebView2 或联系管理员检查更新服务。更新完成后，请完全退出 Toonflow 再重新打开。");
  if (requiresMobileWebViewUpdate) throw new Error("当前移动端浏览器内核缺少 Toonflow 所需能力。请更新 Toonflow 和系统浏览器内核；部分系统需要通过系统更新升级。更新完成后，请完全退出并重新打开 Toonflow。");
  const { session, app: tenantApp } = await initializeMultiTenant();
  app = tenantApp ?? await createCreationApp(session);
  app.mount("#app");
  isMounted = true;
  if (!actualPlatform.isDesktop || session.publicWeb) return;
  await nextTick();
  // ACT: 隐藏的 WebView 不依赖 requestAnimationFrame；等待首页挂载和页面资源就绪。
  if (document.readyState !== "complete") {
    await new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
  }
  await notifyDesktopReady();
}

void initialize().catch(async (error) => {
  console.error("页面初始化失败：", error);
  if (isMounted) app?.unmount();
  const disconnecting = ref(false);
  const recoveryError = ref("");
  async function disconnectRemote() {
    if (disconnecting.value) return;
    disconnecting.value = true;
    recoveryError.value = "";
    try {
      const response = await fetch("/api/connection/disconnect", { method: "POST", headers: { "x-toonflow-workspace": "1" } });
      if (!response.ok) throw new Error((await response.json()).message || "切回本机失败，请重试");
      if ((await response.json()).restart === "mobile") window.location.href = "toonflow://restart";
    } catch (cause) {
      recoveryError.value = cause instanceof Error ? cause.message : "切回本机失败，请重试";
      disconnecting.value = false;
    }
  }
  createApp({
    render: () => h(ElResult, {
      icon: "error",
      title: requiresWebView2Update ? translate("需要更新 WebView2") : requiresMobileWebViewUpdate ? "需要更新系统浏览器内核" : translate("启动失败"),
      subTitle: error instanceof Error ? error.message : translate("无法加载应用，请重试。"),
    }, {
      extra: () => [h(ElButton, {
        type: "primary",
        disabled: disconnecting.value,
        onClick: () => requiresWebView2Update
          ? window.open("https://developer.microsoft.com/microsoft-edge/webview2/#download", "_blank")
          : window.location.reload(),
      }, () => requiresWebView2Update ? translate("前往微软官网更新") : translate("重试")),
      actualPlatform.isRemoteConnection ? h(ElButton, { loading: disconnecting.value, onClick: disconnectRemote }, () => translate("断开并独立运行")) : null,
      recoveryError.value ? h("p", { role: "alert" }, recoveryError.value) : null],
    }),
  }).mount("#app");
  await nextTick();
  // ACT: 错误页也要结束启动动画，但不能消费尚未注册监听的安装请求。
  await notifyDesktopReady(true).catch((error) => console.error("显示启动错误页失败：", error));
});
