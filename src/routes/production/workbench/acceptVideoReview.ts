import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { acceptVideoReviewWarning } from "@/utils/videoReview";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    videoId: z.number().int(),
  }),
  async (req, res) => {
    const { videoId } = req.body as { videoId: number };
    try {
      const review = await acceptVideoReviewWarning(videoId);
      res.status(200).send(success(review));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
