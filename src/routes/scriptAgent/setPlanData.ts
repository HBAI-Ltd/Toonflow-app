import express from "express";
import { success } from "@/lib/responseFormat";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { setScriptAgentPlanData } from "@/utils/scriptAgentPlan";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    agentType: z.enum(["scriptAgent"]),
    data: z.object({
      storySkeleton: z.string().optional(),
      adaptationStrategy: z.string().optional(),
      script: z
        .array(
          z.object({
            id: z.number().optional(),
            name: z.string().optional(),
            content: z.string(),
          }),
        )
        .optional(),
    }),
  }),
  async (req, res) => {
    const { projectId, data } = req.body;
    res.status(200).send(success(await setScriptAgentPlanData(projectId, data)));
  },
);
