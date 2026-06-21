import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();
const MAX_STORYBOARD_FIELD_LENGTH = 2000;

/** 更新分镜的结构化信息（台词/音效/景别/运镜） */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
    storyboardId: z.number().int(),
    dialogue: z.string().max(MAX_STORYBOARD_FIELD_LENGTH).optional(),
    soundEffect: z.string().max(MAX_STORYBOARD_FIELD_LENGTH).optional(),
    shotType: z.string().max(MAX_STORYBOARD_FIELD_LENGTH).optional(),
    cameraMovement: z.string().max(MAX_STORYBOARD_FIELD_LENGTH).optional(),
  }),
  async (req, res) => {
    const { projectId, scriptId, storyboardId, dialogue, soundEffect, shotType, cameraMovement } = req.body as {
      projectId: number;
      scriptId: number;
      storyboardId: number;
      dialogue?: string;
      soundEffect?: string;
      shotType?: string;
      cameraMovement?: string;
    };

    const update: Record<string, string> = {};
    if (dialogue !== undefined) update.dialogue = dialogue;
    if (soundEffect !== undefined) update.soundEffect = soundEffect;
    if (shotType !== undefined) update.shotType = shotType;
    if (cameraMovement !== undefined) update.cameraMovement = cameraMovement;
    if (!Object.keys(update).length) return res.status(400).send(error("没有需要更新的字段"));

    const count = await u.db("o_storyboard").where({ id: storyboardId, projectId, scriptId }).update(update);
    if (!count) return res.status(400).send(error("分镜不存在"));
    await Promise.all(
      Object.entries(update).map(([field, content]) =>
        recordGenerationArtifact({
          projectId,
          artifactType: "manual",
          targetType: "o_storyboard",
          targetId: storyboardId,
          targetField: field,
          title: `分镜 ${storyboardId} ${field}`,
          content,
          meta: { source: "manual:updateStoryboardInfo", scriptId },
        }),
      ),
    );

    res.status(200).send(success({ message: "分镜信息更新成功" }));
  },
);
