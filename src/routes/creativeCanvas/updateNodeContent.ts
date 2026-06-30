import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { updateCreativeCanvasNodeContent } from "@/utils/creativeCanvas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    nodeId: z.string(),
    content: z.string(),
    workDataId: z.number().optional().nullable(),
    planType: z.string().optional().nullable(),
    scriptId: z.number().optional().nullable(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await updateCreativeCanvasNodeContent({ ...req.body, createdBy: "admin" })));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
