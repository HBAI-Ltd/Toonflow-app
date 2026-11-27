import { lstat } from "@toonflow/file";
import { Router } from "express";
import { relative } from "node:path";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ directory: z.string().min(1).max(4096), path: z.string().max(4096) }), async (req, res) => {
  const { directory, path } = await u.workspaceFile.resolveWorkspaceFile(req, req.body.directory, req.body.path);
  if (!(await lstat(path)).isFile()) throw Object.assign(new Error("只能读取文件"), { status: 400 });
  const file = relative(directory, path);
  const query = new URLSearchParams({ directory, path: file, token: u.workspaceFile.signFileLink(directory, file) });
  res.json(success({ url: `/api/workspaces/files/stream?${query}` }));
});
