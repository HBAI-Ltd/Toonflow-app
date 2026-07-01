import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { initUpload } from "@/services/structuralReplica/sourceUploadService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    fileName: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    mimeType: z.string().min(1),
    sha256: z.string().optional(),
  }),
  async (req, res) => {
    try {
      const result = await initUpload(req.body);
      res.status(200).send(success(result));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
