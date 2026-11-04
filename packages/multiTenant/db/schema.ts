import { bigint, boolean, index as mysqlIndex, int, json, mysqlEnum, mysqlTable, primaryKey as mysqlPrimaryKey, varchar } from "drizzle-orm/mysql-core";
import { index as sqliteIndex, integer, primaryKey as sqlitePrimaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sqliteAdmin = sqliteTable("multiTenantAdmin", {
  id: integer("id").primaryKey(),
  userName: text("userName").notNull().default("admin"),
  passwordHash: text("passwordHash").notNull(),
  sessionHash: text("sessionHash"),
  sessionExpiresAt: integer("sessionExpiresAt").notNull().default(0),
  failedAttempts: integer("failedAttempts").notNull().default(0),
  lockedUntil: integer("lockedUntil").notNull().default(0),
});

export const mysqlAdmin = mysqlTable("multiTenantAdmin", {
  id: int("id").primaryKey(),
  userName: varchar("userName", { length: 64 }).notNull().default("admin"),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  sessionHash: varchar("sessionHash", { length: 64 }),
  sessionExpiresAt: bigint("sessionExpiresAt", { mode: "number" }).notNull().default(0),
  failedAttempts: int("failedAttempts").notNull().default(0),
  lockedUntil: bigint("lockedUntil", { mode: "number" }).notNull().default(0),
});

export const sqliteUser = sqliteTable("multiTenantUser", {
  id: text("id").primaryKey(),
  userName: text("userName").notNull(),
  userNameKey: text("userNameKey").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  failedAttempts: integer("failedAttempts").notNull().default(0),
  lockedUntil: integer("lockedUntil").notNull().default(0),
  settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>(),
  settingsRevision: integer("settingsRevision").notNull().default(0),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  authVersion: integer("authVersion").notNull().default(0),
  createdAt: integer("createdAt").notNull().default(0),
  lastLoginAt: integer("lastLoginAt").notNull().default(0),
});

export const mysqlUser = mysqlTable("multiTenantUser", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userName: varchar("userName", { length: 64 }).notNull(),
  userNameKey: varchar("userNameKey", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  failedAttempts: int("failedAttempts").notNull().default(0),
  lockedUntil: bigint("lockedUntil", { mode: "number" }).notNull().default(0),
  settings: json("settings").$type<Record<string, unknown>>(),
  settingsRevision: int("settingsRevision").notNull().default(0),
  disabled: boolean("disabled").notNull().default(false),
  authVersion: int("authVersion").notNull().default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull().default(0),
  lastLoginAt: bigint("lastLoginAt", { mode: "number" }).notNull().default(0),
});

export const sqliteWebSession = sqliteTable("multiTenantWebSession", {
  tokenHash: text("tokenHash").primaryKey(),
  userId: text("userId").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull(),
  expiresAt: integer("expiresAt").notNull(),
  authVersion: integer("authVersion").notNull().default(0),
});

export const mysqlWebSession = mysqlTable("multiTenantWebSession", {
  tokenHash: varchar("tokenHash", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  role: mysqlEnum("role", ["admin", "user"]).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  authVersion: int("authVersion").notNull().default(0),
});

export const sqliteSettings = sqliteTable("multiTenantSettings", {
  id: integer("id").primaryKey(),
  registrationEnabled: integer("registrationEnabled", { mode: "boolean" }).notNull().default(true),
});

export const mysqlSettings = mysqlTable("multiTenantSettings", {
  id: int("id").primaryKey(),
  registrationEnabled: boolean("registrationEnabled").notNull().default(true),
});

export const sqliteSourceMapping = sqliteTable("multiTenantSourceMapping", {
  id: integer("id").primaryKey(),
  mappings: text("mappings", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  revision: integer("revision").notNull(),
});

export const mysqlSourceMapping = mysqlTable("multiTenantSourceMapping", {
  id: int("id").primaryKey(),
  mappings: json("mappings").$type<Record<string, unknown>>().notNull(),
  revision: int("revision").notNull(),
});

export const sqliteModelRouting = sqliteTable("multiTenantModelRouting", {
  id: integer("id").primaryKey(),
  configuration: text("configuration", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  revision: integer("revision").notNull(),
});

export const mysqlModelRouting = mysqlTable("multiTenantModelRouting", {
  id: int("id").primaryKey(),
  configuration: json("configuration").$type<Record<string, unknown>>().notNull(),
  revision: int("revision").notNull(),
});

export const sqliteWallet = sqliteTable("multiTenantWallet", {
  userId: text("userId").notNull(),
  currency: text("currency", { enum: ["CNY", "USD"] }).notNull(),
  balanceMicros: integer("balanceMicros").notNull().default(0),
  reservedMicros: integer("reservedMicros").notNull().default(0),
}, table => [sqlitePrimaryKey({ columns: [table.userId, table.currency] })]);

export const mysqlWallet = mysqlTable("multiTenantWallet", {
  userId: varchar("userId", { length: 36 }).notNull(),
  currency: mysqlEnum("currency", ["CNY", "USD"]).notNull(),
  balanceMicros: bigint("balanceMicros", { mode: "number" }).notNull().default(0),
  reservedMicros: bigint("reservedMicros", { mode: "number" }).notNull().default(0),
}, table => [mysqlPrimaryKey({ columns: [table.userId, table.currency] })]);

export const sqliteBillingLedger = sqliteTable("multiTenantBillingLedger", {
  requestId: text("requestId").primaryKey(),
  userId: text("userId").notNull(),
  currency: text("currency", { enum: ["CNY", "USD"] }).notNull(),
  kind: text("kind", { enum: ["credit", "model"] }).notNull(),
  status: text("status", { enum: ["reserved", "settled", "released"] }).notNull(),
  requestHash: text("requestHash").notNull(),
  reservedMicros: integer("reservedMicros").notNull().default(0),
  amountMicros: integer("amountMicros").notNull().default(0),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  usage: text("usage", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
}, table => [sqliteIndex("multiTenantBillingLedgerUserCreatedAt").on(table.userId, table.createdAt)]);

export const mysqlBillingLedger = mysqlTable("multiTenantBillingLedger", {
  requestId: varchar("requestId", { length: 36 }).primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  currency: mysqlEnum("currency", ["CNY", "USD"]).notNull(),
  kind: mysqlEnum("kind", ["credit", "model"]).notNull(),
  status: mysqlEnum("status", ["reserved", "settled", "released"]).notNull(),
  requestHash: varchar("requestHash", { length: 64 }).notNull(),
  reservedMicros: bigint("reservedMicros", { mode: "number" }).notNull().default(0),
  amountMicros: bigint("amountMicros", { mode: "number" }).notNull().default(0),
  details: json("details").$type<Record<string, unknown>>().notNull(),
  usage: json("usage").$type<Record<string, unknown>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
}, table => [mysqlIndex("multiTenantBillingLedgerUserCreatedAt").on(table.userId, table.createdAt)]);

export type AdminRecord = typeof sqliteAdmin.$inferSelect;
export type AdminUpdate = Partial<Omit<AdminRecord, "id" | "userName" | "passwordHash">>;
export type UserRecord = typeof sqliteUser.$inferSelect;
export type UserUpdate = Pick<UserRecord, "failedAttempts" | "lockedUntil">;
export type WebSessionRecord = typeof sqliteWebSession.$inferSelect;
export type ManagedUser = Pick<UserRecord, "id" | "userName" | "disabled" | "createdAt" | "lastLoginAt">;
export type ListUserOptions = { search: string; page: number; pageSize: number; status: "all" | "enabled" | "disabled" };
export type SourceMappingRecord = { mappings: unknown; revision: number };
export type ModelRoutingRecord = { configuration: unknown; revision: number };
export type WalletRecord = typeof sqliteWallet.$inferSelect;
export type BillingRecord = typeof sqliteBillingLedger.$inferSelect;
export type AdminDatabase = {
  initialize(): Promise<void>;
  initializeSettings(): Promise<void>;
  getRegistrationEnabled(): Promise<boolean>;
  setRegistrationEnabled(enabled: boolean): Promise<void>;
  getSourceMapping(): Promise<SourceMappingRecord | undefined>;
  initializeSourceMapping(): Promise<void>;
  writeSourceMapping(mappings: Record<string, unknown>, expectedRevision: number): Promise<boolean>;
  getModelRouting(): Promise<ModelRoutingRecord | undefined>;
  initializeModelRouting(): Promise<void>;
  writeModelRouting(configuration: Record<string, unknown>, expectedRevision: number): Promise<boolean>;
  initializeBilling(): Promise<void>;
  getWallets(userId: string): Promise<WalletRecord[]>;
  getBillingRecord(requestId: string): Promise<BillingRecord | undefined>;
  listBillingRecords(userId: string, limit: number): Promise<BillingRecord[]>;
  creditWallet(record: Pick<BillingRecord, "requestId" | "userId" | "currency" | "amountMicros" | "requestHash" | "details" | "createdAt">): Promise<"created" | "duplicate">;
  reserveWallet(record: Pick<BillingRecord, "requestId" | "userId" | "currency" | "reservedMicros" | "requestHash" | "details" | "createdAt">): Promise<"created" | "duplicate" | "insufficient">;
  settleWallet(requestId: string, userId: string, amountMicros: number, usage: Record<string, unknown>, at: number): Promise<boolean>;
  releaseWallet(requestId: string, userId: string, at: number, usage?: Record<string, unknown>): Promise<boolean>;
  getAdmin(): Promise<AdminRecord | undefined>;
  createAdmin(userName: string, passwordHash: string): Promise<void>;
  updateAdmin(values: AdminUpdate): Promise<void>;
  getUser(userNameKey: string): Promise<UserRecord | undefined>;
  getUserById(id: string): Promise<UserRecord | undefined>;
  createUser(user: Pick<UserRecord, "id" | "userName" | "userNameKey" | "passwordHash" | "createdAt">): Promise<void>;
  updateUser(id: string, values: UserUpdate, expectedAuthVersion?: number): Promise<void>;
  completeUserLogin(id: string, expectedAuthVersion: number, at: number): Promise<boolean>;
  listUsers(options: ListUserOptions): Promise<{ items: ManagedUser[]; total: number }>;
  setUserDisabled(id: string, disabled: boolean): Promise<boolean>;
  resetUserPassword(id: string, passwordHash: string): Promise<boolean>;
  createWebSession(session: WebSessionRecord): Promise<void>;
  getWebSession(tokenHash: string): Promise<WebSessionRecord | undefined>;
  expireWebSession(tokenHash: string): Promise<void>;
  writeUserSettings(userId: string, settings: Record<string, unknown>, expectedRevision: number): Promise<boolean>;
};
