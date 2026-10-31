import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().get("/", validateFields({
  fileName: u.mediaProvider.mediaProviderFileSchema,
}, "query"), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store").json(success(await u.mediaProvider.getMediaProviderSource(req.query.fileName as string)));
});
