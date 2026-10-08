import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().get("/", validateFields({ directory: z.string().min(1).max(4096), id: z.uuid() }, "query"), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.query.directory as string);
  const task = await u.mediaTasks.getMediaTask(cwd, req.query.id as string);
  if (!task) { res.status(404).json({ code: 404, data: null, message: "媒体任务不存在" }); return; }
  res.json(success(task));
});
