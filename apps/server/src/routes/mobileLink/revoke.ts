import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ id: z.string().min(1).max(100) }), (req, res) => {
  u.mobileLink.assertMobileLinkControl(req);
  u.mobileLink.revokeMobileDevice(req.app, req.body.id);
  res.json(success());
});
