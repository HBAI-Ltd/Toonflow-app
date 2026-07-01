import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { buildShotAdaptations } from "@/services/structuralReplica/shotAdaptationService";
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
      const job = await createSrJob({ taskId, jobType: "shotAdaptation", input: { taskId } });
      const adaptations = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 20, stage: "evaluating_asset_match" });
          const result = await buildShotAdaptations(taskId);
          await report({ progress: 90, stage: "saving_adaptations" });
          return { taskId, count: result.length, blocked: result.filter((item) => item.adaptationLevel === "D").length };
        },
        "building_shot_adaptations",
      );
      const finishedJob = await getSrJob(Number(job.id));
      res.status(200).send(success({ ...adaptations, job: serializeSrJob(finishedJob) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
