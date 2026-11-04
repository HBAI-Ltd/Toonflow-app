import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { mkdir, readFile, unlink, writeAtomic } from "@toonflow/file";
import conf from "@/utils/conf";
import { getRequestFiles, getRequestFileReferences } from "@/utils/ai/requestFiles";

export type FileProvider = { apiUrl: string; apiKey: string; protocol: string; headers?: Record<string, string | null> };
export class FileRequestLimitError extends Error {
  constructor(readonly excessBytes: number, readonly excessCount: number, message = "输入图片超过供应商的请求限制") {
    super(message);
    this.name = "FileRequestLimitError";
  }
}
type CachedFile = { fileId: string; expiresAt: number };
type FileSource = { data: string; mimeType: string; cachePath: string; bytes: number };
type PreparedFile = FileSource & CachedFile;
type FileAdapter = {
  label: string;
  accepts(provider: FileProvider): boolean;
  endpoint: string;
  limits: { imageBytes: number; totalImageBytes: number; images: number };
  supports(mimeType: string): boolean;
  unsupported(file: { path: string; mimeType: string }): string | undefined;
  reference(protocol: string, fileId: string, mimeType: string): Record<string, unknown>;
  headers(protocol: string, headers: Headers): void;
  upload(headers: Headers, source: FileSource, request: typeof fetch, signal?: AbortSignal): Promise<CachedFile>;
  stale(status: number, error: string, fileIds: string[]): string[];
};

function hash(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

const adapters: FileAdapter[] = [{
  label: "DeepSeek",
  accepts(provider) {
    try {
      const url = new URL(provider.apiUrl);
      return url.origin === "https://api.deepseek.com" && !url.username && !url.password && !url.search && !url.hash
        && ["", "/v1", "/anthropic", "/anthropic/v1"].includes(url.pathname.replace(/\/+$/, ""))
        && ["openai-completions", "openai-responses", "anthropic-messages"].includes(provider.protocol);
    } catch { return false; }
  },
  endpoint: "https://api.deepseek.com/files",
  limits: { imageBytes: 64 * 1024 * 1024, totalImageBytes: 200 * 1024 * 1024, images: 600 },
  supports: mimeType => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType.toLowerCase()),
  unsupported(file) {
    if (!file.mimeType.toLowerCase().startsWith("video/")) return;
    return `${file.path ? `视频文件：${file.path}。` : ""}当前 DeepSeek 接口不接收视频输入；${file.path ? "这里只提供文件路径" : "本次未发送视频内容"}，尚未读取或理解视频画面和声音。`;
  },
  reference(protocol, fileId) {
    if (protocol === "anthropic-messages") return { type: "image", source: { type: "file", file_id: fileId } };
    return protocol === "openai-responses" ? { type: "input_image", file_id: fileId } : { type: "file", file_id: fileId };
  },
  headers(protocol, headers) {
    if (protocol !== "anthropic-messages") return;
    const beta = new Set((headers.get("anthropic-beta") ?? "").split(",").map(value => value.trim()).filter(Boolean));
    beta.add("files-api-2025-04-14");
    headers.set("anthropic-beta", [...beta].join(","));
  },
  async upload(headers, source, request, signal) {
    signal?.throwIfAborted();
    const form = new FormData();
    form.set("purpose", "user_data");
    form.set("expires_after[anchor]", "created_at");
    form.set("expires_after[seconds]", String(7 * 24 * 60 * 60));
    const extension = source.mimeType.slice(6).replace("jpeg", "jpg");
    form.set("file", new Blob([Uint8Array.from(Buffer.from(source.data.replace(/\s/g, ""), "base64")).buffer], { type: source.mimeType }), `toonflow-${hash(source.data).slice(0, 16)}.${extension}`);
    const response = await request(this.endpoint, { method: "POST", headers, body: form, signal });
    if (!response.ok) throw Object.assign(new Error(`DeepSeek 文件上传失败（HTTP ${response.status}）：${await response.text()}`), { status: response.status });
    const file = await response.json() as { id?: unknown; expires_at?: unknown };
    if (typeof file.id !== "string" || !file.id.trim() || typeof file.expires_at !== "number" || !Number.isFinite(file.expires_at)
      || file.expires_at * 1000 <= Date.now() + 60 * 60 * 1000) throw new Error("DeepSeek 文件上传返回了无效的文件 ID 或过期时间");
    return { fileId: file.id, expiresAt: file.expires_at * 1000 };
  },
  stale(status, body, fileIds) {
    if (![400, 404, 422].includes(status) || !fileIds.length) return [];
    let error: { message?: unknown; code?: unknown; type?: unknown };
    try {
      const parsed = JSON.parse(body);
      error = parsed?.error && typeof parsed.error === "object" ? parsed.error : parsed;
    } catch { return []; }
    if (!error || typeof error !== "object") return [];
    const message = typeof error.message === "string" ? error.message : "";
    const code = [error.code, error.type].filter(value => typeof value === "string").join(" ");
    const staleCode = /\bfile[_-](?:not[_-]found|expired|deleted|not[_-]owned|not[_-]exist)\b/i.test(code);
    const staleMessage = /\bfile(?:[\s_-]+id|[-_][\w-]+)?\b.{0,100}\b(?:expired|deleted|not found|does not exist|not created (?:under|for)|not (?:owned by|belong to))\b/i.test(message);
    if (!staleCode && !staleMessage) return [];
    const named = fileIds.filter(id => new RegExp(`(?<![\\w-])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`).test(message));
    if (named.length) return named;
    return /\bfile[-_](?!id\b)[\w-]+\b/i.test(message) ? [] : fileIds;
  },
}];

const pendingUploads = new Map<string, { promise: Promise<CachedFile>; signal?: AbortSignal }>();
const cacheOperations = new Map<string, Promise<unknown>>();
const invalidatedFiles = new Set<string>();

function cacheOperation<T>(path: string, action: () => Promise<T>): Promise<T> {
  const operation = (cacheOperations.get(path) ?? Promise.resolve()).catch(() => undefined).then(action);
  cacheOperations.set(path, operation);
  void operation.finally(() => { if (cacheOperations.get(path) === operation) cacheOperations.delete(path); }).catch(() => undefined);
  return operation;
}

function waitForUpload(promise: Promise<CachedFile>, signal?: AbortSignal): Promise<CachedFile> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

async function readCachedFile(path: string): Promise<CachedFile | undefined> {
  try {
    const file = JSON.parse(await readFile(path, "utf8")) as CachedFile;
    if (typeof file?.fileId === "string" && file.fileId && typeof file.expiresAt === "number" && Number.isFinite(file.expiresAt)
      && file.expiresAt > Date.now() + 60 * 60 * 1000 && !invalidatedFiles.has(`${path}\0${file.fileId}`)) return file;
  } catch (error) {
    if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function referencedFileIds(payload: unknown): string[] {
  return getRequestFileReferences(payload).map(reference => reference.fileId);
}

function replaceFileIds(payload: unknown, replacements: Map<string, string>): boolean {
  let changed = false;
  for (const reference of getRequestFileReferences(payload)) {
    let next = replacements.get(reference.fileId);
    while (next && next !== reference.fileId) { reference.replace(next); changed = true; next = replacements.get(next); }
  }
  return changed;
}

export function getUnsupportedFileText(provider: FileProvider, file: { path: string; mimeType: string }) {
  return adapters.find(adapter => adapter.accepts(provider))?.unsupported(file);
}

export function createFileTransport(provider: FileProvider, options: { fetch?: typeof fetch; signal?: AbortSignal } = {}): { prepare(payload: unknown): Promise<void>; fetch: typeof fetch } {
  const fetchRequest = options.fetch ?? globalThis.fetch;
  const request = Object.assign((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    // 按 Request 接口读取，兼容原生和 Undici 实例；init.signal 覆盖原请求，整轮取消始终保留。
    const inputRequest = typeof input === "object" && "url" in input ? input : undefined;
    const headers = new Headers(init?.headers ?? inputRequest?.headers);
    const signals = [options.signal, init?.signal === undefined ? inputRequest?.signal : init.signal].filter((signal): signal is AbortSignal => Boolean(signal));
    const signal = signals.length ? AbortSignal.any(signals) : init?.signal;
    signal?.throwIfAborted();
    // ACT: 模型与附件请求共用此策略；Undici 不用 keepalive 控制连接池，必须显式关闭连接。
    // 工具或用户等待期间代理可能回收 socket，不把它留给下一轮生成或重试。
    headers.set("Connection", "close");
    return fetchRequest(input, { ...init, headers, signal, keepalive: false });
  }, fetchRequest);
  const adapter = adapters.find(adapter => adapter.accepts(provider));
  if (!adapter) return { prepare: async () => {}, fetch: request };
  const headers = new Headers(provider.apiKey ? { authorization: `Bearer ${provider.apiKey}` } : undefined);
  for (const [name, value] of Object.entries(provider.headers ?? {})) {
    if (value === null) headers.delete(name);
    else headers.set(name, value);
  }
  // ACT: 附件鉴权沿用模型请求的覆盖顺序，multipart 边界和长度仍由运行时生成。
  headers.delete("content-type");
  headers.delete("content-length");
  // ACT: 缓存按实际上传请求头隔离，凭据只参与路径摘要，不写入缓存内容。
  const scope = hash(`${adapter.endpoint}\0${JSON.stringify([...headers])}`);
  const directory = join(dirname(conf.path), "ai", "files", scope);
  const preparedFiles = new Map<string, PreparedFile>();
  const renewedFiles = new Map<string, string>();
  let recovered = false;

  async function resolveFile(source: FileSource, signal?: AbortSignal): Promise<CachedFile> {
    for (;;) {
      signal?.throwIfAborted();
      let pending = pendingUploads.get(source.cachePath);
      if (!pending) {
        const promise = (async () => {
          const cached = await cacheOperation(source.cachePath, () => readCachedFile(source.cachePath));
          signal?.throwIfAborted();
          if (cached) return cached;
          const uploaded = await adapter!.upload(headers, source, request, signal);
          if (invalidatedFiles.has(`${source.cachePath}\0${uploaded.fileId}`)) throw new Error("DeepSeek 文件上传再次返回了已失效的文件 ID");
          signal?.throwIfAborted();
          await cacheOperation(source.cachePath, async () => {
            await mkdir(directory, { recursive: true });
            await writeAtomic(source.cachePath, JSON.stringify(uploaded));
          });
          return uploaded;
        })();
        pending = { promise, signal };
        pendingUploads.set(source.cachePath, pending);
        const current = pending;
        void promise.finally(() => { if (pendingUploads.get(source.cachePath) === current) pendingUploads.delete(source.cachePath); }).catch(() => undefined);
      }
      try {
        const file = await waitForUpload(pending.promise, signal);
        signal?.throwIfAborted();
        if (!invalidatedFiles.has(`${source.cachePath}\0${file.fileId}`)) return file;
      } catch (error) {
        signal?.throwIfAborted();
        // ACT: 首个上传者取消后，其他等待者重新解析；取消不扩散到仍在使用同一内容的请求。
        if (!pending.signal?.aborted) throw error;
      }
      if (pendingUploads.get(source.cachePath) === pending) pendingUploads.delete(source.cachePath);
    }
  }

  async function prepare(payload: unknown) {
    options.signal?.throwIfAborted();
    const files = getRequestFiles(payload);
    let totalBytes = 0;
    let imageCount = 0;
    for (const file of files) {
      const unsupported = adapter!.unsupported({ path: "", mimeType: file.mimeType });
      if (unsupported) { file.offload(unsupported); continue; }
      if (!file.mimeType.toLowerCase().startsWith("image/")) continue;
      const data = file.data.replace(/\s/g, "");
      const bytes = Math.floor(data.length * 3 / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
      if (bytes > adapter!.limits.imageBytes) throw new Error(`${adapter!.label} 单张输入图片不能超过 ${adapter!.limits.imageBytes / 1024 / 1024} MiB`);
      totalBytes += bytes;
      imageCount++;
    }
    for (const id of referencedFileIds(payload)) {
      const prepared = preparedFiles.get(id);
      if (prepared?.mimeType.startsWith("image/")) { totalBytes += prepared.bytes; imageCount++; }
    }
    const excessBytes = Math.max(0, totalBytes - adapter!.limits.totalImageBytes);
    const excessCount = Math.max(0, imageCount - adapter!.limits.images);
    if (excessBytes || excessCount) throw new FileRequestLimitError(excessBytes, excessCount,
      `${adapter!.label} 每次请求的输入图片总量不能超过 ${adapter!.limits.totalImageBytes / 1024 / 1024} MiB 或 ${adapter!.limits.images} 张`);
    for (const file of files) {
      options.signal?.throwIfAborted();
      if (!file.inlineBytes || !adapter!.supports(file.mimeType)) continue;
      const data = file.data.replace(/\s/g, "");
      const bytes = Buffer.from(data, "base64");
      if (bytes.toString("base64") !== data) throw new Error("图片附件的 Base64 数据无效");
      const mimeType = file.mimeType.toLowerCase();
      const digest = createHash("sha256").update(mimeType).update("\0").update(bytes).digest("hex");
      const source = { data, mimeType, cachePath: join(directory, `${digest}.json`), bytes: bytes.byteLength };
      const uploaded = await resolveFile(source, options.signal);
      preparedFiles.set(uploaded.fileId, { ...source, ...uploaded });
      file.useReference(adapter!.reference(provider.protocol, uploaded.fileId, mimeType));
    }
  }

  const fetchFiles = Object.assign(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const inputRequest = typeof input === "object" && "url" in input ? input : undefined;
    const url = new URL(inputRequest?.url ?? String(input));
    if (url.origin !== new URL(adapter.endpoint).origin) return request(input, init);
    const signals = [options.signal, init?.signal === undefined ? inputRequest?.signal : init.signal].filter((signal): signal is AbortSignal => Boolean(signal));
    const signal = signals.length ? AbortSignal.any(signals) : init?.signal;
    signal?.throwIfAborted();
    const replayInput = inputRequest ? inputRequest.clone() : input;
    const bodyText = typeof init?.body === "string" ? init.body : inputRequest && init?.body == null ? await inputRequest.clone().text() : undefined;
    let body: unknown;
    try { body = bodyText ? JSON.parse(bodyText) : undefined; } catch {}
    const renewed = replaceFileIds(body, renewedFiles);
    const fileIds = [...new Set(referencedFileIds(body).filter(id => preparedFiles.has(id)))];
    const headers = new Headers(init?.headers ?? inputRequest?.headers);
    if (fileIds.length) adapter.headers(provider.protocol, headers);
    if (renewed) headers.delete("content-length");
    // ACT: SDK 可能重用首次构建的 payload；后续网络重试也必须使用已更新的文件 ID。
    const requestInit = { ...init, headers, signal, ...(renewed ? { body: JSON.stringify(body) } : {}) };
    const response = await request(input, requestInit);
    if (response.ok || recovered || !fileIds.length || ![400, 404, 422].includes(response.status)) return response;
    const stale = adapter.stale(response.status, await response.clone().text(), fileIds);
    if (!stale.length) return response;
    recovered = true;
    await response.body?.cancel().catch(() => undefined);
    const replacements = new Map<string, string>();
    for (const id of stale) {
      signal?.throwIfAborted();
      const source = preparedFiles.get(id)!;
      invalidatedFiles.add(`${source.cachePath}\0${id}`);
      await cacheOperation(source.cachePath, async () => {
        try {
          const cached = JSON.parse(await readFile(source.cachePath, "utf8")) as CachedFile;
          if (cached.fileId === id) await unlink(source.cachePath);
        } catch (error) {
          if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      });
      const uploaded = await resolveFile(source, signal ?? undefined);
      preparedFiles.set(uploaded.fileId, { ...source, ...uploaded });
      replacements.set(id, uploaded.fileId);
      renewedFiles.set(id, uploaded.fileId);
    }
    replaceFileIds(body, replacements);
    headers.delete("content-length");
    return request(replayInput as Parameters<typeof fetch>[0], { ...requestInit, body: JSON.stringify(body) });
  }, request);
  return { prepare, fetch: fetchFiles };
}
