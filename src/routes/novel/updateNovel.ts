import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();

// 更新原文数据
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    index: z.union([z.number(), z.string()]),
    chapterOrder: z.union([z.number(), z.string()]).optional(),
    sectionOrder: z.union([z.number(), z.string()]).optional(),
    reel: z.string(),
    chapter: z.string(),
    section: z.string().optional(),
    chapterData: z.string(),
    event: z.string(),
  }),
  async (req, res) => {
    const { id, index, chapterOrder, sectionOrder, reel, chapter, section, chapterData, event } = req.body;
    const normalizedChapterIndex = Number(index);
    const normalizedChapterOrder = Number(chapterOrder ?? index);
    const normalizedSectionOrder = Number(sectionOrder ?? 0);
    if (!Number.isFinite(normalizedChapterOrder) || normalizedChapterOrder < 1) {
      return res.status(400).send(error("章 Order 必须是大于 0 的数字"));
    }
    if (!Number.isFinite(normalizedSectionOrder) || normalizedSectionOrder < 0) {
      return res.status(400).send(error("节 Order 必须是大于等于 0 的数字"));
    }
    const novel = await db("o_novel").where("id", id).select("projectId").first();
    if (!novel) {
      return res.status(400).send(error("原文不存在"));
    }
    const conflict = await db("o_novel")
      .where("projectId", novel.projectId)
      .whereNot("id", id)
      .whereRaw("COALESCE(chapterOrder, chapterIndex, id) = ?", [normalizedChapterOrder])
      .whereRaw("COALESCE(sectionOrder, 0) = ?", [normalizedSectionOrder])
      .select("id", "chapter", "section")
      .first();
    if (conflict) {
      const conflictTitle = [conflict.chapter, conflict.section].filter(Boolean).join(" / ") || `原文 ${conflict.id}`;
      return res.status(400).send(error(`章/节 Order 冲突：第 ${normalizedChapterOrder} 章 第 ${normalizedSectionOrder} 节已被「${conflictTitle}」使用`));
    }

    await db("o_novel").where("id", id).update({
      chapterIndex: Number.isFinite(normalizedChapterIndex) ? normalizedChapterIndex : index,
      chapterOrder: normalizedChapterOrder,
      sectionOrder: normalizedSectionOrder,
      reel,
      chapter,
      section: section || "",
      chapterData,
      event: event,
    });
    await recordGenerationArtifact({
      projectId: novel?.projectId ?? null,
      artifactType: "event",
      targetType: "o_novel",
      targetId: id,
      targetField: "event",
      title: `第${normalizedChapterOrder}章第${normalizedSectionOrder}节事件`,
      content: event,
      meta: { source: "manual:updateNovel", chapter, section, chapterIndex: index, chapterOrder: normalizedChapterOrder, sectionOrder: normalizedSectionOrder },
    });

    res.status(200).send(success({ message: "更新原文成功" }));
  },
);
