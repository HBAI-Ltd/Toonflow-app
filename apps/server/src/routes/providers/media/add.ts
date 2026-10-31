import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  source: z.string().min(1).max(2 * 1024 * 1024).optional(),
  url: z.string().trim().min(1).max(16384).optional(),
}), async (req, res) => {
  if ((req.body.source === undefined) === (req.body.url === undefined)) {
    return res.status(400).json(error("请提供供应商代码或文件链接，不能同时提供"));
  }
  let source: string = req.body.source;
  if (req.body.url !== undefined) {
    const signal = AbortSignal.timeout(30000);
    const bytes = await u.workspaceDownload.downloadPublicFile(req.body.url.trim(), {
      signal, maxBytes: 1024 * 1024, label: "供应商文件",
    }).catch(cause => {
      if (signal.aborted) throw Object.assign(new Error("供应商文件下载超时（30 秒），请检查网络后重试"), { status: 504 });
      if (cause instanceof Error && "status" in cause) throw cause;
      throw Object.assign(new Error("供应商文件下载连接失败，请检查文件链接、网络或 HTTPS 证书", { cause }), { status: 502 });
    });
    source = u.pluginInstall.decodeText(bytes);
    if (!source.trim() || /^\s*(?:<|[\[{])/.test(source)) {
      return res.status(400).json(error("链接返回的内容不是供应商代码，请使用 .ts 文件直链，不要填写中转站地址或 API Base URL"));
    }
  }
  res.json(success(await u.mediaProvider.addMediaProvider(source)));
});
