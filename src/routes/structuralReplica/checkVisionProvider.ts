import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { checkVisionProvider } from "@/services/structuralReplica/visionProbeService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    providerId: z.string().optional(),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    model: z.string().optional(),
    timeoutMs: z.number().int().positive().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await checkVisionProvider(req.body)));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
