import { Router } from "express";
import { billingCreditSchema } from "@toonflow/multi-tenant-billing/config";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields(billingCreditSchema.shape), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.creditUserBalance(req, billingCreditSchema.parse(req.body))));
});
