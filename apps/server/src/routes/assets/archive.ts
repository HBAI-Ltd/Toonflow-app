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
  paths: z.array(z.string().min(1).max(4096)).min(1).max(maxPaths),
}), async (req, res) => {
  const root = await u.assets.getAssetsDirectory();
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

  for (const requested of (req.body as { paths: string[] }).paths) {
    const { path } = await u.workspaceFile.resolveWorkspacePath(root, requested);
    if ((await lstat(path)).isDirectory()) await addDirectory(path, basename(path) + "/");
    else await addFile(path, basename(path));
  }

  if (!Object.keys(entries).length) throw Object.assign(new Error("没有可导出的素材"), { status: 400 });
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 0 }, (err, data) => err ? reject(err) : resolve(data));
  });
  res.set("Cache-Control", "no-store").attachment("assets.zip").send(Buffer.from(bytes));
});
