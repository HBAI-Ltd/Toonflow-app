import { raw, Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({
  token: z.string().min(1).max(200),
}, "query"), raw({ type: "application/octet-stream", limit: "100mb" }), async (req, res) => {
  if (!Buffer.isBuffer(req.body)) return res.status(400).json(error("请提供要保存的文件内容", null, 400));
  const saved = await u.desktop.getDesktopRuntime(req).saveFile(req.query.token as string, req.body);
  res.json(success({ saved }));
});
