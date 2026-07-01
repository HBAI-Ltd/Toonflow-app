import fs from "node:fs/promises";
import type { o_sr_source_media } from "@/types/database";
import { getTaskBundle, saveSourceMedia } from "./repository";
import { toOssRelPath } from "./artifactPaths";

interface MediaArtifact {
  durationSec?: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
}

export async function ingestMediaProbe(taskId: number, analysisDir: string): Promise<o_sr_source_media> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.sourceMedia?.sourcePath) throw new Error("source media not found");

  const mediaPath = `${analysisDir}/media.json`;
  const media = JSON.parse(await fs.readFile(mediaPath, "utf8")) as MediaArtifact;

  return await saveSourceMedia({
    taskId,
    sourcePath: bundle.sourceMedia.sourcePath,
    normalizedPath: toOssRelPath(`${analysisDir}/normalized.mp4`),
    audioPath: media.hasAudio ? toOssRelPath(`${analysisDir}/audio.wav`) : null,
    coverPath: toOssRelPath(`${analysisDir}/cover.jpg`),
    mediaJson: JSON.stringify(media),
    sha256: bundle.sourceMedia.sha256,
    sizeBytes: bundle.sourceMedia.sizeBytes ?? 0,
    durationSec: media.durationSec ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    fps: media.fps ?? null,
    hasAudio: media.hasAudio ? 1 : 0,
  });
}
