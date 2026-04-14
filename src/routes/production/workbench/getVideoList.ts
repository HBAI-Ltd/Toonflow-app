import express from "express";
import u from "@/utils";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
  }),
  async (req, res) => {
    const { projectId, scriptId } = req.body;
    const storyboardList = await db("o_storyboard").where({ scriptId, projectId }).orderBy("index", "asc");
    const videoList = await db("o_video").whereIn(
      "videoTrackId",
      storyboardList.map((s) => s.trackId),
    );
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
