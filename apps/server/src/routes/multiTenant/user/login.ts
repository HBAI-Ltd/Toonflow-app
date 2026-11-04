import { Router } from "express";
import { adminAccountSchema, passwordSchema } from "@toonflow/multi-tenant-auth";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ userName: adminAccountSchema, password: passwordSchema }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.loginUser(req, res, req.body.userName, req.body.password)));
});
