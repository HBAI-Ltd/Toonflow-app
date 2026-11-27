import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ id: z.string().min(1).max(166).optional() }, "query"), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  if (!req.is("application/octet-stream") || (req.headers["content-encoding"] ?? "identity") !== "identity") {
    throw Object.assign(new Error("请提供要保存的文件内容"), { status: 400 });
  }
  const length = req.headers["content-length"];
  await u.localModels.installModel(req.query.id as string | undefined, req.iterator({ destroyOnReturn: false }), length === undefined ? undefined : Number(length));
  res.json(success());
});
