import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getCreativeCanvasGraph } from "@/utils/creativeCanvas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number().optional(),
    scriptId: z.number().optional(),
    viewKey: z.string().optional(),
    limit: z.number().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await getCreativeCanvasGraph(req.body)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
