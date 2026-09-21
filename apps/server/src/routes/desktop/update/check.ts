import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", async (req, res) => {
  await u.desktop.checkDesktopUpdate(req);
  res.set("Cache-Control", "no-store");
  res.json(success(await u.desktop.getDesktopUpdate(req)));
});
