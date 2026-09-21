import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({ directory: z.string().min(1).max(4096), path: z.string().max(4096), exclusive: z.enum(["true", "false"]).optional() }, "query"), async (req, res) => {
  if (!req.is("application/octet-stream") || (req.body !== undefined && !Buffer.isBuffer(req.body))) {
    throw Object.assign(new Error("请发送文件原始内容"), { status: 400 });
  }
  const { directory, path } = await u.workspaceFile.resolveWorkspaceFile(req, req.query.directory as string, req.query.path as string);
  u.workspaceFile.protectWorkspaceRoot(directory, path);
  const release = u.workspaceFile.lockWorkspaceFiles([path]);
  try { await u.workspaceFile.writeWorkspaceFile(path, req.body ?? Buffer.alloc(0), req.query.exclusive === "true"); }
  finally { release(); }
  res.json(success());
});
