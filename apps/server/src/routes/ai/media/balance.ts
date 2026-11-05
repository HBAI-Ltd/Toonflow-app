import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { isMultiUser } from "@/utils/accounts/context";

export default Router().post("/", validateFields({
  providerId: z.string().regex(/^[a-z][a-zA-Z0-9]{0,95}$/), apiKey: z.string().max(16384).optional(),
}), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store").json(success(await u.mediaBilling.getProviderBalance(req.body.providerId, isMultiUser() ? undefined : req.body.apiKey)));
});
