import { createHash, randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { constants, copyFile, createReadStream, link, lstat, mkdir, readdir, realpath, unlink } from "@toonflow/file";
import { currentUser, isMultiUser, requireUser, runWithUser } from "@/utils/accounts/context";
import { getDatabase } from "@/utils/accounts/database";
import { getUser } from "@/utils/accounts/service";
import { withStorageWrite } from "@/utils/hosting/storage";

const personalKeys = new Set(["ui", "general", "personalization", "stores", "helloCompleted", "privacy", "updateBoxSeenBuilds"]);
const systemKeys = new Set(["customProviders", "mediaProviderConfigs", "ffmpeg", "agentSystemPrompt", "nodeMenu"]);
export const secretMask = "••••••";
let initialized = false;

function database() {
  const db = getDatabase();
  if (!initialized) {
    db.exec(`CREATE TABLE IF NOT EXISTS userPreferences (userId TEXT PRIMARY KEY, settings TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS userProjects (id TEXT PRIMARY KEY, userId TEXT NOT NULL, name TEXT NOT NULL, directory TEXT NOT NULL UNIQUE, createdAt INTEGER NOT NULL, visible INTEGER NOT NULL DEFAULT 1);
      CREATE INDEX IF NOT EXISTS userProjectsOwner ON userProjects(userId);`);
    initialized = true;
  }
  return db;
}

export function tenantDirectory() {
  return resolve(process.env.TOONFLOW_DATA_DIR!, "users", requireUser().id);
}

export function scopedDataDirectory(fallback: string) {
  return isMultiUser() ? tenantDirectory() : fallback;
}

export function personalSettings() {
  const row = database().query<{ settings: string }, [string]>("SELECT settings FROM userPreferences WHERE userId = ?").get(requireUser().id);
  return row ? JSON.parse(row.settings) as Record<string, unknown> : {};
}

export function mergedSettings(system: Record<string, unknown>) {
  if (!isMultiUser() || !currentUser()) return system;
  // ACT: 系统凭据只供服务端调用，API 响应另行裁剪；个人默认值不能继承初始管理员的数据。
  return { ...Object.fromEntries(Object.entries(system).filter(([key]) => !personalKeys.has(key))), ...personalSettings(), helloCompleted: true };
}

export function savePersonalSettings(settings: Record<string, unknown>) {
  const personal = Object.fromEntries(Object.entries(settings).filter(([key]) => personalKeys.has(key)));
  if (Buffer.byteLength(JSON.stringify(personal)) > 1024 * 1024) throw Object.assign(new Error("个人设置不能超过 1 MB"), { status: 413 });
  database().query("INSERT INTO userPreferences(userId, settings) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET settings=excluded.settings")
    .run(requireUser().id, JSON.stringify(personal));
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    /^(?:.*api[_-]?key|.*secret|.*password|access[_-]?token|refresh[_-]?token|session[_-]?token|token|authorization|cookie)$/i.test(key)
      ? typeof item === "string" && item ? secretMask : "" : redact(item)]));
}

export function publicSettings(settings: Record<string, unknown>) {
  if (!isMultiUser()) return settings;
  const result = redact(settings) as Record<string, unknown>;
  if (requireUser().role !== "admin") {
    result.customProviders = Array.isArray(settings.customProviders) ? settings.customProviders.map(provider => {
      const { id, label, icon, version, protocol, models } = provider as Record<string, unknown>;
      return { id, label, icon, version, protocol, models, apiKey: "", apiUrl: "https://models.invalid" };
    }) : [];
    delete result.mediaProviderConfigs;
    delete result.mcp;
    delete result.agentSystemPrompt;
  }
  result.hosting = { enabled: true, role: requireUser().role };
  return result;
}

function restoreSecrets(value: unknown, previous: unknown): unknown {
  if (value === secretMask) {
    if (typeof previous !== "string" || !previous) throw Object.assign(new Error("新配置必须填写真实密钥"), { status: 400 });
    return previous;
  }
  if (Array.isArray(value)) return value.map(item => restoreSecrets(item,
    Array.isArray(previous) ? previous.find(old => old?.id === item?.id) : undefined));
  if (!value || typeof value !== "object") return value;
  const old = previous && typeof previous === "object" ? previous as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreSecrets(item, old[key])]));
}

export function settingsUpdate(settings: Record<string, unknown>, system: Record<string, unknown>) {
  const user = requireUser();
  const next = { ...system };
  if (user.role === "admin") {
    for (const key of systemKeys) if (Object.hasOwn(settings, key)) next[key] = restoreSecrets(settings[key], system[key]);
  } else {
    const allowed = publicSettings(mergedSettings(system));
    for (const [key, value] of Object.entries(settings)) {
      if (personalKeys.has(key) || key === "hosting") continue;
      if (JSON.stringify(value) !== JSON.stringify(allowed[key])) throw Object.assign(new Error("只有管理员可以修改系统和模型配置"), { status: 403 });
    }
  }
  savePersonalSettings(settings);
  return next;
}

export async function workspaceRoot() {
  const root = join(tenantDirectory(), "workspaces");
  await mkdir(root, { recursive: true });
  if ((await lstat(tenantDirectory())).isSymbolicLink() || (await lstat(root)).isSymbolicLink()) {
    throw Object.assign(new Error("用户目录不能使用符号链接"), { status: 403 });
  }
  return realpath(root);
}

export async function authorizeWorkspace(path: string) {
  const root = await workspaceRoot();
  const directory = await realpath(path);
  const offset = relative(root, directory);
  if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) throw Object.assign(new Error("不能访问其他用户的工作区"), { status: 403 });
  if (offset) {
    const projectDirectory = join(root, offset.split(sep)[0]!);
    const row = database().query<{ userId: string }, [string]>("SELECT userId FROM userProjects WHERE directory = ?").get(projectDirectory);
    if (row && row.userId !== requireUser().id) throw Object.assign(new Error("项目不属于当前用户"), { status: 403 });
    if (!row) database().query("INSERT INTO userProjects(id,userId,name,directory,createdAt) VALUES (?,?,?,?,?)")
      .run(randomUUID(), requireUser().id, basename(projectDirectory), projectDirectory, Date.now());
  }
  return directory;
}

export async function listProjects() {
  const root = await workspaceRoot();
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) await authorizeWorkspace(join(root, entry.name));
  }
  return database().query<{ id: string; name: string; directory: string }, [string]>("SELECT id,name,directory FROM userProjects WHERE userId=? AND visible=1 ORDER BY createdAt DESC").all(requireUser().id);
}

export async function createProject(name: string) {
  const id = randomUUID();
  const directory = join(await workspaceRoot(), id);
  await mkdir(directory);
  database().query("INSERT INTO userProjects(id,userId,name,directory,createdAt) VALUES (?,?,?,?,?)")
    .run(id, requireUser().id, name, directory, Date.now());
  return { id, name, directory };
}

export function updateProject(id: string, name?: string) {
  const result = name === undefined
    ? database().query("UPDATE userProjects SET visible=0 WHERE id=? AND userId=?").run(id, requireUser().id)
    : database().query("UPDATE userProjects SET name=?, visible=1 WHERE id=? AND userId=?").run(name, id, requireUser().id);
  if (!result.changes) throw Object.assign(new Error("项目不存在"), { status: 404 });
}

async function legacyDigest(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function copyLegacyPath(source: string, target: string) {
  const info = await lstat(source);
  if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) throw new Error("旧数据包含链接或特殊文件，迁移保持关闭");
  const existing = await lstat(target).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (existing?.isSymbolicLink()) throw new Error("迁移目标不能包含符号链接");
  if (info.isDirectory()) {
    if (existing && !existing.isDirectory()) throw new Error("迁移目录与已有文件冲突");
    await mkdir(target, { recursive: true });
    for (const name of await readdir(source)) await copyLegacyPath(join(source, name), join(target, name));
    return;
  }
  const digest = await legacyDigest(source);
  if (existing) {
    if (!existing.isFile() || existing.size !== info.size || await legacyDigest(target) !== digest) {
      throw new Error("已有迁移文件与原文件不一致，未覆盖用户数据，请从部署前备份核对恢复");
    }
    return;
  }
  await withStorageWrite(target, info.size, async () => {
    const temporary = join(dirname(target), `.migration${randomUUID()}`);
    try {
      await copyFile(source, temporary, constants.COPYFILE_EXCL);
      if ((await lstat(temporary)).size !== info.size || await legacyDigest(temporary) !== digest) throw new Error("旧文件复制校验失败，迁移未完成");
      // ACT: 在同一文件系统内独占建立最终名称，中断只会留下可核对的暂存文件。
      await link(temporary, target);
    } finally {
      await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; });
    }
  });
}

export async function migrateLegacyData(settings: Record<string, unknown>) {
  if (!isMultiUser()) return;
  const db = database();
  const metadata = db.query<{ value: string }, [string]>("SELECT value FROM accountMetadata WHERE key=?");
  const ownerId = metadata.get("legacyMigrationOwner")?.value;
  if (!ownerId || metadata.get("tenantMigrationComplete")) return;
  const owner = getUser(ownerId);
  if (!owner) throw new Error("初始管理员不存在，无法迁移旧数据");
  await runWithUser(owner, async () => {
    const directory = tenantDirectory();
    await mkdir(directory, { recursive: true });
    const source = resolve(process.env.TOONFLOW_DATA_DIR!);
    // ACT: 原子复制并逐文件核对；恢复时不能把截断目标当作已迁移成功。
    for (const name of ["workspaces", "assets", "memories", "AGENTS.md"]) {
      const path = join(source, name);
      if (!await lstat(path).catch(error => { if (error.code === "ENOENT") return null; throw error; })) continue;
      await copyLegacyPath(path, join(directory, name));
    }
    if (!db.query("SELECT userId FROM userPreferences WHERE userId=?").get(owner.id)) savePersonalSettings(settings);
    await listProjects();
    db.query("INSERT INTO accountMetadata(key,value) VALUES ('tenantMigrationComplete','1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
  });
}
