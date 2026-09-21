import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ connectionId: z.uuid(), revision: z.number().int().positive(), state: u.mcpControl.controlStateSchema }), (req, res) => {
  u.mcpControl.assertControlRequest(req);
  u.mcpControl.updateControlState(req.body.connectionId, req.body.revision, u.mcpControl.controlStateSchema.parse(req.body.state));
  res.json(success());
});
