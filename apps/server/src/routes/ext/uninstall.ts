import { lstat, unlink, writeFile } from "@toonflow/file";
import { resolve } from "node:path";
import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().delete("/", validateFields({ name: u.extPlugins.extNameSchema }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机卸载文件扩展", null, 403));
  const name = req.body.name as string;
  const release = u.workspaceFile.lockWorkspaceFiles(u.extPlugins.extPaths(name));
  try {
    const removedPath = resolve(u.extPlugins.extDirectory, `${name}.removed`);
    const removed = await lstat(removedPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (removed) return res.status(404).json(error("文件扩展不存在", null, 404));
    const path = await u.extPlugins.resolveExtPath(name);
    const file = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (!file?.isFile()) return res.status(404).json(error("文件扩展不存在", null, 404));
    const markerPath = resolve(u.extPlugins.extDirectory, `${name}.disabled`);
    const marker = await lstat(markerPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (marker && !marker.isFile()) return res.status(409).json(error("文件扩展状态文件无效", null, 409));
    let recorded = false;
    await writeFile(removedPath, "", { flag: "wx" }).then(() => { recorded = true; }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
    try { await unlink(path); }
    catch (error) {
      if (recorded) await unlink(removedPath);
      throw error;
    }
    await unlink(markerPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    const configs = u.conf.get("extConfigs", {});
    delete configs[name];
    u.conf.set("extConfigs", configs);
    res.json(success(null, "文件扩展已卸载"));
  } finally { release(); }
});
