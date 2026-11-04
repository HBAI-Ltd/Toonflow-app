import { locale } from "@toonflow/i18n/vue";

const stopListeners = new Set<(runIds: string[]) => void>();

export function onAgentStopped(listener: (runIds: string[]) => void) {
  stopListeners.add(listener);
  return () => { stopListeners.delete(listener); };
}

export async function stopAgent(directory: string, runIds: string[]) {
  if (!runIds.length) return;
  for (const listener of stopListeners) listener(runIds);
  const response = await fetch("/api/agent/stop", {
    method: "POST",
    headers: { "Accept-Language": locale.value, "Content-Type": "application/json", "x-toonflow-workspace": "1" },
    body: JSON.stringify({ directory, runIds: [...new Set(runIds)] }),
    keepalive: true,
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.code !== 200) throw new Error(result?.message || "停止生成失败，请重试");
}
