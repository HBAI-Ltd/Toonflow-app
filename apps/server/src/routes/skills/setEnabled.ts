import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ name: z.string().min(1).max(1024), enabled: z.boolean() }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理技能", null, 403));
  const { name, enabled } = req.body as { name: string; enabled: boolean };
  const release = u.workspaceFile.lockWorkspaceFiles([u.skillFile.directory()]);
  try {
    await u.skillFile.setEnabled(name, enabled);
    res.json(success({ name, enabled }));
  } finally { release(); }
});
