import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ connectionId: z.uuid(), callId: z.uuid(), result: z.json().optional(), error: z.string().max(20000).optional() }), (req, res) => {
  u.mcpControl.assertControlRequest(req);
  u.mcpControl.finishControlCall(req.body.connectionId, req.body.callId, req.body);
  res.json(success());
});
