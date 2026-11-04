import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store");
  const user = u.multiTenant.requestIdentity(req);
  if (user?.role === "user") {
    const saved = await u.multiTenant.readUserSettings(user.id);
    res.set("X-Toonflow-Settings-Revision", String(saved.revision));
    return res.json(success({ ...u.multiTenant.userSettings(saved.settings), multiTenantEnabled: true, helloCompleted: true }));
  }
  const settings = u.conf.get("settings", {});
  if (res.locals.multiTenantWeb === true && user?.role === "admin") {
    return res.json(success({ ...u.multiTenant.userSettings(settings, true), multiTenantEnabled: u.multiTenant.isEnabled() }));
  }
  const removedLegacySettings = u.removeLegacySettings(settings);
  if (u.cleanNodeMenuSettings(settings) || removedLegacySettings) u.conf.set("settings", settings);
  res.json(success({ ...settings, multiTenantEnabled: u.multiTenant.isEnabled() }));
});
