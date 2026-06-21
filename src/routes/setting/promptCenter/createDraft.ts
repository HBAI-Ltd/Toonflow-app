import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { createPromptDraft } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    scope: z.enum(["agent", "function", "videoModel", "skill", "modelPrompt"]),
    key: z.string(),
    sourceType: z.enum(["skillFile", "dbPrompt", "modelPromptFile"]),
    sourcePath: z.string().nullable().optional(),
    promptType: z.string().nullable().optional(),
    content: z.string(),
    note: z.string().nullable().optional(),
  }),
  async (req, res) => {
    try {
      const draft = await createPromptDraft(req.body);
      res.status(200).send(success(draft, "草稿已保存"));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
