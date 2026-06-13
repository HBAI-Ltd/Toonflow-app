import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    trackId: z.number().int(),
    videoId: z.number().int(),
  }),
  async (req, res) => {
    const { trackId, videoId } = req.body;
    const track = await u.db("o_videoTrack").where("id", trackId).select("id", "projectId", "scriptId").first();
    if (!track) return res.status(400).send(error("分镜轨道不存在"));

    const video = await u.db("o_video").where("id", videoId).select("id", "projectId", "scriptId", "state").first();
    if (!video) return res.status(400).send(error("视频不存在"));
    if (video.projectId !== track.projectId || video.scriptId !== track.scriptId) {
      return res.status(400).send(error("视频与分镜轨道不属于同一项目或剧集"));
    }
    if (video.state !== "生成成功") return res.status(400).send(error("只能选择已生成成功的视频"));

    await u.db("o_videoTrack").where("id", trackId).update({
      videoId: videoId,
    });
    res.status(200).send(success({ message: "视频选择成功" }));
  },
);
