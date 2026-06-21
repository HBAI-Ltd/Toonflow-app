import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { createPromptDraft } from "@/utils/promptCenter";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    data: z.string(),
  }),
  async (req, res) => {
    const { id, data } = req.body;
    const prompt = await u.db("o_prompt").where("id", id).first();
    if (!prompt?.type) return res.status(400).send(error("提示词不存在"));
    const draft = await createPromptDraft({
      scope: "function",
      key: prompt.type,
      sourceType: "dbPrompt",
      promptType: prompt.type,
      content: data,
      note: "legacy promptManage/updatePrompt",
    });
    res.status(200).send(success({ draftId: draft.id, status: draft.status }, "草稿已保存，发布后生效"));
  },
);
