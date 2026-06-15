import { app, BrowserWindow, protocol } from "electron";
import { fork, ChildProcess } from "child_process";
import os from "os";
import http from "http";
import httpProxy from "http-proxy";
import path from "path";
import express from "express";

const exeDir = path.dirname(process.execPath);
const cpus = process.env.NODE_ENV === "dev" ? 1 : os.cpus().length;
const isElectron = process.env.NODE_ENV === "electron";
const webDir = isElectron ? path.join(exeDir, "resources", "app", "build", "web") : "";

const logo = app.isPackaged ? path.join(__dirname, "logo.ico") : path.resolve(__dirname, "../../assets/logo.ico");

let baseUrl = "http://localhost:50188";
let mainWindow: BrowserWindow | null = null;
const workers: ChildProcess[] = [];

const expressApp = express();
if (webDir) expressApp.use("/web", express.static(webDir));

const server = http.createServer(expressApp);

if (isElectron) {
  server.listen(0, () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
    console.log(`[统一服务] http://localhost:${port}`);
  });
}

function startServe(): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const baseDir = app.isPackaged ? app.getAppPath() : path.resolve(process.cwd(), "../../");
    const serveEntry = path.join(baseDir, "build", "server", "app.cjs");
    const workerCount = Math.max(1, cpus - 1);
    const ports: number[] = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = fork(serveEntry, [], {
        execPath: process.execPath,
        env: {
          ...process.env,
          NODE_ENV: "electron",
          WORKER_ID: String(i),
          PORT: "0",
          BUILDDIR: path.join(exeDir, "resources", "app", "build"),
          DATADIR: path.join(app.getPath("userData"), "data"),
          ELECTRON_RUN_AS_NODE: "1",
        },
        stdio: ["inherit", "inherit", "inherit", "ipc"],
      });

      worker.on("message", (msg: { type: string; port: number }) => {
        if (msg?.type === "ready") {
          ports.push(msg.port);
          if (ports.length === workerCount) resolve(ports);
        }
      });

      worker.on("error", (err) => {
        console.error(`Worker ${i} error:`, err);
        reject(err);
      });

      workers.push(worker);
    }
  });
}

function setupProxy(ports: number[]): void {
  const proxy = httpProxy.createProxyServer({ ws: true, xfwd: true });

  proxy.on("error", (err, _req, res) => {
    console.error("[代理错误]", err?.message ?? err);
    const r = res as any;
    if (r?.writeHead && !r.headersSent) {
      r.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      r.end("Bad Gateway");
    } else r?.destroy?.();
  });

  let rrIndex = 0;
  const nextPort = (): number => ports[rrIndex++ % ports.length];

  const stickyMap = new Map<string, number>();
  const stickyPort = (key: string): number => {
    let port = stickyMap.get(key);
    if (port === undefined || !ports.includes(port)) {
      port = nextPort();
      stickyMap.set(key, port);
    }
    return port;
  };

  const clientKey = (req: http.IncomingMessage): string =>
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";

  const isSocketPath = (url?: string): boolean => !!url && url.startsWith("/api/socket/");

  expressApp.use("/api", (req, res) => {
    const port = isSocketPath(req.originalUrl) ? stickyPort(clientKey(req)) : nextPort();
    proxy.web(req, res, { target: `http://127.0.0.1:${port}` });
  });

  expressApp.use("/oss", (req, res) => {
    proxy.web(req, res, { target: `http://127.0.0.1:${nextPort()}` });
  });

  server.on("upgrade", (req, socket, head) => {
    const port = isSocketPath(req.url) ? stickyPort(clientKey(req)) : nextPort();
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${port}` });
  });

  console.log(`[代理] 负载均衡已挂载 -> workers:[${ports.join(", ")}]`);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: logo,
    webPreferences: {
      contextIsolation: false,
      backgroundThrottling: false,
      experimentalFeatures: true,
      webgl: true,
      scrollBounce: true,
      webviewTag: true,
      v8CacheOptions: "bypassHeatCheckAndEagerCompile",
    },
  });

  mainWindow.removeMenu();

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      const wc = mainWindow!.webContents;
      if (wc.isDevToolsOpened()) wc.closeDevTools();
      else wc.openDevTools({ mode: "detach" });
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => (mainWindow = null));
}

[
  "--enable-gpu-rasterization",
  "--enable-zero-copy",
  "--ignore-gpu-blocklist",
  "--enable-oop-rasterization",
  "--disable-spell-checking",
  "--disable-background-networking",
].forEach((sw) => app.commandLine.appendSwitch(sw));

app.whenReady().then(() => {
  createWindow();
  mainWindow?.loadURL(`${baseUrl}/web/#/loading`);

  if (process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "electron")
    startServe()
      .then((ports) => {
        setupProxy(ports);
        console.log(`[主进程] 服务就绪 ${baseUrl}`);

        const inject = () =>
          mainWindow?.webContents.executeJavaScript(`window.__serverReady = true; window.dispatchEvent(new CustomEvent('server-ready'));`);

        if (mainWindow?.webContents.isLoading()) mainWindow.webContents.once("did-finish-load", inject);
        else inject();
      })
      .catch((err) => {
        console.error("[主进程] 启动服务失败:", err);
        mainWindow?.loadURL(`${baseUrl}/web/#/error?err=${encodeURIComponent(String(err))}`);
      });

  protocol.handle("toonflow", (request) => {
    const url = new URL(request.url);
    const filePath = path.join(exeDir, "resources", "app", "build", url.pathname);
    return new Response(JSON.stringify({}));
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  workers.forEach((worker) => worker.kill());
  if (process.platform !== "darwin") app.quit();
});
