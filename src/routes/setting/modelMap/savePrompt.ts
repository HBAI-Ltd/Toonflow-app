import express from "express";
import { error, success } from "@/lib/responseFormat";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { createPromptDraft } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string().min(1),
    data: z.string(),
    type: z.enum(["image", "video"]),
  }),
  async (req, res) => {
    const { name, data, type } = req.body;
    try {
      const sourcePath = `${type}/${name}.md`;
      const draft = await createPromptDraft({
        scope: "modelPrompt",
        key: sourcePath,
        sourceType: "modelPromptFile",
        sourcePath,
        content: data,
        note: "legacy modelMap/savePrompt",
      });
      res.status(200).send(success({ draftId: draft.id, status: draft.status }, "草稿已保存，发布后生效"));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
