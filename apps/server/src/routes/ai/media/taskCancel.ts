import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), id: z.uuid(), retry: z.boolean().optional() }), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.body.directory);
  const task = req.body.retry ? await u.mediaTasks.retryMediaTask(cwd, req.body.id) : await u.mediaTasks.cancelMediaTask(cwd, req.body.id);
  if (!task) { res.status(404).json({ code: 404, data: null, message: "媒体任务不存在" }); return; }
  res.json(success(task));
});
