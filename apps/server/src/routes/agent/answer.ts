import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096),
  callId: z.uuid(),
  cancelled: z.boolean().optional(),
  skipped: z.boolean().optional(),
  answer: z.string().trim().min(1).max(8000).optional(),
  values: z.record(z.string().max(64), z.union([z.string().max(8000), z.number(), z.boolean(), z.null(), z.array(z.string().max(300)).max(20)])).optional(),
}), async (req, res) => {
  const { directory, callId, ...response } = req.body;
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  res.json(success(u.question.answerQuestion(cwd, callId, response)));
});
