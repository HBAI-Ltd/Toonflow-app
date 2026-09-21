import axios from "axios";
import type useWorkspaceFiles from "@/lib/workspaceFiles";

export async function isCanvasFile(files: Pick<ReturnType<typeof useWorkspaceFiles>, "readText">, path: string) {
  try {
    const header = await files.readText(path, 4096);
    return /^\s*\{/.test(header) && /"toonflowCanvas"\s*:\s*true\s*[,}]/.test(header);
  } catch (error) {
    // ACT: 扫描期间已消失或不可作为文件读取的条目跳过，权限及其他 IO 错误继续抛出。
    if (axios.isAxiosError(error) && [400, 404].includes(error.response?.status ?? 0)) return;
    throw error;
  }
}
