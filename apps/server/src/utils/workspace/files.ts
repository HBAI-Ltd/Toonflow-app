import { constants } from "node:fs";
import { copyFile, link, lstat, rename, unlink, writeFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type { Request } from "express";
import { resolveWorkspace } from "@/utils/workspace";

export async function writeWorkspaceFile(path: string, content: string | Uint8Array, exclusive = false) {
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
    if (exclusive) await link(temporary, path);
    else await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((err: NodeJS.ErrnoException) => { if (err.code !== "ENOENT") throw err; });
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
  catch (err) { await unlink(target); throw err; }
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

export function protectWorkspaceRoot(directory: string, path: string) {
  if (directory === path) throw Object.assign(new Error("不能修改工作区根目录"), { status: 400 });
}
