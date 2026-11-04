type ModelType = "language" | "media";
type CatalogEntry = { models?: unknown[]; pending?: Promise<unknown[]>; expires: number };
type CatalogState = { entries: Map<ModelType, CatalogEntry>; listeners: Set<(type: ModelType) => void> };

const catalogKey = Symbol.for("toonflow.modelCatalog.v1");
const catalogHost = globalThis as typeof globalThis & { [catalogKey]?: CatalogState };
const catalogLifetime = 30000;
// ACT: 独立节点 UMD 与宿主共用一份目录；只在读取、重新激活页面时检查有效期，不后台轮询。
const catalog = catalogHost[catalogKey] ??= createCatalog();

function createCatalog(): CatalogState {
  const state: CatalogState = { entries: new Map(), listeners: new Set() };
  if (typeof window !== "undefined") {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      for (const [type, entry] of state.entries) {
        if (!entry.pending && entry.expires <= Date.now()) void readNodeModels(type).catch(() => {});
      }
    };
    const invalidate = (event: Event) => {
      if (event.type === "toonflow:plugin-installed" && (event as CustomEvent<{ type?: string }>).detail?.type !== "provider") return;
      invalidateNodeModels("language");
      invalidateNodeModels("media");
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("toonflow:provider-config-changed", invalidate);
    window.addEventListener("toonflow:plugin-installed", invalidate);
  }
  return state;
}

function announce(type: ModelType) {
  for (const listener of catalog.listeners) listener(type);
}

export function subscribeNodeModels(listener: (type: ModelType) => void) {
  catalog.listeners.add(listener);
  return () => { catalog.listeners.delete(listener); };
}

export function invalidateNodeModels(type: ModelType) {
  catalog.entries.delete(type);
  announce(type);
}

export async function readNodeModels<T>(type: ModelType, signal?: AbortSignal, fresh = false): Promise<T[]> {
  signal?.throwIfAborted();
  let entry = catalog.entries.get(type);
  if (!entry || !entry.pending && (fresh || entry.expires <= Date.now())) {
    const previous = entry?.models;
    const expired = !!entry && entry.expires <= Date.now();
    const next: CatalogEntry = { models: previous, expires: Infinity };
    catalog.entries.set(type, next);
    next.pending = fetch(type === "language" ? "/api/ai/models" : "/api/ai/media/models", {
      cache: "no-store", headers: { "x-toonflow-workspace": "1" }, signal: AbortSignal.timeout(15000),
    }).then(async response => {
      const result = await response.json();
      if (!response.ok || result.code !== 200 || !Array.isArray(result.data)) throw new Error(result.message || "读取模型失败，请稍后重试");
      return result.data as unknown[];
    }).then(models => {
      next.models = models;
      next.pending = undefined;
      next.expires = Date.now() + catalogLifetime;
      if (catalog.entries.get(type) === next && previous && (expired || JSON.stringify(previous) !== JSON.stringify(models))) announce(type);
      return models;
    }).catch(cause => {
      if (catalog.entries.get(type) === next) {
        if (previous) { next.pending = undefined; next.expires = 0; }
        else catalog.entries.delete(type);
      }
      throw cause;
    });
    entry = next;
  }
  const waiting = entry;
  let abort = () => {};
  try {
    const result = waiting.pending ?? Promise.resolve(waiting.models ?? []);
    const models = signal ? await Promise.race([result, new Promise<never>((_resolve, reject) => {
      abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
    })]) : await result;
    signal?.throwIfAborted();
    return catalog.entries.get(type) === waiting ? models as T[] : readNodeModels(type, signal, fresh);
  } finally { signal?.removeEventListener("abort", abort); }
}
