import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { deleteStoryboards } from "@/lib/storyboard";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { ids, projectId } = req.body;
    if (!ids.length) return res.status(400).send(error("请先选择分镜"));
    const result = await deleteStoryboards({ ids, projectId }, u.db);
    if (!result.deletedCount) return res.status(400).send(error("当前选择分镜不存在"));
    res.status(200).send(
      success({
        message: "分镜删除成功",
        deletedIds: result.deletedIds,
        deletedCount: result.deletedCount,
      }),
    );
  },
);
