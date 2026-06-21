import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { loadAgentChatHistory } from "@/utils/agentChatHistory";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    threadKey: z.string().min(1),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await loadAgentChatHistory(req.body.threadKey)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
