import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { getRuntimePlatform } from "@/lib/platform";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ name: u.plugins.toolNameSchema, id: z.string().uuid(), directory: z.string().min(1).max(4096) }), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const platform = getRuntimePlatform();
  if ((platform.development || platform.desktop || platform.mobile)
    && !u.workspace.isLocalWorkspaceRequest(req) && !u.mobileLink.isMobileLinkRequest(req)) {
    return res.status(403).json(error("参数错误", null, 403));
  }
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const url = await u.plugins.getToolClientLink(req.body.name, req.body.id, directory);
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }).json(success({ url }));
});
