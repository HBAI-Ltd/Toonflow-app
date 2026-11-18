import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";

export default Router().get("/", validateFields({ connectionId: z.uuid() }, "query"), async (req, res) => {
  await u.pluginServer.connectEvents(req, res, req.query.connectionId as string);
});
