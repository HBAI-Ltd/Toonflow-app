import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { listPromptVersions } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    scope: z.enum(["agent", "function", "videoModel", "skill", "modelPrompt"]),
    key: z.string(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await listPromptVersions(req.body.scope, req.body.key)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
