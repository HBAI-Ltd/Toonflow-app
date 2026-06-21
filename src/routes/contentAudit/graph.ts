import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getGenerationAuditGraph } from "@/utils/contentAudit";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number().optional(),
    targetType: z.string().optional(),
    targetId: z.union([z.string(), z.number()]).optional(),
    artifactType: z.string().optional(),
    limit: z.number().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await getGenerationAuditGraph(req.body)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
