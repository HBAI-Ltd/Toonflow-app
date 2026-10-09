import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const inputSchema = z.strictObject({
  sessionId: z.uuid(), callId: z.uuid(), partial: z.boolean().optional(), error: z.string().max(20000).optional(),
  result: z.looseObject({
    content: z.array(z.union([
      z.looseObject({ type: z.literal("text"), text: z.string() }),
      z.looseObject({ type: z.literal("image"), data: z.string(), mimeType: z.string().startsWith("image/") }),
    ])),
    details: z.json().default({}),
  }).optional(),
}).refine(input => (input.result !== undefined) !== (input.error !== undefined), "必须提供工具结果或错误信息")
  .refine(input => !input.partial || input.result !== undefined, "工具增量必须提供结果");

export default Router().post("/", validateFields(inputSchema.shape), (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { sessionId, callId, ...result } = inputSchema.parse(req.body);
  u.singleAgent.toolResult(sessionId, callId, result);
  res.json(success());
});
