import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { and, asc, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { sqliteAdmin, sqliteBillingLedger, sqliteModelRouting, sqliteSettings, sqliteSourceMapping, sqliteUser, sqliteWallet, sqliteWebSession } from "./schema";
import type { AdminDatabase } from "./schema";
import { maxWalletMicros, validateWalletAmount, walletBalanceOverflow, walletSettlementExceeded, walletStateConflict } from "./billing";

export function connectSqlite(file: string): AdminDatabase {
  const client = new Database(file, { create: false, strict: true });
  const db = drizzle(client);
  let accountColumn: boolean | undefined;
  let initialized = false;
  function columns() { return db.all<{ name: string }>(sql`PRAGMA table_info("multiTenantAdmin")`); }
  const insufficientWallet = Symbol("insufficientWallet");
  function readWallet(userId: string, currency: "CNY" | "USD") {
    const wallet = db.select().from(sqliteWallet).where(and(eq(sqliteWallet.userId, userId), eq(sqliteWallet.currency, currency))).get();
    if (!wallet || !Number.isSafeInteger(wallet.balanceMicros) || !Number.isSafeInteger(wallet.reservedMicros)
      || wallet.reservedMicros < 0 || wallet.balanceMicros < wallet.reservedMicros || wallet.balanceMicros > maxWalletMicros) walletStateConflict();
    return wallet;
  }
  return {
    async initializeSettings() {
      // 平台策略只在显式初始化或保存时创建；读取旧库不补表，也不覆盖已有关闭状态。
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantSettings" (
        "id" INTEGER PRIMARY KEY,
        "registrationEnabled" INTEGER NOT NULL DEFAULT 1
      )`);
      db.insert(sqliteSettings).values({ id: 1, registrationEnabled: true }).onConflictDoNothing().run();
    },
    async getRegistrationEnabled() {
      try { return db.select({ enabled: sqliteSettings.registrationEnabled }).from(sqliteSettings).where(eq(sqliteSettings.id, 1)).get()?.enabled ?? true; }
      catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message)?.includes("no such table: multiTenantSettings")) return true;
        throw error;
      }
    },
    async setRegistrationEnabled(enabled) {
      db.insert(sqliteSettings).values({ id: 1, registrationEnabled: enabled })
        .onConflictDoUpdate({ target: sqliteSettings.id, set: { registrationEnabled: enabled } }).run();
    },
    async getSourceMapping() {
      try {
        return db.select({ mappings: sqliteSourceMapping.mappings, revision: sqliteSourceMapping.revision })
          .from(sqliteSourceMapping).where(eq(sqliteSourceMapping.id, 1)).get();
      } catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message) === "no such table: multiTenantSourceMapping") return;
        throw error;
      }
    },
    async initializeSourceMapping() {
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantSourceMapping" (
        "id" INTEGER PRIMARY KEY,
        "mappings" TEXT NOT NULL,
        "revision" INTEGER NOT NULL
      )`);
    },
    async writeSourceMapping(mappings, expectedRevision) {
      if (expectedRevision === 0) {
        return db.insert(sqliteSourceMapping).values({ id: 1, mappings, revision: 1 })
          .onConflictDoNothing({ target: sqliteSourceMapping.id }).returning({ id: sqliteSourceMapping.id }).get() !== undefined;
      }
      return db.update(sqliteSourceMapping).set({ mappings, revision: expectedRevision + 1 })
        .where(and(eq(sqliteSourceMapping.id, 1), eq(sqliteSourceMapping.revision, expectedRevision)))
        .returning({ id: sqliteSourceMapping.id }).get() !== undefined;
    },
    async getModelRouting() {
      try {
        return db.select({ configuration: sqliteModelRouting.configuration, revision: sqliteModelRouting.revision })
          .from(sqliteModelRouting).where(eq(sqliteModelRouting.id, 1)).get();
      } catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message) === "no such table: multiTenantModelRouting") return;
        throw error;
      }
    },
    async initializeModelRouting() {
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantModelRouting" (
        "id" INTEGER PRIMARY KEY,
        "configuration" TEXT NOT NULL,
        "revision" INTEGER NOT NULL
      )`);
    },
    async writeModelRouting(configuration, expectedRevision) {
      if (expectedRevision === 0) {
        return db.insert(sqliteModelRouting).values({ id: 1, configuration, revision: 1 })
          .onConflictDoNothing({ target: sqliteModelRouting.id }).returning({ id: sqliteModelRouting.id }).get() !== undefined;
      }
      return db.update(sqliteModelRouting).set({ configuration, revision: expectedRevision + 1 })
        .where(and(eq(sqliteModelRouting.id, 1), eq(sqliteModelRouting.revision, expectedRevision)))
        .returning({ id: sqliteModelRouting.id }).get() !== undefined;
    },
    async initializeBilling() {
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantWallet" (
        "userId" TEXT NOT NULL,
        "currency" TEXT NOT NULL CHECK ("currency" IN ('CNY', 'USD')),
        "balanceMicros" INTEGER NOT NULL DEFAULT 0 CHECK ("balanceMicros" BETWEEN 0 AND 9007199254740991),
        "reservedMicros" INTEGER NOT NULL DEFAULT 0 CHECK ("reservedMicros" >= 0 AND "reservedMicros" <= "balanceMicros"),
        PRIMARY KEY ("userId", "currency")
      )`);
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantBillingLedger" (
        "requestId" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "currency" TEXT NOT NULL CHECK ("currency" IN ('CNY', 'USD')),
        "kind" TEXT NOT NULL CHECK ("kind" IN ('credit', 'model')),
        "status" TEXT NOT NULL CHECK ("status" IN ('reserved', 'settled', 'released')),
        "requestHash" TEXT NOT NULL,
        "reservedMicros" INTEGER NOT NULL DEFAULT 0 CHECK ("reservedMicros" BETWEEN 0 AND 9007199254740991),
        "amountMicros" INTEGER NOT NULL DEFAULT 0 CHECK ("amountMicros" BETWEEN 0 AND 9007199254740991),
        "details" TEXT NOT NULL,
        "usage" TEXT,
        "createdAt" INTEGER NOT NULL,
        "updatedAt" INTEGER NOT NULL
      )`);
      db.run(sql`CREATE INDEX IF NOT EXISTS "multiTenantBillingLedgerUserCreatedAt"
        ON "multiTenantBillingLedger" ("userId", "createdAt")`);
    },
    async getWallets(userId) {
      try { return db.select().from(sqliteWallet).where(eq(sqliteWallet.userId, userId)).all(); }
      catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message) === "no such table: multiTenantWallet") return [];
        throw error;
      }
    },
    async getBillingRecord(requestId) {
      try { return db.select().from(sqliteBillingLedger).where(eq(sqliteBillingLedger.requestId, requestId)).get(); }
      catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message) === "no such table: multiTenantBillingLedger") return;
        throw error;
      }
    },
    async listBillingRecords(userId, limit) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw Object.assign(new Error("账单数量必须为 1 到 100"), { status: 400 });
      try {
        return db.select().from(sqliteBillingLedger).where(eq(sqliteBillingLedger.userId, userId))
          .orderBy(desc(sqliteBillingLedger.createdAt), desc(sqliteBillingLedger.requestId)).limit(limit).all();
      } catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message) === "no such table: multiTenantBillingLedger") return [];
        throw error;
      }
    },
    async creditWallet(record) {
      validateWalletAmount(record.amountMicros);
      return client.transaction(() => {
        const inserted = db.insert(sqliteBillingLedger).values({ ...record, kind: "credit", status: "settled", reservedMicros: 0,
          usage: null, updatedAt: record.createdAt }).onConflictDoNothing({ target: sqliteBillingLedger.requestId })
          .returning({ requestId: sqliteBillingLedger.requestId }).get();
        if (!inserted) return "duplicate" as const;
        db.insert(sqliteWallet).values({ userId: record.userId, currency: record.currency, balanceMicros: 0, reservedMicros: 0 }).onConflictDoNothing().run();
        const wallet = readWallet(record.userId, record.currency);
        if (wallet.balanceMicros > maxWalletMicros - record.amountMicros) walletBalanceOverflow();
        const changed = db.update(sqliteWallet).set({ balanceMicros: sql`${sqliteWallet.balanceMicros} + ${record.amountMicros}` })
          .where(and(eq(sqliteWallet.userId, record.userId), eq(sqliteWallet.currency, record.currency),
            sql`${sqliteWallet.balanceMicros} <= ${maxWalletMicros - record.amountMicros}`))
          .returning({ userId: sqliteWallet.userId }).get();
        if (!changed) walletStateConflict();
        return "created" as const;
      }).immediate();
    },
    async reserveWallet(record) {
      validateWalletAmount(record.reservedMicros);
      try {
        return client.transaction(() => {
          const inserted = db.insert(sqliteBillingLedger).values({ ...record, kind: "model", status: "reserved", amountMicros: 0,
            usage: null, updatedAt: record.createdAt }).onConflictDoNothing({ target: sqliteBillingLedger.requestId })
            .returning({ requestId: sqliteBillingLedger.requestId }).get();
          if (!inserted) return "duplicate" as const;
          db.insert(sqliteWallet).values({ userId: record.userId, currency: record.currency, balanceMicros: 0, reservedMicros: 0 }).onConflictDoNothing().run();
          const wallet = readWallet(record.userId, record.currency);
          if (wallet.balanceMicros - wallet.reservedMicros < record.reservedMicros) throw insufficientWallet;
          const changed = db.update(sqliteWallet).set({ reservedMicros: sql`${sqliteWallet.reservedMicros} + ${record.reservedMicros}` })
            .where(and(eq(sqliteWallet.userId, record.userId), eq(sqliteWallet.currency, record.currency),
              sql`${sqliteWallet.balanceMicros} - ${sqliteWallet.reservedMicros} >= ${record.reservedMicros}`))
            .returning({ userId: sqliteWallet.userId }).get();
          if (!changed) walletStateConflict();
          return "created" as const;
        }).immediate();
      } catch (error) {
        if (error === insufficientWallet) return "insufficient";
        throw error;
      }
    },
    async settleWallet(requestId, userId, amountMicros, usage, at) {
      validateWalletAmount(amountMicros);
      return client.transaction(() => {
        const record = db.select().from(sqliteBillingLedger).where(eq(sqliteBillingLedger.requestId, requestId)).get();
        if (!record || record.userId !== userId || record.status !== "reserved" || record.kind !== "model") return false;
        if (!Number.isSafeInteger(record.reservedMicros) || record.reservedMicros < 0 || record.reservedMicros > maxWalletMicros
          || record.amountMicros !== 0) walletStateConflict();
        if (amountMicros > record.reservedMicros) walletSettlementExceeded();
        const wallet = readWallet(userId, record.currency);
        if (wallet.reservedMicros < record.reservedMicros || wallet.balanceMicros < amountMicros) walletStateConflict();
        const changed = db.update(sqliteWallet).set({ balanceMicros: sql`${sqliteWallet.balanceMicros} - ${amountMicros}`,
          reservedMicros: sql`${sqliteWallet.reservedMicros} - ${record.reservedMicros}` })
          .where(and(eq(sqliteWallet.userId, userId), eq(sqliteWallet.currency, record.currency),
            sql`${sqliteWallet.balanceMicros} >= ${amountMicros}`, sql`${sqliteWallet.reservedMicros} >= ${record.reservedMicros}`))
          .returning({ userId: sqliteWallet.userId }).get();
        if (!changed) walletStateConflict();
        const settled = db.update(sqliteBillingLedger).set({ status: "settled", amountMicros, usage, updatedAt: at })
          .where(and(eq(sqliteBillingLedger.requestId, requestId), eq(sqliteBillingLedger.userId, userId), eq(sqliteBillingLedger.status, "reserved")))
          .returning({ requestId: sqliteBillingLedger.requestId }).get();
        if (!settled) walletStateConflict();
        return true;
      }).immediate();
    },
    async releaseWallet(requestId, userId, at, usage) {
      return client.transaction(() => {
        const record = db.select().from(sqliteBillingLedger).where(eq(sqliteBillingLedger.requestId, requestId)).get();
        if (!record || record.userId !== userId || record.status !== "reserved" || record.kind !== "model") return false;
        if (!Number.isSafeInteger(record.reservedMicros) || record.reservedMicros < 0 || record.reservedMicros > maxWalletMicros
          || record.amountMicros !== 0) walletStateConflict();
        const wallet = readWallet(userId, record.currency);
        if (wallet.reservedMicros < record.reservedMicros) walletStateConflict();
        const changed = db.update(sqliteWallet).set({ reservedMicros: sql`${sqliteWallet.reservedMicros} - ${record.reservedMicros}` })
          .where(and(eq(sqliteWallet.userId, userId), eq(sqliteWallet.currency, record.currency), sql`${sqliteWallet.reservedMicros} >= ${record.reservedMicros}`))
          .returning({ userId: sqliteWallet.userId }).get();
        if (!changed) walletStateConflict();
        const released = db.update(sqliteBillingLedger).set({ status: "released", amountMicros: 0, usage: usage ?? record.usage, updatedAt: at })
          .where(and(eq(sqliteBillingLedger.requestId, requestId), eq(sqliteBillingLedger.userId, userId), eq(sqliteBillingLedger.status, "reserved")))
          .returning({ requestId: sqliteBillingLedger.requestId }).get();
        if (!released) walletStateConflict();
        return true;
      }).immediate();
    },
    async initialize() {
      if (initialized) return;
      // ACT: 配置、鉴权及管理首次使用时只幂等建表、补列；旧超管账号使用 admin，保留原密码、会话和设置。
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantAdmin" (
        "id" INTEGER PRIMARY KEY,
        "userName" TEXT NOT NULL DEFAULT 'admin',
        "passwordHash" TEXT NOT NULL,
        "sessionHash" TEXT,
        "sessionExpiresAt" INTEGER NOT NULL DEFAULT 0,
        "failedAttempts" INTEGER NOT NULL DEFAULT 0,
        "lockedUntil" INTEGER NOT NULL DEFAULT 0
      )`);
      if (!columns().some(column => column.name === "userName")) {
        client.transaction(() => {
          if (!columns().some(column => column.name === "userName")) {
            db.run(sql`ALTER TABLE "multiTenantAdmin" ADD COLUMN "userName" TEXT NOT NULL DEFAULT 'admin'`);
          }
        }).immediate();
      }
      accountColumn = true;
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantUser" (
        "id" TEXT PRIMARY KEY,
        "userName" TEXT NOT NULL,
        "userNameKey" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "failedAttempts" INTEGER NOT NULL DEFAULT 0,
        "lockedUntil" INTEGER NOT NULL DEFAULT 0,
        "settings" TEXT,
        "settingsRevision" INTEGER NOT NULL DEFAULT 0,
        "disabled" INTEGER NOT NULL DEFAULT 0,
        "authVersion" INTEGER NOT NULL DEFAULT 0,
        "createdAt" INTEGER NOT NULL DEFAULT 0,
        "lastLoginAt" INTEGER NOT NULL DEFAULT 0
      )`);
      client.transaction(() => {
        const current = db.all<{ name: string }>(sql`PRAGMA table_info("multiTenantUser")`);
        // ACT: 历史时间未知时保留 0；只补列，不把升级时刻伪装为用户创建或登录时间。
        for (const [name, migration] of [
          ["settings", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "settings" TEXT`],
          ["settingsRevision", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "settingsRevision" INTEGER NOT NULL DEFAULT 0`],
          ["disabled", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "disabled" INTEGER NOT NULL DEFAULT 0`],
          ["authVersion", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0`],
          ["createdAt", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "createdAt" INTEGER NOT NULL DEFAULT 0`],
          ["lastLoginAt", sql`ALTER TABLE "multiTenantUser" ADD COLUMN "lastLoginAt" INTEGER NOT NULL DEFAULT 0`],
        ] as const) {
          if (!current.some(column => column.name === name)) db.run(migration);
        }
      }).immediate();
      db.run(sql`CREATE TABLE IF NOT EXISTS "multiTenantWebSession" (
        "tokenHash" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'user')),
        "expiresAt" INTEGER NOT NULL,
        "authVersion" INTEGER NOT NULL DEFAULT 0
      )`);
      client.transaction(() => {
        if (!db.all<{ name: string }>(sql`PRAGMA table_info("multiTenantWebSession")`).some(column => column.name === "authVersion")) {
          db.run(sql`ALTER TABLE "multiTenantWebSession" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0`);
        }
      }).immediate();
      initialized = true;
    },
    async getAdmin() {
      if (accountColumn === undefined) {
        const current = columns();
        if (!current.length) return;
        accountColumn = current.some(column => column.name === "userName");
      }
      return db.select({ ...getTableColumns(sqliteAdmin), userName: accountColumn ? sqliteAdmin.userName : sql<string>`${"admin"}` })
        .from(sqliteAdmin).where(eq(sqliteAdmin.id, 1)).get();
    },
    async createAdmin(userName, passwordHash) {
      db.insert(sqliteAdmin).values({ id: 1, userName, passwordHash }).run();
    },
    async updateAdmin(values) {
      db.update(sqliteAdmin).set(values).where(eq(sqliteAdmin.id, 1)).run();
    },
    async getUser(userNameKey) {
      return db.select().from(sqliteUser).where(eq(sqliteUser.userNameKey, userNameKey)).get();
    },
    async getUserById(id) {
      return db.select().from(sqliteUser).where(eq(sqliteUser.id, id)).get();
    },
    async createUser(user) {
      db.insert(sqliteUser).values({ ...user, settings: {}, settingsRevision: 0 }).run();
    },
    async updateUser(id, values, expectedAuthVersion) {
      db.update(sqliteUser).set(values).where(and(eq(sqliteUser.id, id),
        expectedAuthVersion === undefined ? undefined : eq(sqliteUser.authVersion, expectedAuthVersion))).run();
    },
    async completeUserLogin(id, expectedAuthVersion, at) {
      return db.update(sqliteUser).set({ failedAttempts: 0, lockedUntil: 0, lastLoginAt: at })
        .where(and(eq(sqliteUser.id, id), eq(sqliteUser.disabled, false), eq(sqliteUser.authVersion, expectedAuthVersion)))
        .returning({ id: sqliteUser.id }).get() !== undefined;
    },
    async listUsers(options) {
      const pattern = `%${options.search.replace(/[!%_]/g, "!$&")}%`;
      const condition = and(options.search ? sql`${sqliteUser.userNameKey} LIKE ${pattern} ESCAPE '!'` : undefined,
        options.status === "all" ? undefined : eq(sqliteUser.disabled, options.status === "disabled"));
      const total = db.select({ value: count() }).from(sqliteUser).where(condition).get()!.value;
      // ACT: 包含搜索由 SQL LIKE 扫描；用户量增长后可增加专用搜索索引，分页始终由数据库执行。
      const items = db.select({ id: sqliteUser.id, userName: sqliteUser.userName, disabled: sqliteUser.disabled,
        createdAt: sqliteUser.createdAt, lastLoginAt: sqliteUser.lastLoginAt }).from(sqliteUser).where(condition)
        .orderBy(desc(sqliteUser.createdAt), asc(sqliteUser.userNameKey)).limit(options.pageSize).offset((options.page - 1) * options.pageSize).all();
      return { items, total };
    },
    async setUserDisabled(id, disabled) {
      return db.update(sqliteUser).set({ disabled, authVersion: sql`${sqliteUser.authVersion} + 1` }).where(eq(sqliteUser.id, id))
        .returning({ id: sqliteUser.id }).get() !== undefined;
    },
    async resetUserPassword(id, passwordHash) {
      return db.update(sqliteUser).set({ passwordHash, failedAttempts: 0, lockedUntil: 0, authVersion: sql`${sqliteUser.authVersion} + 1` })
        .where(eq(sqliteUser.id, id)).returning({ id: sqliteUser.id }).get() !== undefined;
    },
    async createWebSession(session) {
      db.insert(sqliteWebSession).values(session).run();
    },
    async getWebSession(tokenHash) {
      try { return db.select().from(sqliteWebSession).where(eq(sqliteWebSession.tokenHash, tokenHash)).get(); }
      catch (error) {
        const failure = error as { message?: string; cause?: { message?: string } };
        if ((failure.cause?.message ?? failure.message)?.includes("no such table: multiTenantWebSession")) return;
        throw error;
      }
    },
    async expireWebSession(tokenHash) {
      db.update(sqliteWebSession).set({ expiresAt: 0 }).where(eq(sqliteWebSession.tokenHash, tokenHash)).run();
    },
    async writeUserSettings(userId, settings, expectedRevision) {
      return db.update(sqliteUser).set({ settings, settingsRevision: expectedRevision + 1 })
        .where(and(eq(sqliteUser.id, userId), eq(sqliteUser.settingsRevision, expectedRevision))).returning({ id: sqliteUser.id }).get() !== undefined;
    },
  };
}
