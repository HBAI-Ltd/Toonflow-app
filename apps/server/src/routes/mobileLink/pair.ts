import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({ code: z.union([z.string().regex(/^\d{12}$/), z.string().min(32).max(128)]), name: z.string().trim().min(1).max(100) }), (req, res) => {
  const result = u.mobileLink.pairMobileDevice(req, req.body.code, req.body.name);
  res.set("Cache-Control", "no-store").json(success(result));
});
