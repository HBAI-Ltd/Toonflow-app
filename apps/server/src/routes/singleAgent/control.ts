import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const inputSchema = z.strictObject({ sessionId: z.uuid(), runId: z.uuid().optional(), action: z.enum(["pause", "resume", "stop", "close"]) });

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { sessionId, action, runId } = inputSchema.parse(req.body);
  res.json(success(await u.singleAgent.control(sessionId, action, runId)));
});
