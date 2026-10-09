import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", (req, res) => {
  if (!u.mobileLink.isMobileLinkRequest(req)) throw Object.assign(new Error("心跳仅允许已配对的共享连接访问"), { status: 403 });
  res.set("Cache-Control", "no-store").json(success({ online: true, appVersion: req.app.locals.appVersion }));
});
