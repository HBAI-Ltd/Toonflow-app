import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { saveCreativeCanvasLayout } from "@/utils/creativeCanvas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().nullable().optional(),
    viewKey: z.string().optional(),
    nodesLayout: z.any(),
    edgesLayout: z.any().optional(),
    viewport: z.any().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await saveCreativeCanvasLayout(req.body)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
