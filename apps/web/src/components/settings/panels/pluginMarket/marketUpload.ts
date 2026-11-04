import { provide, shallowRef, watch, type InjectionKey } from "vue";
import { translate } from "@toonflow/i18n/vue";
import type { PluginExistence, PluginIdentity } from "@toonflow/server/channel";
import type { PluginUploadDraft } from "@toonflow/server/pluginDevelopment";
import http from "@/lib/http";
import { toonflowAccountToken } from "@/stores/settings";
import type { Plugin } from "./types";

export function getPluginExistence(plugins: PluginIdentity[], token: string, signal: AbortSignal) {
  return http<PluginExistence[]>({
    method: "POST", url: "/api/channel/plugin/getPluginExistence", data: { plugins },
    signal, headers: { Authorization: `Bearer ${token}` },
  });
}

type OpenPluginUpload = (load: () => Promise<PluginUploadDraft>, signal: AbortSignal) => Promise<unknown>;
export const openPluginUploadKey: InjectionKey<OpenPluginUpload> = Symbol("openPluginUpload");

export function providePluginUpload() {
  const pending = shallowRef<{ plugin: Plugin; file: File }>();
  watch(toonflowAccountToken, () => { pending.value = undefined; }, { flush: "sync" });
  let preparing = false;
  provide(openPluginUploadKey, async (load, signal) => {
    if (pending.value || preparing) return { status: "dialogBusy" };
    const token = toonflowAccountToken.value;
    if (!token) throw new Error(translate("请先在账号与余额中登录 Toonflow 账号"));
    preparing = true;
    try {
      const { source, fileName, ...plugin } = await load();
      signal.throwIfAborted();
      const identity = { type: plugin.type, identifier: plugin.name };
      const [record] = await getPluginExistence([identity], token, signal);
      signal.throwIfAborted();
      if (toonflowAccountToken.value !== token) throw new Error(translate("账号已变更，请确认登录账号后重新提交"));
      const { type, name, version } = plugin;
      if (!record) throw new Error(translate("检查插件市场状态失败，请重试"));
      if (record.exists) return { type, name, version, status: "alreadyExists" };
      pending.value = { plugin: { ...plugin, key: `${type}:${name}` }, file: new File([source], fileName, { type: "text/javascript" }) };
      return { type, name, version, status: "awaitingSubmission" };
    } finally { preparing = false; }
  });
  return pending;
}
