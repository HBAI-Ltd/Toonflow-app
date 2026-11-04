import { Router } from "express";
import { adminAccountSchema, passwordSchema } from "@toonflow/multi-tenant-auth";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ userName: adminAccountSchema, password: passwordSchema }), async (req, res) => {
  const result = await u.multiTenant.createUser(req, req.body.userName, req.body.password);
  res.set("Cache-Control", "no-store").json(success(result));
});
