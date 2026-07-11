import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 更新资产关联的参考图片(用于塑景造角弹窗重新生图时作为参考图传入)
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
    imageIds: z.array(z.number()).optional(),
  }),
  async (req, res) => {
    const { assetsId, imageIds } = req.body;
    // 先清空旧绑定,再插入新绑定(整体替换语义)
    await u.db("o_assetsRole2Image").where("assetsRoleId", assetsId).delete();
    if (imageIds && imageIds.length) {
      const rows = imageIds.map((id) => ({ assetsRoleId: assetsId, assetsImageId: id }));
      await u.db("o_assetsRole2Image").insert(rows);
    }
    res.status(200).send(success({ message: "更新参考图片成功" }));
  },
);