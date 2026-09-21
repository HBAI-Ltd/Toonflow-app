import { lstat } from "node:fs/promises";
import { basename } from "node:path";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";

const router = Router();

export default router.get("/", validateFields({ path: z.string().min(1).max(4096), download: z.literal("true").optional() }, "query"), async (req, res, next) => {
  const root = await u.assets.getAssetsDirectory();
  const { directory, path } = await u.workspaceFile.resolveWorkspacePath(root, req.query.path as string);
  u.workspaceFile.protectWorkspaceRoot(directory, path);
  if (!(await lstat(path)).isFile()) throw Object.assign(new Error("只能读取文件"), { status: 400 });
  if (req.query.download === "true") res.attachment(basename(path));
  res.set({ "Cache-Control": "no-store", "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff" })
    .sendFile(path, { dotfiles: "allow" }, err => { if (err) next(err); });
});
