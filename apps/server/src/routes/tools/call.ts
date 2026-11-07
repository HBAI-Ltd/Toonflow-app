import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { getRuntimePlatform } from "@/lib/platform";
import { error, success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  name: u.plugins.toolNameSchema,
  tool: u.plugins.toolNameSchema,
  directory: z.string().min(1).max(4096),
  args: z.record(z.string(), z.json()),
}), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const platform = getRuntimePlatform();
  if ((platform.development || platform.desktop || platform.mobile)
    && !u.workspace.isLocalWorkspaceRequest(req) && !u.mobileLink.isMobileLinkRequest(req)) {
    return res.status(403).json(error("参数错误", null, 403));
  }
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const controller = new AbortController();
  const close = () => controller.abort();
  req.once("aborted", close);
  res.once("close", close);
  try {
    if (req.aborted || res.destroyed) return;
    const result = await u.plugins.callClientTool(req.body.name, req.body.tool, req.body.args, directory, controller.signal);
    if (!res.destroyed) res.set("Cache-Control", "no-store").json(success(result));
  } finally {
    req.off("aborted", close);
    res.off("close", close);
  }
});
