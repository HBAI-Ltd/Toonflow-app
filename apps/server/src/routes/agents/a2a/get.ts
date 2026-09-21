import { Router } from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";

export default Router().get("/", (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机读取 A2A 设置", null, 403));
  const settings = u.a2aSettings.getA2aSettings();
  res.set("Cache-Control", "no-store").json(success({ ...settings, token: settings.token || undefined, url: u.a2aSettings.getA2aUrl(req) }));
});
