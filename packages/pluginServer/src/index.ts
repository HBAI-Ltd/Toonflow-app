import {
  base64ToBytes, bytesToBase64, decodeSocketData, encodeSocketData, matchServicePath,
  normalizeServicePath, pluginServerLimits, readBody, validateSocketClose,
  type PluginHttpRequest, type PluginServerTransport, type PluginServiceRoute, type ToHostMessage, type ToPluginMessage,
} from "./protocol.ts";

export type { PluginServerTransport, PluginServiceRoute, ToHostMessage, ToPluginMessage } from "./protocol.ts";
export { createServerClient } from "./client.ts";

export type PluginServerStatus = "stopped" | "starting" | "running" | "error";
export type PluginRequestContext = {
  request: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  signal: AbortSignal;
};
export type PluginRequestHandler = (context: PluginRequestContext) => unknown | Promise<unknown>;
export type PluginSocketClose = { code: number; reason: string };
export interface PluginServerSocket {
  readonly id: string;
  readonly request: Request;
  readonly params: Record<string, string>;
  readonly query: URLSearchParams;
  readonly signal: AbortSignal;
  send(data: unknown): void;
  onMessage(listener: (data: unknown) => void | Promise<void>): () => void;
  onClose(listener: (event: PluginSocketClose) => void): () => void;
  close(code?: number, reason?: string): void;
}
export type PluginSocketHandler = (socket: PluginServerSocket) => void | Promise<void>;
export interface PluginServer {
  readonly url: string;
  readonly status: PluginServerStatus;
  readonly error: Error | null;
  route(method: string, path: string, handler: PluginRequestHandler): PluginServer;
  get(path: string, handler: PluginRequestHandler): PluginServer;
  post(path: string, handler: PluginRequestHandler): PluginServer;
  put(path: string, handler: PluginRequestHandler): PluginServer;
  patch(path: string, handler: PluginRequestHandler): PluginServer;
  delete(path: string, handler: PluginRequestHandler): PluginServer;
  head(path: string, handler: PluginRequestHandler): PluginServer;
  options(path: string, handler: PluginRequestHandler): PluginServer;
  ws(path: string, handler: PluginSocketHandler): PluginServer;
  html(content: string, status?: number): Response;
  start(): Promise<string>;
  stop(): Promise<void>;
  dispose(): void;
  subscribe(listener: () => void): () => void;
}

type Route = PluginServiceRoute & { handler: PluginRequestHandler | PluginSocketHandler; score: number };
type SocketState = {
  controller: AbortController;
  messages: Set<(data: unknown) => void | Promise<void>>;
  closes: Set<(event: PluginSocketClose) => void>;
  queue: Promise<void>;
  queuedBytes: number;
};

function asError(cause: unknown) { return cause instanceof Error ? cause : new Error(String(cause)); }

function waitWithSignal<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function responseFrom(value: unknown): Response {
  if (value instanceof Response) return value;
  if (value === undefined) return new Response(null, { status: 204 });
  if (typeof value === "string") return new Response(value, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (value instanceof Blob || value instanceof ArrayBuffer) return new Response(value);
  if (ArrayBuffer.isView(value)) return new Response(new Uint8Array(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)));
  return Response.json(value);
}

export function createPluginServer(transport: PluginServerTransport, options: { signal?: AbortSignal } = {}): PluginServer {
  const routes: Route[] = [];
  const listeners = new Set<() => void>();
  const requests = new Map<string, AbortController>();
  const sockets = new Map<string, SocketState>();
  const abandoned = new Map<string, ReturnType<typeof setTimeout>>();
  let serviceId = "";
  let serviceUrl = "";
  let status: PluginServerStatus = "stopped";
  let error: Error | null = null;
  let disposed = false;
  let startPromise: Promise<string> | undefined;
  let starting: { id: string; resolve(url: string): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> } | undefined;
  let unsubscribe = () => {};

  function notify() { for (const listener of listeners) { try { listener(); } catch (cause) { console.error(cause); } } }
  function setError(cause: unknown) { error = asError(cause); notify(); }
  function releaseSubscription() { if (disposed && !abandoned.size) unsubscribe(); }
  function send(message: ToHostMessage) { return Promise.resolve().then(() => transport.send(message)); }
  function sendSocket(message: ToHostMessage) { void send(message).catch(cause => { setError(cause); void stop().catch(setError); }); }

  function select(method: string, path: string) {
    let result: { route: Route; params: Record<string, string> } | undefined;
    for (const route of routes) {
      if (route.method !== method && !(method === "HEAD" && route.method === "GET")) continue;
      const params = matchServicePath(route.path, path);
      if (!params) continue;
      if (!result || route.method === method && result.route.method !== method || route.method === result.route.method && route.score > result.route.score) result = { route, params };
    }
    return result;
  }

  function register(method: string, path: string, handler: Route["handler"]) {
    if (disposed) throw new Error("插件服务已释放");
    if (status === "starting" || status === "running") throw new Error("请在启动插件服务前注册路由");
    if (typeof handler !== "function") throw new Error("插件服务处理器必须是函数");
    path = normalizeServicePath(path, true);
    if (routes.length >= pluginServerLimits.routes) throw new Error("插件服务最多注册 128 条路由");
    const shape = path.replace(/:[a-z][a-zA-Z0-9]*/g, ":");
    if (routes.some(route => route.method === method && route.path.replace(/:[a-z][a-zA-Z0-9]*/g, ":") === shape)) throw new Error(`插件服务路由重复：${method} ${path}`);
    const score = path.split("/").reduce((score, segment) => score + (segment === "*" ? 0 : segment.startsWith(":") ? 1 : 2), 0);
    routes.push({ method, path, handler, score });
    return server;
  }

  function makeRequest(path: string, query: string, headers: [string, string][], signal: AbortSignal, method = "GET", body?: string | null) {
    const url = new URL(serviceUrl);
    const relative = normalizeServicePath(path).split("/").map(encodeURIComponent).join("/").slice(1);
    url.pathname = `${url.pathname.replace(/\/?$/, "/")}${relative}`;
    url.search = query;
    return new Request(url, { method, headers, signal, ...(body !== null && body !== undefined && method !== "GET" && method !== "HEAD" ? { body: base64ToBytes(body) } : {}) });
  }

  async function handleRequest(message: PluginHttpRequest) {
    const activeId = serviceId;
    if (requests.has(message.requestId)) return;
    const controller = new AbortController();
    requests.set(message.requestId, controller);
    const timer = setTimeout(() => controller.abort(new Error("插件服务请求超时")), pluginServerLimits.requestMs);
    try {
      const match = select(message.method, message.path);
      let response: Response;
      if (!match) response = new Response("Not Found", { status: 404 });
      else {
        const request = makeRequest(message.path, message.query, message.headers, controller.signal, message.method, message.body);
        const value = await waitWithSignal(Promise.resolve().then(() => (match.route.handler as PluginRequestHandler)({
          request, params: match.params, query: new URLSearchParams(message.query), signal: controller.signal,
        })), controller.signal);
        response = responseFrom(value);
      }
      if (message.method === "HEAD") void response.body?.cancel().catch(setError);
      const body = message.method === "HEAD" ? new Uint8Array() : await readBody(response.body, pluginServerLimits.bodyBytes, controller.signal);
      controller.signal.throwIfAborted();
      if (serviceId !== activeId) return;
      await send({ type: "response", serviceId: activeId, requestId: message.requestId, status: response.status, headers: [...response.headers], body: bytesToBase64(body) });
    } catch (cause) {
      if (controller.signal.aborted || serviceId !== activeId) return;
      setError(cause);
      await send({ type: "response", serviceId: activeId, requestId: message.requestId, status: 500, headers: [["Content-Type", "text/plain; charset=utf-8"]], body: bytesToBase64(new TextEncoder().encode(asError(cause).message.slice(0, 4000))) }).catch(setError);
    } finally { clearTimeout(timer); requests.delete(message.requestId); }
  }

  function finishSocket(id: string, code: number, reason: string) {
    const socket = sockets.get(id);
    if (!socket) return;
    sockets.delete(id);
    socket.controller.abort(new Error(reason || "插件服务连接已关闭"));
    for (const callback of socket.closes) { try { callback({ code, reason }); } catch (cause) { setError(cause); } }
    socket.messages.clear();
    socket.closes.clear();
  }

  function openSocket(message: Extract<ToPluginMessage, { type: "socketOpen" }>) {
    if (sockets.has(message.socketId)) return;
    const match = select("WS", message.path);
    if (!match || sockets.size >= pluginServerLimits.sockets) {
      sendSocket({ type: "socketClose", serviceId, socketId: message.socketId, code: 1008, reason: "连接未获准" });
      return;
    }
    const activeId = serviceId;
    const state: SocketState = { controller: new AbortController(), messages: new Set(), closes: new Set(), queue: Promise.resolve(), queuedBytes: 0 };
    sockets.set(message.socketId, state);
    const socket: PluginServerSocket = {
      id: message.socketId,
      request: makeRequest(message.path, message.query, message.headers, state.controller.signal),
      params: match.params,
      query: new URLSearchParams(message.query),
      signal: state.controller.signal,
      send(data) {
        if (state.controller.signal.aborted || serviceId !== activeId) throw new Error("插件服务连接已关闭");
        sendSocket({ type: "socketSend", serviceId: activeId, socketId: message.socketId, data: encodeSocketData(data) });
      },
      onMessage(callback) { state.messages.add(callback); return () => state.messages.delete(callback); },
      onClose(callback) { state.closes.add(callback); return () => state.closes.delete(callback); },
      close(code = 1000, reason = "") {
        validateSocketClose(code, reason);
        if (state.controller.signal.aborted) return;
        sendSocket({ type: "socketClose", serviceId: activeId, socketId: message.socketId, code, reason });
        finishSocket(message.socketId, code, reason);
      },
    };
    state.queue = waitWithSignal(Promise.resolve().then(() => {
      if (!state.controller.signal.aborted) return (match.route.handler as PluginSocketHandler)(socket);
    }), state.controller.signal).catch(cause => {
      if (state.controller.signal.aborted) return;
      setError(cause);
      socket.close(1011, "处理连接失败");
    });
  }

  function clearRunning(reason: string) {
    for (const controller of requests.values()) controller.abort(new Error(reason));
    requests.clear();
    for (const id of sockets.keys()) finishSocket(id, 1001, reason);
    serviceId = "";
    serviceUrl = "";
  }

  function cancelStart(cause: Error) {
    const pending = starting;
    if (!pending) return;
    starting = undefined;
    startPromise = undefined;
    clearTimeout(pending.timer);
    abandoned.set(pending.id, setTimeout(() => { abandoned.delete(pending.id); releaseSubscription(); }, pluginServerLimits.requestMs));
    void send({ type: "cancelRegister", requestId: pending.id }).catch(setError);
    pending.reject(cause);
  }

  function receive(message: ToPluginMessage) {
    if (message.type === "registered" || message.type === "registerFailed") {
      const abandonedTimer = abandoned.get(message.requestId);
      if (abandonedTimer) {
        clearTimeout(abandonedTimer);
        abandoned.delete(message.requestId);
        if (message.type === "registered") void send({ type: "unregister", serviceId: message.serviceId }).catch(setError);
        releaseSubscription();
        return;
      }
      const pending = starting;
      if (!pending || pending.id !== message.requestId) return;
      clearTimeout(pending.timer);
      starting = undefined;
      startPromise = undefined;
      if (message.type === "registerFailed") {
        status = "error";
        error = new Error(message.error);
        pending.reject(error);
      } else {
        serviceId = message.serviceId;
        serviceUrl = message.url;
        status = "running";
        error = null;
        pending.resolve(serviceUrl);
      }
      notify();
      return;
    }
    if (disposed || !serviceId || message.serviceId !== serviceId) return;
    if (message.type === "request") { void handleRequest(message); return; }
    if (message.type === "cancel") { requests.get(message.requestId)?.abort(new Error("请求已取消")); return; }
    if (message.type === "serviceClosed") {
      clearRunning(message.error ?? "插件服务已关闭");
      status = message.error ? "error" : "stopped";
      error = message.error ? new Error(message.error) : null;
      notify();
      return;
    }
    if (message.type === "socketOpen") { openSocket(message); return; }
    if (message.type === "socketClose") { finishSocket(message.socketId, message.code, message.reason); return; }
    const socket = sockets.get(message.socketId);
    if (!socket) return;
    const size = message.data.type === "binary" ? Math.ceil(message.data.value.length / 4) * 3 : new TextEncoder().encode(message.data.value).byteLength;
    if (size > pluginServerLimits.socketBytes + 2 || socket.queuedBytes + size > pluginServerLimits.socketBufferBytes) {
      sendSocket({ type: "socketClose", serviceId, socketId: message.socketId, code: 1013, reason: "消息处理过慢" });
      finishSocket(message.socketId, 1013, "消息处理过慢");
      return;
    }
    socket.queuedBytes += size;
    socket.queue = socket.queue.then(async () => {
      if (socket.controller.signal.aborted) return;
      const data = decodeSocketData(message.data);
      for (const callback of socket.messages) {
        if (socket.controller.signal.aborted) return;
        await waitWithSignal(Promise.resolve().then(() => callback(data)), socket.controller.signal);
      }
    }).catch(cause => {
      if (socket.controller.signal.aborted) return;
      setError(cause);
      sendSocket({ type: "socketClose", serviceId, socketId: message.socketId, code: 1011, reason: "处理消息失败" });
      finishSocket(message.socketId, 1011, "处理消息失败");
    }).finally(() => { socket.queuedBytes -= size; });
  }

  async function stop() {
    cancelStart(new Error("插件服务已停止"));
    const previousId = serviceId;
    clearRunning("插件服务已停止");
    status = "stopped";
    notify();
    if (previousId) await send({ type: "unregister", serviceId: previousId });
  }

  const server: PluginServer = {
    get url() { return serviceUrl; },
    get status() { return status; },
    get error() { return error; },
    route(method, path, handler) {
      method = method.toUpperCase();
      if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(method)) throw new Error("不支持的 HTTP 方法");
      return register(method, path, handler);
    },
    get: (path, handler) => register("GET", path, handler),
    post: (path, handler) => register("POST", path, handler),
    put: (path, handler) => register("PUT", path, handler),
    patch: (path, handler) => register("PATCH", path, handler),
    delete: (path, handler) => register("DELETE", path, handler),
    head: (path, handler) => register("HEAD", path, handler),
    options: (path, handler) => register("OPTIONS", path, handler),
    ws: (path, handler) => register("WS", path, handler),
    html: (content, responseStatus = 200) => new Response(content, { status: responseStatus, headers: { "Content-Type": "text/html; charset=utf-8" } }),
    start() {
      if (disposed || options.signal?.aborted) return Promise.reject(new Error("插件服务已释放"));
      if (serviceId) return Promise.resolve(serviceUrl);
      if (startPromise) return startPromise;
      if (!routes.length) return Promise.reject(new Error("请先注册插件服务路由"));
      status = "starting";
      error = null;
      const id = crypto.randomUUID();
      startPromise = new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          cancelStart(new Error("启动插件服务超时"));
          status = "error";
          setError(new Error("启动插件服务超时"));
        }, pluginServerLimits.requestMs);
        starting = { id, resolve, reject, timer };
      });
      const promise = startPromise;
      notify();
      void send({ type: "register", requestId: id, routes: routes.map(({ method, path }) => ({ method, path })) }).catch(cause => {
        if (starting?.id !== id) return;
        cancelStart(asError(cause));
        status = "error";
        setError(cause);
      });
      return promise;
    },
    stop,
    dispose() {
      if (disposed) return;
      disposed = true;
      options.signal?.removeEventListener("abort", server.dispose);
      void stop().catch(setError);
      releaseSubscription();
      listeners.clear();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  unsubscribe = transport.subscribe(message => { try { receive(message); } catch (cause) { setError(cause); } });
  options.signal?.addEventListener("abort", server.dispose, { once: true });
  if (options.signal?.aborted) server.dispose();
  return server;
}
