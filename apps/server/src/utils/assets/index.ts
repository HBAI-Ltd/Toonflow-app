import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, opendir, readFile, realpath, rmdir, unlink } from "@toonflow/file";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import conf from "@/utils/conf";
import { isWithin, lockWorkspaceFiles, protectWorkspaceRoot, renameWorkspaceFile, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";
import { mentionAssetType, type MentionAsset, type MentionQuery } from "@/agent/mentionSources";

const maxAssetBytes = 100 * 1024 * 1024;
type AssetSearch = { key: string; directory: string; offset: number; touched: number; busy: boolean; iterator: AsyncGenerator<MentionAsset>;
  timer: ReturnType<typeof setTimeout>; closing?: Promise<void> };
const assetSearches = new Map<string, AssetSearch>();

export async function getAssetsDirectory() {
  const directory = join(dirname(conf.path), "assets");
  try { return await realpath(directory); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(directory, { recursive: true });
    return realpath(directory);
  }
}

async function resolveAssetPath(path: string) {
  const root = await getAssetsDirectory();
  const resolved = await resolveWorkspacePath(root, path);
  protectWorkspaceRoot(resolved.directory, resolved.path);
  return resolved;
}

async function readAssetContents(path: string, signal?: AbortSignal) {
  const info = await lstat(path);
  if (!info.isFile()) throw new Error("只能读取普通素材文件");
  if (info.size > maxAssetBytes) throw new Error("素材文件不能超过 100 MB");
  const content = await readFile(path, { signal });
  if (content.byteLength > maxAssetBytes) throw new Error("素材文件不能超过 100 MB");
  return content;
}

export async function readAssetFile(path: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const resolved = await resolveAssetPath(path);
  const release = lockWorkspaceFiles([resolved.path]);
  try {
    const content = await readAssetContents(resolved.path, signal);
    return { path: relative(resolved.directory, resolved.path).split(sep).join("/"), content,
      revision: createHash("sha256").update(content).digest("hex") };
  } finally { release(); }
}

export async function writeAssetFile(path: string, content: string | Uint8Array, revision?: string) {
  if (Buffer.byteLength(content) > maxAssetBytes) throw new Error("素材文件不能超过 100 MB");
  const target = await resolveAssetPath(path);
  const release = lockWorkspaceFiles([target.path]);
  try {
    if (revision !== undefined) {
      const current = createHash("sha256").update(await readAssetContents(target.path)).digest("hex");
      if (current !== revision) throw Object.assign(new Error("素材已被修改，请重新读取后再更新"), { status: 409, code: "ESTALE" });
    }
    await writeWorkspaceFile(target.path, content, revision === undefined);
    return { path: relative(target.directory, target.path).split(sep).join("/"), revision: createHash("sha256").update(content).digest("hex") };
  } finally { release(); }
}

export async function createAssetDirectory(path: string) {
  const target = await resolveAssetPath(path);
  const release = lockWorkspaceFiles([target.path]);
  try { await mkdir(target.path); }
  finally { release(); }
}

export async function moveAsset(path: string, target: string) {
  const source = await resolveAssetPath(path);
  const destination = await resolveAssetPath(target);
  destination.path = resolve(dirname(destination.path), basename(resolve(destination.directory, target)));
  const release = lockWorkspaceFiles([source.path, destination.path]);
  try {
    if ((await lstat(source.path)).isDirectory()) {
      if (relative(source.path, destination.path) !== "" && isWithin(source.path, destination.path)) {
        throw new Error("不能把素材文件夹移动到自身的子目录");
      }
      await closeAssetSearches(source.path);
      await closeAssetSearches(destination.path);
    }
    await renameWorkspaceFile(source.path, destination.path);
  } finally { release(); }
}

export async function removeAsset(path: string) {
  const target = await resolveAssetPath(path);
  const release = lockWorkspaceFiles([target.path]);
  try {
    const info = await lstat(target.path);
    if (info.isDirectory()) {
      await closeAssetSearches(target.path);
      await rmdir(target.path);
    }
    else if (info.isFile()) await unlink(target.path);
    else throw new Error("只能删除普通素材文件或空文件夹");
  } finally { release(); }
}

export async function importAssetFile(cwd: string, path: string, target?: string, signal?: AbortSignal) {
  const source = await readAssetFile(path, signal);
  const directory = await realpath(cwd);
  const workspacePath = target ?? `assets/imported/${randomUUID()}${extname(source.path)}`;
  const destination = await resolveWorkspacePath(directory, workspacePath, target === undefined);
  protectWorkspaceRoot(directory, destination.path);
  const release = lockWorkspaceFiles([destination.path]);
  try {
    signal?.throwIfAborted();
    if (target === undefined) await mkdir(dirname(destination.path), { recursive: true });
    const checked = await resolveWorkspacePath(directory, workspacePath);
    signal?.throwIfAborted();
    await writeWorkspaceFile(checked.path, source.content, true);
    return { path: source.path, workspacePath: relative(directory, checked.path).split(sep).join("/"), revision: source.revision };
  } finally { release(); }
}

function closeAssetSearch(id: string, search: AssetSearch) {
  if (assetSearches.get(id) === search) assetSearches.delete(id);
  clearTimeout(search.timer);
  return search.closing ??= search.iterator.return(undefined).then(() => {});
}

async function closeAssetSearches(path: string) {
  await Promise.all([...assetSearches].filter(([, search]) => isWithin(path, search.directory) || isWithin(search.directory, path))
    .map(([id, search]) => closeAssetSearch(id, search)));
}

async function* walkAssets(directory: string, path: string, recursive: boolean, depth = 0): AsyncGenerator<MentionAsset> {
  if (depth > 64) return;
  const resolved = await resolveWorkspacePath(directory, path);
  const entries = await opendir(resolved.path);
  for await (const entry of entries) {
    if (!entry.isFile() && !entry.isDirectory()) continue;
    const relativePath = path && path !== "." ? `${path}/${entry.name}` : entry.name;
    yield { name: entry.name, path: relativePath, type: entry.isDirectory() ? "directory" : "file",
      ...(entry.isFile() ? { dataType: mentionAssetType(entry.name)?.dataType } : {}) };
    if (recursive && entry.isDirectory()) yield* walkAssets(directory, relativePath, true, depth + 1);
  }
}

export async function queryAssets(options: MentionQuery & { path?: string }) {
  options.signal?.throwIfAborted();
  const directory = await getAssetsDirectory();
  const path = options.path || ".";
  const resolved = await resolveWorkspacePath(directory, path);
  // ACT: 每页扫描期间复用业务锁，目录变更时拒绝新游标；分页间释放锁并保留至多四个短期迭代器。
  const release = lockWorkspaceFiles([resolved.path]);
  try {
    const query = options.query?.trim().toLocaleLowerCase() ?? "";
    const key = JSON.stringify([directory, path, query]);
    for (const [id, search] of assetSearches) if (Date.now() - search.touched > 60000) await closeAssetSearch(id, search);
    let id: string;
    if (options.cursor) {
      const cursor = options.cursor.split(":");
      id = cursor[0]!;
      const search = assetSearches.get(id);
      if (!search || search.key !== key || String(search.offset) !== cursor[1]) throw Object.assign(new Error("分页已失效，请重新搜索"), { status: 409 });
    } else {
      id = randomUUID();
      const iterator = walkAssets(directory, path, !!query);
      const timer = setTimeout(() => {
        const search = assetSearches.get(id);
        if (search) void closeAssetSearch(id, search).catch(error => console.warn("素材分页游标关闭失败", error));
      }, 60000);
      timer.unref();
      assetSearches.set(id, { key, directory: resolved.path, offset: 0, touched: Date.now(), busy: false, iterator, timer });
      while (assetSearches.size > 4) {
        const oldest = assetSearches.keys().next().value!;
        await closeAssetSearch(oldest, assetSearches.get(oldest)!);
      }
    }
    const search = assetSearches.get(id);
    if (!search) throw Object.assign(new Error("分页已失效，请重新搜索"), { status: 409 });
    if (search.busy) throw Object.assign(new Error("上一页仍在读取，请稍后重试"), { status: 409 });
    search.busy = true;
    const items: MentionAsset[] = [];
    const limit = Math.max(1, Math.min(50, options.limit ?? 20));
    let done = false;
    try {
      for (let scanned = 0; scanned < 2000 && items.length < limit; scanned++) {
        options.signal?.throwIfAborted();
        const next = await search.iterator.next();
        if (assetSearches.get(id) !== search) throw Object.assign(new Error("分页已失效，请重新搜索"), { status: 409 });
        if (next.done) { done = true; break; }
        search.offset++;
        const item = next.value;
        if (!query || (item.type === "file" && `${item.name} ${item.path}`.toLocaleLowerCase().includes(query))) items.push(item);
      }
      search.touched = Date.now();
      search.timer.refresh();
      if (done) await closeAssetSearch(id, search);
      return { items, ...(!done ? { nextCursor: `${id}:${search.offset}` } : {}) };
    } catch (error) {
      try { await closeAssetSearch(id, search); }
      catch (closeError) { throw new AggregateError([error, closeError], "素材查询及游标关闭失败"); }
      throw error;
    } finally { search.busy = false; }
  } finally { release(); }
}
