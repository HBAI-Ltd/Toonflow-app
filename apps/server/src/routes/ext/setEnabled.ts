import { lstat, unlink, writeFile } from "@toonflow/file";
import { resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ name: u.extPlugins.extNameSchema, enabled: z.boolean() }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理文件扩展", null, 403));
  const { name, enabled } = req.body as { name: string; enabled: boolean };
  const release = u.workspaceFile.lockWorkspaceFiles(u.extPlugins.extPaths(name));
  try {
    const path = await u.extPlugins.resolveExtPath(name);
    const removed = await lstat(resolve(u.extPlugins.extDirectory, `${name}.removed`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (removed) return res.status(404).json(error("文件扩展不存在", null, 404));
    const file = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (!file?.isFile()) return res.status(404).json(error("文件扩展不存在", null, 404));
    const markerPath = resolve(u.extPlugins.extDirectory, `${name}.disabled`);
    const marker = await lstat(markerPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (marker && !marker.isFile()) return res.status(409).json(error("文件扩展状态文件无效", null, 409));
    if (enabled) await unlink(markerPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    else if (!marker) await writeFile(markerPath, "", { flag: "wx" });
    const wasEnabled = !marker;
    if (enabled !== wasEnabled) u.localModels.notifyModelCatalogChange();
    res.json(success({ name, enabled }));
  } finally { release(); }
});
