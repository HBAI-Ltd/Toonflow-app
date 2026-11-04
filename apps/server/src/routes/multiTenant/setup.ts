import { Router } from "express";
import { z } from "zod";
import { adminAccountSchema, passwordSchema } from "@toonflow/multi-tenant-auth";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ userName: adminAccountSchema, password: passwordSchema, enabled: z.boolean() }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.setup(req, req.body.userName, req.body.password, req.body.enabled)));
});
