import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({
  enabled: z.boolean(),
  directory: z.string().max(4096),
  providerId: z.string().max(256),
  modelId: z.string().max(256),
  thinkingLevel: z.enum(["off", "low", "medium", "high"]).optional(),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理 A2A 设置", null, 403));
  const { enabled, providerId, modelId, thinkingLevel = "off" } = req.body;
  let directory = req.body.directory as string;
  // ACT: 关闭入口不依赖旧目录或模型仍存在；重新开启时再次严格校验。
  if (enabled) {
    u.ai.getConfiguredModel(providerId, modelId);
    directory = await u.a2aSettings.resolveA2aWorkspace(directory);
  }
  const previous = u.a2aSettings.getA2aSettings();
  const token = previous.token.length >= 32 ? previous.token : enabled ? randomBytes(32).toString("hex") : "";
  const settings = { enabled, directory, providerId, modelId, thinkingLevel, token };
  u.conf.set("a2a", settings);
  res.set("Cache-Control", "no-store").json(success({ ...settings, token: token || undefined, url: u.a2aSettings.getA2aUrl(req) }));
});
