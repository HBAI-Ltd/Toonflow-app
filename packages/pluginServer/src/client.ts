import { base64ToBytes, decodeSocketData, encodeSocketData, normalizeServicePath, pluginServerLimits, readBody, validateSocketClose } from "./protocol.ts";

export interface PluginClientSocket {
  readonly state: number;
  send(data: unknown): void;
  onMessage(listener: (data: unknown) => void): () => void;
  onClose(listener: (event: { code: number; reason: string }) => void): () => void;
  onError(listener: (error: Error) => void): () => void;
  close(code?: number, reason?: string): void;
}

export interface PluginServerClient {
  getUrl(path?: string): string;
  request(path: string, options?: RequestInit): Promise<Response>;
  get<T = unknown>(path: string, options?: RequestInit): Promise<T>;
  post<T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T>;
  put<T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T>;
  patch<T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T>;
  delete<T = unknown>(path: string, options?: RequestInit): Promise<T>;
  ws(path: string, options?: { signal?: AbortSignal }): Promise<PluginClientSocket>;
  dispose(): void;
}

export function createServerClient(serviceUrl: string, options: { signal?: AbortSignal } = {}): PluginServerClient {
  const base = new URL(serviceUrl);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.hash) throw new Error("插件服务地址无效");
  base.pathname = base.pathname.replace(/\/?$/, "/");
  const lifetime = new AbortController();
  const sockets = new Set<WebSocket>();
  const dispose = () => {
    lifetime.abort(new Error("插件服务客户端已释放"));
    for (const socket of sockets) socket.close(1000, "客户端已释放");
    sockets.clear();
    options.signal?.removeEventListener("abort", dispose);
  };
  options.signal?.addEventListener("abort", dispose, { once: true });
  if (options.signal?.aborted) dispose();

  function getUrl(path = "/") {
    if (path.includes("#")) throw new Error("插件服务请求路径不能包含片段");
    const separator = path.indexOf("?");
    const pathname = normalizeServicePath(separator === -1 ? path : path.slice(0, separator));
    const url = new URL(base);
    url.pathname = `${base.pathname}${pathname.split("/").map(encodeURIComponent).join("/").slice(1)}`;
    if (separator !== -1) {
      for (const [key, value] of new URLSearchParams(path.slice(separator + 1))) url.searchParams.append(key, value);
    }
    return url.href;
  }

  async function request(path: string, init: RequestInit = {}) {
    const signal = AbortSignal.any([lifetime.signal, ...(init.signal ? [init.signal] : []), AbortSignal.timeout(pluginServerLimits.requestMs)]);
    signal.throwIfAborted();
    const body = init.body;
    if (body instanceof ReadableStream) throw new Error("插件服务请求暂不支持流式正文");
    const prepared = new Request(getUrl(path), { ...init, credentials: "omit", redirect: "error", signal });
    // ACT: 通用桥按 8 MB 完整消息传输；大文件流应走已有文件接口，不能在此无界缓冲。
    const bytes = await readBody(prepared.body, pluginServerLimits.bodyBytes, signal);
    return fetch(prepared.url, { method: prepared.method, headers: prepared.headers, credentials: "omit", redirect: "error", signal,
      ...(prepared.method !== "GET" && prepared.method !== "HEAD" ? { body: bytes } : {}) });
  }

  async function call<T>(path: string, init: RequestInit): Promise<T> {
    const response = await request(path, init);
    const bytes = await readBody(response.body);
    const contentType = response.headers.get("Content-Type") ?? "";
    const text = new TextDecoder().decode(bytes);
    const data = !bytes.byteLength ? undefined : /\bjson\b/i.test(contentType) ? JSON.parse(text) : /^text\//i.test(contentType) ? text : bytes.buffer;
    if (!response.ok) throw Object.assign(new Error(typeof data === "string" ? data : `插件服务请求失败（${response.status}）`), { status: response.status, data });
    return data as T;
  }

  function write<T>(method: string, path: string, data: unknown, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    let body: BodyInit | undefined;
    if (data instanceof Blob || data instanceof ArrayBuffer || data instanceof FormData || data instanceof URLSearchParams || typeof data === "string") body = data;
    else if (ArrayBuffer.isView(data)) body = new Uint8Array(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    else if (data !== undefined) {
      body = JSON.stringify(data);
      if (body === undefined) throw new Error("请求数据不能序列化为 JSON");
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    }
    return call<T>(path, { ...init, method, headers, body });
  }

  async function ws(path: string, connectOptions: { signal?: AbortSignal } = {}): Promise<PluginClientSocket> {
    const signal = AbortSignal.any([lifetime.signal, ...(connectOptions.signal ? [connectOptions.signal] : [])]);
    signal.throwIfAborted();
    const url = new URL(getUrl(path));
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url.href);
    socket.binaryType = "arraybuffer";
    sockets.add(socket);
    const messageListeners = new Set<(data: unknown) => void>();
    const closeListeners = new Set<(event: { code: number; reason: string }) => void>();
    const errorListeners = new Set<(error: Error) => void>();
    const report = (cause: unknown) => {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      for (const listener of errorListeners) { try { listener(error); } catch (cause) { console.error(cause); } }
    };
    const abort = () => socket.close(1000, "连接已取消");
    signal.addEventListener("abort", abort, { once: true });
    socket.addEventListener("message", event => {
      try {
        const data = event.data instanceof ArrayBuffer ? event.data : decodeSocketData({ type: "text", value: String(event.data) });
        if (data instanceof ArrayBuffer && data.byteLength > pluginServerLimits.socketBytes) throw new Error("插件服务消息超过 1 MB");
        for (const listener of messageListeners) { try { listener(data); } catch (cause) { report(cause); } }
      } catch (cause) { report(cause); socket.close(4009, "消息无效或过大"); }
    });
    socket.addEventListener("close", event => {
      sockets.delete(socket);
      signal.removeEventListener("abort", abort);
      for (const listener of closeListeners) { try { listener({ code: event.code, reason: event.reason }); } catch (cause) { report(cause); } }
      messageListeners.clear();
      closeListeners.clear();
      errorListeners.clear();
    });
    socket.addEventListener("error", () => report(new Error("插件服务 WebSocket 连接失败")));
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        socket.removeEventListener("open", opened);
        socket.removeEventListener("error", failed);
        socket.removeEventListener("close", failed);
        signal.removeEventListener("abort", cancelled);
      };
      const opened = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("无法连接插件服务 WebSocket")); };
      const cancelled = () => { cleanup(); reject(signal.reason); };
      const timer = setTimeout(() => { cleanup(); socket.close(); reject(new Error("连接插件服务 WebSocket 超时")); }, pluginServerLimits.requestMs);
      socket.addEventListener("open", opened, { once: true });
      socket.addEventListener("error", failed, { once: true });
      socket.addEventListener("close", failed, { once: true });
      signal.addEventListener("abort", cancelled, { once: true });
      if (signal.aborted) cancelled();
    });
    return {
      get state() { return socket.readyState; },
      send(data) {
        if (socket.readyState !== WebSocket.OPEN) throw new Error("插件服务 WebSocket 尚未连接或已关闭");
        const encoded = encodeSocketData(data);
        const value = encoded.type === "binary" ? base64ToBytes(encoded.value, pluginServerLimits.socketBytes) : encoded.value;
        const size = typeof value === "string" ? new TextEncoder().encode(value).byteLength : value.byteLength;
        if (socket.bufferedAmount + size > pluginServerLimits.socketBufferBytes) throw new Error("插件服务发送缓冲已满");
        socket.send(value);
      },
      onMessage(listener) { messageListeners.add(listener); return () => messageListeners.delete(listener); },
      onClose(listener) { closeListeners.add(listener); return () => closeListeners.delete(listener); },
      onError(listener) { errorListeners.add(listener); return () => errorListeners.delete(listener); },
      close(code = 1000, reason = "") {
        validateSocketClose(code, reason);
        if (code !== 1000 && (code < 3000 || code > 4999)) throw new Error("浏览器关闭连接仅支持 1000 或 3000–4999");
        socket.close(code, reason);
      },
    };
  }

  return {
    getUrl,
    request,
    get: <T>(path: string, init: RequestInit = {}) => call<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, data?: unknown, init?: RequestInit) => write<T>("POST", path, data, init),
    put: <T>(path: string, data?: unknown, init?: RequestInit) => write<T>("PUT", path, data, init),
    patch: <T>(path: string, data?: unknown, init?: RequestInit) => write<T>("PATCH", path, data, init),
    delete: <T>(path: string, init: RequestInit = {}) => call<T>(path, { ...init, method: "DELETE" }),
    ws,
    dispose,
  };
}
