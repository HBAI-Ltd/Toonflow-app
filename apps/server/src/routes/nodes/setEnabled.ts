import u from "@/utils";
import { lstat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({ name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/), enabled: z.boolean() }), async (req, res) => {
  const { name, enabled } = req.body as { name: string; enabled: boolean };
  const nodesDirectory = resolve(dirname(u.conf.path), "nodes");
  const file = await lstat(resolve(nodesDirectory, `${name}.umd.js`)).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (!file?.isFile()) return res.status(404).json(error("节点不存在", null, 404));
  const markerPath = resolve(nodesDirectory, `${name}.disabled`);
  const marker = await lstat(markerPath).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (marker && !marker.isFile()) return res.status(409).json(error("节点状态文件无效", null, 409));

  if (enabled) {
    await unlink(markerPath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
  } else if (!marker) {
    await writeFile(markerPath, "", { flag: "wx" }).catch(async (err: NodeJS.ErrnoException) => {
      if (err.code !== "EEXIST") throw err;
      if (!(await lstat(markerPath)).isFile()) throw Object.assign(new Error("节点状态文件无效"), { status: 409 });
    });
  }
  res.json(success({ name, enabled }));
});
