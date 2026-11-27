import { Router } from "express";
import { z } from "zod";
import { automationCommandSchema } from "@/agent/runtime/schedule";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), command: automationCommandSchema }), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.body.directory);
  res.set("Cache-Control", "no-store").json(success(await u.agent.updateAutomation(cwd, req.body.command)));
});
