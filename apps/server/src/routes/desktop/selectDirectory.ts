import { realpath } from "node:fs/promises";
import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", async (req, res) => {
  const selected = await u.desktop.getDesktopRuntime(req).selectDirectory();
  const directory = selected ? await realpath(selected) : null;
  res.json(success({ directory }));
});
