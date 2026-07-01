import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { analyzeAssetGaps } from "@/services/structuralReplica/assetGapAnalyzer";
import { clearDerivedArtifactsFromAssetBindings, getTaskOrThrow, saveAssetGap, updateTaskStatus } from "@/services/structuralReplica/repository";
import { createSrJob, getSrJob, runSrJob, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    const { taskId } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      const allowedStatuses = ["ir_built", "dialogue_reviewed", "asset_gap_ready", "assets_bound"];
      if (!allowedStatuses.includes(task.status || "")) {
        return res.status(400).send(error(`task status must be ir_built or later asset stage, got ${task.status}`));
      }

      const job = await createSrJob({ taskId, jobType: "assetGap", input: { taskId }, stage: "queued" });
      const result = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 15, stage: "clearing_asset_bindings" });
          await clearDerivedArtifactsFromAssetBindings(taskId);
          await report({ progress: 45, stage: "analyzing_asset_gaps" });
          const assetGap = await analyzeAssetGaps(taskId);
          await report({ progress: 80, stage: "saving_asset_gaps" });
          const row = await saveAssetGap(taskId, assetGap);
          const updatedTask = task.status === "ir_built" || task.status === "dialogue_reviewed" ? await updateTaskStatus(taskId, "asset_gap_ready") : task;
          return {
            taskId,
            status: updatedTask.status,
            assetGapId: row.id,
            missingCount: assetGap.missingCount,
            items: assetGap.items,
          };
        },
        "analyzing_asset_gaps",
      );
      const finishedJob = await getSrJob(Number(job.id));

      res.status(200).send(
        success({
          ...result,
          job: serializeSrJob(finishedJob),
        }),
      );
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
