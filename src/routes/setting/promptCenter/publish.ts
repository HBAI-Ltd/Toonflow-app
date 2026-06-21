import express from "express";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { publishPromptVersion } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    versionId: z.number(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await publishPromptVersion(req.body.versionId), "发布成功"));
    } catch (err: any) {
      res.status(400).send(error(err?.message ?? String(err)));
    }
  },
);
