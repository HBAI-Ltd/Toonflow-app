import { createHash, createHmac, randomBytes } from "node:crypto";
import type { Response } from "express";
import { z } from "zod";
import type { ProviderBalance, ProviderPrice, ProviderPriceRequest } from "@toonflow/providers";
import conf from "@/utils/conf";
import { getMediaProvider, loadMediaProviderSource } from "@/utils/media/provider";

type RuntimeProvider = Awaited<ReturnType<typeof loadMediaProviderSource>>;
type BalanceSnapshot = { accountId: string; balance: ProviderBalance | null; revision: number };
type Account = BalanceSnapshot & {
  provider?: RuntimeProvider;
  epoch: number;
  refreshRequested: boolean;
  pending?: Promise<void>;
  connections: Set<Response>;
};

const unitSchema = z.string().trim().min(1).max(64);
// ACT: 已安装的旧供应商仍可返回数值报价，统一转换为展示文本。
const priceSchema = z.object({ price: z.string().trim().min(1), tips: z.string() }).or(
  z.object({ amount: z.number().finite().nonnegative(), unit: unitSchema })
    .transform(({ amount, unit }) => ({ price: `${amount} ${unit}`, tips: "以实际扣费为准" })),
);
const balanceSchema = z.object({
  balance: z.number().finite(), unit: unitSchema,
  keyBalance: z.number().finite().nullable().optional(),
  totalConsumption: z.number().finite().optional(), totalRecharge: z.number().finite().optional(),
});
// ACT: 单进程内存余额快照；生成结束后向供应商刷新，多进程部署时需共享刷新状态。
const accounts = new Map<string, Account>();
const prices = new Map<string, { expires: number; value: Promise<ProviderPrice | null> }>();
const accountSecret = randomBytes(32);

function accountId(provider: RuntimeProvider) {
  const data = JSON.stringify({ id: provider.id, config: provider.config }, (_key, value) => value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) : value);
  return createHmac("sha256", accountSecret).update(data).digest("hex");
}

function queryContext(provider: RuntimeProvider, timeout: number) {
  const signal = AbortSignal.timeout(timeout);
  const fetchRequest = provider.queryFetch;
  return { ...provider, signal, tool: { ...provider.tool, fetch: Object.assign((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const requestSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    return fetchRequest(input, { ...init, signal: requestSignal ? AbortSignal.any([signal, requestSignal]) : signal });
  }, { preconnect: fetchRequest.preconnect }) as typeof fetch } };
}

async function waitForQuery<T>(query: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return query;
  let abort: (() => void) | undefined;
  try {
    return await Promise.race([query, new Promise<never>((_resolve, reject) => {
      abort = () => reject(signal.reason);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    })]);
  } finally {
    if (abort) signal.removeEventListener("abort", abort);
  }
}

function snapshot(account: Account): BalanceSnapshot {
  return { accountId: account.accountId, balance: account.balance ? { ...account.balance } : null, revision: account.revision };
}

function publish(account: Account) {
  account.revision++;
  const message = `data: ${JSON.stringify(snapshot(account))}\n\n`;
  for (const response of account.connections) {
    if (!response.destroyed && !response.writableEnded) response.write(message);
  }
}

async function refresh(account: Account): Promise<void> {
  const provider = account.provider;
  if (!provider?.getBalance) return;
  if (account.pending) return account.pending;
  const epoch = account.epoch;
  account.refreshRequested = false;
  account.pending = (async () => {
    let balance: ProviderBalance;
    try {
      const context = queryContext(provider, 20000);
      balance = balanceSchema.parse(await waitForQuery(Promise.resolve().then(() => provider.getBalance!.call(context)), context.signal));
    }
    catch (error) { throw new Error(provider.tool.errorMessage(error) || "余额查询失败"); }
    if (epoch !== account.epoch) {
      account.refreshRequested = true;
      return;
    }
    account.balance = balance;
    publish(account);
  })();
  try { await account.pending; }
  finally {
    account.pending = undefined;
    if (account.refreshRequested) void refresh(account).catch(() => {});
  }
}

function getAccount(provider: RuntimeProvider) {
  const id = accountId(provider);
  let account = accounts.get(id);
  if (!account) {
    account = { accountId: id, balance: null, revision: 0, epoch: 0, refreshRequested: false, connections: new Set() };
    accounts.set(id, account);
  }
  return account;
}

export async function getProviderBalance(providerId: string, apiKey?: string): Promise<BalanceSnapshot> {
  const source = await getMediaProvider(providerId).then(info => info.source);
  const configs = conf.get("settings", {}).mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
  const provider = await loadMediaProviderSource(source, { ...configs?.[providerId], ...(apiKey === undefined ? {} : { apiKey }) });
  const account = getAccount(provider);
  if (account.provider && account.provider.sourceRevision !== provider.sourceRevision) account.epoch++;
  account.provider = provider;
  await refresh(account);
  return snapshot(account);
}

export async function getProviderPrice(provider: RuntimeProvider, request: ProviderPriceRequest): Promise<ProviderPrice | null> {
  if (!provider.getPrice) return null;
  const now = Date.now();
  for (const [key, cached] of prices) if (cached.expires <= now) prices.delete(key);
  const key = createHash("sha256").update(accountId(provider)).update(provider.sourceRevision).update(JSON.stringify(request)).digest("hex");
  const cached = prices.get(key);
  if (cached) return cached.value;
  // ACT: 报价缓存仅保留哈希与结果，最多 500 项 / 30 秒；不缓存媒体内容。
  if (prices.size >= 500) prices.delete(prices.keys().next().value!);
  const entry = { expires: now + 30000, value: Promise.resolve<ProviderPrice | null>(null) };
  entry.value = (async () => {
    try {
      const context = queryContext(provider, 8000);
      const price = await waitForQuery(Promise.resolve().then(() => provider.getPrice!.call(context, request)), context.signal);
      return price === null ? null : priceSchema.parse(price);
    } catch (error) {
      // ACT: 上游未部署估价或暂时失败时短缓存错误，调用方可显示失败，生成单独降级。
      entry.expires = Date.now() + 5000;
      throw new Error(provider.tool.errorMessage(error) || "价格查询失败");
    }
  })();
  prices.set(key, entry);
  return entry.value;
}

export function beginGeneration(provider: RuntimeProvider) {
  const account = getAccount(provider);
  account.provider = provider;
  account.epoch++;
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    account.epoch++;
    account.refreshRequested = true;
    void refresh(account).catch(() => {});
  };
}

export function connectBalanceEvents(ids: string | string[], response: Response) {
  const subscribedAccounts = [...new Set(typeof ids === "string" ? [ids] : ids)].map(id => {
    const account = accounts.get(id);
    if (!account) throw Object.assign(new Error("余额账户已失效，请刷新余额"), { status: 404 });
    return account;
  });
  response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  response.flushHeaders();
  for (const account of subscribedAccounts) {
    account.connections.add(response);
    response.write(`data: ${JSON.stringify(snapshot(account))}\n\n`);
  }
  const heartbeat = setInterval(() => { if (!response.destroyed) response.write(": keepalive\n\n"); }, 20000);
  const socket = response.socket;
  const close = () => {
    clearInterval(heartbeat);
    for (const account of subscribedAccounts) account.connections.delete(response);
    response.off("close", close);
    socket?.off("close", close);
  };
  response.once("close", close);
  socket?.once("close", close);
}
