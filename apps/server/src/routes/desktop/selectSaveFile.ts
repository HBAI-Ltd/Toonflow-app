import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.post("/", validateFields({
  fileName: z.string().min(1).max(240).regex(/^[^\\/:*?"<>|\u0000-\u001f]+$/).refine(name => name !== "." && name !== ".." && !/[. ]$/.test(name)),
}), async (req, res) => {
  const token = await u.desktop.getDesktopRuntime(req).selectSaveFile(req.body.fileName);
  res.json(success({ token }));
});
