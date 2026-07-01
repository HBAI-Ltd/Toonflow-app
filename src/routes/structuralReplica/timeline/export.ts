import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { composeTimeline } from "@/services/structuralReplica/timelineComposer";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    subtitleMode: z.enum(["none", "burn", "track"]).optional(),
    dryRun: z.boolean().optional(),
    expiresInDays: z.number().int().positive().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ export: await composeTimeline(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
