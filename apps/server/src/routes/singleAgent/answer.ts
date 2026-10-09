import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const inputSchema = z.strictObject({
  sessionId: z.uuid(), callId: z.uuid(), cancelled: z.boolean().optional(), skipped: z.boolean().optional(),
  answer: z.string().trim().min(1).max(8000).optional(),
  values: z.record(z.string().max(64), z.union([z.string().max(8000), z.number(), z.boolean(), z.null(), z.array(z.string().max(300)).max(20)])).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { sessionId, callId, ...response } = inputSchema.parse(req.body);
  res.json(success(u.singleAgent.answer(sessionId, callId, response)));
});
