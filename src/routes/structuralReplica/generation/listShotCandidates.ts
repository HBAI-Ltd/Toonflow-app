import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { listShotCandidates } from "@/services/structuralReplica/generationQueueService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    shotId: z.string().min(1).optional(),
  }),
  async (req, res) => {
    res.status(200).send(success({ candidates: await listShotCandidates(req.body.taskId, req.body.shotId) }));
  },
);
