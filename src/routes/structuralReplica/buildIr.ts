import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { buildStructuralIr } from "@/services/structuralReplica/structuralIrBuilder";
import { buildInitialDialogueStructure } from "@/services/structuralReplica/dialogueStructureService";
import {
  clearDerivedArtifactsFromStoryIr,
  getTaskBundle,
  getTaskOrThrow,
  saveDialogueStructure,
  saveStoryIr,
  updateTaskStatus,
} from "@/services/structuralReplica/repository";
import { createSrJob, getSrJob, runSrJob, serializeSrJob } from "@/services/structuralReplica/jobService";
import { ShotDetectionSchema } from "@/services/structuralReplica/schemas";

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
      const allowedStatuses = ["understanding_frames", "ir_built", "dialogue_reviewed", "asset_gap_ready", "assets_bound"];
      if (!allowedStatuses.includes(task.status || "")) {
        return res.status(400).send(error(`task status must be understanding_frames or later editable stage, got ${task.status}`));
      }

      const bundle = await getTaskBundle(taskId);
      const shotDetection = bundle.shotDetection?.dataJson ? ShotDetectionSchema.parse(JSON.parse(bundle.shotDetection.dataJson)) : null;
      const shotCount = shotDetection?.shots.length || 0;
      if (shotCount > 0 && bundle.frameUnderstanding.length < shotCount) {
        return res
          .status(400)
          .send(error(`frame understanding is incomplete: ${bundle.frameUnderstanding.length}/${shotCount}. Wait for vision understanding to finish.`));
      }

      const job = await createSrJob({ taskId, jobType: "buildIr", input: { taskId }, stage: "queued" });
      const result = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 10, stage: "clearing_derived_artifacts" });
          await clearDerivedArtifactsFromStoryIr(taskId);
          await report({ progress: 35, stage: "building_ir" });
          const ir = await buildStructuralIr(taskId);
          const dialogueStructure = buildInitialDialogueStructure(ir);
          await report({ progress: 75, stage: "saving_ir" });
          const storyIrRow = await saveStoryIr(taskId, ir);
          const dialogueRow = await saveDialogueStructure(taskId, dialogueStructure);
          const updatedTask = task.status === "ir_built" ? task : await updateTaskStatus(taskId, "ir_built");
          return {
            taskId,
            status: updatedTask.status,
            shotCount: ir.shots.length,
            storyIrId: storyIrRow.id,
            dialogueStructureId: dialogueRow.id,
          dialogueVersion: dialogueStructure.version,
          };
        },
        "building_ir",
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
