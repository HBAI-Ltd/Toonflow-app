import { lstat } from "@toonflow/file";
import { dirname, relative, resolve } from "node:path";
import { Router } from "express";
import u from "@/utils";
import { sendFile } from "@/utils/fileHttp";
import { validateFields } from "@/lib/middleware";
import { error } from "@/lib/responseFormat";

export default Router().get("/", validateFields({ name: u.extPlugins.extNameSchema }, "query"), async (req, res) => {
  const name = req.query.name as string;
  const path = await u.extPlugins.resolveExtPath(name);
  const file = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (!file?.isFile()) return res.status(404).json(error("文件扩展不存在", null, 404));
  const removed = await lstat(resolve(u.extPlugins.extDirectory, `${name}.removed`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (removed) return res.status(404).json(error("文件扩展不存在", null, 404));
  const disabled = await lstat(resolve(u.extPlugins.extDirectory, `${name}.disabled`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (disabled) return res.status(404).json(error("文件扩展已禁用", null, 404));
  res.set("Cache-Control", "no-cache");
  // 以数据目录为 root，避免 Linux ~/.local 等隐藏父目录被 send 拒绝。
  const root = dirname(u.conf.path);
  await sendFile(res, relative(root, path), { root });
});
