import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", async (req, res) => {
  res.json(success(await u.desktop.selectProviderFile(req)));
});
