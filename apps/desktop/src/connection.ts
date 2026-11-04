import express from "express";
import { once } from "node:events";
import { hostname } from "node:os";
import { posix } from "node:path";
import type { AddressInfo, Socket } from "node:net";
import type { Server } from "node:http";
import { createRemoteConnection } from "@toonflow/server/remoteConnection";
import { getMobileLinkConfig, getMobileLinkStatus, startMobileLinkRuntime, stopMobileLinkRuntime, suspendMobileLinkRuntime } from "@toonflow/server/mobileLink";
import { initializeMcpRuntime, stopMcpRuntime } from "@toonflow/server/mcp";
import { languageRequest, translateError, translateMessage } from "@toonflow/server/i18n";
import { isEnabled, startMultiTenantRuntime, stopMultiTenantRuntime } from "@toonflow/server/multiTenant";

export default async function createDesktopConnection(app: express.Express, directory: string, mcpEntry: string,
  onNavigate: (port: number, remote: boolean, hostMode: boolean) => void, onError: (error: unknown) => void) {
  let current: { connection: Awaited<ReturnType<typeof createRemoteConnection>>; server: Server; sockets: Set<Socket>; port: number };
  let switching = false;
  let closed = false;
  // ACT: 首次开启后主窗口固定为后台直到退出，关闭开关不恢复本进程的创作入口。
  let hostMode = isEnabled();
  const localOnly = () => hostMode || isEnabled();
  function requireRemoteConnection() {
    if (localOnly()) throw Object.assign(new Error("多租户主机模式下不能连接其他设备"), { status: 409 });
  }
  const nativePosts = new Set([
    "/api/desktop/ready", "/api/desktop/devtools", "/api/desktop/clipboard/read", "/api/desktop/clipboard/write",
    "/api/desktop/notification",
    "/api/desktop/selectSaveFile", "/api/desktop/saveFile", "/api/desktop/providerFile/select", "/api/desktop/providerFile/read",
  ]);

  async function start() {
    const connection = await createRemoteConnection(directory, {
      deviceName: `Toonflow ${hostname()}`,
      appVersion: app.locals.appVersion,
      localOnly,
      validateTarget(source) {
        requireRemoteConnection();
        const target = new URL(source);
        const sharing = getMobileLinkStatus(app);
        if (sharing.enabled || getMobileLinkConfig().enabled) {
          throw Object.assign(new Error("请先在设置 → 设备互联中关闭“允许其他设备连接”"), { status: 409 });
        }
        const localHost = /^(127\.|localhost$|\[::1\]$)/.test(target.hostname);
        const port = Number(target.port || (target.protocol === "https:" ? 443 : 80));
        if ([...sharing.addresses, sharing.publicUrl].includes(target.origin) ||
          localHost && (port === sharing.port || port === current?.port)) {
          throw new Error("不能连接当前设备自己的服务地址");
        }
      },
      async onChange() {
        requireRemoteConnection();
        suspendMobileLinkRuntime(app);
        await stopMcpRuntime();
        if (localOnly()) {
          if (!closed) await initializeMcpRuntime(app, `http://127.0.0.1:${current.port}`, mcpEntry);
          requireRemoteConnection();
        }
        switching = true;
      },
      restart() {
        void (async () => {
          if (closed) return;
          if (localOnly()) {
            // ACT: 连接提交后可能恰好晋升平台主机，不为旧设备切换停掉同一进程的 10888。
            await initializeMcpRuntime(app, `http://127.0.0.1:${current.port}`, mcpEntry);
            switching = false;
            return;
          }
          await stopGateway();
          if (closed) return;
          current = await start();
          if (closed) { await stopGateway(); stopMobileLinkRuntime(app); await stopMcpRuntime(); return; }
          switching = false;
          onNavigate(current.port, current.connection.remote, hostMode);
        })().catch(onError);
      },
    });
    if (connection.remote) {
      suspendMobileLinkRuntime(app);
      await stopMcpRuntime();
    } else {
      await startMultiTenantRuntime(app, enabled => {
        if (closed) return;
        if (enabled) hostMode = true;
        if (hostMode && current?.server.listening) onNavigate(current.port, current.connection.remote, hostMode);
      });
      await startMobileLinkRuntime(app).catch(error => console.error("设备互联启动失败：", error));
    }
    const gateway = express();
    gateway.use(languageRequest);
    let origin = "";
    gateway.use((req, res, next) => {
      const localSocket = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "");
      const source = req.get("origin");
      const referer = req.get("referer");
      if (!localSocket || `http://${req.get("host")}` !== origin ||
        source !== undefined && source !== origin || referer !== undefined && !referer.startsWith(`${origin}/`)) {
        return void res.sendStatus(403);
      }
      if (switching || closed) return void res.status(409).json({ message: translateMessage("正在切换设备连接，请稍候") });
      res.set("Cache-Control", "no-store");
      if (req.method === "GET" && req.path === "/") {
        const target = new URL(req.originalUrl, origin);
        target.searchParams.set("desktop", "1");
        target.searchParams.delete("mobile");
        if (connection.remote) target.searchParams.set("remote", "1");
        else target.searchParams.delete("remote");
        if (`${target.pathname}${target.search}` !== req.originalUrl) return void res.redirect(`${target.pathname}${target.search}`);
      }
      next();
    });
    gateway.use("/api/connection", connection.router);
    gateway.use((req, res, next) => {
      if (!connection.remote) return app(req, res, next);
      // ACT: 远端页面不能把原生握手凭据经代理发送到其他主机。
      if (req.path === "/api/multiTenant/hostSession") return void res.sendStatus(403);
      if (req.method === "GET" && req.path === "/api/desktop/update" || req.method === "POST" && nativePosts.has(req.path)) {
        return app(req, res, next);
      }
      const path = posix.normalize(decodeURIComponent(req.path).replaceAll("\\", "/")).toLowerCase();
      if (path === "/api/desktop" || path.startsWith("/api/desktop/")) {
        return void res.status(403).json({ message: translateMessage("请先断开设备连接，再管理本机功能") });
      }
      connection.proxy!(req, res, next);
    });
    gateway.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) return next(error);
      res.status(500).json({ message: error instanceof Error ? translateError(error) : translateMessage("设备连接失败") });
    });
    const server = gateway.listen(0, "127.0.0.1");
    const sockets = new Set<Socket>();
    server.on("connection", socket => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;
    origin = `http://127.0.0.1:${port}`;
    if (!connection.remote) await initializeMcpRuntime(app, origin, mcpEntry);
    return { connection, server, sockets, port };
  }

  async function stopGateway() {
    current?.connection.stop();
    await stopMultiTenantRuntime(app);
    if (!current?.server) return;
    await new Promise<void>(resolve => {
      current.server.close(() => resolve());
      // Bun 的 closeAllConnections 未可靠关闭 SSE，显式释放旧页面的全部连接。
      for (const socket of current.sockets) socket.destroy();
    });
  }

  current = await start();
  return {
    get port() { return current.port; },
    get remote() { return current.connection.remote; },
    get hostMode() { return hostMode; },
    async close() {
      closed = true;
      stopMobileLinkRuntime(app);
      await Promise.all([stopGateway(), stopMcpRuntime()]);
    },
  };
}
