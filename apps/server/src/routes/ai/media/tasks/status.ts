import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), taskIds: z.array(z.uuid()).min(1).max(100),
  resume: z.boolean().optional(),
}), async (req, res) => {
  const { directory, taskIds } = req.body;
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  res.set("Cache-Control", "no-store").json(success(await u.mediaTasks.status(cwd, taskIds, req.body.resume === true)));
});
