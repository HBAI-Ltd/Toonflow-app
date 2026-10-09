import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ url: z.url().max(2048) }), (req, res) => {
  u.mobileLink.assertMobileLinkControl(req);
  res.set("Cache-Control", "no-store").json(success(u.mobileLink.createMobilePairing(req.app, req.body.url)));
});
