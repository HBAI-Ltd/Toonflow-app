import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { resolvePromptDescriptor } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    scope: z.enum(["agent", "function", "videoModel", "skill", "modelPrompt"]),
    key: z.string().optional(),
    sourcePath: z.string().optional(),
    promptType: z.string().optional(),
    vendorId: z.string().optional(),
    model: z.string().optional(),
    mode: z.string().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await resolvePromptDescriptor(req.body)));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
