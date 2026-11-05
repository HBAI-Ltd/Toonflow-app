import { lstat, mkdir, readdir, rm, statfs } from "@toonflow/file";
import { AsyncLocalStorage } from "node:async_hooks";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { currentUser, isMultiUser, requireUser, type AccountUser } from "@/utils/accounts/context";
import { getUser } from "@/utils/accounts/service";

const defaultLimitBytes = 1024 ** 3;
const temporaryLimitBytes = 2 * 1024 ** 3;
const minimumFreeBytes = 3 * 1024 ** 3;
export const maximumUploadBytes = 100 * 1024 ** 2;
const reservations = new Map<symbol, { root: string; bytes: number; diskBytes: number; path: string }>();
let pending: Promise<void> = Promise.resolve();
const systemMaintenance = new AsyncLocalStorage<boolean>();

// ACT: 只由启动装配显式调用；请求账户不能把自己的执行切换到系统维护身份。
export function runSystemMaintenance<T>(operation: () => T): T {
  if (isMultiUser() && currentUser()) denied("账户请求不能进入系统维护上下文");
  return systemMaintenance.run(true, operation);
}

function denied(message: string, status = 403): never {
  throw Object.assign(new Error(message), { status });
}

function within(root: string, path: string) {
  const offset = relative(root, path);
  return offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset);
}

function dataRoot() {
  if (!process.env.TOONFLOW_DATA_DIR) denied("服务数据目录尚未配置", 503);
  return resolve(process.env.TOONFLOW_DATA_DIR);
}

export function userStorageRoot(user: AccountUser = requireUser()) {
  if (!/^[a-zA-Z0-9_-]+$/.test(user.id)) denied("账户目录无效");
  return join(dataRoot(), "users", user.id);
}

export function userTemporaryRoot(user: AccountUser = requireUser()) {
  userStorageRoot(user);
  return join(dataRoot(), "temporary", user.id);
}

async function pathInfo(path: string) {
  return lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
}

// ACT: 每次检查所有祖先，不仅检查 realpath 的最终位置，拒绝租户目录内外的链接跳转。
async function safePath(path: string) {
  const base = dataRoot();
  const target = resolve(path);
  if (!within(base, target)) denied("文件不在服务数据目录内");
  let parent = target;
  while (true) {
    const info = await pathInfo(parent);
    if (info?.isSymbolicLink()) denied("不能通过符号链接操作存储");
    if (info && !info.isFile() && !info.isDirectory()) denied("存储中不能包含特殊文件");
    if (!relative(base, parent)) break;
    parent = dirname(parent);
  }
  return target;
}

async function treeBytes(path: string): Promise<number> {
  const info = await pathInfo(path);
  if (!info) return 0;
  if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) denied("存储中不能包含符号链接或特殊文件");
  if (info.isFile()) return info.size;
  let bytes = 0;
  for (const entry of await readdir(path)) bytes += await treeBytes(join(path, entry));
  return bytes;
}

async function locked<T>(operation: () => Promise<T>) {
  const previous = pending;
  const next = Promise.withResolvers<void>();
  pending = next.promise;
  await previous;
  try { return await operation(); }
  finally { next.resolve(); }
}

export async function assertStorageDirectory(path: string) {
  if (!isMultiUser()) return;
  const target = await safePath(path);
  if (!within(userStorageRoot(), target) && !within(userTemporaryRoot(), target)) denied("只能访问自己的存储目录");
}

export async function storageUsage(user?: AccountUser) {
  if (!isMultiUser()) return { usedBytes: 0, limitBytes: 0 };
  const owner = user ?? requireUser();
  if (owner.id !== requireUser().id && requireUser().role !== "admin") denied("不能读取其他账户的存储");
  const root = await safePath(userStorageRoot(owner));
  return { usedBytes: await treeBytes(root), limitBytes: owner.storageLimitBytes ?? defaultLimitBytes };
}

// ACT: 单进程扫描与预留在同一临界区内；I/O 在锁外执行，预留一直保留到成功或失败收尾。
// 未知大小的流式输出须先预留其硬上限，不能在完成后才检查额度。
export async function withStorageWrite<T>(path: string, newBytes: number, operation: () => Promise<T>): Promise<T> {
  if (!isMultiUser()) return operation();
  if (!Number.isSafeInteger(newBytes) || newBytes < 0) denied("写入大小无效", 400);
  const maintenance = systemMaintenance.getStore() === true && !currentUser();
  const user = maintenance ? undefined : getUser(requireUser().id);
  if (!maintenance && !user?.enabled) denied("账户已停用");
  const reservation = Symbol();
  await locked(async () => {
    const systemRoot = maintenance || user?.role === "admin" ? ["providers", "tools", "nodes", "ext", "agents", "skills"]
      .map(name => join(dataRoot(), name)).find(root => within(root, resolve(path))) : undefined;
    if (maintenance && !systemRoot) denied("系统维护只能写入共享插件目录");
    if (systemRoot) await safePath(path);
    else await assertStorageDirectory(path);
    const temporaryRoot = join(dataRoot(), "temporary");
    const temporary = !systemRoot && within(userTemporaryRoot(user), resolve(path));
    const root = systemRoot ?? (temporary ? temporaryRoot : userStorageRoot(user));
    await safePath(root);
    const oldBytes = await treeBytes(path);
    const bytes = Math.max(0, newBytes - oldBytes);
    const reserved = [...reservations.values()];
    const target = resolve(path);
    if (reserved.some(item => within(item.path, target) || within(target, item.path))) denied("文件正在写入，请稍后重试", 409);
    const used = systemRoot ? 0 : await treeBytes(root);
    const limit = temporary ? temporaryLimitBytes : user?.storageLimitBytes ?? defaultLimitBytes;
    const projected = used + reserved.filter(item => item.root === root).reduce((sum, item) => sum + item.bytes, 0) + bytes;
    if (!systemRoot && projected > limit) {
      denied(temporary ? "临时存储空间已满，请稍后重试" : "账户存储配额不足", 507);
    }
    const disk = await statfs(dataRoot(), { bigint: true });
    const diskReserved = reserved.reduce((sum, item) => sum + item.diskBytes, 0);
    if (disk.bavail * disk.bsize < BigInt(minimumFreeBytes + diskReserved + newBytes)) denied("服务器可用磁盘空间不足", 507);
    if (user) {
      const latest = getUser(user.id);
      if (!latest?.enabled) denied("账户已停用");
      if (!temporary && !systemRoot && projected > latest.storageLimitBytes) denied("账户存储配额不足", 507);
    }
    reservations.set(reservation, { root, bytes, diskBytes: newBytes, path: target });
  });
  try { return await operation(); }
  finally { reservations.delete(reservation); }
}

export async function withStorageCopy<T>(source: string, target: string, operation: () => Promise<T>) {
  if (!isMultiUser()) return operation();
  await assertStorageDirectory(source);
  await assertStorageDirectory(target);
  const reservation = Symbol();
  const bytes = await locked(async () => {
    const original = resolve(source);
    if ([...reservations.values()].some(item => within(item.path, original) || within(original, item.path))) denied("源文件正在写入，请稍后重试", 409);
    if ((await pathInfo(source))?.isDirectory() && await pathInfo(target)) denied("目标目录已存在", 409);
    const size = await treeBytes(source);
    reservations.set(reservation, { root: userStorageRoot(), bytes: 0, diskBytes: 0, path: original });
    return size;
  });
  try { return await withStorageWrite(target, bytes, operation); }
  finally { reservations.delete(reservation); }
}

export async function createTemporaryDirectory() {
  const root = userTemporaryRoot();
  await assertStorageDirectory(root);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const directory = join(root, crypto.randomUUID());
  await mkdir(directory, { mode: 0o700 });
  return directory;
}

export async function removeTemporaryDirectory(directory: string) {
  const root = userTemporaryRoot();
  await assertStorageDirectory(directory);
  const name = relative(root, directory);
  if (!/^[a-f0-9-]{36}$/.test(name)) denied("只能清理账户临时任务目录");
  const reservation = Symbol();
  await locked(async () => {
    if ([...reservations.values()].some(item => within(directory, item.path) || within(item.path, directory))) denied("临时目录仍在使用", 409);
    await treeBytes(directory);
    reservations.set(reservation, { root: join(dataRoot(), "temporary"), bytes: 0, diskBytes: 0, path: resolve(directory) });
  });
  try { await rm(directory, { recursive: true, force: true }); }
  finally { reservations.delete(reservation); }
}

export async function cleanupTemporaryDirectories(retained: ReadonlySet<string>, olderThan = Date.now() - 24 * 60 * 60 * 1000) {
  if (!isMultiUser()) return;
  const root = userTemporaryRoot();
  await assertStorageDirectory(root);
  if (!await pathInfo(root)) return;
  for (const name of await readdir(root)) {
    if (!/^[a-f0-9-]{36}$/.test(name) || retained.has(name)) continue;
    const directory = join(root, name);
    const info = await pathInfo(directory);
    if (info?.isSymbolicLink()) denied("临时存储包含符号链接");
    if (!info?.isDirectory() || info.mtimeMs >= olderThan) continue;
    if ([...reservations.values()].some(item => within(directory, item.path))) continue;
    await removeTemporaryDirectory(directory).catch(error => { if (error.status !== 409) throw error; });
  }
}

export async function withTemporaryDirectory<T>(operation: (directory: string) => Promise<T>): Promise<T> {
  const directory = await createTemporaryDirectory();
  try { return await operation(directory); }
  finally { await removeTemporaryDirectory(directory); }
}
