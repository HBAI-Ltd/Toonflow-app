import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 获取原文数据
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    page: z.number(),
    limit: z.number(),
    search: z.string().optional(),
  }),
  async (req, res) => {
    const { projectId, page, limit, search } = req.body;
    const offset = (page - 1) * limit;
    const data = await u
      .db("o_novel")
      .where("projectId", projectId)
      .select("id", "chapterIndex as index", "chapterOrder", "sectionOrder", "reel", "chapter", "section", "chapterData", "event", "eventState", "errorReason")
      .andWhere((qb) => {
        if (search) {
          qb.where("chapter", "like", `%${search}%`);
        }
      })
      .orderByRaw("COALESCE(chapterOrder, chapterIndex, id) asc")
      .orderByRaw("COALESCE(sectionOrder, 0) asc")
      .orderBy("id", "asc")
      .limit(limit)
      .offset(offset);

    // 统计总数
    const totalQuery = (await u
      .db("o_novel")
      .where("projectId", projectId)
      .andWhere((qb) => {
        if (search) {
          qb.where("chapter", "like", `%${search}%`);
        }
      })
      .count("* as total")
      .first()) as any;

    res.status(200).send(success({ data, total: totalQuery.total }));
  },
);
