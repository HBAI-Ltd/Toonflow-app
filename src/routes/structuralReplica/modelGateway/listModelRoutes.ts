import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getTaskBundle, parseModelRouteRow } from "@/services/structuralReplica/repository";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    try {
      const bundle = await getTaskBundle(req.body.taskId);
      res.status(200).send(success({ routes: bundle.modelRoutes.map(parseModelRouteRow) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
