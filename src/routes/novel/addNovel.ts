import express from "express";
import u from "@/utils";
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
        chapterOrder: z.number().optional(),
        sectionOrder: z.number().optional(),
        reel: z.string(),
        chapter: z.string(),
        section: z.string().optional(),
        chapterData: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const { projectId, data } = req.body;
    const totalNovelId = [];
    const lastChapter = await u
      .db("o_novel")
      .where("projectId", projectId)
      .select("chapterOrder", "chapterIndex")
      .orderByRaw("COALESCE(chapterOrder, chapterIndex, id) desc")
      .orderByRaw("COALESCE(sectionOrder, 0) desc")
      .orderBy("id", "desc")
      .first();
    let lastChapterOrder = Number(lastChapter?.chapterOrder ?? lastChapter?.chapterIndex ?? 0);
    for (const item of data) {
      const itemChapterOrder = Number.isFinite(Number(item.chapterOrder)) && Number(item.chapterOrder) > 0 ? Number(item.chapterOrder) : null;
      const nextChapterOrder = itemChapterOrder ?? lastChapterOrder + 1;
      lastChapterOrder = Math.max(lastChapterOrder, nextChapterOrder);
      const sourceChapterIndex = Number.isFinite(Number(item.index)) && Number(item.index) > 0 ? Number(item.index) : nextChapterOrder;
      const sectionOrder = Number.isFinite(Number(item.sectionOrder)) && Number(item.sectionOrder) >= 0 ? Number(item.sectionOrder) : 0;
      const [id] = await u.db("o_novel").insert({
        projectId,
        chapterIndex: sourceChapterIndex,
        chapterOrder: nextChapterOrder,
        sectionOrder,
        reel: item.reel,
        chapter: item.chapter,
        section: item.section || "",
        chapterData: item.chapterData,
        createTime: Date.now(),
        eventState: 0,
      });
      totalNovelId.push(id);
    }
    const chapterAllList = await u.db("o_novel").where("projectId", projectId).whereIn("id", totalNovelId).orderByRaw("COALESCE(chapterOrder, chapterIndex, id) asc").orderByRaw("COALESCE(sectionOrder, 0) asc").orderBy("id", "asc");
    const novelClass = new u.cleanNovel();
    novelClass.emitter.on("item", async (item) => {
      await u
        .db("o_novel")
        .where("id", item.id)
        .update({ event: item.event, eventState: item.event ? 1 : -1, errorReason: item?.errReason ?? null });
    });
    novelClass.start(chapterAllList, projectId);

    res.status(200).send(success({ message: "新增原文成功" }));
  },
);
