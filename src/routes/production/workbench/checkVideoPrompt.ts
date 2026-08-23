import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    trackIds: z.array(z.number()),
  }),
  async (req, res) => {
    const { projectId, scriptId, trackIds } = req.body;
    const promptList = await u
      .db("o_videoTrack")
      .where("projectId", projectId)
      .where("scriptId", scriptId)
      .whereIn("id", trackIds)
      .whereIn("state", ["已完成", "生成失败"]) // i18n-ignore — stored o_videoTrack.state enum values, not user-facing text
      .select("id", "state", "reason", "prompt");
    res.status(200).send(success(promptList));
  },
);
