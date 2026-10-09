import u from "@/utils";
import { Router } from "express";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", (req, res) => {
  u.mobileLink.assertMobileLinkControl(req);
  res.set("Cache-Control", "no-store").json(success(u.mobileLink.getMobileLinkStatus(req.app)));
});
