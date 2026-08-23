import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    images: z.array(z.string()),
  }),
  async (req, res) => {
    const { images } = req.body;
    try {
      const resText = await u.Ai.Text("universalAi").invoke({
        // i18n-ignore — literal AI system prompt, not a user-facing string
        system: '请根据以下图片数据，提取出图片的画风提示词，用于生成图片时指定风格，要求简洁且具有艺术性,只需要画风提示词，不需要其他内容："比如：`(画风：2D动漫风格,2d animation style)`,`(画风：照片级真人超写实,photorealistic, lifelike, ultra detailed)`，`(画风：3D国创,Chinese 3D animation style)`等,如果图片风格无法描述，可以返回`无法描述`,多张图片时，只输出一个综合的画风提示词，要求包含所有图片的共同风格特征，输出格式必须严格按照示例中的格式，必须包含`画风`二字，且必须使用括号括起来，括号内必须包含中文和英文的画风描述，并用逗号分隔，英文部分需要翻译成地道的英文提示词',
        messages: [
          {
            role: "user",
            content: [
              ...images.map((image: string) => ({
                type: "image" as const,
                image,
              })),
            ],
          },
        ],
      });
      res.status(200).send(success(resText.text));
    } catch (e) {
      const err = u.error(e);
      res.status(500).send({ message: err.message });
    }
  },
);
