import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { retryQueueJob } from "@/utils/genQueue";

const router = express.Router();

// 手动重排失败的生成队列任务
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    const job = await u.db("o_genQueue").where("id", id).first();
    if (!job) return res.status(400).send(error("队列任务不存在"));

    const ok = await retryQueueJob(id);
    if (!ok) return res.status(400).send(error(`仅「失败」状态的任务可重排，当前状态：${job.state}`));
    return res.status(200).send(success({ id, message: "已重新排队" }));
  },
);
