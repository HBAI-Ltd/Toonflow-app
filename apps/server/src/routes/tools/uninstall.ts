import { lstat, realpath, rm, unlink } from "@toonflow/file";
import { resolve } from "node:path";
import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.delete("/", validateFields({ name: u.plugins.toolNameSchema }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理工具", null, 403));
  const { name } = req.body as { name: string };
  const path = resolve(u.plugins.toolsDirectory, `${name}.tool.js`);
  const resources = resolve(u.plugins.toolsDirectory, "pluginResources");
  const toolResources = resolve(resources, name);
  const release = u.workspaceFile.lockWorkspaceFiles([path, toolResources]);
  try {
    if (!(await lstat(path)).isFile()) return res.status(400).json(error("工具文件无效", null, 400));
    const resourceInfo = await lstat(toolResources).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
    if (resourceInfo) {
      const parent = await lstat(resources);
      if (!parent.isDirectory() || parent.isSymbolicLink() || !resourceInfo.isDirectory() || resourceInfo.isSymbolicLink()
        || !u.workspaceFile.isWithin(await realpath(u.plugins.toolsDirectory), await realpath(toolResources))) {
        return res.status(400).json(error("工具文件无效", null, 400));
      }
      await rm(toolResources, { recursive: true });
    }
    await unlink(path);
    await unlink(resolve(u.plugins.toolsDirectory, `${name}.disabled`)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
    const configs = u.conf.get("toolConfigs", {});
    delete configs[name];
    u.conf.set("toolConfigs", configs);
    res.json(success(null, "工具已卸载"));
  } finally { release(); }
});
