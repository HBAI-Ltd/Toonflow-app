import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();
const maxBytes = 20 * 1024 * 1024;

export default router.post("/", validateFields({
  fileName: z.string().max(104).regex(/^[a-z][a-zA-Z0-9]*\.tool\.js$/).optional(),
  source: z.string().min(1).max(maxBytes).optional(),
  url: z.string().url().max(4096).optional(),
  force: z.boolean().optional(),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理工具", null, 403));
  const { fileName, source, url, force } = req.body as { fileName?: string; source?: string; url?: string; force?: boolean };
  if (url ? source !== undefined : fileName === undefined || source === undefined) {
    return res.status(400).json(error("请选择文件或填写远端地址", null, 400));
  }
  const result = url
    ? await u.pluginInstall.installRemotePlugin("tool", url, fileName, force)
    : await u.pluginInstall.installTool(fileName!, source!, force);
  res.json(success(result, "工具已安装"));
});
