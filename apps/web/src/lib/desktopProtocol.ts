import axios from "axios";
import { h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import type { PluginInstallRequest, PluginInstallType } from "@toonflow/server/desktop";
import { t } from "@/lib/i18n";

declare global {
  interface WindowEventMap {
    "toonflow:install-plugin": CustomEvent<PluginInstallRequest>;
    "toonflow:plugin-installed": CustomEvent<{ type: PluginInstallType; name: string }>;
  }
}

export function registerDesktopProtocol() {
  const pluginTypes = new Set<PluginInstallType>(["node", "tool", "skill", "provider", "agent"]);
  const typeLabel = (type: PluginInstallType) => t(`desktopProtocol.type.${type}`);
  const pending = new Set<string>();
  let queue = Promise.resolve();

  const handleInstall = (event: WindowEventMap["toonflow:install-plugin"]) => {
    const request = event.detail;
    if (!request || !pluginTypes.has(request.type) || typeof request.url !== "string" || typeof request.fileName !== "string") return;
    const key = `${request.type}:${request.url}`;
    if (pending.has(key)) return;
    if (pending.size >= 20) {
      ElMessage.warning(t("desktopProtocol.tooManyRequests"));
      return;
    }
    pending.add(key);
    queue = queue.then(() => confirmInstall(request)).catch(error => {
      ElMessage.error(error instanceof Error ? error.message : t("desktopProtocol.installPluginFailed"));
    }).finally(() => pending.delete(key));
  };
  window.addEventListener("toonflow:install-plugin", handleInstall);

  async function confirmInstall(request: PluginInstallRequest) {
    const confirmed = await ElMessageBox.confirm(
      h("div", { style: { overflowWrap: "anywhere" } }, [
        h("p", t("desktopProtocol.pluginDetails", { type: typeLabel(request.type), fileName: request.fileName })),
        h("p", { style: { maxHeight: "120px", overflow: "auto", fontSize: "12px", color: "var(--el-text-color-secondary)" } }, request.url),
        h("p", t("desktopProtocol.securityWarning")),
      ]),
      t("desktopProtocol.dialogTitle"),
      { confirmButtonText: t("desktopProtocol.confirm"), cancelButtonText: t("desktopProtocol.cancel"), closeOnClickModal: false },
    ).then(() => true, () => false);
    if (!confirmed) return;

    const loading = ElMessage({ message: t("desktopProtocol.installing"), duration: 0 });
    try {
      const { data } = await axios.post("/api/desktop/plugins/install", { type: request.type, url: request.url }, {
        headers: { "x-toonflow-desktop": "1" },
        timeout: 60000,
      });
      if (data?.code !== 200) throw new Error(typeof data?.message === "string" && data.message.trim() ? data.message : t("desktopProtocol.invalidResponse"));
      if (typeof data.data?.name !== "string" || !data.data.name.trim()) throw new Error(t("desktopProtocol.invalidPluginName"));
      if (request.type === "provider") invalidateNodeModels("media");
      window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type: request.type, name: data.data.name } }));
      ElMessage({ type: "success", message: t("desktopProtocol.installed", { type: typeLabel(request.type) }) });
    } catch (error) {
      let message = error instanceof Error ? error.message : t("desktopProtocol.installFailedRetry");
      if (axios.isAxiosError(error)) {
        const response = error.response;
        const data = response?.data;
        if (typeof data?.message === "string" && data.message.trim()) {
          message = data.message;
          if (Array.isArray(data.data) && data.data.every((item: unknown) => typeof item === "string"))
            message += `${t("desktopProtocol.errorDetailSeparator")}${data.data.join(t("desktopProtocol.errorListSeparator"))}`;
        } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          message = t("desktopProtocol.timeout");
        } else if (!response) {
          message = t("desktopProtocol.connectionFailed");
        } else {
          message = t("desktopProtocol.httpError", { status: response.status });
        }
      }
      ElMessage({ type: "error", message: t("desktopProtocol.installFailure", { type: typeLabel(request.type), fileName: request.fileName, message }), duration: 10000, showClose: true });
    } finally {
      loading.close();
    }
  }
  return () => window.removeEventListener("toonflow:install-plugin", handleInstall);
}
