import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { publicSettings } from "@/utils/hosting/tenant";
import { isMultiUser } from "@/utils/accounts/context";

const router = Router();

export default router.get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store");
  const settings = u.conf.get("settings", {});
  if (!isMultiUser() && u.cleanNodeMenuSettings(settings)) u.conf.set("settings", settings);
  res.json(success(publicSettings(settings)));
});
