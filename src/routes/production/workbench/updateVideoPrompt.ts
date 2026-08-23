import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    prompt: z.string().optional(),
  }),
  async (req, res) => {
    const { id, prompt, duration } = req.body;
    const locale = await getLocale(req as any);
    await u.db("o_videoTrack").where("id", id).update({
      prompt,
    });
    res.status(200).send(success(t("production.workbench.updateVideoPrompt.updated", {}, locale)));
  },
);
