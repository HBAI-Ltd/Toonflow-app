import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { composeImageAudio, concatVideos, checkFfmpeg } from "@/utils/ffmpeg";

const router = express.Router();

/**
 * POST /api/production/renderMulti
 *
 * Multi-scene render: render each scene as clip, then concat into final MP4.
 *
 * Body:
 *   scenes: [{ imageOssPath: string, audioOssPath: string }, ...]
 *
 * Response:
 *   { code: 200, data: "http://localhost:10588/oss/render/final-xxx.mp4", message: "成功" }
 */
export default router.post(
  "/",
  validateFields({
    scenes: z.array(
      z.object({
        imageOssPath: z.string().min(1),
        audioOssPath: z.string().min(1),
      })
    ).min(1),
  }),
  async (req, res) => {
    const { scenes } = req.body;

    try {
      // 1. Check FFmpeg availability
      try {
        const ver = await checkFfmpeg();
        console.log(`[renderMulti] FFmpeg available: ${ver}`);
      } catch (e: any) {
        return res.status(503).send(error(e.message));
      }

      const ts = Date.now();
      const finalOssPath = `render/final-${ts}.mp4`;

      // 2. Single scene — render directly to final path
      if (scenes.length === 1) {
        const scene = scenes[0];
        console.log(
          `[renderMulti] Single scene: image=${scene.imageOssPath}, audio=${scene.audioOssPath}`
        );
        const resultUrl = await composeImageAudio(
          scene.imageOssPath,
          scene.audioOssPath,
          finalOssPath
        );
        return res.status(200).send(success(resultUrl));
      }

      // 3. Multi scene — render clips to tmp, then concat
      const clipOssPaths: string[] = [];
      const ossRoot = u.getPath("oss");

      try {
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          const clipOssPath = `render/tmp/${ts}-${i}.mp4`;
          console.log(
            `[renderMulti] Scene ${i + 1}/${scenes.length}: image=${scene.imageOssPath}, audio=${scene.audioOssPath}`
          );
          await composeImageAudio(scene.imageOssPath, scene.audioOssPath, clipOssPath);
          clipOssPaths.push(clipOssPath);
        }

        // Concat all clips into final
        console.log(`[renderMulti] Concatenating ${clipOssPaths.length} clips...`);
        const resultUrl = await concatVideos(clipOssPaths, finalOssPath);
        res.status(200).send(success(resultUrl));
      } finally {
        // Cleanup temporary clip files using fs.unlink()
        for (const clipPath of clipOssPaths) {
          try {
            const absPath = path.join(ossRoot, clipPath.replace(/^[/\\]+/, ""));
            await fs.unlink(absPath);
          } catch {
            // Best-effort cleanup — ignore errors
          }
        }
      }
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
