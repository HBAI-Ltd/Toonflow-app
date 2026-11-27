import { lstat } from "@toonflow/file";
import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { sendFile } from "@/utils/fileHttp";

const router = Router();

// 供媒体元素按 Range 读取 link 接口签发的文件：签名证明签发时已通过工作区授权，读取前仍复核路径边界。
export default router.get("/", validateFields({
  directory: z.string().min(1).max(4096), path: z.string().min(1).max(4096), token: z.string().regex(/^[\w-]{43}$/),
}, "query"), async (req, res, next) => {
  const { directory, path, token } = req.query as Record<string, string>;
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(u.workspaceFile.signFileLink(directory, path)))) {
    throw Object.assign(new Error("文件不存在"), { status: 404 });
  }
  const file = await u.workspaceFile.resolveWorkspacePath(directory, path);
  if (!(await lstat(file.path)).isFile()) throw Object.assign(new Error("只能读取文件"), { status: 400 });
  res.set("Cache-Control", "no-store");
  await sendFile(res, file.path, { dotfiles: "allow" }, err => { if (err) next(err); });
});
