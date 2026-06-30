import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { normalizeStoryboardContinuityContract } from "@/utils/storyboardContinuity";
const router = express.Router();
interface Storyboard {
  id: number;
  track: string;
  src: string | null;
  associateAssetsIds: number[];
  duration: number;
  state: string;
}
export default router.post(
  "/",
  validateFields({
    prompt: z.string(),
    duration: z.number(),
    state: z.string(),
    videoDesc: z.string(),
    shouldGenerateImage: z.number(),
    src: z.string().nullable(),
    scriptId: z.number(),
    projectId: z.number(),
    continuityContract: z.any().optional(),
  }),
  async (req, res) => {
    const { prompt, duration, state, src, scriptId, projectId, videoDesc, shouldGenerateImage, continuityContract: rawContinuityContract } = req.body;
    const trackId = Date.now()
    const continuityContract = normalizeStoryboardContinuityContract(rawContinuityContract, {
      videoDesc,
      prompt,
      track: "主轨道",
      assets: [],
    });
    await u.db("o_videoTrack").insert({
      id: trackId,
      scriptId: scriptId,
      projectId,
    });
    const [id] = await u.db("o_storyboard").insert({
      prompt,
      duration,
      state,
      filePath: u.replaceUrl(src),
      trackId,
      videoDesc,
      shouldGenerateImage: src ? 1 : 0,
      continuityContract,
      scriptId: scriptId,
      projectId: projectId,
    });
    await recordGenerationArtifact({
      projectId,
      artifactType: "storyboardPrompt",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "prompt",
      title: `分镜 ${id} 图片提示词`,
      content: prompt,
      meta: { source: "manual:addStoryboard", scriptId },
    });
    await recordGenerationArtifact({
      projectId,
      artifactType: "storyboardContinuityContract",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "continuityContract",
      title: `分镜 ${id} 镜头连续性合同`,
      content: continuityContract,
      meta: { source: "manual:addStoryboard", scriptId },
    });
    await recordGenerationArtifact({
      projectId,
      artifactType: "storyboardVideoDesc",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "videoDesc",
      title: `分镜 ${id} 视频描述`,
      content: videoDesc,
      meta: { source: "manual:addStoryboard", scriptId },
    });
    return res.status(200).send(success({ id }));
  },
);
