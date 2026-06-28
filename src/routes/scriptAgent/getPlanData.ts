import express from "express";
import { success } from "@/lib/responseFormat";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { getScriptAgentPlanData } from "@/utils/scriptAgentPlan";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    agentType: z.enum(["scriptAgent"]),
  }),
  async (req, res) => {
    res.status(200).send(success(await getScriptAgentPlanData(req.body.projectId)));
  },
);
