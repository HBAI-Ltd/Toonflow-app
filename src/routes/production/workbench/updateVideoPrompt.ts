import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    prompt: z.string().optional(),
  }),
  async (req, res) => {
    const { id, prompt, duration } = req.body;
    const track = await u.db("o_videoTrack").where("id", id).select("projectId", "scriptId").first();
    await u.db("o_videoTrack").where("id", id).update({
      prompt,
    });
    if (prompt !== undefined) {
      await recordGenerationArtifact({
        projectId: track?.projectId ?? null,
        artifactType: "videoPrompt",
        targetType: "o_videoTrack",
        targetId: id,
        targetField: "prompt",
        title: `视频轨道 ${id} 提示词`,
        content: prompt,
        meta: { source: "manual:updateVideoPrompt", scriptId: track?.scriptId },
      });
    }
    res.status(200).send(success("更新成功"));
  },
);
