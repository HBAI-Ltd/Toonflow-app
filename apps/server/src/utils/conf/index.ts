import conf from "conf";
import { resolve } from "node:path";
import tfRouter from "@toonflow/providers/language/tfRouter";
import type { RemoteTeam } from "@/utils/teams";
import type { A2aSettings } from "@/agent/a2a/settings";

const config = new conf<{ settings: Record<string, unknown>; toolConfigs: Record<string, Record<string, unknown>>; nodeConfigs: Record<string, Record<string, unknown>>; remoteConnections: Record<string, RemoteTeam>; a2a: A2aSettings }>({
  cwd: process.env.TOONFLOW_DATA_DIR ?? resolve(import.meta.dirname, "../../../../../data"),
  configName: "settings",
  configFileMode: 0o600,
  watch: true,
});

export function removeLegacySettings(settings: Record<string, unknown>) {
  let changed = false;
  // ACT: 只清理已废弃字段，保留其他设置和插件配置。
  for (const [record, key] of [[settings, "developerConfirmed"], [settings.general, "systemPrompt"], [settings.stores, "toonflow.developer"]] as const) {
    if (record && typeof record === "object" && !Array.isArray(record) && Object.hasOwn(record, key)) {
      Reflect.deleteProperty(record, key);
      changed = true;
    }
  }
  return changed;
}

const settings = config.get("settings", {});
if (removeLegacySettings(settings)) config.set("settings", settings);

// ACT: 仅初始化尚未配置的文本供应商；已有列表（包括用户清空的列表）保持原样。
if (!config.has("settings.customProviders")) {
  const { id, label, version, apiUrl, protocol, models } = tfRouter;
  config.set("settings.customProviders", [{ id, label, version, apiUrl, protocol, models, apiKey: "" }]);
}

export default config;
