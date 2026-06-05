import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { tool, jsonSchema } from "ai";
const router = express.Router();

// 检查语言模型
export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    id: z.string(),
    imageBase64: z.string().optional(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { modelName, imageBase64, id, prompt } = req.body;

    try {
      const vendorConfigData = await u.db("o_vendorConfig").where("id", id).first();

      if (!vendorConfigData) return res.status(500).send(error("未找到该供应商配置"));
      if (!vendorConfigData.models) return res.status(500).send(error("未找到模型列表"));

      const reqFn = await u.Ai.Image(`${id}:${modelName}`).run({
        prompt: prompt,
        ...(imageBase64 ? { referenceList: [{ type: "image", base64: imageBase64 }] } : {}), //输入的图片提示词
        size: "1K", // 图片尺寸
        aspectRatio: "16:9",
      });
      await reqFn.save("testImage.jpg");
      const resultUrl = await u.oss.getFileUrl("testImage.jpg");
      res.status(200).send(success(resultUrl));
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
