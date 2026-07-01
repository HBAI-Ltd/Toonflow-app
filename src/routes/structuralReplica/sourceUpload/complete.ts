import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { completeUpload } from "@/services/structuralReplica/sourceUploadService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    uploadId: z.string().min(1),
    totalParts: z.number().int().positive(),
  }),
  async (req, res) => {
    try {
      const result = await completeUpload(req.body);
      res.status(200).send(success(result));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
