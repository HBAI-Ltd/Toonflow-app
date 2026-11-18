import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Application, Request, Response } from "express";
import { z } from "zod";
import { base64ToBytes, normalizeServicePath, pluginServerLimits, validateSocketClose } from "@toonflow/plugin-server/protocol";
import { translateError, translateMessage } from "@/lib/i18n";
import { assertAppRequest, getAppOrigin } from "@/utils/mcp/control";
import { authenticateWeb } from "@/utils/multiTenant";
import { isEnabled } from "@/utils/multiTenant/mode";
import { isMobileLinkRequest, getMobileLinkConfig } from "@/utils/mobileLink";
import { closeService, scheduleGatewayStop, serviceUrl } from "./gateway";
import type { PluginOwner, PluginRuntime, PluginService } from "./types";

const runtimes = new WeakMap<Application, PluginRuntime>();
const headersSchema = z.array(z.tuple([z.string().min(1).max(256), z.string().max(16384)])).max(128);
const binarySchema = z.string().max(Math.ceil(pluginServerLimits.bodyBytes / 3) * 4);
const routeSchema = z.strictObject({ method: z.enum(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "WS"]), path: z.string().max(2048) });
const socketDataSchema = z.strictObject({ type: z.enum(["text", "binary"]), value: z.string().max(Math.ceil(pluginServerLimits.socketBytes / 3) * 4) });
export const messageSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("register"), requestId: z.uuid(), routes: z.array(routeSchema).min(1).max(pluginServerLimits.routes) }),
  z.strictObject({ type: z.literal("cancelRegister"), requestId: z.uuid() }),
  z.strictObject({ type: z.literal("unregister"), serviceId: z.uuid() }),
  z.strictObject({ type: z.literal("response"), serviceId: z.uuid(), requestId: z.uuid(), status: z.number().int().min(200).max(599), headers: headersSchema, body: binarySchema }),
  z.strictObject({ type: z.literal("socketSend"), serviceId: z.uuid(), socketId: z.uuid(), data: socketDataSchema }),
  z.strictObject({ type: z.literal("socketClose"), serviceId: z.uuid(), socketId: z.uuid(), code: z.number().int(), reason: z.string().max(123) })
    .refine(value => { try { validateSocketClose(value.code, value.reason); return true; } catch { return false; } }),
]);

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }

function requireRuntime(app: Application) {
  const runtime = runtimes.get(app);
  if (!runtime) throw Object.assign(new Error("插件服务尚未初始化"), { status: 503 });
  return runtime;
}

export function initializePluginServerRuntime(app: Application) {
  if (!runtimes.has(app)) runtimes.set(app, { owners: new Map(), services: new Map() });
}

export function createConnection(req: Request) {
  assertAppRequest(req);
  const runtime = requireRuntime(req.app);
  const enabled = isEnabled();
  const user = req.res?.locals.multiTenantUser as { id: string; role: string } | undefined;
  if (enabled && (!req.res?.locals.multiTenantWeb || !user)) throw Object.assign(new Error("请先登录 Toonflow"), { status: 401 });
  const origin = getAppOrigin(req);
  const deviceToken = isMobileLinkRequest(req) ? req.get("x-toonflow-device-token") ?? "" : undefined;
  const identity = user ? `${user.role}:${user.id}` : deviceToken ? `device:${digest(deviceToken)}` : `host:${origin}`;
  if (runtime.owners.size >= 128 || [...runtime.owners.values()].filter(owner => owner.identity === identity).length >= 8) {
    throw Object.assign(new Error("插件服务连接数量超过限制"), { status: 429 });
  }
  const token = randomBytes(32).toString("base64url");
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let checking: Promise<void> | undefined;
  const owner: PluginOwner = {
    id: crypto.randomUUID(), tokenHash: digest(token), origin, identity, closed: false,
    services: new Map(), registrations: new Map(),
    async assertActive() {
      if (owner.closed) throw Object.assign(new Error("插件服务连接已关闭"), { status: 410 });
      if (!checking) checking = (async () => {
        if (enabled !== isEnabled()) throw Object.assign(new Error("运行模式已变化，请重新连接插件服务"), { status: 401 });
        if (enabled) {
          const current = await authenticateWeb(req);
          if (!current || `${current.role}:${current.id}` !== identity) throw Object.assign(new Error("请先登录 Toonflow"), { status: 401 });
        }
        if (deviceToken && !getMobileLinkConfig().devices.some(device => device.tokenHash === digest(deviceToken))) {
          throw Object.assign(new Error("设备未配对或授权已撤销"), { status: 401 });
        }
      })().catch(error => { owner.close(); throw error; }).finally(() => { checking = undefined; });
      return checking;
    },
    send(message) {
      const response = owner.response;
      if (owner.closed || !response || response.destroyed) throw new Error("插件服务连接已关闭");
      const data = `data: ${JSON.stringify(message)}\n\n`;
      if (response.writableLength + Buffer.byteLength(data) > 16 * 1024 * 1024) {
        owner.close();
        throw new Error("插件服务连接缓冲已满");
      }
      response.write(data);
    },
    close() {
      if (owner.closed) return;
      owner.closed = true;
      clearTimeout(pending);
      clearInterval(heartbeat);
      runtime.owners.delete(owner.id);
      for (const registration of owner.registrations.values()) registration.controller.abort();
      owner.registrations.clear();
      for (const service of owner.services.values()) closeService(runtime, service);
      owner.response?.end();
    },
  };
  // ACT: 未打开事件流的握手仅保留30秒；所有服务为当前进程内租约，不写数据库或工作区。
  const pending = setTimeout(() => { if (!owner.response) owner.close(); }, 30000);
  pending.unref();
  heartbeat = setInterval(() => {
    void owner.assertActive().then(() => {
      if (owner.response && !owner.response.destroyed) owner.response.write(": keepalive\n\n");
    }).catch(() => owner.close());
  }, 15000);
  heartbeat.unref();
  runtime.owners.set(owner.id, owner);
  return { connectionId: owner.id, token };
}

async function authorizeConnection(req: Request, connectionId: string) {
  assertAppRequest(req);
  const owner = requireRuntime(req.app).owners.get(connectionId);
  const authorization = req.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const tokenHash = Buffer.from(digest(token));
  const user = req.res?.locals.multiTenantUser as { id: string; role: string } | undefined;
  if (!owner || token.length !== 43 || !timingSafeEqual(tokenHash, Buffer.from(owner.tokenHash)) || owner.origin !== getAppOrigin(req)
    || isEnabled() && (!user || `${user.role}:${user.id}` !== owner.identity)) {
    throw Object.assign(new Error("插件服务连接凭据无效"), { status: 403 });
  }
  await owner.assertActive();
  return owner;
}

export async function connectEvents(req: Request, response: Response, connectionId: string) {
  const owner = await authorizeConnection(req, connectionId);
  if (owner.response) throw Object.assign(new Error("插件服务连接已存在"), { status: 409 });
  response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
  response.flushHeaders();
  owner.response = response;
  response.once("close", () => owner.close());
  response.write(`data: ${JSON.stringify({ type: "ready" })}\n\n`);
}

export async function handleMessage(req: Request, connectionId: string, value: unknown) {
  const message = messageSchema.parse(value);
  const owner = await authorizeConnection(req, connectionId);
  if (!owner.response) throw Object.assign(new Error("插件服务事件连接尚未就绪"), { status: 409 });
  const runtime = requireRuntime(req.app);
  if (message.type === "cancelRegister") {
    const registration = owner.registrations.get(message.requestId);
    registration?.controller.abort();
    owner.registrations.delete(message.requestId);
    const service = registration?.serviceId ? owner.services.get(registration.serviceId) : undefined;
    if (service) closeService(runtime, service);
    return;
  }
  if (message.type === "register") {
    if (owner.registrations.has(message.requestId)) throw Object.assign(new Error("插件服务注册请求重复"), { status: 409 });
    if (owner.registrations.size >= pluginServerLimits.services || runtime.services.size >= 256) {
      owner.send({ type: "registerFailed", requestId: message.requestId, error: translateMessage("插件服务数量超过限制") });
      return;
    }
    const registration: { controller: AbortController; serviceId?: string } = { controller: new AbortController() };
    owner.registrations.set(message.requestId, registration);
    let service: PluginService | undefined;
    try {
      const paths = new Set<string>();
      const routes = message.routes.map(route => {
        const path = normalizeServicePath(route.path, true);
        const key = `${route.method} ${path}`;
        if (paths.has(key)) throw new Error("插件服务路由重复");
        paths.add(key);
        return { method: route.method, path };
      });
      await owner.assertActive();
      registration.controller.signal.throwIfAborted();
      if (runtime.services.size >= 256) throw new Error("插件服务数量超过限制");
      service = { id: crypto.randomUUID(), token: randomBytes(32).toString("base64url"), owner, routes, closed: false,
        requests: new Map(), sockets: new Map(), windowStartedAt: Date.now(), messages: 0 };
      const url = serviceUrl(runtime, service);
      registration.serviceId = service.id;
      runtime.services.set(service.id, service);
      owner.services.set(service.id, service);
      owner.send({ type: "registered", requestId: message.requestId, serviceId: service.id, url });
    } catch (cause) {
      if (service) closeService(runtime, service);
      owner.registrations.delete(message.requestId);
      scheduleGatewayStop(runtime);
      if (!owner.closed && !registration.controller.signal.aborted) owner.send({ type: "registerFailed", requestId: message.requestId,
        error: cause instanceof Error ? translateError(cause) : translateMessage("插件服务启动失败") });
    }
    return;
  }
  const service = owner.services.get(message.serviceId);
  // 旧服务的迟到响应可忽略；不能通过自报serviceId访问其他连接的服务。
  if (!service || service.closed) {
    if (message.type === "response" || message.type === "unregister" || message.type === "socketClose") return;
    throw Object.assign(new Error("插件服务不存在"), { status: 404 });
  }
  if (message.type === "unregister") return closeService(runtime, service);
  if (message.type === "response") {
    base64ToBytes(message.body);
    new Headers(message.headers);
    service.requests.get(message.requestId)?.finish(message);
    return;
  }
  const socket = service.sockets.get(message.socketId);
  if (!socket) return;
  if (message.type === "socketClose") { socket.close(message.code, message.reason); return; }
  const data = message.data.type === "binary" ? base64ToBytes(message.data.value, pluginServerLimits.socketBytes) : message.data.value;
  const size = typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
  if (size > pluginServerLimits.socketBytes) throw Object.assign(new Error("插件服务消息超过 1 MB"), { status: 413 });
  const result = socket.send(data);
  if (result === 0 && size) throw Object.assign(new Error("插件服务连接已关闭或缓冲已满"), { status: 503 });
}

export function stopPluginServerRuntime(app: Application) {
  const runtime = runtimes.get(app);
  if (!runtime) return;
  for (const owner of runtime.owners.values()) owner.close();
  clearTimeout(runtime.idleTimer);
  runtime.idleTimer = undefined;
  const gateway = runtime.gateway;
  runtime.gateway = undefined;
  return gateway?.stop(true);
}
