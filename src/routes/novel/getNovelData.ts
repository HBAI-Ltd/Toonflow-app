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
  }),
  async (req, res) => {
    const { projectId } = req.body;
    const data = await u
      .db("o_novel")
      .where("projectId", projectId)
      .select("*", "chapterIndex as index")
      .orderByRaw("COALESCE(chapterOrder, chapterIndex, id) asc")
      .orderByRaw("COALESCE(sectionOrder, 0) asc")
      .orderBy("id", "asc");
    res.status(200).send(success(data));
  },
);
