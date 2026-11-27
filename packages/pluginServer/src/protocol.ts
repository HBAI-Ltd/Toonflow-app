export const pluginServerLimits = {
  bodyBytes: 8 * 1024 * 1024,
  socketBytes: 1024 * 1024,
  socketBufferBytes: 4 * 1024 * 1024,
  requestMs: 30000,
  services: 32,
  sockets: 64,
  routes: 128,
} as const;

export type PluginServiceRoute = { method: string; path: string };
export type PluginSocketData = { type: "text" | "binary"; value: string };
export type PluginHttpRequest = {
  type: "request";
  serviceId: string;
  requestId: string;
  method: string;
  path: string;
  query: string;
  headers: [string, string][];
  body: string | null;
};
export type PluginHttpResponse = {
  type: "response";
  serviceId: string;
  requestId: string;
  status: number;
  headers: [string, string][];
  body: string;
};
export type ToHostMessage =
  | { type: "register"; requestId: string; routes: PluginServiceRoute[] }
  | { type: "cancelRegister"; requestId: string }
  | { type: "unregister"; serviceId: string }
  | PluginHttpResponse
  | { type: "socketSend"; serviceId: string; socketId: string; data: PluginSocketData }
  | { type: "socketClose"; serviceId: string; socketId: string; code: number; reason: string };

export type ToPluginMessage =
  | { type: "registered"; requestId: string; serviceId: string; url: string }
  | { type: "registerFailed"; requestId: string; error: string }
  | PluginHttpRequest
  | { type: "cancel"; serviceId: string; requestId: string }
  | { type: "socketOpen"; serviceId: string; socketId: string; path: string; query: string; headers: [string, string][] }
  | { type: "socketMessage"; serviceId: string; socketId: string; data: PluginSocketData }
  | { type: "socketClose"; serviceId: string; socketId: string; code: number; reason: string }
  | { type: "serviceClosed"; serviceId: string; error?: string };

export interface PluginServerTransport {
  send(message: ToHostMessage): void | Promise<void>;
  subscribe(listener: (message: ToPluginMessage) => void): () => void;
}

export function validateSocketClose(code: number, reason: string) {
  if (!Number.isInteger(code) || !([1000, 1001, 1002, 1003, 1007, 1008, 1009, 1011, 1012, 1013, 1014].includes(code) || code >= 3000 && code <= 4999)) throw new Error("WebSocket 关闭状态码无效");
  if (new TextEncoder().encode(reason).byteLength > 123) throw new Error("WebSocket 关闭原因不能超过 123 字节");
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof bytes.toBase64 === "function") return bytes.toBase64();
  let text = "";
  for (let offset = 0; offset < bytes.byteLength; offset += 16384) text += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
  return btoa(text);
}

export function base64ToBytes(value: string, maxBytes = pluginServerLimits.bodyBytes): Uint8Array<ArrayBuffer> {
  if (value.length > Math.ceil(maxBytes / 3) * 4 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error("插件服务二进制数据无效或超过大小限制");
  }
  const size = value.length / 4 * 3 - (value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0);
  if (size > maxBytes) throw new Error("插件服务消息超过大小限制");
  if (typeof Uint8Array.fromBase64 === "function") return Uint8Array.fromBase64(value);
  const decoded = atob(value);
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

export function encodeSocketData(value: unknown): PluginSocketData {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (bytes.byteLength > pluginServerLimits.socketBytes) throw new Error("插件服务消息超过 1 MB");
    return { type: "binary", value: bytesToBase64(bytes) };
  }
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (typeof text !== "string") throw new Error("插件服务消息必须为文本、可序列化数据或二进制");
  if (new TextEncoder().encode(text).byteLength > pluginServerLimits.socketBytes) throw new Error("插件服务消息超过 1 MB");
  return { type: "text", value: text };
}

export function decodeSocketData(data: PluginSocketData): unknown {
  if (data.type === "binary") return base64ToBytes(data.value, pluginServerLimits.socketBytes).buffer;
  if (new TextEncoder().encode(data.value).byteLength > pluginServerLimits.socketBytes) throw new Error("插件服务消息超过 1 MB");
  try { return JSON.parse(data.value); }
  catch { return data.value; }
}

export async function readBody(stream: ReadableStream<Uint8Array> | null, maxBytes = pluginServerLimits.bodyBytes, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  signal?.throwIfAborted();
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const cancel = () => { void reader.cancel(signal?.reason).catch(() => {}); };
  signal?.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      signal?.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) throw new Error("插件服务响应超过 8 MB");
      chunks.push(chunk.value);
    }
  } catch (error) {
    void reader.cancel(error).catch(() => {});
    throw error;
  } finally { signal?.removeEventListener("abort", cancel); reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export function normalizeServicePath(path: string, pattern = false): string {
  if (typeof path !== "string" || path.length > 2048 || !path.startsWith("/") || path.startsWith("//") || /[\\?#\u0000-\u0020\u007f]/.test(path)) {
    throw new Error("插件服务路径必须是以 / 开头的相对路径");
  }
  let decoded: string;
  try { decoded = decodeURIComponent(path); }
  catch { throw new Error("插件服务路径编码无效"); }
  if (decoded.includes("%") || /[\\?#\u0000-\u0020\u007f]/.test(decoded) || decoded.includes("//") || decoded.split("/").some(segment => segment === "." || segment === "..")
    || /%2f/i.test(path)) throw new Error("插件服务路径不能越过服务边界");
  const segments = decoded.split("/");
  if (pattern && segments.some((segment, index) => segment.includes(":") && !/^:[a-z][a-zA-Z0-9]*$/.test(segment)
    || segment.includes("*") && (segment !== "*" || index !== segments.length - 1))) throw new Error("插件服务路由参数无效");
  if (pattern) {
    const names = segments.filter(segment => segment.startsWith(":")).map(segment => segment.slice(1));
    if (new Set(names).size !== names.length) throw new Error("插件服务路由参数不能重复");
  }
  return decoded.length > 1 ? decoded.replace(/\/+$/, "") : decoded;
}

export function matchServicePath(pattern: string, path: string): Record<string, string> | undefined {
  const template = normalizeServicePath(pattern, true).split("/").slice(1);
  const actual = normalizeServicePath(path).split("/").slice(1);
  const params: Record<string, string> = Object.create(null);
  for (let index = 0; index < template.length; index++) {
    const segment = template[index]!;
    if (segment === "*") { params.wildcard = actual.slice(index).join("/"); return params; }
    const value = actual[index];
    if (value === undefined) return;
    if (segment.startsWith(":")) params[segment.slice(1)] = value;
    else if (segment !== value) return;
  }
  return template.length === actual.length ? params : undefined;
}
