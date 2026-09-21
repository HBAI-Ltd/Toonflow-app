import u from "@/utils";
import { lstat, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.delete("/", validateFields({ name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/) }), async (req, res) => {
  const nodesDirectory = resolve(dirname(u.conf.path), "nodes");
  const filePath = resolve(nodesDirectory, `${req.body.name}.umd.js`);
  const markerPath = resolve(nodesDirectory, `${req.body.name}.disabled`);
  const file = await lstat(filePath).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (!file?.isFile()) return res.status(404).json(error("节点不存在", null, 404));
  const marker = await lstat(markerPath).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (marker && !marker.isFile()) return res.status(409).json(error("节点状态文件无效", null, 409));
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return res.status(404).json(error("节点不存在", null, 404));
    throw err;
  }
  await unlink(markerPath).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
  const configs = u.conf.get("nodeConfigs", {});
  delete configs[req.body.name];
  u.conf.set("nodeConfigs", configs);
  res.json(success(null, "节点已卸载"));
});
