import { t } from "@toonflow/server/i18n";
import { execFile } from "node:child_process";
import { writeAtomic } from "@toonflow/file";
import { isAbsolute, join } from "node:path";
import { promisify } from "node:util";
import { PATHS } from "electrobun/main";

const execFileAsync = promisify(execFile);
// ACT: 同一桌面进程只显示一个保存对话框；后续若支持多窗口，可按窗口分别加锁。
let dialogOpen = false;
// 选好路径到实际写入之间用一次性 token 中转，不把绝对路径回传给前端。
const pendingSaves = new Map<string, { path: string; expiresAt: number }>();
// ACT: 保存位置在打包和下载前选择，为最多 1 GB 的项目导出保留 30 分钟。
const tokenTtlMs = 30 * 60 * 1000;

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of pendingSaves) if (entry.expiresAt <= now) pendingSaves.delete(token);
}

const macDialog = `
on run argv
  try
    return POSIX path of (choose file name with prompt (item 2 of argv) default name (item 1 of argv))
  on error errorMessage number errorNumber
    if errorNumber is -128 then return ""
    error errorMessage number errorNumber
  end try
end run
`;

export async function selectSaveFile(fileName: string): Promise<string | null> {
  if (!fileName.trim() || fileName === "." || fileName === ".." || /[<>:"/\\|?*\u0000-\u001f\u007f-\u009f]/.test(fileName)) {
    throw new Error(t`保存文件名无效，不能包含路径或控制字符`);
  }
  if (dialogOpen) throw new Error(t`已有保存窗口正在操作，请先完成或取消`);
  if (!["win32", "darwin", "linux"].includes(process.platform)) throw new Error(t`当前系统不支持桌面另存为`);
  dialogOpen = true;
  try {
    const { stdout } = process.platform === "win32"
      ? await execFileAsync(join(PATHS.RESOURCES_FOLDER, "app/saveFileDialog.exe"), [fileName], {
        windowsHide: true,
        encoding: "utf8",
      })
      : process.platform === "darwin"
        ? await execFileAsync("/usr/bin/osascript", ["-e", macDialog, "--", fileName, t`另存为`], { encoding: "utf8" })
        : await execFileAsync("zenity", ["--file-selection", "--save", "--confirm-overwrite", "--title", t`另存为`, "--filename", fileName], { encoding: "utf8" });
    const selected = stdout.replace(/\r?\n$/, "");
    if (!selected) return null;
    if (!isAbsolute(selected) || /[\u0000-\u001f\u007f-\u009f]/.test(selected)) throw new Error(t`另存为窗口返回了无效的文件路径`);
    cleanupExpiredTokens();
    const token = crypto.randomUUID();
    pendingSaves.set(token, { path: selected, expiresAt: Date.now() + tokenTtlMs });
    return token;
  } catch (error) {
    if (process.platform === "linux" && (error as { code?: number }).code === 1) return null;
    throw new Error(t`选择保存位置失败：${error instanceof Error ? error.message : String(error)}`, { cause: error });
  } finally {
    dialogOpen = false;
  }
}

export default async function saveFile(token: string, content: Uint8Array): Promise<boolean> {
  const entry = pendingSaves.get(token);
  pendingSaves.delete(token);
  if (!entry || entry.expiresAt <= Date.now()) throw new Error(t`保存位置已过期，请重新选择保存位置`);
  const selected = entry.path;
  try {
    await writeAtomic(selected, content);
    return true;
  } catch (error) {
    throw new Error(t`保存文件失败：${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}
