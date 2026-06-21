import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { id } from "zod/locales";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    prompt: z.string(),
    videoDesc: z.string(),
  }),
  async (req, res) => {
    const { id, prompt, videoDesc } = req.body;
    const storyboard = await u.db("o_storyboard").where({ id }).select("projectId", "scriptId").first();
    await u.db("o_storyboard").where({ id }).update({
      prompt,
      videoDesc,
    });
    await recordGenerationArtifact({
      projectId: storyboard?.projectId ?? null,
      artifactType: "storyboardPrompt",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "prompt",
      title: `分镜 ${id} 图片提示词`,
      content: prompt,
      meta: { source: "manual:editStoryboardInfo", scriptId: storyboard?.scriptId },
    });
    await recordGenerationArtifact({
      projectId: storyboard?.projectId ?? null,
      artifactType: "storyboardVideoDesc",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "videoDesc",
      title: `分镜 ${id} 视频描述`,
      content: videoDesc,
      meta: { source: "manual:editStoryboardInfo", scriptId: storyboard?.scriptId },
    });
    res.status(200).send(success({ message: "更新提示词成功" }));
  },
);
