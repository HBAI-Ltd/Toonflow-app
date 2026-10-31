import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), taskIds: z.array(z.uuid()).min(1).max(100),
}), async (req, res) => {
  const { directory, taskIds } = req.body;
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  await u.mediaTasks.cancel(cwd, taskIds);
  res.json(success());
});
