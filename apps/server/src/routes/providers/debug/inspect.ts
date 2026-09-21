import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ source: u.providerDebug.providerDebugSchema.source }), async (req, res) => {
  res.json(success(await u.providerDebug.inspectProviderSource(req.body.source)));
});
