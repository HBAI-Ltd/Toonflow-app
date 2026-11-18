import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();
const maxBytes = 20 * 1024 * 1024;

export default router.post("/", validateFields({
  fileName: z.string().max(128).optional(),
  source: z.string().max(maxBytes).optional(),
  url: z.string().url().max(4096).optional(),
  force: z.boolean().optional(),
  version: z.string().trim().min(1).max(256).optional(),
  identifier: z.string().trim().min(1).max(200).optional(),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机安装节点", null, 403));
  const { fileName, source, url, force, version, identifier } = req.body as { fileName?: string; source?: string; url?: string; force?: boolean; version?: string; identifier?: string };
  if (url ? source !== undefined : fileName === undefined || source === undefined) {
    return res.status(400).json(error("请选择文件或填写远端地址", null, 400));
  }

  const result = url
    ? await u.pluginInstall.installRemotePlugin("node", url, fileName, force, version, undefined, identifier)
    : await u.pluginInstall.installNode(fileName!, source!, force);
  res.json(success(result, "节点已安装"));
});
