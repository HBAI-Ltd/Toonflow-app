import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { composeImageAudio, checkFfmpeg } from "@/utils/ffmpeg";

const router = express.Router();

/**
 * POST /api/production/render
 *
 * Compose a still image + audio into an MP4 video.
 *
 * Body:
 *   imageOssPath: string — OSS relative path of input image
 *   audioOssPath: string — OSS relative path of input audio
 *
 * Response:
 *   { code: 200, data: "http://localhost:10588/oss/render/xxx.mp4", message: "成功" }
 */
export default router.post(
  "/",
  validateFields({
    imageOssPath: z.string(),
    audioOssPath: z.string(),
  }),
  async (req, res) => {
    const { imageOssPath, audioOssPath } = req.body;

    try {
      // 1. Check FFmpeg availability
      try {
        const ver = await checkFfmpeg();
        console.log(`[render] FFmpeg available: ${ver}`);
      } catch (e: any) {
        return res.status(503).send(error(e.message));
      }

      // 2. Compose: image + audio → MP4
      //    File existence validated inside composeImageAudio() via fs.stat()
      const timestamp = Date.now();
      const outputOssPath = `render/${timestamp}.mp4`;

      console.log(
        `[render] Composing: image=${imageOssPath}, audio=${audioOssPath}, output=${outputOssPath}`
      );

      const resultUrl = await composeImageAudio(imageOssPath, audioOssPath, outputOssPath);

      res.status(200).send(success(resultUrl));
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;

      // Return 400 if file not found, 500 otherwise
      if (msg.includes("not found")) {
        res.status(400).send(error(msg));
      } else {
        res.status(500).send(error(msg));
      }
    }
  }
);
