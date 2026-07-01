import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { clearDerivedArtifactsFromFrameUnderstanding, getTaskOrThrow, updateTaskStatus } from "@/services/structuralReplica/repository";
import { runFrameUnderstanding } from "@/services/structuralReplica/frameUnderstandingService";
import { createSrJob, getActiveSrJob, runSrJobInBackground, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();
const runningTasks = new Set<number>();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    const { taskId } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      const allowedStatuses = ["sampling_frames", "understanding_frames", "ir_built", "dialogue_reviewed", "asset_gap_ready", "assets_bound", "failed"];
      if (!allowedStatuses.includes(task.status || "")) {
        return res.status(400).send(error(`task status must be sampling_frames or later editable stage, got ${task.status}`));
      }

      const activeJob = await getActiveSrJob(taskId, "vision");
      if (runningTasks.has(taskId) || activeJob) {
        return res.status(200).send(success({ taskId, status: task.status, started: true, running: true, job: serializeSrJob(activeJob) }));
      }

      const updatedTask = task.status === "understanding_frames" ? task : await updateTaskStatus(taskId, "understanding_frames");
      await clearDerivedArtifactsFromFrameUnderstanding(taskId);
      const job = await createSrJob({ taskId, jobType: "vision", input: { taskId }, stage: "queued" });
      runningTasks.add(taskId);
      runSrJobInBackground(
        job,
        async (report) => {
          const result = await runFrameUnderstanding(taskId, report);
          return { total: result.total, reviewRequiredCount: result.reviewRequiredCount };
        },
        "vision_preparing",
        async (e) => {
          runningTasks.delete(taskId);
          if (!e) return;
          try {
            await updateTaskStatus(taskId, "failed", e instanceof Error ? e.message : String(e));
          } catch (statusError) {
            console.error("[structuralReplica:runFrameUnderstanding:status]", statusError);
          }
        },
      );

      res.status(200).send(
        success({
          taskId,
          status: updatedTask.status,
          started: true,
          running: true,
          job: serializeSrJob(job),
        }),
      );
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
