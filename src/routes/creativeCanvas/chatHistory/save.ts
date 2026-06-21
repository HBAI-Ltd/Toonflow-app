import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { saveAgentChatHistory } from "@/utils/agentChatHistory";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().nullable().optional(),
    threadKey: z.string().min(1),
    agentMode: z.string().optional(),
    messages: z.array(z.any()).optional(),
    draft: z.string().optional(),
    lockedContext: z.string().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await saveAgentChatHistory(req.body), "保存成功"));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
