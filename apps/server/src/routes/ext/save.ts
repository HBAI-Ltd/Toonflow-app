import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ name: u.extPlugins.extNameSchema, config: z.record(z.string(), z.json()) }), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理文件扩展配置", null, 403));
  const { name, config } = req.body;
  const release = u.workspaceFile.lockWorkspaceFiles(u.extPlugins.extPaths(name));
  try {
    const { configRules } = await u.extPlugins.readExt(name);
    const parsed = u.extPlugins.validateExtConfig(configRules, config);
    u.conf.set("extConfigs", { ...u.conf.get("extConfigs", {}), [name]: parsed });
    res.json(success(parsed, "文件扩展配置已保存"));
  } finally { release(); }
});
