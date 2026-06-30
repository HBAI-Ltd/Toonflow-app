import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { id } from "zod/locales";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { normalizeStoryboardContinuityContract } from "@/utils/storyboardContinuity";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    prompt: z.string(),
    videoDesc: z.string(),
    continuityContract: z.any().optional(),
  }),
  async (req, res) => {
    const { id, prompt, videoDesc, continuityContract: rawContinuityContract } = req.body;
    const storyboard = await u.db("o_storyboard").where({ id }).select("projectId", "scriptId", "track").first();
    const assetIds = await u.db("o_assets2Storyboard").where("storyboardId", id).orderBy("rowid").select("assetId").pluck("assetId");
    const associatedAssets = assetIds.length
      ? await u.db("o_assets").whereIn("id", assetIds).select("id", "type", "name", "remark", "prompt", "describe")
      : [];
    const continuityContract = normalizeStoryboardContinuityContract(rawContinuityContract, {
      videoDesc,
      prompt,
      track: storyboard?.track,
      assets: associatedAssets,
    });
    await u.db("o_storyboard").where({ id }).update({
      prompt,
      videoDesc,
      continuityContract,
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
      artifactType: "storyboardContinuityContract",
      targetType: "o_storyboard",
      targetId: id,
      targetField: "continuityContract",
      title: `分镜 ${id} 镜头连续性合同`,
      content: continuityContract,
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
