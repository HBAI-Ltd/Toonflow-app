import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { openDatabase } from "@toonflow/multi-tenant-db";
import type { AdminDatabase, ListUserOptions, ManagedUser } from "@toonflow/multi-tenant-db";

export type { ListUserOptions, ManagedUser } from "@toonflow/multi-tenant-db";

export const adminAccountSchema = z.string().trim().transform(value => value.normalize("NFKC"))
  .pipe(z.string().min(1).max(64).regex(/^[^\s\u0000-\u001f\u007f]+$/))
  .refine(value => value.toLowerCase().length <= 64);
export const passwordSchema = z.string().min(8).max(128);
export const userIdSchema = z.uuid();
export const userListSchema = z.object({
  search: z.string().trim().max(64).transform(value => accountKey(value)).pipe(z.string().max(64)),
  page: z.number().int().min(1).max(100000000),
  pageSize: z.number().int().min(1).max(100),
  status: z.enum(["all", "enabled", "disabled"]),
});
export type AuthIdentity = { id: string; userName: string; role: "admin" | "user" };

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function fail(message: string, status: number): never { throw Object.assign(new Error(message), { status }); }
function accountKey(value: string) { return value.normalize("NFKC").toLowerCase(); }

export function createMultiTenant(dataDirectory: string) {
  let database: Promise<AdminDatabase | undefined> | undefined;
  let queue = Promise.resolve();
  let adminSessionHash: string | undefined;
  async function getDatabase(create = false) {
    if (database) {
      const current = await database;
      if (current) return current;
    }
    const opening = openDatabase(dataDirectory, create);
    database = opening;
    try {
      const current = await opening;
      if (!current && database === opening) database = undefined;
      return current;
    } catch (error) {
      if (database === opening) database = undefined;
      throw error;
    }
  }
  function serial<T>(action: () => Promise<T>) {
    const current = queue.then(action);
    queue = current.then(() => {}, () => {});
    return current;
  }
  async function createWebSession(db: AdminDatabase, user: AuthIdentity, authVersion = 0) {
    const token = randomBytes(32).toString("hex");
    await db.createWebSession({ tokenHash: digest(token), userId: user.id, role: user.role, expiresAt: Date.now() + 8 * 60 * 60 * 1000, authVersion });
    return { token, user };
  }
  async function addUser(db: AdminDatabase, account: string, password: string, selfRegistration = false) {
    const admin = await db.getAdmin();
    if (!admin) fail("请先设置超级管理员账号", 409);
    await db.initialize();
    const userNameKey = accountKey(account);
    if (userNameKey === accountKey(admin.userName) || await db.getUser(userNameKey)) fail("账号已存在，请使用其他账号", 409);
    const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
    const user = { id: randomUUID(), userName: account, userNameKey, passwordHash, createdAt: Date.now() };
    if (selfRegistration && !await db.getRegistrationEnabled()) fail("当前已关闭注册，请联系管理员创建账号", 403);
    try { await db.createUser(user); }
    catch (error) {
      if (await db.getUser(userNameKey)) fail("账号已存在，请使用其他账号", 409);
      throw error;
    }
    return user;
  }
  return {
    async isConfigured() {
      const db = await getDatabase();
      return !!(await db?.getAdmin());
    },
    async getRegistrationEnabled() {
      const db = await getDatabase();
      return db ? db.getRegistrationEnabled() : true;
    },
    async setRegistrationEnabled(enabled: boolean) {
      const value = z.boolean().parse(enabled);
      const db = await getDatabase();
      if (!db) fail("请先设置超级管理员账号", 409);
      await db.initializeSettings();
      await db.setRegistrationEnabled(value);
      return value;
    },
    async getAdminIdentity(): Promise<AuthIdentity | null> {
      const db = await getDatabase();
      const admin = await db?.getAdmin();
      return admin ? { id: "admin", userName: admin.userName, role: "admin" } : null;
    },
    setup(userName: string, password: string) {
      const account = adminAccountSchema.parse(userName);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase(true);
        if (!db) fail("多租户数据库尚未初始化", 503);
        await db.initialize();
        await db.initializeSettings();
        if (await db.getAdmin()) fail("超级管理员账号已设置，请登录管理后台", 409);
        const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
        try { await db.createAdmin(account, passwordHash); }
        catch {
          if (await db.getAdmin()) fail("超级管理员账号已设置，请登录管理后台", 409);
          fail("超级管理员账号保存失败", 500);
        }
      });
    },
    login(userName: string, password: string) {
      const account = adminAccountSchema.parse(userName);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("请先设置超级管理员账号", 409);
        await db.initialize();
        const admin = await db.getAdmin();
        if (!admin) fail("请先设置超级管理员账号", 409);
        const now = Date.now();
        if (admin.lockedUntil > now) fail("尝试次数过多，请稍后重试", 429);
        const passwordMatches = await Bun.password.verify(password, admin.passwordHash);
        if (accountKey(account) !== accountKey(admin.userName) || !passwordMatches) {
          const attempts = admin.lockedUntil ? 1 : admin.failedAttempts + 1;
          await db.updateAdmin({ failedAttempts: attempts, lockedUntil: attempts >= 5 ? now + 60000 : 0 });
          fail("超级管理员账号或密码错误", 401);
        }
        // ACT: 当前只有一个超级管理员会话；重新登录会替换旧会话，后续多用户阶段再扩展会话表。
        const token = randomBytes(32).toString("hex");
        await db.updateAdmin({ sessionHash: digest(token), sessionExpiresAt: now + 8 * 60 * 60 * 1000, failedAttempts: 0, lockedUntil: 0 });
        adminSessionHash = digest(token);
        return token;
      });
    },
    async authorize(token: string) {
      if (!/^[a-f0-9]{64}$/.test(token)) fail("请先登录多租户管理后台", 401);
      if (!adminSessionHash || digest(token) !== adminSessionHash) fail("管理会话已失效，请重新登录", 401);
      const db = await getDatabase();
      const admin = await db?.getAdmin();
      if (!admin?.sessionHash || admin.sessionExpiresAt <= Date.now()) fail("管理会话已失效，请重新登录", 401);
      const actual = Buffer.from(digest(token), "hex");
      const expected = Buffer.from(admin.sessionHash, "hex");
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) fail("管理会话已失效，请重新登录", 401);
    },
    logout(token: string) {
      return serial(async () => {
        if (!adminSessionHash || !/^[a-f0-9]{64}$/.test(token) || digest(token) !== adminSessionHash) return;
        const db = await getDatabase();
        await db?.updateAdmin({ sessionHash: null, sessionExpiresAt: 0 });
        adminSessionHash = undefined;
      });
    },
    register(userName: string, password: string) {
      const account = adminAccountSchema.parse(userName);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("请先设置超级管理员账号", 409);
        if (!await db.getRegistrationEnabled()) fail("当前已关闭注册，请联系管理员创建账号", 403);
        const user = await addUser(db, account, password, true);
        if (!await db.completeUserLogin(user.id, 0, Date.now())) fail("账号状态已变更，请重新登录", 401);
        return createWebSession(db, { id: user.id, userName: user.userName, role: "user" });
      });
    },
    async listUsers(options: ListUserOptions) {
      const input = userListSchema.parse(options);
      const db = await getDatabase();
      if (!db) fail("请先设置超级管理员账号", 409);
      await db.initialize();
      return { ...await db.listUsers(input), page: input.page, pageSize: input.pageSize };
    },
    createUser(userName: string, password: string): Promise<ManagedUser> {
      const account = adminAccountSchema.parse(userName);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("请先设置超级管理员账号", 409);
        const user = await addUser(db, account, password);
        return { id: user.id, userName: user.userName, disabled: false, createdAt: user.createdAt, lastLoginAt: 0 };
      });
    },
    setUserDisabled(id: string, disabled: boolean) {
      const userId = userIdSchema.parse(id);
      const value = z.boolean().parse(disabled);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("账号不存在", 404);
        await db.initialize();
        if (!await db.setUserDisabled(userId, value)) fail("账号不存在", 404);
      });
    },
    resetUserPassword(id: string, password: string) {
      const userId = userIdSchema.parse(id);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("账号不存在", 404);
        await db.initialize();
        const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
        if (!await db.resetUserPassword(userId, passwordHash)) fail("账号不存在", 404);
      });
    },
    loginWeb(userName: string, password: string) {
      const account = adminAccountSchema.parse(userName);
      passwordSchema.parse(password);
      return serial(async () => {
        const db = await getDatabase();
        if (!db) fail("请先设置超级管理员账号", 409);
        await db.initialize();
        const admin = await db.getAdmin();
        if (!admin) fail("请先设置超级管理员账号", 409);
        const key = accountKey(account);
        const isAdmin = key === accountKey(admin.userName);
        const ordinaryUser = isAdmin ? undefined : await db.getUser(key);
        const user = isAdmin ? admin : ordinaryUser;
        const now = Date.now();
        if (ordinaryUser?.disabled) fail("账号已禁用", 403);
        if (user && user.lockedUntil > now) fail("尝试次数过多，请稍后重试", 429);
        const passwordMatches = await Bun.password.verify(password, user?.passwordHash ?? admin.passwordHash);
        if (!user || !passwordMatches) {
          if (user) {
            const attempts = user.lockedUntil ? 1 : user.failedAttempts + 1;
            const values = { failedAttempts: attempts, lockedUntil: attempts >= 5 ? now + 60000 : 0 };
            if (isAdmin) await db.updateAdmin(values);
            else if (ordinaryUser) await db.updateUser(ordinaryUser.id, values, ordinaryUser.authVersion);
          }
          fail("账号或密码错误", 401);
        }
        if (isAdmin) await db.updateAdmin({ failedAttempts: 0, lockedUntil: 0 });
        else if (!ordinaryUser || !await db.completeUserLogin(ordinaryUser.id, ordinaryUser.authVersion, Date.now())) {
          fail("账号状态已变更，请重新登录", 401);
        }
        return createWebSession(db, { id: isAdmin ? "admin" : String(user.id), userName: user.userName, role: isAdmin ? "admin" : "user" }, ordinaryUser?.authVersion ?? 0);
      });
    },
    async authenticateWeb(token: string): Promise<AuthIdentity | null> {
      if (!/^[a-f0-9]{64}$/.test(token)) return null;
      const db = await getDatabase();
      if (!db) return null;
      // ACT: 单实例阶段在已有 Cookie 首次鉴权时只做幂等建表、补列，保证旧会话升级后仍能读取。
      await db.initialize();
      const session = await db.getWebSession(digest(token));
      if (!session || session.expiresAt <= Date.now()) return null;
      if (session.role === "admin" && session.userId === "admin") {
        const admin = await db.getAdmin();
        return admin ? { id: "admin", userName: admin.userName, role: "admin" } : null;
      }
      if (session.role !== "user") return null;
      const user = await db.getUserById(session.userId);
      return user && !user.disabled && user.authVersion === session.authVersion ? { id: user.id, userName: user.userName, role: "user" } : null;
    },
    async loginHostWeb() {
      const db = await getDatabase();
      const admin = await db?.getAdmin();
      if (!db || !admin) fail("请先设置超级管理员账号", 409);
      await db.initialize();
      return createWebSession(db, { id: "admin", userName: admin.userName, role: "admin" });
    },
    async readUserSettings(userId: string) {
      const db = await getDatabase();
      if (!db) fail("账号不存在", 404);
      await db.initialize();
      const user = await db.getUserById(userId);
      if (!user) fail("账号不存在", 404);
      return { settings: user.settings ?? {}, revision: user.settingsRevision };
    },
    async writeUserSettings(userId: string, settings: Record<string, unknown>, expectedRevision: number) {
      z.number().int().min(0).max(2147483646).parse(expectedRevision);
      const data = z.record(z.string(), z.json()).parse(settings);
      if (Buffer.byteLength(JSON.stringify(data)) > 1024 * 1024) fail("设置内容过大", 413);
      const db = await getDatabase();
      if (!db) fail("账号不存在", 404);
      await db.initialize();
      if (!await db.writeUserSettings(userId, data, expectedRevision)) fail("设置已更新，请重新读取后保存", 409);
      return { settings: data, revision: expectedRevision + 1 };
    },
    async logoutWeb(token: string) {
      if (!/^[a-f0-9]{64}$/.test(token)) return;
      const db = await getDatabase();
      if (!db) return;
      await db.initialize();
      if (await db.getWebSession(digest(token))) await db.expireWebSession(digest(token));
    },
  };
}
