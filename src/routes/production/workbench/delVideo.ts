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
    const { id } = req.body;
    const locale = await getLocale(req as any);
    await u.db("o_video").where("id", id).delete();
    await u.db("o_videoTrack").where("videoId", id).update({
      videoId: null,
    });
    res.status(200).send(success({ message: t("production.common.videoDeleted", {}, locale) }));
  },
);
