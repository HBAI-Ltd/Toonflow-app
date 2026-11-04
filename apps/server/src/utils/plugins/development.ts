import { lstat } from "@toonflow/file";
import { resolve } from "node:path";
import { pluginDevelopmentSchema, type PluginDevelopmentHandler, type PluginDevelopmentHost } from "@/lib/pluginDevelopment";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";
import { parsePluginVersion } from "./install";
import { loadTool, toolsDirectory } from "./tools";

export async function runPluginDevelopment(directory: string, input: unknown, signal: AbortSignal, install?: Pick<PluginDevelopmentHost, "installNode" | "installTool">) {
  const request = pluginDevelopmentSchema.parse(input);
  if (!install && request.action !== "guide" && request.action !== "build") throw Object.assign(new Error("请先打开 Toonflow 桌面或网页"), { status: 403 });
  signal.throwIfAborted();
  const disabled = await lstat(resolve(toolsDirectory, "pluginDeveloper.disabled")).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (disabled) throw Object.assign(new Error("工具已禁用"), { status: 403 });
  const { module } = await loadTool("pluginDeveloper").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw Object.assign(new Error("工具不存在"), { status: 404 });
    throw error;
  });
  if (typeof module.developPlugin !== "function") throw Object.assign(new Error("工具文件无效"), { status: 400 });
  signal.throwIfAborted();
  const denyInstall = () => { throw Object.assign(new Error("请先打开 Toonflow 桌面或网页"), { status: 403 }); };
  const develop = module.developPlugin as PluginDevelopmentHandler;
  return develop(directory, request, {
    resolveWorkspacePath, lockWorkspaceFiles, parsePluginVersion,
    installNode: install?.installNode ?? denyInstall, installTool: install?.installTool ?? denyInstall,
  }, signal);
}
