import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({ enabled: z.boolean(), port: z.number().int().min(1).max(65535),
  publicUrl: z.string().max(2048), directories: z.array(z.string().min(1).max(4096)).max(1000) }), async (req, res) => {
  u.mobileLink.assertMobileLinkControl(req);
  const status = await u.mobileLink.configureMobileLink(req.app, req.body);
  res.set("Cache-Control", "no-store").json(success(status));
});
