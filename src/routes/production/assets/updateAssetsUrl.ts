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
    url: z.string(),
    flowId: z.number(),
  }),
  async (req, res) => {
    const { id, url, flowId } = req.body;
    const locale = await getLocale(req as any);
    const [imageId] = await u.db("o_image").insert({
      filePath: u.replaceUrl(url),
      state: "已完成", // i18n-ignore — stored o_image.state enum value, not user-facing text
      assetsId: id,
    });
    await u.db("o_assets").where({ id }).update({ flowId, imageId });
    res.status(200).send(success({ message: t("production.common.promptUpdated", {}, locale) }));
  },
);
