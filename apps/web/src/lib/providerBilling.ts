import { translate } from "@toonflow/i18n/vue";
import axios from "axios";
import { onScopeDispose, ref, watch } from "vue";
import type { ProviderBalance } from "@toonflow/providers";
import { settings, toonflowAccountToken } from "@/stores/settings";
import { useWorkspaceStore } from "@/stores/workspace";

type BalanceSnapshot = { accountId: string; balance: ProviderBalance | null; revision: number };

async function getProviderBalance(providerId: string, signal?: AbortSignal) {
  const entry = providerBalances.value.find(item => item.id === providerId);
  const { data } = await axios.post<{ code: number; data: BalanceSnapshot; message?: string }>("/api/ai/media/balance", {
    providerId,
  }, { signal, timeout: 25000, headers: { "x-toonflow-workspace": "1" } });
  if (data.code !== 200) throw new Error(data.message || "余额查询失败，请重试");
  if (entry && !signal?.aborted && providerBalances.value.includes(entry)) {
    if (entry.accountId !== data.data.accountId) entry.revision = -1;
    entry.accountId = data.data.accountId;
    applySnapshot(data.data);
  }
  return data.data;
}

type BalanceProvider = { id: string; label: string; supportsBalance?: boolean };
type BalanceEntry = BalanceSnapshot & { id: string; label: string; configKey: string; loading: boolean; error: string };
export const providerBalances = ref<BalanceEntry[]>([]);
const balanceRequests = new Map<string, { entry: BalanceEntry; controller: AbortController; signal: AbortSignal; pending: Promise<void> }>();

function applySnapshot(snapshot: BalanceSnapshot) {
  const entry = providerBalances.value.find(item => item.accountId === snapshot.accountId);
  if (!entry || snapshot.revision < entry.revision) return;
  entry.revision = snapshot.revision;
  entry.balance = snapshot.balance;
  entry.error = "";
}

export function refreshProviderBalance(providerId: string, signal?: AbortSignal): Promise<void> {
  const entry = providerBalances.value.find(item => item.id === providerId);
  if (!entry || signal?.aborted) return Promise.resolve();
  const previous = balanceRequests.get(providerId);
  if (previous?.entry === entry && !previous.signal.aborted) return previous.pending;
  const controller = new AbortController();
  const request = { entry, controller, signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal, pending: Promise.resolve() };
  balanceRequests.set(providerId, request);
  entry.loading = true;
  request.pending = (async () => {
    try {
      await getProviderBalance(providerId, request.signal);
    } catch (error) {
      if (!request.signal.aborted && providerBalances.value.includes(entry)) {
        // 服务重启后的旧 ID 不得留在批量订阅中，避免一个失败账户拖垮整组通知。
        entry.accountId = "";
        entry.error = axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message || error.message : error instanceof Error ? error.message : translate("余额查询失败，请重试");
      }
    } finally {
      if (balanceRequests.get(providerId) === request) {
        balanceRequests.delete(providerId);
        entry.loading = false;
      }
    }
  })();
  return request.pending;
}

export function useProviderBalances() {
  const workspaceStore = useWorkspaceStore();
  let providers: BalanceProvider[] = [];
  let request: AbortController | undefined;
  const connections = new Map<string, EventSource>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let subscriptionTimer: ReturnType<typeof setTimeout> | undefined;
  let reconnectDelay = 1000;
  let disposed = false;
  let refreshRequested = false;

  function syncProviders() {
    const configs = settings.value.mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
    const accountProvider = settings.value.toonflowProvider as { id?: string } | null | undefined;
    const previousEntries = new Map(providerBalances.value.map(entry => [entry.id, entry]));
    providerBalances.value = providers.filter(item => item.supportsBalance
      && (item.id !== "toonflow" || (toonflowAccountToken.value && (accountProvider?.id === "Toonflow" || accountProvider?.id === "toonflow")))).map(provider => {
      const configKey = JSON.stringify([configs?.[provider.id] ?? {}, provider.id === "toonflow" ? toonflowAccountToken.value : ""]);
      const previous = previousEntries.get(provider.id);
      if (previous?.configKey === configKey) {
        previous.label = provider.label;
        return previous;
      }
      return {
        id: provider.id, label: provider.label, configKey, accountId: "", revision: -1, balance: null, loading: false, error: "",
      };
    });
  }

  function subscribe() {
    const ids = [...new Set(providerBalances.value.map(item => item.accountId).filter(Boolean))].sort();
    // ACT: 每 100 个账户共用一个通知流，避免按供应商占用浏览器连接；普通工作区只需一条。
    const groups = Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => ids.slice(index * 100, index * 100 + 100).join(","));
    for (const [group, connection] of connections) if (!groups.includes(group)) { connection.close(); connections.delete(group); }
    for (const group of groups) {
      if (connections.has(group)) continue;
      const connection = new EventSource(`/api/ai/media/balanceEvents?accountIds=${encodeURIComponent(group)}`);
      connections.set(group, connection);
      connection.onopen = () => { if (connections.get(group) === connection) reconnectDelay = 1000; };
      connection.onmessage = event => {
        if (connections.get(group) !== connection) return;
        try { applySnapshot(JSON.parse(event.data)); }
        catch { /* 下一次窗口显示重新校准无效通知。 */ }
      };
      connection.onerror = () => {
        if (connections.get(group) !== connection) return;
        connection.close();
        connections.delete(group);
        retryConnection();
      };
    }
  }

  function scheduleSubscribe() {
    if (disposed || subscriptionTimer !== undefined) return;
    // 合并同批返回的账户；已读到的余额立即订阅，不等其他供应商超时或完成排队。
    subscriptionTimer = setTimeout(() => {
      subscriptionTimer = undefined;
      if (!disposed) subscribe();
    }, 100);
  }

  async function refresh() {
    if (disposed || document.visibilityState === "hidden") return;
    if (request) { refreshRequested = true; return; }
    refreshRequested = false;
    const controller = new AbortController();
    request = controller;
    try {
      const { data } = await axios.get<{ code: number; data: BalanceProvider[] }>("/api/providers/media/list", { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (data.code !== 200 || !Array.isArray(data.data)) throw new Error("读取媒体供应商失败");
      providers = data.data;
      syncProviders();
      const pending = [...providerBalances.value];
      // 多供应商分批查询，不让一次显示占满所有 HTTP 连接。
      await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
        let entry: BalanceEntry | undefined;
        while (!controller.signal.aborted && (entry = pending.shift())) {
          await refreshProviderBalance(entry.id, controller.signal);
        }
      }));
      if (!controller.signal.aborted) scheduleSubscribe();
    } catch (error) {
      if (!controller.signal.aborted) {
        for (const entry of providerBalances.value) entry.error = error instanceof Error ? error.message : translate("余额查询失败，请重试");
        retryConnection();
      }
    } finally {
      if (request === controller) {
        request = undefined;
        if (refreshRequested && !controller.signal.aborted) scheduleRefresh();
      }
    }
  }

  function retryConnection() {
    if (disposed) return;
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  function scheduleRefresh() {
    if (document.visibilityState === "hidden") return;
    clearTimeout(timer);
    // ACT: 合并同一次窗口显示事件；多画布共用工作区这一处监听。
    timer = setTimeout(() => void refresh(), 200);
  }

  function invalidate() {
    request?.abort();
    for (const request of balanceRequests.values()) request.controller.abort();
    request = undefined;
    refreshRequested = false;
    syncProviders();
    subscribe();
    scheduleRefresh();
  }
  watch(() => providerBalances.value.map(entry => entry.accountId).join(","), scheduleSubscribe);
  watch(() => JSON.stringify(settings.value.mediaProviderConfigs), invalidate, { immediate: true, flush: "sync" });
  watch(() => workspaceStore.project?.lastOpenedAt, scheduleRefresh);
  const refreshProvider = (event: WindowEventMap["toonflow:plugin-installed"]) => {
    if (event.detail.type === "provider") invalidate();
  };
  window.addEventListener("pageshow", scheduleRefresh);
  window.addEventListener("focus", scheduleRefresh);
  window.addEventListener("toonflow:plugin-installed", refreshProvider);
  window.addEventListener("toonflow:provider-config-changed", invalidate);
  document.addEventListener("visibilitychange", scheduleRefresh);
  onScopeDispose(() => {
    disposed = true;
    clearTimeout(timer);
    clearTimeout(subscriptionTimer);
    request?.abort();
    for (const request of balanceRequests.values()) request.controller.abort();
    for (const connection of connections.values()) connection.close();
    connections.clear();
    window.removeEventListener("pageshow", scheduleRefresh);
    window.removeEventListener("focus", scheduleRefresh);
    window.removeEventListener("toonflow:plugin-installed", refreshProvider);
    window.removeEventListener("toonflow:provider-config-changed", invalidate);
    document.removeEventListener("visibilitychange", scheduleRefresh);
  });
}

