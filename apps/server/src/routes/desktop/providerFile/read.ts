import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ token: z.string().uuid() }), async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(success(await u.desktop.readProviderFile(req, req.body.token)));
});
