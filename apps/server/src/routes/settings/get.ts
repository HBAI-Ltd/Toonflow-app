import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { publicSettings } from "@/utils/hosting/tenant";
import { isMultiUser } from "@/utils/accounts/context";
import { requireAdmin } from "@/utils/accounts/service";
import { z } from "zod";

const router = Router();

export default router.get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store");
  const settings = u.conf.get("settings", {});
  if (!isMultiUser() && u.cleanNodeMenuSettings(settings)) u.conf.set("settings", settings);
  const result = publicSettings(settings);
  if (isMultiUser() && req.query.mediaProviderId !== undefined) {
    requireAdmin();
    const id = z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/).parse(req.query.mediaProviderId);
    const configs = settings.mediaProviderConfigs as Record<string, unknown> | undefined;
    if (configs && Object.hasOwn(configs, id)) {
      result.mediaProviderConfigs = { ...(result.mediaProviderConfigs as Record<string, unknown> | undefined), [id]: configs[id] };
    }
  }
  res.json(success(result));
});
