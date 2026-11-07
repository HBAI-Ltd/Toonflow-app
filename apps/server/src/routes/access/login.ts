import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";

const router = Router();

export default router.post("/", validateFields({ password: z.string().min(1).max(1024) }), (req, res) => {
  const origin = u.mcpControl.getAppOrigin(req);
  return u.access.login(req.body.password, res, new URL(origin).protocol === "https:", req.ip ?? req.socket.remoteAddress ?? "unknown", req.accepts(["html", "json"]) === "json");
});
