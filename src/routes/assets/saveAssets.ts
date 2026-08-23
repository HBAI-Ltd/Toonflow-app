import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { stat } from "original-fs";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 保存资产图片
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    projectId: z.number(),
    base64: z.string().optional().nullable(),
    type: z.enum(["role", "scene", "tool"]),
    prompt: z.string().optional().nullable(),
    imageId: z.number().optional().nullable(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, base64, type, prompt, projectId, imageId } = req.body;
    if (base64) {
      //自定义上传选择的图片
      const matches = base64.match(/^data:image\/\w+;base64,(.+)$/);
      const realBase64 = matches ? matches[1] : base64;
      // 生成新的图片路径
      const savePath = `/${projectId}/${type}/${uuidv4()}.png`;
      // 写入文件
      await u.oss.writeFile(savePath, Buffer.from(realBase64, "base64"));
      // 插入图片表
      const [idData] = await u.db("o_image").insert({
        assetsId: id,
        filePath: savePath,
        type: type,
        state: "已完成", // i18n-ignore — stored o_image.state enum value, not user-facing text
      });
      // 更新资产表图片为新图片
      await u
        .db("o_assets")
        .where("id", id)
        .update({
          prompt: prompt ?? "",
          imageId: idData,
        });
    } else {
      await u
        .db("o_assets")
        .where("id", id)
        .update({
          prompt: prompt ?? "",
          imageId: imageId,
        });
    }
    res.status(200).send(success({ message: t("assets.saveAssets.saved", {}, locale) }));
  },
);
