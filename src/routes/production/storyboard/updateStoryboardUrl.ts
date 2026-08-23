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
    url: z.string(),
    flowId: z.number(),
  }),
  async (req, res) => {
    const { id, url, flowId } = req.body;
    const locale = await getLocale(req as any);
    await u
      .db("o_storyboard")
      .where({ id })
      .update({
        filePath: u.replaceUrl(url),
        flowId,
        state: "已完成", // i18n-ignore — stored o_storyboard.state enum value, not user-facing text
        shouldGenerateImage:url ? 1 : 0
      });
    res.status(200).send(success({ message: t("production.storyboard.updateStoryboardUrl.updated", {}, locale) }));
  },
);
