import conf from "conf";
import { lstatSync, mkdirSync, readdirSync, realpathSync, writeFileSync } from "@toonflow/file";
import { resolve } from "node:path";
import type { RemoteTeam } from "@/utils/teams";
import type { A2aSettings } from "@/agent/a2a/settings";
import type { desktopUpdateAttempt } from "@/types/desktop";
import type { MobileLinkConfig } from "@/utils/mobileLink";
import { normalizeNodeMenu, serializeNodeMenu } from "@/lib/nodeMenu";
import type { SavedMcpServer } from "@toonflow/mcp/client";

const dataDirectory = process.env.TOONFLOW_DATA_DIR ?? resolve(import.meta.dirname, "../../../../../data");
mkdirSync(dataDirectory, { recursive: true });
const configDirectory = realpathSync(dataDirectory);
process.env.TOONFLOW_DATA_DIR = configDirectory;

const config = new conf<{ settings: Record<string, unknown>; pluginInstalledAt: Record<string, number>; mediaGenerationDisabledOnce: boolean; disabledSkills: string[]; mcpServers: SavedMcpServer[]; mcpBundles: Record<string, string>; toolConfigs: Record<string, Record<string, unknown>>; nodeConfigs: Record<string, Record<string, unknown>>; extConfigs: Record<string, Record<string, unknown>>; remoteConnections: Record<string, RemoteTeam>; a2a: A2aSettings; desktopUpdateAttempt: desktopUpdateAttempt; mobileLink: MobileLinkConfig }>({
  cwd: configDirectory,
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
  if (Array.isArray(settings.customProviders)) {
    const providers = settings.customProviders.filter(item => typeof item?.id !== "string" || item.id.toLowerCase() !== "tfrouter");
    if (providers.length !== settings.customProviders.length) {
      settings.customProviders = providers;
      changed = true;
    }
  }
  const mediaConfigs = settings.mediaProviderConfigs;
  if (mediaConfigs && typeof mediaConfigs === "object" && !Array.isArray(mediaConfigs)) {
    for (const id of Object.keys(mediaConfigs)) {
      if (id.toLowerCase() !== "tfrouter") continue;
      Reflect.deleteProperty(mediaConfigs, id);
      changed = true;
    }
  }
  return changed;
}

export function cleanNodeMenuSettings(settings: Record<string, unknown>) {
  const general = settings.general;
  if (!general || typeof general !== "object" || Array.isArray(general) || !Object.hasOwn(general, "nodeMenu")) return false;
  const record = general as Record<string, unknown>;
  const installedTypes = new Set<string>();
  try {
    // ACT: 仅扫描已安装文件名；禁用节点保留配置，菜单清理与同步存盘间不插入异步等待。
    for (const file of readdirSync(resolve(configDirectory, "nodes"), { withFileTypes: true })) {
      if (file.isFile() && /^[a-z][a-zA-Z0-9]*\.umd\.js$/.test(file.name)) installedTypes.add(`remote-${file.name.slice(0, -7)}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const nodeMenu = serializeNodeMenu(normalizeNodeMenu(record.nodeMenu), installedTypes);
  if (!nodeMenu.length) {
    delete record.nodeMenu;
    return true;
  }
  if (JSON.stringify(record.nodeMenu) === JSON.stringify(nodeMenu)) return false;
  record.nodeMenu = nodeMenu;
  return true;
}

const settings = config.get("settings", {});
if (removeLegacySettings(settings)) config.set("settings", settings);

if (!config.get("mediaGenerationDisabledOnce", false)) {
  const toolsDirectory = resolve(configDirectory, "tools");
  let legacyToolInstalled = false;
  try {
    const directory = lstatSync(toolsDirectory);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw new Error("工具目录不能是符号链接或文件");
    legacyToolInstalled = readdirSync(toolsDirectory, { withFileTypes: true }).some(file => file.name === "mediaGeneration.tool.js" && file.isFile());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (legacyToolInstalled) {
    const markerPath = resolve(toolsDirectory, "mediaGeneration.disabled");
    try { writeFileSync(markerPath, "", { flag: "wx" }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || !lstatSync(markerPath).isFile()) throw error;
    }
  }
  // ACT: 只禁用升级前的旧安装一次；后续手动启用、重装和重启均保留用户选择。
  config.set("mediaGenerationDisabledOnce", true);
}

export default config;
