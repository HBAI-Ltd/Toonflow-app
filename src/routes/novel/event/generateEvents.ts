import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";

const router = express.Router();

// 清洗小说原文，生成事件列表
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    novelIds: z.array(z.number()),
    concurrentCount: z.number().min(1).optional(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { projectId, novelIds, concurrentCount = 5 } = req.body;

    const [allChapters, novel] = await Promise.all([
      u.db("o_novel").where("projectId", projectId).whereIn("id", novelIds),
      Promise.resolve(new u.cleanNovel(concurrentCount)),
    ]);
    if (allChapters.length === 0) {
      return res.status(400).send(success(t("novel.event.generateEvents.noChapters", {}, locale)));
    }
    await u.db("o_novel").where("projectId", projectId).whereIn("id", novelIds).update({ eventState: 0, event: null });
    novel.emitter.on("item", async (item) => {
      await u
        .db("o_novel")
        .where("id", item.id)
        .update({ event: item.event, eventState: item.event ? 1 : -1, errorReason: item?.errorReason ?? null });
    });
    novel.start(allChapters, projectId);

    return res.status(200).send(success(t("novel.event.generateEvents.generated", {}, locale)));
  },
);
