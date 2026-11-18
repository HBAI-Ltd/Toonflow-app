import { timingSafeEqual } from "node:crypto";
import { networkInterfaces } from "node:os";
import {
  base64ToBytes, bytesToBase64, matchServicePath, normalizeServicePath, pluginServerLimits, readBody,
} from "@toonflow/plugin-server/protocol";
import type { PluginHttpResponse } from "@toonflow/plugin-server/protocol";
import type { PluginRuntime, PluginService, PluginSocket } from "./types";

const hiddenHeaders = new Set([
  "authorization", "cookie", "set-cookie", "host", "connection", "upgrade", "transfer-encoding", "content-length",
  "content-encoding", "keep-alive", "proxy-authorization", "proxy-authenticate", "trailer", "te", "forwarded",
]);

function headersFrom(headers: Iterable<[string, string]>) {
  return [...headers].filter(([name]) => {
    const key = name.toLowerCase();
    return !hiddenHeaders.has(key) && !key.startsWith("sec-") && !key.startsWith("x-forwarded-") && key !== "x-real-ip";
  });
}

function responseHeaders(input: Iterable<[string, string]> = []) {
  const headers = new Headers(headersFrom(input));
  // 插件响应属于隔离页面；不能取得主应用 origin、Cookie 或注册 Service Worker。
  headers.set("Content-Security-Policy", "sandbox allow-scripts allow-forms allow-downloads; base-uri 'none'; worker-src 'none'");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.delete("access-control-allow-credentials");
  headers.delete("service-worker-allowed");
  headers.delete("clear-site-data");
  return headers;
}

function failure(status: number) {
  return new Response(null, { status, headers: responseHeaders() });
}

function allowMessage(service: PluginService) {
  const now = Date.now();
  if (now - service.windowStartedAt >= 1000) { service.windowStartedAt = now; service.messages = 0; }
  if (++service.messages > 256) throw Object.assign(new Error("插件服务请求过于频繁"), { status: 429 });
}

function locate(runtime: PluginRuntime, request: Request) {
  const url = new URL(request.url);
  const match = /^\/pluginServices\/([a-f0-9-]{36})\/([A-Za-z0-9_-]{43})(\/.*)$/.exec(url.pathname);
  if (!match) throw Object.assign(new Error("插件服务不存在"), { status: 404 });
  const service = runtime.services.get(match[1]!);
  const token = Buffer.from(match[2]!);
  if (!service || service.closed || token.length !== service.token.length || !timingSafeEqual(token, Buffer.from(service.token))) {
    throw Object.assign(new Error("插件服务不存在或访问凭据无效"), { status: 404 });
  }
  if (request.headers.get("service-worker")) throw Object.assign(new Error("插件服务不能注册 Service Worker"), { status: 403 });
  const path = normalizeServicePath(match[3]!);
  if (url.search.length > 16384) throw Object.assign(new Error("插件服务请求参数过长"), { status: 414 });
  allowMessage(service);
  return { service, path, query: url.search.slice(1) };
}

function hasRoute(service: PluginService, method: string, path: string) {
  return service.routes.some(route => (route.method === method || method === "HEAD" && route.method === "GET")
    && matchServicePath(route.path, path) !== undefined);
}

async function dispatchHttp(request: Request, service: PluginService, path: string, query: string) {
  if (!hasRoute(service, request.method, path)) return failure(404);
  if (service.requests.size >= 16 || [...service.owner.services.values()].reduce((count, item) => count + item.requests.size, 0) >= 32) return failure(429);
  if (request.signal.aborted || service.closed) return failure(503);
  const requestId = crypto.randomUUID();
  return new Promise<Response>(resolve => {
    let completed = false;
    let dispatched = false;
    const controller = new AbortController();
    const finish = (response?: PluginHttpResponse, status = 503) => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      controller.abort();
      request.signal.removeEventListener("abort", cancel);
      service.requests.delete(requestId);
      try {
        if (!response) return resolve(failure(status));
        const headers = responseHeaders(response.headers);
        const bytes = base64ToBytes(response.body);
        const noBody = request.method === "HEAD" || [204, 205, 304].includes(response.status);
        resolve(new Response(noBody ? null : bytes, { status: response.status, headers }));
      } catch { resolve(failure(502)); }
    };
    const cancel = () => {
      finish(undefined, 504);
      if (dispatched && !service.closed && !service.owner.closed) {
        try { service.owner.send({ type: "cancel", serviceId: service.id, requestId }); }
        catch { service.owner.close(); }
      }
    };
    const timer = setTimeout(cancel, pluginServerLimits.requestMs);
    timer.unref();
    service.requests.set(requestId, { finish });
    request.signal.addEventListener("abort", cancel, { once: true });
    if (request.signal.aborted) return cancel();
    // 上传阶段也占并发名额并受同一超时控制，避免慢请求绕过配额。
    void (async () => {
      const body = request.method === "GET" || request.method === "HEAD" ? null
        : bytesToBase64(await readBody(request.body, pluginServerLimits.bodyBytes, controller.signal));
      if (completed) return;
      dispatched = true;
      service.owner.send({ type: "request", serviceId: service.id, requestId, method: request.method, path, query,
        headers: headersFrom(request.headers), body });
    })().catch(cause => {
      if (completed) return;
      finish(undefined, cause instanceof Error && cause.message.includes("8 MB") ? 413 : 400);
      if (dispatched) service.owner.close();
    });
  });
}

export function openGateway(runtime: PluginRuntime) {
  clearTimeout(runtime.idleTimer);
  runtime.idleTimer = undefined;
  if (runtime.gateway) return runtime.gateway;
  const port = Number(process.env.TOONFLOW_PLUGIN_SERVER_PORT ?? 0);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("插件服务端口必须是 0–65535 之间的整数");
  // ACT: 同一 Bun 进程的一层能力网关，只暴露已注册服务，不装配第二套应用或主机 API。
  runtime.gateway = Bun.serve<PluginSocket>({
    hostname: "0.0.0.0", port, maxRequestBodySize: pluginServerLimits.bodyBytes, idleTimeout: 60,
    async fetch(request, server) {
      try {
        const { service, path, query } = locate(runtime, request);
        await service.owner.assertActive();
        if (service.closed || service.owner.closed) return failure(503);
        if (request.method === "OPTIONS" && request.headers.has("access-control-request-method")) {
          const headers = responseHeaders();
          const requested = request.headers.get("access-control-request-headers") ?? "";
          if (requested.length > 2048 || /[\r\n]/.test(requested)) return failure(400);
          headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
          headers.set("Access-Control-Allow-Headers", requested);
          return new Response(null, { status: 204, headers });
        }
        if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
          if (!hasRoute(service, "WS", path)) return failure(404);
          if (service.sockets.size >= pluginServerLimits.sockets) return failure(429);
          const origin = request.headers.get("origin");
          // 接入依赖显式服务凭据而非 Cookie，允许被授权的其他网页与原生客户端。
          if (origin && origin !== "null") {
            const source = new URL(origin);
            if (!["http:", "https:"].includes(source.protocol) || source.origin !== origin) return failure(403);
          }
          return server.upgrade(request, { data: { service, id: crypto.randomUUID(), path, query, headers: headersFrom(request.headers) } })
            ? undefined : failure(400);
        }
        return await dispatchHttp(request, service, path, query);
      } catch (cause) { return failure((cause as { status?: number }).status ?? 400); }
    },
    websocket: {
      maxPayloadLength: pluginServerLimits.socketBytes,
      backpressureLimit: pluginServerLimits.socketBufferBytes,
      closeOnBackpressureLimit: true,
      idleTimeout: 60,
      open(socket) {
        const { service, id, path, query, headers } = socket.data;
        if (service.closed || service.owner.closed || service.sockets.size >= pluginServerLimits.sockets) return socket.close(1008);
        service.sockets.set(id, socket);
        try { service.owner.send({ type: "socketOpen", serviceId: service.id, socketId: id, path, query, headers }); }
        catch { service.owner.close(); }
      },
      message(socket, message) {
        const { service, id } = socket.data;
        if (service.closed || service.owner.closed) return socket.close(1001);
        try {
          allowMessage(service);
          service.owner.send({ type: "socketMessage", serviceId: service.id, socketId: id,
            data: typeof message === "string" ? { type: "text", value: message } : { type: "binary", value: bytesToBase64(message) } });
        } catch { socket.close(1008); }
      },
      close(socket, code, reason) {
        const { service, id } = socket.data;
        service.sockets.delete(id);
        if (!service.closed && !service.owner.closed) {
          try { service.owner.send({ type: "socketClose", serviceId: service.id, socketId: id, code, reason }); }
          catch { service.owner.close(); }
        }
      },
    },
  });
  return runtime.gateway;
}

export function serviceUrl(runtime: PluginRuntime, service: PluginService) {
  const gateway = openGateway(runtime);
  let origin = process.env.TOONFLOW_PLUGIN_SERVER_URL;
  if (origin) {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("插件服务公网地址必须是不含路径和凭据的 HTTP 或 HTTPS 根地址");
    }
    origin = url.origin;
  } else {
    const source = new URL(service.owner.origin);
    if (source.protocol === "https:") throw new Error("HTTPS 部署请配置 TOONFLOW_PLUGIN_SERVER_URL 与插件服务反向代理");
    let host = source.hostname;
    if (["localhost", "127.0.0.1", "[::1]"].includes(host)) {
      const local = Object.values(networkInterfaces()).flatMap(value => value ?? []).filter(value => value.family === "IPv4" && !value.internal
        && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value.address))
        .sort((left, right) => Number(right.address.startsWith("192.168.")) - Number(left.address.startsWith("192.168.")));
      host = local[0]?.address ?? host;
    }
    origin = `http://${host}:${gateway.port}`;
  }
  return `${origin}/pluginServices/${service.id}/${service.token}/`;
}

export function closeService(runtime: PluginRuntime, service: PluginService) {
  if (service.closed) return;
  service.closed = true;
  runtime.services.delete(service.id);
  service.owner.services.delete(service.id);
  for (const [requestId, registration] of service.owner.registrations) {
    if (registration.serviceId === service.id) service.owner.registrations.delete(requestId);
  }
  for (const pending of service.requests.values()) pending.finish();
  for (const socket of service.sockets.values()) socket.close(1001, "Service stopped");
  service.sockets.clear();
  if (!service.owner.closed) {
    try { service.owner.send({ type: "serviceClosed", serviceId: service.id }); }
    catch { service.owner.close(); }
  }
  scheduleGatewayStop(runtime);
}

export function scheduleGatewayStop(runtime: PluginRuntime) {
  if (runtime.services.size || runtime.idleTimer) return;
  runtime.idleTimer = setTimeout(() => {
    runtime.idleTimer = undefined;
    if (runtime.services.size) return;
    const gateway = runtime.gateway;
    runtime.gateway = undefined;
    void gateway?.stop(true);
  }, 1000);
  runtime.idleTimer.unref();
}
