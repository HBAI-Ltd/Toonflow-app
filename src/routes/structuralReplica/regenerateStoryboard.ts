import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { regenerateStoryboard } from "@/services/structuralReplica/storyboardRegenerator";
import { getTaskOrThrow, updateTaskStatus } from "@/services/structuralReplica/repository";
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
      if (task.status !== "assets_bound" && task.status !== "storyboard_generated" && task.status !== "checked") {
        return res.status(400).send(error(`task status must be assets_bound or later storyboard stage, got ${task.status}`));
      }

      const job = await createSrJob({ taskId, jobType: "regenerateStoryboard", input: { taskId }, stage: "queued" });
      const result = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 30, stage: "regenerating_storyboard" });
          const storyboard = await regenerateStoryboard(taskId);
          await report({ progress: 85, stage: "updating_task_status" });
          const updatedTask = task.status === "assets_bound" ? await updateTaskStatus(taskId, "storyboard_generated") : task;
          return { taskId, status: updatedTask.status, version: storyboard.version, shots: storyboard.rows.length, rows: storyboard.rows };
        },
        "regenerating_storyboard",
      );
      const finishedJob = await getSrJob(Number(job.id));
      res.status(200).send(success({ ...result, job: serializeSrJob(finishedJob) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
