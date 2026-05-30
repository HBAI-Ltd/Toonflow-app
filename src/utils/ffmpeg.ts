/**
 * FFmpeg Utility — Image + Audio → Video MP4
 *
 * Uses system FFmpeg from PATH (or FFMPEG_PATH env).
 * No npm dependencies required.
 *
 * @version 1.1 — Added video normalize filter (1080x1920) + concatVideos
 */

import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import u from "@/utils";

/**
 * Get FFmpeg binary path.
 * Priority: FFMPEG_PATH env → "ffmpeg" (from system PATH)
 */
function getFfmpegCommand(): string {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

/**
 * Resolve OSS relative path to absolute filesystem path.
 */
function ossToAbs(ossRelPath: string): string {
  const ossRoot = u.getPath("oss");
  const normalized = ossRelPath.replace(/^[/\\]+/, "");
  return path.join(ossRoot, normalized);
}

/**
 * Check if FFmpeg is available on the system.
 * @returns version string if available, or throws Error
 */
export async function checkFfmpeg(): Promise<string> {
  const cmd = getFfmpegCommand();
  return new Promise((resolve, reject) => {
    execFile(cmd, ["-version"], (error, stdout) => {
      if (error) {
        reject(
          new Error(
            `FFmpeg not found. Install FFmpeg and add to PATH, or set FFMPEG_PATH env. Error: ${error.message}`
          )
        );
        return;
      }
      const firstLine = stdout.split("\n")[0];
      resolve(firstLine);
    });
  });
}

/**
 * Compose video from a still image + audio track.
 *
 * ffmpeg -y -loop 1 -i image -i audio
 *   -vf scale=1080:1920:force_original_aspect_ratio=decrease,
 *          pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1
 *   -r 30 -c:v libx264 -tune stillimage -c:a aac -b:a 192k
 *   -pix_fmt yuv420p -shortest -movflags +faststart output.mp4
 *
 * @param imageOssPath  OSS relative path of input image (e.g., "testImage.jpg")
 * @param audioOssPath  OSS relative path of input audio (e.g., "testAudio.wav")
 * @param outputOssPath OSS relative path for output MP4 (e.g., "render/output.mp4")
 * @returns OSS URL of the output video
 */
export async function composeImageAudio(
  imageOssPath: string,
  audioOssPath: string,
  outputOssPath: string
): Promise<string> {
  const ffmpegCmd = getFfmpegCommand();

  // 1. Resolve absolute paths
  const imageAbs = ossToAbs(imageOssPath);
  const audioAbs = ossToAbs(audioOssPath);
  const outputAbs = ossToAbs(outputOssPath);

  // 2. Validate input files exist
  const imageStat = await fs.stat(imageAbs).catch(() => null);
  if (!imageStat || !imageStat.isFile()) {
    throw new Error(`Image file not found: ${imageAbs}`);
  }

  const audioStat = await fs.stat(audioAbs).catch(() => null);
  if (!audioStat || !audioStat.isFile()) {
    throw new Error(`Audio file not found: ${audioAbs}`);
  }

  // 3. Ensure output directory exists
  await fs.mkdir(path.dirname(outputAbs), { recursive: true });

  // 4. Build FFmpeg arguments
  const args = [
    "-y",                       // Overwrite output without asking
    "-loop", "1",               // Loop the image
    "-i", imageAbs,             // Input image
    "-i", audioAbs,             // Input audio
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1",  // Normalize to 1080x1920
    "-r", "30",                 // Consistent frame rate for concat
    "-c:v", "libx264",         // H.264 video codec
    "-tune", "stillimage",     // Optimize for still image
    "-c:a", "aac",              // AAC audio codec
    "-b:a", "192k",             // Audio bitrate
    "-pix_fmt", "yuv420p",     // Pixel format for compatibility
    "-shortest",                // Stop when shortest stream ends
    "-movflags", "+faststart",  // Web-friendly MP4
    outputAbs,
  ];

  console.log(`[ffmpeg] Command: ${ffmpegCmd} ${args.join(" ")}`);

  // 5. Execute FFmpeg
  return new Promise((resolve, reject) => {
    execFile(ffmpegCmd, args, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        const errMsg = stderr || error.message;
        console.error(`[ffmpeg] Error: ${errMsg}`);
        reject(new Error(`FFmpeg failed: ${errMsg}`));
        return;
      }

      // Log stderr (FFmpeg outputs progress to stderr)
      if (stderr) {
        console.log(`[ffmpeg] stderr: ${stderr.slice(-500)}`);
      }

      console.log(`[ffmpeg] Output: ${outputAbs}`);
      // 6. Return OSS URL
      u.oss.getFileUrl(outputOssPath).then(resolve).catch(reject);
    });
  });
}

/**
 * Concatenate multiple MP4 files into one using FFmpeg concat demuxer.
 *
 * All input clips should have consistent resolution/codec/fps/audio
 * (normalized via composeImageAudio) for seamless concatenation.
 *
 * ffmpeg -y -f concat -safe 0 -i list.txt
 *   -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p
 *   -movflags +faststart output.mp4
 *
 * @param videoOssPaths  Array of OSS relative paths for input clips
 * @param outputOssPath  OSS relative path for output MP4
 * @returns OSS URL of the output video
 */
export async function concatVideos(
  videoOssPaths: string[],
  outputOssPath: string
): Promise<string> {
  if (videoOssPaths.length === 0) {
    throw new Error("No video paths provided for concatenation");
  }
  if (videoOssPaths.length === 1) {
    return u.oss.getFileUrl(videoOssPaths[0]);
  }

  const ffmpegCmd = getFfmpegCommand();
  const outputAbs = ossToAbs(outputOssPath);

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputAbs), { recursive: true });

  // Build concat file list
  const concatContent = videoOssPaths
    .map((p) => `file '${ossToAbs(p).replace(/'/g, "'\\''")}'`)
    .join("\n");

  // Write concat list to temp file
  const ts = Date.now();
  const concatListPath = path.join(path.dirname(outputAbs), `_concat_list_${ts}.txt`);

  try {
    await fs.writeFile(concatListPath, concatContent, "utf-8");

    const args = [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatListPath,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-b:a", "192k",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputAbs,
    ];

    console.log(`[ffmpeg] Concat: ${ffmpegCmd} ${args.join(" ")}`);

    const resultUrl = await new Promise<string>((resolve, reject) => {
      execFile(ffmpegCmd, args, { timeout: 600000 }, (error, stdout, stderr) => {
        if (error) {
          const errMsg = stderr || error.message;
          console.error(`[ffmpeg] Concat error: ${errMsg}`);
          reject(new Error(`FFmpeg concat failed: ${errMsg}`));
          return;
        }

        if (stderr) {
          console.log(`[ffmpeg] Concat stderr: ${stderr.slice(-500)}`);
        }

        console.log(`[ffmpeg] Concat output: ${outputAbs}`);
        u.oss.getFileUrl(outputOssPath).then(resolve).catch(reject);
      });
    });

    return resultUrl;
  } finally {
    // Cleanup concat list file — runs AFTER FFmpeg finishes
    try { await fs.unlink(concatListPath); } catch {}
  }
}
