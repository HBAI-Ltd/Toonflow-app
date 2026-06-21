import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { snapshotTargetContent } from "@/utils/contentAudit";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number().optional(),
    artifactType: z.string(),
    targetType: z.string(),
    targetId: z.union([z.string(), z.number()]),
    targetField: z.string(),
    title: z.string().optional(),
    note: z.string().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await snapshotTargetContent({ ...req.body, meta: req.body.note ? { note: req.body.note } : null })));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
