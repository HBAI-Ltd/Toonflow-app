import { Database } from "bun:sqlite";
import { chmodSync, mkdirSync } from "@toonflow/file";
import { join, resolve } from "node:path";

let database: Database | undefined;
let databaseDirectory: string | undefined;

export function getDatabase(): Database {
  if (!process.env.TOONFLOW_DATA_DIR) throw new Error("TOONFLOW_DATA_DIR 必须在加载账户数据前设置");
  const directory = resolve(process.env.TOONFLOW_DATA_DIR);
  if (database && databaseDirectory !== directory) throw new Error("运行中不能切换账户数据目录");
  if (database) return database;
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "accounts.sqlite");
  const db = new Database(path, { create: true, strict: true });
  chmodSync(path, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')), enabled INTEGER NOT NULL DEFAULT 1,
      mustChangePassword INTEGER NOT NULL DEFAULT 1, storageLimitBytes INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accountSessions (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id), familyId TEXT NOT NULL,
      accessHash TEXT NOT NULL UNIQUE, refreshHash TEXT NOT NULL UNIQUE,
      accessExpiresAt INTEGER NOT NULL, expiresAt INTEGER NOT NULL, usedAt INTEGER,
      revoked INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS accountSessionsFamily ON accountSessions(familyId);
    CREATE INDEX IF NOT EXISTS accountSessionsUser ON accountSessions(userId);
    CREATE TABLE IF NOT EXISTS accountMetadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS accountAudit (
      id INTEGER PRIMARY KEY, event TEXT NOT NULL, actorId TEXT, targetId TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accountThrottle (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, windowStart INTEGER NOT NULL
    );
  `);
  databaseDirectory = directory;
  database = db;
  return db;
}
