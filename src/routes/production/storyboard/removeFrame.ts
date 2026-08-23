import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
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
    const storyboardData = await u.db("o_storyboard").where("id", id).select("id", "track", "trackId", "flowId").first();
    if (!storyboardData) return res.status(400).send(error(t("production.storyboard.removeFrame.notFound", {}, locale)));
    if (storyboardData?.flowId) await u.db("o_imageFlow").where("id", storyboardData?.flowId).delete();
    const trackData = await u.db("o_storyboard").where("track", storyboardData.track).select("id");
    if (trackData.length == 1) await u.db("o_videoTrack").where("id", storyboardData.trackId).delete();
    await u.db("o_storyboard").where("id", id).delete();
    await u.db("o_assets2Storyboard").where("storyboardId", id).delete();
    res.status(200).send(success({ message: t("production.common.videoDeleted", {}, locale) }));
  },
);
