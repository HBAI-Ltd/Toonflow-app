import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({
  name: z.string().min(1).max(1024),
  path: z.string().min(1).max(1024),
  target: z.string().min(1).max(1024),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机移动技能文件", null, 403));
  const { name, path, target } = req.body as { name: string; path: string; target: string };
  const release = u.workspaceFile.lockWorkspaceFiles([u.skillFile.directory()]);
  try {
    const { source: sourcePath, target: targetPath } = await u.skillFile.move(name, path, target);
    try { await u.workspaceFile.renameWorkspaceFile(sourcePath, targetPath); }
    catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") return res.status(409).json(error("已存在同名文件或目录", null, 409));
      throw err;
    }
    res.json(success(null, "文件已移动"));
  } finally { release(); }
});
