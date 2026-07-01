import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { inspectAndSaveCandidate } from "@/services/structuralReplica/qualityGuardService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    candidateId: z.number().int().positive(),
    expectedDurationSec: z.number().positive(),
    expectedAspectRatio: z.string().min(1),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ report: await inspectAndSaveCandidate(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
