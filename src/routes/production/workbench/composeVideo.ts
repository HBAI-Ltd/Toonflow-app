import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueJob } from "@/utils/genQueue";
import type { ComposeVideoPayload } from "@/utils/composeHandlers";
import { assertTrackVideosAllowCompose } from "@/utils/videoReview";
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

    try {
      await assertTrackVideosAllowCompose({ projectId, scriptId, trackIds: uniqueTrackIds });
    } catch (e) {
      return res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }

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
