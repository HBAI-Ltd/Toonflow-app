import Database from "better-sqlite3";
import getPath from "@/utils/getPath";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/utils/db/schema";

const sqlite = new Database(getPath("data", "sqlite.db"));

// 开启 WAL 模式（推荐，提升并发性能）
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;

export * from "@/utils/db/schema";
