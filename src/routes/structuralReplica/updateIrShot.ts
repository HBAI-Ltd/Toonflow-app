import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import {
  clearDerivedArtifactsFromStoryIr,
  getTaskBundle,
  getTaskOrThrow,
  saveStoryIr,
  updateTaskStatus,
} from "@/services/structuralReplica/repository";
import { AssetSlotSchema, StructuralIrSchema } from "@/services/structuralReplica/schemas";

const router = express.Router();

const PatchSchema = z.object({
  shotPurpose: z.string().optional(),
  sourceStructure: z.string().optional(),
  reusableStructure: z.string().optional(),
  shotSize: z.string().optional(),
  cameraAngle: z.string().optional(),
  cameraMotion: z.string().optional(),
  composition: z.string().optional(),
  requiredAssetSlots: z.array(AssetSlotSchema).optional(),
  enabled: z.boolean().optional(),
  reviewRequired: z.boolean().optional(),
  reviewReason: z.string().nullable().optional(),
});

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    shotId: z.string().min(1),
    patch: PatchSchema,
  }),
  async (req, res) => {
    const { taskId, shotId, patch } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      const allowedStatuses = ["ir_built", "dialogue_reviewed", "asset_gap_ready", "assets_bound"];
      if (!allowedStatuses.includes(task.status || "")) {
        return res.status(400).send(error(`task status must be ir_built or later editable stage before storyboard generation, got ${task.status}`));
      }

      const bundle = await getTaskBundle(taskId);
      if (!bundle.storyIr?.dataJson) return res.status(400).send(error("story IR not found"));

      const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
      const index = ir.shots.findIndex((shot) => shot.shotId === shotId);
      if (index < 0) return res.status(400).send(error(`shot not found: ${shotId}`));

      ir.shots[index] = {
        ...ir.shots[index],
        ...("shotPurpose" in patch ? { shotPurpose: patch.shotPurpose } : {}),
        ...("sourceStructure" in patch ? { sourceStructure: patch.sourceStructure } : {}),
        ...("reusableStructure" in patch ? { reusableStructure: patch.reusableStructure } : {}),
        ...("shotSize" in patch ? { shotSize: patch.shotSize } : {}),
        ...("cameraAngle" in patch ? { cameraAngle: patch.cameraAngle } : {}),
        ...("cameraMotion" in patch ? { cameraMotion: patch.cameraMotion } : {}),
        ...("composition" in patch ? { composition: patch.composition } : {}),
        ...("requiredAssetSlots" in patch ? { requiredAssetSlots: patch.requiredAssetSlots } : {}),
        ...("enabled" in patch ? { enabled: patch.enabled } : {}),
        ...("reviewRequired" in patch ? { reviewRequired: patch.reviewRequired } : {}),
        ...("reviewReason" in patch ? { reviewReason: patch.reviewReason || undefined } : {}),
      };

      const nextIr = StructuralIrSchema.parse(ir);
      await clearDerivedArtifactsFromStoryIr(taskId);
      const row = await saveStoryIr(taskId, nextIr);
      const updatedTask = task.status === "ir_built" ? task : await updateTaskStatus(taskId, "ir_built");
      res.status(200).send(success({ taskId, status: updatedTask.status, storyIrId: row.id, shot: nextIr.shots[index] }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
