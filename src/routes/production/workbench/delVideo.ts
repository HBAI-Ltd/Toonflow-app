import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    await u.db("o_video").where("id", id).delete();
    await u.db("o_videoTrack").where("videoId", id).orWhere("selectVideoId", id).update({
      videoId: null,
      selectVideoId: null,
    });
    res.status(200).send(success({ message: "视频删除成功" }));
  },
);
