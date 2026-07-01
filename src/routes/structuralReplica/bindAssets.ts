import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { bindAssets } from "@/services/structuralReplica/assetBindingService";
import { AssetBindingSchema, AssetSlotSchema, StructuralIrSchema } from "@/services/structuralReplica/schemas";
import { clearDerivedArtifactsFromAssetBindings, getTaskBundle, getTaskOrThrow, updateTaskStatus } from "@/services/structuralReplica/repository";
import { missingRequiredBindings } from "@/services/structuralReplica/videoDescRenderer";

const router = express.Router();

const BindingSchema = z.object({
  shotId: z.string().min(1).optional(),
  shotIds: z.array(z.string().min(1)).optional(),
  slotName: z.string().min(1),
  slotType: AssetSlotSchema.shape.type,
  assetId: z.number().int().positive().nullable().optional(),
  bindingStatus: z.enum(["missing", "bound", "cleared"]).optional(),
  note: z.string().nullable().optional(),
});

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    bindings: z.array(BindingSchema).default([]),
  }),
  async (req, res) => {
    const { taskId, bindings } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      if (task.status !== "asset_gap_ready" && task.status !== "assets_bound") {
        return res.status(400).send(error(`task status must be asset_gap_ready or assets_bound, got ${task.status}`));
      }

      const result = await bindAssets(taskId, bindings);
      await clearDerivedArtifactsFromAssetBindings(taskId);
      const bundle = await getTaskBundle(taskId);
      const ir = bundle.storyIr?.dataJson ? StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson)) : null;
      const parsedBindings = result.map((binding) => AssetBindingSchema.parse(binding));
      const missing = (ir?.shots || [])
        .filter((shot) => shot.enabled)
        .flatMap((shot) => missingRequiredBindings(shot, parsedBindings).map((slot) => ({ shotId: shot.shotId, slot })));
      const updatedTask =
        task.status === "asset_gap_ready" && missing.length === 0
          ? await updateTaskStatus(taskId, "assets_bound")
          : task.status === "assets_bound" && missing.length > 0
            ? await updateTaskStatus(taskId, "asset_gap_ready")
            : task;
      res.status(200).send(success({ taskId, status: updatedTask.status, bindings: result, missing }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
