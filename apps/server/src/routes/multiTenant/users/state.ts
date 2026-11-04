import { Router } from "express";
import { z } from "zod";
import { userIdSchema } from "@toonflow/multi-tenant-auth";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ id: userIdSchema, disabled: z.boolean() }), async (req, res) => {
  await u.multiTenant.setUserDisabled(req, req.body.id, req.body.disabled);
  res.set("Cache-Control", "no-store").json(success());
});
