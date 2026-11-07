import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ElMessageBox } from "element-plus";
import { locale, translate } from "@toonflow/i18n/vue";
import { accessState } from "@toonflow/node-shared/access";

export { fetchWithAccess } from "@toonflow/node-shared/access";

type AccessRequestConfig = InternalAxiosRequestConfig & { accessRetried?: boolean };
let login: Promise<boolean> | undefined;

function requestAccess() {
  if (login) return login;
  login = ElMessageBox.prompt(translate("请输入服务器访问密码"), translate("登录"), {
    inputType: "password",
    inputPlaceholder: translate("密码"),
    inputValidator: value => !!value || translate("请输入服务器访问密码"),
    confirmButtonText: translate("登录"),
    cancelButtonText: translate("取消"),
    showCancelButton: true,
    showClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    closeOnHashChange: false,
    async beforeClose(action, instance, done) {
      if (action !== "confirm") { done(); return; }
      if (instance.confirmButtonLoading) return;
      instance.confirmButtonLoading = true;
      try {
        const response = await fetch("/api/access/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Language": locale.value },
          body: JSON.stringify({ password: instance.inputValue }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 200) {
          instance.editorErrorMessage = typeof result?.message === "string" && result.message
            ? result.message : translate(response.status === 401 ? "密码错误，请重试" : "登录失败");
          instance.validateError = true;
          return;
        }
        done();
      } catch {
        instance.editorErrorMessage = translate("登录失败");
        instance.validateError = true;
      } finally {
        instance.confirmButtonLoading = false;
      }
    },
  }).then(() => { accessState.revision.value++; return true; }, () => false).finally(() => { login = undefined; });
  return login;
}

accessState.request = requestAccess;

export function registerAccess(client: AxiosInstance) {
  const interceptor = client.interceptors.response.use(undefined, async error => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || error.response.headers["x-toonflow-access"] !== "required") throw error;
    const config = error.config as AccessRequestConfig | undefined;
    if (!config || config.accessRetried) throw error;
    const url = new URL(client.getUri(config), window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) throw error;
    if (config.signal?.aborted) throw new axios.CanceledError(undefined, config);
    config.accessRetried = true;
    const authenticated = await requestAccess();
    if (config.signal?.aborted) throw new axios.CanceledError(undefined, config);
    if (!authenticated) throw error;
    return client.request(config);
  });
  return () => client.interceptors.response.eject(interceptor);
}

