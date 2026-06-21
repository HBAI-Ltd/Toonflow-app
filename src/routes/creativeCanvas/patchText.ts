import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { patchCreativeCanvasText } from "@/utils/creativeCanvas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    segmentId: z.number(),
    newText: z.string(),
    note: z.string().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await patchCreativeCanvasText({ ...req.body, createdBy: "admin" })));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
