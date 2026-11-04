import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ enabled: z.boolean() }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.setEnabled(req, req.body.enabled)));
});
