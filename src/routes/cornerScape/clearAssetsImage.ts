import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 批量清除资产关联的参考图片(用于塑景造角弹窗一键清空)
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
  }),
  async (req, res) => {
    const { assetsId } = req.body;
    await u.db("o_assetsRole2Image").where("assetsRoleId", assetsId).delete();
    res.status(200).send(success({ message: "清空参考图片成功" }));
  },
);