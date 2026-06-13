import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
const router = express.Router();
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// 根据 base64 头部获取文件扩展名
function getExtFromBase64(base64Data: string): string {
  const mime = base64Data.match(/^data:([^;]+);base64,/)?.[1] ?? "";
  const mimeMap: Record<string, string> = {
    // 图片
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    // 音频
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    // 视频
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return mimeMap[mime] ?? "";
}

// 文件上传（支持图片、音频、视频）
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    base64Data: z.string(),
    type: z.string().optional().default("clip"),
    name: z.string(),
  }),
  async (req, res) => {
    const { base64Data, projectId, type = "clip", name } = req.body;
    const ext = getExtFromBase64(base64Data);
    if (!ext) return res.status(400).send(error("不支持的文件类型"));
    const base64Match = base64Data.match(/^data:[^;]+;base64,([A-Za-z0-9+/=]+)$/);
    if (!base64Match) return res.status(400).send(error("文件数据格式错误"));
    const buffer = Buffer.from(base64Match[1], "base64");
    if (buffer.length > MAX_UPLOAD_BYTES) return res.status(400).send(error("文件超过大小上限"));
    const savePath = `/${projectId}/assets/${uuid()}.${ext}`;

    await u.oss.writeFile(savePath, buffer);
    const [id] = await u.db("o_assets").insert({
      type: type,
      projectId: projectId,
      name,
      startTime: Date.now(),
    });
    const [imageId] = await u.db("o_image").insert({
      filePath: savePath,
      type,
      assetsId: id,
      state: "已完成",
    });
    await u.db("o_assets").where("id", id).update({
      imageId: imageId,
    });
    res.status(200).send(success("上传成功"));
  },
);
