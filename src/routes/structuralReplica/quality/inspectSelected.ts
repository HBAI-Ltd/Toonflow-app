import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { inspectAndSaveCandidate } from "@/services/structuralReplica/qualityGuardService";
import { getTaskBundle } from "@/services/structuralReplica/repository";
import { StructuralIrSchema } from "@/services/structuralReplica/schemas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    try {
      const bundle = await getTaskBundle(req.body.taskId);
      if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
      const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
      const reports = [];
      for (const candidate of bundle.generationCandidates.filter((item) => item.selected === 1)) {
        const shot = ir.shots.find((item) => item.shotId === candidate.shotId);
        if (!shot) continue;
        reports.push(
          await inspectAndSaveCandidate({
            taskId: req.body.taskId,
            candidateId: Number(candidate.id),
            expectedDurationSec: shot.durationSec,
            expectedAspectRatio: bundle.task.aspectRatio || "9:16",
          }),
        );
      }
      res.status(200).send(success({ reports }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
