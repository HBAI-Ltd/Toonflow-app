import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), runId: z.uuid(),
}), async (req, res) => {
  const { directory, runId } = req.body as { directory: string; runId: string };
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  await u.agent.stopAgentRun(cwd, runId);
  res.json(success(null));
});
