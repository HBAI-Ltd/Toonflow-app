import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { id } from "zod/locales";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    prompt: z.string(),
    videoDesc: z.string(),
  }),
  async (req, res) => {
    const { id, prompt, videoDesc } = req.body;
    const locale = await getLocale(req as any);
    await u.db("o_storyboard").where({ id }).update({
      prompt,
      videoDesc,
    });
    res.status(200).send(success({ message: t("production.common.promptUpdated", {}, locale) }));
  },
);
