import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueJob } from "@/utils/genQueue";
import type { ComposeVideoPayload } from "@/utils/composeHandlers";
const router = express.Router();
const MAX_COMPOSE_TRACKS = 20;

/**
 * 单镜头成片合成：选定视频 + 可选 TTS 配音 + 烧录台词字幕
 * 任务进入持久化生成队列，进度通过 getComposeList 轮询
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
    trackIds: z.array(z.number().int()).min(1).max(MAX_COMPOSE_TRACKS),
    ttsModel: z.string().optional(),
    voice: z.string().optional(),
  }),
  async (req, res) => {
    const { projectId, scriptId, trackIds, ttsModel, voice } = req.body as {
      projectId: number;
      scriptId: number;
      trackIds: number[];
      ttsModel?: string;
      voice?: string;
    };
    const uniqueTrackIds = [...new Set(trackIds)];

    // 校验各轨道均属于当前项目/剧集，且已选定同项目/同剧集的视频
    const tracks = await u
      .db("o_videoTrack")
      .whereIn("id", uniqueTrackIds)
      .where({ projectId, scriptId })
      .select("id", "videoId");
    const trackMap = new Map(tracks.map((t) => [t.id!, t]));
    const missingTracks = uniqueTrackIds.filter((id) => !trackMap.has(id));
    if (missingTracks.length) return res.status(400).send(error(`以下分镜轨道不属于当前项目或剧集：${missingTracks.join("、")}`));

    const noVideo = uniqueTrackIds.filter((id) => !trackMap.get(id)?.videoId);
    if (noVideo.length) return res.status(400).send(error(`以下分镜轨道尚未选定视频：${noVideo.join("、")}`));

    const videoIds = tracks.map((t) => t.videoId!).filter((id): id is number => typeof id === "number");
    const videos = await u.db("o_video").whereIn("id", videoIds).where({ projectId, scriptId }).select("id", "state", "filePath");
    const videoMap = new Map(videos.map((v) => [v.id!, v]));
    const invalidVideos = tracks
      .filter((t) => {
        const video = t.videoId != null ? videoMap.get(t.videoId) : null;
        return !video?.filePath || video.state !== "生成成功";
      })
      .map((t) => t.id!);
    if (invalidVideos.length) return res.status(400).send(error(`以下分镜轨道选定的视频无效或未生成成功：${invalidVideos.join("、")}`));

    const composeIds: number[] = [];
    for (const trackId of uniqueTrackIds) {
      const [composeId] = await u.db("o_videoCompose").insert({
        projectId,
        scriptId,
        trackId,
        state: "合成中",
        createTime: Date.now(),
      });
      composeIds.push(composeId);

      const payload: ComposeVideoPayload = {
        composeId,
        projectId,
        scriptId,
        trackId,
        ttsModel: ttsModel ?? null,
        voice: voice ?? null,
      };
      await enqueueJob({
        projectId,
        kind: "composeVideo",
        payload: payload as unknown as Record<string, unknown>,
        vendorId: "ffmpeg",
      });
    }

    res.status(200).send(success({ composeIds, message: "合成任务已加入队列" }));
  },
);
