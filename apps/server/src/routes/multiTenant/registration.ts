import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ registrationEnabled: z.boolean() }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.setRegistrationEnabled(req, req.body.registrationEnabled)));
});
