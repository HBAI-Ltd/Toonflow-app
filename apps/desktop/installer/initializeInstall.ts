import { randomUUID } from "node:crypto";
import { copyFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";

const directories = process.argv.slice(2);
if (directories.length !== 3 || directories.some(directory => !isAbsolute(directory))) {
  throw new Error("需要安装目录、桌面目录和开始菜单目录的绝对路径。");
}
const [installDirectory, desktopDirectory, programsDirectory] = directories as [string, string, string];
const resourcesDirectory = join(installDirectory, "app", "Resources");
const { identifier, name, channel } = await Bun.file(join(resourcesDirectory, "version.json")).json();
if (typeof identifier !== "string" || typeof name !== "string" || channel !== "stable") {
  throw new Error("应用安装信息无效，请重新构建安装包。");
}

// ACT: 系统注册由 NSIS 负责；补齐 Electrobun 2.0.1 的记录，避免首次启动再次调用 PowerShell。
// 保留真实更新助手和完整 manifest，不用占位文件跳过 SDK 检查。
copyFileSync(join(resourcesDirectory, "uninstall"), join(installDirectory, "uninstall.exe"));
writeFileSync(join(installDirectory, ".electrobun-uninstall.json"), JSON.stringify({
  schema_version: 1,
  install_nonce: randomUUID().replaceAll("-", ""),
  identifier,
  name,
  channel,
  desktop_shortcut: join(desktopDirectory, `${name}.lnk`),
  start_menu_shortcut: join(programsDirectory, `${name}.lnk`),
  install_root_name: basename(installDirectory),
  data_path_versions: [1],
}, null, 2));

// 重装同一构建也重新同步内置节点和工具；供应商、技能沿用首次初始化，保留用户修改。
for (const directory of ["nodes", "tools"]) {
  rmSync(join(installDirectory, "data", directory, "initialized"), { force: true });
}
