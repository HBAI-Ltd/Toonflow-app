import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ path: z.string().min(1).max(4096) }), async (req, res) => {
  await u.assets.createAssetDirectory(req.body.path);
  res.json(success());
});
