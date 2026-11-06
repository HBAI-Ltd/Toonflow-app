import { Router } from "express";
import { lstat } from "@toonflow/file";
import { sendFile } from "@/utils/fileHttp";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", validateFields({ name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/) }, "query"), async (req, res) => {
  const name = req.query.name as string;
  const nodesDirectory = resolve(dirname(u.conf.path), "nodes");
  const filePath = resolve(nodesDirectory, `${name}.umd.js`);
  const file = await lstat(filePath).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (!file?.isFile()) return res.status(404).json(error("节点不存在", null, 404));
  const disabled = await lstat(resolve(nodesDirectory, `${name}.disabled`)).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (disabled) return res.status(404).json(error("节点已禁用", null, 404));
  res.set("Cache-Control", "no-cache");
  // ACT: 以数据目录为 root，避免 Linux 桌面端 ~/.local 被 send 当作 URL 中的隐藏目录拒绝。
  await sendFile(res, `${name}.umd.js`, { root: nodesDirectory });
});
