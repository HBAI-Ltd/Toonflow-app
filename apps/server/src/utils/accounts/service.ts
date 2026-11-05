import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { getDatabase } from "./database";
import { requireUser, type AccountUser } from "./context";
import blockedPasswords from "./blockedPasswords.json";

type AccountRow = Omit<AccountUser, "enabled" | "mustChangePassword"> & {
  enabled: number;
  mustChangePassword: number;
  passwordHash: string;
};
type SessionRow = {
  id: string; userId: string; familyId: string; accessExpiresAt: number;
  expiresAt: number; usedAt: number | null; revoked: number;
};

export const usernameSchema = z.string().min(3).max(64).regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/);
// ASVS 5.0.0 6.2.4: SecLists 中符合最短长度策略的前 3000 个常见密码；来源和许可随数据保留。
const blockedPasswordSet = new Set(blockedPasswords.passwords.map(value => value.toLowerCase()));
export const passwordSchema = z.string().max(128)
  .refine(value => [...value].length >= 15, "密码至少需要 15 个字符")
  .refine(value => !blockedPasswordSet.has(value.toLowerCase()), "请勿使用常见或已泄露的密码");
export const storageLimitSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const accessDuration = 5 * 60 * 1000;
const refreshDuration = 7 * 24 * 60 * 60 * 1000;
const throttleDuration = 15 * 60 * 1000;
const cookieName = "toonflowRefresh";
let dummyHash: Promise<string> | undefined;

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toUser(row: AccountRow): AccountUser {
  return { id: row.id, username: row.username, role: row.role, enabled: !!row.enabled,
    mustChangePassword: !!row.mustChangePassword, storageLimitBytes: row.storageLimitBytes };
}

function accountRow(id: string) {
  return getDatabase().query<AccountRow, [string]>("SELECT * FROM accounts WHERE id = ?").get(id);
}

export function getUser(id: string): AccountUser | undefined {
  const row = accountRow(id);
  return row ? toUser(row) : undefined;
}

export function isInitialized() {
  return !!getDatabase().query("SELECT value FROM accountMetadata WHERE key = 'initialized' AND value = '1'").get();
}

export function audit(event: string, actorId?: string, targetId?: string) {
  getDatabase().query("INSERT INTO accountAudit(event, actorId, targetId, createdAt) VALUES (?, ?, ?, ?)")
    .run(event, actorId ?? null, targetId ?? null, Date.now());
}

export function consumeAttempt(key: string, maximum: number) {
  const db = getDatabase();
  const now = Date.now();
  const attempts = db.transaction(() => {
    db.query("DELETE FROM accountThrottle WHERE windowStart < ?").run(now - throttleDuration);
    db.query(`INSERT INTO accountThrottle(key, attempts, windowStart) VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1`).run(key, now);
    return db.query<{ attempts: number }, [string]>("SELECT attempts FROM accountThrottle WHERE key = ?").get(key)!.attempts;
  })();
  if (attempts > maximum) fail("尝试次数过多，请稍后重试", 429);
}

async function hashPassword(password: string) {
  passwordSchema.parse(password);
  return Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
}

async function verifyPassword(row: AccountRow | null, password: string) {
  dummyHash ??= Bun.password.hash(randomBytes(32).toString("hex"), { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
  return await Bun.password.verify(password, row?.passwordHash ?? await dummyHash) && !!row?.enabled;
}

function newSession(user: AccountUser, familyId: string = crypto.randomUUID(), expiresAt = Date.now() + refreshDuration) {
  const now = Date.now();
  const accessToken = randomBytes(32).toString("base64url");
  const refreshToken = randomBytes(32).toString("base64url");
  getDatabase().query("DELETE FROM accountSessions WHERE expiresAt < ?").run(now);
  getDatabase().query(`INSERT INTO accountSessions
    (id,userId,familyId,accessHash,refreshHash,accessExpiresAt,expiresAt,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(crypto.randomUUID(), user.id, familyId, tokenHash(accessToken), tokenHash(refreshToken), now + accessDuration, expiresAt, now);
  return { accessToken, expiresAt: now + accessDuration, user, refreshToken, refreshExpiresAt: expiresAt };
}

export function writeSession(res: Response, bundle: ReturnType<typeof newSession>) {
  res.cookie(cookieName, bundle.refreshToken, cookieOptions(bundle.refreshExpiresAt));
  res.setHeader("Cache-Control", "no-store");
  return { accessToken: bundle.accessToken, expiresAt: bundle.expiresAt, user: bundle.user };
}

function cookieOptions(expiresAt = Date.now()) {
  return { httpOnly: true, sameSite: "strict" as const, secure: publicOrigin().protocol === "https:",
    path: "/api/auth", expires: new Date(expiresAt) };
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(cookieName, cookieOptions());
}

function refreshCookie(req: Request) {
  const cookies = (req.headers.cookie ?? "").split(";").map(part => part.trim()).filter(part => part.startsWith(`${cookieName}=`));
  if (cookies.length !== 1) return "";
  const token = cookies[0]!.slice(cookieName.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : "";
}

export function publicOrigin() {
  const configured = process.env.TOONFLOW_PUBLIC_ORIGIN;
  if (!configured) fail("托管模式需要 TOONFLOW_PUBLIC_ORIGIN", 503);
  const origin = new URL(configured);
  if (origin.origin !== configured || origin.username || origin.password || !["http:", "https:"].includes(origin.protocol)) {
    fail("TOONFLOW_PUBLIC_ORIGIN 必须是精确的 HTTP(S) 源", 503);
  }
  if (origin.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
    fail("托管服务必须使用 HTTPS", 503);
  }
  return origin;
}

export async function login(username: string, password: string) {
  const normalized = username.toLowerCase();
  consumeAttempt(`login:${tokenHash(normalized)}`, 10);
  const row = getDatabase().query<AccountRow, [string]>("SELECT * FROM accounts WHERE username = ?").get(normalized);
  if (!await verifyPassword(row, password)) {
    audit("loginDenied", undefined, row?.id);
    fail("用户名或密码不正确", 401);
  }
  return getDatabase().transaction(() => {
    const latest = accountRow(row!.id);
    if (!latest?.enabled || latest.passwordHash !== row!.passwordHash) fail("用户名或密码不正确", 401);
    getDatabase().query("DELETE FROM accountThrottle WHERE key = ?").run(`login:${tokenHash(normalized)}`);
    const bundle = newSession(toUser(latest));
    audit("login", latest.id, latest.id);
    return bundle;
  })();
}

export function authenticateAccess(token: string): AccountUser | undefined {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const session = getDatabase().query<SessionRow, [string]>("SELECT * FROM accountSessions WHERE accessHash = ?").get(tokenHash(token));
  if (!session || session.revoked || session.accessExpiresAt <= Date.now() || session.expiresAt <= Date.now()) return;
  const user = getUser(session.userId);
  return user?.enabled ? user : undefined;
}

export function rotateAuthenticatedSession(req: Request, res: Response) {
  const user = requireUser();
  const authorization = req.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) fail("请先登录", 401);
  const db = getDatabase();
  const bundle = db.transaction(() => {
    // 管理接口不携带 /api/auth Cookie；重置自己已撤销旧记录，仍须从原 access 定位其会话家族。
    const session = db.query<SessionRow, [string]>("SELECT * FROM accountSessions WHERE accessHash = ?").get(tokenHash(authorization.slice(7)));
    if (!session || session.userId !== user.id) fail("请先登录", 401);
    db.query("UPDATE accountSessions SET revoked = 1 WHERE familyId = ?").run(session.familyId);
    const latest = getUser(user.id);
    audit("sessionRotated", user.id, user.id);
    return latest?.enabled ? newSession(latest) : undefined;
  })();
  if (!bundle) {
    clearSessionCookie(res);
    return;
  }
  return writeSession(res, bundle);
}

export function refresh(req: Request) {
  const token = refreshCookie(req);
  if (!token) fail("登录已过期，请重新登录", 401);
  const db = getDatabase();
  // 提交重放撤销后再抛错，不能让事务回滚撤销。
  const bundle = db.transaction(() => {
    const session = db.query<SessionRow, [string]>("SELECT * FROM accountSessions WHERE refreshHash = ?").get(tokenHash(token));
    if (!session) return;
    if (session.usedAt !== null || session.revoked) {
      db.query("UPDATE accountSessions SET revoked = 1 WHERE familyId = ?").run(session.familyId);
      audit("refreshReplay", session.userId, session.userId);
      return;
    }
    const user = getUser(session.userId);
    if (!user?.enabled || session.expiresAt <= Date.now()) return;
    db.query("UPDATE accountSessions SET usedAt = ? WHERE id = ?").run(Date.now(), session.id);
    return newSession(user, session.familyId, session.expiresAt);
  })();
  if (!bundle) fail("登录已过期，请重新登录", 401);
  return bundle;
}

export function logout(req: Request) {
  const token = refreshCookie(req);
  if (!token) return;
  const db = getDatabase();
  db.transaction(() => {
    const session = db.query<SessionRow, [string]>("SELECT * FROM accountSessions WHERE refreshHash = ?").get(tokenHash(token));
    if (!session) return;
    db.query("UPDATE accountSessions SET revoked = 1 WHERE familyId = ?").run(session.familyId);
    audit("logout", session.userId, session.userId);
  })();
}

export async function reauthenticate(password: string) {
  const user = requireUser();
  consumeAttempt(`reauth:${user.id}`, 10);
  const row = accountRow(user.id);
  if (!await verifyPassword(row, password)) {
    audit("reauthDenied", user.id, user.id);
    fail("当前密码不正确", 401);
  }
  getDatabase().query("DELETE FROM accountThrottle WHERE key = ?").run(`reauth:${user.id}`);
  return row!;
}

function assertCurrent(row: AccountRow) {
  const latest = accountRow(row.id);
  if (!latest?.enabled || latest.passwordHash !== row.passwordHash || latest.role !== row.role) fail("登录状态已变更，请重新登录", 401);
  return latest;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const row = await reauthenticate(currentPassword);
  if (await Bun.password.verify(newPassword, row.passwordHash)) fail("新密码不能与当前密码相同");
  const hash = await hashPassword(newPassword);
  return getDatabase().transaction(() => {
    assertCurrent(row);
    getDatabase().query("UPDATE accounts SET passwordHash = ?, mustChangePassword = 0 WHERE id = ?").run(hash, row.id);
    getDatabase().query("UPDATE accountSessions SET revoked = 1 WHERE userId = ?").run(row.id);
    audit("passwordChanged", row.id, row.id);
    return newSession(getUser(row.id)!);
  })();
}

export function requireAdmin() {
  const user = requireUser();
  if (user.role !== "admin" || user.mustChangePassword) fail("需要管理员权限", 403);
  return user;
}

export function listUsers() {
  requireAdmin();
  return getDatabase().query<AccountRow, []>("SELECT * FROM accounts ORDER BY createdAt, id").all().map(toUser);
}

export async function createUser(username: string, temporaryPassword: string, storageLimitBytes: number, currentPassword: string) {
  requireAdmin();
  const actor = await reauthenticate(currentPassword);
  const hash = await hashPassword(temporaryPassword);
  usernameSchema.parse(username);
  storageLimitSchema.parse(storageLimitBytes);
  return getDatabase().transaction(() => {
    assertCurrent(actor);
    const id = crypto.randomUUID();
    if (getDatabase().query("SELECT id FROM accounts WHERE username = ?").get(username.toLowerCase())) fail("用户名已存在", 409);
    getDatabase().query(`INSERT INTO accounts(id,username,passwordHash,role,enabled,mustChangePassword,storageLimitBytes,createdAt)
      VALUES (?,?,?,'user',1,1,?,?)`).run(id, username.toLowerCase(), hash, storageLimitBytes, Date.now());
    audit("userCreated", actor.id, id);
    return getUser(id)!;
  })();
}

export async function updateUser(id: string, changes: { enabled?: boolean; storageLimitBytes?: number }, currentPassword: string) {
  requireAdmin();
  const actor = await reauthenticate(currentPassword);
  return getDatabase().transaction(() => {
    assertCurrent(actor);
    const target = getUser(id);
    if (!target) fail("用户不存在", 404);
    if (changes.enabled === false && target.enabled && target.role === "admin") {
      const count = getDatabase().query<{ count: number }, []>("SELECT COUNT(*) AS count FROM accounts WHERE enabled = 1 AND role = 'admin'").get()!.count;
      if (count <= 1) fail("不能停用最后一个启用的管理员", 409);
    }
    getDatabase().query("UPDATE accounts SET enabled = ?, storageLimitBytes = ? WHERE id = ?")
      .run(changes.enabled === undefined ? Number(target.enabled) : Number(changes.enabled), changes.storageLimitBytes ?? target.storageLimitBytes, id);
    if (changes.enabled === false) getDatabase().query("UPDATE accountSessions SET revoked = 1 WHERE userId = ?").run(id);
    audit("userUpdated", actor.id, id);
    return getUser(id)!;
  })();
}

export async function resetPassword(id: string, temporaryPassword: string, currentPassword: string) {
  requireAdmin();
  const actor = await reauthenticate(currentPassword);
  const hash = await hashPassword(temporaryPassword);
  return getDatabase().transaction(() => {
    assertCurrent(actor);
    if (!getUser(id)) fail("用户不存在", 404);
    getDatabase().query("UPDATE accounts SET passwordHash = ?, mustChangePassword = 1 WHERE id = ?").run(hash, id);
    getDatabase().query("UPDATE accountSessions SET revoked = 1 WHERE userId = ?").run(id);
    audit("passwordReset", actor.id, id);
  })();
}

export async function initializeAdministrator(username: string, password: string) {
  usernameSchema.parse(username);
  const hash = await hashPassword(password);
  return getDatabase().transaction(() => {
    const db = getDatabase();
    if (isInitialized() || db.query("SELECT id FROM accounts LIMIT 1").get()) fail("管理员已经初始化", 409);
    const id = crypto.randomUUID();
    db.query(`INSERT INTO accounts(id,username,passwordHash,role,enabled,mustChangePassword,storageLimitBytes,createdAt)
      VALUES (?,?,?,'admin',1,0,?,?)`).run(id, username.toLowerCase(), hash, 1024 ** 3, Date.now());
    db.query("INSERT INTO accountMetadata(key,value) VALUES ('initialized','1'), ('legacyMigrationOwner',?)").run(id);
    audit("administratorInitialized", id, id);
    return getUser(id)!;
  })();
}
