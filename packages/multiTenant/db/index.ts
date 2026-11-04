import { dirname, isAbsolute, relative, resolve } from "node:path";
import { lstat, mkdir, open, readFile, realpath, writeAtomic } from "@toonflow/file";
import { z } from "zod";
import type { AdminDatabase } from "./schema";

export type { AdminDatabase, AdminRecord, AdminUpdate, UserRecord, UserUpdate, WebSessionRecord, ManagedUser, ListUserOptions, SourceMappingRecord, ModelRoutingRecord, WalletRecord, BillingRecord } from "./schema";

export const dataSourceSchema = z.discriminatedUnion("provider", [
  z.strictObject({ provider: z.literal("sqlite"), sqlite: z.strictObject({ file: z.string().min(1).max(255).regex(/^[^\\/:*?"<>|\u0000-\u001f]+$/) }) }),
  z.strictObject({ provider: z.literal("mysql"), mysql: z.strictObject({
    host: z.string().min(1).max(255), port: z.number().int().min(1).max(65535).default(3306),
    database: z.string().min(1).max(255), user: z.string().min(1).max(255), password: z.string().max(4096),
    ssl: z.strictObject({ ca: z.string().min(1).max(65536).optional() }).optional(),
  }) }),
]);
export type DataSource = z.infer<typeof dataSourceSchema>;

export async function openDatabase(dataDirectory: string, create = false): Promise<AdminDatabase | undefined> {
  const directory = resolve(dataDirectory, "multiTenant");
  const configPath = resolve(directory, "dataSource.json");
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  const directoryInfo = await lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!directoryInfo) return;
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) throw new Error("多租户数据目录必须是普通目录");
  if (create) {
    try {
      await writeAtomic(configPath, JSON.stringify({ provider: "sqlite", sqlite: { file: "multiTenant.sqlite" } }, null, 2), { exclusive: true, mode: 0o600 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  const info = await lstat(configPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!info) return;
  if (!info.isFile() || info.isSymbolicLink() || info.size > 65536) throw new Error("多租户数据源配置文件无效");
  let config: DataSource;
  try { config = dataSourceSchema.parse(JSON.parse(await readFile(configPath, "utf8"))); }
  catch { throw new Error("多租户数据源配置无效，请检查配置文件"); }
  if (config.provider === "mysql") {
    const { connectMysql } = await import("./mysql");
    return connectMysql(config.mysql);
  }
  const file = resolve(directory, config.sqlite.file);
  const path = relative(directory, file);
  if (!path || isAbsolute(config.sqlite.file) || path === ".." || path.startsWith("../") || path.startsWith("..\\") || isAbsolute(path)) {
    throw new Error("SQLite 数据库必须位于多租户数据目录内");
  }
  if (await realpath(dirname(file)) !== await realpath(directory)) throw new Error("SQLite 数据库必须位于多租户数据目录内");
  if (create) {
    try { await (await open(file, "wx", 0o600)).close(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  }
  const fileInfo = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!fileInfo) return;
  if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) throw new Error("SQLite 数据库必须是普通文件");
  const { connectSqlite } = await import("./sqlite");
  return connectSqlite(file);
}
