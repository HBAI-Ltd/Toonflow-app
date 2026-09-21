import { lstat, rm, rmdir } from "node:fs/promises";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.delete("/", validateFields({ directory: z.string().min(1).max(4096), path: z.string().max(4096), recursive: z.boolean().optional() }), async (req, res) => {
  const { directory, path } = await u.workspaceFile.resolveWorkspaceFile(req, req.body.directory, req.body.path);
  u.workspaceFile.protectWorkspaceRoot(directory, path);
  const release = u.workspaceFile.lockWorkspaceFiles([path]);
  try {
    if ((await lstat(path)).isDirectory() && req.body.recursive !== true) await rmdir(path);
    else await rm(path, { recursive: req.body.recursive === true });
  } finally { release(); }
  res.json(success());
});
