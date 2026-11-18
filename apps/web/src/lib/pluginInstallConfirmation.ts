import { h } from "vue";
import axios from "axios";
import { ElMessageBox } from "element-plus";
import { translate } from "@toonflow/i18n/vue";

export const pluginTypeLabels = { node: "节点", ext: "文件扩展", tool: "工具", skill: "技能", provider: "供应商", agent: "Agent" };

type InstallDetails = { name: string; type?: string; version?: string; source?: string; overwrite?: boolean; terminal?: boolean };

const terminalWarning = () => translate("此供应商可在你的电脑上运行任意命令行程序，能读写文件、联网或调用其他软件。请确认已检查代码，仅在完全信任来源时继续。");
const dangerText = { color: "var(--el-color-danger)", fontWeight: "600" };

export async function confirmProviderTerminal(message: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(h("div", { style: { overflowWrap: "anywhere" } }, [
      h("p", message),
      h("p", { style: dangerText }, terminalWarning()),
    ]), translate("命令行调用警告"), {
      type: "error", confirmButtonText: translate("我已了解风险，继续"), cancelButtonText: translate("取消"),
      confirmButtonClass: "el-button--danger", closeOnClickModal: false, autofocus: false,
    });
    return true;
  } catch (error) {
    if (error === "cancel" || error === "close") return false;
    throw error;
  }
}

/** 服务端发现供应商调用命令行时要求确认；确认后带 allowTerminal 重发同一请求，取消返回 undefined。 */
export async function withTerminalConfirm<T>(request: (allowTerminal: boolean) => Promise<T>): Promise<T | undefined> {
  try { return await request(false); }
  catch (error) {
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    if (data?.data?.code !== "PROVIDER_TERMINAL_CONFIRM") throw error;
    return await confirmProviderTerminal(data.message) ? request(true) : undefined;
  }
}

let confirming = false;

export async function confirmPluginInstall(details: InstallDetails, signal?: AbortSignal): Promise<boolean> {
  signal?.throwIfAborted();
  if (confirming) throw new Error(translate("此页面正在执行另一条控制命令，请等待完成"));
  confirming = true;
  let dismiss: (() => void) | undefined;
  const abort = () => dismiss?.();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const confirmed = await ElMessageBox.confirm(({ cancel }) => {
      dismiss = cancel;
      if (signal?.aborted) queueMicrotask(cancel);
      const label = details.type && Object.hasOwn(pluginTypeLabels, details.type) ? pluginTypeLabels[details.type as keyof typeof pluginTypeLabels] : "插件名称";
      return h("div", { style: { overflowWrap: "anywhere" } }, [
        h("p", `${translate(label)} · ${details.name}${details.version ? ` · v${details.version}` : ""}`),
        details.source && h("p", { style: { maxHeight: "120px", overflow: "auto", color: "var(--el-text-color-secondary)" } }, details.source),
        details.overwrite && h("p", translate("强制安装（允许覆盖同版本或降级）")),
        details.terminal && h("p", { style: dangerText }, terminalWarning()),
        h("p", translate("插件可能执行代码并访问本地文件，请仅安装信任来源的插件。")),
      ]);
    }, translate("安装插件"), {
      confirmButtonText: translate("确认安装"), cancelButtonText: translate("取消"), closeOnClickModal: false, autofocus: false,
    });
    return confirmed === "confirm" && !signal?.aborted;
  } catch (error) {
    if (error === "cancel" || error === "close") return false;
    throw error;
  } finally {
    confirming = false;
    signal?.removeEventListener("abort", abort);
  }
}
