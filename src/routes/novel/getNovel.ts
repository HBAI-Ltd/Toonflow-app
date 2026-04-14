import express from "express";
import db from "@/utils/db";
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
    const data = await db("o_novel")
      .where("projectId", projectId)
      .select("id", "chapterIndex as index", "reel", "chapter", "chapterData", "event", "eventState", "errorReason")
      .andWhere((qb) => {
        if (search) {
          qb.where("chapter", "like", `%${search}%`);
        }
      })
      .orderBy("chapterIndex", "asc")
      .limit(limit)
      .offset(offset);

    const totalQuery = (await db("o_novel")
      .where("projectId", projectId)
      .andWhere((qb) => {
        if (search) {
          qb.where("chapter", "like", `%${search}%`);
        }
      })
      .count("* as total")
      .first()) as any;

    return res.status(200).send(success({ data, total: totalQuery.total }));
  },
);
