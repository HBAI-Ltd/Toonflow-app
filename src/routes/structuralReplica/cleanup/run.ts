import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { cleanupStructuralReplicaArtifacts } from "@/services/structuralReplica/cleanupService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    dryRun: z.boolean().optional(),
    olderThanMs: z.number().int().positive().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ cleanup: await cleanupStructuralReplicaArtifacts(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
