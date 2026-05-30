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
 * POST /api/production/produceVideo
 *
 * End-to-end local production pipeline:
 *   1. Generate image per scene via image provider (e.g. Z-Image)
 *   2. Generate audio per scene via TTS provider (e.g. F5-TTS)
 *   3. Save image/audio to OSS per scene
 *   4. Render each scene (image + audio → MP4 clip)
 *   5. Concatenate all clips into final MP4
 *   6. Return final videoUrl with per-scene details
 *
 * All scenes are processed sequentially (no parallel).
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.string().min(1),
    title: z.string().optional(),
    imageModelKey: z.string().min(1),
    ttsModelKey: z.string().min(1),
    imageConfig: z.record(z.any()).optional(),
    ttsConfig: z
      .object({
        voice: z.string().default("default"),
        speechRate: z.number().default(1.0),
        pitchRate: z.number().default(1.0),
        volume: z.number().default(50),
      })
      .optional(),
    scenes: z
      .array(
        z.object({
          sceneNo: z.number().int().min(1),
          imagePrompt: z.string().min(1),
          narrationText: z.string().min(1),
        })
      )
      .min(1),
  }),
  async (req, res) => {
    const {
      projectId,
      title,
      imageModelKey,
      ttsModelKey,
      imageConfig,
      ttsConfig,
      scenes,
    } = req.body;

    try {
      // ── 1. Check FFmpeg availability ──
      try {
        const ver = await checkFfmpeg();
        console.log(`[produceVideo] FFmpeg available: ${ver}`);
      } catch (e: any) {
        return res.status(503).send(error(e.message));
      }

      // ── 2. Sanitize projectId ──
      const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_");
      console.log(`[produceVideo] projectId="${projectId}" → safeProjectId="${safeProjectId}"`);

      // ── 3. Sort scenes by sceneNo ascending ──
      const sortedScenes = [...scenes].sort(
        (a: any, b: any) => a.sceneNo - b.sceneNo
      );

      // ── 4. Merge default + user configs ──
      const defaultImageConfig: Record<string, any> = {
        size: "1K",
        aspectRatio: "9:16",
      };
      const effectiveImageConfig = { ...defaultImageConfig, ...imageConfig };

      const defaultTtsConfig = {
        voice: "default",
        speechRate: 1.0,
        pitchRate: 1.0,
        volume: 50,
      };
      const effectiveTtsConfig = { ...defaultTtsConfig, ...ttsConfig };

      // ── 5. Asset directory layout ──
      const projectDir = `render/projects/${safeProjectId}`;
      const imagesDir = `${projectDir}/assets/images`;
      const audioDir = `${projectDir}/assets/audio`;
      const tmpDir = `${projectDir}/tmp`;

      // ── 6. Generate assets per scene (sequential) ──
      const sceneResults: Array<{
        sceneNo: number;
        imageOssPath: string;
        audioOssPath: string;
      }> = [];

      for (let i = 0; i < sortedScenes.length; i++) {
        const scene = sortedScenes[i];
        const scenePrefix = `${String(i + 1).padStart(3, "0")}-scene-${
          scene.sceneNo
        }`;
        const imageOssPath = `${imagesDir}/${scenePrefix}.png`;
        const audioOssPath = `${audioDir}/${scenePrefix}.wav`;

        console.log(
          `[produceVideo] Scene ${scene.sceneNo} (${i + 1}/${
            sortedScenes.length
          }): Starting...`
        );

        // 6a. Generate image
        try {
          const imgInput = {
            prompt: scene.imagePrompt,
            ...effectiveImageConfig,
          };
          console.log(
            `[produceVideo] Scene ${scene.sceneNo}: Generating image (model=${imageModelKey})...`
          );
          const img = await u.Ai.Image(imageModelKey).run(imgInput as any);
          await img.save(imageOssPath);
          console.log(
            `[produceVideo] Scene ${scene.sceneNo}: Image saved → ${imageOssPath}`
          );
        } catch (err: any) {
          const msg = `Scene ${scene.sceneNo} image generation failed: ${
            err.message || err
          }`;
          console.error(`[produceVideo] ${msg}`);
          return res.status(500).send(error(msg));
        }

        // 6b. Generate audio
        try {
          const ttsInput = {
            text: scene.narrationText,
            ...effectiveTtsConfig,
          };
          console.log(
            `[produceVideo] Scene ${scene.sceneNo}: Generating audio (model=${ttsModelKey})...`
          );
          const audio = await u.Ai.Audio(ttsModelKey).run(ttsInput);
          await audio.save(audioOssPath);
          console.log(
            `[produceVideo] Scene ${scene.sceneNo}: Audio saved → ${audioOssPath}`
          );
        } catch (err: any) {
          const msg = `Scene ${scene.sceneNo} audio generation failed: ${
            err.message || err
          }`;
          console.error(`[produceVideo] ${msg}`);
          return res.status(500).send(error(msg));
        }

        sceneResults.push({
          sceneNo: scene.sceneNo,
          imageOssPath,
          audioOssPath,
        });
      }

      // ── 7. Render clips + concat ──
      const ts = Date.now();
      const finalOssPath = `${projectDir}/final-${ts}.mp4`;
      const ossRoot = u.getPath("oss");

      // Single scene — render directly to final path
      if (sortedScenes.length === 1) {
        const sr = sceneResults[0];
        try {
          console.log(`[produceVideo] Rendering single scene...`);
          const videoUrl = await composeImageAudio(
            sr.imageOssPath,
            sr.audioOssPath,
            finalOssPath
          );
          return res.status(200).send(
            success({
              videoUrl,
              videoOssPath: finalOssPath,
              sceneCount: 1,
              title: title || "",
              projectId,
              safeProjectId,
              scenes: sceneResults,
            })
          );
        } catch (err: any) {
          const msg = `Scene ${sr.sceneNo} render failed: ${
            err.message || err
          }`;
          console.error(`[produceVideo] ${msg}`);
          return res.status(500).send(error(msg));
        }
      }

      // Multi scene — render clips to tmp, then concat
      const clipOssPaths: string[] = [];

      try {
        for (let i = 0; i < sortedScenes.length; i++) {
          const scene = sortedScenes[i];
          const sr = sceneResults[i];
          const scenePrefix = `${String(i + 1).padStart(3, "0")}-scene-${
            scene.sceneNo
          }`;
          const clipOssPath = `${tmpDir}/${scenePrefix}.mp4`;

          try {
            console.log(
              `[produceVideo] Rendering scene ${scene.sceneNo} (${i + 1}/${
                sortedScenes.length
              })...`
            );
            await composeImageAudio(
              sr.imageOssPath,
              sr.audioOssPath,
              clipOssPath
            );
            clipOssPaths.push(clipOssPath);
          } catch (err: any) {
            const msg = `Scene ${scene.sceneNo} render failed: ${
              err.message || err
            }`;
            console.error(`[produceVideo] ${msg}`);
            return res.status(500).send(error(msg));
          }
        }

        // Concat all clips
        try {
          console.log(
            `[produceVideo] Concatenating ${clipOssPaths.length} clips...`
          );
          const videoUrl = await concatVideos(clipOssPaths, finalOssPath);

          res.status(200).send(
            success({
              videoUrl,
              videoOssPath: finalOssPath,
              sceneCount: sortedScenes.length,
              title: title || "",
              projectId,
              safeProjectId,
              scenes: sceneResults,
            })
          );
        } catch (err: any) {
          const msg = `Final concat failed: ${err.message || err}`;
          console.error(`[produceVideo] ${msg}`);
          return res.status(500).send(error(msg));
        }
      } finally {
        // Cleanup temporary clip files
        for (const clipPath of clipOssPaths) {
          try {
            const absPath = path.join(
              ossRoot,
              clipPath.replace(/^[/\\]+/, "")
            );
            await fs.unlink(absPath);
          } catch {
            // Best-effort cleanup
          }
        }
        // Cleanup tmp directory
        try {
          const tmpDirAbs = path.join(
            ossRoot,
            tmpDir.replace(/^[/\\]+/, "")
          );
          await fs.rm(tmpDirAbs, { recursive: false, force: true });
        } catch {
          // Directory not empty or already deleted
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
