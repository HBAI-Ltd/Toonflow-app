import { Router } from "express";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { reauthenticate, requireAdmin } from "@/utils/accounts/service";
import { adjustWallet, walletAdjustmentSchema, withBillingAdmin } from "@/utils/hosting/billing";

export default Router().post("/", validateFields(walletAdjustmentSchema.shape), async (req, res) => {
  requireAdmin();
  const actor = await reauthenticate(req.body.currentPassword);
  const input = walletAdjustmentSchema.parse(req.body);
  res.json(success(withBillingAdmin(actor, () => adjustWallet(input, actor.id))));
});
