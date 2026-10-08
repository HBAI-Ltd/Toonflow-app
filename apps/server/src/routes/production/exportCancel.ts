import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), id: z.uuid() }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const task = await u.production.cancelExportTask(directory, req.body.id);
  if (!task) { res.status(404).json({ code: 404, data: null, message: "导出任务不存在" }); return; }
  res.json(success(task));
});
