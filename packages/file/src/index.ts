import * as native from "node:fs";
import * as promises from "node:fs/promises";
import stubborn from "stubborn-fs";
import { dirname, join } from "node:path";
import { acquireFileAccess, withFileAccess, withSyncFileAccess } from "./access.ts";

export { withFileAccess } from "./access.ts";
export { constants } from "node:fs";
export type { Dirent, Stats, PathLike, Dir, ReadStream, WriteStream } from "node:fs";
export type { FileHandle } from "node:fs/promises";

const retryOptions = { timeout: 5000, interval: 100 };

// 元数据查询不持有长期句柄；保留标准 API 的重载和错误语义。
export const access = promises.access;
export const stat = promises.stat;
export const lstat = promises.lstat;
export const realpath = promises.realpath;
export const chmod = promises.chmod;
export const mkdtemp = promises.mkdtemp;
export const existsSync = native.existsSync;
export const statSync = native.statSync;
export const lstatSync = native.lstatSync;
export const realpathSync = native.realpathSync;
export const accessSync = native.accessSync;
export const chmodSync = native.chmodSync;
export const mkdtempSync = native.mkdtempSync;

export const readFile: typeof promises.readFile = ((path: native.PathLike | promises.FileHandle, options: any) =>
  typeof path === "object" && "fd" in path ? promises.readFile(path, options)
    : withFileAccess([path as native.PathLike], openKind(options?.flag ?? "r"), () => promises.readFile(path, options), options?.signal)) as typeof promises.readFile;
export const readdir: typeof promises.readdir = ((path: native.PathLike, options: any) =>
  withFileAccess([path], "read", () => promises.readdir(path, options))) as typeof promises.readdir;
export const writeFile: typeof promises.writeFile = ((path: native.PathLike | promises.FileHandle, data: any, options: any) =>
  typeof path === "object" && "fd" in path ? promises.writeFile(path, data, options)
    : withFileAccess([path as native.PathLike], "write", () => promises.writeFile(path, data, options), options?.signal)) as typeof promises.writeFile;
export const appendFile: typeof promises.appendFile = ((path: native.PathLike | promises.FileHandle, data: any, options: any) =>
  typeof path === "object" && "fd" in path ? promises.appendFile(path, data, options)
    : withFileAccess([path as native.PathLike], "write", () => promises.appendFile(path, data, options), options?.signal)) as typeof promises.appendFile;
export const rename: typeof promises.rename = (source, target) =>
  withFileAccess([source, target], "write", () => stubborn.retry.rename(retryOptions)(source, target));
export const unlink: typeof promises.unlink = path => withFileAccess([path], "write", () => promises.unlink(path));
export const link: typeof promises.link = (source, target) => withFileAccess([source, target], "write", () => promises.link(source, target));
export const copyFile: typeof promises.copyFile = (source, target, mode) =>
  withFileAccess([source, target], "write", () => promises.copyFile(source, target, mode));
export const cp: typeof promises.cp = (source, target, options) =>
  withFileAccess([source, target], "write", () => promises.cp(source, target, options));
export const mkdir: typeof promises.mkdir = ((path: native.PathLike, options: any) =>
  withFileAccess([path], "write", () => promises.mkdir(path, options))) as typeof promises.mkdir;
export const rm: typeof promises.rm = (path, options) => withFileAccess([path], "write", () =>
  promises.rm(path, { maxRetries: 5, retryDelay: 100, ...options }));
export const rmdir: typeof promises.rmdir = path => withFileAccess([path], "write", () => promises.rmdir(path));

function openKind(flags: string | number): "read" | "write" {
  return typeof flags === "string" ? /[wa+]/.test(flags) ? "write" : "read"
    : flags & (native.constants.O_WRONLY | native.constants.O_RDWR | native.constants.O_CREAT | native.constants.O_TRUNC | native.constants.O_APPEND) ? "write" : "read";
}

export const open: typeof promises.open = async (path, flags, mode) => {
  const release = await acquireFileAccess([path], openKind(flags ?? "r"));
  try {
    const handle = await promises.open(path, flags, mode);
    const close = handle.close.bind(handle);
    handle.close = async () => {
      try { await close(); release(); }
      catch (error) { if (handle.fd < 0) release(); throw error; }
    };
    return handle;
  } catch (error) { release(); throw error; }
};

export const opendir: typeof promises.opendir = async (path, options) => {
  const release = await acquireFileAccess([path], "read");
  try {
    const directory = await promises.opendir(path, options);
    const close = directory.close.bind(directory);
    directory.close = ((callback?: (error: NodeJS.ErrnoException | null) => void) => {
      if (callback) return close(error => { if (!error || error.code === "ERR_DIR_CLOSED") release(); callback(error); });
      return Promise.resolve().then(close).then(release, error => { if (error.code === "ERR_DIR_CLOSED") release(); throw error; });
    }) as typeof directory.close;
    const closeSync = directory.closeSync.bind(directory);
    directory.closeSync = () => { closeSync(); release(); };
    const dispose = directory[Symbol.asyncDispose]?.bind(directory);
    if (dispose) directory[Symbol.asyncDispose] = async () => { await dispose(); release(); };
    const iterate = directory[Symbol.asyncIterator].bind(directory);
    directory[Symbol.asyncIterator] = async function* () { try { yield* iterate(); return undefined; } finally { release(); } };
    return directory;
  } catch (error) { release(); throw error; }
};

type PathStreamOptions<T> = Omit<T, "fd" | "fs"> & { fd?: never; fs?: never };

function createPathStream<T extends native.ReadStream | native.WriteStream>(
  path: native.PathLike,
  options: BufferEncoding | PathStreamOptions<native.ReadStreamOptions & native.WriteStreamOptions> | undefined,
  defaultFlags: string,
  create: (path: native.PathLike, options: native.ReadStreamOptions & native.WriteStreamOptions) => T,
) {
  const settings = typeof options === "string" ? { encoding: options } : options;
  if (settings?.fd != null || settings?.fs != null) throw new TypeError("文件流不接受外部 fd/fs；请使用 open 返回的句柄创建流");
  let release: (() => void) | undefined;
  const controller = new AbortController();
  const signal = settings?.signal ? AbortSignal.any([settings.signal, controller.signal]) : controller.signal;
  const stream = create(path, {
    ...settings,
    fs: {
      ...native,
      close: (fd: number, callback: (error: NodeJS.ErrnoException | null) => void) => {
        native.close(fd, error => {
          if (!error || error.code === "EBADF") { release?.(); release = undefined; }
          callback(error);
        });
      },
    },
  });
  const construct = stream._construct!.bind(stream);
  // 等待放在打开文件之前；排队期间 destroy 不能迟到地打开并截断目标。
  stream._construct = callback => {
    acquireFileAccess([path], openKind(settings?.flags ?? defaultFlags), signal).then(dispose => {
      release = dispose;
      if (stream.destroyed) { release(); release = undefined; callback(); return; }
      try {
        construct(error => {
          if (error) { release?.(); release = undefined; }
          callback(error);
        });
      } catch (error) { release?.(); release = undefined; callback(error as Error); }
    }, error => callback(stream.destroyed ? undefined : error));
  };
  const destroy = stream.destroy.bind(stream);
  stream.destroy = ((error?: Error) => {
    destroy(error);
    controller.abort();
    return stream;
  }) as T["destroy"];
  return stream;
}

export function createReadStream(path: native.PathLike, options?: BufferEncoding | PathStreamOptions<native.ReadStreamOptions>) {
  return createPathStream(path, options, "r", native.createReadStream);
}
export function createWriteStream(path: native.PathLike, options?: BufferEncoding | PathStreamOptions<native.WriteStreamOptions>) {
  return createPathStream(path, options, "w", native.createWriteStream);
}

export async function writeAtomic(path: string, content: string | Uint8Array, options: { exclusive?: boolean; mode?: number } = {}) {
  return withFileAccess([path], "write", async () => {
    const temporary = join(dirname(path), `.write-${crypto.randomUUID()}.tmp`);
    let failed = false;
    let created = false;
    try {
      const handle = await promises.open(temporary, "wx", options.mode ?? 0o600);
      created = true;
      try { await handle.writeFile(content); }
      catch (error) { failed = true; throw error; }
      finally {
        await handle.close().catch(error => {
          if (!failed) throw error;
          console.warn(`临时文件关闭失败：${temporary}`, error);
        });
      }
      if (options.exclusive) {
        if (process.platform === "android") require("./android.ts").renameExclusive(temporary, path);
        else await promises.link(temporary, path);
      }
      else await stubborn.retry.rename(retryOptions)(temporary, path);
    } finally {
      if (created) await promises.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return;
        // 清理失败不能覆盖原错误，也不能将已提交的保存报告为失败。
        console.warn(`临时文件清理失败：${temporary}`, error);
      });
    }
  });
}

export function writeAtomicSync(path: string, content: string | Uint8Array, options: { exclusive?: boolean; mode?: number } = {}) {
  return withSyncFileAccess([path], "write", () => {
    const temporary = join(dirname(path), `.write-${crypto.randomUUID()}.tmp`);
    let failed = false;
    let created = false;
    try {
      const fd = native.openSync(temporary, "wx", options.mode ?? 0o600);
      created = true;
      try { native.writeFileSync(fd, content); }
      catch (error) { failed = true; throw error; }
      finally {
        try { native.closeSync(fd); }
        catch (error) {
          if (!failed) throw error;
          console.warn(`临时文件关闭失败：${temporary}`, error);
        }
      }
      if (options.exclusive) {
        if (process.platform === "android") require("./android.ts").renameExclusive(temporary, path);
        else native.linkSync(temporary, path);
      }
      else stubborn.retry.renameSync(retryOptions)(temporary, path);
    } finally {
      try { if (created) native.unlinkSync(temporary); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(`临时文件清理失败：${temporary}`, error);
        }
      }
    }
  });
}

export const readFileSync: typeof native.readFileSync = ((path: native.PathOrFileDescriptor, options: any) =>
  typeof path === "number" ? native.readFileSync(path, options) : withSyncFileAccess([path], openKind(options?.flag ?? "r"), () => native.readFileSync(path, options))) as typeof native.readFileSync;
export const readdirSync: typeof native.readdirSync = ((path: native.PathLike, options: any) =>
  withSyncFileAccess([path], "read", () => native.readdirSync(path, options))) as typeof native.readdirSync;
export const writeFileSync: typeof native.writeFileSync = (path, data, options) =>
  typeof path === "number" ? native.writeFileSync(path, data, options) : withSyncFileAccess([path], "write", () => native.writeFileSync(path, data, options));
export const renameSync: typeof native.renameSync = (source, target) =>
  withSyncFileAccess([source, target], "write", () => stubborn.retry.renameSync(retryOptions)(source, target));
export const copyFileSync: typeof native.copyFileSync = (source, target, mode) =>
  withSyncFileAccess([source, target], "write", () => native.copyFileSync(source, target, mode));
export const cpSync: typeof native.cpSync = (source, target, options) =>
  withSyncFileAccess([source, target], "write", () => native.cpSync(source, target, options));
export const mkdirSync: typeof native.mkdirSync = ((path: native.PathLike, options: any) =>
  withSyncFileAccess([path], "write", () => native.mkdirSync(path, options))) as typeof native.mkdirSync;
export const rmSync: typeof native.rmSync = (path, options) =>
  withSyncFileAccess([path], "write", () => native.rmSync(path, { maxRetries: 5, retryDelay: 100, ...options }));
