import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { consumeAttempt, requireAdmin } from "@/utils/accounts/service";
import { reconcileBilling } from "@/utils/hosting/billing";

export default Router().post("/", async (_req, res) => {
  const user = requireAdmin();
  consumeAttempt(`billingReconcile:${user.id}`, 30);
  res.json(success(await reconcileBilling()));
});
