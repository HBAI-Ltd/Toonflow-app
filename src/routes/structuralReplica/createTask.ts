import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { createTask } from "@/services/structuralReplica/repository";
import { SrAspectRatioSchema, SrPlatformSchema } from "@/services/structuralReplica/schemas";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number().int().positive(),
    name: z.string().min(1),
    platform: SrPlatformSchema.default("other"),
    aspectRatio: SrAspectRatioSchema.default("9:16"),
  }),
  async (req, res) => {
    const { projectId, name, platform = "other", aspectRatio = "9:16" } = req.body;
    const project = await u.db("o_project").where("id", projectId).first();
    if (!project) return res.status(400).send(error("项目不存在"));

    const task = await createTask({
      projectId,
      name,
      platform,
      aspectRatio,
    });
    res.status(200).send(success({ taskId: task.id, status: task.status }));
  },
);
