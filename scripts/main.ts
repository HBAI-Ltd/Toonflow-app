import { app, BrowserWindow, protocol, systemPreferences } from "electron";
import path from "path";
import fs from "fs";
import Module from "module";

// Reduce Electron startup overhead by skipping GPU cache and occlusion work.
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

// Resolve dependency paths, preferring unpacked native modules in packaged builds.
function getNodeModulesPaths(): string[] {
  const paths: string[] = [];
  if (app.isPackaged) {
    // Native modules are copied to the unpacked directory.
    const unpackedNodeModules = path.join(process.resourcesPath, "app.asar.unpacked", "node_modules");
    if (fs.existsSync(unpackedNodeModules)) {
      paths.push(unpackedNodeModules);
    }
    // Regular dependencies stay inside the asar archive.
    const asarNodeModules = path.join(process.resourcesPath, "app.asar", "node_modules");
    paths.push(asarNodeModules);
  } else {
    paths.push(path.join(process.cwd(), "node_modules"));
  }
  return paths;
}

// Keep module resolution pointed at the app node_modules while loading backend code.
let restoreNodeModulePaths: (() => void) | undefined;

function installPersistentNodeModulePaths(): void {
  if (restoreNodeModulePaths) return;
  const appNodeModulesPaths = getNodeModulesPaths();
  const originalNodeModulePaths = (Module as any)._nodeModulePaths;

  (Module as any)._nodeModulePaths = function (from: string): string[] {
    const paths = originalNodeModulePaths.call(this, from);
    for (let i = appNodeModulesPaths.length - 1; i >= 0; i--) {
      const p = appNodeModulesPaths[i];
      if (!paths.includes(p)) {
        paths.unshift(p);
      }
    }
    return paths;
  };

  restoreNodeModulePaths = () => {
    (Module as any)._nodeModulePaths = originalNodeModulePaths;
    restoreNodeModulePaths = undefined;
  };
}

function requireWithCustomPaths(modulePath: string): any {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

let mainWindow: BrowserWindow | null = null;

function isDevRuntime(): boolean {
  return process.env.NODE_ENV === "dev" || !app.isPackaged;
}

function getWebFilePath(fileName: string): string {
  return isDevRuntime()
    ? path.join(process.cwd(), "data", "web", fileName)
    : path.join(app.getPath("userData"), "data", "web", fileName);
}

function getLocalWebUrl(port: string | number, fileName: string): string {
  return `http://localhost:${port}/${fileName}`;
}

function injectStructuralReplicaEntry(win: BrowserWindow, port: string | number): void {
  win.webContents.on("did-finish-load", () => {
    const currentUrl = win.webContents.getURL();
    if (currentUrl.includes("structural-replica.html")) return;

    const targetUrl = getLocalWebUrl(port, "structural-replica.html");
    const script = `
      (() => {
        const entryId = "toonflow-structural-replica-entry";
        if (document.getElementById(entryId)) return;

        const styleId = "toonflow-structural-replica-entry-style";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = [
            "#" + entryId + "{position:fixed;right:18px;bottom:18px;z-index:2147483647;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px;border:1px solid rgba(0,0,0,.18);border-radius:6px;background:#111318;color:#fff;font:600 14px/1.2 'Microsoft YaHei UI','Microsoft YaHei','Segoe UI',sans-serif;letter-spacing:0;box-shadow:0 10px 24px rgba(16,24,40,.18);cursor:pointer;}",
            "#" + entryId + ":hover{background:#24262a;}",
            "#" + entryId + " .tf-sr-mark{width:16px;height:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:2px;}",
            "#" + entryId + " .tf-sr-mark i{display:block;border:1px solid rgba(255,255,255,.9);border-radius:2px;}"
          ].join("");
          document.head.appendChild(style);
        }

        const button = document.createElement("button");
        button.id = entryId;
        button.type = "button";
        button.title = "\\u7ed3\\u6784\\u590d\\u523b";
        button.setAttribute("aria-label", "\\u6253\\u5f00\\u7ed3\\u6784\\u590d\\u523b");

        const mark = document.createElement("span");
        mark.className = "tf-sr-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.innerHTML = "<i></i><i></i><i></i><i></i>";

        const label = document.createElement("span");
        label.textContent = "\\u7ed3\\u6784\\u590d\\u523b";

        button.append(mark, label);
        button.addEventListener("click", () => {
          window.location.href = ${JSON.stringify(targetUrl)};
        });
        document.body.appendChild(button);
      })();
    `;

    win.webContents.executeJavaScript(script).catch((err) => {
      console.warn("[structural-replica-entry] inject failed:", err);
    });
  });
}

function createMainWindow(port?: string | number): Promise<void> {
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

    if (port) injectStructuralReplicaEntry(win, port);

    if (process.env.VITE_DEV) {
      void win.loadURL("http://localhost:50188");
    } else {
      const htmlPath = getWebFilePath("index.html");
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
    let servePath: string;
    if (app.isPackaged) {
      // Yield once so the loading window can render before packaged data copy work.
      await new Promise((r) => setTimeout(r, 0));
      initializeData();
      servePath = path.join(app.getPath("userData"), "data", "serve", "app.js");
    } else {
      // In development, load TypeScript source through the registered tsx hook.
      servePath = path.join(process.cwd(), "src", "app.ts");
    }
    // Install custom module paths before loading the backend service.
    installPersistentNodeModulePaths();
    const mod = requireWithCustomPaths(servePath);
    closeServeFn = mod.closeServe;
    const port = await mod.default(true);
    process.env.PORT = String(port);
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
    // Register protocol handlers used by the renderer.
    protocol.handle("toonflow", (request) => {
      const url = new URL(request.url);
      const pathname = url.hostname.toLowerCase();
      const handlers: Record<string, () => object> = {
        getappurl: () => ({ url: process.env.URL ?? `http://localhost:${port}/api` }),
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
          app.exit(0);
          return { ok: true };
        },
        openstructuralreplica: () => {
          mainWindow?.loadURL(getLocalWebUrl(port, "structural-replica.html"));
          return { ok: true };
        },
        openmain: () => {
          if (process.env.VITE_DEV) {
            mainWindow?.loadURL("http://localhost:50188");
          } else {
            mainWindow?.loadFile(getWebFilePath("index.html"));
          }
          return { ok: true };
        },
        apprestart: () => {
          // Let the response return before relaunching.
          setTimeout(() => {
            app.relaunch();
            app.exit(0);
          }, 500);
          return { ok: true, message: "搴旂敤鍗冲皢閲嶅惎" };
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
            return { ok: false, error: "缂哄皯url鍙傛暟" };
          }
        },
        getlocallanguage: () => {
          // Read the application locale.

          // macOS exposes the full user locale through system preferences.
          if (process.platform === "darwin") {
            const systemLocale = systemPreferences.getUserDefault("AppleLocale", "string");
            return { ok: true, local: systemLocale };
          }
          const appLocale = app.getLocale();
          return { ok: true, local: appLocale };
        },
      };

      const handler = handlers[pathname];

      const responseData = handler ? handler() : { error: "鏈煡鎺ュ彛" };
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    });

    // Create the main window after the backend service is ready.
    await createMainWindow(port);
  } catch (err) {
    console.error("[鏈嶅姟鍚姩澶辫触]:", err);
    await createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("before-quit", async (event) => {
  if (closeServeFn) await closeServeFn();
  restoreNodeModulePaths?.();
});
