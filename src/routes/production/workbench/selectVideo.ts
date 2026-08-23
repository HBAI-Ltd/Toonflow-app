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
    trackId: z.number(),
    videoId: z.number(),
  }),
  async (req, res) => {
    const { trackId, videoId } = req.body;
    const locale = await getLocale(req as any);
    await u.db("o_videoTrack").where("id", trackId).update({
      videoId: videoId,
    });
    res.status(200).send(success({ message: t("production.workbench.selectVideo.selected", {}, locale) }));
  },
);
