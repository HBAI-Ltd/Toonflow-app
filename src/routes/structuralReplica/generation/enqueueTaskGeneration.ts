import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueTaskGeneration } from "@/services/structuralReplica/generationQueueService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    candidateCount: z.number().int().positive().max(4).optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ results: await enqueueTaskGeneration(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
