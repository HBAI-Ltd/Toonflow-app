import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { saveChunk } from "@/services/structuralReplica/sourceUploadService";

const router = express.Router();

const QuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
  uploadId: z.string().min(1),
  partIndex: z.coerce.number().int().nonnegative(),
});

export default router.post("/", express.raw({ type: "application/octet-stream", limit: "16mb" }), async (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).send(error("参数错误", parsed.error.issues));
  if (!Buffer.isBuffer(req.body)) return res.status(400).send(error("请求体必须是 application/octet-stream"));

  try {
    const result = await saveChunk({
      ...parsed.data,
      buffer: req.body,
    });
    res.status(200).send(success(result));
  } catch (e) {
    res.status(400).send(error(e instanceof Error ? e.message : String(e)));
  }
});
