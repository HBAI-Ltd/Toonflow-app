import { readFile } from "node:fs/promises";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", validateFields({
  name: z.string().min(1).max(1024),
  path: z.string().min(1).max(1024).optional(),
}, "query"), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机读取技能", null, 403));
  const release = u.workspaceFile.lockWorkspaceFiles([u.skillFile.directory()]);
  try {
    const { target } = await u.skillFile.locate(req.query.name as string, req.query.path as string | undefined);
    const bytes = await readFile(target);
    if (bytes.byteLength > u.skillFile.maxBytes) return res.status(413).json(error("技能文件不能超过 20 MB", null, 413));
    if (bytes.includes(0)) return res.status(400).json(error("该文件不是文本内容，无法在编辑器中打开", null, 400));
    let content: string;
    try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
    catch { return res.status(400).json(error("该文件不是有效的 UTF-8 文本，无法在编辑器中打开", null, 400)); }
    res.set("Cache-Control", "no-store").json(success({ content }));
  } finally { release(); }
});