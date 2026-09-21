import { lstat, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({ name: u.plugins.toolNameSchema, enabled: z.boolean() }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理工具", null, 403));
  const { name, enabled } = req.body as { name: string; enabled: boolean };
  const release = u.workspaceFile.lockWorkspaceFiles([resolve(u.plugins.toolsDirectory, `${name}.tool.js`)]);
  try {
    if (!(await lstat(resolve(u.plugins.toolsDirectory, `${name}.tool.js`))).isFile()) return res.status(400).json(error("工具文件无效", null, 400));
    const markerPath = resolve(u.plugins.toolsDirectory, `${name}.disabled`);
    const marker = await lstat(markerPath).catch((err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") return null;
      throw err;
    });
    if (marker && !marker.isFile()) return res.status(409).json(error("工具状态文件无效", null, 409));
    if (enabled) {
      const { plugin, metadata } = await u.plugins.loadTool(name);
      u.plugins.validateToolConfig(plugin, u.plugins.getToolConfig(metadata));
      if (marker) await unlink(markerPath);
    } else if (!marker) {
      await writeFile(markerPath, "", { flag: "wx" });
    }
    res.json(success({ name, enabled }));
  } finally { release(); }
});
