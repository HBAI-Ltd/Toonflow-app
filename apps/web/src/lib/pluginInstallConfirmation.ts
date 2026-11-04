import { h } from "vue";
import { ElMessageBox } from "element-plus";
import { translate } from "@toonflow/i18n/vue";

export const pluginTypeLabels = { node: "节点", ext: "文件扩展", tool: "工具", skill: "技能", provider: "供应商", agent: "Agent" };

type InstallDetails = { name: string; type?: string; version?: string; source?: string; overwrite?: boolean };

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
