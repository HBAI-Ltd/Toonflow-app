import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { pushToProduction } from "@/services/structuralReplica/toonflowPusher";
import { getTaskOrThrow, updateTaskStatus } from "@/services/structuralReplica/repository";
import { createSrJob, getSrJob, runSrJob, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    createScript: z.boolean().default(true),
    scriptName: z.string().optional(),
  }),
  async (req, res) => {
    const { taskId, createScript = true, scriptName } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      if (task.status !== "checked" && task.status !== "pushed") {
        return res.status(400).send(error(`task status must be checked or pushed, got ${task.status}`));
      }

      const job = await createSrJob({ taskId, jobType: "pushToProduction", input: { taskId, createScript, scriptName }, stage: "queued" });
      const result = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 25, stage: "pushing_to_production" });
          const pushed = await pushToProduction({ taskId, createScript, scriptName });
          await report({ progress: 85, stage: "updating_task_status" });
          const updatedTask = task.status === "checked" ? await updateTaskStatus(taskId, "pushed") : task;
          return { taskId, status: updatedTask.status, ...pushed };
        },
        "pushing_to_production",
      );
      const finishedJob = await getSrJob(Number(job.id));
      res.status(200).send(success({ ...result, job: serializeSrJob(finishedJob) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
