import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { selectShotCandidate } from "@/services/structuralReplica/generationQueueService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    shotId: z.string().min(1),
    candidateId: z.number().int().positive(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ candidate: await selectShotCandidate(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
