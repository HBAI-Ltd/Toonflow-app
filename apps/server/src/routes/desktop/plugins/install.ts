import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  type: z.enum(["node", "tool", "skill", "provider", "agent", "ext"]),
  url: z.string().url().max(4096),
  allowTerminal: z.boolean().optional(),
}), async (req, res) => {
  res.json(success(await u.pluginInstall.installRemotePlugin(req.body.type, req.body.url, undefined, false, undefined, undefined, undefined, req.body.allowTerminal === true), "插件已安装"));
});
