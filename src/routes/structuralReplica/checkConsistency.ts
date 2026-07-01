import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { checkConsistency } from "@/services/structuralReplica/consistencyGuard";
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
      if (task.status !== "storyboard_generated" && task.status !== "checked") {
        return res.status(400).send(error(`task status must be storyboard_generated or checked, got ${task.status}`));
      }

      const job = await createSrJob({ taskId, jobType: "checkConsistency", input: { taskId }, stage: "queued" });
      const result = await runSrJob(
        Number(job.id),
        async (jobReport) => {
          await jobReport({ progress: 30, stage: "checking_consistency" });
          const report = await checkConsistency(taskId);
          await jobReport({ progress: 80, stage: "updating_task_status" });
          const updatedTask = task.status === "storyboard_generated" ? await updateTaskStatus(taskId, "checked") : task;
          return {
            taskId,
            status: updatedTask.status,
            reportStatus: report.status,
            blockerCount: report.issues.filter((issue) => issue.level === "blocker").length,
            warningCount: report.issues.filter((issue) => issue.level === "warning").length,
            issues: report.issues,
          };
        },
        "checking_consistency",
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
