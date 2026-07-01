import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { requestCancelSrJob, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    jobId: z.number().int().positive(),
  }),
  async (req, res) => {
    try {
      const job = await requestCancelSrJob(req.body.jobId);
      res.status(200).send(success({ job: serializeSrJob(job) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
