import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pluginDevelopmentSchema, type PluginInstallPreview } from "@/lib/pluginDevelopment";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({
  directory: z.string().min(1).max(4096),
  installDigest: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  ...pluginDevelopmentSchema.shape,
  action: z.union([pluginDevelopmentSchema.shape.action, z.literal("previewInstall")]),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机管理工具", null, 403));
  const { directory, installDigest, action, ...args } = req.body;
  if (action === "install" && !installDigest) return res.status(400).json(error("请在桌面端或服务器本机确认安装插件"));
  const input = pluginDevelopmentSchema.parse({ ...args, action: action === "previewInstall" ? "install" : action });
  const controller = new AbortController();
  const cancel = () => { if (!res.writableEnded) controller.abort(new Error("画布操作已取消")); };
  res.on("close", cancel);
  if (res.destroyed || req.aborted || req.socket.destroyed) cancel();
  try {
    const workspace = await u.workspace.resolveWorkspace(req, directory);
    let preview: PluginInstallPreview | undefined;
    async function install(type: "node" | "tool", fileName: string, source: string) {
      controller.signal.throwIfAborted();
      if (input.action !== "install") throw Object.assign(new Error("参数错误"), { status: 400 });
      const digest = createHash("sha256").update(type).update("\0").update(fileName).update("\0").update(source).digest("hex");
      // 首次调用只读构建回执，用户确认后再核对同一产物，防止等待期间的重建替换安装内容。
      if (action === "previewInstall") {
        preview = { type, fileName, digest };
        return { name: fileName };
      }
      if (digest !== installDigest) throw Object.assign(new Error("构建产物已被修改，请重新构建"), { status: 409 });
      return type === "node" ? u.pluginInstall.installNode(fileName, source, false, undefined, controller.signal)
        : u.pluginInstall.installTool(fileName, source, false, undefined, controller.signal);
    }
    const result = await u.pluginDevelopment.runPluginDevelopment(workspace, input, controller.signal, {
      installNode: (fileName, source) => install("node", fileName, source),
      installTool: (fileName, source) => install("tool", fileName, source),
    });
    res.json(success(preview ?? result));
  } finally { res.off("close", cancel); }
});
