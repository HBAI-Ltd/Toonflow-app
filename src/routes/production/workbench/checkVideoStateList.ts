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
    videoIds: z.array(z.number()),
  }),
  async (req, res) => {
    const { projectId, scriptId, videoIds } = req.body;
    const videoList = await u
      .db("o_video")
      .whereIn("id", videoIds)
      .whereIn("state", ["生成成功", "生成失败"]) // i18n-ignore — stored o_video.state enum values, not user-facing text
      .select("id", "state", "errorReason", "filePath");
    res.status(200).send(
      success(
        await Promise.all(
          videoList.map(async (s) => ({
            ...s,
            src: s.filePath ? await u.oss.getFileUrl(s.filePath) : "",
          })),
        ),
      ),
    );
  },
);
