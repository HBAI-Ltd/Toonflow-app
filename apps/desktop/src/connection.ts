import express from "express";
import { once } from "node:events";
import { hostname } from "node:os";
import { posix } from "node:path";
import type { AddressInfo, Socket } from "node:net";
import type { Server } from "node:http";
import { createRemoteConnection } from "@toonflow/server/remoteConnection";
import { getMobileLinkConfig, getMobileLinkStatus, startMobileLinkRuntime, stopMobileLinkRuntime, suspendMobileLinkRuntime } from "@toonflow/server/mobileLink";
import { initializeMcpRuntime, stopMcpRuntime } from "@toonflow/server/mcp";

export default async function createDesktopConnection(app: express.Express, directory: string, mcpEntry: string,
  onNavigate: (port: number, remote: boolean) => void, onError: (error: unknown) => void) {
  let current: { connection: Awaited<ReturnType<typeof createRemoteConnection>>; server: Server; sockets: Set<Socket>; port: number };
  let switching = false;
  let closed = false;
  const nativePosts = new Set([
    "/api/desktop/ready", "/api/desktop/devtools", "/api/desktop/clipboard/read", "/api/desktop/clipboard/write",
    "/api/desktop/selectSaveFile", "/api/desktop/saveFile", "/api/desktop/providerFile/select", "/api/desktop/providerFile/read",
  ]);

  async function start() {
    const connection = await createRemoteConnection(directory, {
      deviceName: `Toonflow ${hostname()}`,
      appVersion: app.locals.appVersion,
      validateTarget(source) {
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
        suspendMobileLinkRuntime(app);
        await stopMcpRuntime();
        switching = true;
      },
      restart() {
        void (async () => {
          await stopGateway();
          if (closed) return;
          current = await start();
          if (closed) { await stopGateway(); stopMobileLinkRuntime(app); await stopMcpRuntime(); return; }
          switching = false;
          onNavigate(current.port, current.connection.remote);
        })().catch(onError);
      },
    });
    if (connection.remote) {
      suspendMobileLinkRuntime(app);
      await stopMcpRuntime();
    } else await startMobileLinkRuntime(app).catch(error => console.error("设备互联启动失败：", error));
    const gateway = express();
    let origin = "";
    gateway.use((req, res, next) => {
      const localSocket = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "");
      const source = req.get("origin");
      const referer = req.get("referer");
      if (!localSocket || `http://${req.get("host")}` !== origin ||
        source !== undefined && source !== origin || referer !== undefined && !referer.startsWith(`${origin}/`)) {
        return void res.sendStatus(403);
      }
      if (switching || closed) return void res.status(409).json({ message: "正在切换设备连接，请稍候" });
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
      if (req.method === "GET" && req.path === "/api/desktop/update" || req.method === "POST" && nativePosts.has(req.path)) {
        return app(req, res, next);
      }
      const path = posix.normalize(decodeURIComponent(req.path).replaceAll("\\", "/")).toLowerCase();
      if (path === "/api/desktop" || path.startsWith("/api/desktop/")) {
        return void res.status(403).json({ message: "请先断开设备连接，再管理本机功能" });
      }
      connection.proxy!(req, res, next);
    });
    gateway.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) return next(error);
      res.status(500).json({ message: error instanceof Error ? error.message : "设备连接失败" });
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
    async close() {
      closed = true;
      stopMobileLinkRuntime(app);
      await Promise.all([stopGateway(), stopMcpRuntime()]);
    },
  };
}
