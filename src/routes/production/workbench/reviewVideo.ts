import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { reviewVideoById } from "@/utils/videoReview";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    videoId: z.number().int(),
    audioRequested: z.boolean().optional(),
  }),
  async (req, res) => {
    const { videoId, audioRequested } = req.body as { videoId: number; audioRequested?: boolean };
    try {
      const review = await reviewVideoById({ videoId, audioRequested });
      res.status(200).send(success(review));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
