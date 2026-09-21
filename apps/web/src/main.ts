import { createApp, h, nextTick } from "vue";
import { ElButton, ElResult } from "element-plus";
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import App from "./App.vue";
import "@/assets/main.scss";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/result/style/css";

import router from "@/router";
import { registerDesktopProtocol } from "@/lib/desktopProtocol";
import { registerDesktopDownloads } from "@/lib/saveFile";
import { registerAnonymousData } from "@/lib/anonymousData";
import { loadSettings, settingsStorage } from "@/stores/settings";

const app = createApp(App);
const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
let isMounted = false;

async function notifyDesktopReady(failed = false) {
  if (!isDesktop) return;
  const response = await fetch("/api/desktop/ready", {
    method: "POST",
    headers: { "x-toonflow-desktop": "1", "Content-Type": "application/json" },
    body: JSON.stringify({ failed }),
  });
  if (!response.ok) throw new Error((await response.json()).message || `通知桌面就绪失败（${response.status}）`);
}

loadSettings().then(async () => {
  app.use(createPinia().use(createPersistedState({ storage: settingsStorage })));
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
}).catch(async (error) => {
  console.error("页面初始化失败：", error);
  if (isMounted) app.unmount();
  createApp({
    render: () => h(ElResult, {
      icon: "error",
      title: "启动失败",
      subTitle: error instanceof Error ? error.message : "无法加载应用，请重试。",
    }, {
      extra: () => h(ElButton, { type: "primary", onClick: () => window.location.reload() }, () => "重试"),
    }),
  }).mount("#app");
  await nextTick();
  // ACT: 错误页也要结束启动动画，但不能消费尚未注册监听的安装请求。
  await notifyDesktopReady(true).catch((error) => console.error("显示启动错误页失败：", error));
});
