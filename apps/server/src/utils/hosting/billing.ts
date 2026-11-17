import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/utils/accounts/database";
import { isMultiUser, requireUser } from "@/utils/accounts/context";
import { systemConfig } from "@/utils/conf";

const moneyScale = 1000000;
const multiplierScale = 10000;
const maximumMoney = 1000000000;
export const multiplierSchema = z.number().finite().min(0).max(1000).multipleOf(0.0001);
export const billingSettingsSchema = z.object({ enabled: z.boolean(), defaultMultiplier: multiplierSchema,
  upstreamOrigin: z.url().max(2048).refine(value => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && !url.username && !url.password;
  }, "上游地址必须是不含路径或凭据的 HTTPS 源") });
export const walletAdjustmentSchema = z.object({
  userId: z.string().uuid(), operationId: z.string().uuid(),
  amount: z.number().finite().min(-maximumMoney).max(maximumMoney).multipleOf(0.000001),
  multiplier: multiplierSchema.nullable(), note: z.string().trim().min(1).max(300),
  currentPassword: z.string().min(1).max(128),
});
type BillingSettings = z.infer<typeof billingSettingsSchema>;
type BillingScope = { taskId: string; userId: string; enabled: boolean; multiplier: number; origin: string };
type BillingRequest = {
  id: string; taskId: string; userId: string; origin: string; keyHash: string; requestId: string | null;
  asynchronous: number; quotaPerUnit: number | null; exchangeRate: number | null;
  multiplier: number; enabled: number; status: string; note: string; createdAt: number;
};
type UpstreamLog = { request_id?: string; type?: number; quota?: number; model_name?: string; other?: string };
type Conversion = { quotaPerUnit: number; exchangeRate: number };
const scope = new AsyncLocalStorage<BillingScope>();
const conversions = new Map<string, { expires: number; value: Promise<Conversion> }>();
let initialized = false;
let reconciling: Promise<{ checked: number; settled: number; pending: number }> | undefined;

function database() {
  const db = getDatabase();
  if (!initialized) {
    db.exec(`CREATE TABLE IF NOT EXISTS hostedBillingSettings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS hostedWallets (
        userId TEXT PRIMARY KEY REFERENCES accounts(id), balance INTEGER NOT NULL DEFAULT 0, multiplier INTEGER
      );
      CREATE TABLE IF NOT EXISTS hostedBillingTasks (
        taskId TEXT PRIMARY KEY, userId TEXT NOT NULL, enabled INTEGER NOT NULL, multiplier INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS hostedBillingRequests (
        id TEXT PRIMARY KEY, taskId TEXT NOT NULL, userId TEXT NOT NULL, origin TEXT NOT NULL, keyHash TEXT NOT NULL,
        requestId TEXT, asynchronous INTEGER NOT NULL, quotaPerUnit REAL, exchangeRate REAL,
        multiplier INTEGER NOT NULL, enabled INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
        note TEXT NOT NULL DEFAULT '', upstreamAmount INTEGER, chargedAmount INTEGER, createdAt INTEGER NOT NULL, checkedAt INTEGER, settledAt INTEGER
      );
      CREATE UNIQUE INDEX IF NOT EXISTS hostedBillingRequestIdentity ON hostedBillingRequests(origin,keyHash,requestId);
      CREATE INDEX IF NOT EXISTS hostedBillingRequestTask ON hostedBillingRequests(taskId);
      CREATE TABLE IF NOT EXISTS hostedWalletLedger (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id), taskId TEXT, actorId TEXT,
        amount INTEGER NOT NULL, balance INTEGER NOT NULL, multiplier INTEGER, note TEXT NOT NULL, createdAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS hostedWalletLedgerOwner ON hostedWalletLedger(userId,createdAt);`);
    initialized = true;
    if (isMultiUser()) {
      const timer = setInterval(() => { void reconcileBilling().catch(() => undefined); }, 60000);
      timer.unref();
    }
  }
  return db;
}

function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
function integer(value: number) {
  const result = Math.round(value);
  if (!Number.isSafeInteger(result)) fail("金额或倍率超出安全范围");
  return result;
}
function hash(key: string) { return createHash("sha256").update(key).digest("hex"); }

export function getBillingSettings(): BillingSettings {
  const row = database().query<{ value: string }, []>("SELECT value FROM hostedBillingSettings WHERE id=1").get();
  return row ? billingSettingsSchema.parse(JSON.parse(row.value))
    : { enabled: false, defaultMultiplier: 1, upstreamOrigin: "https://api.openfox.vip" };
}

// ACT: 写入前在同一事务再次确认管理员身份和密码版本，避免重认证期间账户被变更。
export function withBillingAdmin<T>(actor: { id: string; passwordHash: string }, operation: () => T): T {
  return database().transaction(() => {
    const latest = database().query<{ role: string; enabled: number; passwordHash: string; mustChangePassword: number }, [string]>(
      "SELECT role,enabled,passwordHash,mustChangePassword FROM accounts WHERE id=?").get(actor.id);
    if (!latest?.enabled || latest.role !== "admin" || latest.mustChangePassword || latest.passwordHash !== actor.passwordHash) fail("管理员登录状态已变更", 403);
    return operation();
  })();
}

export function saveBillingSettings(value: BillingSettings) {
  const settings = billingSettingsSchema.parse(value);
  database().query("INSERT INTO hostedBillingSettings(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value")
    .run(JSON.stringify(settings));
  conversions.clear();
  return settings;
}

export function getWallet(userId: string) {
  const row = database().query<{ balance: number; multiplier: number | null }, [string]>("SELECT balance,multiplier FROM hostedWallets WHERE userId=?").get(userId);
  const settings = getBillingSettings();
  return { balance: (row?.balance ?? 0) / moneyScale, currency: "CNY" as const,
    multiplier: row?.multiplier == null ? null : row.multiplier / multiplierScale,
    effectiveMultiplier: row?.multiplier == null ? settings.defaultMultiplier : row.multiplier / multiplierScale, billingEnabled: settings.enabled };
}

export function adjustWallet(input: z.infer<typeof walletAdjustmentSchema>, actorId: string) {
  const db = database();
  return db.transaction(() => {
    const previous = db.query<{ userId: string; amount: number; actorId: string; note: string; multiplier: number | null }, [string]>("SELECT userId,amount,actorId,note,multiplier FROM hostedWalletLedger WHERE id=?").get(input.operationId);
    const amount = integer(input.amount * moneyScale);
    const multiplier = input.multiplier === null ? null : integer(input.multiplier * multiplierScale);
    if (previous) {
      if (previous.userId !== input.userId || previous.amount !== amount || previous.actorId !== actorId || previous.note !== input.note || previous.multiplier !== multiplier) fail("操作编号已用于其他余额调整，请关闭弹窗后重新操作", 409);
      return getWallet(input.userId);
    }
    if (!db.query("SELECT id FROM accounts WHERE id=?").get(input.userId)) fail("用户不存在", 404);
    const current = db.query<{ balance: number }, [string]>("SELECT balance FROM hostedWallets WHERE userId=?").get(input.userId)?.balance ?? 0;
    const balance = integer(current + amount);
    db.query("INSERT INTO hostedWallets(userId,balance,multiplier) VALUES(?,?,?) ON CONFLICT(userId) DO UPDATE SET balance=excluded.balance,multiplier=excluded.multiplier")
      .run(input.userId, balance, multiplier);
    db.query("INSERT INTO hostedWalletLedger(id,userId,actorId,amount,balance,multiplier,note,createdAt) VALUES(?,?,?,?,?,?,?,?)")
      .run(input.operationId, input.userId, actorId, amount, balance, multiplier, input.note, Date.now());
    return getWallet(input.userId);
  })();
}

export function walletLedger(userId = requireUser().id) {
  if (requireUser().role !== "admin" && userId !== requireUser().id) fail("不能查看其他用户流水", 403);
  return database().query<{ id: string; taskId: string | null; actorId: string | null; amount: number; balance: number; multiplier: number | null; note: string; createdAt: number }, [string]>(
    "SELECT id,taskId,actorId,amount,balance,multiplier,note,createdAt FROM hostedWalletLedger WHERE userId=? ORDER BY createdAt DESC,rowid DESC LIMIT 200").all(userId)
    .map(row => ({ ...row, amount: row.amount / moneyScale, balance: row.balance / moneyScale, multiplier: row.multiplier === null ? null : row.multiplier / multiplierScale,
      note: row.actorId ? `${row.note}；倍率：${row.multiplier === null ? '系统默认' : `${row.multiplier / multiplierScale}×`}` : row.note, currency: "CNY" }));
}

export function taskBilling(taskId: string) {
  const db = database();
  const task = db.query<{ multiplier: number; enabled: number }, [string]>("SELECT multiplier,enabled FROM hostedBillingTasks WHERE taskId=?").get(taskId);
  if (!task) return { status: "legacy", currency: "CNY", upstreamAmount: null, chargedAmount: null, multiplier: null, requests: [] };
  const requests = db.query<{ requestId: string | null; status: string; note: string; upstreamAmount: number | null; chargedAmount: number | null }, [string]>(
    "SELECT requestId,status,note,upstreamAmount,chargedAmount FROM hostedBillingRequests WHERE taskId=? ORDER BY createdAt,rowid").all(taskId);
  const pending = requests.some(row => row.status !== "settled");
  return { status: pending ? "pending" : requests.length ? "settled" : "untracked", currency: "CNY", enabled: !!task.enabled,
    multiplier: task.multiplier / multiplierScale,
    upstreamAmount: !requests.length || pending ? null : requests.reduce((sum, row) => sum + (row.upstreamAmount ?? 0), 0) / moneyScale,
    chargedAmount: requests.length ? requests.reduce((sum, row) => sum + (row.chargedAmount ?? 0), 0) / moneyScale : null,
    requests: requests.map(row => ({ ...row, upstreamAmount: row.upstreamAmount === null ? null : row.upstreamAmount / moneyScale,
      chargedAmount: row.chargedAmount === null ? null : row.chargedAmount / moneyScale })) };
}

export async function withTaskBilling<T>(taskId: string, userId: string, billable: boolean, operation: () => Promise<T>) {
  if (!isMultiUser()) return operation();
  const settings = getBillingSettings();
  const wallet = getWallet(userId);
  if (settings.enabled && billable && wallet.effectiveMultiplier > 0 && wallet.balance <= 0) fail("余额不足，请联系管理员调整余额", 402);
  const multiplier = integer(wallet.effectiveMultiplier * multiplierScale);
  database().query("INSERT OR IGNORE INTO hostedBillingTasks(taskId,userId,enabled,multiplier) VALUES(?,?,?,?)")
    .run(taskId, userId, Number(settings.enabled && billable), multiplier);
  return scope.run({ taskId, userId, enabled: settings.enabled && billable, multiplier, origin: settings.upstreamOrigin }, operation);
}

async function readJson(url: string, key?: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "error",
    headers: key ? { Authorization: `Bearer ${key}` } : {} });
  if (!response.ok) { await response.body?.cancel(); fail(`上游账单查询失败（HTTP ${response.status}）`, 502); }
  if (Number(response.headers.get("content-length")) > 4 * 1024 * 1024) { await response.body?.cancel(); fail("上游账单响应过大", 502); }
  const reader = response.body?.getReader();
  if (!reader) fail("上游账单响应为空", 502);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 4 * 1024 * 1024) fail("上游账单响应过大", 502);
      chunks.push(part.value);
    }
  } finally { await reader.cancel(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { fail("上游未返回有效的账单 JSON", 502); }
}

export async function upstreamConversion(origin = getBillingSettings().upstreamOrigin): Promise<Conversion> {
  const cached = conversions.get(origin);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = (async () => {
    const data = await readJson(`${origin}/api/status`) as { success?: boolean; data?: { quota_per_unit?: unknown; usd_exchange_rate?: unknown } };
    const quotaPerUnit = z.number().finite().positive().parse(data.data?.quota_per_unit);
    const exchangeRate = z.number().finite().positive().parse(data.data?.usd_exchange_rate);
    return { quotaPerUnit, exchangeRate };
  })();
  conversions.set(origin, { expires: Date.now() + 60000, value });
  try { return await value; } catch { conversions.delete(origin); fail("无法取得上游金额换算基准，请稍后重试", 502); }
}

// ACT: 仅观测已配置上游的生成 POST，不读取正文或流、不记录文件上传与状态查询。
export function createBillingFetch(request: typeof fetch = fetch): typeof fetch {
  return Object.assign(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const context = scope.getStore();
    if (!isMultiUser() || !context) return request(input, init);
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method !== "POST" || !/\/(?:chat\/completions|responses|messages|images\/(?:generations|edits)|videos|audio\/(?:speech|transcriptions|translations))\/?$/.test(url.pathname)) return request(input, init);
    if (context.enabled && context.multiplier > 0 && getWallet(context.userId).balance <= 0) fail("余额不足，请联系管理员调整余额", 402);
    if (url.origin !== context.origin) {
      if (context.enabled) fail("当前上游尚未接入实际账单核对，不能启用余额扣费", 503);
      return request(input, init);
    }
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const key = (headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim() || headers.get("x-api-key") || "";
    if (!key) {
      if (context.enabled) fail("上游请求缺少可核对的凭据", 503);
      return request(input, init);
    }
    let conversion: Conversion | undefined;
    try { conversion = await upstreamConversion(context.origin); }
    catch (error) { if (context.enabled) throw error; }
    const id = crypto.randomUUID();
    database().query(`INSERT INTO hostedBillingRequests(id,taskId,userId,origin,keyHash,asynchronous,quotaPerUnit,exchangeRate,multiplier,enabled,createdAt)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(id, context.taskId, context.userId, url.origin, hash(key), Number(/\/videos\/?$/.test(url.pathname)),
        conversion?.quotaPerUnit ?? null, conversion?.exchangeRate ?? null, context.multiplier, Number(context.enabled), Date.now());
    try {
      const response = await request(input, init);
      const requestId = response.headers.get("x-oneapi-request-id");
      if (requestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(requestId)) {
        database().query("UPDATE hostedBillingRequests SET requestId=?,note='' WHERE id=?").run(requestId, id);
      } else database().query("UPDATE hostedBillingRequests SET note=? WHERE id=?").run("响应未提供 Request ID，需人工核对", id);
      return response;
    } catch (error) {
      database().query("UPDATE hostedBillingRequests SET note=? WHERE id=?").run("请求中断或账单引用未保存，需人工核对", id);
      throw error;
    }
  }, request);
}

function credential(keyHash: string) {
  const keys: string[] = [];
  const collect = (value: unknown, name = "") => {
    if (typeof value === "string" && /api.?key$/i.test(name)) keys.push(value.trim().replace(/^Bearer\s+/i, ""));
    else if (Array.isArray(value)) value.forEach(item => collect(item));
    else if (value && typeof value === "object") Object.entries(value).forEach(([name, item]) => collect(item, name));
  };
  collect(systemConfig.get("settings", {}));
  return keys.find(key => hash(key) === keyHash);
}

function settle(row: BillingRequest, quota: number) {
  const db = database();
  db.transaction(() => {
    if (db.query<{ status: string }, [string]>("SELECT status FROM hostedBillingRequests WHERE id=?").get(row.id)?.status === "settled") return;
    const upstreamAmount = integer(quota / row.quotaPerUnit! * row.exchangeRate! * moneyScale);
    const chargedAmount = row.enabled ? integer(Number((BigInt(upstreamAmount) * BigInt(row.multiplier) + BigInt(multiplierScale / 2)) / BigInt(multiplierScale))) : 0;
    const wallet = db.query<{ balance: number }, [string]>("SELECT balance FROM hostedWallets WHERE userId=?").get(row.userId);
    const balance = integer((wallet?.balance ?? 0) - chargedAmount);
    db.query("INSERT INTO hostedWallets(userId,balance) VALUES(?,?) ON CONFLICT(userId) DO UPDATE SET balance=excluded.balance").run(row.userId, balance);
    if (chargedAmount !== 0) db.query("INSERT INTO hostedWalletLedger(id,userId,taskId,amount,balance,note,createdAt) VALUES(?,?,?,?,?,?,?)")
      .run(row.id, row.userId, row.taskId, -chargedAmount, balance, `上游账单 ${row.requestId} × ${row.multiplier / multiplierScale}`, Date.now());
    db.query("UPDATE hostedBillingRequests SET status='settled',upstreamAmount=?,chargedAmount=?,note='',settledAt=? WHERE id=?")
      .run(upstreamAmount, chargedAmount, Date.now(), row.id);
  })();
}

async function reconcile(taskId?: string) {
  const rows = database().query<BillingRequest, [string | null, string | null]>(`SELECT r.* FROM hostedBillingRequests r
    JOIN hostedTasks t ON t.id=r.taskId WHERE r.status='pending' AND t.status NOT IN ('queued','running')
    AND (? IS NULL OR r.taskId=?) ORDER BY COALESCE(r.checkedAt,0),r.createdAt LIMIT 500`).all(taskId ?? null, taskId ?? null);
  const logQueries = new Map<string, Promise<UpstreamLog[]>>();
  let settled = 0;
  for (const row of rows) {
    try {
      if (!row.requestId) fail("缺少 Request ID，需人工核对");
      if (!row.quotaPerUnit || !row.exchangeRate) fail("缺少调用时金额换算基准，需人工核对");
      const key = credential(row.keyHash);
      if (!key) fail("原调用凭据已变更，需人工核对");
      const identity = `${row.origin}/${row.keyHash}`;
      if (!logQueries.has(identity)) logQueries.set(identity, (async () => {
        const response = await readJson(`${row.origin}/api/log/token`, key) as { success?: boolean; data?: UpstreamLog[] };
        if (response.success !== true || !Array.isArray(response.data)) fail("上游未返回可核对的账单");
        return response.data;
      })());
      const logs = await logQueries.get(identity)!;
      const matches = logs.filter(log => log.request_id === row.requestId && log.type === 2);
      if (matches.length !== 1) fail(matches.length ? "同一请求匹配多笔账单，需人工核对" : "消费账单尚未出现或已超出查询范围");
      let quota = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).parse(matches[0].quota);
      if (row.asynchronous) {
        // ACT: 视频提交记录是预扣；仅接受同一任务的明确 actual_quota 结算快照，不从余额差或缺失退款推断。
        const metadata = (log: UpstreamLog): Record<string, unknown> => {
          try { const value = JSON.parse(log.other ?? "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
          catch { return {}; }
        };
        const taskId = metadata(matches[0]).task_id;
        if (typeof taskId !== "string" || !taskId) fail("视频账单缺少任务编号，需人工核对");
        const final = logs.filter(log => [2, 6].includes(log.type ?? 0) && metadata(log).task_id === taskId && Object.hasOwn(metadata(log), "actual_quota"));
        if (final.length !== 1) fail("视频最终结算金额尚未明确，需核对预扣与退款");
        quota = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).parse(metadata(final[0]).actual_quota);
      }
      settle(row, quota);
      settled++;
    } catch (error) {
      const note = error instanceof z.ZodError ? "上游账单金额格式无效，需人工核对" : error instanceof Error ? error.message : "上游账单核对失败";
      database().query("UPDATE hostedBillingRequests SET note=? WHERE id=? AND status='pending'").run(note.slice(0, 300), row.id);
    } finally {
      database().query("UPDATE hostedBillingRequests SET checkedAt=? WHERE id=?").run(Date.now(), row.id);
    }
  }
  return { checked: rows.length, settled, pending: rows.length - settled };
}

export function reconcileBilling(taskId?: string) {
  if (taskId) return reconcile(taskId);
  reconciling ??= reconcile().finally(() => { reconciling = undefined; });
  return reconciling;
}
