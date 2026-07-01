import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { routeModelsForTask } from "@/services/structuralReplica/modelGateway/modelRouter";
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
      const job = await createSrJob({ taskId, jobType: "modelRouting", input: { taskId } });
      const result = await runSrJob(
        Number(job.id),
        async (report) => {
          await report({ progress: 20, stage: "syncing_provider_capabilities" });
          const routes = await routeModelsForTask(taskId);
          await report({ progress: 90, stage: "saving_model_routes" });
          return {
            taskId,
            count: routes.length,
            blocked: routes.filter((route) => route.routeStatus === "blocked").length,
            degraded: routes.filter((route) => route.routeStatus === "degraded").length,
            routes,
          };
        },
        "routing_models",
      );
      const finishedJob = await getSrJob(Number(job.id));
      res.status(200).send(success({ ...result, job: serializeSrJob(finishedJob) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
