import { ref } from "vue";

export type AccountUser = { id: string; username: string; role: "admin" | "user"; enabled: boolean; mustChangePassword: boolean; storageLimitBytes: number };
type LoginBundle = { accessToken: string; expiresAt: number | string; user: AccountUser };
export const accountEnabled = ref(false);
export const accountInitialized = ref(false);
export const accountUser = ref<AccountUser>();
const nativeFetch = window.fetch.bind(window);
let accessToken = "";
let expiresAt = 0;
let refreshing: Promise<void> | undefined;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let endingSession = false;
let accountChannel: BroadcastChannel | undefined;
let accountReady = false;

export async function accountRequest<T>(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<T> {
  if (accountEnabled.value && (!path.startsWith("auth/") || path === "auth/password") && Date.now() >= expiresAt - 30000) await refreshAccount();
  const changesSession = method !== "GET" && (path.startsWith("admin/users/") || ["auth/login", "auth/password", "auth/logout"].includes(path));
  return accountEnabled.value && changesSession
    ? navigator.locks.request("toonflowAccountRefresh", () => sendAccountRequest<T>(path, body, method, true))
    : sendAccountRequest<T>(path, body, method);
}

async function verifyAccountSession() {
  const response = await nativeFetch("/api/auth/me", { credentials: "same-origin", cache: "no-store", redirect: "error", headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401) expireAccount();
}

async function sendAccountRequest<T>(path: string, body: unknown, method: string, sessionLocked = false): Promise<T> {
  const response = await nativeFetch(`/api/${path}`, {
    method, credentials: "same-origin", cache: "no-store", redirect: "error",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (response.status === 401 && !path.startsWith("auth/")) {
    if (sessionLocked) await verifyAccountSession();
    else await navigator.locks.request("toonflowAccountRefresh", verifyAccountSession);
  }
  if (!response.ok || result.code !== 200) throw new Error(result.message || "请求失败，请重试");
  if (path === "auth/login" || path === "auth/password") {
    applyLogin(result.data as LoginBundle);
    accountChannel?.postMessage({ type: "login", bundle: result.data });
  }
  if (path.startsWith("admin/users/") && result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
    const bundle = result.data.session as LoginBundle | undefined;
    delete result.data.session;
    if (bundle) {
      applyLogin(bundle);
      accountChannel?.postMessage({ type: "refresh", bundle });
      if (bundle.user.mustChangePassword) expireAccount();
    } else if (result.data.id === accountUser.value?.id && result.data.enabled === false) expireAccount();
  }
  return result.data as T;
}

export function applyLogin(bundle: LoginBundle) {
  accessToken = bundle.accessToken;
  expiresAt = typeof bundle.expiresAt === "number" ? bundle.expiresAt : Date.parse(bundle.expiresAt);
  accountUser.value = bundle.user;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { void refreshAccount().catch(expireAccount); }, Math.max(1000, expiresAt - Date.now() - 60000));
}

export async function loginAccount(username: string, password: string) {
  await accountRequest<LoginBundle>("auth/login", { username, password });
}

export async function changeAccountPassword(currentPassword: string, newPassword: string) {
  await accountRequest<LoginBundle>("auth/password", { currentPassword, newPassword });
}

function refreshAccount() {
  // ACT: HttpOnly refresh cookie 同源共享，跨标签串行轮换，令牌广播仅在内存中传递。
  refreshing ??= navigator.locks.request("toonflowAccountRefresh", async () => {
    if (accessToken && expiresAt > Date.now() + 60000) return;
    const bundle = await accountRequest<LoginBundle>("auth/refresh", {});
    if (accountUser.value && accountUser.value.id !== bundle.user.id) {
      expireAccount();
      throw new Error("账户已切换，请重新加载页面");
    }
    applyLogin(bundle);
    accountChannel?.postMessage({ type: "refresh", bundle });
  }).finally(() => { refreshing = undefined; });
  return refreshing;
}

export function expireAccount() {
  if (endingSession) return;
  endingSession = true;
  accessToken = "";
  accountUser.value = undefined;
  clearTimeout(refreshTimer);
  // ACT: 刷新销毁全部 Pinia、设置、编辑器、附件和对象 URL 内存；不将身份写入浏览器存储。
  window.location.replace(`${window.location.pathname}${window.location.search}#/home`);
  window.location.reload();
}

export async function logoutAccount() {
  await accountRequest("auth/logout", {});
  accountChannel?.postMessage({ type: "logout" });
  expireAccount();
}

export async function initializeAccount() {
  const status = await accountRequest<{ enabled: boolean; initialized: boolean }>("auth/status");
  accountEnabled.value = status.enabled;
  accountInitialized.value = status.initialized;
  if (!status.enabled) {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller?.scriptURL === new URL("/accountWorker.js", location.href).href) {
      await (await navigator.serviceWorker.getRegistration("/accountWorker.js"))?.unregister();
      window.location.reload();
      await new Promise(() => {});
    }
    return;
  }
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !navigator.locks || !("BroadcastChannel" in window)) throw new Error("账户模式需要 HTTPS 和支持 Service Worker、Web Locks 的浏览器");
  accountChannel = new BroadcastChannel("toonflowAccount");
  accountChannel.onmessage = event => {
    if (event.data?.type === "logout") return expireAccount();
    if (!["login", "refresh"].includes(event.data?.type) || !event.data.bundle) return;
    const bundle = event.data.bundle as LoginBundle;
    if (event.data.type === "login" || accountReady && !accountUser.value || accountUser.value && accountUser.value.id !== bundle.user.id) return expireAccount();
    applyLogin(bundle);
    if (accountReady && bundle.user.mustChangePassword) expireAccount();
  };
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.source !== navigator.serviceWorker.controller) return;
    if (event.data?.type === "accountUnauthorized") {
      void navigator.locks.request("toonflowAccountRefresh", verifyAccountSession).catch(() => {});
      return;
    }
    if (event.data?.type !== "accountToken" || !event.ports[0]) return;
    const port = event.ports[0];
    void (async () => {
      if (accessToken && Date.now() >= expiresAt - 30000) await refreshAccount();
      port.postMessage({ token: accessToken });
    })().catch(() => { port.postMessage({ token: "" }); expireAccount(); }).finally(() => port.close());
  });
  await navigator.serviceWorker.register("/accountWorker.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
  if (status.initialized) {
    try { await refreshAccount(); }
    catch { /* 首次访问或已过期时显示登录页，业务设置保持未加载。 */ }
  }
  accountReady = true;
}
