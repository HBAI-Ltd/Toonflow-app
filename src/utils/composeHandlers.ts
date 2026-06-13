import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import db from "@/utils/db";
import Ai from "@/utils/ai";
import oss from "@/utils/oss";
import errorUtil from "@/utils/error";
import { registerQueueHandler } from "@/utils/genQueue";
import { composeShot, concatSegments, normalizeSegment, probeDuration, probeVideoInfo } from "@/utils/ffmpegTool";
import { buildSrt, extractDialogue, isIgnorableDialogue } from "@/utils/subtitle";
import { splitGridImage } from "@/utils/gridImage";

/**
 * 成片管线队列处理器（借鉴 huobao-drama 的 FFmpeg 合成/TTS/宫格图能力）
 *
 * - composeVideo：单镜头合成（选定视频 + 可选 TTS 配音 + 烧录台词字幕）
 * - mergeEpisode：整集拼接导出（按分镜顺序拼接各镜头成片）
 * - gridImage：宫格分镜图（一次生成 N 宫格再切分，1 次调用产出多镜头帧且风格一致）
 */

const DEFAULT_MAX_MEDIA_BYTES = 2 * 1024 * 1024 * 1024;
const DEFAULT_MAX_MEDIA_DURATION_SECONDS = 60 * 60;
const DEFAULT_MAX_MEDIA_SIDE = 4096;
const DEFAULT_MAX_MERGE_SEGMENTS = 200;

function positiveEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function assertVideoWithinLimits(absPath: string, label: string): Promise<{ width: number; height: number; duration: number | null }> {
  const stat = await fs.stat(absPath);
  const maxBytes = positiveEnvNumber("COMPOSE_MAX_MEDIA_BYTES", DEFAULT_MAX_MEDIA_BYTES);
  if (!stat.isFile()) throw new Error(`${label}不是有效文件`);
  if (stat.size > maxBytes) throw new Error(`${label}超过大小上限（${Math.round(maxBytes / 1024 / 1024)}MB）`);

  const info = await probeVideoInfo(absPath);
  const maxSide = positiveEnvNumber("COMPOSE_MAX_MEDIA_SIDE", DEFAULT_MAX_MEDIA_SIDE);
  if (info.width > maxSide || info.height > maxSide) {
    throw new Error(`${label}分辨率超过上限（${maxSide}x${maxSide}）`);
  }

  const duration = await probeDuration(absPath);
  const maxDuration = positiveEnvNumber("COMPOSE_MAX_MEDIA_DURATION_SECONDS", DEFAULT_MAX_MEDIA_DURATION_SECONDS);
  if (duration != null && duration > maxDuration) {
    throw new Error(`${label}时长超过上限（${Math.round(maxDuration)}秒）`);
  }
  return { ...info, duration };
}

export interface ComposeVideoPayload {
  composeId: number;
  projectId: number;
  scriptId: number;
  trackId: number;
  ttsModel?: string | null; // `${vendorId}:${modelName}`，缺省则不生成配音
  voice?: string | null;
}

export interface MergeEpisodePayload {
  mergeId: number;
  projectId: number;
  scriptId: number;
}

export interface GridImagePayload {
  projectId: number;
  scriptId: number;
  storyboardIds: number[]; // 行优先顺序对应宫格单元
  model: string; // `${vendorId}:${modelName}`
  prompt: string;
  rows: number;
  cols: number;
  resolution: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

// ─── 单镜头合成 ──────────────────────────────────────────────

/** 获取分镜的台词：结构化 dialogue 字段优先，否则从 videoDesc 中提取 */
function getStoryboardDialogue(row: { dialogue?: string | null; videoDesc?: string | null }): string {
  const structured = (row.dialogue ?? "").trim();
  if (structured && !isIgnorableDialogue(structured)) return structured;
  return extractDialogue(row.videoDesc);
}

async function handleComposeVideo(payload: ComposeVideoPayload): Promise<void> {
  const compose = await db("o_videoCompose").where("id", payload.composeId).first();
  if (!compose) return; // 记录已被删除

  await db("o_videoCompose").where("id", payload.composeId).update({ state: "合成中", errorReason: null });

  try {
    // 1. 找到该轨道选定的源视频
    const track = await db("o_videoTrack")
      .where({ id: payload.trackId, projectId: payload.projectId, scriptId: payload.scriptId })
      .first();
    if (!track?.videoId) throw new Error("该分镜轨道尚未选定视频");
    const video = await db("o_video")
      .where({ id: track.videoId, projectId: payload.projectId, scriptId: payload.scriptId })
      .first();
    if (!video?.filePath || video.state !== "生成成功") throw new Error("选定的视频未生成成功");

    // 2. 汇总该轨道下分镜的台词
    const storyboards = await db("o_storyboard")
      .where({ trackId: payload.trackId, scriptId: payload.scriptId, projectId: payload.projectId })
      .orderBy("index", "asc")
      .select("dialogue", "videoDesc");
    const dialogue = storyboards
      .map((row) => getStoryboardDialogue(row))
      .filter(Boolean)
      .join("。");

    const videoAbs = await oss.getAbsolutePath(video.filePath);
    const videoInfo = await assertVideoWithinLimits(videoAbs, "选定视频");
    const duration = videoInfo.duration ?? 5;

    // 3. 可选 TTS 配音（vendor 未实现/失败时优雅降级为无配音）
    let audioRelPath: string | null = null;
    if (payload.ttsModel && dialogue) {
      const audioPath = `/${payload.projectId}/compose/${uuidv4()}.mp3`;
      try {
        const aiAudio = await Ai.Audio(payload.ttsModel as `${string}:${string}`).run(
          { text: dialogue, voice: payload.voice ?? "", speechRate: 0, pitchRate: 0, volume: 50 } as any,
          {
            taskClass: "生成配音",
            describe: "镜头台词配音",
            projectId: payload.projectId,
            relatedObjects: JSON.stringify({ composeId: payload.composeId, trackId: payload.trackId }),
          },
        );
        if (aiAudio) {
          await aiAudio.save(audioPath);
          const audioBuffer = await oss.getFile(audioPath);
          if (audioBuffer.length > 0) {
            audioRelPath = audioPath;
          } else {
            await oss.deleteFile(audioPath).catch(() => {});
          }
        }
      } catch {
        // TTS 失败不阻断合成，仅无配音
      }
    }

    // 4. 生成 SRT 字幕（写文本必须传 Buffer，oss.writeFile 对 string 按 base64 解码）
    let srtRelPath: string | null = null;
    if (dialogue) {
      const srt = buildSrt(dialogue, duration);
      if (srt) {
        srtRelPath = `/${payload.projectId}/compose/${uuidv4()}.srt`;
        await oss.writeFile(srtRelPath, Buffer.from(srt, "utf8"));
      }
    }

    // 5. FFmpeg 合成
    const outRelPath = `/${payload.projectId}/compose/${uuidv4()}.mp4`;
    const outAbs = await oss.getAbsolutePath(outRelPath);
    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await composeShot({
      videoAbs,
      audioAbs: audioRelPath ? await oss.getAbsolutePath(audioRelPath) : null,
      srtAbs: srtRelPath ? await oss.getAbsolutePath(srtRelPath) : null,
      outAbs,
    });

    await db("o_videoCompose").where("id", payload.composeId).update({
      state: "已完成",
      filePath: outRelPath,
      audioPath: audioRelPath,
      subtitlePath: srtRelPath,
      dialogue,
      videoId: track.videoId,
    });
  } catch (e) {
    const message = errorUtil(e).message;
    await db("o_videoCompose").where("id", payload.composeId).update({ state: "合成失败", errorReason: message });
    throw new Error(message);
  }
}

// ─── 整集拼接导出 ────────────────────────────────────────────

/** 取轨道用于拼接的视频相对路径：最新合成成片优先，其次轨道选定的原始视频 */
async function getTrackSegmentPath(trackId: number, projectId: number, scriptId: number): Promise<string | null> {
  const compose = await db("o_videoCompose")
    .where({ trackId, projectId, scriptId, state: "已完成" })
    .orderBy("createTime", "desc")
    .first();
  if (compose?.filePath) return compose.filePath;
  const track = await db("o_videoTrack").where({ id: trackId, projectId, scriptId }).first();
  if (!track?.videoId) return null;
  const video = await db("o_video").where({ id: track.videoId, projectId, scriptId }).first();
  return video?.state === "生成成功" && video.filePath ? video.filePath : null;
}

async function handleMergeEpisode(payload: MergeEpisodePayload): Promise<void> {
  const merge = await db("o_episodeMerge").where("id", payload.mergeId).first();
  if (!merge) return;

  await db("o_episodeMerge").where("id", payload.mergeId).update({ state: "拼接中", errorReason: null });

  const tmpDir = path.join(os.tmpdir(), `toonflow-merge-${uuidv4()}`);
  try {
    // 1. 按分镜顺序收集轨道（有序去重）
    const storyboards = await db("o_storyboard")
      .where({ scriptId: payload.scriptId, projectId: payload.projectId })
      .orderBy("index", "asc")
      .select("trackId");
    const trackIds: number[] = [];
    for (const row of storyboards) {
      if (row.trackId != null && !trackIds.includes(row.trackId)) trackIds.push(row.trackId);
    }
    if (!trackIds.length) throw new Error("该剧集没有分镜轨道");
    const maxSegments = positiveEnvNumber("COMPOSE_MAX_MERGE_SEGMENTS", DEFAULT_MAX_MERGE_SEGMENTS);
    if (trackIds.length > maxSegments) throw new Error(`拼接片段数超过上限（${maxSegments}）`);

    const segmentRelPaths: string[] = [];
    for (const trackId of trackIds) {
      const relPath = await getTrackSegmentPath(trackId, payload.projectId, payload.scriptId);
      if (relPath) segmentRelPaths.push(relPath);
    }
    if (!segmentRelPaths.length) throw new Error("没有可拼接的视频，请先生成或合成各镜头视频");

    // 2. 统一规格（以首段分辨率为准），再 concat 拼接
    await fs.mkdir(tmpDir, { recursive: true });
    const firstAbs = await oss.getAbsolutePath(segmentRelPaths[0]);
    const { width, height } = await assertVideoWithinLimits(firstAbs, "首段视频");

    const normalizedPaths: string[] = [];
    for (let i = 0; i < segmentRelPaths.length; i++) {
      const inAbs = await oss.getAbsolutePath(segmentRelPaths[i]);
      if (i > 0) await assertVideoWithinLimits(inAbs, `第 ${i + 1} 段视频`);
      const outAbs = path.join(tmpDir, `seg-${String(i).padStart(4, "0")}.mp4`);
      await normalizeSegment(inAbs, outAbs, width, height);
      normalizedPaths.push(outAbs);
    }

    const outRelPath = `/${payload.projectId}/merge/${uuidv4()}.mp4`;
    const outAbs = await oss.getAbsolutePath(outRelPath);
    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await concatSegments(normalizedPaths, outAbs, path.join(tmpDir, "concat.txt"));

    const duration = await probeDuration(outAbs);
    await db("o_episodeMerge").where("id", payload.mergeId).update({
      state: "已完成",
      filePath: outRelPath,
      duration: duration != null ? Math.round(duration) : null,
    });
  } catch (e) {
    const message = errorUtil(e).message;
    await db("o_episodeMerge").where("id", payload.mergeId).update({ state: "拼接失败", errorReason: message });
    throw new Error(message);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ─── 宫格分镜图 ──────────────────────────────────────────────

async function handleGridImage(payload: GridImagePayload): Promise<void> {
  const storyboardIds = payload.storyboardIds;
  await db("o_storyboard").whereIn("id", storyboardIds).update({ state: "生成中", reason: null });

  try {
    // 1. 生成一张宫格图（多镜头同图生成，风格/角色天然一致）
    const aiImage = Ai.Image(payload.model as `${string}:${string}`);
    await aiImage.run(
      {
        prompt: payload.prompt,
        referenceList: [],
        size: payload.resolution,
        aspectRatio: payload.aspectRatio,
      },
      {
        taskClass: "生成分镜图片",
        describe: `宫格分镜图生成（${payload.rows}x${payload.cols}）`,
        projectId: payload.projectId,
        relatedObjects: JSON.stringify({ storyboardIds, scriptId: payload.scriptId }),
      },
    );
    const gridRelPath = `/${payload.projectId}/assets/${payload.scriptId}/grid_${uuidv4()}.jpg`;
    await aiImage.save(gridRelPath);

    // 2. 切分并按顺序写回各分镜
    const outDir = `/${payload.projectId}/assets/${payload.scriptId}`;
    const cells = await splitGridImage(gridRelPath, payload.rows, payload.cols, outDir);
    for (let i = 0; i < storyboardIds.length; i++) {
      const cell = cells[i];
      if (!cell) break; // 分镜数多于宫格数时多余分镜保持原状
      await db("o_storyboard").where("id", storyboardIds[i]).update({ filePath: cell.filePath, state: "已完成" });
    }
    // 分镜数少于宫格数时，多余单元格不影响结果（已保存，可人工取用）
  } catch (e) {
    const message = errorUtil(e).message;
    await db("o_storyboard").whereIn("id", storyboardIds).where("state", "生成中").update({ state: "生成失败", reason: message });
    throw new Error(message);
  }
}

// ─── 注册 ───────────────────────────────────────────────────

export function registerComposeHandlers(): void {
  registerQueueHandler("composeVideo", (payload) => handleComposeVideo(payload));
  registerQueueHandler("mergeEpisode", (payload) => handleMergeEpisode(payload));
  registerQueueHandler("gridImage", (payload) => handleGridImage(payload));
}
