import { lstat, readFile, readdir } from "@toonflow/file";
import { basename, join, relative, sep } from "node:path";
import { Router } from "express";
import { zip } from "fflate";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";

const router = Router();
const maxBytes = 500 * 1024 * 1024;
const maxPaths = 200;

export default router.post("/", validateFields({
  paths: z.array(z.string().min(1).max(4096)).min(1).max(maxPaths).optional(),
  all: z.boolean().optional(),
}), async (req, res) => {
  const root = await u.assets.getAssetsDirectory();
  // ACT: 全量导出由服务端枚举根目录，避免前端逐项提交超过 maxPaths 上限
  const { paths, all } = req.body as { paths?: string[]; all?: boolean };
  if (all && paths?.length) throw Object.assign(new Error("all 与 paths 只能选择一种导出方式"), { status: 400 });
  if (!all && !paths?.length) throw Object.assign(new Error("请提供要导出的素材"), { status: 400 });
  const entries: Record<string, Uint8Array> = {};
  let totalBytes = 0;

  async function addFile(path: string, name: string) {
    const file = await lstat(path);
    if (!file.isFile()) return; // 链接或特殊文件直接跳过
    if (totalBytes + file.size > maxBytes) throw Object.assign(new Error("导出的素材总大小不能超过 500 MB"), { status: 413 });
    const bytes = await readFile(path);
    totalBytes += bytes.byteLength;
    if (entries[name]) name = relative(root, path).split(sep).join("-"); // 同名文件用相对路径区分
    entries[name] = bytes;
  }

  async function addDirectory(directory: string, prefix: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) await addDirectory(join(directory, entry.name), prefix + entry.name + "/");
      else await addFile(join(directory, entry.name), prefix + entry.name);
    }
  }

  // ACT: 全量导出只包含普通文件和目录，与素材列表一致；符号链接等特殊条目跳过，避免路径校验中断整体导出
  const requestedList = all ? (await readdir(root, { withFileTypes: true })).filter(entry => entry.isFile() || entry.isDirectory()).map(entry => entry.name) : paths!;
  for (const requested of requestedList) {
    const { path } = await u.workspaceFile.resolveWorkspacePath(root, requested);
    if ((await lstat(path)).isDirectory()) await addDirectory(path, basename(path) + "/");
    else await addFile(path, basename(path));
  }

  if (!Object.keys(entries).length) throw Object.assign(new Error("没有可导出的素材"), { status: 400 });
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 0 }, (err, data) => err ? reject(err) : resolve(data));
  });
  // ACT: 保存链路按最终 ZIP 大小限制，封装开销（文件头/中央目录）在这里统一校验，口径与保存接口一致
  if (bytes.byteLength > maxBytes) throw Object.assign(new Error("打包后的 ZIP 超过 500 MB 上限，请减少导出的素材"), { status: 413 });
  res.set("Cache-Control", "no-store").attachment("assets.zip").send(Buffer.from(bytes));
});
