import { execFile } from "node:child_process";
import { open, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { promisify } from "node:util";
import { PATHS } from "electrobun/main";

const execFileAsync = promisify(execFile);
// ACT: 同一桌面进程只显示一个保存对话框；后续若支持多窗口，可按窗口分别加锁。
let dialogOpen = false;
// 选好路径到实际写入之间用一次性 token 中转，不把绝对路径回传给前端。
const pendingSaves = new Map<string, { path: string; expiresAt: number }>();
const tokenTtlMs = 5 * 60 * 1000;

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of pendingSaves) if (entry.expiresAt <= now) pendingSaves.delete(token);
}

const macDialog = `
on run argv
  try
    return POSIX path of (choose file name with prompt "另存为" default name (item 1 of argv))
  on error errorMessage number errorNumber
    if errorNumber is -128 then return ""
    error errorMessage number errorNumber
  end try
end run
`;

export async function selectSaveFile(fileName: string): Promise<string | null> {
  if (!fileName.trim() || fileName === "." || fileName === ".." || /[<>:"/\\|?*\u0000-\u001f\u007f-\u009f]/.test(fileName)) {
    throw new Error("保存文件名无效，不能包含路径或控制字符");
  }
  if (dialogOpen) throw new Error("已有保存窗口正在操作，请先完成或取消");
  if (process.platform !== "win32" && process.platform !== "darwin") throw new Error("当前系统不支持桌面另存为");
  dialogOpen = true;
  try {
    const { stdout } = process.platform === "win32"
      ? await execFileAsync(join(PATHS.RESOURCES_FOLDER, "app/saveFileDialog.exe"), [fileName], {
        windowsHide: true,
        encoding: "utf8",
      })
      : await execFileAsync("/usr/bin/osascript", ["-e", macDialog, "--", fileName], { encoding: "utf8" });
    const selected = stdout.replace(/\r?\n$/, "");
    if (!selected) return null;
    if (!isAbsolute(selected) || /[\u0000-\u001f\u007f-\u009f]/.test(selected)) throw new Error("另存为窗口返回了无效的文件路径");
    cleanupExpiredTokens();
    const token = crypto.randomUUID();
    pendingSaves.set(token, { path: selected, expiresAt: Date.now() + tokenTtlMs });
    return token;
  } catch (error) {
    throw new Error(`选择保存位置失败：${error instanceof Error ? error.message : String(error)}`, { cause: error });
  } finally {
    dialogOpen = false;
  }
}

export default async function saveFile(token: string, content: Uint8Array): Promise<boolean> {
  const entry = pendingSaves.get(token);
  pendingSaves.delete(token);
  if (!entry || entry.expiresAt <= Date.now()) throw new Error("保存位置已过期，请重新选择保存位置");
  const selected = entry.path;
  try {
    const temporary = join(dirname(selected), `.toonflow-${crypto.randomUUID()}.tmp`);
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(content);
      await file.close();
      await rename(temporary, selected);
    } finally {
      await file.close();
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    }
    return true;
  } catch (error) {
    throw new Error(`保存文件失败：${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}
