import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().delete("/", validateFields({ name: z.string().regex(u.teams.teamNamePattern) }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机卸载团队", null, 403));
  await u.teams.uninstall(req.body.name);
  res.json(success(null, "团队已卸载"));
});
