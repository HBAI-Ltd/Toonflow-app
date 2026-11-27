import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ id: z.string().min(1).max(166).optional(), source: z.string().min(1).max(40) }), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  await u.localModels.installModel(req.body.id, req.body.source);
  res.json(success());
});
