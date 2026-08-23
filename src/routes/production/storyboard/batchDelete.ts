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
    ids: z.array(z.number()),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { ids, projectId } = req.body;
    const locale = await getLocale(req as any);
    if (!ids.length) return res.status(400).send(error(t("production.storyboard.batchDelete.selectFirst", {}, locale)));
    const storyboardDataList = await u.db("o_storyboard").whereIn("id", ids).where("projectId", projectId).select("id", "track", "trackId", "flowId");
    if (!storyboardDataList.length) return res.status(400).send(error(t("production.storyboard.batchDelete.notExist", {}, locale)));
    const flowIds = storyboardDataList.map((i) => i.flowId);
    const storyBoardIds = storyboardDataList.map((i) => i.id);
    if (flowIds.length)
      await u
        .db("o_imageFlow")
        .whereIn("id", flowIds as number[])
        .delete();

    await u.db("o_storyboard").whereIn("id", storyBoardIds).delete();
    await u.db("o_assets2Storyboard").whereIn("storyboardId", storyBoardIds).delete();
    res.status(200).send(success({ message: t("production.common.videoDeleted", {}, locale) }));
  },
);
