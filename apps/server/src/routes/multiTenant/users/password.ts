import { Router } from "express";
import { passwordSchema, userIdSchema } from "@toonflow/multi-tenant-auth";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ id: userIdSchema, password: passwordSchema }), async (req, res) => {
  await u.multiTenant.resetUserPassword(req, req.body.id, req.body.password);
  res.set("Cache-Control", "no-store").json(success());
});
