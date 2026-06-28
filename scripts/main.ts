import { app, BrowserWindow, protocol, systemPreferences } from "electron";
import path from "path";
import fs from "fs";
import Module from "module";
import { spawn, type ChildProcess } from "child_process";

// 加速 Electron 启动：跳过 GPU 信息收集，减少初始化耗时
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

const TARGET_ENTRIES = new Set(["assets", "models", "serve", "skills", "web", "vendor"]);

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.existsSync(d) || fs.copyFileSync(s, d);
  }
}

declare const __APP_VERSION__: string;

function compareVersions(a: string, b: string): number {
  const pa = a
    .split(".")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  const pb = b
    .split(".")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

function initializeData(): void {
  const srcDir = path.join(process.resourcesPath, "data");
  const destDir = path.join(app.getPath("userData"), "data");
  const versionFilePath = path.join(destDir, "version.txt");

  let shouldForceReplace = false;
  if (!fs.existsSync(versionFilePath)) {
    shouldForceReplace = true;
  } else {
    const localVersion = fs.readFileSync(versionFilePath, "utf-8").trim();
    if (compareVersions(localVersion, __APP_VERSION__) < 0) {
      shouldForceReplace = true;
    }
  }

  for (const dir of TARGET_ENTRIES) {
    const targetDir = path.join(destDir, dir);
    if (shouldForceReplace) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      copyDir(path.join(srcDir, dir), targetDir);
      continue;
    }
    if (!fs.existsSync(targetDir)) {
      copyDir(path.join(srcDir, dir), targetDir);
    }
  }

  if (shouldForceReplace) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(versionFilePath, `${__APP_VERSION__}\n`, "utf-8");
  }
}

//获取全部依赖路径，优先从 unpacked 加载原生模块，其他模块从 asar 加载
function getNodeModulesPaths(): string[] {
  const paths: string[] = [];
  if (app.isPackaged) {
    // external 依赖（原生模块）在 unpacked 目录
    const unpackedNodeModules = path.join(process.resourcesPath, "app.asar.unpacked", "node_modules");
    if (fs.existsSync(unpackedNodeModules)) {
      paths.push(unpackedNodeModules);
    }
    // 普通依赖在 asar 内
    const asarNodeModules = path.join(process.resourcesPath, "app.asar", "node_modules");
    paths.push(asarNodeModules);
  } else {
    paths.push(path.join(process.cwd(), "node_modules"));
  }
  return paths;
}

//动态加载
function requireWithCustomPaths(modulePath: string): any {
  const appNodeModulesPaths = getNodeModulesPaths();
  // 保存原始方法
  const originalNodeModulePaths = (Module as any)._nodeModulePaths;
  // 临时修改模块路径解析
  (Module as any)._nodeModulePaths = function (from: string): string[] {
    const paths = originalNodeModulePaths.call(this, from);
    // 将主程序的 node_modules 添加到前面
    for (let i = appNodeModulesPaths.length - 1; i >= 0; i--) {
      const p = appNodeModulesPaths[i];
      if (!paths.includes(p)) {
        paths.unshift(p);
      }
    }
    return paths;
  };
  try {
    // 清除缓存确保加载最新
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  } finally {
    // 恢复原始方法
    (Module as any)._nodeModulePaths = originalNodeModulePaths;
  }
}

let mainWindow: BrowserWindow | null = null;
let devServeProcess: ChildProcess | undefined;
let currentServePort: number | null = null;
let devBackendWatcher: fs.FSWatcher | undefined;
let devBackendRestartTimer: NodeJS.Timeout | undefined;
let devBackendRestarting = false;

function getTsxCommand(): string {
  const binName = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const localTsx = path.join(process.cwd(), "node_modules", ".bin", binName);
  return fs.existsSync(localTsx) ? localTsx : binName;
}

function startDevServeProcess(): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(getTsxCommand(), ["src/app.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "dev",
        PORT: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    devServeProcess = child;

    let settled = false;
    let outputBuffer = "";
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const parseOutput = (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text);
      outputBuffer = `${outputBuffer}${text}`.slice(-4000);
      const match = outputBuffer.match(/\[服务启动成功\]:\s*http:\/\/localhost:(\d+)/);
      if (match) finish(() => resolve(Number(match[1])));
    };

    const timer = setTimeout(() => {
      finish(() => {
        child.kill();
        reject(new Error("开发后端启动超时"));
      });
    }, 30000);

    child.stdout?.on("data", parseOutput);
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
    });
    child.once("error", (err) => {
      finish(() => reject(err));
    });
    child.once("exit", (code, signal) => {
      if (!settled) {
        finish(() => reject(new Error(`开发后端已退出: code=${code ?? "null"} signal=${signal ?? "null"}`)));
      }
    });
  });
}

function closeDevServeProcess(): Promise<void> {
  const child = devServeProcess;
  devServeProcess = undefined;
  if (!child || child.exitCode !== null || child.killed) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    child.once("exit", finish);
    child.kill();
    setTimeout(finish, 2000).unref?.();
  });
}

function shouldRestartDevBackend(fileName: string | Buffer | null): boolean {
  if (!fileName) return false;
  const normalized = String(fileName).replace(/\\/g, "/");
  if (!/\.(ts|tsx|js|json)$/.test(normalized)) return false;
  if (normalized === "router.ts" || normalized.endsWith("/router.ts")) return false;
  if (normalized === "types/database.d.ts" || normalized.endsWith("/types/database.d.ts")) return false;
  return true;
}

async function restartDevServeProcess(reason: string): Promise<void> {
  if (devBackendRestarting) return;
  devBackendRestarting = true;
  try {
    console.log(`[开发后端重启]: ${reason}`);
    await closeDevServeProcess();
    const port = await startDevServeProcess();
    currentServePort = port;
    process.env.PORT = String(port);
    mainWindow?.webContents.reloadIgnoringCache();
  } catch (err) {
    console.error("[开发后端重启失败]:", err);
  } finally {
    devBackendRestarting = false;
  }
}

function watchDevBackendSources(): void {
  if (devBackendWatcher || app.isPackaged) return;
  const srcDir = path.join(process.cwd(), "src");
  if (!fs.existsSync(srcDir)) return;
  try {
    devBackendWatcher = fs.watch(srcDir, { recursive: true }, (_eventType, fileName) => {
      if (!shouldRestartDevBackend(fileName)) return;
      if (devBackendRestartTimer) clearTimeout(devBackendRestartTimer);
      devBackendRestartTimer = setTimeout(() => {
        void restartDevServeProcess(String(fileName));
      }, 300);
    });
  } catch (err) {
    console.warn("[开发后端监听失败]:", err);
  }
}

function closeDevBackendWatcher(): void {
  if (devBackendRestartTimer) clearTimeout(devBackendRestartTimer);
  devBackendRestartTimer = undefined;
  devBackendWatcher?.close();
  devBackendWatcher = undefined;
}

function createMainWindow(): Promise<void> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 500,
      frame: false,
      show: false,
      autoHideMenuBar: true,
      resizable: true,
      thickFrame: true,
    });
    mainWindow = win;
    win.setMenuBarVisibility(false);
    win.removeMenu();

    win.on("closed", () => {
      mainWindow = null;
    });

    win.once("ready-to-show", () => {
      win.show();
      resolve();
    });

    const isDev = process.env.NODE_ENV === "dev" || !app.isPackaged;
    if (process.env.VITE_DEV) {
      void win.loadURL("http://localhost:50188");
    } else {
      const htmlPath = isDev
        ? path.join(process.cwd(), "data", "web", "index.html")
        : path.join(app.getPath("userData"), "data", "web", "index.html");
      void win.loadFile(htmlPath);
    }
  });
}

let closeServeFn: (() => Promise<void>) | undefined;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "toonflow",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

app.whenReady().then(async () => {
  try {
    let port: number;
    if (app.isPackaged) {
      // 生产环境：让出主线程一次，确保 loading 窗口渲染后再做耗时文件拷贝
      await new Promise((r) => setTimeout(r, 0));
      initializeData();
      const servePath = path.join(app.getPath("userData"), "data", "serve", "app.js");
      const mod = requireWithCustomPaths(servePath);
      closeServeFn = mod.closeServe;
      port = await mod.default(true);
    } else {
      // 开发环境：后端用普通 Node 子进程启动，避免 Electron 与 Node 的原生模块 ABI 冲突。
      closeServeFn = closeDevServeProcess;
      port = await startDevServeProcess();
      currentServePort = port;
      watchDevBackendSources();
    }
    process.env.PORT = String(port);
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
    // 注册协议处理器
    protocol.handle("toonflow", (request) => {
      const url = new URL(request.url);
      const pathname = url.hostname.toLowerCase();
      const handlers: Record<string, () => object> = {
        getappurl: () => ({ url: process.env.URL ?? `http://localhost:${currentServePort ?? port}/api` }),
        windowminimize: () => {
          mainWindow?.minimize();
          return { ok: true };
        },
        windowmaximize: () => {
          if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow?.maximize();
          }
          return { ok: true };
        },
        windowclose: () => {
          app.quit();
          return { ok: true };
        },
        apprestart: () => {
          // 延迟执行，让响应先返回给前端
          setTimeout(() => {
            app.relaunch();
            app.quit();
          }, 500);
          return { ok: true, message: "应用即将重启" };
        },
        windowismaximized: () => ({
          maximized: mainWindow?.isMaximized() ?? false,
        }),
        opendevtool: () => {
          mainWindow?.webContents.openDevTools();
          return { ok: true };
        },
        openurlwithbrowser: () => {
          const search = url.searchParams;
          const targetUrl = search.get("url");
          if (targetUrl) {
            const { shell } = require("electron");
            shell.openExternal(targetUrl);
            return { ok: true };
          } else {
            return { ok: false, error: "缺少url参数" };
          }
        },
        getlocallanguage: () => {
          // 获取应用区域设置

          // macOS系统特定方法
          if (process.platform === "darwin") {
            const systemLocale = systemPreferences.getUserDefault("AppleLocale", "string");
            return { ok: true, local: systemLocale };
          }
          const appLocale = app.getLocale();
          return { ok: true, local: appLocale };
        },
      };

      const handler = handlers[pathname];

      const responseData = handler ? handler() : { error: "未知接口" };
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    });

    // 服务启动成功，创建主窗口（主窗口 ready-to-show 时自动关闭loading）
    await createMainWindow();
  } catch (err) {
    console.error("[服务启动失败]:", err);
    await createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  closeDevBackendWatcher();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

let isClosingServe = false;
app.on("before-quit", (event) => {
  if (!closeServeFn || isClosingServe) return;
  event.preventDefault();
  isClosingServe = true;
  closeServeFn()
    .catch((err) => {
      console.error("[服务关闭失败]:", err);
    })
    .finally(() => {
      closeServeFn = undefined;
      app.quit();
    });
});
