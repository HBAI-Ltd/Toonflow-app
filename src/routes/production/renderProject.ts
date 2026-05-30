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
 * POST /api/production/renderProject
 *
 * Project-level render: sort scenes, render clips, concat into final MP4.
 *
 * Body:
 *   projectId: string (required)
 *   title: string (optional)
 *   scenes: [{ sceneNo: number, imageOssPath: string, audioOssPath: string, text?: string }, ...]
 *
 * Response:
 *   { code: 200, data: { videoUrl, videoOssPath, sceneCount, title }, message: "成功" }
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.string().min(1),
    title: z.string().optional(),
    scenes: z.array(
      z.object({
        sceneNo: z.number().int().min(1),
        imageOssPath: z.string().min(1),
        audioOssPath: z.string().min(1),
        text: z.string().optional(),
      })
    ).min(1),
  }),
  async (req, res) => {
    const { projectId, title, scenes } = req.body;

    try {
      // 1. Check FFmpeg availability
      try {
        const ver = await checkFfmpeg();
        console.log(`[renderProject] FFmpeg available: ${ver}`);
      } catch (e: any) {
        return res.status(503).send(error(e.message));
      }

      // 2. Sanitize projectId for use as folder path
      const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_");

      // 3. Sort scenes by sceneNo ascending
      const sortedScenes = [...scenes].sort((a: any, b: any) => a.sceneNo - b.sceneNo);

      const ts = Date.now();
      const projectDir = `render/projects/${safeProjectId}`;
      const finalOssPath = `${projectDir}/final-${ts}.mp4`;

      // 4. Single scene — render directly to final path
      if (sortedScenes.length === 1) {
        const scene = sortedScenes[0];
        console.log(
          `[renderProject] Single scene (${scene.sceneNo}): image=${scene.imageOssPath}, audio=${scene.audioOssPath}`
        );
        const videoUrl = await composeImageAudio(
          scene.imageOssPath,
          scene.audioOssPath,
          finalOssPath
        );
        return res.status(200).send(
          success({
            videoUrl,
            videoOssPath: finalOssPath,
            sceneCount: 1,
            title: title || "",
          })
        );
      }

      // 5. Multi scene — render clips to tmp, then concat
      const clipOssPaths: string[] = [];
      const ossRoot = u.getPath("oss");

      try {
        for (let i = 0; i < sortedScenes.length; i++) {
          const scene = sortedScenes[i];
          const clipOssPath = `${projectDir}/tmp/${String(i + 1).padStart(3, "0")}-scene-${scene.sceneNo}.mp4`;
          console.log(
            `[renderProject] Scene ${scene.sceneNo} (${i + 1}/${sortedScenes.length}): image=${scene.imageOssPath}, audio=${scene.audioOssPath}`
          );
          await composeImageAudio(scene.imageOssPath, scene.audioOssPath, clipOssPath);
          clipOssPaths.push(clipOssPath);
        }

        // Concat all clips into final
        console.log(`[renderProject] Concatenating ${clipOssPaths.length} clips...`);
        const videoUrl = await concatVideos(clipOssPaths, finalOssPath);

        res.status(200).send(
          success({
            videoUrl,
            videoOssPath: finalOssPath,
            sceneCount: sortedScenes.length,
            title: title || "",
          })
        );
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

        // Cleanup tmp directory if empty
        try {
          const tmpDirAbs = path.join(ossRoot, `${projectDir}/tmp`.replace(/^[/\\]+/, ""));
          await fs.rmdir(tmpDirAbs);
        } catch {
          // Directory not empty or already deleted — ignore
        }
      }
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;

      if (msg.includes("not found")) {
        res.status(400).send(error(msg));
      } else {
        res.status(500).send(error(msg));
      }
    }
  }
);
