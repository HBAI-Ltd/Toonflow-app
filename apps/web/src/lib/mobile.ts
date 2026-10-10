import { computed, ref } from "vue";
import axios from "axios";
import { t, translate } from "@toonflow/i18n/vue";
import { isMobile, isDesktop, isRemoteConnection } from "./platform";

type MobileConnection = { mode: "local" | "remote"; name?: string; url?: string; online?: boolean | null; appVersion?: string; remoteAppVersion?: string };

export const mobileConnection = ref<MobileConnection>({ mode: isRemoteConnection ? "remote" : "local" });
export const deviceHubEnabled = ref(false);
export const deviceConnectionSupported = ref(true);
export function getDeviceVersionWarning(appVersion?: string, remoteAppVersion?: string) {
  if (!appVersion || !remoteAppVersion) return t`无法确认设备版本（本机：${appVersion || translate("未知")}，对方：${remoteAppVersion || translate("未知")}），建议双方升级到同一版本。`;
  return appVersion === remoteAppVersion ? "" : t`设备版本不一致（本机：${appVersion}，对方：${remoteAppVersion}），可能影响部分功能，建议双方升级到同一版本。`;
}
export const mobileConnectionVersionWarning = computed(() => mobileConnection.value.mode === "remote" && mobileConnection.value.online === true
  ? getDeviceVersionWarning(mobileConnection.value.appVersion, mobileConnection.value.remoteAppVersion) : "");
export const mobileConnectionLabel = computed(() => {
  if (mobileConnection.value.mode !== "remote") return deviceHubEnabled.value ? translate("设备互联 · 共享中") : translate("设备互联");
  if (mobileConnection.value.online && mobileConnectionVersionWarning.value) {
    return mobileConnection.value.appVersion && mobileConnection.value.remoteAppVersion ? translate("已连接设备 · 版本不一致") : translate("已连接设备 · 版本待确认");
  }
  return mobileConnection.value.online === true ? translate("已连接设备") : mobileConnection.value.online === false ? translate("连接已断开") : translate("正在连接设备");
});
let connectionRequest: Promise<MobileConnection> | undefined;
let connectionTimer: ReturnType<typeof setTimeout> | undefined;

export async function refreshMobileConnection() {
  if (connectionRequest) return connectionRequest;
  clearTimeout(connectionTimer);
  connectionRequest = (async () => {
    const request = new AbortController();
    const requestTimeout = setTimeout(() => request.abort(), 8000);
    try {
      let data: MobileConnection = { mode: "local" };
      if (deviceConnectionSupported.value) {
        const response = await fetch("/api/connection/connection", { cache: "no-store", signal: request.signal });
        if (response.status === 404 && !isMobile && !isDesktop) deviceConnectionSupported.value = false;
        else {
          if (!response.ok) throw new Error("无法读取设备连接状态，请重试");
          data = await response.json() as MobileConnection;
        }
      }
      if (data.mode !== "local" && data.mode !== "remote") throw new Error("设备连接状态无效，请重试");
      mobileConnection.value = data;
      if (!isMobile && data.mode === "local") {
        const status = await fetch("/api/mobileLink/status", { headers: { "x-toonflow-mobile-link": "1" }, cache: "no-store", signal: request.signal });
        if (status.ok) {
          const body = await status.json() as { code?: number; data?: { enabled?: boolean; hubEnabled?: boolean } };
          if (body.code !== 200) throw new Error("无法读取共享状态，请重试");
          deviceHubEnabled.value = (body.data?.hubEnabled ?? body.data?.enabled) === true;
        } else if (status.status !== 403) throw new Error("无法读取共享状态，请重试");
      } else deviceHubEnabled.value = false;
      return data;
    } catch (cause) {
      if (mobileConnection.value.mode === "remote") mobileConnection.value = { ...mobileConnection.value, online: false };
      throw cause;
    } finally {
      clearTimeout(requestTimeout);
      connectionRequest = undefined;
      if (!document.hidden) connectionTimer = setTimeout(() => { void refreshMobileConnection().catch(() => {}); }, 5000);
    }
  })();
  return connectionRequest;
}

export async function changeDeviceConnection(action: "connect" | "disconnect", body?: { qrCode: string } | { url: string; code: string }) {
  if (action === "connect") {
    await refreshMobileConnection();
    if (deviceHubEnabled.value) throw new Error("请先在设置 → 设备互联中关闭“允许其他设备连接”");
  }
  if (!deviceConnectionSupported.value) throw new Error("请使用 Toonflow 桌面端或移动客户端连接其他设备");
  const { data } = await axios.post<{ restart: "mobile" | "host"; message?: string }>(`/api/connection/${action}`, body ?? {}, { headers: { "x-toonflow-workspace": "1" } });
  if (data?.restart !== "mobile" && data?.restart !== "host") throw new Error(data?.message || "设备未返回有效的切换方式，请重试");
  if (data.restart === "mobile") window.location.href = "toonflow://restart";
}

document.addEventListener("visibilitychange", () => {
  clearTimeout(connectionTimer);
  if (!document.hidden) void refreshMobileConnection().catch(() => {});
});
window.addEventListener("pagehide", () => clearTimeout(connectionTimer));
window.addEventListener("pageshow", () => { void refreshMobileConnection().catch(() => {}); });
void refreshMobileConnection().catch(() => {});
