import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 从抽卡候选中选定一张作为资产正式图（覆盖自动选优结果）
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
    imageId: z.number(),
  }),
  async (req, res) => {
    const { assetsId, imageId } = req.body;

    const image = await u.db("o_image").where("id", imageId).where("assetsId", assetsId).first();
    if (!image) return res.status(400).send(error("候选图不存在或不属于该资产"));
    if (image.state !== "已完成" || !image.filePath) return res.status(400).send(error("候选图未生成完成，无法选定"));

    if (image.batchId) {
      await u.db("o_image").where("batchId", image.batchId).update({ selected: 0 });
    }
    await u.db("o_image").where("id", imageId).update({ selected: 1 });
    await u.db("o_assets").where("id", assetsId).update({ imageId });

    const path = await u.oss.getSmallImageUrl(image.filePath);
    return res.status(200).send(success({ assetsId, imageId, path }));
  },
);
