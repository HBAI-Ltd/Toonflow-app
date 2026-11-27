import { constants, copyFile, cp, lstat, mkdir, open, readdir, rename, rm, rmdir, unlink, realpath, writeAtomic } from "@toonflow/file";
import { createHmac, randomBytes } from "node:crypto";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type { Request } from "express";
import { resolveWorkspace } from "@/utils/workspace";
import { t, translateError, translateMessage } from "@/lib/i18n";

export async function writeWorkspaceFile(path: string, content: string | Uint8Array, exclusive = false) {
  await writeAtomic(path, content, { exclusive });
}

export async function copyWorkspaceFile(source: string, target: string) {
  const info = await lstat(source);
  if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) throw Object.assign(new Error("只能复制普通文件或文件夹"), { status: 403 });
  if (!info.isDirectory()) return copyFile(source, target, constants.COPYFILE_EXCL);
  if (isWithin(source, target)) throw Object.assign(new Error("不能把文件夹复制到自身或子目录"), { status: 400 });
  await mkdir(target);
  try {
    await cp(source, target, {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
      async filter(path) {
        const entry = await lstat(path);
        if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory()) || !isWithin(source, await realpath(path))) {
          throw new Error("不能复制包含符号链接或特殊文件的文件夹");
        }
        return true;
      },
    });
  } catch (cause) {
    // ACT: 失败保留已复制内容，不递归回滚删除可能被外部加入文件的目标目录。
    throw Object.assign(new Error(t`复制未完成，已复制的内容保留在 ${target}。${cause instanceof Error ? translateError(cause) : translateMessage("请检查文件权限后重试")}`, { cause }), { code: "ECOPYINCOMPLETE" });
  }
}

export async function renameWorkspaceFile(source: string, target: string) {
  const info = await lstat(source);
  if (source === target || (process.platform === "win32" && source.toLowerCase() === target.toLowerCase())) {
    if (source !== target) await rename(source, target);
    return;
  }
  if (info.isDirectory()) {
    const exists = await lstat(target).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
    if (exists) throw Object.assign(new Error("已存在同名文件或目录"), { code: "EEXIST" });
    await rename(source, target);
    return;
  }
  await copyFile(source, target, constants.COPYFILE_EXCL);
  // ACT: 目标完整写入后才移除源文件；移除失败只回滚本次目标。
  try { await unlink(source); }
  catch (err) {
    await unlink(target).catch(error => console.warn(`重命名回滚失败：${target}`, error));
    throw err;
  }
}

async function hasCanvasFile(path: string, excludedPath?: string): Promise<boolean> {
  if (excludedPath && isWithin(excludedPath, path)) return false;
  const info = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return null; throw error; });
  if (!info) return false;
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isDirectory() && ["assets", ".agent"].includes(entry.name.toLowerCase())) continue;
      if ((entry.isFile() || entry.isDirectory()) && await hasCanvasFile(resolve(path, entry.name), excludedPath)) return true;
    }
    return false;
  }
  if (!info.isFile() || !/\.json$/i.test(path)) return false;
  const file = await open(path, "r");
  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    const header = buffer.toString("utf8", 0, bytesRead);
    if (!/^\s*\{/.test(header)) return false;
    // ACT: 与前端一致，只快速识别根对象首字段；其他顺序完整解析，避免嵌套标记误判。
    if (/^\s*\{\s*"toonflowCanvas"\s*:\s*true\s*[,}]/.test(header)) return true;
    return JSON.parse((bytesRead < buffer.length ? header : await file.readFile("utf8")).trimStart())?.toonflowCanvas === true;
  } catch (error) {
    if (error instanceof SyntaxError) return false;
    throw error;
  } finally { await file.close(); }
}

const deletingCanvases = new Set<string>();
export async function removeWorkspaceFile(directory: string, path: string, recursive = false) {
  const info = await lstat(path);
  if (info.isDirectory() && !recursive) return rmdir(path);
  directory = await realpath(directory);
  const ignored = relative(directory, path).split(sep).some(part => ["assets", ".agent"].includes(part.toLowerCase()));
  if (ignored || !await hasCanvasFile(path)) return rm(path, { recursive });
  const key = process.platform === "win32" ? directory.toLowerCase() : directory;
  // ACT: 单进程内仅协调画布删除，避免锁根目录影响 Agent 会话及并行素材清理；多进程需共享此锁。
  if (deletingCanvases.has(key)) throw Object.assign(new Error("画布正在删除，请稍后重试"), { status: 409, code: "EBUSY" });
  deletingCanvases.add(key);
  try {
    if (!await hasCanvasFile(directory, path)) {
      throw Object.assign(new Error("项目里需要保留至少一个画布。你可以先新建一个，再删除这个画布。"), { status: 409, code: "ELASTCANVAS" });
    }
    await rm(path, { recursive });
  } finally { deletingCanvases.delete(key); }
}

export function isWithin(root: string, path: string) {
  const offset = relative(root, path);
  return offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset);
}

export async function resolveWorkspaceFile(req: Request, directory: string, path: string) {
  const root = await resolveWorkspace(req, directory);
  return resolveWorkspacePath(root, path);
}

export async function resolveWorkspacePath(root: string, path: string, allowMissingParents = false) {
  if (isAbsolute(path) || path.split(/[\\/]/).some(part => part === ".." || /[<>:"|?*\x00-\x1f]/.test(part)
    || (process.platform === "win32" && part !== "." && (/[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))))) {
    throw Object.assign(new Error("文件路径无效"), { status: 400 });
  }
  const target = resolve(root, path);
  const info = await lstat(target).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
  if (info?.isSymbolicLink()) throw Object.assign(new Error("不能通过符号链接操作文件"), { status: 403 });
  let parent = dirname(target);
  if (!info && allowMissingParents) {
    while (!(await lstat(parent).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; }))) parent = dirname(parent);
  }
  const actual = info ? await realpath(target) : resolve(await realpath(parent), relative(parent, target));
  if (!isWithin(root, actual)) throw Object.assign(new Error("只能操作当前工作区内的文件"), { status: 403 });
  return { directory: root, path: actual };
}

// ACT: 桌面和独立 Server 均为单进程；锁防止并发文件操作互相覆盖。
const busyFiles = new Set<string>();
export function lockWorkspaceFiles(paths: string[]) {
  const keys = paths.map(path => process.platform === "win32" ? resolve(path).toLowerCase() : resolve(path));
  if (keys.some(path => [...busyFiles].some(busy => isWithin(path, busy) || isWithin(busy, path)))) {
    throw Object.assign(new Error("文件正在使用，请等待操作完成"), { status: 409, code: "EBUSY" });
  }
  keys.forEach(path => busyFiles.add(path));
  return () => keys.forEach(path => busyFiles.delete(path));
}

// ACT: 媒体元素不能附带工作区请求头，用进程内随机密钥签名已授权的文件地址；无状态、随进程重启失效，多实例部署需改为共享密钥。
const fileLinkSecret = randomBytes(32);
export function signFileLink(directory: string, path: string) {
  return createHmac("sha256", fileLinkSecret).update(`${directory}\0${path}`).digest("base64url");
}

export function protectWorkspaceRoot(directory: string, path: string) {
  if (directory === path) throw Object.assign(new Error("不能修改工作区根目录"), { status: 400 });
}
