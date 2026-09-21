import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({
  fileName: u.mediaProvider.mediaProviderFileSchema,
  models: u.mediaProvider.mediaModelsSchema,
  revision: z.string().regex(/^[a-f0-9]{64}$/),
}), async (req, res) => {
  res.json(success(await u.mediaProvider.saveMediaProvider(req.body.fileName, req.body.models, req.body.revision)));
});
