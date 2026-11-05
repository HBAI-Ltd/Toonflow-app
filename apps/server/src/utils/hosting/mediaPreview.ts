import { basename, join, relative } from "node:path";
import { lstat, mkdir, writeAtomic } from "@toonflow/file";
import type { Response } from "express";
import { getDatabase } from "@/utils/accounts/database";
import { requireUser, runWithUser, isMultiUser } from "@/utils/accounts/context";
import { getUser } from "@/utils/accounts/service";
import { authorizeWorkspace } from "@/utils/hosting/tenant";
import { createTemporaryDirectory, cleanupTemporaryDirectories, removeTemporaryDirectory, assertStorageDirectory, withStorageWrite } from "@/utils/hosting/storage";
import { downloadPublicFile, remoteAddress } from "@/utils/workspace/download";
import { resolveWorkspacePath, writeWorkspaceFile, copyWorkspaceFile, lockWorkspaceFiles } from "@/utils/workspace/files";
import { sendFile } from "@/utils/fileHttp";

type Preview = {
  id: string; userId: string; directory: string; path: string; mimeType: string; mediaType: string;
  remoteUrl: string | null; temporaryPath: string | null; savedPath: string | null; createdAt: number; touchedAt: number;
};
let initialized = false;
const active = new Set<string>();
const pending = new Map<string, Promise<string>>();
const transfers = new Set<string>();

function database() {
  const db = getDatabase();
  if (!initialized) {
    db.exec(`CREATE TABLE IF NOT EXISTS userMedia (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL, directory TEXT NOT NULL, path TEXT NOT NULL,
      mimeType TEXT NOT NULL, mediaType TEXT NOT NULL, remoteUrl TEXT, temporaryPath TEXT, savedPath TEXT,
      createdAt INTEGER NOT NULL, touchedAt INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS userMediaOwner ON userMedia(userId, createdAt);`);
    initialized = true;
  }
  return db;
}

function ownedPreview(id: string, directory?: string) {
  const row = database().query<Preview, [string, string]>("SELECT * FROM userMedia WHERE id=? AND userId=?").get(id, requireUser().id);
  if (!row || (directory && row.directory !== directory) || (!row.savedPath && row.touchedAt < Date.now() - 24 * 3600000)) {
    throw Object.assign(new Error("临时生成结果不存在或已过期"), { status: 404 });
  }
  database().query("UPDATE userMedia SET touchedAt=? WHERE id=?").run(Date.now(), id);
  return row;
}

export function isPreviewPath(path: string) {
  return /^\.previews\/[a-f0-9-]{36}\.[a-z0-9]{1,8}$/.test(path);
}

export async function createMediaPreview(directory: string, mediaType: "image" | "video" | "audio", mimeType: string,
  extension: string, content: { url: string } | { bytes: Uint8Array }) {
  await authorizeWorkspace(directory);
  const id = crypto.randomUUID();
  const path = `.previews/${id}.${extension}`;
  let temporaryPath: string | null = null;
  if ("url" in content) remoteAddress(content.url);
  else {
    const temporary = await createTemporaryDirectory();
    temporaryPath = join(temporary, `${id}.${extension}`);
    try { await writeWorkspaceFile(temporaryPath, content.bytes, true); }
    catch (error) { await removeTemporaryDirectory(temporary); throw error; }
  }
  const now = Date.now();
  database().query("INSERT INTO userMedia(id,userId,directory,path,mimeType,mediaType,remoteUrl,temporaryPath,createdAt,touchedAt) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(id, requireUser().id, directory, path, mimeType, mediaType, "url" in content ? content.url : null, temporaryPath, now, now);
  return { path, mimeType, mediaType };
}

export function listMediaPreviews() {
  return database().query<Pick<Preview, "id" | "directory" | "path" | "mimeType" | "mediaType" | "createdAt" | "savedPath">, [string, number]>(
    "SELECT id,directory,path,mimeType,mediaType,createdAt,savedPath FROM userMedia WHERE userId=? AND (savedPath IS NOT NULL OR touchedAt>=?) ORDER BY createdAt DESC LIMIT 100")
    .all(requireUser().id, Date.now() - 24 * 3600000);
}

export async function materializePreview(directory: string, path: string): Promise<string> {
  const id = basename(path).split(".")[0]!;
  const row = ownedPreview(id, directory);
  if (row.path !== path) throw Object.assign(new Error("生成结果路径无效"), { status: 404 });
  if (row.savedPath) return (await resolveWorkspacePath(directory, row.savedPath)).path;
  if (row.temporaryPath) {
    await assertStorageDirectory(row.temporaryPath);
    return row.temporaryPath;
  }
  const existing = pending.get(id);
  if (existing) return existing;
  const operation = (async () => {
    if (!row.remoteUrl) throw Object.assign(new Error("生成结果不可用"), { status: 404 });
    const user = requireUser();
    if (transfers.has(user.id) || transfers.size >= 2) throw Object.assign(new Error("媒体正在下载，请稍后重试"), { status: 429 });
    transfers.add(user.id);
    let temporary: string | undefined;
    try {
      temporary = await createTemporaryDirectory();
      const target = join(temporary, basename(path));
      await withStorageWrite(target, 100 * 1024 ** 2, async () => {
        const bytes = await downloadPublicFile(row.remoteUrl!, { signal: AbortSignal.timeout(120000), maxBytes: 100 * 1024 ** 2, label: "生成结果" });
        if (!getUser(user.id)?.enabled) throw Object.assign(new Error("账户已停用"), { status: 403 });
        await writeAtomic(target, bytes, { exclusive: true });
      });
      database().query("UPDATE userMedia SET temporaryPath=?,touchedAt=? WHERE id=? AND userId=?").run(target, Date.now(), id, requireUser().id);
      return target;
    } catch (error) { if (temporary) await removeTemporaryDirectory(temporary); throw error; }
    finally { transfers.delete(user.id); }
  })();
  pending.set(id, operation);
  try { return await operation; }
  finally { pending.delete(id); }
}

export async function sendMediaPreview(res: Response, directory: string, path: string) {
  const id = basename(path).split(".")[0]!;
  const row = ownedPreview(id, directory);
  if (row.path !== path) throw Object.assign(new Error("生成结果路径无效"), { status: 404 });
  active.add(id);
  try {
    res.set({ "Cache-Control": "no-store", "Content-Type": row.mimeType });
    // ACT: 代理预览必须隐藏供应商地址及鉴权；首次按需缓存到临时配额，后续Range复用文件流。
    await sendFile(res, await materializePreview(directory, path), { dotfiles: "allow" });
  } finally { active.delete(id); }
}

export async function saveMediaPreview(id: string) {
  const row = ownedPreview(id);
  await authorizeWorkspace(row.directory);
  if (row.savedPath) return { path: row.savedPath };
  const source = await materializePreview(row.directory, row.path);
  if (!(await lstat(source)).isFile()) throw Object.assign(new Error("生成结果必须是普通文件"), { status: 400 });
  const file = `assets/generated/${basename(row.path)}`;
  const target = await resolveWorkspacePath(row.directory, file, true);
  await mkdir(join(row.directory, "assets", "generated"), { recursive: true });
  const release = lockWorkspaceFiles([target.path]);
  try {
    await copyWorkspaceFile(source, target.path);
    database().query("UPDATE userMedia SET savedPath=? WHERE id=? AND userId=?").run(file, id, requireUser().id);
  } finally { release(); }
  return { path: file };
}

export async function cleanupMediaPreviews() {
  if (!isMultiUser()) return;
  const ids = getDatabase().query<{ id: string }, []>("SELECT id FROM accounts").all();
  for (const { id } of ids) {
    const user = getUser(id);
    if (!user) continue;
    await runWithUser(user, async () => {
    const db = database();
    const rows = db.query<Preview, [string]>("SELECT * FROM userMedia WHERE userId=?").all(user.id);
    const retained = new Set<string>();
    for (const row of rows) {
      const inUse = active.has(row.id) || pending.has(row.id);
      if (!inUse && !row.savedPath && row.touchedAt < Date.now() - 24 * 3600000) db.query("DELETE FROM userMedia WHERE id=? AND userId=?").run(row.id, user.id);
      else if (row.temporaryPath && !row.savedPath) retained.add(relative(join(process.env.TOONFLOW_DATA_DIR!, "temporary", user.id), row.temporaryPath).split(/[\\/]/)[0]!);
    }
    await cleanupTemporaryDirectories(retained);
    });
  }
}
