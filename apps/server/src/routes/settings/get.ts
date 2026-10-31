import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store");
  const settings = u.conf.get("settings", {});
  const removedLegacySettings = u.removeLegacySettings(settings);
  if (u.cleanNodeMenuSettings(settings) || removedLegacySettings) u.conf.set("settings", settings);
  res.json(success(settings));
});
