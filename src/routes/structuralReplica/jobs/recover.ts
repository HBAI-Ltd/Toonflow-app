import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recoverStaleSrJobs } from "@/services/structuralReplica/jobService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    staleAfterMs: z.number().int().positive().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await recoverStaleSrJobs({ staleAfterMs: req.body.staleAfterMs })));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
