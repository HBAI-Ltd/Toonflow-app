import express from "express";
import u from "@/utils";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
const router = express.Router();

/**
 * 上传参考图片到塑景造角资产库
 * - 把 base64 图片写到 oss
 * - 在 o_image 表插入一条记录(type=clip, assetsId=绑定到指定主资产)
 * - 返回 imageId(供前端展示和绑定到 o_assetsRole2Image)
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    assetsId: z.number(),
    base64Data: z.string(),
  }),
  async (req, res) => {
    const { base64Data, projectId, assetsId } = req.body;
    // 解析扩展名
    const mime = base64Data.match(/^data:([^;]+);base64,/)?.[1] ?? "";
    const mimeMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = mimeMap[mime];
    if (!ext) return res.status(400).send(error("不支持的图片格式,仅支持 jpg/png/webp"));

    // 解析 base64
    const b64Match = base64Data.match(/base64,([A-Za-z0-9+/=]+)/);
    if (!b64Match) return res.status(400).send(error("base64 格式错误"));
    const buffer = Buffer.from(b64Match[1], "base64");

    // 写入 oss(放到 reference 子目录,与生成图分离)
    const fileName = `${uuid()}.${ext}`;
    const savePath = `/${projectId}/reference/${fileName}`;
    await u.oss.writeFile(savePath, buffer);

    // 插入 o_image 表(type=clip 表示用户上传,assetsId 关联到主资产)
    const [imageId] = await u.db("o_image").insert({
      filePath: savePath,
      type: "clip",
      state: "已完成",
      assetsId,
      model: "user_upload",
      resolution: "2K",
    });

    const url = await u.oss.getSmallImageUrl(savePath);
    res.status(200).send(success({ imageId, url, filePath: savePath }));
  },
);