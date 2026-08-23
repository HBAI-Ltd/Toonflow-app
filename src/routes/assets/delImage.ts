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
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;
    await u.db("o_assets").where({ imageId: id }).update({
      imageId: null,
    });
    await u.db("o_image").where({ id: id }).delete();
    const assetsData = await u.db("o_image").where("id", id);
    await Promise.all(assetsData.map((i) => i.filePath && u.oss.deleteFile(i.filePath)));
    res.status(200).send(success({ message: t("assets.delImage.deleted", {}, locale) }));
  },
);
