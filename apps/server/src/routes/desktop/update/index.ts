import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(success(await u.desktop.getDesktopUpdate(req)));
});
