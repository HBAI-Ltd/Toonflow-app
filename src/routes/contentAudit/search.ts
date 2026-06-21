import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { searchGenerationSegments } from "@/utils/contentAudit";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number().optional(),
    query: z.string().min(1),
    artifactType: z.string().optional(),
    limit: z.number().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await searchGenerationSegments(req.body)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
