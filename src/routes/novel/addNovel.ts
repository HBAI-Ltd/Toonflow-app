import express from "express";
import db from "@/utils/db";
import CleanNovel from "@/utils/cleanNovel";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 新增原文数据
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    data: z.array(
      z.object({
        index: z.number(),
        reel: z.string(),
        chapter: z.string(),
        chapterData: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const { projectId, data } = req.body;
    const totalNovelIds: number[] = [];
    const getLastChapterIndex = await db("o_novel")
      .where("projectId", projectId)
      .select("chapterIndex")
      .orderBy("chapterIndex", "desc")
      .first();

    let lastChapterIndex = 0;
    if (getLastChapterIndex) {
      lastChapterIndex = getLastChapterIndex.chapterIndex!;
    }

    for (const item of data) {
      const [id] = await db("o_novel").insert({
        projectId,
        chapterIndex: ++lastChapterIndex,
        reel: item.reel,
        chapter: item.chapter,
        chapterData: item.chapterData,
        createTime: Date.now(),
        eventState: 0,
      });
      totalNovelIds.push(id as number);
    }

    const chapterAllList = await db("o_novel").where("projectId", projectId).whereIn("id", totalNovelIds);

    if (process.env.TOONFLOW_MOCK_CLEAN_NOVEL === "1") {
      await Promise.all(
        chapterAllList.map((item) =>
          db("o_novel").where("id", item.id).update({
            event: `[mock event] chapter-${item.chapterIndex}:${item.chapter}`,
            eventState: 1,
            errorReason: null,
          }),
        ),
      );
    } else {
      const novelClass = new CleanNovel();
      novelClass.emitter.on("item", async (item: { id: number; event: string | null; errorReason?: string | null }) => {
        await db("o_novel").where("id", item.id).update({
          event: item.event,
          eventState: item.event ? 1 : -1,
          errorReason: item.errorReason ?? null,
        });
      });
      void novelClass.start(chapterAllList, projectId);
    }

    return res.status(200).send(success({ message: "新增原文成功" }));
  },
);
