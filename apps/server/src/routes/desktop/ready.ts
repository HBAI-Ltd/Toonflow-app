import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";

const router = Router();

export default router.post("/", validateFields({ failed: z.boolean().optional() }), async (req, res) => {
  const runtime = u.desktop.getDesktopRuntime(req);
  await runtime.ready(req.body.failed);
  res.sendStatus(204);
});
