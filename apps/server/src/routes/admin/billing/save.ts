import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { audit, reauthenticate, requireAdmin } from "@/utils/accounts/service";
import { billingSettingsSchema, saveBillingSettings, withBillingAdmin } from "@/utils/hosting/billing";

export default Router().put("/", validateFields({ settings: billingSettingsSchema, currentPassword: z.string().min(1).max(128) }), async (req, res) => {
  requireAdmin();
  const actor = await reauthenticate(req.body.currentPassword);
  const result = withBillingAdmin(actor, () => {
    const settings = saveBillingSettings(req.body.settings);
    audit("billingSettingsChanged", actor.id);
    return settings;
  });
  res.json(success(result));
});
