import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { posix } from "node:path";
import type { AuthIdentity } from "@toonflow/multi-tenant-auth";
import { authenticateHost, authenticateWeb } from "./index";
import { creationPort, isEnabled } from "./mode";
import { errorFromCause } from "@/lib/responseFormat";
import { getAppOrigin } from "@/utils/mcp/control";
import { stopMobileLinkRuntime } from "@/utils/mobileLink";
import { runWithIdentity } from "./context";

type Runtime = { started: boolean; server?: Server; sockets: Set<Socket>; queue: Promise<void>; onEnabledChange?: (enabled: boolean) => void };
const runtimes = new WeakMap<Application, Runtime>();
const userRoutes = new Set(["register", "login", "session", "logout", "host"].map(name => `/api/multitenant/user/${name}`));
const controlRoutes = new Set(["status", "setup", "login", "logout", "state", "enabled", "registration", "hostsession"].map(name => `/api/multitenant/${name}`));
const userReadRoutes = new Set(["/api/ai/models", "/api/ai/media/models", "/api/multitenant/user/balance", "/api/nodes/get", "/api/nodes/files", "/api/ext/list", "/api/ext/read", "/api/tools/get"]);
const modelWriteRoutes = new Set(["/api/ai/generate", "/api/ai/media/price", "/api/ai/media/generate", "/api/ai/media/tasks/status", "/api/ai/media/tasks/cancel"]);
const communityReads = new Set(["getAdvertisements", "getExploreProjects", "getExploreProject", "getExploreProcess", "getExploreDownload", "getSponsorList"]
  .map(name => `/api/channel/community/${name.toLowerCase()}`));
const platformPrefixes = ["/api/providers", "/api/plugins", "/api/mcp/servers", "/api/channel/account", "/api/channel/model", "/api/channel/provider", "/api/channel/subaccounts", "/api/channel/user", "/api/channel/wallet", "/api/channel/plugin"];
const platformControlRoutes = new Set(["nodes", "tools", "ext", "agents"].flatMap(kind =>
  ["install", "save", "setenabled", "uninstall", "connect"].map(action => `/api/${kind}/${action}`))
  .concat(["/api/agents/a2a/get", "/api/agents/a2a/save", "/api/settings/network/test"]));

function accessPath(req: Request) {
  const raw = req.path;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); }
  catch { throw Object.assign(new Error("请求路径无效"), { status: 400 }); }
  const normalized = posix.normalize(decoded.replaceAll("\\", "/"));
  const protectedPath = /^\/(api|mcp|a2a)(?:\/|$|%)/i;
  if (![raw, decoded, normalized].some(path => protectedPath.test(path))) return null;
  // Express 路由默认忽略大小写、接受尾斜线；接口路径不需要编码、反斜线或点目录，拒绝歧义再按同一规则授权。
  if (raw !== decoded || /[^\x21-\x7e]|\\/.test(raw) || raw.includes("//") || raw.split("/").some(part => part === "." || part === "..")) {
    throw Object.assign(new Error("请求路径无效"), { status: 400 });
  }
  return decoded.toLowerCase().replace(/\/+$/, "");
}

export function initializeMultiTenantRuntime(app: Application) {
  if (!runtimes.has(app)) runtimes.set(app, { started: false, sockets: new Set(), queue: Promise.resolve() });
}

function runtime(app: Application) {
  const value = runtimes.get(app);
  if (!value) throw Object.assign(new Error("多租户服务尚未初始化"), { status: 503 });
  return value;
}

function serial(value: Runtime, action: () => Promise<void>) {
  const current = value.queue.then(action);
  value.queue = current.catch(() => {});
  return current;
}

async function openListener(app: Application, value: Runtime) {
  if (value.server) return;
  const gateway = express();
  gateway.use((req, res, next) => {
    res.locals.multiTenantWeb = true;
    if (!isEnabled()) return res.status(503).json({ code: 503, data: null, message: "多租户尚未开启" });
    app(req, res, next);
  });
  gateway.use((cause: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(cause);
    const body = errorFromCause(cause);
    res.status(body.code).json(body);
  });
  const server = gateway.listen(creationPort, "0.0.0.0");
  server.on("connection", socket => { value.sockets.add(socket); socket.once("close", () => value.sockets.delete(socket)); });
  try {
    await new Promise<void>((resolve, reject) => {
      const ready = () => { server.off("error", failed); resolve(); };
      const failed = () => { server.off("listening", ready); reject(Object.assign(new Error("无法监听多租户端口 10888，请检查端口占用"), { status: 409 })); };
      server.once("listening", ready);
      server.once("error", failed);
    });
    value.server = server;
  } catch (cause) { server.close(() => {}); throw cause; }
}

async function closeListener(value: Runtime) {
  const server = value.server;
  value.server = undefined;
  if (!server) return;
  await new Promise<void>(resolve => {
    server.close(() => resolve());
    for (const socket of value.sockets) socket.destroy();
  });
}

export async function startMultiTenantRuntime(app: Application, onEnabledChange?: (enabled: boolean) => void) {
  const value = runtime(app);
  value.started = true;
  value.onEnabledChange = onEnabledChange;
  await serial(value, async () => {
    if (!isEnabled()) return;
    await openListener(app, value);
    stopMobileLinkRuntime(app);
  });
}

export async function stopMultiTenantRuntime(app: Application) {
  const value = runtimes.get(app);
  if (!value) return;
  value.started = false;
  await serial(value, () => closeListener(value));
}

export async function changeMultiTenantEnabled(app: Application, enabled: boolean, commit: () => void, response?: Response) {
  const value = runtime(app);
  await serial(value, async () => {
    if (!value.started) throw Object.assign(new Error("多租户服务尚未启动"), { status: 503 });
    const previous = isEnabled();
    const wasListening = !!value.server;
    if (enabled) await openListener(app, value);
    try { commit(); }
    catch (cause) { if (!wasListening) await closeListener(value); throw cause; }
    if (enabled) stopMobileLinkRuntime(app);
    if (!enabled) await closeListener(value);
    if (previous === enabled) return;
    let notified = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const notify = () => {
      if (notified) return;
      notified = true;
      clearTimeout(timer);
      response?.off("finish", notify);
      response?.off("close", notify);
      value.onEnabledChange?.(enabled);
    };
    if (response && !response.writableFinished && !response.destroyed) {
      response.once("finish", notify);
      response.once("close", notify);
      // 已提交的模式切换不依赖客户端继续接收响应，避免主窗口停留在旧入口。
      timer = setTimeout(notify, 500);
      timer.unref();
    } else notify();
  });
}

export function requestIdentity(req: Request): AuthIdentity | undefined {
  return req.res?.locals.multiTenantUser;
}

export async function multiTenantAccess(req: Request, res: Response, next: NextFunction) {
  if (!isEnabled()) return next();
  const path = accessPath(req);
  if (path === null) return next();
  const publicWeb = res.locals.multiTenantWeb === true;
  const managementRoute = controlRoutes.has(path)
    || ["/api/multitenant/users", "/api/multitenant/sourcemapping", "/api/multitenant/models", "/api/multitenant/providers", "/api/multitenant/billing"].some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  const desktopRoute = path === "/api/desktop" || path.startsWith("/api/desktop/");
  if (userRoutes.has(path) && (publicWeb || path === "/api/multitenant/user/session")) return next();
  if (!publicWeb && (managementRoute || path === "/api/desktop/ready")) return next();
  if (!publicWeb && !desktopRoute) throw Object.assign(new Error("请通过端口 10888 访问创作功能"), { status: 403 });
  const platformRoute = platformPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
    || platformControlRoutes.has(path) || path === "/api/ai/media/balance" || path === "/api/ai/media/balanceevents";
  if (publicWeb && (managementRoute || desktopRoute || platformRoute || path === "/api/mobilelink" || path.startsWith("/api/mobilelink/"))) {
    throw Object.assign(new Error("创作入口不能访问主机管理接口"), { status: 403 });
  }
  const user: AuthIdentity | null = !publicWeb && authenticateHost(req)
    ? { id: "admin", userName: "", role: "admin" } : await authenticateWeb(req);
  if (!user) throw Object.assign(new Error("请先登录 Toonflow"), { status: 401 });
  res.locals.multiTenantUser = user;
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) getAppOrigin(req);
  if (user.role === "admin") return runWithIdentity(user, next);
  const fileRoute = path.startsWith("/api/workspaces/") && path !== "/api/workspaces/files/reveal";
  const settingsRoute = path === "/api/settings/get" && req.method === "GET" || path === "/api/settings/save" && req.method === "PUT";
  if (fileRoute || settingsRoute || req.method === "GET" && userReadRoutes.has(path)
    || req.method === "POST" && modelWriteRoutes.has(path) || communityReads.has(path) && ["GET", "POST"].includes(req.method)) return runWithIdentity(user, next);
  throw Object.assign(new Error("当前账号尚未开放此功能"), { status: 403 });
}
