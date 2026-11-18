import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ connectionId: z.uuid(), message: u.pluginServer.messageSchema }), async (req, res) => {
  await u.pluginServer.handleMessage(req, req.body.connectionId, req.body.message);
  res.json(success());
});
