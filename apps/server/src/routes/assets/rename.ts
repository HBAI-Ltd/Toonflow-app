import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ path: z.string().min(1).max(4096), target: z.string().min(1).max(4096) }), async (req, res) => {
  const root = await u.assets.getAssetsDirectory();
  const source = await u.workspaceFile.resolveWorkspacePath(root, req.body.path);
  const target = await u.workspaceFile.resolveWorkspacePath(root, req.body.target);
  u.workspaceFile.protectWorkspaceRoot(source.directory, source.path);
  u.workspaceFile.protectWorkspaceRoot(target.directory, target.path);
  const release = u.workspaceFile.lockWorkspaceFiles([source.path, target.path]);
  try { await u.workspaceFile.renameWorkspaceFile(source.path, target.path); }
  finally { release(); }
  res.json(success());
});
