import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import db from "@/utils/db";
import oss from "@/utils/oss";
import error from "@/utils/error";
import { extractVideoFrame, probeDuration, probeVideoInfo } from "@/utils/ffmpegTool";
import { compareVisualFingerprints, createVisualFingerprint, compareImageFilesByEmbedding } from "@/utils/visualSimilarity";
import { assetCardPrompt } from "@/utils/characterSpec";

export type VideoReviewStatus = "passed" | "warning" | "failed";

export interface VideoReview {
  projectId: number;
  scriptId: number | null;
  trackId: number | null;
  videoId: number;
  score: number;
  status: VideoReviewStatus;
  issues: string[];
  report: Record<string, unknown>;
  retryable: boolean;
  suggestedAction: string;
}

interface VisualReference {
  id: number;
  name: string;
  source: "asset" | "storyboard";
  type?: string | null;
  filePath: string;
}

// CLIP 余弦与像素指纹量纲不同。经真实资产图校准（clip-vit-base-patch32 vision，512D）：
// 同项目跨角色四视图约 0.54~0.83，同一角色不同帧更高；低于 0.60 才视为真正的一致性跑偏（错配角色/场景）。
// 像素指纹沿用旧的 0.55。阈值可据项目画风进一步调整。
const VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP = 0.6;
const VISUAL_LOW_SIMILARITY_THRESHOLD_PIXEL = 0.55;

async function hasReviewTable() {
  return db.schema.hasTable("o_videoReview");
}

export function shouldRetryVideoGeneration(reason: string): boolean {
  const text = String(reason || "");
  if (/AccountOverdue|overdue|余额|欠费|Forbidden|Unauthorized|Invalid.*key|api.?key|quota|permission|鉴权|认证/i.test(text)) return false;
  if (/timeout|timed?\s*out|ECONN|ENOTFOUND|network|socket|temporar|rate.?limit|429|5\d\d|busy|overload|poll error/i.test(text)) return true;
  return false;
}

export async function recordFailedVideoReview(input: { videoId: number; reason: string }): Promise<VideoReview> {
  const video = await db("o_video").where("id", input.videoId).first();
  const retryable = shouldRetryVideoGeneration(input.reason);
  const review: VideoReview = {
    projectId: Number(video?.projectId || 0),
    scriptId: video?.scriptId ?? null,
    trackId: video?.videoTrackId ?? null,
    videoId: input.videoId,
    score: 0,
    status: "failed",
    issues: ["generation_failed"],
    report: { reason: input.reason },
    retryable,
    suggestedAction: retryable ? "retry_same_parameters" : "fix_provider_or_prompt_before_retry",
  };
  await saveVideoReview(review);
  return review;
}

export async function reviewVideoById(input: { videoId: number; audioRequested?: boolean }): Promise<VideoReview> {
  const video = await db("o_video").where("id", input.videoId).first();
  if (!video) throw new Error(`视频不存在: ${input.videoId}`);
  return reviewGeneratedVideo({
    videoId: Number(video.id),
    videoPath: String(video.filePath || ""),
    projectId: Number(video.projectId),
    scriptId: Number(video.scriptId),
    trackId: Number(video.videoTrackId),
    audioRequested: input.audioRequested,
  });
}

export async function reviewGeneratedVideo(input: {
  videoId: number;
  videoPath: string;
  projectId: number;
  scriptId: number;
  trackId: number;
  audioRequested?: boolean;
}): Promise<VideoReview> {
  const issues: string[] = [];
  let score = 100;
  const report: Record<string, unknown> = {
    videoId: input.videoId,
    videoPath: input.videoPath,
  };
  let videoAbsPath = "";

  try {
    const absPath = await oss.getAbsolutePath(input.videoPath);
    videoAbsPath = absPath;
    const [info, duration] = await Promise.all([probeVideoInfo(absPath), probeDuration(absPath)]);
    report.media = { ...info, duration };
    if (input.audioRequested !== false && !info.hasAudio) {
      issues.push("missing_audio");
      score -= 20;
    }
  } catch (e) {
    issues.push("video_unplayable");
    score -= 70;
    report.mediaError = error(e).message;
  }

  const consistency = await inspectTrackConsistency(input.trackId, input.projectId);
  report.consistency = consistency;
  if (videoAbsPath && !issues.includes("video_unplayable")) {
    const visualConsistency = await inspectVisualConsistency(videoAbsPath, consistency.visualReferences);
    report.visualConsistency = visualConsistency;
    const lowThreshold = (visualConsistency as any).method === "pixel" ? VISUAL_LOW_SIMILARITY_THRESHOLD_PIXEL : VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP;
    if (visualConsistency.status === "checked" && visualConsistency.bestSimilarity != null && visualConsistency.bestSimilarity < lowThreshold) {
      issues.push("visual_reference_low_similarity");
      score -= 10;
    }
    if (visualConsistency.status === "failed") {
      issues.push("visual_probe_failed");
      score -= 5;
    }
  }
  if (!consistency.storyboardCount) {
    issues.push("missing_storyboard_binding");
    score -= 30;
  }
  if (!consistency.boundAssetCount) {
    issues.push("missing_asset_binding");
    score -= 20;
  }
  if (consistency.missingAssetImageIds.length) {
    issues.push("missing_asset_selected_image");
    score -= Math.min(30, consistency.missingAssetImageIds.length * 8);
  }
  if (consistency.promptMissingAssetNames.length) {
    issues.push("prompt_missing_asset_reference");
    score -= Math.min(25, consistency.promptMissingAssetNames.length * 6);
  }
  if (consistency.promptForeignAssetNames.length) {
    issues.push("prompt_foreign_asset_reference");
    score -= Math.min(25, consistency.promptForeignAssetNames.length * 6);
  }
  if (consistency.promptReferenceCount > 9) {
    issues.push("prompt_reference_over_limit");
    score -= 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const status: VideoReviewStatus = issues.includes("video_unplayable") || score < 50 ? "failed" : issues.length ? "warning" : "passed";
  const retryable = status === "failed" && !issues.includes("missing_asset_binding") && !issues.includes("missing_asset_selected_image");
  const suggestedAction = suggestedActionFor(issues, retryable);
  const review: VideoReview = {
    projectId: input.projectId,
    scriptId: input.scriptId,
    trackId: input.trackId,
    videoId: input.videoId,
    score,
    status,
    issues,
    report,
    retryable,
    suggestedAction,
  };
  await saveVideoReview(review);
  return review;
}

export async function autoSelectBestVideoForTrack(trackId: number): Promise<number | null> {
  const track = await db("o_videoTrack").where("id", trackId).select("videoId", "selectVideoId").first();
  const existing = Number(track?.videoId ?? track?.selectVideoId);
  if (Number.isFinite(existing) && existing > 0) {
    const video = await db("o_video").where("id", existing).select("state").first();
    const review = await db("o_videoReview").where("videoId", existing).select("status").first().catch(() => null);
    if (/生成成功|已完成/.test(String(video?.state || "")) && review?.status !== "failed") return existing;
  }

  const videos = await db("o_video").where({ videoTrackId: trackId, state: "生成成功" }).select("id").orderBy("id", "desc");
  if (!videos.length) return null;
  for (const video of videos) {
    const exists = await db("o_videoReview").where("videoId", video.id).first().catch(() => null);
    if (!exists) await reviewVideoById({ videoId: Number(video.id) }).catch(() => null);
  }
  const reviews = await db("o_videoReview")
    .where("trackId", trackId)
    .whereIn("videoId", videos.map((item: any) => item.id))
    .whereNot("status", "failed")
    .orderBy("score", "desc")
    .orderBy("videoId", "desc")
    .limit(1);
  const selected = Number(reviews[0]?.videoId);
  if (!Number.isFinite(selected) || selected <= 0) return null;
  await db("o_videoTrack").where("id", trackId).update({ videoId: selected, selectVideoId: selected });
  return selected;
}

export async function loadVideoReview(videoId: number): Promise<VideoReview | null> {
  if (!(await hasReviewTable())) return null;
  const row = await db("o_videoReview").where("videoId", videoId).first();
  return row ? normalizeVideoReview(row) : null;
}

export function isVideoReviewAccepted(review: VideoReview | null | undefined): boolean {
  return Boolean(review?.report?.acceptedAt);
}

export async function acceptVideoReviewWarning(videoId: number): Promise<VideoReview> {
  const review = (await loadVideoReview(videoId)) ?? (await reviewVideoById({ videoId }));
  if (review.status === "failed") {
    throw new Error(`视频 ${videoId} QA 未通过，不能接受警告`);
  }
  if (review.status === "passed") return review;
  const accepted: VideoReview = {
    ...review,
    report: {
      ...review.report,
      acceptedAt: Date.now(),
      acceptedBy: "manual",
    },
  };
  await saveVideoReview(accepted);
  return accepted;
}

export async function assertVideoReviewAllowsCompose(videoId: number): Promise<VideoReview> {
  const review = (await loadVideoReview(videoId)) ?? (await reviewVideoById({ videoId }));
  if (review.status === "passed") return review;
  if (review.status === "warning" && isVideoReviewAccepted(review)) return review;

  const issueText = review.issues.length ? review.issues.join("、") : review.status;
  if (review.status === "warning") throw new Error(`视频 ${videoId} QA 需复核：${issueText}`);
  throw new Error(`视频 ${videoId} QA 未通过：${issueText}`);
}

export async function assertTrackVideosAllowCompose(input: { projectId: number; scriptId: number; trackIds: number[] }) {
  const uniqueTrackIds = [...new Set(input.trackIds.map(Number).filter((id) => Number.isFinite(id) && id > 0))];
  if (!uniqueTrackIds.length) throw new Error("没有可合成的分镜轨道");

  const tracks = await db("o_videoTrack")
    .whereIn("id", uniqueTrackIds)
    .where({ projectId: input.projectId, scriptId: input.scriptId })
    .select("id", "videoId");
  const trackMap = new Map(tracks.map((track: any) => [Number(track.id), track]));
  const missingTracks = uniqueTrackIds.filter((id) => !trackMap.has(id));
  if (missingTracks.length) throw new Error(`以下分镜轨道不属于当前项目或剧集：${missingTracks.join("、")}`);

  const noVideo = uniqueTrackIds.filter((id) => !trackMap.get(id)?.videoId);
  if (noVideo.length) throw new Error(`以下分镜轨道尚未选定视频：${noVideo.join("、")}`);

  const videoIds = tracks.map((track: any) => Number(track.videoId)).filter((id: number) => Number.isFinite(id));
  const videos = await db("o_video").whereIn("id", videoIds).where({ projectId: input.projectId, scriptId: input.scriptId }).select("id", "state", "filePath");
  const videoMap = new Map(videos.map((video: any) => [Number(video.id), video]));
  const invalidTracks = tracks
    .filter((track: any) => {
      const video = videoMap.get(Number(track.videoId));
      return !video?.filePath || video.state !== "生成成功";
    })
    .map((track: any) => Number(track.id));
  if (invalidTracks.length) throw new Error(`以下分镜轨道选定的视频无效或未生成成功：${invalidTracks.join("、")}`);

  const qaErrors: string[] = [];
  for (const track of tracks) {
    try {
      await assertVideoReviewAllowsCompose(Number(track.videoId));
    } catch (e) {
      qaErrors.push(`轨道 ${track.id}: ${error(e).message}`);
    }
  }
  if (qaErrors.length) throw new Error(`以下选定视频未通过合成前 QA：${qaErrors.join("；")}`);

  return tracks.map((track: any) => ({ trackId: Number(track.id), videoId: Number(track.videoId) }));
}

async function saveVideoReview(review: VideoReview) {
  if (!(await hasReviewTable())) return;
  const now = Date.now();
  await db("o_videoReview").where("videoId", review.videoId).delete();
  await db("o_videoReview").insert({
    projectId: review.projectId,
    scriptId: review.scriptId,
    trackId: review.trackId,
    videoId: review.videoId,
    score: review.score,
    status: review.status,
    issues: JSON.stringify(review.issues),
    report: JSON.stringify({ ...review.report, suggestedAction: review.suggestedAction }),
    retryable: review.retryable ? 1 : 0,
    createTime: now,
    updateTime: now,
  } as any);
}

function normalizeVideoReview(row: any): VideoReview {
  const issues = parseJsonValue<string[]>(row.issues, []);
  const report = parseJsonValue<Record<string, unknown>>(row.report, {});
  const status = ["passed", "warning", "failed"].includes(String(row.status)) ? String(row.status) as VideoReviewStatus : "failed";
  const suggestedAction = String(row.suggestedAction || report.suggestedAction || suggestedActionFor(issues, Boolean(row.retryable)));
  return {
    projectId: Number(row.projectId || 0),
    scriptId: row.scriptId ?? null,
    trackId: row.trackId ?? null,
    videoId: Number(row.videoId),
    score: Number(row.score ?? 0),
    status,
    issues: Array.isArray(issues) ? issues : [],
    report: { ...report, suggestedAction },
    retryable: Boolean(row.retryable),
    suggestedAction,
  };
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function inspectTrackConsistency(trackId: number, projectId: number) {
  const track = await db("o_videoTrack").where("id", trackId).select("prompt").first();
  const storyboards = await db("o_storyboard").where({ trackId, projectId }).select("id", "index", "filePath", "state").orderBy("index", "asc");
  const storyboardIds = storyboards.map((item: any) => item.id).filter((id: any) => typeof id === "number");
  const assetRows = storyboardIds.length
    ? await db("o_assets2Storyboard")
        .whereIn("o_assets2Storyboard.storyboardId", storyboardIds)
        .leftJoin("o_assets", "o_assets.id", "o_assets2Storyboard.assetId")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .orderBy("o_assets2Storyboard.rowid")
        .select(
          "o_assets.id as id",
          "o_assets.name as name",
          "o_assets.type as type",
          "o_assets.imageId as imageId",
          "o_assets.remark as remark",
          "o_image.filePath as filePath",
        )
    : [];
  const deduped = uniqueBy(assetRows, (item: any) => Number(item.id)).filter((item: any) => item.id != null);
  const imageAssets = deduped.filter((item: any) => item.type !== "audio");
  const assetCards = imageAssets
    .map((item: any) => ({
      id: Number(item.id),
      name: String(item.name || ""),
      type: String(item.type || ""),
      spec: assetCardPrompt(item.remark),
    }))
    .filter((item) => item.spec);
  const roleCharacterSpecs = assetCards.filter((item) => item.type === "role");
  const missingAssetImageIds = imageAssets.filter((item: any) => !item.imageId || !item.filePath).map((item: any) => Number(item.id));
  const promptRefs = parsePromptImageRefs(String(track?.prompt || ""));
  const promptNames = new Set(promptRefs.map((item) => item.name).filter(Boolean));
  const assetNames = new Set(imageAssets.map((item: any) => String(item.name || "").trim()).filter(Boolean));
  const promptMissingAssetNames = imageAssets
    .map((item: any) => String(item.name || "").trim())
    .filter((name: string) => name && promptRefs.length > 0 && !promptNames.has(name));
  const promptForeignAssetNames = [...promptNames].filter((name) => name && !assetNames.has(name));
  const visualReferences: VisualReference[] = [
    ...imageAssets
      .filter((item: any) => item.filePath)
      .map((item: any) => ({
        id: Number(item.id),
        name: String(item.name || `资产 ${item.id}`),
        source: "asset" as const,
        type: item.type ?? null,
        filePath: String(item.filePath),
    })),
    ...storyboards
      .filter((item: any) => item.filePath && item.state === "已完成")
      .map((item: any) => ({
        id: Number(item.id),
        name: `镜头 ${item.index ?? item.id}`,
        source: "storyboard" as const,
        type: "storyboard",
        filePath: String(item.filePath),
      })),
  ];
  return {
    storyboardCount: storyboards.length,
    boundAssetCount: deduped.length,
    imageAssetCount: imageAssets.length,
    missingAssetImageIds,
    promptReferenceCount: promptRefs.length,
    promptMissingAssetNames,
    promptForeignAssetNames,
    assetCardCount: assetCards.length,
    assetCards,
    characterSpecCount: roleCharacterSpecs.length,
    characterSpecs: roleCharacterSpecs,
    visualReferences,
  };
}

async function inspectVisualConsistency(videoAbsPath: string, references: VisualReference[]) {
  const refs = uniqueBy(references.filter((item) => item.filePath), (item) => `${item.source}:${item.id}`).slice(0, 12);
  if (!refs.length) return { status: "skipped" as const, reason: "no_visual_references", references: [] };
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "toonflow-video-review-"));
  const framePath = path.join(tmpDir, "frame.jpg");
  try {
    await extractVideoFrame(videoAbsPath, framePath);
    // 优先用本地 CLIP embedding（语义级、对构图鲁棒）；模型不可用则整批降级到 16×16 像素指纹，保持 method 一致避免量纲混用。
    let method: "clip" | "pixel" = "clip";
    const firstRefPath = await oss.getAbsolutePath(refs[0].filePath);
    try {
      await compareImageFilesByEmbedding(framePath, firstRefPath);
    } catch {
      method = "pixel";
    }
    const frameFingerprint = method === "pixel" ? await createVisualFingerprint(framePath) : null;
    const checked = await Promise.all(refs.map(async (ref) => {
      try {
        const refAbsPath = await oss.getAbsolutePath(ref.filePath);
        const similarity = method === "clip"
          ? await compareImageFilesByEmbedding(framePath, refAbsPath)
          : compareVisualFingerprints(frameFingerprint!, await createVisualFingerprint(refAbsPath));
        return { ...ref, similarity: Number(similarity.toFixed(3)) };
      } catch (e) {
        return { ...ref, error: error(e).message };
      }
    }));
    const valid = (checked as any[])
      .filter((item: any) => typeof item.similarity === "number")
      .sort((a: any, b: any) => b.similarity - a.similarity);
    return {
      status: "checked" as const,
      method,
      frameTime: 0.5,
      checkedCount: valid.length,
      bestSimilarity: valid[0]?.similarity ?? null,
      bestReference: valid[0] ?? null,
      references: checked,
    };
  } catch (e) {
    return { status: "failed" as const, error: error(e).message, references: refs };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

function parsePromptImageRefs(prompt: string) {
  return [...prompt.matchAll(/@图片(\d+)\s*中的\[[^\]]*\]\s*定义为\s*<[^>]*>（([^）]*)）/g)].map((match) => ({
    index: Number(match[1]),
    name: String(match[2] || "").trim(),
  }));
}

function uniqueBy<T>(items: T[], key: (item: T) => unknown): T[] {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function suggestedActionFor(issues: string[], retryable: boolean) {
  if (issues.includes("missing_asset_selected_image")) return "generate_or_select_asset_images";
  if (issues.includes("prompt_missing_asset_reference") || issues.includes("prompt_foreign_asset_reference")) return "regenerate_video_prompt";
  if (issues.includes("visual_reference_low_similarity")) return "review_or_regenerate_video";
  if (issues.includes("missing_audio")) return "regenerate_with_audio_or_add_tts";
  if (retryable) return "retry_same_parameters";
  return issues.length ? "manual_review" : "select_for_compose";
}
