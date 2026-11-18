import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import parse from "semver/functions/parse";
import http from "@/lib/http";
import type { CustomProvider } from "@/stores/settings";

type BuiltinVendor = { id: string; name: string; description: string; updateTime: number; version?: string };
export type BuiltinLanguageProvider = CustomProvider & {
  readme?: string;
  rules?: Record<string, unknown>[];
  maxRequestImageBytes?: number;
  maxRequestBytes?: number;
};

export async function getBuiltinSource<T extends { id: string }>(kind: "language" | "media", id: string, signal?: AbortSignal) {
  const data = await http<{ source: string; provider: T }>({ method: "GET", url: "/api/providers/builtin/source", params: { kind, id }, signal });
  if (!data || typeof data.source !== "string" || !data.source.trim() || data.provider?.id !== id) throw new Error("供应商源码响应格式不正确");
  return data;
}

export function useBuiltinProviders<T extends { id: string }>(kind: "language" | "media", enabled: () => boolean) {
  const vendors = shallowRef<BuiltinVendor[]>([]);
  const selectedProvider = ref("");
  const activeProvider = shallowRef<T>();
  const source = ref("");
  const listLoading = ref(false);
  const sourceLoading = ref(false);
  const listError = ref("");
  const sourceError = ref("");
  const listRefresh = ref(0);
  const sourceRefresh = ref(0);

  watch([enabled, listRefresh], async ([active], _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    vendors.value = [];
    selectedProvider.value = "";
    listError.value = "";
    listLoading.value = active;
    if (!active) return;
    try {
      const data = await http<BuiltinVendor[]>({ method: "GET", url: "/api/providers/builtin/list", params: { kind }, signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Array.isArray(data)) throw new Error("供应商列表格式不正确");
      vendors.value = data;
      selectedProvider.value = data[0]?.id ?? "";
    } catch (error) {
      if (!controller.signal.aborted) listError.value = error instanceof Error ? error.message : "获取供应商列表失败";
    } finally {
      if (!controller.signal.aborted) listLoading.value = false;
    }
  }, { immediate: true, flush: "sync" });

  watch([enabled, selectedProvider, sourceRefresh], async ([active, id], _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    activeProvider.value = undefined;
    source.value = "";
    sourceError.value = "";
    sourceLoading.value = !!active && !!id;
    if (!active || !id) return;
    try {
      const data = await getBuiltinSource<T>(kind, id, controller.signal);
      if (controller.signal.aborted) return;
      source.value = data.source;
      activeProvider.value = data.provider;
    } catch (error) {
      if (!controller.signal.aborted) sourceError.value = error instanceof Error ? error.message : "读取供应商代码失败";
    } finally {
      if (!controller.signal.aborted) sourceLoading.value = false;
    }
  }, { immediate: true, flush: "sync" });

  return { vendors, selectedProvider, activeProvider, source, listLoading, sourceLoading, listError, sourceError, listRefresh, sourceRefresh };
}

export function useBuiltinUpgrades(kind: "language" | "media") {
  const latestVersions = shallowRef(new Map<string, string>());
  const controller = new AbortController();
  onBeforeUnmount(() => controller.abort());
  // ACT: 升级只是附加提示，离线或列表读取失败时不提示也不打断供应商列表。
  http<BuiltinVendor[]>({ method: "GET", url: "/api/providers/builtin/list", params: { kind }, signal: controller.signal })
    .then(data => { if (Array.isArray(data)) latestVersions.value = new Map(data.map(item => [item.id, item.version ?? ""])); })
    .catch(() => {});
  return (provider: { id: string; version?: string }) => {
    const [current, latest] = [provider.version, latestVersions.value.get(provider.id)].map(value => parse(value ?? ""));
    return current && latest && latest.compare(current) > 0 ? latest.version : "";
  };
}
