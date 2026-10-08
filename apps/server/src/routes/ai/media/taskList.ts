import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().get("/", validateFields({ directory: z.string().min(1).max(4096) }, "query"), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.query.directory as string);
  res.json(success(await u.mediaTasks.listMediaTasks(cwd)));
});
