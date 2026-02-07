import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 获取模型使用历史（用于 AutoComplete 下拉选择）
export default router.post(
  "/",
  validateFields({
    userId: z.number(),
  }),
  async (req, res) => {
    const { userId } = req.body;
    const list = await u
      .db("t_model_history")
      .where({ userId })
      .orderBy("lastUsedTime", "desc")
      .select("modelId", "type", "manufacturer", "baseUrl");

    res.status(200).send(success(list));
  },
);
