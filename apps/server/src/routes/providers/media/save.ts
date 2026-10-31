import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({
  fileName: u.mediaProvider.mediaProviderFileSchema,
  models: u.mediaProvider.mediaModelsSchema.optional(),
  source: z.string().min(1).max(2 * 1024 * 1024).optional(),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
}), async (req, res) => {
  if ((req.body.source === undefined) === (req.body.models === undefined)) {
    return res.status(400).json(error("请提供供应商代码或模型配置，不能同时提供"));
  }
  if (req.body.source !== undefined) u.mcpControl.assertAppRequest(req);
  res.json(success(await u.mediaProvider.saveMediaProvider(req.body.fileName, req.body.source ?? req.body.models, req.body.revision)));
});
