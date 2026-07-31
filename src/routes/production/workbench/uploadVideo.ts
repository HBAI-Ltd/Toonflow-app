import express from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

const videoMimeExtensions: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    trackId: z.number(),
    base64Data: z.string(),
  }),
  async (req, res) => {
    const { projectId, scriptId, trackId, base64Data } = req.body;
    const videoMatch = base64Data.match(/^data:(video\/[^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!videoMatch) return res.status(400).send(error("视频数据格式无效"));

    const extension = videoMimeExtensions[videoMatch[1]];
    if (!extension) return res.status(400).send(error("仅支持 MP4、WebM、MOV 或 MKV 视频"));

    const track = await u.db("o_videoTrack").where({ id: trackId, projectId, scriptId }).first();
    if (!track) return res.status(404).send(error("未找到对应的视频轨道"));

    const fileBuffer = Buffer.from(videoMatch[2].replace(/\s/g, ""), "base64");
    if (!fileBuffer.length) return res.status(400).send(error("上传的视频为空"));

    const videoPath = `/${projectId}/video/${uuidv4()}.${extension}`;
    await u.oss.writeFile(videoPath, fileBuffer);

    const [videoId] = await u.db("o_video").insert({
      filePath: videoPath,
      time: Date.now(),
      state: "已完成",
      scriptId,
      projectId,
      videoTrackId: trackId,
    });
    await u.db("o_videoTrack").where({ id: trackId, projectId, scriptId }).update({
      videoId,
    });

    res.status(200).send(
      success({
        id: videoId,
        src: await u.oss.getFileUrl(videoPath),
        state: "已完成",
      }),
    );
  },
);
