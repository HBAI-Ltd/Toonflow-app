import { dlopen, FFIType, ptr, read } from "bun:ffi";
import { resolve, toNamespacedPath } from "node:path";
import { getSystemErrorName } from "node:util";

// ACT: Windows 部分磁盘及移动端沙箱不支持硬链接，使用系统独占重命名发布完整文件。
const windowsLibrary = process.platform === "win32" ? dlopen("kernel32.dll", {
  MoveFileExW: { args: ["ptr", "ptr", "u32"], returns: "i32" },
  GetLastError: { args: [], returns: "u32" },
}) : null;
const windowsErrorCodes: Record<number, string> = {
  2: "ENOENT", 3: "ENOENT", 5: "EACCES", 17: "EXDEV", 32: "EBUSY", 33: "EBUSY",
  80: "EEXIST", 112: "ENOSPC", 123: "EINVAL", 183: "EEXIST", 206: "ENAMETOOLONG",
};
const syscallNumber = process.arch === "arm64" ? 276 : process.arch === "x64" ? 316 : undefined;
if (syscallNumber === undefined) throw Object.assign(new Error(`不支持的移动端架构：${process.arch}`), { code: "ENOTSUP" });
const errnoSymbol = process.platform === "android" ? "__errno" : "__errno_location";
const library = windowsLibrary ? null : dlopen("libc.so", {
  [errnoSymbol]: { args: [], returns: "ptr" },
  syscall: { args: ["i64", "i64", "ptr", "i64", "ptr", "i64"], returns: FFIType.i64_fast },
});

export function renameExclusive(source: string, target: string) {
  if (source.includes("\0") || target.includes("\0")) {
    throw Object.assign(new TypeError("文件路径不能包含空字节"), { code: "ERR_INVALID_ARG_VALUE" });
  }
  if (windowsLibrary) {
    if (!source || !target) throw Object.assign(new TypeError("文件路径不能为空"), { code: "ERR_INVALID_ARG_VALUE" });
    const sourceBytes = Buffer.from(toNamespacedPath(resolve(source)) + "\0", "utf16le");
    const targetBytes = Buffer.from(toNamespacedPath(resolve(target)) + "\0", "utf16le");
    // 不启用覆盖或跨卷复制，由系统保证目标不存在时才提交。
    if (windowsLibrary.symbols.MoveFileExW(ptr(sourceBytes), ptr(targetBytes), 0)) return;
    const win32Error = windowsLibrary.symbols.GetLastError();
    const code = windowsErrorCodes[win32Error] ?? "EIO";
    throw Object.assign(new Error(`${code}: MoveFileExW '${source}' -> '${target}' (Win32 ${win32Error})`), {
      code, win32Error, syscall: "MoveFileExW", path: source, dest: target,
    });
  }
  const sourceBytes = Buffer.from(source + "\0");
  const targetBytes = Buffer.from(target + "\0");
  const errnoAddress = library!.symbols[errnoSymbol]()!;
  // RENAME_NOREPLACE 在内核中同时保证不覆盖及完整发布，不能降级为先检查再 rename 或复制。
  if (library!.symbols.syscall(syscallNumber!, -100, ptr(sourceBytes), -100, ptr(targetBytes), 1) === 0) return;
  const errno = -read.i32(errnoAddress);
  const code = getSystemErrorName(errno);
  throw Object.assign(new Error(`${code}: renameat2 '${source}' -> '${target}'`), { code, errno, syscall: "renameat2", path: source, dest: target });
}
