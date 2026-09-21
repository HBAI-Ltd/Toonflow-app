import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ source: z.string().min(1).max(2 * 1024 * 1024) }), async (req, res) => {
  res.json(success(await u.mediaProvider.addMediaProvider(req.body.source)));
});
