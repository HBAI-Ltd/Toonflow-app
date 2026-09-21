import { once } from "node:events";
import { execFile } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { dlopen, ptr } from "bun:ffi";
import type { DesktopRuntime, PluginInstallRequest } from "@toonflow/server/desktop";
import { showNativeSplash } from "@toonflow/startup";
import Electrobun, { BrowserWindow, PATHS, Screen, Utils, Updater } from "electrobun/main";
import { parseInstallUrl } from "./protocol";
import saveFile, { selectSaveFile } from "./saveFile";
import createWindowsUpdater from "./update/windowsUpdater";

const execFileAsync = promisify(execFile);
const pendingInstalls: PluginInstallRequest[] = [];
let deliverInstall: ((request: PluginInstallRequest) => void) | undefined;
function openUrl(url: string) {
  const request = parseInstallUrl(url);
  if (deliverInstall) deliverInstall(request);
  else if (!pendingInstalls.some(item => item.type === request.type && item.url === request.url)) {
    if (pendingInstalls.length >= 20) throw new Error("待确认的安装请求过多，请稍后重试");
    pendingInstalls.push(request);
  }
}
// 冷启动的 macOS URL 可能先于窗口就绪到达，先接收再等待页面挂载。
Electrobun.events.on("open-url", event => {
  try { openUrl(event.data.url); }
  catch (error) {
    void Utils.showMessageBox({ type: "error", title: "安装链接无效", message: error instanceof Error ? error.message : "无法打开安装链接" });
  }
});

async function restoreInstallRegistration(installDirectory: string) {
  const uninstaller = resolve(installDirectory, "UninstallNSIS.exe");
  if (process.platform === "win32" && existsSync(uninstaller)) {
    try {
      // SDK 启动和更新会重写卸载入口；安装了 NSIS 时统一交给它处理数据保留选项。
      const { identifier, channel } = await Bun.file(resolve(PATHS.RESOURCES_FOLDER, "version.json")).json();
      const registryKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${identifier}.${channel}`;
      for (const [name, command] of [["UninstallString", `"${uninstaller}"`], ["QuietUninstallString", `"${uninstaller}" /S`]]) {
        await execFileAsync("reg.exe", ["add", registryKey, "/v", name, "/t", "REG_SZ", "/d", command, "/f"], { windowsHide: true });
      }
      const protocolLauncher = resolve(PATHS.RESOURCES_FOLDER, "app/protocolLauncher.exe");
      if (existsSync(protocolLauncher)) {
        const protocolKey = "HKCU\\Software\\Classes\\toonflow";
        const commandKey = `${protocolKey}\\shell\\open\\command`;
        const command = `"${protocolLauncher}" "%1"`;
        let protocolExists = true;
        try {
          await execFileAsync("reg.exe", ["query", protocolKey], { windowsHide: true });
        } catch (error) {
          if ((error as { code?: number }).code !== 1) throw error;
          protocolExists = false;
        }
        // ACT: 自动更新不经过 NSIS；仅补全缺失协议，已有注册（包括其他安装）保持不动。
        if (!protocolExists) {
          for (const [key, value] of [[protocolKey, "URL:Toonflow Protocol"], [`${protocolKey}\\DefaultIcon`, `"${resolve(PATHS.RESOURCES_FOLDER, "app.ico")}",0`], [commandKey, command]]) {
            await execFileAsync("reg.exe", ["add", key, "/ve", "/t", "REG_SZ", "/d", value, "/f"], { windowsHide: true });
          }
          await execFileAsync("reg.exe", ["add", protocolKey, "/v", "URL Protocol", "/t", "REG_SZ", "/d", "", "/f"], { windowsHide: true });
        }
      }
    } catch (error) {
      console.error("恢复桌面安装注册信息失败：", error);
    }
  }
}

async function start() {
  let splash: Awaited<ReturnType<typeof showNativeSplash>> | undefined;
  let isClosing = false;

  try {
    // Windows 的 data 与 app 同级；macOS 的 data 与 .app 同级，避免随程序更新被替换。
    const installDirectory = resolve(PATHS.RESOURCES_FOLDER, process.platform === "darwin" ? "../../.." : "../..");
    const dataDirectory = process.env.TOONFLOW_DATA_DIR ?? resolve(installDirectory, "data");
    // ACT: 先显示原生动画，再加载服务，避免初始化期间没有反馈。
    const startupSettings = await Bun.file(resolve(dataDirectory, "settings.json")).json().catch((error) => {
      if (error.code !== "ENOENT") console.error("读取启动设置失败，使用默认启动动画：", error);
      return null;
    });
    try {
      if (startupSettings?.settings?.ui?.startupAnimation !== false) {
        splash = await showNativeSplash(resolve(PATHS.VIEWS_FOLDER, "../startup"), () => {
          isClosing = true;
          splash = undefined;
          Utils.quit();
        });
      }
    } catch (error) {
      console.error("原生启动画面创建失败：", error);
    }
    if (isClosing) {
      splash?.close();
      return;
    }
    process.env.toonflowDesktop = "1";
    const { createApp } = await import("@toonflow/server/app");
    const { hash } = await Bun.file(resolve(PATHS.RESOURCES_FOLDER, "version.json")).json();
    if (typeof hash !== "string" || !hash) throw new Error("应用构建标识缺失，无法同步内置插件");
    const app = await createApp({
      webRoot: resolve(PATHS.VIEWS_FOLDER, "mainview"),
      dataDirectory,
      toolsRoot: resolve(PATHS.VIEWS_FOLDER, "../tools"),
      nodesRoot: resolve(PATHS.VIEWS_FOLDER, "../nodes"),
      providersRoot: resolve(PATHS.VIEWS_FOLDER, "../providers"),
      skillsRoot: resolve(PATHS.VIEWS_FOLDER, "../skills"),
      // ACT: 暂不安装内置团队，随团队打包一同恢复。
      // agentsRoot: resolve(PATHS.VIEWS_FOLDER, "../agents"),
      pluginRevision: hash,
    });
    const server = app.listen(0, "127.0.0.1");

    await once(server, "listening");
    if (isClosing) return;
    const address = server.address() as AddressInfo;
    const { initializeMcpRuntime } = await import("@toonflow/server/mcp");
    await initializeMcpRuntime(app, `http://127.0.0.1:${address.port}`, resolve(PATHS.VIEWS_FOLDER, "../mcp/stdio.js"));
    console.log(`桌面服务：http://127.0.0.1:${address.port}`);

    const { workArea } = Screen.getPrimaryDisplay();
    // ACT: 宽高分别限制在屏幕可用区域内，预留标题栏和边距，不固定比例。
    const width = Math.min(1280, workArea.width - 64);
    const height = Math.min(960, workArea.height - 64);
    const mainWindow = new BrowserWindow({
      title: "Toonflow",
      url: `http://127.0.0.1:${address.port}/?desktop=1`,
      hidden: Boolean(splash),
      frame: {
        width,
        height,
        x: workArea.x + Math.round((workArea.width - width) / 2),
        y: workArea.y + Math.round((workArea.height - height) / 2),
      },
    });
    // ACT: 两版 SDK 的全局事件不带 WebView ID，使用事件名后缀限定主窗口。
    Electrobun.events.on(`new-window-open-${mainWindow.webview.id}`, (event: { data: { detail: unknown } }) => {
      const detail = event.data.detail;
      const url = typeof detail === "string" ? detail : detail && typeof detail === "object" && "url" in detail ? detail.url : undefined;
      if (typeof url !== "string" || !URL.canParse(url)) return;
      const target = new URL(url);
      if (target.protocol !== "http:" && target.protocol !== "https:") return;
      if (!Utils.openExternal(target.href)) {
        void Utils.showMessageBox({ type: "error", title: "打开链接失败", message: "请检查默认浏览器设置后重试。" });
      }
    });
    // 页面重载时监听器随旧页面销毁，安装请求等新页面 ready 后再投递。
    Electrobun.events.on(`will-navigate-${mainWindow.webview.id}`, () => { deliverInstall = undefined; });
    let isShowing = false;
    app.locals.desktop = {
      openUrl,
      readClipboardText: Utils.clipboardReadText,
      writeClipboardText: Utils.clipboardWriteText,
      selectSaveFile,
      saveFile,
      async selectProviderFile() {
        const [path] = await Utils.openFileDialog({ allowedFileTypes: "ts", canChooseFiles: true, canChooseDirectory: false, allowsMultipleSelection: false });
        return path ?? null;
      },
      async selectDirectory() {
        const [path] = await Utils.openFileDialog({ canChooseFiles: false, canChooseDirectory: true, allowsMultipleSelection: false });
        return path ?? null;
      },
      async ready(failed = false) {
        if (isClosing) return;
        if (!isShowing) {
          if (splash) {
            await splash.finish();
            if (isClosing || !splash) return;
            mainWindow.show();
            splash.close();
            splash = undefined;
          }
          isShowing = true;
          // ACT: 安装器已完成注册；更新后的修复仅首次展示时执行，不阻塞主窗口。
          void restoreInstallRegistration(installDirectory);
        }
        if (failed) {
          deliverInstall = undefined;
          return;
        }
        deliverInstall = request => {
          mainWindow.unminimize();
          mainWindow.show();
          mainWindow.activate();
          mainWindow.webview.executeJavascript(`window.dispatchEvent(new CustomEvent("toonflow:install-plugin", { detail: ${JSON.stringify(request)} }));`);
        };
        while (pendingInstalls.length) {
          deliverInstall(pendingInstalls[0]!);
          pendingInstalls.shift();
        }
      },
      openDevTools() { mainWindow.webview.openDevTools(); },
      // ACT: 仅 Windows 使用 2.0 的两阶段退出；Intel Mac 继续保留原 SDK 更新器。
      updater: process.platform === "win32" ? createWindowsUpdater(PATHS.RESOURCES_FOLDER, Utils as unknown as Parameters<typeof createWindowsUpdater>[1]) : Updater,
    } satisfies DesktopRuntime;
    if (process.platform === "win32") {
      // ACT: Electrobun 2.0.1 未设置 Windows 窗口图标，复用构建产物中的应用 ICO。
      const user32 = dlopen("user32.dll", {
        LoadImageW: { args: ["ptr", "ptr", "u32", "i32", "i32", "u32"], returns: "ptr" },
        SendMessageW: { args: ["ptr", "u32", "u64", "ptr"], returns: "ptr" },
        GetDpiForWindow: { args: ["ptr"], returns: "u32" },
        GetSystemMetricsForDpi: { args: ["i32", "u32"], returns: "i32" },
        DestroyIcon: { args: ["ptr"], returns: "i32" },
      });
      const native = user32.symbols;
      const window = mainWindow.ptr;
      const dpi = native.GetDpiForWindow(window);
      const iconPath = Buffer.from(`${resolve(PATHS.RESOURCES_FOLDER, "app.ico")}\0`, "utf16le");
      // ICON_SMALL / ICON_BIG，各自使用当前窗口 DPI 对应的系统尺寸。
      const icons = [49, 11].map((metric) => native.LoadImageW(
        null, ptr(iconPath), 1, native.GetSystemMetricsForDpi(metric, dpi), native.GetSystemMetricsForDpi(metric + 1, dpi), 0x10,
      ));
      const closeIcons = () => {
        for (const icon of icons) if (icon) native.DestroyIcon(icon);
        user32.close();
      };
      if (icons.some((icon) => !icon)) {
        closeIcons();
        throw new Error("无法加载主窗口图标");
      }
      icons.forEach((icon, type) => native.SendMessageW(window, 0x80, type, icon));
      mainWindow.on("close", closeIcons);
    }
    mainWindow.on("close", () => {
      isClosing = true;
      deliverInstall = undefined;
      pendingInstalls.length = 0;
      splash?.close();
      splash = undefined;
    });
    if (process.platform === "win32") {
      // ACT: 运行信息随应用目录清理；启动器通过 PID 忽略已退出进程留下的端口。
      writeFileSync(resolve(PATHS.RESOURCES_FOLDER, "desktopRuntime.json"), JSON.stringify({ pid: process.pid, port: address.port }));
    }
  } catch (error) {
    splash?.close();
    console.error("桌面启动失败：", error);
    Utils.quit(1);
  }
}

void start();
